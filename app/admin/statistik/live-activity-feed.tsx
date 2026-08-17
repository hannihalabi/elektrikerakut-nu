"use client";

import { AlertTriangle, CheckCircle2, Eye, LoaderCircle, MapPinOff, MousePointerClick, Radio, Search, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type EventType = "PAGE_VIEW" | "CTA_CLICK" | "FORM_ERROR" | "REQUEST_SUBMITTED" | "MATCH_STARTED" | "MATCH_FOUND" | "MATCH_NOT_FOUND" | "COVERAGE_UNAVAILABLE";
type LiveEvent = { eventType: EventType; path: string; createdAt: string };
type ActivePath = { path: string; count: number };
type LiveData = { events: LiveEvent[]; activePaths: ActivePath[]; activeViewCount: number; windowMinutes: number; serverTime: string };

const POLL_INTERVAL_MS = 10_000;

const eventLabels: Record<EventType, string> = {
  PAGE_VIEW: "Sidvisning",
  CTA_CLICK: "Klickade på CTA",
  FORM_ERROR: "Formulärfel",
  REQUEST_SUBMITTED: "Skickade förfrågan",
  MATCH_STARTED: "Startade matchning",
  MATCH_FOUND: "Fick en match",
  MATCH_NOT_FOUND: "Ingen match hittades",
  COVERAGE_UNAVAILABLE: "Område utanför täckning",
};

const eventIcons: Record<EventType, typeof Eye> = {
  PAGE_VIEW: Eye,
  CTA_CLICK: MousePointerClick,
  FORM_ERROR: AlertTriangle,
  REQUEST_SUBMITTED: Search,
  MATCH_STARTED: LoaderCircle,
  MATCH_FOUND: CheckCircle2,
  MATCH_NOT_FOUND: XCircle,
  COVERAGE_UNAVAILABLE: MapPinOff,
};

const eventTones: Record<EventType, string> = {
  PAGE_VIEW: "",
  CTA_CLICK: "blue",
  FORM_ERROR: "red",
  REQUEST_SUBMITTED: "blue",
  MATCH_STARTED: "amber",
  MATCH_FOUND: "green",
  MATCH_NOT_FOUND: "red",
  COVERAGE_UNAVAILABLE: "red",
};

function relativeTime(iso: string, nowMs: number) {
  const seconds = Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just nu";
  if (seconds < 60) return `${seconds} sek sedan`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min sedan`;
  const hours = Math.round(minutes / 60);
  return `${hours} h sedan`;
}

export function LiveActivityFeed() {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch("/api/admin/analytics/live", { cache: "no-store" });
        const payload = await response.json() as LiveData & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Live-data kunde inte hämtas.");
        if (!cancelled) { setData(payload); setError(""); }
      } catch (pollError) {
        if (!cancelled) setError(pollError instanceof Error ? pollError.message : "Live-data kunde inte hämtas.");
      }
    }

    void poll();
    pollRef.current = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => { cancelled = true; if (pollRef.current) window.clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    const ticker = window.setInterval(() => setNowMs(Date.now()), 5_000);
    return () => window.clearInterval(ticker);
  }, []);

  if (error && !data) return (
    <div className="admin-card live-feed-card">
      <div className="search-trend-heading"><span><Radio size={17} /> Just nu</span><h2>Live-aktivitet</h2></div>
      <p className="admin-alert search-trend-alert" role="alert"><AlertTriangle size={16} /> {error}</p>
    </div>
  );

  if (!data) return (
    <div className="admin-card live-feed-card">
      <div className="search-trend-heading"><span><Radio size={17} /> Just nu</span><h2>Live-aktivitet</h2></div>
      <div className="admin-empty search-trend-loading"><LoaderCircle className="admin-spinner" size={24} /> Hämtar live-aktivitet…</div>
    </div>
  );

  return (
    <div className="admin-card live-feed-card">
      <div className="search-trend-heading">
        <span><Radio size={17} /> Just nu</span>
        <h2>Live-aktivitet</h2>
        <p>{data.activeViewCount} sidvisningar de senaste {data.windowMinutes} minuterna. Uppdateras automatiskt.</p>
      </div>

      {data.activePaths.length > 0 && (
        <div className="live-feed-active-paths">
          {data.activePaths.map((item) => (
            <span key={item.path} className="live-feed-active-pill"><i /> {item.path} <small>{item.count}</small></span>
          ))}
        </div>
      )}

      <ol className="live-feed-list">
        {data.events.length === 0 && <li className="live-feed-empty">Ingen aktivitet de senaste 30 minuterna.</li>}
        {data.events.map((event, index) => {
          const Icon = eventIcons[event.eventType];
          const tone = eventTones[event.eventType];
          return (
            <li key={`${event.createdAt}-${index}`} className={`live-feed-row${tone ? ` ${tone}` : ""}`}>
              <span className="live-feed-icon"><Icon size={14} /></span>
              <span className="live-feed-label">{eventLabels[event.eventType]}</span>
              <code className="live-feed-path">{event.path}</code>
              <span className="live-feed-time">{relativeTime(event.createdAt, nowMs)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
