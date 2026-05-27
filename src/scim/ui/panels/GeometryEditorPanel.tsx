// Geometry-Editor Panel — Wave 2b.
//
// Vollbild-Karte (Leaflet + Geoman) zum Zeichnen und Editieren von Boundary-
// Geometrien. Mit POI-Overlay aus einem ausgewaehlten Katalog (Operator zieht
// Polygon visuell um die existierenden POIs herum).
//
// Speicherung: kein direkter Schreibzugriff aufs Repo aus dem Browser. Statt-
// dessen Export-Modal mit GeoJSON-Inhalt, den der Operator in
// data/geometries/<id>.json paste-t und committed (gleiche Pattern wie
// Katalog-Export).
//
// Persistenz waehrend der Sitzung: localStorage als Draft-Speicher pro
// Geometry-ID, ueberlebt Reloads.

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import type { Position } from 'geojson';
import { GEOMETRIES } from '../../workspace/workspace.registry';
import { parsePoiCatalog } from '../../poi-catalog/poiCatalog.parser';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import gruenbergMd from '../../../../data/grunberg_pois_plan.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import lichtenbergMd from '../../../../data/lichtenberg_pois_plan.md?raw';

const CATALOGS = [
  { id: 'gruenberg', name: 'Grünberg', md: gruenbergMd as string },
  { id: 'lichtenberg', name: 'Lichtenberg', md: lichtenbergMd as string },
];

const DRAFT_KEY = 'scim3_geometry_draft';
const P01_LEGACY_KEY = 'scim3_representation';

interface Draft {
  geometryId: string | 'new';
  name: string;
  region: string;
  polygon: Position[] | null;
}

// Legacy P01 stored polygon as [lat, lon][] (umgekehrt zu GeoJSON [lon, lat]).
// Hier konvertieren wir auf die GeoJSON-Konvention.
function readP01LegacyPolygon(): { name: string; polygon: Position[] | null } | null {
  try {
    const raw = localStorage.getItem(P01_LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { name?: string; polygon?: [number, number][] | null };
    if (!parsed || !parsed.name) return null;
    const ring = parsed.polygon ?? null;
    if (!ring) return { name: parsed.name, polygon: null };
    // [lat, lon] -> [lon, lat]
    const geo: Position[] = ring.map(([lat, lon]) => [lon, lat]);
    return { name: parsed.name, polygon: geo };
  } catch {
    return null;
  }
}

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { geometryId: 'new', name: '', region: '', polygon: null };
}

function saveDraft(d: Draft): void {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

// ─── Hauptpanel ─────────────────────────────────────────────────────────────

export default function GeometryEditorPanel() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Layer | null>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);

  const initial = useMemo(loadDraft, []);
  const legacyP01 = useMemo(readP01LegacyPolygon, []);
  const [geometryId, setGeometryId] = useState<string | 'new'>(initial.geometryId);
  const [name, setName] = useState(initial.name);
  const [region, setRegion] = useState(initial.region);
  const [polygon, setPolygon] = useState<Position[] | null>(initial.polygon);
  const [overlayCatalogId, setOverlayCatalogId] = useState<string>('');
  const [showExport, setShowExport] = useState(false);

  // Draft auto-save
  useEffect(() => {
    saveDraft({ geometryId, name, region, polygon });
  }, [geometryId, name, region, polygon]);

  // Map init (one-shot)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [47.9, 13.8],
      zoom: 13,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      opacity: 0.75,
    }).addTo(map);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map as any).pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    });

    map.on('pm:create', (e: L.LeafletEvent) => {
      if (polygonLayerRef.current) map.removeLayer(polygonLayerRef.current);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = (e as any).layer as L.Polygon;
      polygonLayerRef.current = layer;
      const geo = layer.toGeoJSON();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ring = (geo.geometry as any).coordinates[0] as Position[];
      setPolygon(ring);
    });

    map.on('pm:remove', () => {
      polygonLayerRef.current = null;
      setPolygon(null);
    });

    // Edit events update state
    map.on('pm:edit', () => {
      if (!polygonLayerRef.current) return;
      const geo = (polygonLayerRef.current as L.Polygon).toGeoJSON();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ring = (geo.geometry as any).coordinates[0] as Position[];
      setPolygon(ring);
    });

    poiLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Initial polygon
    if (polygon && polygon.length >= 3) {
      const latlngs = polygon.map(([lng, lat]) => [lat, lng] as [number, number]);
      const poly = L.polygon(latlngs, { color: '#0074d9' }).addTo(map);
      polygonLayerRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [30, 30] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      polygonLayerRef.current = null;
      poiLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Map nach Container-Resize einladen (sonst sind Tiles weiss)
  useEffect(() => {
    setTimeout(() => mapRef.current?.invalidateSize(), 200);
  }, []);

  // P01-Legacy-Polygon in den Editor uebernehmen (Migrations-Helper).
  // Ueberschreibt aktuellen Stand — User-Bestaetigung vor Aufruf.
  const onLoadP01Legacy = () => {
    if (!legacyP01 || !legacyP01.polygon) return;
    const map = mapRef.current;
    if (!map) return;
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    setGeometryId('new');
    setName(legacyP01.name);
    setRegion('');
    setPolygon(legacyP01.polygon);
    const latlngs = legacyP01.polygon.map(([lng, lat]) => [lat, lng] as [number, number]);
    const poly = L.polygon(latlngs, { color: '#0074d9' }).addTo(map);
    polygonLayerRef.current = poly;
    map.fitBounds(poly.getBounds(), { padding: [30, 30] });
  };

  // Geometry-Wechsel laedt neue Daten in die Map
  const onChangeGeometry = (id: string | 'new') => {
    setGeometryId(id);
    const map = mapRef.current;
    if (!map) return;
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    if (id === 'new') {
      setName('');
      setRegion('');
      setPolygon(null);
    } else {
      const g = GEOMETRIES.find((x) => x.id === id);
      if (!g) return;
      setName(g.name);
      setRegion(g.region ?? '');
      setPolygon(g.polygon);
      const latlngs = g.polygon.map(([lng, lat]) => [lat, lng] as [number, number]);
      const poly = L.polygon(latlngs, { color: '#0074d9' }).addTo(map);
      polygonLayerRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [30, 30] });
    }
  };

  // POI-Overlay anhand des Katalogs aktualisieren
  useEffect(() => {
    const map = mapRef.current;
    const layer = poiLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!overlayCatalogId) return;
    const cat = CATALOGS.find((c) => c.id === overlayCatalogId);
    if (!cat) return;
    const parsed = parsePoiCatalog(cat.md, {
      region_id: cat.id,
      region_name: cat.name,
      source_path: `data/${cat.id}_pois_plan.md`,
    });
    for (const p of parsed.pois) {
      if (!p.coord || (p.coord[0] === 0 && p.coord[1] === 0)) continue;
      const marker = L.circleMarker([p.coord[1], p.coord[0]], {
        radius: 4,
        color: '#c8389b',
        weight: 2,
        fillColor: '#fff',
        fillOpacity: 0.9,
      });
      marker.bindTooltip(p.text, { direction: 'top', offset: [0, -8], opacity: 0.9 });
      marker.addTo(layer);
    }
  }, [overlayCatalogId]);

  // Export-JSON erzeugen
  const exportJson = useMemo(() => {
    if (!polygon || polygon.length < 3) return null;
    const ring = [...polygon];
    // Polygon-Ring schliessen
    if (
      ring[0][0] !== ring[ring.length - 1][0] ||
      ring[0][1] !== ring[ring.length - 1][1]
    ) ring.push(ring[0]);
    return JSON.stringify({
      type: 'Feature',
      properties: {
        name: name || 'Unbenannt',
        region: region || undefined,
        source: 'Operator-gezeichnet in SCIM Geometry-Editor',
        drawn_at: new Date().toISOString().slice(0, 10),
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
    }, null, 2);
  }, [polygon, name, region]);

  const proposedFileName = (
    geometryId === 'new'
      ? (name || 'unbenannt')
          .toLowerCase()
          .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] ?? c))
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      : geometryId
  ) + '.json';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, sans-serif' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
        background: '#f7fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap',
      }}>
        <label style={{ fontSize: 11, color: '#4a5568' }}>Geometrie:</label>
        <select
          value={geometryId}
          onChange={(e) => onChangeGeometry(e.target.value as string)}
          style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0' }}
        >
          <option value="new">— Neu —</option>
          {GEOMETRIES.map((g) => (
            <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
          ))}
        </select>

        <label style={{ fontSize: 11, color: '#4a5568', marginLeft: 8 }}>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Lichtenberg"
          style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0', width: 140 }}
        />

        <label style={{ fontSize: 11, color: '#4a5568' }}>Region:</label>
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="z.B. Gmunden"
          style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0', width: 120 }}
        />

        {legacyP01 && legacyP01.polygon && (
          <button
            onClick={() => {
              if (confirm(`P01-Polygon "${legacyP01.name}" (${legacyP01.polygon!.length} Punkte) übernehmen? Der aktuelle Editor-Stand wird überschrieben.`)) {
                onLoadP01Legacy();
              }
            }}
            style={{
              fontSize: 11, padding: '3px 10px', cursor: 'pointer',
              border: '1px solid #f6ad55', borderRadius: 4,
              background: '#fffbeb', color: '#7c2d12',
            }}
            title="Polygon aus P01-localStorage (Legacy) in den Editor laden"
          >
            ↓ P01 übernehmen
          </button>
        )}

        <span style={{ flex: 1 }} />

        <label style={{ fontSize: 11, color: '#4a5568' }}>POI-Overlay:</label>
        <select
          value={overlayCatalogId}
          onChange={(e) => setOverlayCatalogId(e.target.value)}
          style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0' }}
        >
          <option value="">— kein —</option>
          {CATALOGS.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowExport(true)}
          disabled={!polygon || polygon.length < 3}
          style={{
            fontSize: 12, padding: '4px 14px',
            cursor: (!polygon || polygon.length < 3) ? 'not-allowed' : 'pointer',
            border: '1px solid #2f855a', borderRadius: 4, fontWeight: 600,
            background: (!polygon || polygon.length < 3) ? '#cbd5e0' : '#2f855a',
            color: '#fff',
          }}
        >
          ⬇ Export
        </button>
      </div>

      {/* Map */}
      <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0 }} />

      {/* Status */}
      <div style={{
        padding: '4px 12px', fontSize: 11, fontFamily: 'monospace',
        background: '#f7fafc', borderTop: '1px solid #e2e8f0',
      }}>
        {polygon ? (
          <span style={{ color: '#38a169' }}>
            ✓ Polygon mit {polygon.length} Punkten
          </span>
        ) : (
          <span style={{ color: '#a0aec0' }}>Polygon-Werkzeug oben links wählen und zeichnen</span>
        )}
        {overlayCatalogId && (
          <span style={{ marginLeft: 16, color: '#c8389b' }}>
            ● POI-Overlay: {CATALOGS.find((c) => c.id === overlayCatalogId)?.name}
          </span>
        )}
      </div>

      {/* Export-Modal */}
      {showExport && exportJson && (
        <ExportModal
          fileName={proposedFileName}
          json={exportJson}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

// ─── Export-Modal ───────────────────────────────────────────────────────────

function ExportModal({ fileName, json, onClose }: { fileName: string; json: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: 6, width: 'min(720px, 92vw)',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a365d' }}>Geometry exportieren</div>
            <div style={{ fontSize: 11, color: '#718096', marginTop: 2, fontFamily: 'monospace' }}>
              Datei: data/geometries/{fileName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onCopy}
              style={{
                fontSize: 11, padding: '4px 12px', cursor: 'pointer',
                border: '1px solid #2b6cb0', background: copied ? '#2b6cb0' : 'white',
                color: copied ? 'white' : '#2b6cb0', borderRadius: 4, fontWeight: 600,
              }}
            >
              {copied ? '✓ kopiert' : 'In Zwischenablage'}
            </button>
            <button
              onClick={onClose}
              style={{
                fontSize: 11, padding: '4px 12px', cursor: 'pointer',
                border: '1px solid #cbd5e0', background: 'white', borderRadius: 4,
              }}
            >
              Schließen
            </button>
          </div>
        </div>
        <pre style={{
          flex: 1, overflow: 'auto', padding: '12px 16px', margin: 0,
          fontSize: 11, fontFamily: 'monospace', color: '#2d3748',
          background: '#f7fafc',
        }}>{json}</pre>
        <div style={{
          padding: '8px 16px', fontSize: 11, color: '#7c2d12',
          background: '#fff5f0', borderTop: '1px solid #fed7aa',
        }}>
          Kopiere den Inhalt in eine neue Datei <code>data/geometries/{fileName}</code> im Repo und committe sie.
          Nach dem nächsten Deploy ist die Geometry im Workspace sichtbar.
        </div>
      </div>
    </div>
  );
}
