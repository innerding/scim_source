import { describe, it, expect } from 'vitest';
import { makeEmptyContext } from '../context/scimContext.types';
import type { ScimPipelineInputs } from './scimPipeline.types';
import {
  computeBoundary,
  computeExtraction,
  computeGraph,
  computeBasisLayer,
  computeLeafletBasisCheck,
} from './scimPipeline.compute';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { mockRegioContentState } from '../regio-content/regioContent.mock';
import { mockTargetAppUiState } from '../target-app-ui/targetAppUi.mock';
import { mockTelcoLoadState } from '../telco-load/telcoLoad.mock';
import { mockGraphState } from '../graph/graph.mock';
import type { BoundaryState } from '../boundary/boundary.types';
import type { ExtractionState } from '../extraction/extraction.types';
import type { GraphState } from '../graph/graph.types';
import type { BasisLayerState } from '../basis-layer/basisLayer.types';

const mockRoadNetwork: ScimPipelineInputs['road_network'] = {
  source: 'mock',
  nodes: mockGraphState.nodes.map((n) => ({
    node_id: n.node_id,
    geometry: n.geometry,
    node_type: n.node_type,
    elevation_meters: n.elevation_meters,
  })),
  edges: mockGraphState.edges.map((e) => ({
    edge_id: e.edge_id,
    from_node_id: e.from_node_id,
    to_node_id: e.to_node_id,
    geometry: e.geometry,
    length_meters: e.length_meters,
    edge_type: e.edge_type,
    surface_type: e.surface_type,
    difficulty_class: e.difficulty_class,
    bidirectional: e.bidirectional,
  })),
  bbox: [15.0, 47.5, 15.4, 47.8],
};

const baseInputs: ScimPipelineInputs = {
  system_adjust: mockSystemAdjustState,
  regio_content: mockRegioContentState,
  target_app_ui: mockTargetAppUiState,
  telco_load: mockTelcoLoadState,
  road_network: mockRoadNetwork,
};

// ── 51.1 Boundary buffer formula ──────────────────────────────────────────────

describe('Spatial – 51.1 computeBoundary buffer formula', () => {
  it('clamps rawBuffer (below min) up to system min', () => {
    // Mock POI has radius=50, margin=25 → raw=75, system min=150 → clamped to 150
    const boundary = computeBoundary(makeEmptyContext(), baseInputs);
    expect(boundary.buffer_spec.computed_buffer_meters).toBe(150);
    expect(boundary.buffer_spec.clamped).toBe(true);
    expect(boundary.buffer_spec.clamped_reason).toBe('below_min');
  });

  it('does not clamp when raw buffer is within range', () => {
    // regional_parameters.comparison_margin_meters = 25 (from mock)
    // raw = 200 + 25 = 225, within [150, 500]
    const inputs: ScimPipelineInputs = {
      ...baseInputs,
      regio_content: {
        ...mockRegioContentState,
        approved_pois: [{ ...mockRegioContentState.approved_pois[0], radius_meters: 200 }],
      },
    };
    const boundary = computeBoundary(makeEmptyContext(), inputs);
    expect(boundary.buffer_spec.computed_buffer_meters).toBe(225);
    expect(boundary.buffer_spec.clamped).toBe(false);
  });

  it('clamps rawBuffer (above max) down to system max', () => {
    // regional_parameters.comparison_margin_meters = 25 (from mock)
    // raw = 480 + 25 = 505 > 500 → clamped to 500
    const inputs: ScimPipelineInputs = {
      ...baseInputs,
      regio_content: {
        ...mockRegioContentState,
        approved_pois: [{ ...mockRegioContentState.approved_pois[0], radius_meters: 480 }],
      },
    };
    const boundary = computeBoundary(makeEmptyContext(), inputs);
    expect(boundary.buffer_spec.computed_buffer_meters).toBe(500);
    expect(boundary.buffer_spec.clamped_reason).toBe('above_max');
  });

  it('bbox is expanded beyond the region bbox', () => {
    const boundary = computeBoundary(makeEmptyContext(), baseInputs);
    const regionBbox = mockRegioContentState.region.bbox!;
    const expanded = boundary.computed_boundary.bbox;
    expect(expanded[0]).toBeLessThan(regionBbox[0]);   // minLon
    expect(expanded[1]).toBeLessThan(regionBbox[1]);   // minLat
    expect(expanded[2]).toBeGreaterThan(regionBbox[2]); // maxLon
    expect(expanded[3]).toBeGreaterThan(regionBbox[3]); // maxLat
  });

  it('poi_count_within includes the mock POI', () => {
    const boundary = computeBoundary(makeEmptyContext(), baseInputs);
    expect(boundary.poi_count_within).toBeGreaterThan(0);
  });

  it('boundary_id is derived from region_id', () => {
    const boundary = computeBoundary(makeEmptyContext(), baseInputs);
    expect(boundary.boundary_id).toContain(mockRegioContentState.region.region_id);
  });
});

// ── 51.2 Extraction filters by boundary ───────────────────────────────────────

describe('Spatial – 51.2 computeExtraction filters by boundary bbox', () => {
  const ctx = makeEmptyContext();
  const boundary = computeBoundary(ctx, baseInputs) as BoundaryState;
  const ctxWithBoundary = { ...ctx, boundary };

  it('extracts the mock POI within boundary', () => {
    const ext = computeExtraction(ctxWithBoundary, baseInputs);
    expect(ext.extracted_pois.length).toBeGreaterThan(0);
    expect(ext.extracted_pois[0].within_boundary).toBe(true);
  });

  it('excludes a POI outside boundary', () => {
    const outsidePoi = {
      ...mockRegioContentState.approved_pois[0],
      poi_id: 'poi_outside',
      center: { type: 'Point' as const, coordinates: [20.0, 50.0] as [number, number] },
    };
    const inputs: ScimPipelineInputs = {
      ...baseInputs,
      regio_content: {
        ...mockRegioContentState,
        approved_pois: [...mockRegioContentState.approved_pois, outsidePoi],
      },
    };
    const ext = computeExtraction(ctxWithBoundary, inputs);
    expect(ext.excluded_poi_count).toBeGreaterThan(0);
    expect(ext.extracted_pois.some((p) => p.poi_id === 'poi_outside')).toBe(false);
  });

  it('extracts signal groups within boundary', () => {
    const ext = computeExtraction(ctxWithBoundary, baseInputs);
    expect(ext.extracted_signal_groups.length).toBeGreaterThan(0);
  });

  it('counts out-of-boundary signals correctly', () => {
    const ext = computeExtraction(ctxWithBoundary, baseInputs);
    const total = ext.extracted_signal_groups.length + ext.out_of_boundary_signal_count;
    expect(total).toBe(mockTelcoLoadState.load_signals.length);
  });

  it('boundary_id is carried into extraction', () => {
    const ext = computeExtraction(ctxWithBoundary, baseInputs);
    expect(ext.boundary_id).toBe(boundary.boundary_id);
  });
});

// ── 51.3 Graph is built from road network ─────────────────────────────────────

describe('Spatial – 51.3 computeGraph filters network to boundary', () => {
  const ctx = makeEmptyContext();
  const boundary = computeBoundary(ctx, baseInputs) as BoundaryState;
  const extraction = computeExtraction({ ...ctx, boundary }, baseInputs) as ExtractionState;
  const ctxWithSpatial = { ...ctx, boundary, extracted_data: extraction };

  it('returns nodes within boundary', () => {
    const graph = computeGraph(ctxWithSpatial, baseInputs);
    expect(graph.nodes.length).toBeGreaterThan(0);
  });

  it('returns edges within boundary', () => {
    const graph = computeGraph(ctxWithSpatial, baseInputs);
    expect(graph.edges.length).toBeGreaterThan(0);
  });

  it('marks at least one poi_anchor node', () => {
    const graph = computeGraph(ctxWithSpatial, baseInputs);
    expect(graph.nodes.some((n) => n.node_type === 'poi_anchor')).toBe(true);
  });

  it('metrics reflect actual node/edge counts', () => {
    const graph = computeGraph(ctxWithSpatial, baseInputs);
    expect(graph.metrics.node_count).toBe(graph.nodes.length);
    expect(graph.metrics.edge_count).toBe(graph.edges.length);
  });

  it('boundary_id is carried into graph', () => {
    const graph = computeGraph(ctxWithSpatial, baseInputs);
    expect(graph.boundary_id).toBe(boundary.boundary_id);
  });
});

// ── 51.4 BasisLayer has correct tile and viewport ─────────────────────────────

describe('Spatial – 51.4 computeBasisLayer configures Leaflet tiles and viewport', () => {
  const ctx = makeEmptyContext();
  const boundary = computeBoundary(ctx, baseInputs) as BoundaryState;
  const extraction = computeExtraction({ ...ctx, boundary }, baseInputs) as ExtractionState;
  const graph = computeGraph({ ...ctx, boundary, extracted_data: extraction }, baseInputs) as GraphState;
  const ctxWithAll = { ...ctx, boundary, extracted_data: extraction, graph };

  it('includes OSM base tile layer', () => {
    const bl = computeBasisLayer(ctxWithAll, baseInputs);
    expect(bl.tile_layers.some((t) => t.tile_layer_id === 'osm_base')).toBe(true);
  });

  it('viewport center is within boundary bbox', () => {
    const bl = computeBasisLayer(ctxWithAll, baseInputs);
    const [lon, lat] = bl.viewport.center.coordinates;
    const bbox = bl.viewport.bbox;
    expect(lon).toBeGreaterThan(bbox[0]);
    expect(lon).toBeLessThan(bbox[2]);
    expect(lat).toBeGreaterThan(bbox[1]);
    expect(lat).toBeLessThan(bbox[3]);
  });

  it('default_zoom is within min/max range', () => {
    const bl = computeBasisLayer(ctxWithAll, baseInputs);
    expect(bl.viewport.default_zoom).toBeGreaterThanOrEqual(bl.viewport.min_zoom);
    expect(bl.viewport.default_zoom).toBeLessThanOrEqual(bl.viewport.max_zoom);
  });

  it('adds hillshade layer when graph has elevation data', () => {
    const bl = computeBasisLayer(ctxWithAll, baseInputs);
    const hasElevation = graph.nodes.some((n) => n.elevation_meters !== undefined);
    if (hasElevation) {
      expect(bl.tile_layers.some((t) => t.tile_layer_id === 'hillshade')).toBe(true);
    }
  });
});

// ── 51.5 LeafletBasisCheck reflects actual state ──────────────────────────────

describe('Spatial – 51.5 computeLeafletBasisCheck', () => {
  const ctx = makeEmptyContext();
  const boundary = computeBoundary(ctx, baseInputs) as BoundaryState;
  const extraction = computeExtraction({ ...ctx, boundary }, baseInputs) as ExtractionState;
  const graph = computeGraph({ ...ctx, boundary, extracted_data: extraction }, baseInputs) as GraphState;
  const basisLayer = computeBasisLayer({ ...ctx, boundary, extracted_data: extraction, graph }, baseInputs) as BasisLayerState;
  const ctxFull = { ...ctx, boundary, extracted_data: extraction, graph, basis_layer: basisLayer };

  it('overall_ready is true when basis layer is valid', () => {
    const check = computeLeafletBasisCheck(ctxFull, baseInputs);
    expect(check.check_result.overall_ready).toBe(true);
  });

  it('tile_layers_count matches basis layer', () => {
    const check = computeLeafletBasisCheck(ctxFull, baseInputs);
    expect(check.check_result.tile_layers_count).toBe(basisLayer.tile_layers.length);
  });

  it('overall_ready is false when no basis layer', () => {
    const check = computeLeafletBasisCheck(makeEmptyContext(), baseInputs);
    expect(check.check_result.overall_ready).toBe(false);
  });
});
