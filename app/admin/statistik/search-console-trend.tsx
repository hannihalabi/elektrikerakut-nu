"use client";

import { AlertTriangle, LoaderCircle, Search, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type DailyPoint = { date: string; clicks: number; impressions: number; ctr: number; position: number };

const CHART_WIDTH = 900;
const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 16 };

function formatShortDate(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

function buildPath(points: { x: number; y: number }[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
}

export function SearchConsoleTrend() {
  const [points, setPoints] = useState<DailyPoint[] | null>(null);
  const [error, setError] = useState("");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch("/api/admin/search-console/analytics", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { points?: DailyPoint[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Sökstatistiken kunde inte hämtas.");
        setPoints(data.points ?? []);
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Sökstatistiken kunde inte hämtas."));
  }, []);

  const chart = useMemo(() => {
    if (!points || points.length < 2) return null;
    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const maxClicks = Math.max(...points.map((point) => point.clicks), 1);
    const maxImpressions = Math.max(...points.map((point) => point.impressions), 1);

    const xFor = (index: number) => PADDING.left + (innerWidth * index) / (points.length - 1);
    const yForClicks = (value: number) => PADDING.top + innerHeight - (innerHeight * value) / maxClicks;
    const yForImpressions = (value: number) => PADDING.top + innerHeight - (innerHeight * value) / maxImpressions;

    const clickPoints = points.map((point, index) => ({ x: xFor(index), y: yForClicks(point.clicks) }));
    const impressionPoints = points.map((point, index) => ({ x: xFor(index), y: yForImpressions(point.impressions) }));

    const totalClicks = points.reduce((sum, point) => sum + point.clicks, 0);
    const totalImpressions = points.reduce((sum, point) => sum + point.impressions, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition = points.reduce((sum, point) => sum + point.position, 0) / points.length;

    return { clickPath: buildPath(clickPoints), impressionPath: buildPath(impressionPoints), clickPoints, impressionPoints, xFor, totalClicks, totalImpressions, avgCtr, avgPosition };
  }, [points]);

  function handlePointerMove(event: React.PointerEvent<SVGRectElement>) {
    if (!points || !chart || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = CHART_WIDTH / rect.width;
    const localX = (event.clientX - rect.left) * scaleX;
    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const ratio = Math.min(Math.max((localX - PADDING.left) / innerWidth, 0), 1);
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(index);
  }

  if (error) return (
    <div className="admin-card search-trend-card">
      <div className="search-trend-heading"><span><Search size={17} /> Google Search Console</span><h2>Klick och exponeringar</h2></div>
      <p className="admin-alert search-trend-alert" role="alert"><AlertTriangle size={16} /> {error}</p>
    </div>
  );

  if (!points) return (
    <div className="admin-card search-trend-card">
      <div className="search-trend-heading"><span><Search size={17} /> Google Search Console</span><h2>Klick och exponeringar</h2></div>
      <div className="admin-empty search-trend-loading"><LoaderCircle className="admin-spinner" size={24} /> Hämtar sökstatistik…</div>
    </div>
  );

  if (!chart) return (
    <div className="admin-card search-trend-card">
      <div className="search-trend-heading"><span><Search size={17} /> Google Search Console</span><h2>Klick och exponeringar</h2></div>
      <div className="admin-empty search-trend-loading">Ingen sökdata tillgänglig ännu för perioden.</div>
    </div>
  );

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredX = hoverIndex !== null ? chart.xFor(hoverIndex) : null;

  return (
    <div className="admin-card search-trend-card">
      <div className="search-trend-heading">
        <span><Search size={17} /> Google Search Console</span>
        <h2>Klick och exponeringar, senaste 90 dagarna</h2>
        <p>Data släpar 2–3 dagar efter Googles egen rapportering.</p>
      </div>

      <div className="search-trend-summary">
        <div><small>Klick totalt</small><strong>{chart.totalClicks.toLocaleString("sv-SE")}</strong></div>
        <div><small>Exponeringar totalt</small><strong>{chart.totalImpressions.toLocaleString("sv-SE")}</strong></div>
        <div><small>Genomsnittlig CTR</small><strong>{chart.avgCtr.toFixed(1)} %</strong></div>
        <div><small>Genomsnittlig position</small><strong>{chart.avgPosition.toFixed(1)}</strong></div>
      </div>

      <div className="search-trend-legend">
        <span className="clicks"><i /> Klick</span>
        <span className="impressions"><i /> Exponeringar</span>
      </div>

      <div className="search-trend-chart-wrap">
        <svg ref={svgRef} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="Linjediagram över klick och exponeringar från Google Search Console de senaste 90 dagarna" className="search-trend-svg">
          <line x1={PADDING.left} y1={CHART_HEIGHT - PADDING.bottom} x2={CHART_WIDTH - PADDING.right} y2={CHART_HEIGHT - PADDING.bottom} className="search-trend-baseline" />
          <path d={chart.impressionPath} className="search-trend-line impressions" fill="none" />
          <path d={chart.clickPath} className="search-trend-line clicks" fill="none" />
          {hoveredX !== null && <line x1={hoveredX} y1={PADDING.top} x2={hoveredX} y2={CHART_HEIGHT - PADDING.bottom} className="search-trend-crosshair" />}
          {hoverIndex !== null && (
            <>
              <circle cx={chart.clickPoints[hoverIndex].x} cy={chart.clickPoints[hoverIndex].y} r={4} className="search-trend-dot clicks" />
              <circle cx={chart.impressionPoints[hoverIndex].x} cy={chart.impressionPoints[hoverIndex].y} r={4} className="search-trend-dot impressions" />
            </>
          )}
          <rect
            x={PADDING.left}
            y={0}
            width={CHART_WIDTH - PADDING.left - PADDING.right}
            height={CHART_HEIGHT}
            fill="transparent"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          />
        </svg>
        {hovered && hoveredX !== null && (
          <div className="search-trend-tooltip" style={{ left: `${(hoveredX / CHART_WIDTH) * 100}%` }}>
            <strong>{formatShortDate(hovered.date)}</strong>
            <span><i className="clicks" /> {hovered.clicks} klick</span>
            <span><i className="impressions" /> {hovered.impressions} exponeringar</span>
            <span className="muted">Position {hovered.position.toFixed(1)} · CTR {(hovered.ctr * 100).toFixed(1)} %</span>
          </div>
        )}
      </div>
      <div className="search-trend-axis-labels"><span>{formatShortDate(points[0].date)}</span><span>{formatShortDate(points[points.length - 1].date)}</span></div>
      <p className="search-trend-caption"><TrendingUp size={13} /> Baserat på Googles sökdata för elektrikerakut.nu, samma källa som Search Console.</p>
    </div>
  );
}
