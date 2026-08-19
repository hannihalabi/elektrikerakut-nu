import { getPartnerAdmin } from "../../../../partner-admin-auth";
import { bingConfiguration, bingGet, errorMessage, resolveBingSiteUrl } from "../auth";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_PAGES = 10;

type LinkCountsResponse = { Links?: { Url?: string | null; Count?: number | null }[] | null; TotalPages?: number | null };
type UrlLinksResponse = { Details?: { Url?: string | null; AnchorText?: string | null }[] | null; TotalPages?: number | null };

function hostFor(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function fetchAllPages<TItem, TResponse>(
  method: string,
  baseParams: Record<string, string>,
  apiKey: string,
  extractItems: (response: TResponse | null) => TItem[] | null | undefined,
  extractTotalPages: (response: TResponse | null) => number | null | undefined,
) {
  const items: TItem[] = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages && page < MAX_PAGES) {
    const response = await bingGet<TResponse>(method, { ...baseParams, page: String(page) }, apiKey);
    const pageItems = extractItems(response);
    if (pageItems) items.push(...pageItems);
    totalPages = extractTotalPages(response) ?? 1;
    page += 1;
  }
  return items;
}

export async function GET() {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const configuration = bingConfiguration();
  if (!configuration) return Response.json({ error: "Bing Webmaster API är inte konfigurerat. Lägg till BING_WEBMASTER_API_KEY i Vercel." }, { status: 503 });

  try {
    const siteUrl = await resolveBingSiteUrl(configuration.siteUrl, configuration.apiKey);

    const [linkCountRows, urlLinkRows] = await Promise.all([
      fetchAllPages<{ Url?: string | null; Count?: number | null }, LinkCountsResponse>(
        "GetLinkCounts", { siteUrl }, configuration.apiKey,
        (r) => r?.Links, (r) => r?.TotalPages,
      ),
      fetchAllPages<{ Url?: string | null; AnchorText?: string | null }, UrlLinksResponse>(
        "GetUrlLinks", { siteUrl, link: siteUrl }, configuration.apiKey,
        (r) => r?.Details, (r) => r?.TotalPages,
      ).catch(() => [] as { Url?: string | null; AnchorText?: string | null }[]),
    ]);

    const totalLinks = linkCountRows.reduce((sum, row) => sum + (row.Count ?? 0), 0);
    const linkedPages = linkCountRows.filter((row) => (row.Count ?? 0) > 0).length;

    const domainCounts = new Map<string, number>();
    for (const link of urlLinkRows) {
      const host = hostFor(link.Url);
      if (!host) continue;
      domainCounts.set(host, (domainCounts.get(host) ?? 0) + 1);
    }
    const topDomains = [...domainCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([domain, count]) => ({ domain, count }));

    const sampleLinks = urlLinkRows.slice(0, 50).map((link) => ({ url: link.Url ?? "", anchorText: link.AnchorText ?? null })).filter((link) => link.url);

    return Response.json({
      totalLinks,
      linkedPages,
      topDomains,
      sampleLinks,
      // Bing's link-related endpoints have a documented history of returning empty
      // results for verified sites with known backlinks. Surface this explicitly so
      // the UI never presents "0 länkar" as a confident, final answer.
      possiblyIncomplete: totalLinks === 0 && linkCountRows.length === 0,
      checkedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[bing-backlinks] Kunde inte hämta länkdata", { error: errorMessage(error) });
    const message = errorMessage(error);
    return Response.json({
      error: message.includes("saknar en verifierad webbplats")
        ? message
        : "Bing kunde inte hämta backlink-data just nu. Kontrollera BING_WEBMASTER_API_KEY och försök igen.",
    }, { status: 502 });
  }
}
