import { sql } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { bingUrlStatuses } from "../../../../../db/schema";
import { getPartnerAdmin } from "../../../../partner-admin-auth";
import { bingConfiguration, bingGet, errorMessage, resolveBingSiteUrl } from "../auth";

export const runtime = "nodejs";
export const maxDuration = 60;

type BingIndexingState = "INDEXED" | "CRAWLED_NOT_INDEXED" | "DISCOVERED_NOT_INDEXED" | "NOT_DISCOVERED" | "ERROR";

type BingUrlInfo = {
  DiscoveryDate?: string | null;
  DocumentSize?: number | null;
  HttpStatus?: number | null;
  IsPage?: boolean | null;
  LastCrawledDate?: string | null;
  Url?: string | null;
};

type BingCrawlIssue = {
  HttpCode?: number | null;
  Issues?: number | null;
  Url?: string | null;
};

type BingInspectionResult = {
  path: string;
  state: BingIndexingState;
  indexed: boolean;
  discoveryDate: string | null;
  lastCrawledDate: string | null;
  httpStatus: number | null;
  bingIssues: string[];
  seoWarnings: string[];
  robotsBlocked: boolean;
  canonicalUrl: string | null;
  canonicalIssue: boolean;
  redirectUrl: string | null;
};

type RobotsRule = { allow: boolean; path: string };

const productionOrigin = "https://elektrikerakut.nu";

function apiDate(value?: string | null) {
  if (!value) return null;
  const microsoftDate = value.match(/^\/Date\((-?\d+)(?:[+-]\d+)?\)\/$/);
  const date = microsoftDate ? new Date(Number(microsoftDate[1])) : new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function normalizeUrl(value: string | null | undefined, base = productionOrigin) {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    url.hash = "";
    const normalized = url.toString();
    return normalized.endsWith("/") && url.pathname !== "/" ? normalized.slice(0, -1) : normalized.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function urlKey(value: string | null | undefined) {
  const normalized = normalizeUrl(value);
  return normalized?.toLowerCase() ?? "";
}

function attribute(tag: string, name: string) {
  const expression = new RegExp(`\\b${name}\\s*=\\s*(?:["']([^"']*)["']|([^\\s>]+))`, "i");
  const match = tag.match(expression);
  return match?.[1] ?? match?.[2] ?? null;
}

function parseRobots(text: string): RobotsRule[] {
  const groups = text.split(/(?=^\s*user-agent\s*:)/gim);
  const wildcardGroups = groups.filter((group) => /^\s*user-agent\s*:\s*\*/im.test(group));
  return wildcardGroups.flatMap((group) => group.split(/\r?\n/).flatMap((line) => {
    const match = line.replace(/#.*$/, "").trim().match(/^(allow|disallow)\s*:\s*(.*)$/i);
    if (!match || !match[2].trim()) return [];
    return [{ allow: match[1].toLowerCase() === "allow", path: match[2].trim() }];
  }));
}

function matchesRobotsRule(path: string, rule: string) {
  const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*").replace(/\\\$$/, "$");
  try {
    return new RegExp(`^${escaped}`).test(path);
  } catch {
    return path.startsWith(rule);
  }
}

function isRobotsBlocked(path: string, rules: RobotsRule[]) {
  const matching = rules.filter((rule) => matchesRobotsRule(path, rule.path)).sort((left, right) => right.path.length - left.path.length);
  return matching[0] ? !matching[0].allow : false;
}

function crawlIssueLabels(mask: number | null | undefined) {
  if (!mask) return [];
  const flags: Array<[number, string]> = [
    [1, "301-redirect enligt Bing"],
    [2, "302-redirect enligt Bing"],
    [4, "4xx-fel enligt Bing"],
    [8, "5xx-fel enligt Bing"],
    [16, "Blockerad av robots.txt enligt Bing"],
    [32, "Bing har flaggat skadlig kod"],
    [64, "Viktig URL blockerad av robots.txt"],
    [128, "DNS-fel enligt Bing"],
    [256, "Timeout enligt Bing"],
  ];
  return flags.filter(([flag]) => (mask & flag) === flag).map(([, label]) => label);
}

async function liveAudit(path: string, robotsRules: RobotsRule[]) {
  const target = `${productionOrigin}${path}`;
  const robotsBlocked = isRobotsBlocked(path, robotsRules);
  const seoWarnings: string[] = [];
  let httpStatus: number | null = null;
  let redirectUrl: string | null = null;
  let canonicalUrl: string | null = null;
  let canonicalIssue = false;

  if (robotsBlocked) seoWarnings.push("Blockerad av robots.txt");

  try {
    const response = await fetch(target, {
      cache: "no-store",
      redirect: "manual",
      headers: { "User-Agent": "Elektrikerakut-SEO-Dashboard/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    httpStatus = response.status;
    if (response.status >= 300 && response.status < 400) {
      redirectUrl = normalizeUrl(response.headers.get("location"), target);
      seoWarnings.push(`Redirect ${response.status}`);
      return { httpStatus, redirectUrl, canonicalUrl, canonicalIssue, robotsBlocked, seoWarnings };
    }
    if (response.status >= 400) seoWarnings.push(`HTTP-fel ${response.status}`);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return { httpStatus, redirectUrl, canonicalUrl, canonicalIssue, robotsBlocked, seoWarnings };
    const html = await response.text();
    const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ").trim();
    const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
    const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
    const description = metaTags.find((tag) => attribute(tag, "name")?.toLowerCase() === "description");
    const robotDirectives = metaTags
      .filter((tag) => ["robots", "bingbot"].includes(attribute(tag, "name")?.toLowerCase() ?? ""))
      .map((tag) => attribute(tag, "content")?.toLowerCase() ?? "")
      .join(",");
    const canonicalTag = linkTags.find((tag) => (attribute(tag, "rel") ?? "").toLowerCase().split(/\s+/).includes("canonical"));
    canonicalUrl = normalizeUrl(canonicalTag ? attribute(canonicalTag, "href") : null, target);
    canonicalIssue = !canonicalUrl || canonicalUrl !== normalizeUrl(target);

    if (!title) seoWarnings.push("Saknar title");
    if (!h1) seoWarnings.push("Saknar H1");
    if (!description || !attribute(description, "content")?.trim()) seoWarnings.push("Saknar metabeskrivning");
    if (!canonicalUrl) seoWarnings.push("Saknar canonical");
    else if (canonicalIssue) seoWarnings.push("Canonical pekar på en annan URL");
    if (robotDirectives.includes("noindex")) seoWarnings.push("Meta robots innehåller noindex");
  } catch {
    seoWarnings.push("Kunde inte hämta den publika sidan");
  }

  return { httpStatus, redirectUrl, canonicalUrl, canonicalIssue, robotsBlocked, seoWarnings };
}

function stateFor(info: BingUrlInfo | null, audit: Awaited<ReturnType<typeof liveAudit>>): BingIndexingState {
  if ((audit.httpStatus ?? 0) >= 400) return "ERROR";
  if (info?.IsPage) return "INDEXED";
  if (apiDate(info?.LastCrawledDate)) return "CRAWLED_NOT_INDEXED";
  if (apiDate(info?.DiscoveryDate)) return "DISCOVERED_NOT_INDEXED";
  return "NOT_DISCOVERED";
}

async function inspect(path: string, siteUrl: string, apiKey: string, robotsRules: RobotsRule[], crawlIssues: Map<string, BingCrawlIssue>) {
  const target = `${productionOrigin}${path}`;
  const [info, audit] = await Promise.all([
    bingGet<BingUrlInfo>("GetUrlInfo", { siteUrl, url: target }, apiKey),
    liveAudit(path, robotsRules),
  ]);
  const issue = crawlIssues.get(urlKey(target));
  const bingIssues = crawlIssueLabels(issue?.Issues);
  const httpStatus = audit.httpStatus ?? issue?.HttpCode ?? info?.HttpStatus ?? null;
  return {
    path,
    state: stateFor(info, { ...audit, httpStatus }),
    indexed: Boolean(info?.IsPage),
    discoveryDate: apiDate(info?.DiscoveryDate),
    lastCrawledDate: apiDate(info?.LastCrawledDate),
    httpStatus,
    bingIssues,
    seoWarnings: [...new Set([...audit.seoWarnings, ...bingIssues])],
    robotsBlocked: audit.robotsBlocked || Boolean((issue?.Issues ?? 0) & (16 | 64)),
    canonicalUrl: audit.canonicalUrl,
    canonicalIssue: audit.canonicalIssue,
    redirectUrl: audit.redirectUrl,
  } satisfies BingInspectionResult;
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

function publicResult(row: typeof bingUrlStatuses.$inferSelect): BingInspectionResult {
  return {
    path: row.path,
    state: row.state as BingIndexingState,
    indexed: row.indexed,
    discoveryDate: row.discoveryDate?.toISOString() ?? null,
    lastCrawledDate: row.lastCrawledDate?.toISOString() ?? null,
    httpStatus: row.httpStatus,
    bingIssues: row.bingIssues,
    seoWarnings: row.seoWarnings,
    robotsBlocked: row.robotsBlocked,
    canonicalUrl: row.canonicalUrl,
    canonicalIssue: row.canonicalIssue,
    redirectUrl: row.redirectUrl,
  };
}

export async function GET() {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  try {
    const rows = await getDb().select().from(bingUrlStatuses);
    const inspectedAt = rows.reduce<Date | null>((latest, row) => !latest || row.inspectedAt > latest ? row.inspectedAt : latest, null);
    return Response.json({ results: rows.map(publicResult), inspectedAt: inspectedAt?.toISOString() ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[bing] Kunde inte läsa sparad URL-status", { error: errorMessage(error) });
    return Response.json({ results: [], inspectedAt: null }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const configuration = bingConfiguration();
  if (!configuration) return Response.json({ error: "Bing Webmaster API är inte konfigurerat. Lägg till BING_WEBMASTER_API_KEY i Vercel." }, { status: 503 });

  try {
    const body = await request.json() as { paths?: unknown };
    const paths = Array.isArray(body.paths) ? [...new Set(body.paths.filter((path): path is string => typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && path.length <= 500))] : [];
    if (!paths.length || paths.length > 25) return Response.json({ error: "Välj mellan 1 och 25 publika URL:er per kontroll." }, { status: 400 });

    const siteUrl = await resolveBingSiteUrl(configuration.siteUrl, configuration.apiKey);

    const [robotsResponse, crawlIssueRows] = await Promise.all([
      fetch(`${productionOrigin}/robots.txt`, { cache: "no-store", signal: AbortSignal.timeout(10_000) }),
      bingGet<BingCrawlIssue[]>("GetCrawlIssues", { siteUrl }, configuration.apiKey).catch(() => []),
    ]);
    const robotsRules = robotsResponse.ok ? parseRobots(await robotsResponse.text()) : [];
    const crawlIssues = new Map((crawlIssueRows ?? []).map((issue) => [urlKey(issue.Url), issue]));
    const results = await inBatches(paths, 4, (path) => inspect(path, siteUrl, configuration.apiKey, robotsRules, crawlIssues));
    const inspectedAt = new Date();

    try {
      await getDb().insert(bingUrlStatuses).values(results.map((result) => ({
        path: result.path,
        state: result.state,
        indexed: result.indexed,
        discoveryDate: result.discoveryDate ? new Date(result.discoveryDate) : null,
        lastCrawledDate: result.lastCrawledDate ? new Date(result.lastCrawledDate) : null,
        httpStatus: result.httpStatus,
        bingIssues: result.bingIssues,
        seoWarnings: result.seoWarnings,
        robotsBlocked: result.robotsBlocked,
        canonicalUrl: result.canonicalUrl,
        canonicalIssue: result.canonicalIssue,
        redirectUrl: result.redirectUrl,
        inspectedAt,
        updatedAt: inspectedAt,
      }))).onConflictDoUpdate({
        target: bingUrlStatuses.path,
        set: {
          state: sql`excluded.state`,
          indexed: sql`excluded.indexed`,
          discoveryDate: sql`excluded.discovery_date`,
          lastCrawledDate: sql`excluded.last_crawled_date`,
          httpStatus: sql`excluded.http_status`,
          bingIssues: sql`excluded.bing_issues`,
          seoWarnings: sql`excluded.seo_warnings`,
          robotsBlocked: sql`excluded.robots_blocked`,
          canonicalUrl: sql`excluded.canonical_url`,
          canonicalIssue: sql`excluded.canonical_issue`,
          redirectUrl: sql`excluded.redirect_url`,
          inspectedAt: sql`excluded.inspected_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
    } catch (error) {
      console.error("[bing] Kunde inte spara URL-status", { error: errorMessage(error), resultCount: results.length });
    }

    return Response.json({ results, inspectedAt: inspectedAt.toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[bing] Kontroll mot Bing misslyckades", { error: errorMessage(error) });
    const message = errorMessage(error);
    const isSiteMismatch = message.includes("saknar en verifierad webbplats");
    return Response.json({
      error: isSiteMismatch
        ? message
        : "Bing kunde inte verifiera API-nyckeln. Skapa en ny nyckel under Bing Webmaster Tools → Settings → API access och ersätt BING_WEBMASTER_API_KEY.",
    }, { status: 502 });
  }
}
