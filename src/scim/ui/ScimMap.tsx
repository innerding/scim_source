import { useEffect, useRef } from 'react';
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

export default function ScimMap({ result }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Init Leaflet map once (guard against StrictMode double-invoke).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, { zoomControl: true });
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

  // Draw pipeline result whenever it changes.
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

    // Draw boundary polygon.
    if (boundary?.computed_boundary.bbox) {
      const [minLon, minLat, maxLon, maxLat] = boundary.computed_boundary.bbox;
      L.rectangle([[minLat, minLon], [maxLat, maxLon]], {
        color: '#0074d9',
        weight: 1.5,
        fillOpacity: 0.04,
        dashArray: '6 4',
      }).addTo(layerGroup);
    }

    // Build edge geometry lookup.
    const edgeGeom = new Map<string, [number, number][]>();
    if (graph?.edges) {
      for (const edge of graph.edges) {
        edgeGeom.set(
          edge.edge_id,
          edge.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
        );
      }
    }

    // Draw route segments.
    if (routeLayerModel?.segments) {
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

    // Build POI load class lookup.
    const poiLoadClass = new Map<string, string>();
    if (poiModel?.evaluated_pois) {
      for (const p of poiModel.evaluated_pois) {
        poiLoadClass.set(p.poi_id, p.load_class);
      }
    }

    // Draw POI markers.
    if (extraction?.extracted_pois) {
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

    // Fit to boundary bbox or graph nodes.
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
  }, [result]);

  if (!result.success) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#1a1a1a', color: '#ff4136', fontFamily: 'monospace', fontSize: 13,
      }}>
        Pipeline failed at: {result.failed_at_step ?? 'unknown'}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  );
}
