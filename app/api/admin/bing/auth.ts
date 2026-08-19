const productionOrigin = "https://elektrikerakut.nu";

export type BingSite = {
  IsVerified?: boolean | null;
  Url?: string | null;
};

export function bingConfiguration() {
  const apiKey = process.env.BING_WEBMASTER_API_KEY?.trim();
  const siteUrl = process.env.BING_SITE_URL?.trim() || `${productionOrigin}/`;
  return apiKey ? { apiKey, siteUrl } : null;
}

function originFor(value: string) {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

export async function bingGet<T>(method: string, params: Record<string, string>, apiKey: string): Promise<T | null> {
  const url = new URL(`https://ssl.bing.com/webmaster/api.svc/json/${method}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("apikey", apiKey);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  const body = await response.text();
  if (!response.ok) throw new Error(`Bing Webmaster API svarade med HTTP ${response.status}.`);
  try {
    const payload = JSON.parse(body) as { d?: T | null };
    return payload.d ?? null;
  } catch {
    throw new Error("Bing Webmaster API returnerade ett ogiltigt svar.");
  }
}

export async function resolveBingSiteUrl(configuredSiteUrl: string, apiKey: string) {
  // Bing stores the exact protocol/host variant that was verified. Resolving it
  // from the account prevents a harmless slash, http/https or www mismatch from
  // making every URL inspection fail.
  const sites = await bingGet<BingSite[]>("GetUserSites", {}, apiKey);
  const configuredOrigin = originFor(configuredSiteUrl);
  const verifiedSites = (sites ?? []).filter((site) => site.IsVerified && site.Url);
  const matchingSite = verifiedSites.find((site) => originFor(site.Url!) === configuredOrigin);

  if (!matchingSite?.Url) {
    throw new Error("Bing API-nyckeln fungerar, men kontot saknar en verifierad webbplats som matchar BING_SITE_URL.");
  }

  return matchingSite.Url;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
