import { describe, it, expect } from 'vitest';
import {
  mockSignalInterpretationState,
  mockSignalInterpretationEmpty,
  mockPointFlow,
  mockPointAccumulation,
  mockPointForcedByZone,
  mockPointAmbiguous,
} from './signalInterpretation.mock';
import { validateSignalInterpretation } from './signalInterpretation.validation';
import { applySignalInterpretationToContext } from './signalInterpretation.context';
import { makeEmptyContext } from '../context/scimContext.types';

// ── 41.1 Gültiger Mock ────────────────────────────────────────────────────────

describe('SignalInterpretation – 41.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateSignalInterpretation(mockSignalInterpretationState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('mock has 4 classified points', () => {
    expect(mockSignalInterpretationState.classified_points).toHaveLength(4);
  });

  it('mock summary matches actual point counts', () => {
    const s = mockSignalInterpretationState;
    expect(s.summary.flow_count).toBe(1);
    expect(s.summary.accumulation_count).toBe(2);
    expect(s.summary.ambiguous_count).toBe(1);
    expect(s.summary.forced_by_zone_count).toBe(1);
  });
});

// ── 41.2 Kategorien ───────────────────────────────────────────────────────────

describe('SignalInterpretation – 41.2 signal categories', () => {
  it('flow point has high throughput_ratio', () => {
    expect(mockPointFlow.throughput_ratio).toBeGreaterThanOrEqual(0.6);
    expect(mockPointFlow.category).toBe('flow');
    expect(mockPointFlow.reason).toBe('high_throughput_ratio');
  });

  it('accumulation point has low throughput and high density', () => {
    expect(mockPointAccumulation.throughput_ratio).toBeLessThanOrEqual(0.3);
    expect(mockPointAccumulation.density_score).toBeGreaterThanOrEqual(0.5);
    expect(mockPointAccumulation.category).toBe('accumulation');
  });

  it('zone-forced point carries zone_id', () => {
    expect(mockPointForcedByZone.reason).toBe('operator_zone_forced');
    expect(mockPointForcedByZone.forced_by_zone_id).toBeDefined();
    expect(mockPointForcedByZone.category).toBe('accumulation');
  });

  it('ambiguous point has reason below_threshold_ambiguous', () => {
    expect(mockPointAmbiguous.category).toBe('ambiguous');
    expect(mockPointAmbiguous.reason).toBe('below_threshold_ambiguous');
    expect(mockPointAmbiguous.forced_by_zone_id).toBeUndefined();
  });
});

// ── 41.3 Validierungsfehler ───────────────────────────────────────────────────

describe('SignalInterpretation – 41.3 validation errors', () => {
  it('blocks when thresholds overlap (accumulation >= flow)', () => {
    const state = {
      ...mockSignalInterpretationState,
      thresholds: {
        min_throughput_for_flow: 0.4,
        max_throughput_for_accumulation: 0.5,  // >= flow → overlap
        min_density_for_accumulation: 0.5,
      },
    };
    const result = validateSignalInterpretation(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'SI_THRESHOLD_OVERLAP')).toBe(true);
  });

  it('blocks when summary.flow_count does not match', () => {
    const state = {
      ...mockSignalInterpretationState,
      summary: { ...mockSignalInterpretationState.summary, flow_count: 99 },
    };
    const result = validateSignalInterpretation(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'SI_SUMMARY_FLOW_MISMATCH')).toBe(true);
  });

  it('blocks when summary.accumulation_count does not match', () => {
    const state = {
      ...mockSignalInterpretationState,
      summary: { ...mockSignalInterpretationState.summary, accumulation_count: 0 },
    };
    const result = validateSignalInterpretation(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'SI_SUMMARY_ACC_MISMATCH')).toBe(true);
  });
});

// ── 41.4 Warnungen ───────────────────────────────────────────────────────────

describe('SignalInterpretation – 41.4 warnings', () => {
  it('warns when no points present', () => {
    const result = validateSignalInterpretation(mockSignalInterpretationEmpty);
    expect(result.warnings.some(w => w.code === 'SI_NO_POINTS')).toBe(true);
  });

  it('warns when more than 70% accumulation', () => {
    const accPoints = Array.from({ length: 8 }, (_, i) => ({
      ...mockPointAccumulation,
      point_id: `sp_acc_${i}`,
    }));
    const flowPoints = [mockPointFlow, mockPointAmbiguous];
    const state = {
      ...mockSignalInterpretationState,
      classified_points: [...accPoints, ...flowPoints],
      summary: {
        flow_count: 1,
        accumulation_count: 8,
        ambiguous_count: 1,
        forced_by_zone_count: 0,
      },
    };
    const result = validateSignalInterpretation(state);
    expect(result.warnings.some(w => w.code === 'SI_HIGH_ACCUMULATION_RATIO')).toBe(true);
  });

  it('warns when more than 50% ambiguous', () => {
    const ambPoints = Array.from({ length: 6 }, (_, i) => ({
      ...mockPointAmbiguous,
      point_id: `sp_amb_${i}`,
    }));
    const state = {
      ...mockSignalInterpretationState,
      classified_points: [...ambPoints, mockPointFlow, mockPointFlow, mockPointFlow, mockPointAccumulation],
      summary: {
        flow_count: 3,
        accumulation_count: 1,
        ambiguous_count: 6,
        forced_by_zone_count: 0,
      },
    };
    const result = validateSignalInterpretation(state);
    expect(result.warnings.some(w => w.code === 'SI_HIGH_AMBIGUOUS_RATIO')).toBe(true);
  });
});

// ── 41.5 Context ─────────────────────────────────────────────────────────────

describe('SignalInterpretation – 41.5 context apply', () => {
  it('writes signal_interpretation to context', () => {
    const ctx = makeEmptyContext();
    const updated = applySignalInterpretationToContext(ctx, mockSignalInterpretationState);
    expect(updated.signal_interpretation).toBe(mockSignalInterpretationState);
  });

  it('does not mutate other context keys', () => {
    const ctx = { ...makeEmptyContext(), system_adjust: { status: 'system_adjust_valid' } };
    const updated = applySignalInterpretationToContext(ctx, mockSignalInterpretationState);
    expect(updated.system_adjust).toBe(ctx.system_adjust);
  });

  it('throws when status is signal_interpretation_invalid', () => {
    const invalid = {
      ...mockSignalInterpretationState,
      status: 'signal_interpretation_invalid' as const,
    };
    expect(() => applySignalInterpretationToContext(makeEmptyContext(), invalid)).toThrow();
  });
});
