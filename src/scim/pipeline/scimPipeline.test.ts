import { describe, it, expect } from 'vitest';
import { runScimPipeline } from './scimPipeline';
import type { ScimPipelineInputs } from './scimPipeline.types';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { mockRegioContentState } from '../regio-content/regioContent.mock';
import { mockTargetAppUiState } from '../target-app-ui/targetAppUi.mock';
import { mockTelcoLoadState } from '../telco-load/telcoLoad.mock';
import { mockGraphState } from '../graph/graph.mock';
import type { RouteLayerModelState } from '../route-layer-model/routeLayerModel.types';

// Minimal mock road network derived from mockGraphState
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
  extracted_at: '2026-05-21T00:00:00.000Z',
};

const validInputs: ScimPipelineInputs = {
  system_adjust: mockSystemAdjustState,
  regio_content: mockRegioContentState,
  target_app_ui: mockTargetAppUiState,
  telco_load: mockTelcoLoadState,
  road_network: mockRoadNetwork,
  run_id: 'test_run_001',
};

// ── 50.1 happy path ───────────────────────────────────────────────────────────

describe('Pipeline – 50.1 happy path with valid mock inputs', () => {
  it('returns success=true and a release', () => {
    const result = runScimPipeline(validInputs);
    expect(result.success).toBe(true);
    expect(result.release).toBeDefined();
    expect(result.release?.status).toBe('released');
  });

  it('runs all recorded steps (18 without user_tolerances)', () => {
    const result = runScimPipeline(validInputs);
    expect(result.steps.length).toBeGreaterThanOrEqual(18);
  });

  it('all steps report success', () => {
    const result = runScimPipeline(validInputs);
    const failed = result.steps.filter((s) => !s.success);
    expect(failed).toHaveLength(0);
  });

  it('context contains all panel states', () => {
    const result = runScimPipeline(validInputs);
    const ctx = result.context;
    expect(ctx.system_adjust).toBeDefined();
    expect(ctx.regio_content).toBeDefined();
    expect(ctx.telco_load).toBeDefined();
    expect(ctx.boundary).toBeDefined();
    expect(ctx.extracted_data).toBeDefined();
    expect(ctx.graph).toBeDefined();
    expect(ctx.basis_layer).toBeDefined();
    expect(ctx.poi_model).toBeDefined();
    expect(ctx.load_model).toBeDefined();
    expect(ctx.movement_model).toBeDefined();
    expect(ctx.masking_model).toBeDefined();
    expect(ctx.route_model).toBeDefined();
    expect(ctx.route_layer_model).toBeDefined();
    expect(ctx.layer_model).toBeDefined();
    expect(ctx.sensus_core_package).toBeDefined();
    expect(ctx.leaflet_effect_check).toBeDefined();
    expect(ctx.release).toBeDefined();
  });

  it('preserves the run_id', () => {
    const result = runScimPipeline(validInputs);
    expect(result.run_id).toBe('test_run_001');
  });
});

// ── 50.2 Panel 1 failure stops pipeline ───────────────────────────────────────

describe('Pipeline – 50.2 invalid system_adjust stops at panel 1', () => {
  it('fails at P01_system_adjust', () => {
    const inputs: ScimPipelineInputs = {
      ...validInputs,
      system_adjust: {
        ...mockSystemAdjustState,
        system_adjust_version: '',  // triggers SYSADJ_VERSION_MISSING
      },
    };
    const result = runScimPipeline(inputs);
    expect(result.success).toBe(false);
    expect(result.failed_at_step).toBe('P01_system_adjust');
  });

  it('context has no downstream state when panel 1 fails', () => {
    const inputs: ScimPipelineInputs = {
      ...validInputs,
      system_adjust: { ...mockSystemAdjustState, system_adjust_version: '' },
    };
    const result = runScimPipeline(inputs);
    expect(result.context.regio_content).toBeUndefined();
    expect(result.context.boundary).toBeUndefined();
    expect(result.release).toBeUndefined();
  });
});

// ── 50.3 Panel 4 failure stops pipeline ───────────────────────────────────────

describe('Pipeline – 50.3 invalid telco_load stops at panel 4', () => {
  it('fails at P04_telco_load', () => {
    const inputs: ScimPipelineInputs = {
      ...validInputs,
      telco_load: {
        ...mockTelcoLoadState,
        telco_load_batch_id: '',  // triggers TELCO_BATCH_ID_MISSING
      },
    };
    const result = runScimPipeline(inputs);
    expect(result.success).toBe(false);
    expect(result.failed_at_step).toBe('P04_telco_load');
  });
});

// ── 50.4 user_tolerances optional ────────────────────────────────────────────

describe('Pipeline – 50.4 user_tolerances panel is skipped when absent', () => {
  it('succeeds and local_user_context is absent', () => {
    const result = runScimPipeline(validInputs);
    expect(result.success).toBe(true);
    expect(result.context.local_user_context).toBeUndefined();
  });

  it('succeeds with user_tolerances provided', () => {
    const inputs: ScimPipelineInputs = {
      ...validInputs,
      user_tolerances: {
        route_load_tolerance: 0.2,
        max_acceptable_load_score: 0.7,
      },
    };
    const result = runScimPipeline(inputs);
    expect(result.success).toBe(true);
    expect(result.context.local_user_context).toBeDefined();
  });
});

// ── 50.6 neue Pipeline-Steps im Context ───────────────────────────────────────

describe('Pipeline – 50.6 neue States (P05/P06/P09) im Context nach erfolgreichem Run', () => {
  it('ctx.operator_zones ist nach dem Run definiert', () => {
    const result = runScimPipeline(validInputs);
    expect(result.context.operator_zones).toBeDefined();
  });

  it('ctx.signal_interpretation ist nach dem Run definiert', () => {
    const result = runScimPipeline(validInputs);
    expect(result.context.signal_interpretation).toBeDefined();
  });

  it('ctx.operator_decision ist nach dem Run definiert', () => {
    const result = runScimPipeline(validInputs);
    expect(result.context.operator_decision).toBeDefined();
  });

  it('ctx.step2_activation ist nach dem Run definiert', () => {
    const result = runScimPipeline(validInputs);
    expect(result.context.step2_activation).toBeDefined();
  });

  it('operator_zones hat status operator_zone_warning (OZ_NO_ZONES Warning ohne Zonen)', () => {
    const result = runScimPipeline(validInputs);
    // computeOperatorZones() liefert leere Zonenliste → Validation erzeugt OZ_NO_ZONES Warning
    // → Pipeline-stampStatus setzt 'operator_zone_warning'
    expect(result.context.operator_zones?.status).toBe('operator_zone_warning');
  });

  it('step2_activation hat status not_triggered (kein Jam in Mock-Daten)', () => {
    const result = runScimPipeline(validInputs);
    expect(result.context.step2_activation?.status).toBe('not_triggered');
  });

  it('classification_mode bleibt movement_only ohne Jam', () => {
    const result = runScimPipeline(validInputs);
    expect(result.context.classification_mode).toBe('movement_only');
  });

  it('Pipeline hat Steps für P05_operator_zones und P06_signal_interpretation', () => {
    const result = runScimPipeline(validInputs);
    const stepIds = result.steps.map((s) => s.step_id);
    expect(stepIds).toContain('P05_operator_zones');
    expect(stepIds).toContain('P06_signal_interpretation');
  });

  it('Pipeline hat Steps für P09_operator_decision und P09_step2_activation', () => {
    const result = runScimPipeline(validInputs);
    const stepIds = result.steps.map((s) => s.step_id);
    expect(stepIds).toContain('P09_operator_decision');
    expect(stepIds).toContain('P09_step2_activation');
  });
});

// ── 50.7 SVG Edge-Type-Filter durch Pipeline ──────────────────────────────────

describe('Pipeline – 50.7 excluded_edge_types propagiert bis route_layer_model', () => {
  // mockGraphState hat ausschließlich 'trail'-Kanten → alle Segmente müssten unsichtbar werden
  const inputsWithTrailExcluded: ScimPipelineInputs = {
    ...validInputs,
    system_adjust: {
      ...mockSystemAdjustState,
      svg_overlay: {
        ...(mockSystemAdjustState.svg_overlay ?? {}),
        excluded_edge_types: ['trail'],
      },
    },
  };

  it('Pipeline scheitert erwartungsgemäß an P13 wenn alle Segmente ausgeblendet sind', () => {
    // Alle Mock-Kanten sind 'trail' → visible_segment_count=0 → anyLayerError=true in LeafletEffectCheck
    // Das ist korrektes Verhalten: der Operator soll keine leere Karte releasen können
    const result = runScimPipeline(inputsWithTrailExcluded);
    expect(result.success).toBe(false);
    expect(result.failed_at_step).toBe('P13_leaflet_effect_check');
  });

  it('route_layer_model.excluded_edge_types enthält "trail"', () => {
    const result = runScimPipeline(inputsWithTrailExcluded);
    const rlm = result.context.route_layer_model as RouteLayerModelState | undefined;
    expect(rlm?.excluded_edge_types).toContain('trail');
  });

  it('alle trail-Segmente haben visible=false', () => {
    const result = runScimPipeline(inputsWithTrailExcluded);
    const rlm = result.context.route_layer_model as RouteLayerModelState | undefined;
    const trailSegments = (rlm?.segments ?? []).filter((s) => s.edge_type === 'trail');
    // Es müssen Segmente vorhanden sein (Mock hat 3 trail-Kanten im Graphen)
    expect(trailSegments.length).toBeGreaterThan(0);
    expect(trailSegments.every((s) => s.visible === false)).toBe(true);
  });

  it('visible_segment_count ist 0 wenn alle Segmente trail sind', () => {
    const result = runScimPipeline(inputsWithTrailExcluded);
    const rlm = result.context.route_layer_model as RouteLayerModelState | undefined;
    expect(rlm?.visible_segment_count).toBe(0);
  });

  it('kein Ausschluss wenn excluded_edge_types leer', () => {
    const result = runScimPipeline(validInputs); // kein svg_overlay mit exclusions
    const rlm = result.context.route_layer_model as RouteLayerModelState | undefined;
    // Alle Segmente sind sichtbar
    expect((rlm?.segments ?? []).every((s) => s.visible)).toBe(true);
  });
});

// ── 50.5 result shape ─────────────────────────────────────────────────────────

describe('Pipeline – 50.5 result shape', () => {
  it('completed_at is set on success', () => {
    const result = runScimPipeline(validInputs);
    expect(result.completed_at).toBeTruthy();
  });

  it('duration_ms is non-negative', () => {
    const result = runScimPipeline(validInputs);
    expect(result.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('errors array is empty on success', () => {
    const result = runScimPipeline(validInputs);
    expect(result.errors).toHaveLength(0);
  });
});
