// Karten-Oberfläche (Leaflet + OSM) — die SURFACE der Funktion „Karte" im Shell-
// Studio (High-Lane, im Device-Frame). OSM-Tiles, fokussiert auf die Boundary der
// Auftraggeber-Rep. Laufzeit liegt auf der Ziel-App (R07). Der zugehörige CODE steht
// in der Deep-Lane des Studios. Reveal/Intro = nächste Funktion.
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

  // Bare Karten-Oberfläche — füllt ihren Container (z.B. ein Device-Frame im
  // Shell-Studio). Kontext/Titel liefert der Studio-Block drumherum.
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
