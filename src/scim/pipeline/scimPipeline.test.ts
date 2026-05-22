import { describe, it, expect } from 'vitest';
import { runScimPipeline } from './scimPipeline';
import type { ScimPipelineInputs } from './scimPipeline.types';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { mockRegioContentState } from '../regio-content/regioContent.mock';
import { mockTargetAppUiState } from '../target-app-ui/targetAppUi.mock';
import { mockTelcoLoadState } from '../telco-load/telcoLoad.mock';
import { mockGraphState } from '../graph/graph.mock';

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
  it('fails at panel_1_system_adjust', () => {
    const inputs: ScimPipelineInputs = {
      ...validInputs,
      system_adjust: {
        ...mockSystemAdjustState,
        system_adjust_version: '',  // triggers SYSADJ_VERSION_MISSING
      },
    };
    const result = runScimPipeline(inputs);
    expect(result.success).toBe(false);
    expect(result.failed_at_step).toBe('panel_1_system_adjust');
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
  it('fails at panel_4_telco_load', () => {
    const inputs: ScimPipelineInputs = {
      ...validInputs,
      telco_load: {
        ...mockTelcoLoadState,
        telco_load_batch_id: '',  // triggers TELCO_BATCH_ID_MISSING
      },
    };
    const result = runScimPipeline(inputs);
    expect(result.success).toBe(false);
    expect(result.failed_at_step).toBe('panel_4_telco_load');
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
