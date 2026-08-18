"use client";

import { AlertTriangle, BarChart3, Clock3, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type HistoryPoint = { date: string; count: number };
type PathCount = { path: string; label: string; count: number };
type HistoryData = { points: HistoryPoint[]; topPaths: PathCount[]; pathsByDay: Record<string, PathCount[]>; totalViews: number; rangeDays: number };
type DayVisit = { path: string; label: string; createdAt: string };
type DayTimeline = { day: string; visits: DayVisit[] };

const RANGE_OPTIONS: { id: string; label: string }[] = [
  { id: "7d", label: "7 dagar" },
  { id: "30d", label: "30 dagar" },
  { id: "90d", label: "90 dagar" },
];

const CHART_HEIGHT = 180;

function formatShortDate(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

function formatFullDate(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function VisitHistory() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<HistoryData | null>(null);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timeline, setTimeline] = useState<DayTimeline | null>(null);
  const [timelineError, setTimelineError] = useState("");

  useEffect(() => {
    setData(null);
    setSelectedDay(null);
    setShowTimeline(false);
    fetch(`/api/admin/analytics/history?range=${range}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as HistoryData & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Historiken kunde inte hämtas.");
        setData(payload);
        setError("");
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Historiken kunde inte hämtas."));
  }, [range]);

  useEffect(() => {
    if (!selectedDay || !showTimeline) { setTimeline(null); return; }
    let cancelled = false;
    setTimeline(null);
    setTimelineError("");
    fetch(`/api/admin/analytics/history?day=${selectedDay}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as DayTimeline & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Tidslinjen kunde inte hämtas.");
        if (!cancelled) setTimeline(payload);
      })
      .catch((loadError: unknown) => { if (!cancelled) setTimelineError(loadError instanceof Error ? loadError.message : "Tidslinjen kunde inte hämtas."); });
    return () => { cancelled = true; };
  }, [selectedDay, showTimeline]);

  const maxCount = useMemo(() => {
    if (!data) return 1;
    return Math.max(...data.points.map((point) => point.count), 1);
  }, [data]);

  const showEveryLabel = data ? data.points.length <= 14 : true;
  const showValues = data ? data.points.length <= 35 : true;

  const listItems = useMemo(() => {
    if (!data) return [];
    if (selectedDay) return data.pathsByDay[selectedDay] ?? [];
    return data.topPaths;
  }, [data, selectedDay]);

  function selectDay(date: string) {
    const next = selectedDay === date ? null : date;
    setSelectedDay(next);
    setShowTimeline(false);
  }

  if (error) return (
    <div className="admin-card visit-history-card">
      <div className="search-trend-heading"><span><BarChart3 size={17} /> Besökshistorik</span><h2>Sidvisningar över tid</h2></div>
      <p className="admin-alert search-trend-alert" role="alert"><AlertTriangle size={16} /> {error}</p>
    </div>
  );

  return (
    <div className="admin-card visit-history-card">
      <div className="visit-history-head">
        <div className="search-trend-heading">
          <span><BarChart3 size={17} /> Besökshistorik</span>
          <h2>Sidvisningar över tid</h2>
          <p>Klicka på en stapel för att se vilka sidor som besöktes just den dagen.</p>
        </div>
        <div className="visit-history-range" role="group" aria-label="Välj tidsperiod">
          {RANGE_OPTIONS.map((option) => (
            <button key={option.id} type="button" className={range === option.id ? "active" : ""} onClick={() => setRange(option.id)}>{option.label}</button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="admin-empty search-trend-loading"><LoaderCircle className="admin-spinner" size={24} /> Hämtar historik…</div>
      ) : (
        <>
          <div className="visit-history-summary">
            <div><small>Sidvisningar, {range === "7d" ? "senaste veckan" : range === "30d" ? "senaste 30 dagarna" : "senaste 90 dagarna"}</small><strong>{data.totalViews.toLocaleString("sv-SE")}</strong></div>
            {selectedDay && <button type="button" className="visit-history-clear" onClick={() => setSelectedDay(null)}>Visa hela perioden</button>}
          </div>

          <div className="visit-history-chart" role="img" aria-label={`Stapeldiagram över sidvisningar de senaste ${data.rangeDays} dagarna`}>
            {data.points.map((point) => {
              const heightPct = maxCount > 0 ? Math.max((point.count / maxCount) * 100, point.count > 0 ? 4 : 0) : 0;
              const isSelected = selectedDay === point.date;
              return (
                <button
                  key={point.date}
                  type="button"
                  className={`visit-history-bar${isSelected ? " selected" : ""}`}
                  onClick={() => selectDay(point.date)}
                  aria-pressed={isSelected}
                  title={`${formatFullDate(point.date)}: ${point.count} sidvisningar`}
                  style={{ height: `${CHART_HEIGHT}px` }}
                >
                  {showValues && <span className="visit-history-bar-value">{point.count > 0 ? point.count : ""}</span>}
                  <span className="visit-history-bar-fill" style={{ height: `${heightPct}%` }} />
                  {(showEveryLabel || point.date === data.points[0].date || point.date === data.points[data.points.length - 1].date) && (
                    <span className="visit-history-bar-label">{formatShortDate(point.date)}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="visit-history-list-head">
            <h3>{selectedDay ? formatFullDate(selectedDay) : "Mest besökta sidor i perioden"}</h3>
            {selectedDay && (
              <div className="visit-history-view-toggle" role="group" aria-label="Visningsläge">
                <button type="button" className={!showTimeline ? "active" : ""} onClick={() => setShowTimeline(false)}>Per sida</button>
                <button type="button" className={showTimeline ? "active" : ""} onClick={() => setShowTimeline(true)}><Clock3 size={12} /> Tidslinje</button>
              </div>
            )}
          </div>

          {selectedDay && showTimeline ? (
            timelineError ? (
              <p className="admin-alert search-trend-alert" role="alert"><AlertTriangle size={16} /> {timelineError}</p>
            ) : !timeline ? (
              <div className="admin-empty search-trend-loading"><LoaderCircle className="admin-spinner" size={20} /> Hämtar tidslinje…</div>
            ) : (
              <ol className="visit-history-timeline">
                {timeline.visits.length === 0 && <li className="live-feed-empty">Inga sidvisningar registrerade denna dag.</li>}
                {timeline.visits.map((visit, index) => (
                  <li key={`${visit.createdAt}-${index}`} className="visit-history-timeline-row">
                    <span className="visit-history-timeline-time">{formatTime(visit.createdAt)}</span>
                    <span className="visit-history-row-label">{visit.label}</span>
                    <code className="live-feed-path">{visit.path}</code>
                  </li>
                ))}
              </ol>
            )
          ) : (
            <ol className="visit-history-list">
              {listItems.length === 0 && <li className="live-feed-empty">Inga sidvisningar registrerade{selectedDay ? " denna dag." : " i perioden."}</li>}
              {listItems.map((item) => (
                <li key={item.path} className="visit-history-row">
                  <span className="visit-history-row-label">{item.label}</span>
                  <code className="live-feed-path">{item.path}</code>
                  <span className="visit-history-row-count">{item.count}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
