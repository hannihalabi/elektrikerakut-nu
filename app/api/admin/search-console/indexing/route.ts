import { sql } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { seoUrlIndexStatuses } from "../../../../../db/schema";
import { getPartnerAdmin } from "../../../../partner-admin-auth";
import { getAccessToken, serviceAccount } from "../auth";

export const runtime = "nodejs";
export const maxDuration = 60;

type IndexingState = "INDEXED" | "CRAWLED_NOT_INDEXED" | "DISCOVERED_NOT_INDEXED" | "EXCLUDED" | "ERROR";

type InspectionResult = {
  path: string;
  state: IndexingState;
  coverageState: string | null;
  verdict: string | null;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
};

function stateFor(verdict: string | null, coverageState: string | null): IndexingState {
  if (verdict === "PASS") return "INDEXED";
  const coverage = coverageState?.toLowerCase() ?? "";
  const notIndexed = coverage.includes("not indexed") || coverage.includes("inte indexerad");
  if (notIndexed && (coverage.includes("crawled") || coverage.includes("crawlad") || coverage.includes("genomsökt"))) return "CRAWLED_NOT_INDEXED";
  if (notIndexed && (coverage.includes("discovered") || coverage.includes("upptäckt"))) return "DISCOVERED_NOT_INDEXED";
  return "EXCLUDED";
}

async function inspect(path: string, origin: string, siteUrl: string, accessToken: string): Promise<InspectionResult> {
  try {
    const response = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionUrl: `${origin}${path}`, siteUrl, languageCode: "sv" }),
      cache: "no-store",
    });
    const payload = await response.json() as {
      inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string; googleCanonical?: string } };
    };
    if (!response.ok) throw new Error("Google kunde inte kontrollera URL:en.");
    const result = payload.inspectionResult?.indexStatusResult;
    const verdict = result?.verdict ?? null;
    const coverageState = result?.coverageState ?? null;
    return {
      path,
      state: stateFor(verdict, coverageState),
      coverageState,
      verdict,
      lastCrawlTime: result?.lastCrawlTime ?? null,
      googleCanonical: result?.googleCanonical ?? null,
    };
  } catch {
    return { path, state: "ERROR", coverageState: null, verdict: null, lastCrawlTime: null, googleCanonical: null };
  }
}

async function inBatches<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const result = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      result[index] = await worker(items[index]);
    }
  }));
  return result;
}

function publicResult(row: typeof seoUrlIndexStatuses.$inferSelect): InspectionResult {
  return {
    path: row.path,
    state: row.state as IndexingState,
    coverageState: row.coverageState,
    verdict: row.verdict,
    lastCrawlTime: row.lastCrawlTime?.toISOString() ?? null,
    googleCanonical: row.googleCanonical,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function GET() {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  try {
    const rows = await getDb().select().from(seoUrlIndexStatuses);
    const inspectedAt = rows.reduce<Date | null>((latest, row) => !latest || row.inspectedAt > latest ? row.inspectedAt : latest, null);
    return Response.json({ results: rows.map(publicResult), inspectedAt: inspectedAt?.toISOString() ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[search-console] Kunde inte läsa sparad indexstatus", {
      error: errorMessage(error),
    });
    return Response.json({ results: [], inspectedAt: null }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const account = serviceAccount();
  const siteUrl = process.env.GSC_SITE_URL?.trim();
  if (!account || !siteUrl) return Response.json({ error: "Search Console är inte färdigkonfigurerad i Vercel." }, { status: 503 });

  try {
    const body = await request.json() as { paths?: unknown };
    const paths = Array.isArray(body.paths) ? [...new Set(body.paths.filter((path): path is string => typeof path === "string" && path.startsWith("/") && path.length <= 500))] : [];
    if (!paths.length || paths.length > 25) return Response.json({ error: "Välj mellan 1 och 25 publika URL:er per kontroll." }, { status: 400 });

    const accessToken = await getAccessToken(account);
    const results = await inBatches(paths, 4, (path) => inspect(path, "https://elektrikerakut.nu", siteUrl, accessToken));
    const inspectedAt = new Date();
    try {
      await getDb().insert(seoUrlIndexStatuses).values(results.map((result) => ({
        path: result.path,
        state: result.state,
        coverageState: result.coverageState,
        verdict: result.verdict,
        lastCrawlTime: result.lastCrawlTime ? new Date(result.lastCrawlTime) : null,
        googleCanonical: result.googleCanonical,
        inspectedAt,
        updatedAt: inspectedAt,
      }))).onConflictDoUpdate({
        target: seoUrlIndexStatuses.path,
        set: {
          state: sql`excluded.state`,
          coverageState: sql`excluded.coverage_state`,
          verdict: sql`excluded.verdict`,
          lastCrawlTime: sql`excluded.last_crawl_time`,
          googleCanonical: sql`excluded.google_canonical`,
          inspectedAt: sql`excluded.inspected_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
    } catch (error) {
      // En färsk kontroll ska alltid visas även om den långsiktiga sparningen tillfälligt saknas.
      console.error("[search-console] Kunde inte spara indexstatus", {
        error: errorMessage(error),
        resultCount: results.length,
      });
    }
    return Response.json({ results, inspectedAt: inspectedAt.toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[search-console] Kontroll mot Google misslyckades", {
      error: errorMessage(error),
    });
    return Response.json({ error: "Kunde inte ansluta till Search Console. Kontrollera behörigheten för servicekontot och försök igen." }, { status: 502 });
  }
}
