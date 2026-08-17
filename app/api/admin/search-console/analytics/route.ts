import { getPartnerAdmin } from "../../../../partner-admin-auth";
import { getAccessToken, serviceAccount } from "../auth";

export const runtime = "nodejs";
export const maxDuration = 30;

type DailyPoint = { date: string; clicks: number; impressions: number; ctr: number; position: number };

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function GET() {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const account = serviceAccount();
  const siteUrl = process.env.GSC_SITE_URL?.trim();
  if (!account || !siteUrl) return Response.json({ error: "Search Console är inte färdigkonfigurerad i Vercel." }, { status: 503 });

  try {
    const accessToken = await getAccessToken(account);
    const endDate = new Date();
    endDate.setUTCDate(endDate.getUTCDate() - 2); // GSC data typically lags 2-3 days behind.
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 89);

    const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: isoDate(startDate),
        endDate: isoDate(endDate),
        dimensions: ["date"],
        type: "web",
      }),
      cache: "no-store",
    });

    const payload = await response.json() as { rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[]; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "Search Console svarade med ett fel.");

    const points: DailyPoint[] = (payload.rows ?? []).map((row) => ({
      date: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })).sort((left, right) => left.date.localeCompare(right.date));

    return Response.json({ points, fetchedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[search-console] Kunde inte hämta sökstatistik", { error: errorMessage(error) });
    return Response.json({ error: "Kunde inte hämta sökstatistik från Search Console." }, { status: 502 });
  }
}
