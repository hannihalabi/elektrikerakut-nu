"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, MapPin, Navigation, Radar } from "lucide-react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { areaCoordinates } from "../../eljour/area-coordinates";
import type { ServiceArea } from "../../eljour/areas";

const FALLBACK_COORDINATE: readonly [number, number] = [59.3293, 18.0686];

function coordinateFor(area: ServiceArea) {
  return areaCoordinates[area.slug] ?? FALLBACK_COORDINATE;
}

export function SeoCoverageMap({ areas, origin, selectedPath, onSelect }: { areas: ServiceArea[]; origin: string; selectedPath?: string; onSelect: (path: string) => void }) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRefs = useRef(new Map<string, Marker>());
  const selectedPathRef = useRef(selectedPath);
  const selected = areas.find((area) => `/eljour/${area.slug}` === selectedPath);
  const municipalities = new Set(areas.map((area) => area.municipality)).size;

  useEffect(() => {
    selectedPathRef.current = selectedPath;
    markerRefs.current.forEach((marker, path) => {
      marker.getElement()?.classList.toggle("is-selected", path === selectedPath);
    });
  }, [selectedPath]);

  useEffect(() => {
    const mapElement = mapElementRef.current;
    if (!mapElement) return;

    let cancelled = false;
    const markers = markerRefs.current;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapElement) return;

      const map = L.map(mapElement, { attributionControl: true, scrollWheelZoom: false, zoomControl: false });
      mapRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare',
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      areas.forEach((area) => {
        const [latitude, longitude] = coordinateFor(area);
        const path = `/eljour/${area.slug}`;
        bounds.extend([latitude, longitude]);
        const marker = L.marker([latitude, longitude], {
          icon: L.divIcon({ className: `seo-coverage-marker${path === selectedPathRef.current ? " is-selected" : ""}`, html: "<span></span>", iconSize: [16, 16], iconAnchor: [8, 8], tooltipAnchor: [0, -10] }),
          keyboard: true,
          title: `Eljour ${area.name}`,
        }).addTo(map);
        marker.bindTooltip(`<strong>Eljour ${area.name}</strong><br>${area.municipality}`, { direction: "top", opacity: .96 });
        marker.on("click", () => onSelect(path));
        markers.set(path, marker);
      });

      map.fitBounds(bounds, { padding: [26, 26], maxZoom: 10 });
      window.setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [areas, onSelect]);

  return <section className="seo-coverage-card" aria-labelledby="seo-coverage-title">
    <header className="seo-coverage-header"><div><p>Geografisk täckning</p><h2 id="seo-coverage-title">Lokala eljourssidor i Stockholm med omnejd</h2></div><span><Radar size={15} /> {areas.length} områden</span></header>
    <div className="seo-coverage-layout">
      <div className="seo-coverage-map">
        <div ref={mapElementRef} className="seo-leaflet-map" role="application" aria-label="Interaktiv karta över områden med lokala eljourssidor" />
        <p><MapPin size={14} /> Varje punkt använder områdets verkliga geografiska position. Zooma eller välj en punkt för URL-detaljer.</p>
      </div>
      <aside className="seo-coverage-detail" aria-live="polite">
        {selected ? <><div><Navigation size={15} /> Vald områdessida</div><h3>Eljour {selected.name}</h3><p>{selected.municipality}</p><code>/eljour/{selected.slug}</code><a href={`${origin}/eljour/${selected.slug}`} target="_blank" rel="noreferrer">Öppna lokal sida <ArrowUpRight size={14} /></a></> : <><div><MapPin size={15} /> Täckningsöversikt</div><h3>{areas.length} lokala sidor</h3><p>Områden i {municipalities} kommuner och stadsområden runt Stockholm.</p><span>Välj en punkt på kartan för att se sidan.</span></>}
      </aside>
    </div>
  </section>;
}
