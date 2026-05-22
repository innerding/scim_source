import { describe, it, expect } from 'vitest';
import { makeEmptyContext } from '../context/scimContext.types';
import type { ScimPipelineInputs } from './scimPipeline.types';
import {
  computeBoundary,
  computeExtraction,
  computeGraph,
  computeBasisLayer,
  computePoiModel,
  computeLoadProjection,
  computeMovementModel,
  computeMaskingModel,
  computeRouteModel,
  computeRouteLayerModel,
  computeLayerModel,
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
import type { PoiModelState } from '../poi-model/poiModel.types';
import type { LoadProjectionState } from '../load-projection/loadProjection.types';
import type { MovementModelState } from '../movement-model/movementModel.types';
import type { MaskingModelState } from '../masking-model/maskingModel.types';
import type { RouteModelState } from '../route-model/routeModel.types';
import type { RouteLayerModelState } from '../route-layer-model/routeLayerModel.types';

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

// Build full spatial context once.
const ctx0 = makeEmptyContext();
const boundary = computeBoundary(ctx0, baseInputs) as BoundaryState;
const extraction = computeExtraction({ ...ctx0, boundary }, baseInputs) as ExtractionState;
const graph = computeGraph({ ...ctx0, boundary, extracted_data: extraction }, baseInputs) as GraphState;
const basisLayer = computeBasisLayer(
  { ...ctx0, boundary, extracted_data: extraction, graph },
  baseInputs,
) as BasisLayerState;

const ctxSpatial = { ...ctx0, boundary, extracted_data: extraction, graph, basis_layer: basisLayer };

// ── 52.1 PoiModel ─────────────────────────────────────────────────────────────

describe('Engine – 52.1 computePoiModel', () => {
  const poiModel = computePoiModel(
    { ...ctxSpatial, telco_load: mockTelcoLoadState },
    baseInputs,
  );

  it('evaluates one PoiLoadState per extracted POI', () => {
    expect(poiModel.evaluated_pois.length).toBe(extraction.extracted_pois.length);
  });

  it('poi_model_id references extraction_id', () => {
    expect(poiModel.poi_model_id).toContain(extraction.extraction_id);
  });

  it('metrics.evaluated_poi_count matches evaluated_pois length', () => {
    expect(poiModel.metrics.evaluated_poi_count).toBe(poiModel.evaluated_pois.length);
  });

  it('each evaluated POI has valid load_class', () => {
    const valid = ['quiet', 'moderate', 'busy', 'very_busy', 'unknown'];
    for (const p of poiModel.evaluated_pois) {
      expect(valid).toContain(p.load_class);
    }
  });

  it('normalized_load_score is within [0, 1]', () => {
    for (const p of poiModel.evaluated_pois) {
      expect(p.normalized_load_score).toBeGreaterThanOrEqual(0);
      expect(p.normalized_load_score).toBeLessThanOrEqual(1);
    }
  });

  it('privacy_masked POIs have load_class unknown', () => {
    for (const p of poiModel.evaluated_pois) {
      if (p.privacy_masked) {
        expect(p.load_class).toBe('unknown');
      }
    }
  });

  it('masked_poi_count + unmasked = evaluated_poi_count', () => {
    const unmasked = poiModel.evaluated_pois.filter((p) => !p.privacy_masked).length;
    expect(poiModel.metrics.masked_poi_count + unmasked).toBe(poiModel.metrics.evaluated_poi_count);
  });
});

// ── 52.2 LoadProjection ───────────────────────────────────────────────────────

describe('Engine – 52.2 computeLoadProjection', () => {
  const poiModel = computePoiModel(
    { ...ctxSpatial, telco_load: mockTelcoLoadState },
    baseInputs,
  );
  const ctxWithPoi = { ...ctxSpatial, telco_load: mockTelcoLoadState, poi_model: poiModel };
  const loadProjection = computeLoadProjection(ctxWithPoi, baseInputs);

  it('produces one EdgeLoadScore per graph edge', () => {
    expect(loadProjection.edge_load_scores.length).toBe(graph.edges.length);
  });

  it('all edge_ids match graph edge_ids', () => {
    const graphEdgeIds = new Set(graph.edges.map((e) => e.edge_id));
    for (const els of loadProjection.edge_load_scores) {
      expect(graphEdgeIds.has(els.edge_id)).toBe(true);
    }
  });

  it('normalized_load_score is within [0, 1]', () => {
    for (const els of loadProjection.edge_load_scores) {
      expect(els.normalized_load_score).toBeGreaterThanOrEqual(0);
      expect(els.normalized_load_score).toBeLessThanOrEqual(1);
    }
  });

  it('metrics projected + masked + unprojected covers all edges', () => {
    const total = graph.edges.length;
    const { masked_edge_count, projected_edge_count, unprojected_edge_count } = loadProjection.metrics;
    // projected + unprojected = non-masked edges; masked are separate
    expect(projected_edge_count + unprojected_edge_count + masked_edge_count).toBeLessThanOrEqual(total + masked_edge_count);
    expect(loadProjection.edge_load_scores.length).toBe(total);
  });

  it('avg_load_score <= max_load_score', () => {
    expect(loadProjection.metrics.avg_load_score).toBeLessThanOrEqual(loadProjection.metrics.max_load_score + 0.001);
  });
});

// ── 52.3 MovementModel ────────────────────────────────────────────────────────

describe('Engine – 52.3 computeMovementModel', () => {
  const poiModel = computePoiModel(
    { ...ctxSpatial, telco_load: mockTelcoLoadState },
    baseInputs,
  );
  const ctxWithPoi = { ...ctxSpatial, telco_load: mockTelcoLoadState, poi_model: poiModel };
  const loadProjection = computeLoadProjection(ctxWithPoi, baseInputs) as LoadProjectionState;
  const ctxWithLoad = { ...ctxWithPoi, load_model: loadProjection };
  const movementModel = computeMovementModel(ctxWithLoad, baseInputs);

  it('produces one EdgeMovementState per load projection edge', () => {
    expect(movementModel.edge_movement_states.length).toBe(loadProjection.edge_load_scores.length);
  });

  it('movement_ratio + stillness_ratio ≈ 1 for each edge', () => {
    for (const ems of movementModel.edge_movement_states) {
      expect(ems.movement_ratio + ems.stillness_ratio).toBeCloseTo(1, 2);
    }
  });

  it('movement_ratio is within [0, 1]', () => {
    for (const ems of movementModel.edge_movement_states) {
      expect(ems.movement_ratio).toBeGreaterThanOrEqual(0);
      expect(ems.movement_ratio).toBeLessThanOrEqual(1);
    }
  });

  it('valid movement_class values', () => {
    const valid = ['high_flow', 'moderate_flow', 'low_flow', 'static', 'unknown'];
    for (const ems of movementModel.edge_movement_states) {
      expect(valid).toContain(ems.movement_class);
    }
  });

  it('metrics.evaluated_edge_count matches edge_movement_states length', () => {
    expect(movementModel.metrics.evaluated_edge_count).toBe(movementModel.edge_movement_states.length);
  });
});

// ── 52.4 MaskingModel ─────────────────────────────────────────────────────────

describe('Engine – 52.4 computeMaskingModel', () => {
  const poiModel = computePoiModel(
    { ...ctxSpatial, telco_load: mockTelcoLoadState },
    baseInputs,
  ) as PoiModelState;
  const ctxWithPoi = { ...ctxSpatial, telco_load: mockTelcoLoadState, poi_model: poiModel };
  const loadProjection = computeLoadProjection(ctxWithPoi, baseInputs) as LoadProjectionState;
  const ctxWithLoad = { ...ctxWithPoi, load_model: loadProjection };
  const maskingModel = computeMaskingModel(ctxWithLoad, baseInputs);

  it('masked_pois + masked_edges = total_masked', () => {
    const { masked_pois, masked_edges, total_masked } = maskingModel.metrics;
    expect(masked_pois + masked_edges).toBe(total_masked);
  });

  it('masking_ratio is within [0, 1]', () => {
    expect(maskingModel.metrics.masking_ratio).toBeGreaterThanOrEqual(0);
    expect(maskingModel.metrics.masking_ratio).toBeLessThanOrEqual(1);
  });

  it('all masked_elements have valid element_type', () => {
    const validTypes = ['poi', 'edge', 'area'];
    for (const el of maskingModel.masked_elements) {
      expect(validTypes).toContain(el.element_type);
    }
  });

  it('masking_model_id is defined', () => {
    expect(maskingModel.masking_model_id).toBeTruthy();
  });
});

// ── 52.5 RouteModel ───────────────────────────────────────────────────────────

describe('Engine – 52.5 computeRouteModel', () => {
  const poiModel = computePoiModel(
    { ...ctxSpatial, telco_load: mockTelcoLoadState },
    baseInputs,
  ) as PoiModelState;
  const ctxWithPoi = { ...ctxSpatial, telco_load: mockTelcoLoadState, poi_model: poiModel };
  const loadProjection = computeLoadProjection(ctxWithPoi, baseInputs) as LoadProjectionState;
  const ctxWithLoad = { ...ctxWithPoi, load_model: loadProjection };
  const movementModel = computeMovementModel(ctxWithLoad, baseInputs) as MovementModelState;
  const maskingModel = computeMaskingModel(ctxWithLoad, baseInputs) as MaskingModelState;
  const ctxWithEngine = { ...ctxWithLoad, movement_model: movementModel, masking_model: maskingModel };
  const routeModel = computeRouteModel(ctxWithEngine, baseInputs);

  it('evaluates all graph edges', () => {
    expect(routeModel.edge_evaluations.length).toBeGreaterThanOrEqual(graph.edges.length);
  });

  it('metrics sum equals evaluated_edge_count', () => {
    const { included_edge_count, degraded_edge_count, excluded_edge_count, warn_edge_count, evaluated_edge_count } =
      routeModel.metrics;
    expect(included_edge_count + degraded_edge_count + excluded_edge_count + warn_edge_count).toBe(evaluated_edge_count);
  });

  it('decision matches score_class logic', () => {
    for (const ev of routeModel.edge_evaluations) {
      if (ev.score_class === 'blocked') {
        expect(ev.decision).toBe('exclude');
      }
      if (ev.decision === 'include') {
        expect(ev.normalized_load_score).toBeLessThan(routeModel.route_degrade_threshold + 0.001);
      }
    }
  });

  it('thresholds match system_adjust defaults', () => {
    expect(routeModel.route_degrade_threshold).toBe(
      mockSystemAdjustState.default_parameters.default_route_degrade_threshold,
    );
    expect(routeModel.route_exclude_threshold).toBe(
      mockSystemAdjustState.default_parameters.default_route_exclude_threshold,
    );
  });
});

// ── 52.6 RouteLayerModel ──────────────────────────────────────────────────────

describe('Engine – 52.6 computeRouteLayerModel', () => {
  const poiModel = computePoiModel(
    { ...ctxSpatial, telco_load: mockTelcoLoadState },
    baseInputs,
  ) as PoiModelState;
  const ctxWithPoi = { ...ctxSpatial, telco_load: mockTelcoLoadState, poi_model: poiModel };
  const loadProjection = computeLoadProjection(ctxWithPoi, baseInputs) as LoadProjectionState;
  const ctxWithLoad = { ...ctxWithPoi, load_model: loadProjection };
  const movementModel = computeMovementModel(ctxWithLoad, baseInputs) as MovementModelState;
  const maskingModel = computeMaskingModel(ctxWithLoad, baseInputs) as MaskingModelState;
  const ctxFull = { ...ctxWithLoad, movement_model: movementModel, masking_model: maskingModel };
  const routeModel = computeRouteModel(ctxFull, baseInputs) as RouteModelState;
  const ctxWithRoute = { ...ctxFull, route_model: routeModel };
  const routeLayerModel = computeRouteLayerModel(ctxWithRoute, baseInputs);

  it('has one segment per edge evaluation', () => {
    expect(routeLayerModel.segments.length).toBe(routeModel.edge_evaluations.length);
  });

  it('visible_segment_count matches visible segments', () => {
    const visible = routeLayerModel.segments.filter((s) => s.visible).length;
    expect(routeLayerModel.visible_segment_count).toBe(visible);
  });

  it('excluded edges produce non-visible segments', () => {
    for (const ev of routeModel.edge_evaluations) {
      const seg = routeLayerModel.segments.find((s) => s.edge_id === ev.edge_id);
      if (seg && ev.decision === 'exclude') {
        expect(seg.visible).toBe(false);
      }
    }
  });

  it('score_class_styles covers all 6 classes', () => {
    expect(routeLayerModel.score_class_styles.length).toBe(6);
  });

  it('each segment style color is a hex string', () => {
    for (const seg of routeLayerModel.segments) {
      expect(seg.style.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

// ── 52.7 LayerModel ───────────────────────────────────────────────────────────

describe('Engine – 52.7 computeLayerModel', () => {
  const poiModel = computePoiModel(
    { ...ctxSpatial, telco_load: mockTelcoLoadState },
    baseInputs,
  ) as PoiModelState;
  const ctxWithPoi = { ...ctxSpatial, telco_load: mockTelcoLoadState, poi_model: poiModel };
  const loadProjection = computeLoadProjection(ctxWithPoi, baseInputs) as LoadProjectionState;
  const ctxWithLoad = { ...ctxWithPoi, load_model: loadProjection };
  const movementModel = computeMovementModel(ctxWithLoad, baseInputs) as MovementModelState;
  const maskingModel = computeMaskingModel(ctxWithLoad, baseInputs) as MaskingModelState;
  const ctxFull = { ...ctxWithLoad, movement_model: movementModel, masking_model: maskingModel };
  const routeModel = computeRouteModel(ctxFull, baseInputs) as RouteModelState;
  const routeLayerModel = computeRouteLayerModel(
    { ...ctxFull, route_model: routeModel },
    baseInputs,
  ) as RouteLayerModelState;
  const ctxAllLayers = { ...ctxFull, route_model: routeModel, route_layer_model: routeLayerModel };
  const layerModel = computeLayerModel(ctxAllLayers, baseInputs);

  it('includes at least a basis tile layer', () => {
    expect(layerModel.layers.some((l) => l.layer_type === 'basis_tile_layer')).toBe(true);
  });

  it('includes a route_score_layer', () => {
    expect(layerModel.layers.some((l) => l.layer_type === 'route_score_layer')).toBe(true);
  });

  it('visible_layer_count matches visible layers', () => {
    const visible = layerModel.layers.filter((l) => l.visible).length;
    expect(layerModel.visible_layer_count).toBe(visible);
  });

  it('layer_model_id is defined', () => {
    expect(layerModel.layer_model_id).toBeTruthy();
  });

  it('all layers have valid data_class', () => {
    const valid = ['public_aggregate', 'reduced_scim_result', 'operator_internal', 'debug', 'raw_signal', 'forbidden_for_sensus_core'];
    for (const l of layerModel.layers) {
      expect(valid).toContain(l.data_class);
    }
  });
});
