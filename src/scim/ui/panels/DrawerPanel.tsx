// Drawer-Panel (ann_072, Phase 1+2) — frueher Geometry-Editor.
//
// Zwei interne Tabs auf einem gemeinsamen Leaflet-Canvas:
//   Umriss  — Boundary-Geometrie zeichnen/editieren/committen (Funktion 1:1
//             wie der fruehere Geometry-Editor)
//   Wegnetz — konfigurierbares Wanderwegnetz aus OSM (Filter-Menue). In
//             Phase 2 nur UI + localStorage-Persistenz, keine Ableitungs-
//             Wirkung. Engine folgt ab Phase 3.
//
// Der Tab-Wechsel re-initialisiert die Karte NICHT — Map-Init und View-State
// sind shared, nur die aktiven Werkzeuge/Layer wechseln.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import type { Position } from 'geojson';
import { GEOMETRIES } from '../../workspace/workspace.registry';
import { parsePoiCatalog } from '../../poi-catalog/poiCatalog.parser';
import RepresentBuildTetrahedron from '../RepresentBuildTetrahedron';
import type { RepresentBuildFace } from '../RepresentBuildTetrahedron';
import { useInspectorView } from '../../../runtime/repContext';
import { commitToRepo, type CommitResult } from '../../../runtime/commitBridge';
import {
  loadPathConfig, savePathConfig, type PathConfig, type BridlewayMode,
} from '../../regio-content/pathConfig';
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

export const DRAFT_KEY = 'scim3_geometry_draft';

type DrawerTab = 'umriss' | 'wegnetz';

interface Draft {
  geometryId: string | 'new';
  name: string;
  region: string;
  polygon: Position[] | null;
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

// Geoman-Werkzeugleiste fuer den Umriss-Tab. Wird beim Tab-Wechsel
// hinzugefuegt/entfernt, damit die Zeichen-Controls im Wegnetz-Tab nicht
// stoeren.
function addBoundaryControls(map: L.Map): void {
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
}

// ─── Hauptpanel ─────────────────────────────────────────────────────────────

interface Props {
  onJumpTo: (panelId: string) => void;
}

export default function DrawerPanel({ onJumpTo }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Layer | null>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);
  const inspectorRefRef = useRef<L.Polygon | null>(null);

  const [tab, setTab] = useState<DrawerTab>('umriss');

  // Inspector-Compare: das Polygon der vom Inspector gezeigten R kann
  // als read-only Referenz in Violett unter den Editor gelegt werden
  // (Tracing-Vorlage). Toggle separat, default aus.
  const inspectorView = useInspectorView();
  const [showInspectorRef, setShowInspectorRef] = useState(false);

  const initial = useMemo(loadDraft, []);
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

  // Map init (one-shot) — bleibt ueber Tab-Wechsel erhalten
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [47.9, 13.8],
      zoom: 13,
      scrollWheelZoom: true,
      zoomSnap: 0,
      zoomDelta: 1,
      wheelPxPerZoomLevel: 3,
      wheelDebounceTime: 0,
      preferCanvas: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      fadeAnimation: true,
      inertia: true,
      inertiaDeceleration: 2500,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      opacity: 0.75,
    }).addTo(map);

    // Zeichen-Controls nur im Umriss-Tab (Init startet dort).
    addBoundaryControls(map);

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

  // Tab-Wechsel: Zeichen-Controls nur im Umriss-Tab, Karte neu vermessen
  // (Toolbar/Side-Panel aendern die Container-Groesse).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pm = (map as any).pm;
    if (tab === 'umriss') {
      if (!pm.controlsVisible?.()) addBoundaryControls(map);
    } else {
      pm.removeControls?.();
    }
    setTimeout(() => map.invalidateSize(), 60);
  }, [tab]);

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

  // Inspector-Referenz-Polygon (violett, read-only) ein-/ausblenden.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    if (inspectorRefRef.current) {
      map.removeLayer(inspectorRefRef.current);
      inspectorRefRef.current = null;
    }
    if (!showInspectorRef || !inspectorView) return undefined;
    const ring = inspectorView.geometry.polygon;
    if (!ring || ring.length < 3) return undefined;
    const latlngs = ring.map(([lng, lat]) => [lat, lng] as [number, number]);
    const layer = L.polygon(latlngs, {
      color: '#8b3fbf',
      weight: 1.5,
      opacity: 0.85,
      fillOpacity: 0.04,
      dashArray: '4 3',
      interactive: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pmIgnore: true as any,
    });
    layer.addTo(map);
    inspectorRefRef.current = layer;
    return () => {
      if (inspectorRefRef.current) {
        map.removeLayer(inspectorRefRef.current);
        inspectorRefRef.current = null;
      }
    };
  }, [showInspectorRef, inspectorView]);

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
    if (
      ring[0][0] !== ring[ring.length - 1][0] ||
      ring[0][1] !== ring[ring.length - 1][1]
    ) ring.push(ring[0]);
    return JSON.stringify({
      type: 'Feature',
      properties: {
        name: name || 'Unbenannt',
        region: region || undefined,
        source: 'Operator-gezeichnet in SCIM Drawer (Umriss)',
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

  const onTetraFace = (f: RepresentBuildFace) => {
    if (f === 'geometry_draw') onJumpTo('geometry_editor');
    else if (f === 'catalog_magazination') onJumpTo('catalog');
    else if (f === 'represent_organisation') onJumpTo('workspace');
    else if (f === 'sensus_core_build') onJumpTo('P11');
  };
  const onTetraArc = (a: string) => {
    if (a === 'system_adjust') onJumpTo('P01');
    else if (a === 'regio_content') onJumpTo('P02');
    else if (a === 'load_thresholds') onJumpTo('P09');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, sans-serif' }}>
      {/* Tab-Strip Umriss / Wegnetz */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px 0',
        background: '#edf2f7', borderBottom: '1px solid #e2e8f0',
      }}>
        <div title="Represent Build · Seite 1 · Geometry Draw" style={{ flexShrink: 0, marginRight: 4, marginBottom: 4 }}>
          <RepresentBuildTetrahedron
            activeFace="geometry_draw"
            variant="light"
            onFaceClick={onTetraFace}
            onArcClick={onTetraArc}
            size={36}
          />
        </div>
        {([
          { id: 'umriss', label: '◇ Umriss' },
          { id: 'wegnetz', label: '⋔ Wegnetz' },
        ] as { id: DrawerTab; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontSize: 12, padding: '6px 16px', cursor: 'pointer',
              border: '1px solid #cbd5e0', borderBottom: 'none',
              borderTopLeftRadius: 5, borderTopRightRadius: 5,
              fontWeight: tab === t.id ? 700 : 400,
              background: tab === t.id ? '#f7f9fc' : '#e2e8f0',
              color: tab === t.id ? '#1a365d' : '#718096',
              marginBottom: tab === t.id ? -1 : 0,
            }}
          >
            {t.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        {tab === 'wegnetz' && (
          <span style={{ fontSize: 10, color: '#a0aec0', fontStyle: 'italic', marginBottom: 4 }}>
            Phase 2 · Konfiguration ohne Ableitungs-Wirkung
          </span>
        )}
      </div>

      {/* Umriss-Toolbar (nur im Umriss-Tab) */}
      {tab === 'umriss' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
          background: '#f7fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap',
        }}>
          <label style={{ fontSize: 11, color: '#4a5568' }}>Bearbeite:</label>
          <select
            value={geometryId}
            onChange={(e) => onChangeGeometry(e.target.value as string)}
            style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0' }}
          >
            <option value="new">— Neu zeichnen —</option>
            {GEOMETRIES.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
            ))}
          </select>

          <label style={{
            fontSize: 11, color: geometryId === 'new' ? '#c05621' : '#4a5568',
            marginLeft: 8, fontWeight: geometryId === 'new' ? 700 : 400,
          }}>
            {geometryId === 'new' ? 'Name (neu) →' : 'Name:'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Lichtenberg"
            style={{
              fontSize: 12, padding: '3px 6px', borderRadius: 4,
              border: geometryId === 'new' ? '1px solid #ed8936' : '1px solid #cbd5e0',
              width: 140,
              background: geometryId === 'new' ? '#fffaf0' : 'white',
            }}
          />

          <label style={{ fontSize: 11, color: '#4a5568' }}>Region:</label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="z.B. Gmunden"
            style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0', width: 120 }}
          />

          <span style={{ flex: 1 }} />

          <label
            style={{
              fontSize: 11, color: showInspectorRef ? '#8b3fbf' : '#4a5568',
              display: 'flex', alignItems: 'center', gap: 4, cursor: inspectorView ? 'pointer' : 'not-allowed',
              opacity: inspectorView ? 1 : 0.5,
            }}
            title={inspectorView
              ? `Polygon der Inspector-R "${inspectorView.representation.name}" als violetter Referenz-Outline (read-only)`
              : 'Inspector zeigt aktuell keine R — im rechten Header eine auswaehlen'}
          >
            <input
              type="checkbox"
              checked={showInspectorRef}
              disabled={!inspectorView}
              onChange={(e) => setShowInspectorRef(e.target.checked)}
              style={{ cursor: inspectorView ? 'pointer' : 'not-allowed' }}
            />
            Inspector-R einblenden
          </label>

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
      )}

      {/* Inhaltszeile: optionales Wegnetz-Filtermenue + gemeinsamer Map-Canvas */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {tab === 'wegnetz' && (
          <PathFilterMenu
            gebiet={inspectorView?.geometry.id ?? ''}
            gebietLabel={inspectorView?.geometry.name ?? ''}
            onResized={() => setTimeout(() => mapRef.current?.invalidateSize(), 60)}
          />
        )}
        <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0, minWidth: 0 }} />
      </div>

      {/* Status (nur Umriss-Tab) */}
      {tab === 'umriss' && (
        <div style={{
          padding: '4px 12px', fontSize: 11, fontFamily: 'monospace',
          background: '#f7fafc', borderTop: '1px solid #e2e8f0',
        }}>
          {polygon ? (
            <span style={{ color: '#38a169' }}>✓ Polygon mit {polygon.length} Punkten</span>
          ) : (
            <span style={{ color: '#a0aec0' }}>Polygon-Werkzeug oben links wählen und zeichnen</span>
          )}
          {overlayCatalogId && (
            <span style={{ marginLeft: 16, color: '#c8389b' }}>
              ● POI-Overlay: {CATALOGS.find((c) => c.id === overlayCatalogId)?.name}
            </span>
          )}
        </div>
      )}

      {/* Export-Modal */}
      {showExport && exportJson && (
        <ExportModal
          fileName={proposedFileName}
          json={exportJson}
          onClose={() => setShowExport(false)}
          onCommitted={() => {
            try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
          }}
        />
      )}
    </div>
  );
}

// ─── Wegnetz-Filter-Menue (Phase 2: UI + localStorage, keine Wirkung) ─────────

function PathFilterMenu({
  gebiet, gebietLabel, onResized,
}: {
  gebiet: string;
  gebietLabel: string;
  onResized: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [cfg, setCfg] = useState<PathConfig>(() => loadPathConfig(gebiet));
  const [savedFlash, setSavedFlash] = useState(false);

  // Bei Gebietswechsel (andere Inspector-R) neue Config laden
  useEffect(() => { setCfg(loadPathConfig(gebiet)); }, [gebiet]);

  // Auto-Save bei jeder Aenderung
  useEffect(() => {
    if (!gebiet) return;
    savePathConfig({ ...cfg, gebiet });
  }, [cfg, gebiet]);

  const update = (fn: (c: PathConfig) => PathConfig) => setCfg((c) => fn(c));

  if (collapsed) {
    return (
      <div
        onClick={() => { setCollapsed(false); onResized(); }}
        title="Filter-Menü ausklappen"
        style={{
          width: 18, flexShrink: 0, cursor: 'pointer',
          background: '#edf2f7', borderRight: '1px solid #cbd5e0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#718096', fontSize: 12,
        }}
      >
        ▸
      </div>
    );
  }

  return (
    <div style={{
      width: 290, flexShrink: 0, overflowY: 'auto',
      background: '#f7fafc', borderRight: '1px solid #cbd5e0',
      fontSize: 12, color: '#2d3748',
    }}>
      {/* Kopf */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', borderBottom: '1px solid #e2e8f0', background: '#edf2f7',
        position: 'sticky', top: 0, zIndex: 1,
      }}>
        <span style={{ fontWeight: 700, color: '#1a365d' }}>Wegnetz-Filter</span>
        <button
          onClick={() => { setCollapsed(true); onResized(); }}
          title="Einklappen"
          style={{
            fontSize: 12, padding: '2px 8px', cursor: 'pointer',
            border: '1px solid #cbd5e0', borderRadius: 4, background: 'white', color: '#718096',
          }}
        >
          ◂
        </button>
      </div>

      {!gebiet && (
        <div style={{
          margin: 10, padding: '8px 10px', fontSize: 11, lineHeight: 1.5,
          background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 5, color: '#7c2d12',
        }}>
          Keine Region aktiv. Im rechten Inspector-Header eine Representation
          wählen — ihr Gebiet liefert den Konfig-Kontext.
        </div>
      )}

      <Section title="Region">
        <div style={{ padding: '0 10px 4px', fontSize: 12 }}>
          {gebiet
            ? <span><strong>{gebietLabel}</strong> <span style={{ color: '#a0aec0', fontFamily: 'monospace' }}>({gebiet})</span></span>
            : <span style={{ color: '#a0aec0' }}>— aus Inspector —</span>}
        </div>
      </Section>

      <Section title="Primäre Wegklassen">
        {([
          ['track', 'Forst-/Wirtschaftsweg (track)'],
          ['footway', 'Fußweg (footway)'],
          ['path', 'Pfad (path)'],
          ['steps', 'Treppe (steps)'],
          ['pedestrian', 'Fußgängerbereich (pedestrian)'],
        ] as [keyof PathConfig['primaere_wege'], string][]).map(([key, label]) => (
          <Check
            key={key}
            label={label}
            checked={cfg.primaere_wege[key] === true}
            onChange={(v) => update((c) => ({ ...c, primaere_wege: { ...c.primaere_wege, [key]: v } }))}
          />
        ))}
        {/* bridleway: tri-state */}
        <div style={{ padding: '3px 10px' }}>
          <label style={{ display: 'block', marginBottom: 3 }}>Reitweg (bridleway)</label>
          <select
            value={String(cfg.primaere_wege.bridleway)}
            onChange={(e) => {
              const raw = e.target.value;
              const val: BridlewayMode = raw === 'true' ? true : raw === 'false' ? false : 'nur_wenn_foot_erlaubt';
              update((c) => ({ ...c, primaere_wege: { ...c.primaere_wege, bridleway: val } }));
            }}
            style={{ width: '100%', fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0' }}
          >
            <option value="nur_wenn_foot_erlaubt">nur wenn Fußverkehr erlaubt</option>
            <option value="true">immer aufnehmen</option>
            <option value="false">nie aufnehmen</option>
          </select>
        </div>
      </Section>

      <Section title="Konnektoren">
        <Connector
          label="Nebenstraße"
          hint="service · residential · living_street · unclassified"
          aktiv={cfg.konnektoren.nebenstrasse.aktiv}
          max={cfg.konnektoren.nebenstrasse.max_laenge_meter}
          onAktiv={(v) => update((c) => ({ ...c, konnektoren: { ...c.konnektoren, nebenstrasse: { ...c.konnektoren.nebenstrasse, aktiv: v } } }))}
          onMax={(v) => update((c) => ({ ...c, konnektoren: { ...c.konnektoren, nebenstrasse: { ...c.konnektoren.nebenstrasse, max_laenge_meter: v } } }))}
        />
        <Connector
          label="Landstraße"
          hint="tertiary · secondary · primary"
          aktiv={cfg.konnektoren.landstrasse.aktiv}
          max={cfg.konnektoren.landstrasse.max_laenge_meter}
          onAktiv={(v) => update((c) => ({ ...c, konnektoren: { ...c.konnektoren, landstrasse: { ...c.konnektoren.landstrasse, aktiv: v } } }))}
          onMax={(v) => update((c) => ({ ...c, konnektoren: { ...c.konnektoren, landstrasse: { ...c.konnektoren.landstrasse, max_laenge_meter: v } } }))}
        />
      </Section>

      <Section title="Ausschlüsse">
        <Check
          label="foot=no"
          checked={cfg.ausschluesse.foot_no}
          onChange={(v) => update((c) => ({ ...c, ausschluesse: { ...c.ausschluesse, foot_no: v } }))}
        />
        <Check
          label="access=private"
          checked={cfg.ausschluesse.access_private}
          onChange={(v) => update((c) => ({ ...c, ausschluesse: { ...c.ausschluesse, access_private: v } }))}
        />
        <Check
          label="access=no"
          checked={cfg.ausschluesse.access_no}
          onChange={(v) => update((c) => ({ ...c, ausschluesse: { ...c.ausschluesse, access_no: v } }))}
        />
      </Section>

      <Section title="Diagnose">
        <Check
          label="Lücken markieren"
          checked={cfg.diagnose.luecken_markieren}
          onChange={(v) => update((c) => ({ ...c, diagnose: { ...c.diagnose, luecken_markieren: v } }))}
        />
        <Check
          label="Sackgassen ausblenden"
          checked={cfg.diagnose.sackgassen_ausblenden}
          onChange={(v) => update((c) => ({ ...c, diagnose: { ...c.diagnose, sackgassen_ausblenden: v } }))}
        />
        <Slider
          label="POI-Ausnahme-Distanz"
          value={cfg.diagnose.sackgasse_poi_ausnahme_meter}
          min={0} max={100} step={5}
          onChange={(v) => update((c) => ({ ...c, diagnose: { ...c.diagnose, sackgasse_poi_ausnahme_meter: v } }))}
        />
      </Section>

      {/* Aktionen */}
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => {
            savePathConfig({ ...cfg, gebiet });
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 1800);
          }}
          disabled={!gebiet}
          style={{
            fontSize: 12, padding: '7px 12px', fontWeight: 600,
            border: '1px solid #2b6cb0', borderRadius: 5,
            background: savedFlash ? '#2b6cb0' : '#ebf8ff',
            color: savedFlash ? 'white' : '#2b6cb0',
            cursor: gebiet ? 'pointer' : 'not-allowed', opacity: gebiet ? 1 : 0.5,
          }}
        >
          {savedFlash ? '✓ gespeichert' : 'Anwenden'}
        </button>
        <button
          disabled
          title="Commit nach data/regio_paths/<region>.json kommt in Phase 9 (Bridge-Whitelist)"
          style={{
            fontSize: 12, padding: '7px 12px', fontWeight: 600,
            border: '1px dashed #cbd5e0', borderRadius: 5,
            background: '#edf2f7', color: '#a0aec0', cursor: 'not-allowed',
          }}
        >
          Commit zu Repo (Phase 9)
        </button>
        <div style={{ fontSize: 10, color: '#a0aec0', lineHeight: 1.5 }}>
          „Anwenden" rechnet die Ableitungs-Pipeline neu — die Engine folgt ab
          Phase 3. Aktuell wird die Konfiguration nur lokal gespeichert.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: '1px solid #edf2f7' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '7px 10px', cursor: 'pointer',
          border: 'none', background: 'transparent', fontSize: 12, fontWeight: 700,
          color: '#4a5568', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ fontSize: 9, color: '#a0aec0' }}>{open ? '▾' : '▸'}</span>
        {title}
      </button>
      {open && <div style={{ paddingBottom: 6 }}>{children}</div>}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ padding: '4px 10px' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'monospace', color: '#2b6cb0' }}>{value} m</span>
      </label>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

function Connector({
  label, hint, aktiv, max, onAktiv, onMax,
}: {
  label: string; hint: string; aktiv: boolean; max: number;
  onAktiv: (v: boolean) => void; onMax: (v: number) => void;
}) {
  return (
    <div style={{ padding: '4px 10px 6px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
        <input type="checkbox" checked={aktiv} onChange={(e) => onAktiv(e.target.checked)} />
        <span style={{ fontWeight: 600 }}>{label}</span>
      </label>
      <div style={{ fontSize: 10, color: '#a0aec0', margin: '1px 0 3px 22px', fontFamily: 'monospace' }}>{hint}</div>
      <div style={{ opacity: aktiv ? 1 : 0.4, pointerEvents: aktiv ? 'auto' : 'none' }}>
        <Slider label="max. Länge" value={max} min={0} max={200} step={10} onChange={onMax} />
      </div>
    </div>
  );
}

// ─── Export-Modal ───────────────────────────────────────────────────────────

function ExportModal({
  fileName, json, onClose, onCommitted,
}: {
  fileName: string;
  json: string;
  onClose: () => void;
  onCommitted?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);

  const onCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const onCommit = async () => {
    setCommitting(true);
    setCommitResult(null);
    const path = `data/geometries/${fileName}`;
    const result = await commitToRepo({
      path,
      content: json,
      message: `geometry: ${fileName.replace(/\.json$/, '')} via Drawer-Bridge`,
    });
    setCommitResult(result);
    setCommitting(false);
    if (result.ok && onCommitted) onCommitted();
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
              onClick={onCommit}
              disabled={committing || (commitResult?.ok === true)}
              style={{
                fontSize: 11, padding: '4px 12px',
                cursor: committing ? 'wait' : (commitResult?.ok ? 'not-allowed' : 'pointer'),
                border: '1px solid #2f855a',
                background: commitResult?.ok ? '#9ae6b4' : '#2f855a',
                color: commitResult?.ok ? '#22543d' : 'white',
                borderRadius: 4, fontWeight: 600,
                opacity: committing ? 0.7 : 1,
              }}
            >
              {committing ? '… committe' : (commitResult?.ok ? '✓ committed' : 'Commit zu main')}
            </button>
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
        {commitResult?.ok && (
          <div style={{
            padding: '8px 16px', fontSize: 11, color: '#22543d',
            background: '#f0fff4', borderTop: '1px solid #9ae6b4',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span>✓ Commit auf main:</span>
            <a href={commitResult.commit_url} target="_blank" rel="noreferrer"
               style={{ color: '#2f855a', fontFamily: 'monospace' }}>
              {commitResult.commit_sha.slice(0, 7)}
            </a>
            <span style={{ color: '#718096' }}>
              · CF Pages Auto-Build laeuft, ~60 s bis live.
            </span>
          </div>
        )}
        {commitResult && !commitResult.ok && (
          <div style={{
            padding: '8px 16px', fontSize: 11, color: '#9b2c2c',
            background: '#fff5f5', borderTop: '1px solid #feb2b2',
          }}>
            ✗ Commit fehlgeschlagen ({commitResult.status}): {commitResult.error}
          </div>
        )}
        {!commitResult && (
          <div style={{
            padding: '8px 16px', fontSize: 11, color: '#7c2d12',
            background: '#fff5f0', borderTop: '1px solid #fed7aa',
          }}>
            <strong>Direkt-Commit</strong> schreibt nach <code>data/geometries/{fileName}</code> auf main.
            Falls Bridge nicht erreichbar: „In Zwischenablage" → paste in lokale Datei → manuell committen.
          </div>
        )}
      </div>
    </div>
  );
}
