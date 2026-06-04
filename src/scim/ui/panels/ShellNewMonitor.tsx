// Shell-Neu-Monitor (Studio-Monitor 2) — der Shell-Laufzeit-Container: rendert,
// wie die Shell diesenpark.com NEU baut, gespeist aus den Test-Stand-Switchern
// (Origin/Anthem). EINE geteilte Leaflet-Instanz (nicht pro Block). Heute das
// Gerüst: Karte + origin-boundary + origin-mesh (neutral). Funktion für Funktion
// rendert künftig hier hinein (colorize färbt das Mesh, container setzt POIs …).
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { geometryById } from '../../workspace/workspace.registry';
import { colorize } from '../../sensus/loadColour';
import type { Representation } from '../../workspace/workspace.types';
import type { OriginPackage } from '../../sensus/originPackage';

const W = 184, H = 372, BORDER = 9;

export default function ShellNewMonitor({ rep, originOn, originPkg, loads }: {
  rep: Representation; originOn: boolean; originPkg: OriginPackage | null; loads: number[] | null;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Karte einmal anlegen
  useEffect(() => {
    const el = elRef.current;
    if (!el || mapRef.current) return;
    const map = L.map(el, { zoomControl: false, attributionControl: false, preferCanvas: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.76 }).addTo(map);
    map.setView([48.2, 14.3], 11);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 60);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);

  // Origin rendern: boundary + mesh (neutral)
  useEffect(() => {
    const map = mapRef.current, layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!originOn) return;
    const geo = rep.geometry_id ? geometryById(rep.geometry_id) : undefined;
    const ring = (geo?.polygon ?? []) as [number, number][]; // [lon, lat]
    if (ring.length < 3) return;
    const latlng = ring.map(([lon, lat]) => [lat, lon]) as [number, number][];
    const poly = L.polygon(latlng, { color: '#4a6a8a', weight: 1.5, fill: false }).addTo(layer);
    // origin-mesh: neutral, oder — sobald Anthem-Last da ist — colorize je Segment
    // (das ist „colorize ins Monitor 2 hineingebaut"). Flach je Segment; der Gradient
    // ist render-features (dokumentiert, nicht live).
    const net = originPkg?.originNet;
    if (net) {
      let idx = 0;
      for (const s of net.stretches) {
        for (let i = 1; i < s.points.length; i++) {
          const load = loads ? (loads[idx] ?? 0) : null;
          idx++;
          const color = load != null ? colorize(load) : '#718096';
          L.polyline([s.points[i - 1], s.points[i]] as L.LatLngExpression[], {
            color, weight: load != null ? 3 : 2, opacity: load != null ? 0.95 : 0.7, lineCap: 'round',
          }).addTo(layer);
        }
      }
    }
    map.fitBounds(poly.getBounds(), { padding: [14, 14] });
  }, [originOn, originPkg, rep, loads]);

  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ fontSize: 9.5, color: '#276749', textAlign: 'center', marginBottom: 3, fontWeight: 700 }}>Shell-Neu · aus Origin/Anthem</div>
      <div style={{ width: W, height: H, borderRadius: 26, border: `${BORDER}px solid #1a202c`, background: '#0f1722', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.22)' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 60, height: 12, background: '#1a202c', borderRadius: '0 0 10px 10px', zIndex: 500 }} />
        <div ref={elRef} style={{ width: '100%', height: '100%' }} />
        {!originOn && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a6a8a', fontSize: 10.5, fontStyle: 'italic', textAlign: 'center', padding: 16, pointerEvents: 'none' }}>
            Origin einschalten →<br />die Shell rendert hier
          </div>
        )}
      </div>
    </div>
  );
}
