import { describe, it, expect } from 'vitest';
import { makeEmptyContext } from './scimContext.types';
import { applyPanelContextUpdate } from './scimContext.update';
import { invalidateDownstream, checkRepresentationIdConsistency } from './scimContext.invalidate';
import { canRunRegioContentInput, canRunGraphBasisLayer } from './scimContext.guards';
import { isSensusCoreSafe } from './scimContext.visibility';
import { isPrivacyLevelAllowedInSensusCore } from './scimContext.privacy';
import { isPanelAllowedToWrite } from './scimContext.writePolicies';
import type { SystemAdjustState } from './scimContext.types';

// ── helpers ──────────────────────────────────────────────────────────────────

function stubState(_id: string): SystemAdjustState {
  return { status: 'system_adjust_valid' };
}

// ── Classification mode ───────────────────────────────────────────────────────

describe('Classification mode', () => {
  it('makeEmptyContext defaults to movement_only', () => {
    const ctx = makeEmptyContext();
    expect(ctx.classification_mode).toBe('movement_only');
  });

  it('makeEmptyContext sets step2_activation_condition_met to false', () => {
    const ctx = makeEmptyContext();
    expect(ctx.step2_activation_condition_met).toBe(false);
  });
});

// ── Write policies ────────────────────────────────────────────────────────────

describe('Write policies', () => {
  it('Panel 1 may write system_adjust', () => {
    expect(isPanelAllowedToWrite('panel_1_system_adjust_input', 'context.system_adjust')).toBe(true);
  });

  it('Panel 1 may NOT write regio_content', () => {
    expect(isPanelAllowedToWrite('panel_1_system_adjust_input', 'context.regio_content')).toBe(false);
  });

  it('Panel 7 may write poi_model', () => {
    expect(isPanelAllowedToWrite('panel_9_poi_load_movement', 'context.poi_model')).toBe(true);
  });

  it('Panel 7 may NOT write route_model', () => {
    expect(isPanelAllowedToWrite('panel_9_poi_load_movement', 'context.route_model')).toBe(false);
  });

  it('Panel 9 may NOT write route_model', () => {
    expect(isPanelAllowedToWrite('panel_11_sensus_core_package_builder', 'context.route_model')).toBe(false);
  });

  it('Panel 1 may write classification_mode', () => {
    expect(isPanelAllowedToWrite('panel_1_system_adjust_input', 'context.classification_mode')).toBe(true);
  });

  it('Panel 7 may NOT write classification_mode', () => {
    expect(isPanelAllowedToWrite('panel_9_poi_load_movement', 'context.classification_mode')).toBe(false);
  });

  it('Panel 7 may write step2_activation_condition_met', () => {
    expect(isPanelAllowedToWrite('panel_9_poi_load_movement', 'context.step2_activation_condition_met')).toBe(true);
  });

  it('Panel 1 may NOT write step2_activation_condition_met', () => {
    expect(isPanelAllowedToWrite('panel_1_system_adjust_input', 'context.step2_activation_condition_met')).toBe(false);
  });
});

// ── applyPanelContextUpdate ───────────────────────────────────────────────────

describe('applyPanelContextUpdate', () => {
  it('allows panel 1 to write system_adjust', () => {
    const ctx = makeEmptyContext();
    const state = stubState('sa-1');
    const result = applyPanelContextUpdate(ctx, 'panel_1_system_adjust_input', {
      system_adjust: state,
    });
    expect(result.success).toBe(true);
    expect(result.context.system_adjust).toEqual(state);
    expect(result.updated_paths).toContain('context.system_adjust');
    expect(result.rejected_paths).toHaveLength(0);
  });

  it('blocks panel 2 from writing system_adjust', () => {
    const ctx = makeEmptyContext();
    const result = applyPanelContextUpdate(ctx, 'panel_2_regio_content_input', {
      system_adjust: stubState('sa-2'),
    });
    expect(result.success).toBe(false);
    expect(result.rejected_paths.length).toBeGreaterThan(0);
    expect(result.context.system_adjust).toBeUndefined();
  });

  it('blocks panel 5 from writing system_adjust but allows boundary', () => {
    const ctx = makeEmptyContext();
    const result = applyPanelContextUpdate(ctx, 'panel_7_boundary_extraction', {
      system_adjust: stubState('bad'),
      boundary: { ...stubState('b-1'), representation_id: 'rep-1' },
    });
    expect(result.context.system_adjust).toBeUndefined();
    expect(result.context.boundary).toBeDefined();
  });

  it('panel 5 may write representation_id', () => {
    const ctx = makeEmptyContext();
    const result = applyPanelContextUpdate(ctx, 'panel_7_boundary_extraction', {
      representation_id: 'rep-42',
    });
    expect(result.context.representation_id).toBe('rep-42');
  });

  it('panel 1 may NOT write representation_id', () => {
    const ctx = makeEmptyContext();
    const result = applyPanelContextUpdate(ctx, 'panel_1_system_adjust_input', {
      representation_id: 'rep-bad',
    });
    expect(result.context.representation_id).toBeUndefined();
    expect(result.issues.some((i) => i.code === 'WRITE_POLICY_VIOLATION_REPRESENTATION_ID')).toBe(true);
  });
});

// ── Guards ────────────────────────────────────────────────────────────────────

describe('Guards', () => {
  it('canRunRegioContentInput blocks if system_adjust missing', () => {
    const ctx = makeEmptyContext();
    const result = canRunRegioContentInput(ctx);
    expect(result.can_run).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it('canRunRegioContentInput passes if system_adjust present', () => {
    const ctx = { ...makeEmptyContext(), system_adjust: stubState('sa-1') };
    const result = canRunRegioContentInput(ctx);
    expect(result.can_run).toBe(true);
  });

  it('canRunGraphBasisLayer blocks if boundary missing', () => {
    const ctx = { ...makeEmptyContext(), system_adjust: stubState('sa-1') };
    const result = canRunGraphBasisLayer(ctx);
    expect(result.can_run).toBe(false);
  });
});

// ── Invalidation ──────────────────────────────────────────────────────────────

describe('Invalidation', () => {
  it('changing system_adjust invalidates route_model', () => {
    const ctx: ReturnType<typeof makeEmptyContext> = {
      ...makeEmptyContext(),
      system_adjust: stubState('sa-1'),
      route_model: stubState('rm-1'),
    };
    const { context, invalidated_paths } = invalidateDownstream(ctx, 'context.system_adjust');
    expect(context.route_model).toBeUndefined();
    expect(invalidated_paths).toContain('context.route_model');
  });

  it('changing sensus_core_package invalidates view_state and release', () => {
    const ctx = {
      ...makeEmptyContext(),
      sensus_core_package: stubState('pkg-1'),
      view_state: stubState('vs-1'),
      release: stubState('rel-1'),
    };
    const { context, invalidated_paths } = invalidateDownstream(ctx, 'context.sensus_core_package');
    expect(context.view_state).toBeUndefined();
    expect(context.release).toBeUndefined();
    expect(invalidated_paths).toContain('context.view_state');
    expect(invalidated_paths).toContain('context.release');
  });

  it('does NOT invalidate system_adjust when boundary changes', () => {
    const ctx = {
      ...makeEmptyContext(),
      system_adjust: stubState('sa-1'),
      boundary: stubState('b-1'),
    };
    const { context } = invalidateDownstream(ctx, 'context.boundary');
    expect(context.system_adjust).toBeDefined();
  });
});

// ── Representation-ID consistency ────────────────────────────────────────────

describe('Representation-ID consistency', () => {
  it('passes when all states share the same representation_id', () => {
    const ctx = {
      ...makeEmptyContext(),
      representation_id: 'rep-1',
      boundary: { ...stubState('b-1'), representation_id: 'rep-1' },
      graph: { ...stubState('g-1'), representation_id: 'rep-1' },
    };
    const { consistent } = checkRepresentationIdConsistency(ctx);
    expect(consistent).toBe(true);
  });

  it('detects mismatch when graph has a different representation_id', () => {
    const ctx = {
      ...makeEmptyContext(),
      representation_id: 'rep-1',
      boundary: { ...stubState('b-1'), representation_id: 'rep-1' },
      graph: { ...stubState('g-1'), representation_id: 'rep-WRONG' },
    };
    const { consistent, mismatches } = checkRepresentationIdConsistency(ctx);
    expect(consistent).toBe(false);
    expect(mismatches.some((m) => m.path === 'context.graph')).toBe(true);
  });
});

// ── Privacy & Visibility ──────────────────────────────────────────────────────

describe('Privacy & Visibility', () => {
  it('public_safe is allowed in Sensus Core', () => {
    expect(isPrivacyLevelAllowedInSensusCore('public_safe')).toBe(true);
    expect(isPrivacyLevelAllowedInSensusCore('reduced_public')).toBe(true);
  });

  it('operator_internal is NOT allowed in Sensus Core', () => {
    expect(isPrivacyLevelAllowedInSensusCore('operator_internal')).toBe(false);
    expect(isPrivacyLevelAllowedInSensusCore('debug_only')).toBe(false);
    expect(isPrivacyLevelAllowedInSensusCore('raw_forbidden')).toBe(false);
    expect(isPrivacyLevelAllowedInSensusCore('privacy_blocked')).toBe(false);
  });

  it('public_aggregate layer class is safe for Sensus Core', () => {
    expect(isSensusCoreSafe('public_aggregate')).toBe(true);
    expect(isSensusCoreSafe('public_route')).toBe(true);
  });

  it('debug layer class is NOT safe for Sensus Core', () => {
    expect(isSensusCoreSafe('debug')).toBe(false);
    expect(isSensusCoreSafe('raw_signal')).toBe(false);
    expect(isSensusCoreSafe('operator_internal')).toBe(false);
  });
});
