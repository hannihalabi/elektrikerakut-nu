import { getPartnerAdmin } from "../../../../partner-admin-auth";
import { getAccessToken, serviceAccount } from "../auth";

export const runtime = "nodejs";
export const maxDuration = 30;

type PageMetric = {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function daysParam(request: Request) {
  const url = new URL(request.url);
  const value = Number(url.searchParams.get("days") ?? 90);
  if (!Number.isFinite(value)) return 90;
  return Math.min(Math.max(Math.trunc(value), 7), 180);
}

export async function GET(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const account = serviceAccount();
  const siteUrl = process.env.GSC_SITE_URL?.trim();
  if (!account || !siteUrl) return Response.json({ error: "Search Console är inte färdigkonfigurerad i Vercel." }, { status: 503 });

  try {
    const days = daysParam(request);
    const accessToken = await getAccessToken(account);
    const endDate = new Date();
    endDate.setUTCDate(endDate.getUTCDate() - 2);
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

    const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: isoDate(startDate),
        endDate: isoDate(endDate),
        dimensions: ["page"],
        type: "web",
        rowLimit: 25_000,
        dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/guider/" }] }],
      }),
      cache: "no-store",
    });

    const payload = await response.json() as { rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[]; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "Search Console svarade med ett fel.");

    const pages: PageMetric[] = (payload.rows ?? []).map((row) => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
    const totals = pages.reduce((sum, page) => ({
      clicks: sum.clicks + page.clicks,
      impressions: sum.impressions + page.impressions,
    }), { clicks: 0, impressions: 0 });

    return Response.json({
      startDate: isoDate(startDate),
      endDate: isoDate(endDate),
      totals,
      pages,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[search-console] Kunde inte hämta sidstatistik", { error: errorMessage(error) });
    return Response.json({ error: "Kunde inte hämta sidstatistik från Search Console." }, { status: 502 });
  }
}
