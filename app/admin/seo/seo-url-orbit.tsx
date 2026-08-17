"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { SeoUrlItem } from "./seo-url-map";

type Point3D = { x: number; y: number; z: number };

const GROUP_COLORS: Record<SeoUrlItem["group"], string> = {
  "Kärnsidor": "#4d9aff",
  Guider: "#8b6df6",
  "Lokala sidor": "#20b879",
  Juridik: "#b086ff",
  Tekniskt: "#f0ad4e",
};

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function rotate(point: Point3D, rotation: { x: number; y: number }) {
  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);
  const firstX = point.x * cosY - point.z * sinY;
  const firstZ = point.x * sinY + point.z * cosY;
  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);
  return { x: firstX, y: point.y * cosX - firstZ * sinX, z: point.y * sinX + firstZ * cosX };
}

function positionFor(item: SeoUrlItem, index: number, groupIndexes: Record<SeoUrlItem["group"], number>): Point3D {
  if (item.path === "/") return { x: 0, y: 0, z: 44 };

  const groupIndex = groupIndexes[item.group]++;
  if (item.group === "Kärnsidor") {
    const angle = groupIndex * 2.399963229728653 + 0.4;
    return { x: Math.cos(angle) * (126 + (groupIndex % 2) * 13), y: Math.sin(angle) * (76 + (groupIndex % 2) * 8), z: Math.sin(angle * 2) * 42 };
  }

  if (item.group === "Guider") {
    const angle = groupIndex * 2.399963229728653 + 0.9;
    const radius = 220 + (groupIndex % 3) * 16;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.5, z: ((groupIndex * 53 + 31) % 140) - 70 };
  }

  const radius = item.group === "Lokala sidor" ? 172 + (groupIndex % 4) * 21 : 202 + groupIndex * 21;
  const angle = groupIndex * 2.399963229728653 + (item.group === "Juridik" ? 0.7 : 1.4);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.56, z: ((groupIndex * 47 + index * 13) % 128) - 64 };
}

export function SeoUrlOrbit({ items, selectedPath, onSelect }: { items: SeoUrlItem[]; selectedPath?: string; onSelect: (path: string) => void }) {
  const [rotation, setRotation] = useState({ x: -0.17, y: -0.45 });
  const dragStart = useRef<{ x: number; y: number; rotationX: number; rotationY: number } | null>(null);
  const dragged = useRef(false);

  const nodes = useMemo(() => {
    const groupIndexes: Record<SeoUrlItem["group"], number> = { "Kärnsidor": 0, Guider: 0, "Lokala sidor": 0, Juridik: 0, Tekniskt: 0 };
    return items.map((item, index) => {
      const rawPosition = positionFor(item, index, groupIndexes);
      const rawPoint = rotate(rawPosition, rotation);
      const point = { x: round(rawPoint.x), y: round(rawPoint.y), z: round(rawPoint.z) };
      const scale = round(0.58 + ((point.z + 120) / 240) * 0.68);
      return { item, point, scale, x: round(400 + point.x), y: round(238 + point.y) };
    }).sort((left, right) => left.point.z - right.point.z);
  }, [items, rotation]);

  const root = nodes.find((node) => node.item.path === "/");
  const selected = nodes.find((node) => node.item.path === selectedPath);
  const guideNodes = nodes.filter((node) => node.item.group === "Guider");

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragged.current = false;
    dragStart.current = { x: event.clientX, y: event.clientY, rotationX: rotation.x, rotationY: rotation.y };
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!dragStart.current) return;
    const deltaX = event.clientX - dragStart.current.x;
    const deltaY = event.clientY - dragStart.current.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) dragged.current = true;
    setRotation({ x: Math.max(-0.72, Math.min(0.72, dragStart.current.rotationX - deltaY * 0.006)), y: dragStart.current.rotationY + deltaX * 0.006 });
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragStart.current = null;
  }

  return (
    <section className="seo-orbit-card" aria-labelledby="seo-orbit-title">
      <header className="seo-orbit-header">
        <div><p>Interaktiv 3D-översikt</p><h2 id="seo-orbit-title">Länkstruktur från startsidan</h2></div>
        <div className="seo-orbit-actions"><span>{items.length} URL:er</span><button type="button" onClick={() => setRotation({ x: -0.17, y: -0.45 })}><RotateCcw size={14} /> Återställ vy</button></div>
      </header>
      <div className="seo-orbit-stage">
        <svg className="seo-orbit" viewBox="0 0 800 476" role="application" aria-label="Interaktiv 3D-karta över webbplatsens URL:er. Dra för att rotera och välj en nod för detaljer." onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <defs>
            <radialGradient id="seo-orbit-glow"><stop stopColor="#2677ed" stopOpacity=".18" /><stop offset="1" stopColor="#2677ed" stopOpacity="0" /></radialGradient>
            <filter id="seo-orbit-shadow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10233f" floodOpacity=".2" /></filter>
          </defs>
          <ellipse className="seo-orbit-plane plane-one" cx="400" cy="238" rx="286" ry="125" />
          <ellipse className="seo-orbit-plane plane-two" cx="400" cy="238" rx="205" ry="88" />
          <circle cx="400" cy="238" r="172" fill="url(#seo-orbit-glow)" />
          {root && nodes.filter((node) => node.item.path !== "/").map((node) => <line key={`line-${node.item.path}`} className={`seo-orbit-link${node.item.group === "Lokala sidor" ? " local-link" : ""}${node.item.group === "Guider" ? " guide-link" : ""}`} x1={root.x} y1={root.y} x2={node.x} y2={node.y} style={{ opacity: Math.max(.11, Math.min(.56, (node.point.z + 126) / 290)) }} />)}
          {nodes.map((node) => {
            const isRoot = node.item.path === "/";
            const isSelected = node.item.path === selectedPath;
            const radius = (isRoot ? 15 : node.item.group === "Kärnsidor" ? 9 : node.item.group === "Guider" ? 6.3 : 5.3) * node.scale;
            const isGuide = node.item.group === "Guider";
            return <g key={node.item.path} className={`seo-orbit-node${isSelected ? " selected" : ""}${isRoot ? " root" : ""}${isGuide ? " guide-node" : ""}`} transform={`translate(${node.x} ${node.y})`} style={{ opacity: isSelected ? 1 : Math.max(.38, Math.min(1, (node.point.z + 130) / 185)) }} role="button" tabIndex={0} aria-label={`Välj ${node.item.label}`} onPointerDown={(event) => { event.stopPropagation(); onSelect(node.item.path); }} onClick={() => { if (!dragged.current) onSelect(node.item.path); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(node.item.path); } }}>
              <title>{node.item.label}</title>
              {isSelected && <circle className="seo-orbit-selected-ring" r={radius + 7} />}
              <circle r={radius} fill={GROUP_COLORS[node.item.group]} filter="url(#seo-orbit-shadow)" />
              {isRoot && <path d="M-5 -1h10M0-6v10" stroke="white" strokeWidth="2" strokeLinecap="round" />}
              {(isSelected || isRoot || node.item.group === "Kärnsidor") && <text className="seo-orbit-label" x={radius + 7} y="4">{node.item.label}</text>}
            </g>;
          })}
        </svg>
        <p className="seo-orbit-instruction">Dra för att rotera • Välj en nod för detaljer • Färg visar URL-typ</p>
      </div>
      {guideNodes.length > 0 && <section className="seo-guide-overview" aria-label="Översikt över guider"><header><span><i /> Elguiden</span><strong>{guideNodes.length - 1} artiklar</strong><small>Roterar i en egen lila 3D-bana</small></header><div>{guideNodes.filter((node) => node.item.path !== "/guider").map((node) => <button key={node.item.path} className={node.item.path === selectedPath ? "selected" : ""} type="button" onClick={() => onSelect(node.item.path)}><i /><span>{node.item.label}</span></button>)}</div></section>}
      <div className="seo-orbit-legend"><span><i className="core" /> Kärnsidor</span><span><i className="guides" /> Elguiden</span><span><i className="local" /> Lokala eljourssidor</span><span><i className="legal" /> Juridik</span><span><i className="technical" /> Tekniskt</span>{selected && <strong>Vald: {selected.item.label}</strong>}</div>
    </section>
  );
}
