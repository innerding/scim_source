import { describe, it, expect } from 'vitest';
import { mockScimRuntimeContextState } from './scimRuntimeContext.mock';
import { validateScimRuntimeContext } from './scimRuntimeContext.validation';
import { applyScimRuntimeContextToContext } from './scimRuntimeContext.context';
import { makeEmptyContext } from '../context/scimContext.types';

describe('ScimRuntimeContext – 36.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateScimRuntimeContext(mockScimRuntimeContextState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('ScimRuntimeContext – 36.2 missing system_adjust_version', () => {
  it('produces RTX_SYSTEM_ADJUST_VERSION_MISSING', () => {
    const state = {
      ...mockScimRuntimeContextState,
      versions: { ...mockScimRuntimeContextState.versions, system_adjust_version: '' },
    };
    const result = validateScimRuntimeContext(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'RTX_SYSTEM_ADJUST_VERSION_MISSING')).toBe(true);
  });
});

describe('ScimRuntimeContext – 36.3 completeness out of range', () => {
  it('produces RTX_COMPLETENESS_INVALID', () => {
    const state = { ...mockScimRuntimeContextState, pipeline_completeness: 1.5 };
    const result = validateScimRuntimeContext(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'RTX_COMPLETENESS_INVALID')).toBe(true);
  });
});

describe('ScimRuntimeContext – 36.4 missing panels triggers warning', () => {
  it('produces RTX_PANELS_MISSING as warning', () => {
    const state = {
      ...mockScimRuntimeContextState,
      missing_panels: ['sensus_core_package', 'release'],
      pipeline_completeness: 0.85,
    };
    const result = validateScimRuntimeContext(state);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'RTX_PANELS_MISSING')).toBe(true);
  });
});

describe('ScimRuntimeContext – 36.5 context protection', () => {
  it('writes only scim_context', () => {
    const context = makeEmptyContext();
    const updated = applyScimRuntimeContextToContext(context, mockScimRuntimeContextState);
    expect(updated.boundary).toBe(context.boundary);
    expect(updated.scim_context).toBe(mockScimRuntimeContextState);
  });
});

describe('ScimRuntimeContext – 36.6 invalid status blocks apply', () => {
  it('throws when status is runtime_context_invalid', () => {
    const state = { ...mockScimRuntimeContextState, status: 'runtime_context_invalid' as const };
    expect(() => applyScimRuntimeContextToContext(makeEmptyContext(), state)).toThrow();
  });
});
