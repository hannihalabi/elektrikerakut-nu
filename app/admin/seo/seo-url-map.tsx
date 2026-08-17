"use client";

import { ArrowLeft, ArrowUpRight, BarChart3, BookOpen, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDot, Clock3, FileText, Globe2, History, Info, Link2, ListChecks, MapPin, Network, PhoneCall, RefreshCw, Search, Send, ShieldCheck, TriangleAlert, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SeoUrlOrbit } from "./seo-url-orbit";
import { SeoCoverageMap } from "./seo-coverage-map";
import type { ServiceArea } from "../../eljour/areas";

export type SeoUrlItem = {
  path: string;
  label: string;
  group: "Kärnsidor" | "Guider" | "Lokala sidor" | "Juridik" | "Tekniskt";
  municipality?: string;
  role: string;
  impact: "Hög" | "Medel" | "Låg" | "Indirekt";
  inSitemap: boolean;
  discoverability: string;
  description: string;
  priority: number | null;
  indexable?: boolean;
};

type Filter = "ALL" | "SITEMAP" | "LINKED" | "TECHNICAL";
type IndexingState = "INDEXED" | "CRAWLED_NOT_INDEXED" | "DISCOVERED_NOT_INDEXED" | "EXCLUDED" | "ERROR";
type IndexingFilter = "ALL" | "ATTENTION" | IndexingState;
type IndexingResult = { path: string; state: IndexingState; coverageState: string | null; verdict: string | null; lastCrawlTime: string | null; googleCanonical: string | null };
type BingIndexingState = "INDEXED" | "CRAWLED_NOT_INDEXED" | "DISCOVERED_NOT_INDEXED" | "NOT_DISCOVERED" | "ERROR";
type BingFilter = "ALL" | "INDEXED" | "CRAWLED_NOT_INDEXED" | "ROBOTS_BLOCKED" | "CANONICAL" | "REDIRECT" | "REVIEW";
type BingIndexingResult = {
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
type IndexNowHistoryItem = {
  id: number;
  path: string;
  action: "UPDATED" | "DELETED";
  responseStatus: number | null;
  responseMessage: string | null;
  success: boolean;
  submittedAt: string;
};

const indexingLabels: Record<IndexingState, string> = {
  INDEXED: "Indexerad",
  CRAWLED_NOT_INDEXED: "Crawlad, ej indexerad",
  DISCOVERED_NOT_INDEXED: "Upptäckt, ej indexerad",
  EXCLUDED: "Exkluderad",
  ERROR: "Kunde ej kontrolleras",
};

const bingIndexingLabels: Record<BingIndexingState, string> = {
  INDEXED: "Indexerad",
  CRAWLED_NOT_INDEXED: "Crawlad, ej indexerad",
  DISCOVERED_NOT_INDEXED: "Upptäckt, ej indexerad",
  NOT_DISCOVERED: "Inte upptäckt",
  ERROR: "Tekniskt fel",
};

function indexingClass(state?: IndexingState) {
  return state ? `seo-indexing-state ${state.toLowerCase().replaceAll("_", "-")}` : "seo-indexing-state unknown";
}

function bingIndexingClass(state?: BingIndexingState) {
  return state ? `seo-bing-state ${state.toLowerCase().replaceAll("_", "-")}` : "seo-bing-state unknown";
}

function bingNeedsReview(result?: BingIndexingResult) {
  return Boolean(result && (
    result.state !== "INDEXED"
    || result.robotsBlocked
    || result.canonicalIssue
    || result.redirectUrl
    || result.seoWarnings.length
    || (result.httpStatus !== null && result.httpStatus >= 400)
  ));
}

function formatCrawlTime(value: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "–" : new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function impactClass(impact: SeoUrlItem["impact"]) {
  return impact.toLowerCase();
}

function UrlRow({ item, origin, selected, onSelect, indexing, bingIndexing }: { item: SeoUrlItem; origin: string; selected: boolean; onSelect: () => void; indexing?: IndexingResult; bingIndexing?: BingIndexingResult }) {
  return (
    <div className={`seo-url-row${selected ? " selected" : ""}`}>
      <button type="button" className="seo-url-select" onClick={onSelect} aria-pressed={selected}>
        <span className="seo-url-dot" aria-hidden="true" />
        <span className="seo-url-copy"><strong>{item.label}</strong><code>{item.path}</code></span>
        {indexing || bingIndexing ? <span className="seo-url-engine-statuses">{indexing && <span className={indexingClass(indexing.state)}>G: {indexingLabels[indexing.state]}</span>}{bingIndexing && <span className={bingIndexingClass(bingIndexing.state)}>B: {bingIndexingLabels[bingIndexing.state]}</span>}</span> : <span className={`seo-impact ${impactClass(item.impact)}`}>{item.impact}</span>}
      </button>
      <a className="seo-open-url" href={`${origin}${item.path}`} target="_blank" rel="noreferrer" aria-label={`Öppna ${item.label}`}><ArrowUpRight size={14} /></a>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof BarChart3; label: string; value: number; tone?: string }) {
  return <article className="seo-stat-card"><span className={tone ?? ""}><Icon size={19} /></span><small>{label}</small><strong>{value}</strong></article>;
}

function SeoIndexingChart({ breakdown, notChecked, total, inspectedAt, activeFilter, onSelectFilter }: {
  breakdown: { key: IndexingFilter; label: string; count: number; className: string }[];
  notChecked: number;
  total: number;
  inspectedAt: string | null;
  activeFilter: IndexingFilter;
  onSelectFilter: (filter: IndexingFilter) => void;
}) {
  if (!inspectedAt) return null;
  const scale = Math.max(total, 1);
  return (
    <div className="seo-indexing-chart" role="group" aria-label="Fördelning av Google-indexeringsstatus">
      <div className="seo-indexing-chart-head">
        <h3>Indexeringsstatus, fördelning</h3>
        <span>{total} kontrollerade URL:er · uppdateras vid varje statuskontroll</span>
      </div>
      <div className="seo-indexing-chart-bars">
        {breakdown.map((row) => (
          <button
            type="button"
            key={row.key}
            className={`seo-indexing-chart-row ${row.className}${activeFilter === row.key ? " active" : ""}`}
            onClick={() => onSelectFilter(activeFilter === row.key ? "ALL" : row.key)}
            aria-pressed={activeFilter === row.key}
          >
            <span className="seo-indexing-chart-label">{row.label}</span>
            <span className="seo-indexing-chart-track"><span className="seo-indexing-chart-fill" style={{ width: `${(row.count / scale) * 100}%` }} /></span>
            <span className="seo-indexing-chart-value">{row.count}</span>
          </button>
        ))}
        {notChecked > 0 && (
          <div className="seo-indexing-chart-row unknown" aria-disabled="true">
            <span className="seo-indexing-chart-label">Ej kontrollerad</span>
            <span className="seo-indexing-chart-track"><span className="seo-indexing-chart-fill" style={{ width: `${(notChecked / scale) * 100}%` }} /></span>
            <span className="seo-indexing-chart-value">{notChecked}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SeoUrlMap({ items, areas, origin }: { items: SeoUrlItem[]; areas: ServiceArea[]; origin: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedPath, setSelectedPath] = useState("/");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [indexing, setIndexing] = useState<Record<string, IndexingResult>>({});
  const [inspectedAt, setInspectedAt] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [inspectionProgress, setInspectionProgress] = useState<{ done: number; total: number } | null>(null);
  const [indexingFilter, setIndexingFilter] = useState<IndexingFilter>("ALL");
  const [bingIndexing, setBingIndexing] = useState<Record<string, BingIndexingResult>>({});
  const [bingInspectedAt, setBingInspectedAt] = useState<string | null>(null);
  const [isInspectingBing, setIsInspectingBing] = useState(false);
  const [bingInspectionError, setBingInspectionError] = useState<string | null>(null);
  const [bingInspectionProgress, setBingInspectionProgress] = useState<{ done: number; total: number } | null>(null);
  const [bingFilter, setBingFilter] = useState<BingFilter>("ALL");
  const [indexNowHistory, setIndexNowHistory] = useState<IndexNowHistoryItem[]>([]);
  const [indexNowError, setIndexNowError] = useState<string | null>(null);
  const [isSubmittingIndexNow, setIsSubmittingIndexNow] = useState(false);
  const urlListRef = useRef<HTMLElement>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = filter === "ALL"
        || (filter === "SITEMAP" && item.inSitemap)
        || (filter === "LINKED" && !item.inSitemap && item.group !== "Tekniskt")
        || (filter === "TECHNICAL" && item.group === "Tekniskt");
      const indexStatus = indexing[item.path]?.state;
      const matchesIndexing = indexingFilter === "ALL"
        || (indexingFilter === "ATTENTION" && (indexStatus === "CRAWLED_NOT_INDEXED" || indexStatus === "DISCOVERED_NOT_INDEXED" || indexStatus === "EXCLUDED"))
        || indexStatus === indexingFilter;
      const bingStatus = bingIndexing[item.path];
      const matchesBing = bingFilter === "ALL"
        || (bingFilter === "INDEXED" && bingStatus?.state === "INDEXED")
        || (bingFilter === "CRAWLED_NOT_INDEXED" && bingStatus?.state === "CRAWLED_NOT_INDEXED")
        || (bingFilter === "ROBOTS_BLOCKED" && bingStatus?.robotsBlocked)
        || (bingFilter === "CANONICAL" && bingStatus?.canonicalIssue)
        || (bingFilter === "REDIRECT" && Boolean(bingStatus?.redirectUrl))
        || (bingFilter === "REVIEW" && bingNeedsReview(bingStatus));
      const haystack = `${item.label} ${item.path} ${item.municipality ?? ""} ${item.role}`.toLowerCase();
      return matchesFilter && matchesIndexing && matchesBing && haystack.includes(normalizedQuery);
    });
  }, [bingFilter, bingIndexing, filter, indexing, indexingFilter, items, query]);

  const selected = filteredItems.find((item) => item.path === selectedPath) ?? filteredItems[0];
  const coreItems = filteredItems.filter((item) => item.group === "Kärnsidor");
  const guideItems = filteredItems.filter((item) => item.group === "Guider");
  const localItems = filteredItems.filter((item) => item.group === "Lokala sidor");
  const legalItems = filteredItems.filter((item) => item.group === "Juridik");
  const technicalItems = filteredItems.filter((item) => item.group === "Tekniskt");
  const localGroups = [...new Set(localItems.map((item) => item.municipality).filter(Boolean))] as string[];
  const sitemapCount = items.filter((item) => item.inSitemap).length;
  const htmlCount = items.filter((item) => item.group !== "Tekniskt").length;
  const localCount = items.filter((item) => item.group === "Lokala sidor").length;
  const guideCount = items.filter((item) => item.group === "Guider").length;
  const linkedOutsideSitemap = items.filter((item) => !item.inSitemap && item.group !== "Tekniskt").length;
  const indexableItems = items.filter((item) => item.group !== "Tekniskt" && item.indexable !== false);
  const indexedCount = Object.values(indexing).filter((result) => result.state === "INDEXED").length;
  const attentionCount = Object.values(indexing).filter((result) => result.state === "CRAWLED_NOT_INDEXED" || result.state === "DISCOVERED_NOT_INDEXED" || result.state === "EXCLUDED").length;
  const crawledNotIndexed = Object.values(indexing).filter((result) => result.state === "CRAWLED_NOT_INDEXED");
  const discoveredNotIndexed = Object.values(indexing).filter((result) => result.state === "DISCOVERED_NOT_INDEXED");
  const excluded = Object.values(indexing).filter((result) => result.state === "EXCLUDED");
  const erroredCount = Object.values(indexing).filter((result) => result.state === "ERROR").length;
  const notCheckedCount = Math.max(indexableItems.length - Object.keys(indexing).length, 0);
  const indexingBreakdown: { key: IndexingFilter; label: string; count: number; className: string }[] = [
    { key: "INDEXED", label: "Indexerad", count: indexedCount, className: "indexed" },
    { key: "CRAWLED_NOT_INDEXED", label: "Crawlad, ej indexerad", count: crawledNotIndexed.length, className: "crawled-not-indexed" },
    { key: "DISCOVERED_NOT_INDEXED", label: "Upptäckt, ej indexerad", count: discoveredNotIndexed.length, className: "discovered-not-indexed" },
    { key: "EXCLUDED", label: "Exkluderad eller fel", count: excluded.length + erroredCount, className: "excluded" },
  ];
  const bingIndexedCount = Object.values(bingIndexing).filter((result) => result.state === "INDEXED").length;
  const bingAttentionCount = Object.values(bingIndexing).filter(bingNeedsReview).length;
  const bingCrawledNotIndexedCount = Object.values(bingIndexing).filter((result) => result.state === "CRAWLED_NOT_INDEXED").length;
  const bingTechnicalIssueCount = Object.values(bingIndexing).filter((result) => result.robotsBlocked || result.canonicalIssue || Boolean(result.redirectUrl) || (result.httpStatus !== null && result.httpStatus >= 400)).length;
  const bingWarningCount = Object.values(bingIndexing).filter((result) => result.seoWarnings.length > 0).length;
  const priorityItems = items.filter((item) => {
    const state = indexing[item.path]?.state;
    return state === "CRAWLED_NOT_INDEXED" || state === "DISCOVERED_NOT_INDEXED" || state === "EXCLUDED";
  }).sort((left, right) => {
    const groupWeight = (item: SeoUrlItem) => item.group === "Kärnsidor" ? 0 : item.group === "Lokala sidor" ? 1 : item.group === "Guider" ? 2 : 3;
    return groupWeight(left) - groupWeight(right);
  }).slice(0, 6);
  const bingPriorityItems = items.filter((item) => bingNeedsReview(bingIndexing[item.path])).sort((left, right) => {
    const groupWeight = (item: SeoUrlItem) => item.group === "Kärnsidor" ? 0 : item.group === "Lokala sidor" ? 1 : item.group === "Guider" ? 2 : 3;
    const weightDifference = groupWeight(left) - groupWeight(right);
    return weightDifference || left.label.localeCompare(right.label, "sv");
  }).slice(0, 9);

  const recommendationGroups = [
    {
      state: "CRAWLED_NOT_INDEXED" as const,
      count: crawledNotIndexed.length,
      title: "Crawlad men ej indexerad",
      summary: "Google har läst sidan men bedömer den inte som ett tillräckligt starkt, eget resultat just nu.",
      actions: ["Gör sidans lokala information, exempel och frågesvar tydligt mer unik än närliggande sidor.", "Skärp titel, H1 och inledning mot en konkret sökintention – inte bara ortsnamnet.", "Länka till sidan från områdeshubben och relevanta guider. Begär ny indexering först efter en faktisk förbättring."],
    },
    {
      state: "DISCOVERED_NOT_INDEXED" as const,
      count: discoveredNotIndexed.length,
      title: "Upptäckt men ej indexerad",
      summary: "Google känner till URL:en men har ännu inte crawlat och bedömt den färdigt.",
      actions: ["Kontrollera att sidan är nåbar med status 200, finns i sitemap och har en intern länk från en starkare sida.", "Undvik att skapa många snarlika nya URL:er samtidigt – förbättra och länka de viktigaste först.", "Låt Google crawla om efter ändringar; detta är normalt för nya eller svagare URL:er."],
    },
    {
      state: "EXCLUDED" as const,
      count: excluded.length,
      title: "Exkluderad",
      summary: "En exkludering kan vara korrekt, exempelvis för en canonical, redirect eller en sida som medvetet är noindex.",
      actions: ["Öppna en URL och läs Googles exakta täckningsstatus innan något ändras.", "Vid duplicate/canonical: välj en primär sida och gör innehållet på övriga sidor tydligt annorlunda eller låt dem vara exkluderade.", "Vid noindex eller redirect: ändra bara om sidan verkligen ska kunna ranka som en egen landningssida."],
    },
  ];

  async function inspectIndexing() {
    setIsInspecting(true);
    setInspectionError(null);
    setInspectionProgress({ done: 0, total: indexableItems.length });
    setIndexing({});
    try {
      const batches = Array.from({ length: Math.ceil(indexableItems.length / 20) }, (_, index) => indexableItems.slice(index * 20, index * 20 + 20));
      let completed = 0;
      let lastInspectedAt: string | null = null;
      for (const batch of batches) {
        const response = await fetch("/api/admin/search-console/indexing", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: batch.map((item) => item.path) }),
        });
        const text = await response.text();
        let payload: { results?: IndexingResult[]; inspectedAt?: string; error?: string };
        try {
          payload = JSON.parse(text) as { results?: IndexingResult[]; inspectedAt?: string; error?: string };
        } catch {
          throw new Error("Search Console svarade inte i tid. Försök igen om en stund.");
        }
        if (!response.ok || !payload.results || !payload.inspectedAt) throw new Error(payload.error ?? "Kunde inte hämta indexstatus.");
        setIndexing((current) => ({ ...current, ...Object.fromEntries(payload.results!.map((result) => [result.path, result])) }));
        completed += batch.length;
        lastInspectedAt = payload.inspectedAt;
        setInspectionProgress({ done: completed, total: indexableItems.length });
      }
      setInspectedAt(lastInspectedAt);
    } catch (error) {
      setInspectionError(error instanceof Error ? error.message : "Kunde inte hämta indexstatus.");
    } finally {
      setIsInspecting(false);
      setInspectionProgress(null);
    }
  }

  async function inspectBingIndexing() {
    setIsInspectingBing(true);
    setBingInspectionError(null);
    setBingInspectionProgress({ done: 0, total: indexableItems.length });
    setBingFilter("ALL");
    setBingIndexing({});
    try {
      const batches = Array.from({ length: Math.ceil(indexableItems.length / 20) }, (_, index) => indexableItems.slice(index * 20, index * 20 + 20));
      let completed = 0;
      let lastInspectedAt: string | null = null;
      for (const batch of batches) {
        const response = await fetch("/api/admin/bing/indexing", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: batch.map((item) => item.path) }),
        });
        const text = await response.text();
        let payload: { results?: BingIndexingResult[]; inspectedAt?: string; error?: string };
        try {
          payload = JSON.parse(text) as { results?: BingIndexingResult[]; inspectedAt?: string; error?: string };
        } catch {
          throw new Error("Bing svarade inte i tid. Försök igen om en stund.");
        }
        if (!response.ok || !payload.results || !payload.inspectedAt) throw new Error(payload.error ?? "Kunde inte hämta Bing-status.");
        setBingIndexing((current) => ({ ...current, ...Object.fromEntries(payload.results!.map((result) => [result.path, result])) }));
        completed += batch.length;
        lastInspectedAt = payload.inspectedAt;
        setBingInspectionProgress({ done: completed, total: indexableItems.length });
      }
      setBingInspectedAt(lastInspectedAt);
    } catch (error) {
      setBingInspectionError(error instanceof Error ? error.message : "Kunde inte hämta Bing-status.");
    } finally {
      setIsInspectingBing(false);
      setBingInspectionProgress(null);
    }
  }

  async function submitToIndexNow(path: string) {
    setIsSubmittingIndexNow(true);
    setIndexNowError(null);
    try {
      const response = await fetch("/api/admin/bing/indexnow", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [path], action: "UPDATED" }),
      });
      const text = await response.text();
      let payload: { history?: IndexNowHistoryItem[]; error?: string };
      try {
        payload = JSON.parse(text) as { history?: IndexNowHistoryItem[]; error?: string };
      } catch {
        throw new Error("IndexNow returnerade ett ogiltigt svar.");
      }
      if (payload.history?.length) setIndexNowHistory((current) => [...payload.history!, ...current].slice(0, 50));
      if (!response.ok) throw new Error(payload.error ?? "IndexNow kunde inte ta emot URL:en.");
    } catch (error) {
      setIndexNowError(error instanceof Error ? error.message : "IndexNow kunde inte ta emot URL:en.");
    } finally {
      setIsSubmittingIndexNow(false);
    }
  }

  useEffect(() => {
    async function loadSavedIndexing() {
      try {
        const response = await fetch("/api/admin/search-console/indexing", { credentials: "same-origin" });
        if (!response.ok) return;
        const payload = await response.json() as { results?: IndexingResult[]; inspectedAt?: string | null };
        if (!payload.results?.length || !payload.inspectedAt) return;
        setIndexing(Object.fromEntries(payload.results.map((result) => [result.path, result])));
        setInspectedAt(payload.inspectedAt);
      } catch {
        // Den sparade översikten är ett hjälpmedel; en ny kontroll är alltid möjlig.
      }
    }
    void loadSavedIndexing();
  }, []);

  useEffect(() => {
    async function loadSavedBingData() {
      try {
        const [statusResponse, historyResponse] = await Promise.all([
          fetch("/api/admin/bing/indexing", { credentials: "same-origin" }),
          fetch("/api/admin/bing/indexnow", { credentials: "same-origin" }),
        ]);
        if (statusResponse.ok) {
          const payload = await statusResponse.json() as { results?: BingIndexingResult[]; inspectedAt?: string | null };
          if (payload.results?.length && payload.inspectedAt) {
            setBingIndexing(Object.fromEntries(payload.results.map((result) => [result.path, result])));
            setBingInspectedAt(payload.inspectedAt);
          }
        }
        if (historyResponse.ok) {
          const payload = await historyResponse.json() as { history?: IndexNowHistoryItem[] };
          setIndexNowHistory(payload.history ?? []);
        }
      } catch {
        // Panelerna kan alltid uppdateras manuellt om sparad data saknas.
      }
    }
    void loadSavedBingData();
  }, []);

  function showIndexingFilter(nextFilter: IndexingFilter) {
    setIndexingFilter(nextFilter);
    window.requestAnimationFrame(() => urlListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function showBingFilter(nextFilter: BingFilter) {
    setBingFilter(nextFilter);
    window.requestAnimationFrame(() => urlListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <main className={`admin-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="admin-sidebar">
        <button className="admin-sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expandera sidomeny" : "Minimera sidomeny"} title={sidebarCollapsed ? "Expandera meny" : "Minimera meny"}>{sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
        <Link className="brand admin-brand" href="/"><span className="brand-mark"><Network size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link>
        <nav aria-label="Adminnavigering">
          <Link href="/admin"><Users size={18} /> Partners</Link>
          <Link href="/admin/call-center"><PhoneCall size={18} /> Call center</Link>
          <Link href="/admin/statistik"><BarChart3 size={18} /> Statistik</Link>
          <Link className="active" href="/admin/seo"><Network size={18} /> URL-karta</Link>
          <Link href="/admin/serps"><FileText size={18} /> SERPS</Link>
          <Link href="/"><ArrowLeft size={18} /> Kundsidan</Link>
        </nav>
      </aside>

      <section className="admin-content seo-map-content">
        <header className="admin-topbar seo-map-topbar"><div><p>SEO-verktyg</p><h1>URL-karta</h1></div><a className="seo-public-link" href={`${origin}/sitemap.xml`} target="_blank" rel="noreferrer"><Link2 size={15} /> Öppna sitemap</a></header>
        <p className="seo-map-lead">En visuell översikt över hur sajten är uppbyggd. “Påverkan” är en strategisk bedömning av sidans roll – faktisk ranking och trafik följs i Search Console.</p>

        <div className="seo-indexing-panels">
          <section className="seo-indexing-panel" aria-labelledby="seo-indexing-title">
            <div><p>Google Search Console</p><h2 id="seo-indexing-title">Indexeringsstatus per URL</h2><span>{inspectedAt ? `Senast kontrollerad ${formatCrawlTime(inspectedAt)}` : `${indexableItems.length} publika URL:er är redo att kontrolleras.`}</span></div>
            <div className="seo-indexing-summary">
              {inspectedAt && <><span className="indexed"><CheckCircle2 size={14} /> {indexedCount} indexerade</span><span className="attention"><TriangleAlert size={14} /> {attentionCount} att se över</span></>}
              <button type="button" onClick={inspectIndexing} disabled={isInspecting}><RefreshCw size={15} className={isInspecting ? "spinning" : ""} /> {isInspecting && inspectionProgress ? `Kontrollerar ${inspectionProgress.done}/${inspectionProgress.total}` : inspectedAt ? "Uppdatera status" : "Hämta indexstatus"}</button>
            </div>
            {inspectionError && <p className="seo-indexing-error">{inspectionError}</p>}
          </section>

          <section className="seo-indexing-panel bing" aria-labelledby="seo-bing-indexing-title">
            <div><p>Microsoft Bing</p><h2 id="seo-bing-indexing-title">Bing-status per URL</h2><span>{bingInspectedAt ? `Senast kontrollerad ${formatCrawlTime(bingInspectedAt)}` : `${indexableItems.length} publika URL:er kan kontrolleras mot Bing.`}</span></div>
            <div className="seo-indexing-summary">
              {bingInspectedAt && <><span className="indexed"><CheckCircle2 size={14} /> {bingIndexedCount} indexerade</span><span className="attention"><TriangleAlert size={14} /> {bingAttentionCount} att se över</span></>}
              <button type="button" onClick={inspectBingIndexing} disabled={isInspectingBing}><RefreshCw size={15} className={isInspectingBing ? "spinning" : ""} /> {isInspectingBing && bingInspectionProgress ? `Kontrollerar ${bingInspectionProgress.done}/${bingInspectionProgress.total}` : bingInspectedAt ? "Uppdatera Bing" : "Hämta Bing-status"}</button>
            </div>
            {bingInspectionError && <p className="seo-indexing-error">{bingInspectionError}</p>}
          </section>
        </div>

        {inspectedAt && <section className="seo-action-plan" aria-labelledby="seo-action-plan-title">
          <header><div><p><ListChecks size={14} /> Åtgärdsplan från Search Console</p><h2 id="seo-action-plan-title">Prioritera förbättringar, inte bara fler URL:er</h2><span>{attentionCount} URL:er kräver en bedömning. Exkluderade URL:er är inte automatiskt fel.</span></div><button type="button" className={indexingFilter === "ATTENTION" ? "active" : ""} onClick={() => showIndexingFilter(indexingFilter === "ATTENTION" ? "ALL" : "ATTENTION")}>{indexingFilter === "ATTENTION" ? "Visa alla URL:er" : `Visa ${attentionCount} att se över`}</button></header>
          <div className="seo-action-grid">
            {recommendationGroups.filter((group) => group.count > 0).map((group) => <article key={group.state}>
              <div><span className={indexingClass(group.state)}>{group.count} URL:er</span><button type="button" onClick={() => showIndexingFilter(group.state)}>Visa dessa</button></div>
              <h3>{group.title}</h3><p>{group.summary}</p>
              <ol>{group.actions.map((action) => <li key={action}>{action}</li>)}</ol>
            </article>)}
          </div>
          {priorityItems.length > 0 && <div className="seo-priority-list"><div><strong>Granska först</strong><span>Viktiga sidor med status som kräver åtgärd</span></div><div>{priorityItems.map((item) => <button type="button" key={item.path} onClick={() => { setSelectedPath(item.path); setIndexingFilter("ALL"); }}><span className={indexingClass(indexing[item.path]?.state)}>{indexingLabels[indexing[item.path]?.state ?? "ERROR"]}</span><strong>{item.label}</strong><code>{item.path}</code></button>)}</div></div>}
        </section>}

        {bingInspectedAt && <section className="seo-action-plan seo-bing-action-plan" aria-labelledby="seo-bing-action-plan-title">
          <header><div><p><ListChecks size={14} /> Åtgärdsplan från Bing</p><h2 id="seo-bing-action-plan-title">Tekniska hinder och svaga URL:er först</h2><span>Kärnsidor och lokala eljourssidor prioriteras före guider i listan.</span></div><button type="button" className={bingFilter === "REVIEW" ? "active" : ""} onClick={() => showBingFilter(bingFilter === "REVIEW" ? "ALL" : "REVIEW")}>{bingFilter === "REVIEW" ? "Visa alla URL:er" : `Visa ${bingAttentionCount} att se över`}</button></header>
          <div className="seo-action-grid">
            <article><div><span className={bingIndexingClass("CRAWLED_NOT_INDEXED")}>{bingCrawledNotIndexedCount} URL:er</span><button type="button" onClick={() => showBingFilter("CRAWLED_NOT_INDEXED")}>Visa dessa</button></div><h3>Crawlad men ej indexerad</h3><p>Bing har besökt sidan men visar den ännu inte som ett eget sökresultat.</p><ol><li>Stärk sidans unika värde och interna länkar.</li><li>Skicka URL:en via IndexNow först efter en verklig förbättring.</li></ol></article>
            <article><div><span className="seo-bing-state error">{bingTechnicalIssueCount} URL:er</span><button type="button" onClick={() => showBingFilter("REVIEW")}>Visa dessa</button></div><h3>Tekniska hinder</h3><p>HTTP-fel, robots-regler, avvikande canonical eller redirects ska granskas före innehållet.</p><ol><li>Kontrollera att indexerbara URL:er svarar 200.</li><li>Rätta bara canonical och redirects som faktiskt är fel.</li></ol></article>
            <article><div><span className="seo-bing-state discovered-not-indexed">{bingWarningCount} URL:er</span><button type="button" onClick={() => showBingFilter("REVIEW")}>Visa dessa</button></div><h3>SEO-varningar</h3><p>Livekontrollen granskar title, H1, metabeskrivning, canonical och indexeringsdirektiv.</p><ol><li>Öppna URL-detaljen för den exakta varningen.</li><li>Prioritera kärnsidor och lokala sidor med tydlig sökintention.</li></ol></article>
          </div>
          {bingPriorityItems.length > 0 && <div className="seo-priority-list"><div><strong>Granska först</strong><span>Kärnsidor → lokala eljourssidor → guider</span></div><div>{bingPriorityItems.map((item) => <button type="button" key={item.path} onClick={() => { setSelectedPath(item.path); setBingFilter("ALL"); }}><span className={bingIndexingClass(bingIndexing[item.path]?.state)}>{bingIndexingLabels[bingIndexing[item.path]?.state ?? "ERROR"]}</span><strong>{item.label}</strong><code>{item.path}</code></button>)}</div></div>}
        </section>}

        <section className="seo-indexnow-history" aria-labelledby="seo-indexnow-title">
          <header><div><p><History size={14} /> IndexNow-historik</p><h2 id="seo-indexnow-title">Skickade URL-ändringar</h2><span>Historiken loggar URL, åtgärd, tidpunkt och svaret från IndexNow.</span></div><strong>{indexNowHistory.length} senaste</strong></header>
          {indexNowError && <p className="seo-indexing-error">{indexNowError}</p>}
          {indexNowHistory.length > 0 ? <div className="seo-indexnow-table-wrap"><table><thead><tr><th>URL</th><th>Åtgärd</th><th>Skickad</th><th>Svar</th></tr></thead><tbody>{indexNowHistory.slice(0, 12).map((entry) => <tr key={`${entry.id}-${entry.path}-${entry.submittedAt}`}><td><code>{entry.path}</code></td><td>{entry.action === "DELETED" ? "Borttagen" : "Uppdaterad"}</td><td>{formatCrawlTime(entry.submittedAt)}</td><td><span className={entry.success ? "success" : "failed"}>{entry.responseStatus ?? "–"} {entry.responseMessage ?? "Inget svar"}</span></td></tr>)}</tbody></table></div> : <div className="seo-indexnow-empty"><Send size={20} /><span>Ingen IndexNow-historik ännu. Välj en publik URL längre ned för att skicka den efter en faktisk ändring.</span></div>}
        </section>

        <SeoIndexingChart
          breakdown={indexingBreakdown}
          notChecked={notCheckedCount}
          total={indexableItems.length}
          inspectedAt={inspectedAt}
          activeFilter={indexingFilter}
          onSelectFilter={showIndexingFilter}
        />

        <div className="seo-stat-grid">
          <StatCard icon={Globe2} label="HTML-sidor" value={htmlCount} />
          <StatCard icon={BarChart3} label="I sitemap" value={sitemapCount} tone="green" />
          <StatCard icon={MapPin} label="Lokala sidor" value={localCount} tone="blue" />
          <StatCard icon={BookOpen} label="Guide-sidor" value={guideCount} tone="blue" />
          <StatCard icon={FileText} label="Länkade utanför sitemap" value={linkedOutsideSitemap} tone="amber" />
        </div>

        <div className="seo-map-toolbar">
          <label><Search size={17} /><input aria-label="Sök URL" placeholder="Sök URL, område eller sidtyp" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="seo-filter-controls"><div className="admin-filter-wrap"><select aria-label="Filtrera URL-typ" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}><option value="ALL">Alla URL:er</option><option value="SITEMAP">I sitemap</option><option value="LINKED">Länkade, ej i sitemap</option><option value="TECHNICAL">Tekniska URL:er</option></select><ChevronDown size={16} /></div>{inspectedAt && <div className="admin-filter-wrap"><select aria-label="Filtrera Google-status" value={indexingFilter} onChange={(event) => setIndexingFilter(event.target.value as IndexingFilter)}><option value="ALL">Alla Google-statusar</option><option value="ATTENTION">Google: bör granskas</option><option value="INDEXED">Google: indexerad</option><option value="CRAWLED_NOT_INDEXED">Google: crawlad, ej indexerad</option><option value="DISCOVERED_NOT_INDEXED">Google: upptäckt, ej indexerad</option><option value="EXCLUDED">Google: exkluderad</option></select><ChevronDown size={16} /></div>}{bingInspectedAt && <div className="admin-filter-wrap"><select aria-label="Filtrera Bing-status" value={bingFilter} onChange={(event) => setBingFilter(event.target.value as BingFilter)}><option value="ALL">Alla Bing-statusar</option><option value="INDEXED">Bing: indexerad</option><option value="CRAWLED_NOT_INDEXED">Bing: crawlad, ej indexerad</option><option value="ROBOTS_BLOCKED">Bing: robots blockerar</option><option value="CANONICAL">Bing: canonical</option><option value="REDIRECT">Bing: redirect</option><option value="REVIEW">Bing: bör granskas</option></select><ChevronDown size={16} /></div>}</div>
        </div>

        <div className="seo-map-legend"><span><i className="seo-legend-dot high" /> Hög påverkan</span><span><i className="seo-legend-dot medium" /> Medel</span><span><i className="seo-legend-dot low" /> Låg</span><span><i className="seo-legend-dot indirect" /> Indirekt/teknisk</span></div>

        {filteredItems.length > 0 && <SeoUrlOrbit items={filteredItems} selectedPath={selected?.path} onSelect={setSelectedPath} />}

        <SeoCoverageMap areas={areas} origin={origin} selectedPath={selected?.path} onSelect={setSelectedPath} />

        <div className="seo-map-board">
          <section className="seo-tree-card" ref={urlListRef} aria-labelledby="seo-tree-title">
            <header className="seo-tree-header"><div><p>Informationsarkitektur</p><h2 id="seo-tree-title">Elektrikerakut.nu</h2></div><span>{filteredItems.length} visas</span></header>
            <div className="seo-tree">
              {coreItems.length > 0 && <div className="seo-tree-branch core-branch"><div className="seo-tree-branch-title"><Globe2 size={16} /><strong>Kärnsidor</strong><span>{coreItems.length}</span></div>{coreItems.map((item) => <UrlRow key={item.path} item={item} origin={origin} selected={selected?.path === item.path} onSelect={() => setSelectedPath(item.path)} indexing={indexing[item.path]} bingIndexing={bingIndexing[item.path]} />)}</div>}
              {guideItems.length > 0 && <div className="seo-tree-branch guide-branch"><div className="seo-tree-branch-title"><FileText size={16} /><strong>Elguiden</strong><span>{guideItems.length}</span></div>{guideItems.map((item) => <UrlRow key={item.path} item={item} origin={origin} selected={selected?.path === item.path} onSelect={() => setSelectedPath(item.path)} indexing={indexing[item.path]} bingIndexing={bingIndexing[item.path]} />)}</div>}
              {localItems.length > 0 && <details className="seo-tree-branch local-branch" open={Boolean(query)}><summary><MapPin size={16} /><strong>Lokala eljourssidor</strong><span>{localItems.length}{localItems.length !== localCount ? ` av ${localCount}` : ""}</span><ChevronDown size={15} /></summary><div className="seo-local-groups">{localGroups.map((municipality) => { const municipalityItems = localItems.filter((item) => item.municipality === municipality); return <details key={municipality} open={Boolean(query)}><summary><CircleDot size={12} /><strong>{municipality}</strong><span>{municipalityItems.length}</span><ChevronDown size={14} /></summary><div>{municipalityItems.map((item) => <UrlRow key={item.path} item={item} origin={origin} selected={selected?.path === item.path} onSelect={() => setSelectedPath(item.path)} indexing={indexing[item.path]} bingIndexing={bingIndexing[item.path]} />)}</div></details>; })}</div></details>}
              {legalItems.length > 0 && <div className="seo-tree-branch"><div className="seo-tree-branch-title"><ShieldCheck size={16} /><strong>Juridik och förtroende</strong><span>{legalItems.length}</span></div>{legalItems.map((item) => <UrlRow key={item.path} item={item} origin={origin} selected={selected?.path === item.path} onSelect={() => setSelectedPath(item.path)} indexing={indexing[item.path]} bingIndexing={bingIndexing[item.path]} />)}</div>}
              {technicalItems.length > 0 && <div className="seo-tree-branch technical-branch"><div className="seo-tree-branch-title"><Network size={16} /><strong>Tekniska URL:er</strong><span>{technicalItems.length}</span></div>{technicalItems.map((item) => <UrlRow key={item.path} item={item} origin={origin} selected={selected?.path === item.path} onSelect={() => setSelectedPath(item.path)} />)}</div>}
              {filteredItems.length === 0 && <div className="seo-empty"><Search size={24} /><strong>Ingen URL matchar filtret</strong><span>Prova ett annat sökord eller välj “Alla URL:er”.</span></div>}
            </div>
          </section>

          <aside className="seo-detail-card" aria-live="polite">
            {selected ? <>
              <div className="seo-detail-kicker"><Zap size={14} /> Vald URL</div>
              <h2>{selected.label}</h2>
              <code className="seo-detail-path">{selected.path}</code>
              <div className="seo-detail-badges">
                <span className={`seo-impact ${impactClass(selected.impact)}`}>{selected.impact} påverkan</span>
                <span className={selected.inSitemap ? "included" : "not-included"}>{selected.inSitemap ? <CheckCircle2 size={13} /> : <Info size={13} />} {selected.inSitemap ? "Finns i sitemap" : selected.group === "Tekniskt" ? "Ej indexerbar" : "Ej i sitemap"}</span>
                {indexing[selected.path] && <span className={indexingClass(indexing[selected.path].state)}>Google: {indexingLabels[indexing[selected.path].state]}</span>}
                {bingIndexing[selected.path] && <span className={bingIndexingClass(bingIndexing[selected.path].state)}>Bing: {bingIndexingLabels[bingIndexing[selected.path].state]}</span>}
              </div>
              <p>{selected.description}</p>
              <dl>
                <div><dt>SEO-roll</dt><dd>{selected.role}</dd></div>
                <div><dt>Upptäckt via</dt><dd>{selected.discoverability}</dd></div>
                <div><dt>Sitemap-prioritet</dt><dd>{selected.priority ?? "–"}</dd></div>
                {indexing[selected.path] && <>
                  <div><dt>Google – senaste crawl</dt><dd><Clock3 size={12} /> {formatCrawlTime(indexing[selected.path].lastCrawlTime)}</dd></div>
                  <div><dt>Google-kanonisk</dt><dd>{indexing[selected.path].googleCanonical ? "Ja" : "–"}</dd></div>
                  <div><dt>Google-status</dt><dd>{indexing[selected.path].coverageState ?? "–"}</dd></div>
                </>}
                {bingIndexing[selected.path] && <>
                  <div><dt>Bing – upptäckt</dt><dd>{formatCrawlTime(bingIndexing[selected.path].discoveryDate)}</dd></div>
                  <div><dt>Bing – senaste crawl</dt><dd><Clock3 size={12} /> {formatCrawlTime(bingIndexing[selected.path].lastCrawledDate)}</dd></div>
                  <div><dt>HTTP-status</dt><dd>{bingIndexing[selected.path].httpStatus ?? "–"}</dd></div>
                  <div><dt>Robots blockerar</dt><dd>{bingIndexing[selected.path].robotsBlocked ? "Ja" : "Nej"}</dd></div>
                  <div><dt>Canonical</dt><dd>{bingIndexing[selected.path].canonicalIssue ? "Bör granskas" : "Korrekt"}</dd></div>
                  {bingIndexing[selected.path].redirectUrl && <div><dt>Redirect till</dt><dd>{bingIndexing[selected.path].redirectUrl}</dd></div>}
                </>}
              </dl>
              {(bingIndexing[selected.path]?.seoWarnings.length ?? 0) > 0 && <div className="seo-detail-warnings"><strong>SEO-varningar</strong><ul>{bingIndexing[selected.path].seoWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
              <div className="seo-detail-actions">
                <a className="seo-detail-open" href={`${origin}${selected.path}`} target="_blank" rel="noreferrer">Öppna publik URL <ArrowUpRight size={15} /></a>
                {selected.group !== "Tekniskt" && selected.indexable !== false && <button type="button" onClick={() => submitToIndexNow(selected.path)} disabled={isSubmittingIndexNow}><Send size={14} /> {isSubmittingIndexNow ? "Skickar…" : "Skicka till IndexNow"}</button>}
              </div>
            </> : <div className="seo-empty"><Info size={24} /><strong>Välj en URL</strong></div>}
          </aside>
        </div>
      </section>
    </main>
  );
}
