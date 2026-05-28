import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import type { ScimPipelineResult } from '../pipeline/scimPipeline.types';
import type { GraphState } from '../graph/graph.types';
import type { BoundaryState } from '../boundary/boundary.types';
import type { ExtractionState } from '../extraction/extraction.types';
import type { PoiModelState } from '../poi-model/poiModel.types';
import type { RouteLayerModelState } from '../route-layer-model/routeLayerModel.types';
import RepresentBuildTetrahedron from './RepresentBuildTetrahedron';
import type { RepresentBuildFace } from './RepresentBuildTetrahedron';
import {
  addRoadHeatMesh, addPoiRoutes, fetchOsmEdges,
  TILE_OSM_URL, TILE_OSM_ATTR, TILE_MESH_URL, TILE_MESH_ATTR,
} from './colourMeshOverlay';
import { useActiveRepresentation } from '../../runtime/repContext';

interface OsmEdge {
  edge_id: string;
  geometry: { coordinates: [number, number][] };
}

interface Props {
  result: ScimPipelineResult;
  onNavigate?: (face: RepresentBuildFace) => void;
  onCollapseToggle?: () => void;
}

const POI_LOAD_COLORS: Record<string, string> = {
  quiet: '#3d9970',
  moderate: '#ffdc00',
  busy: '#ff851b',
  very_busy: '#ff4136',
  unknown: '#aaaaaa',
};

interface LayerVisibility {
  boundary: boolean;
  routes: boolean;
  pois: boolean;
  colourmesh: boolean;
}

const DEFAULT_VISIBILITY: LayerVisibility = {
  boundary: true,
  routes: false,
  pois: true,
  colourmesh: true,
};

// Polygon (outer ring) -> [minLon, minLat, maxLon, maxLat].
function polygonBbox(polygon: ReadonlyArray<readonly [number, number] | ReadonlyArray<number>>): [number, number, number, number] | null {
  if (!polygon || polygon.length === 0) return null;
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const pt of polygon) {
    const lon = pt[0]; const lat = pt[1];
    if (typeof lon !== 'number' || typeof lat !== 'number') continue;
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  if (!Number.isFinite(minLon)) return null;
  return [minLon, minLat, maxLon, maxLat];
}

export default function ScimMap({ result, onNavigate, onCollapseToggle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const [vis, setVis] = useState<LayerVisibility>(DEFAULT_VISIBILITY);

  // Aktive Representation aus dem RepresentationContext (Schritt 3).
  // Wenn gesetzt, ueberschreibt sie die Pipeline-bbox fuer Fit + OSM-Fetch
  // und zeichnet ihren Polygon-Outline als zusaetzliche Boundary.
  // POIs aus rep.catalog_id folgen, sobald die Sichtbarkeit (Style, Click)
  // mit dem User abgestimmt ist — siehe Stopp-Linie ann_067.
  const activeRep = useActiveRepresentation();
  const repBbox = useMemo(
    () => (activeRep ? polygonBbox(activeRep.geometry.polygon) : null),
    [activeRep],
  );
  // Polygon-Ringe als [lat, lon][] fuer Leaflet vorbereiten.
  const repPolygonLatLng = useMemo(() => {
    if (!activeRep) return null;
    const ring = activeRep.geometry.polygon;
    if (!ring || ring.length < 3) return null;
    return ring.map((p) => [p[1], p[0]] as [number, number]);
  }, [activeRep]);

  // Layer-Monitor: jeden vis-Wechsel an die Welt mitteilen, damit das
  // Firmament im Navigator weiss, welcher Slice glimmen darf
  // (siehe ann_066 Geste 3).
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scim:layers:state', { detail: vis }));
  }, [vis]);
  const [osmEdges, setOsmEdges] = useState<OsmEdge[]>([]);
  const [osmStatus, setOsmStatus] = useState<'idle' | 'loading' | 'ok' | 'failed'>('idle');

  // Init Leaflet map once (guard against StrictMode double-invoke).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      zoomControl: true,
      zoomSnap: 0,        // stufenlos
      zoomDelta: 1,       // 1 voller Step pro Wheel-Tick
      wheelPxPerZoomLevel: 3,
      wheelDebounceTime: 0,
      preferCanvas: true,
    });
    // Initiale Base-Tile entspricht der Default-Visibility (Mesh an -> reduzierte Karte).
    const initialUrl = DEFAULT_VISIBILITY.colourmesh ? TILE_MESH_URL : TILE_OSM_URL;
    const initialAttr = DEFAULT_VISIBILITY.colourmesh ? TILE_MESH_ATTR : TILE_OSM_ATTR;
    baseTileRef.current = L.tileLayer(initialUrl, {
      attribution: initialAttr,
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      baseTileRef.current = null;
    };
  }, []);

  // Base-Tile-Layer austauschen, wenn der Colour-Mesh-Modus toggelt.
  useEffect(() => {
    const map = mapRef.current;
    const oldBase = baseTileRef.current;
    if (!map || !oldBase) return;
    const wantUrl = vis.colourmesh ? TILE_MESH_URL : TILE_OSM_URL;
    const wantAttr = vis.colourmesh ? TILE_MESH_ATTR : TILE_OSM_ATTR;
    // Vermeide Tausch wenn schon korrekt (Leaflet-internes _url-Feld).
    const currentUrl = (oldBase as unknown as { _url: string })._url;
    if (currentUrl === wantUrl) return;
    map.removeLayer(oldBase);
    baseTileRef.current = L.tileLayer(wantUrl, {
      attribution: wantAttr, maxZoom: 19,
    }).addTo(map);
  }, [vis.colourmesh]);

  // OSM-Wege via Overpass holen, sobald colourmesh an und bbox bekannt.
  // Hat einen Cache (24h) — beim zweiten Aufruf sofort da.
  // Aktive Representation hat Vorrang gegenueber der Pipeline-bbox.
  useEffect(() => {
    if (!vis.colourmesh) return;
    const pipelineBbox = result.success
      ? ((result.context.boundary as unknown as { computed_boundary: { bbox?: [number, number, number, number] } } | undefined)
         ?.computed_boundary?.bbox)
      : undefined;
    const bbox = repBbox ?? pipelineBbox;
    if (!bbox) return;
    let cancelled = false;
    setOsmStatus('loading');
    fetchOsmEdges(bbox)
      .then((edges) => {
        if (cancelled) return;
        setOsmEdges(edges);
        setOsmStatus('ok');
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Overpass-API failed, fallback to synthetic mesh:', err);
        setOsmStatus('failed');
      });
    return () => { cancelled = true; };
  }, [vis.colourmesh, result, repBbox]);

  // Container kann resized werden (Collapsible-Container) — Map neu einladen
  useEffect(() => {
    setTimeout(() => mapRef.current?.invalidateSize(), 150);
  });

  // Draw pipeline result whenever it changes oder visibility togglet.
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup || !result.success) return;

    layerGroup.clearLayers();

    const ctx = result.context;
    const graph = ctx.graph as unknown as GraphState | undefined;
    const boundary = ctx.boundary as unknown as BoundaryState | undefined;
    const extraction = ctx.extracted_data as unknown as ExtractionState | undefined;
    const poiModel = ctx.poi_model as unknown as PoiModelState | undefined;
    const routeLayerModel = ctx.route_layer_model as unknown as RouteLayerModelState | undefined;

    // Boundary
    if (vis.boundary && boundary?.computed_boundary.bbox) {
      const [minLon, minLat, maxLon, maxLat] = boundary.computed_boundary.bbox;
      L.rectangle([[minLat, minLon], [maxLat, maxLon]], {
        color: '#0074d9',
        weight: 1.5,
        fillOpacity: 0.04,
        dashArray: '6 4',
      }).addTo(layerGroup);
    }

    // Aktive Representation: Polygon der Geometrie als zusaetzlicher
    // Outline, damit klar ist welche R die Karte heute fuehrt.
    // Visuelle Sprache analog zur Boundary, aber durchgezogen und etwas
    // praesenter — gleiche Farbpalette, kein neuer Stil.
    if (vis.boundary && repPolygonLatLng) {
      L.polygon(repPolygonLatLng, {
        color: '#0074d9',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.05,
      }).addTo(layerGroup);
    }

    // Edge geometry lookup (immer aufbauen, da von Routes benoetigt)
    const edgeGeom = new Map<string, [number, number][]>();
    if (graph?.edges) {
      for (const edge of graph.edges) {
        edgeGeom.set(
          edge.edge_id,
          edge.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
        );
      }
    }

    // Routes
    if (vis.routes && routeLayerModel?.segments) {
      for (const seg of routeLayerModel.segments) {
        if (!seg.visible) continue;
        const coords = edgeGeom.get(seg.edge_id);
        if (!coords || coords.length < 2) continue;
        L.polyline(coords, {
          color: seg.style.color,
          weight: seg.style.weight,
          opacity: seg.style.opacity,
          dashArray: seg.style.dash_pattern,
        })
          .bindTooltip(`Edge: ${seg.edge_id}<br/>Score: ${seg.score_class}`)
          .addTo(layerGroup);
      }
    }

    // POI Load class lookup
    const poiLoadClass = new Map<string, string>();
    if (poiModel?.evaluated_pois) {
      for (const p of poiModel.evaluated_pois) {
        poiLoadClass.set(p.poi_id, p.load_class);
      }
    }

    // Colour-Mesh: Heat *entlang der Strassen* + POI-zu-POI Routen mit Glow.
    // Bevorzugt OSM-Wege (echte Geometrie); waehrend des Ladens / bei Fehler
    // faellt addRoadHeatMesh intern auf synthetische Edges zurueck.
    if (vis.colourmesh && boundary?.computed_boundary.bbox) {
      const pois = extraction?.extracted_pois ?? [];
      const edgesToRender = osmEdges.length > 0 ? osmEdges : (graph?.edges ?? []);
      addRoadHeatMesh(layerGroup, edgesToRender, boundary.computed_boundary.bbox, pois);
      addPoiRoutes(layerGroup, pois);
    }

    // POIs
    if (vis.pois && extraction?.extracted_pois) {
      for (const poi of extraction.extracted_pois) {
        const [lon, lat] = poi.center.coordinates;
        const loadClass = poiLoadClass.get(poi.poi_id) ?? 'unknown';
        L.circleMarker([lat, lon], {
          radius: 9,
          color: '#333',
          weight: 1.5,
          fillColor: POI_LOAD_COLORS[loadClass] ?? '#aaa',
          fillOpacity: 0.9,
        })
          .bindTooltip(`${poi.name ?? poi.poi_id}<br/>Load: ${loadClass}`)
          .addTo(layerGroup);
      }
    }

    // Fit: aktive R hat Vorrang, sonst Pipeline-Boundary, sonst Graph-Knoten.
    if (repBbox) {
      const [minLon, minLat, maxLon, maxLat] = repBbox;
      map.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [24, 24] });
    } else if (boundary?.computed_boundary.bbox) {
      const [minLon, minLat, maxLon, maxLat] = boundary.computed_boundary.bbox;
      map.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [24, 24] });
    } else if (graph?.nodes && graph.nodes.length > 0) {
      const lats = graph.nodes.map((n) => n.geometry.coordinates[1]);
      const lons = graph.nodes.map((n) => n.geometry.coordinates[0]);
      map.fitBounds([
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
      ]);
    }
  }, [result, vis, osmEdges, repBbox, repPolygonLatLng]);

  if (!result.success) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: '#1a1a1a', color: '#ff4136', fontFamily: 'monospace', fontSize: 13,
      }}>
        <Header label="Pipeline-Kontrolle" detail="Fehler" vis={vis} setVis={setVis} onNavigate={onNavigate} onCollapseToggle={onCollapseToggle} disabled />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Pipeline failed at: {result.failed_at_step ?? 'unknown'}
        </div>
      </div>
    );
  }

  const ctx = result.context;
  const boundary = ctx.boundary as unknown as BoundaryState | undefined;
  const extraction = ctx.extracted_data as unknown as ExtractionState | undefined;
  const routeLayerModel = ctx.route_layer_model as unknown as RouteLayerModelState | undefined;

  const activeLabels: string[] = [];
  if (vis.boundary && boundary?.computed_boundary.bbox) activeLabels.push('Boundary');
  if (vis.colourmesh) {
    if (osmStatus === 'loading') activeLabels.push('Colour-Mesh (OSM laedt…)');
    else if (osmStatus === 'ok') activeLabels.push(`Colour-Mesh · ${osmEdges.length} OSM-Wege`);
    else if (osmStatus === 'failed') activeLabels.push('Colour-Mesh (synthetisch · OSM-Fehler)');
    else activeLabels.push('Colour-Mesh');
  }
  if (vis.routes && routeLayerModel?.segments?.length) activeLabels.push(`${routeLayerModel.segments.length} Routen`);
  if (vis.pois && extraction?.extracted_pois?.length) activeLabels.push(`${extraction.extracted_pois.length} POIs`);
  const detail = activeLabels.length > 0 ? activeLabels.join(' · ') : '— alle Layer ausgeblendet —';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header label="Pipeline-Kontrolle" detail={detail} vis={vis} setVis={setVis} onNavigate={onNavigate} onCollapseToggle={onCollapseToggle} />
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}

function Header({
  label, detail, vis, setVis, onNavigate, onCollapseToggle, disabled,
}: {
  label: string;
  detail: string;
  vis: LayerVisibility;
  setVis: (v: LayerVisibility) => void;
  onNavigate?: (face: RepresentBuildFace) => void;
  onCollapseToggle?: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      position: 'relative',
      padding: '6px 10px', background: '#0d1520', color: '#a0aec0',
      borderBottom: '1px solid #1e2d40', fontSize: 11,
      fontFamily: 'system-ui, sans-serif',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ flexShrink: 0 }} title="Inspector — Sicht auf die laufende Repraesentation">
        <RepresentBuildTetrahedron
          variant="dark"
          onFaceClick={onNavigate}
          size={38}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ color: '#e0eeff', fontSize: 11, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {detail}
        </div>
      </div>
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          fontSize: 10, padding: '3px 8px', cursor: disabled ? 'not-allowed' : 'pointer',
          border: '1px solid #2d4a6a', background: open ? '#1e3a5f' : 'transparent',
          color: '#a0aec0', borderRadius: 3,
        }}
      >
        Layer ▾
      </button>
      {onCollapseToggle && (
        <button
          onClick={onCollapseToggle}
          title="Inspector ausblenden"
          style={{
            fontSize: 12, padding: '0 8px', cursor: 'pointer', height: 22,
            border: '1px solid #2d4a6a', background: 'transparent',
            color: '#a0aec0', borderRadius: 3,
          }}
        >▶</button>
      )}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 6, zIndex: 1000,
          background: '#1a2535', border: '1px solid #2d4a6a', borderRadius: 4,
          padding: '8px 10px', minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          <LayerToggle label="Boundary" checked={vis.boundary} onChange={(v) => setVis({ ...vis, boundary: v })} />
          <LayerToggle label="POIs" checked={vis.pois} onChange={(v) => setVis({ ...vis, pois: v })} />
          <LayerToggle label="Colour-Mesh" checked={vis.colourmesh} onChange={(v) => setVis({ ...vis, colourmesh: v })} />
          <LayerToggle label="Routen / Edges" checked={vis.routes} onChange={(v) => setVis({ ...vis, routes: v })} />
        </div>
      )}
    </div>
  );
}

function LayerToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '3px 0', cursor: 'pointer', color: '#e0eeff', fontSize: 11,
    }}>
      <input
        type="checkbox" checked={checked}
        onChange={(e) => {
          onChange(e.target.checked);
          // Inspector-Blitz: Pergament-Trapez zuckt kurz weiss durch.
          // Reflexion hat sich neu sortiert. Siehe ann_066 (Geste 2).
          window.dispatchEvent(new CustomEvent('scim:inspector:flash'));
        }}
        style={{ cursor: 'pointer' }}
      />
      {label}
    </label>
  );
}
