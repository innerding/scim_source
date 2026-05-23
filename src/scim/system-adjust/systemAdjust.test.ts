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

// ── 19.7 Transform Geometries — new parameters ────────────────────────────────

describe('SystemAdjust validation — Transform Geometries parameters', () => {
  it('mock state includes all new allowed_ranges fields', () => {
    const r = mockSystemAdjustState.allowed_ranges;
    expect(r.density_threshold_persons_per_sqm).toBeDefined();
    expect(r.measurement_interval_seconds).toBeDefined();
    expect(r.slowdown_threshold_ratio).toBeDefined();
    expect(r.standstill_threshold_ms).toBeDefined();
    expect(r.min_standstill_duration_seconds).toBeDefined();
    expect(r.min_throughput_ratio_for_rast).toBeDefined();
    expect(r.min_compactness_ratio).toBeDefined();
    expect(r.min_observation_window_seconds).toBeDefined();
    expect(r.max_jam_throughput_ratio).toBeDefined();
  });

  it('mock state includes all new default_parameters fields', () => {
    const d = mockSystemAdjustState.default_parameters;
    expect(d.default_density_threshold_persons_per_sqm).toBe(1.0);
    expect(d.default_measurement_interval_seconds).toBe(10);
    expect(d.default_slowdown_threshold_ratio).toBe(0.60);
    expect(d.default_standstill_threshold_ms).toBe(0.3);
    expect(d.default_min_standstill_duration_seconds).toBe(45);
    expect(d.default_min_throughput_ratio_for_rast).toBe(0.60);
    expect(d.default_min_compactness_ratio).toBe(0.4);
    expect(d.default_min_observation_window_seconds).toBe(300);
    expect(d.default_max_jam_throughput_ratio).toBe(0.20);
  });

  it('blocks max_jam_throughput_ratio >= min_throughput_ratio_for_rast', () => {
    const state = cloneWith({
      default_parameters: {
        ...mockSystemAdjustState.default_parameters,
        default_max_jam_throughput_ratio: 0.60,
        default_min_throughput_ratio_for_rast: 0.60,
      },
    });
    const result = validateSystemAdjust(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'SYSADJ_JAM_THRESHOLD_EXCEEDS_RAST')).toBe(true);
  });

  it('warns when step2 is enabled but stay_zone_detection is not', () => {
    const state = cloneWith({
      feature_flags: {
        ...mockSystemAdjustState.feature_flags,
        enable_step2_classification: true,
        enable_stay_zone_detection: false,
      },
    });
    const result = validateSystemAdjust(state);
    expect(result.warnings.some((w) => w.code === 'SYSADJ_STEP2_WITHOUT_DETECTOR')).toBe(true);
  });

  it('mock state feature_flags include enable_stay_zone_detection and enable_step2_classification', () => {
    const f = mockSystemAdjustState.feature_flags;
    expect(f.enable_stay_zone_detection).toBe(false);
    expect(f.enable_step2_classification).toBe(false);
  });
});

// ── 19.8 Context protection ───────────────────────────────────────────────────

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
