import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { ScimPipelineResult } from '../pipeline/scimPipeline.types';
import type { GraphState } from '../graph/graph.types';
import type { BoundaryState } from '../boundary/boundary.types';
import type { ExtractionState } from '../extraction/extraction.types';
import type { PoiModelState } from '../poi-model/poiModel.types';
import type { RouteLayerModelState } from '../route-layer-model/routeLayerModel.types';

interface Props {
  result: ScimPipelineResult;
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
}

const DEFAULT_VISIBILITY: LayerVisibility = {
  boundary: true,
  routes: true,
  pois: true,
};

export default function ScimMap({ result }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [vis, setVis] = useState<LayerVisibility>(DEFAULT_VISIBILITY);

  // Init Leaflet map once (guard against StrictMode double-invoke).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      zoomControl: true,
      // Smootheres Wheel-Zoom (default 60)
      wheelPxPerZoomLevel: 100,
      // Stufenlose Zoom-Schritte
      zoomSnap: 0,
      zoomDelta: 0.5,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

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

    // Fit auf Boundary, einmalig beim Mount (nicht bei jedem Toggle)
    if (boundary?.computed_boundary.bbox) {
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
  }, [result, vis]);

  if (!result.success) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: '#1a1a1a', color: '#ff4136', fontFamily: 'monospace', fontSize: 13,
      }}>
        <Header label="Pipeline-Kontrolle" detail="Fehler" vis={vis} setVis={setVis} disabled />
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
  if (vis.routes && routeLayerModel?.segments?.length) activeLabels.push(`${routeLayerModel.segments.length} Routen`);
  if (vis.pois && extraction?.extracted_pois?.length) activeLabels.push(`${extraction.extracted_pois.length} POIs`);
  const detail = activeLabels.length > 0 ? activeLabels.join(' · ') : '— alle Layer ausgeblendet —';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header label="Pipeline-Kontrolle" detail={detail} vis={vis} setVis={setVis} />
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}

function Header({
  label, detail, vis, setVis, disabled,
}: {
  label: string;
  detail: string;
  vis: LayerVisibility;
  setVis: (v: LayerVisibility) => void;
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
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 6, zIndex: 1000,
          background: '#1a2535', border: '1px solid #2d4a6a', borderRadius: 4,
          padding: '8px 10px', minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          <LayerToggle label="Boundary" checked={vis.boundary} onChange={(v) => setVis({ ...vis, boundary: v })} />
          <LayerToggle label="POIs" checked={vis.pois} onChange={(v) => setVis({ ...vis, pois: v })} />
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
        onChange={(e) => onChange(e.target.checked)}
        style={{ cursor: 'pointer' }}
      />
      {label}
    </label>
  );
}
