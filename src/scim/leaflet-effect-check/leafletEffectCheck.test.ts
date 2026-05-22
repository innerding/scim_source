import { describe, it, expect } from 'vitest';
import { mockLeafletEffectCheckState } from './leafletEffectCheck.mock';
import { validateLeafletEffectCheck } from './leafletEffectCheck.validation';
import { applyLeafletEffectCheckToContext } from './leafletEffectCheck.context';
import { mockSensusCorePackageState } from '../sensus-core-package/sensusCorePackage.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('LeafletEffectCheck – 41.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateLeafletEffectCheck(mockLeafletEffectCheckState, mockSensusCorePackageState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('LeafletEffectCheck – 41.2 package missing', () => {
  it('produces LEC_PACKAGE_MISSING', () => {
    const result = validateLeafletEffectCheck(mockLeafletEffectCheckState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LEC_PACKAGE_MISSING')).toBe(true);
  });
});

describe('LeafletEffectCheck – 41.3 layer render error', () => {
  it('produces LEC_LAYER_RENDER_ERROR', () => {
    const state = {
      ...mockLeafletEffectCheckState,
      render_result: { ...mockLeafletEffectCheckState.render_result, any_layer_error: true },
    };
    const result = validateLeafletEffectCheck(state, mockSensusCorePackageState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LEC_LAYER_RENDER_ERROR')).toBe(true);
  });
});

describe('LeafletEffectCheck – 41.4 route layer not rendered triggers warning', () => {
  it('produces LEC_ROUTE_LAYER_NOT_RENDERED as warning', () => {
    const state = {
      ...mockLeafletEffectCheckState,
      render_result: { ...mockLeafletEffectCheckState.render_result, route_layer_rendered: false },
    };
    const result = validateLeafletEffectCheck(state, mockSensusCorePackageState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'LEC_ROUTE_LAYER_NOT_RENDERED')).toBe(true);
  });
});

describe('LeafletEffectCheck – 41.5 no visible segments triggers warning', () => {
  it('produces LEC_NO_VISIBLE_SEGMENTS as warning', () => {
    const state = {
      ...mockLeafletEffectCheckState,
      render_result: { ...mockLeafletEffectCheckState.render_result, visible_segment_count: 0 },
    };
    const result = validateLeafletEffectCheck(state, mockSensusCorePackageState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'LEC_NO_VISIBLE_SEGMENTS')).toBe(true);
  });
});

describe('LeafletEffectCheck – 41.6 context protection', () => {
  it('writes only leaflet_effect_check', () => {
    const context = makeEmptyContext();
    const updated = applyLeafletEffectCheckToContext(context, mockLeafletEffectCheckState);
    expect(updated.sensus_core_package).toBe(context.sensus_core_package);
    expect(updated.leaflet_effect_check).toBe(mockLeafletEffectCheckState);
  });
});

describe('LeafletEffectCheck – 41.7 invalid status blocks apply', () => {
  it('throws when status is effect_check_failed', () => {
    const state = { ...mockLeafletEffectCheckState, status: 'effect_check_failed' as const };
    expect(() => applyLeafletEffectCheckToContext(makeEmptyContext(), state)).toThrow();
  });
});
