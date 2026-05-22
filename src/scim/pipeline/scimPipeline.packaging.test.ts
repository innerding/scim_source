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
  computeSensusCorePackage,
  computeSensusCoreLocal,
  computeSensusCoreView,
  computeLeafletEffectCheck,
  computeReleaseExport,
  computeScimRuntimeContext,
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
import type { LayerModelState } from '../layer-model/layerModel.types';
import type { SensusCorePackageState } from '../sensus-core-package/sensusCorePackage.types';
import type { SensusCoreViewState } from '../sensus-core-view/sensusCoreView.types';
import type { LeafletEffectCheckState } from '../leaflet-effect-check/leafletEffectCheck.types';

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
  run_id: 'test_pkg_run',
};

// Build full engine context.
const ctx0 = makeEmptyContext();
const boundary = computeBoundary(ctx0, baseInputs) as BoundaryState;
const extraction = computeExtraction({ ...ctx0, boundary }, baseInputs) as ExtractionState;
const graph = computeGraph({ ...ctx0, boundary, extracted_data: extraction }, baseInputs) as GraphState;
const basisLayer = computeBasisLayer(
  { ...ctx0, boundary, extracted_data: extraction, graph },
  baseInputs,
) as BasisLayerState;
const ctxSpatial = { ...ctx0, boundary, extracted_data: extraction, graph, basis_layer: basisLayer,
  system_adjust: mockSystemAdjustState, regio_content: mockRegioContentState,
  target_app_ui: mockTargetAppUiState, telco_load: mockTelcoLoadState };

const poiModel = computePoiModel(ctxSpatial, baseInputs) as PoiModelState;
const ctxPoi = { ...ctxSpatial, poi_model: poiModel };
const loadProjection = computeLoadProjection(ctxPoi, baseInputs) as LoadProjectionState;
const ctxLoad = { ...ctxPoi, load_model: loadProjection };
const movementModel = computeMovementModel(ctxLoad, baseInputs) as MovementModelState;
const maskingModel = computeMaskingModel(ctxLoad, baseInputs) as MaskingModelState;
const ctxEngine = { ...ctxLoad, movement_model: movementModel, masking_model: maskingModel };
const routeModel = computeRouteModel(ctxEngine, baseInputs) as RouteModelState;
const routeLayerModel = computeRouteLayerModel({ ...ctxEngine, route_model: routeModel }, baseInputs) as RouteLayerModelState;
const layerModel = computeLayerModel(
  { ...ctxEngine, route_model: routeModel, route_layer_model: routeLayerModel },
  baseInputs,
) as LayerModelState;

const ctxFull = {
  ...ctxEngine,
  route_model: routeModel,
  route_layer_model: routeLayerModel,
  layer_model: layerModel,
};

// ── 53.1 SensusCorePackage ────────────────────────────────────────────────────

describe('Packaging – 53.1 computeSensusCorePackage', () => {
  const pkg = computeSensusCorePackage(ctxFull, baseInputs);

  it('package_id references layer_model_id', () => {
    expect(pkg.package_id).toContain(layerModel.layer_model_id);
  });

  it('content.layer_count matches layer model', () => {
    expect(pkg.content.layer_count).toBe(layerModel.layers.length);
  });

  it('content.route_segments_count matches visible route segments', () => {
    expect(pkg.content.route_segments_count).toBe(routeLayerModel.segments.length);
  });

  it('content.poi_states_count matches evaluated POIs', () => {
    expect(pkg.content.poi_states_count).toBe(poiModel.evaluated_pois.length);
  });

  it('privacy invariants are enforced', () => {
    expect(pkg.content.raw_signals_present).toBe(false);
    expect(pkg.content.device_ids_present).toBe(false);
    expect(pkg.content.debug_data_present).toBe(false);
  });

  it('data_classes_included is non-empty', () => {
    expect(pkg.content.data_classes_included.length).toBeGreaterThan(0);
  });
});

// ── 53.2 SensusCoreLocal ──────────────────────────────────────────────────────

describe('Packaging – 53.2 computeSensusCoreLocal', () => {
  it('returns null when user_tolerances absent', () => {
    const result = computeSensusCoreLocal(ctxFull, baseInputs);
    expect(result).toBeNull();
  });

  it('returns a state when user_tolerances provided', () => {
    const inputs: ScimPipelineInputs = {
      ...baseInputs,
      user_tolerances: { route_load_tolerance: 0.5, max_acceptable_load_score: 0.8 },
    };
    const result = computeSensusCoreLocal(ctxFull, inputs);
    expect(result).not.toBeNull();
    expect(result!.status).toBe('local_context_valid');
  });

  it('clamps route_load_tolerance within allowed range', () => {
    const { min, max } = mockSystemAdjustState.allowed_ranges.route_degrade_threshold;
    const inputs: ScimPipelineInputs = {
      ...baseInputs,
      user_tolerances: { route_load_tolerance: -1, max_acceptable_load_score: 0.7 },
    };
    const result = computeSensusCoreLocal(ctxFull, inputs)!;
    expect(result.tolerances.route_load_tolerance).toBeGreaterThanOrEqual(min);
    expect(result.tolerances.route_load_tolerance).toBeLessThanOrEqual(max);
  });

  it('invalid preferred_difficulty falls back to "any"', () => {
    const inputs: ScimPipelineInputs = {
      ...baseInputs,
      user_tolerances: {
        route_load_tolerance: 0.5,
        max_acceptable_load_score: 0.7,
        preferred_difficulty: 'extreme' as never,
      },
    };
    const result = computeSensusCoreLocal(ctxFull, inputs)!;
    expect(result.tolerances.preferred_difficulty).toBe('any');
  });
});

// ── 53.3 SensusCoreView ───────────────────────────────────────────────────────

describe('Packaging – 53.3 computeSensusCoreView', () => {
  const pkg = computeSensusCorePackage(ctxFull, baseInputs) as SensusCorePackageState;
  const ctxWithPkg = { ...ctxFull, sensus_core_package: pkg };
  const view = computeSensusCoreView(ctxWithPkg, baseInputs);

  it('view_id references package_id', () => {
    expect(view.view_id).toContain(pkg.package_id);
  });

  it('active_layers count matches layer model', () => {
    expect(view.active_layers.length).toBe(layerModel.layers.length);
  });

  it('viewport_zoom is a positive integer', () => {
    expect(view.viewport_zoom).toBeGreaterThan(0);
  });

  it('viewport_center is within the boundary bbox', () => {
    const [lon, lat] = view.viewport_center.coordinates;
    const bbox = boundary.computed_boundary.bbox;
    expect(lon).toBeGreaterThan(bbox[0]);
    expect(lon).toBeLessThan(bbox[2]);
    expect(lat).toBeGreaterThan(bbox[1]);
    expect(lat).toBeLessThan(bbox[3]);
  });

  it('status is view_active', () => {
    expect(view.status).toBe('view_active');
  });
});

// ── 53.4 LeafletEffectCheck ───────────────────────────────────────────────────

describe('Packaging – 53.4 computeLeafletEffectCheck', () => {
  const pkg = computeSensusCorePackage(ctxFull, baseInputs) as SensusCorePackageState;
  const ctxWithPkg = { ...ctxFull, sensus_core_package: pkg };
  const view = computeSensusCoreView(ctxWithPkg, baseInputs) as SensusCoreViewState;
  const ctxWithView = { ...ctxWithPkg, view_state: view };
  const effectCheck = computeLeafletEffectCheck(ctxWithView, baseInputs);

  it('check_id references package_id', () => {
    expect(effectCheck.check_id).toContain(pkg.package_id);
  });

  it('visible_segment_count matches route layer model', () => {
    expect(effectCheck.render_result.visible_segment_count).toBe(routeLayerModel.visible_segment_count);
  });

  it('status is effect_check_ok when segments are visible', () => {
    if (routeLayerModel.visible_segment_count > 0) {
      expect(effectCheck.status).toBe('effect_check_ok');
    }
  });

  it('render_result counts are non-negative', () => {
    expect(effectCheck.render_result.visible_segment_count).toBeGreaterThanOrEqual(0);
    expect(effectCheck.render_result.visible_poi_count).toBeGreaterThanOrEqual(0);
  });
});

// ── 53.5 ReleaseExport ────────────────────────────────────────────────────────

describe('Packaging – 53.5 computeReleaseExport', () => {
  const pkg = computeSensusCorePackage(ctxFull, baseInputs) as SensusCorePackageState;
  const ctxWithPkg = { ...ctxFull, sensus_core_package: pkg };
  const view = computeSensusCoreView(ctxWithPkg, baseInputs) as SensusCoreViewState;
  const effectCheck = computeLeafletEffectCheck(
    { ...ctxWithPkg, view_state: view },
    baseInputs,
  ) as LeafletEffectCheckState;
  const ctxRelease = { ...ctxWithPkg, leaflet_effect_check: effectCheck };
  const release = computeReleaseExport(ctxRelease, baseInputs);

  it('release_id references package_id', () => {
    expect(release.release_id).toContain(pkg.package_id);
  });

  it('status is released when privacy verified', () => {
    if (release.metadata.privacy_verified) {
      expect(release.status).toBe('released');
    }
  });

  it('privacy invariants hold in metadata', () => {
    expect(release.metadata.raw_signals_excluded).toBe(true);
    expect(release.metadata.device_ids_excluded).toBe(true);
    expect(release.metadata.sensus_core_safe).toBe(true);
  });

  it('expires_at is after released_at', () => {
    expect(release.expires_at).toBeDefined();
    expect(new Date(release.expires_at!).getTime()).toBeGreaterThan(
      new Date(release.released_at).getTime(),
    );
  });
});

// ── 53.6 ScimRuntimeContext ───────────────────────────────────────────────────

describe('Packaging – 53.6 computeScimRuntimeContext', () => {
  it('reports completeness=1 when all panels assembled', () => {
    const pkg = computeSensusCorePackage(ctxFull, baseInputs) as SensusCorePackageState;
    const release = computeReleaseExport({ ...ctxFull, sensus_core_package: pkg }, baseInputs);
    const ctxComplete = { ...ctxFull, sensus_core_package: pkg, release };
    const rtx = computeScimRuntimeContext(ctxComplete, baseInputs);
    expect(rtx.pipeline_completeness).toBe(1);
    expect(rtx.missing_panels).toHaveLength(0);
    expect(rtx.status).toBe('runtime_context_valid');
  });

  it('records assembled panel names', () => {
    const rtx = computeScimRuntimeContext(ctxFull, baseInputs);
    expect(rtx.assembled_panels).toContain('system_adjust');
    expect(rtx.assembled_panels).toContain('graph');
    expect(rtx.assembled_panels).toContain('layer_model');
  });

  it('versions.system_adjust_version matches input', () => {
    const rtx = computeScimRuntimeContext(ctxFull, baseInputs);
    expect(rtx.versions.system_adjust_version).toBe(mockSystemAdjustState.system_adjust_version);
  });

  it('versions includes graph_id', () => {
    const rtx = computeScimRuntimeContext(ctxFull, baseInputs);
    expect(rtx.versions.graph_id).toBe(graph.graph_id);
  });

  it('reports missing panels when context is partial', () => {
    const partialCtx = { ...ctx0, system_adjust: mockSystemAdjustState };
    const rtx = computeScimRuntimeContext(partialCtx, baseInputs);
    expect(rtx.missing_panels.length).toBeGreaterThan(0);
    expect(rtx.pipeline_completeness).toBeLessThan(1);
    expect(rtx.status).toBe('runtime_context_warning');
  });

  it('runtime_context_id contains run_id', () => {
    const rtx = computeScimRuntimeContext(ctxFull, baseInputs);
    expect(rtx.runtime_context_id).toContain('test_pkg_run');
  });
});
