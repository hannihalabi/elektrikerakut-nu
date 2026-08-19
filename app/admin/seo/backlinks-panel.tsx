"use client";

import { AlertTriangle, ExternalLink, Link2, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

type BacklinkDomain = { domain: string; count: number };
type SampleLink = { url: string; anchorText: string | null };
type BacklinksData = {
  totalLinks: number;
  linkedPages: number;
  topDomains: BacklinkDomain[];
  sampleLinks: SampleLink[];
  possiblyIncomplete: boolean;
  checkedAt: string;
};

function formatCheckedAt(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export function BacklinksPanel() {
  const [data, setData] = useState<BacklinksData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchBacklinks() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/bing/backlinks", { cache: "no-store" });
      const payload = await response.json() as BacklinksData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Kunde inte hämta backlinks.");
      setData(payload);
    } catch (fetchError) {
      setData(null);
      setError(fetchError instanceof Error ? fetchError.message : "Kunde inte hämta backlinks.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="seo-indexing-panel backlinks" aria-labelledby="seo-backlinks-title">
      <div>
        <p><Link2 size={14} /> Microsoft Bing</p>
        <h2 id="seo-backlinks-title">Externa länkar (backlinks)</h2>
        <span>{data ? `Senast kontrollerad ${formatCheckedAt(data.checkedAt)}` : "Domäner och sidor som länkar in till elektrikerakut.nu, via Bings egna index."}</span>
      </div>
      <div className="seo-indexing-summary">
        {data && !data.possiblyIncomplete && (
          <>
            <span className="indexed"><Link2 size={14} /> {data.totalLinks} länkar</span>
            <span className="attention">{data.linkedPages} länkade sidor</span>
          </>
        )}
        <button type="button" onClick={fetchBacklinks} disabled={isLoading}>
          <RefreshCw size={15} className={isLoading ? "spinning" : ""} />
          {isLoading ? "Hämtar…" : data ? "Uppdatera" : "Hämta backlinks"}
        </button>
      </div>

      {error && <p className="seo-indexing-error">{error}</p>}

      {data?.possiblyIncomplete && (
        <p className="seo-backlinks-notice">
          <AlertTriangle size={14} /> Bing returnerade inga länkar för kontot. Detta kan betyda att sajten
          verkligen saknar externa länkar ännu, men Bings länk-API har haft kända problem med att returnera
          tomma resultat även för sajter med kända backlinks. Betrakta 0 som osäkert, inte bekräftat.
        </p>
      )}

      {data && !data.possiblyIncomplete && data.topDomains.length > 0 && (
        <div className="seo-backlinks-domains">
          {data.topDomains.map((item) => (
            <span key={item.domain} className="seo-backlinks-domain-pill">{item.domain} <small>{item.count}</small></span>
          ))}
        </div>
      )}

      {data && !data.possiblyIncomplete && data.sampleLinks.length > 0 && (
        <ol className="seo-backlinks-list">
          {data.sampleLinks.map((link) => (
            <li key={link.url} className="seo-backlinks-row">
              <a href={link.url} target="_blank" rel="noreferrer" className="seo-backlinks-url">{link.url} <ExternalLink size={12} /></a>
              {link.anchorText && <span className="seo-backlinks-anchor">"{link.anchorText}"</span>}
            </li>
          ))}
        </ol>
      )}

      {data && !data.possiblyIncomplete && data.totalLinks === 0 && (
        <div className="admin-empty seo-backlinks-empty">Inga externa länkar hittades av Bing ännu.</div>
      )}
    </section>
  );
}
