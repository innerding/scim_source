import { describe, it, expect } from 'vitest';
import { mockSensusCoreLocalState } from './sensusCoreLocal.mock';
import { validateSensusCoreLocal } from './sensusCoreLocal.validation';
import { applySensusCoreLocalToContext } from './sensusCoreLocal.context';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('SensusCoreLocal – 39.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateSensusCoreLocal(mockSensusCoreLocalState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('SensusCoreLocal – 39.2 system adjust missing', () => {
  it('produces LOCAL_SYSTEM_ADJUST_MISSING', () => {
    const result = validateSensusCoreLocal(mockSensusCoreLocalState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LOCAL_SYSTEM_ADJUST_MISSING')).toBe(true);
  });
});

describe('SensusCoreLocal – 39.3 route_load_tolerance out of range', () => {
  it('produces LOCAL_TOLERANCE_OUT_OF_RANGE', () => {
    const state = {
      ...mockSensusCoreLocalState,
      tolerances: { ...mockSensusCoreLocalState.tolerances, route_load_tolerance: 1.5 },
    };
    const result = validateSensusCoreLocal(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LOCAL_TOLERANCE_OUT_OF_RANGE')).toBe(true);
  });
});

describe('SensusCoreLocal – 39.4 max_acceptable_load_score above exclude threshold triggers warning', () => {
  it('produces LOCAL_TOLERANCE_ABOVE_EXCLUDE as warning', () => {
    const state = {
      ...mockSensusCoreLocalState,
      tolerances: { ...mockSensusCoreLocalState.tolerances, max_acceptable_load_score: 0.95 },
    };
    const result = validateSensusCoreLocal(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'LOCAL_TOLERANCE_ABOVE_EXCLUDE')).toBe(true);
  });
});

describe('SensusCoreLocal – 39.5 context protection', () => {
  it('writes only local_user_context', () => {
    const context = makeEmptyContext();
    const updated = applySensusCoreLocalToContext(context, mockSensusCoreLocalState);
    expect(updated.sensus_core_package).toBe(context.sensus_core_package);
    expect(updated.local_user_context).toBe(mockSensusCoreLocalState);
  });
});

describe('SensusCoreLocal – 39.6 invalid status blocks apply', () => {
  it('throws when status is local_context_invalid', () => {
    const state = { ...mockSensusCoreLocalState, status: 'local_context_invalid' as const };
    expect(() => applySensusCoreLocalToContext(makeEmptyContext(), state)).toThrow();
  });
});
