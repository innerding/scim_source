// P08 · Deep-Shell · Engine-Funktion 1 — die Karten-Engine (Leaflet + OSM).
// Die erste SICHTBARE Engine-Funktion der Deep-Shell: OSM-Tiles via Leaflet,
// fokussiert auf die Boundary der Auftraggeber-Rep. Laufzeit liegt auf der Ziel-App
// (R07 Karte & Guidance); hier die Build-/Vorschau-Seite. Reveal/Intro = Funktion 2.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuftraggeberRep } from '../../../runtime/useAuftraggeberRep';
import { geometryById } from '../../workspace/workspace.registry';

export default function DeepShellMap() {
  const rep = useAuftraggeberRep();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const boundaryRef = useRef<L.Polygon | null>(null);

  // Karte einmal mounten (+ ResizeObserver → invalidateSize, wie beim Inspector).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;
    const map = L.map(el, { zoomControl: true, preferCanvas: true });
    mapRef.current = map;
    map.setView([48.0, 14.0], 7); // Fallback, bis fitBounds greift
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    const ro = new ResizeObserver(() => { if (el.clientWidth > 0) map.invalidateSize(); });
    ro.observe(el);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; boundaryRef.current = null; };
  }, []);

  // Auf die Auftraggeber-Rep fokussieren + ihre Boundary zeichnen.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    boundaryRef.current?.remove();
    boundaryRef.current = null;
    const ring = geometryById(rep.geometry_id)?.polygon ?? [];
    if (ring.length >= 3) {
      const latlngs = ring.map(([lon, lat]) => [lat, lon] as [number, number]);
      const poly = L.polygon(latlngs, { color: '#2b6cb0', weight: 2, fillColor: '#2b6cb0', fillOpacity: 0.06 }).addTo(map);
      boundaryRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [24, 24] });
    }
  }, [rep.id, rep.geometry_id]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ flex: '0 0 auto', marginBottom: 8 }}>
        <div style={{
          display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
          color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
        }}>
          P08 · Deep-Shell · Engine-Funktion 1 · Karte (Leaflet + OSM)
        </div>
        <p style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5, margin: '6px 0 0', maxWidth: 580 }}>
          Die erste sichtbare <strong>Engine-Funktion</strong> der Deep-Shell: die <strong>Karten-Engine</strong>
          (Leaflet + OSM-Tiles), fokussiert auf „{rep.name}". Laufzeit liegt auf der Ziel-App (R07 Karte &amp; Guidance);
          hier die Build-/Vorschau-Seite. <em>Funktion 2 folgt: Intro/Boundary-Reveal.</em>
        </p>
      </div>
      <div ref={containerRef} style={{ flex: '1 1 auto', minHeight: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }} />
    </div>
  );
}
