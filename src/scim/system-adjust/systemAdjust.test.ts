import { describe, it, expect } from 'vitest';
import { mockSystemAdjustState } from './systemAdjust.mock';
import { validateSystemAdjust } from './systemAdjust.validation';
import { applySystemAdjustToContext } from './systemAdjust.context';
import { makeEmptyContext } from '../context/scimContext.types';
import type { SystemAdjustState } from './systemAdjust.types';

function cloneWith(overrides: Partial<SystemAdjustState>): SystemAdjustState {
  return { ...mockSystemAdjustState, ...overrides };
}

// ── 19.1 Valid mock ───────────────────────────────────────────────────────────

describe('SystemAdjust validation — valid mock', () => {
  it('mock state passes validation', () => {
    const result = validateSystemAdjust(mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(mockSystemAdjustState.status).toBe('system_adjust_valid');
  });
});

// ── 19.2 Single-device visibility ─────────────────────────────────────────────

describe('SystemAdjust validation — single device visibility', () => {
  it('blocks allow_single_device_visibility: true', () => {
    const state = cloneWith({
      privacy_limits: {
        ...mockSystemAdjustState.privacy_limits,
        allow_single_device_visibility: true as unknown as false,
      },
    });
    const result = validateSystemAdjust(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'SYSADJ_SINGLE_DEVICE_VISIBILITY_FORBIDDEN')).toBe(true);
  });
});

// ── 19.3 Raw signals in Sensus Core ───────────────────────────────────────────

describe('SystemAdjust validation — raw signals in Sensus Core', () => {
  it('blocks allow_raw_signals_in_sensus_core: true', () => {
    const state = cloneWith({
      privacy_limits: {
        ...mockSystemAdjustState.privacy_limits,
        allow_raw_signals_in_sensus_core: true as unknown as false,
      },
    });
    const result = validateSystemAdjust(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'SYSADJ_RAW_SIGNALS_IN_SENSUS_CORE_FORBIDDEN')).toBe(true);
  });
});

// ── 19.4 Debug data in Sensus Core ────────────────────────────────────────────

describe('SystemAdjust validation — debug data in Sensus Core', () => {
  it('blocks allow_debug_data_in_sensus_core: true', () => {
    const state = cloneWith({
      privacy_limits: {
        ...mockSystemAdjustState.privacy_limits,
        allow_debug_data_in_sensus_core: true as unknown as false,
      },
    });
    const result = validateSystemAdjust(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'SYSADJ_DEBUG_IN_SENSUS_CORE_FORBIDDEN')).toBe(true);
  });
});

// ── 19.5 Default out of range ─────────────────────────────────────────────────

describe('SystemAdjust validation — default out of range', () => {
  it('blocks default_poi_radius_meters outside allowed range', () => {
    const state = cloneWith({
      default_parameters: {
        ...mockSystemAdjustState.default_parameters,
        default_poi_radius_meters: 9999,
      },
    });
    const result = validateSystemAdjust(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'SYSADJ_DEFAULT_OUT_OF_RANGE')).toBe(true);
  });
});

// ── 19.6 Route logic inconsistent ────────────────────────────────────────────

describe('SystemAdjust validation — route logic inconsistent', () => {
  it('blocks degrade > exclude threshold', () => {
    const state = cloneWith({
      default_parameters: {
        ...mockSystemAdjustState.default_parameters,
        default_route_degrade_threshold: 0.95,
        default_route_exclude_threshold: 0.8,
      },
    });
    const result = validateSystemAdjust(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'SYSADJ_DEGRADE_EXCEEDS_EXCLUDE')).toBe(true);
  });
});

// ── 19.7 Context protection ───────────────────────────────────────────────────

describe('SystemAdjust context apply', () => {
  it('writes only system_adjust and leaves other context keys intact', () => {
    const regio = { status: 'regio_content_valid' };
    const graph = { status: 'graph_valid' };
    const ctx = makeEmptyContext();
    const ctxBefore = { ...ctx, regio_content: regio, graph };
    const ctxAfter = applySystemAdjustToContext(ctxBefore, mockSystemAdjustState);
    expect(ctxAfter.system_adjust).toBe(mockSystemAdjustState);
    expect(ctxAfter.regio_content).toBe(regio);
    expect(ctxAfter.graph).toBe(graph);
  });

  it('throws if system_adjust is not valid', () => {
    const invalid = cloneWith({ status: 'system_adjust_invalid' });
    expect(() => applySystemAdjustToContext(makeEmptyContext(), invalid)).toThrow();
  });
});
