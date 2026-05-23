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
import { computeSignalInterpretation } from './signalInterpretation.compute';
import { mockMovementModelState } from '../movement-model/movementModel.mock';
import { mockOperatorZoneState } from '../operator-zone/operatorZone.mock';
import type { MovementModelState } from '../movement-model/movementModel.types';
import { makeEmptyContext } from '../context/scimContext.types';

// Helper — minimal MovementModelState mit maßgeschneiderten Edges
function makeMovementModel(edges: {
  edge_id: string;
  throughput_ratio: number;
  density_score: number;
  stay_candidate?: boolean;
  normalized_movement_score?: number;
}[]): MovementModelState {
  return {
    ...mockMovementModelState,
    edge_movement_states: edges.map((e) => ({
      edge_id: e.edge_id,
      movement_class: 'moderate_flow',
      movement_ratio: 0.5,
      stillness_ratio: 0.5,
      flow_direction: 'bidirectional',
      normalized_movement_score: e.normalized_movement_score ?? 0.5,
      confidence_score: 0.8,
      privacy_masked: false,
      density_score: e.density_score,
      throughput_ratio: e.throughput_ratio,
      jam_detected: false,
      stay_candidate: e.stay_candidate ?? false,
    })),
  };
}

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

// ── 41.6 computeSignalInterpretation ─────────────────────────────────────────

describe('SignalInterpretation – 41.6 compute: undefined input', () => {
  it('returns empty classified_points when movementModel is undefined', () => {
    const state = computeSignalInterpretation(undefined, undefined);
    expect(state.classified_points).toHaveLength(0);
  });

  it('summary is all zeros when no edges are present', () => {
    const state = computeSignalInterpretation(undefined, undefined);
    expect(state.summary.flow_count).toBe(0);
    expect(state.summary.accumulation_count).toBe(0);
    expect(state.summary.ambiguous_count).toBe(0);
    expect(state.summary.forced_by_zone_count).toBe(0);
  });

  it('status is signal_interpretation_valid even with no data', () => {
    const state = computeSignalInterpretation(undefined, undefined);
    expect(state.status).toBe('signal_interpretation_valid');
  });
});

describe('SignalInterpretation – 41.6 compute: Regel 2 — high_throughput_ratio', () => {
  it('klassifiziert Edge mit throughput_ratio >= 0.60 als flow', () => {
    const mm = makeMovementModel([
      { edge_id: 'e_flow', throughput_ratio: 0.75, density_score: 0.3 },
    ]);
    const state = computeSignalInterpretation(mm, undefined);
    const point = state.classified_points[0];
    expect(point.category).toBe('flow');
    expect(point.reason).toBe('high_throughput_ratio');
  });

  it('klassifiziert Grenzwert 0.60 exakt als flow', () => {
    const mm = makeMovementModel([
      { edge_id: 'e_exact', throughput_ratio: 0.60, density_score: 0.2 },
    ]);
    const state = computeSignalInterpretation(mm, undefined);
    expect(state.classified_points[0].category).toBe('flow');
  });

  it('summary.flow_count spiegelt Anzahl flow-Punkte wider', () => {
    const mm = makeMovementModel([
      { edge_id: 'e1', throughput_ratio: 0.8, density_score: 0.3 },
      { edge_id: 'e2', throughput_ratio: 0.9, density_score: 0.4 },
    ]);
    const state = computeSignalInterpretation(mm, undefined);
    expect(state.summary.flow_count).toBe(2);
    expect(state.summary.accumulation_count).toBe(0);
  });
});

describe('SignalInterpretation – 41.6 compute: Regel 3 — low_throughput_high_density', () => {
  it('klassifiziert als accumulation bei niedrigem Durchsatz und hoher Dichte', () => {
    const mm = makeMovementModel([
      { edge_id: 'e_acc', throughput_ratio: 0.20, density_score: 0.70 },
    ]);
    const state = computeSignalInterpretation(mm, undefined);
    const point = state.classified_points[0];
    expect(point.category).toBe('accumulation');
    expect(point.reason).toBe('low_throughput_high_density');
  });

  it('klassifiziert Grenzwerte exakt: throughput=0.30, density=0.50', () => {
    const mm = makeMovementModel([
      { edge_id: 'e_boundary', throughput_ratio: 0.30, density_score: 0.50 },
    ]);
    const state = computeSignalInterpretation(mm, undefined);
    expect(state.classified_points[0].category).toBe('accumulation');
    expect(state.classified_points[0].reason).toBe('low_throughput_high_density');
  });
});

describe('SignalInterpretation – 41.6 compute: Regel 4 — below_threshold_ambiguous', () => {
  it('klassifiziert als ambiguous wenn throughput niedrig aber density zu gering', () => {
    const mm = makeMovementModel([
      { edge_id: 'e_amb', throughput_ratio: 0.20, density_score: 0.30 },
    ]);
    const state = computeSignalInterpretation(mm, undefined);
    const point = state.classified_points[0];
    expect(point.category).toBe('ambiguous');
    expect(point.reason).toBe('below_threshold_ambiguous');
  });
});

describe('SignalInterpretation – 41.6 compute: Regel 5 — conflicting_signals', () => {
  it('klassifiziert als ambiguous wenn throughput im Gap zwischen den Schwellen liegt', () => {
    // throughput zwischen 0.30 und 0.60 (nicht klassifizierbar als flow oder accumulation)
    const mm = makeMovementModel([
      { edge_id: 'e_conflict', throughput_ratio: 0.45, density_score: 0.20 },
    ]);
    const state = computeSignalInterpretation(mm, undefined);
    const point = state.classified_points[0];
    expect(point.category).toBe('ambiguous');
    expect(point.reason).toBe('conflicting_signals');
  });
});

describe('SignalInterpretation – 41.6 compute: Regel 1 — operator_zone_forced', () => {
  it('überschreibt Klassifikation für stay_candidate in aktiver Forcing-Zone', () => {
    // e_003 im mockMovementModel: throughput=0.62 (würde flow sein), stay_candidate=true
    // mockOperatorZoneState hat Zonen mit exclude_from_routing=true + temporal_scope definiert
    const state = computeSignalInterpretation(mockMovementModelState, mockOperatorZoneState);
    const forcedPoint = state.classified_points.find((p) => p.forced_by_zone_id !== undefined);
    expect(forcedPoint).toBeDefined();
    expect(forcedPoint?.category).toBe('accumulation');
    expect(forcedPoint?.reason).toBe('operator_zone_forced');
  });

  it('forced_by_zone_id ist die ID der ersten Forcing-Zone', () => {
    const state = computeSignalInterpretation(mockMovementModelState, mockOperatorZoneState);
    const forcedPoint = state.classified_points.find((p) => p.forced_by_zone_id !== undefined);
    expect(forcedPoint?.forced_by_zone_id).toBe('oz_001'); // mockZoneRestArea
  });

  it('summary.forced_by_zone_count entspricht Anzahl erzwungener Punkte', () => {
    const state = computeSignalInterpretation(mockMovementModelState, mockOperatorZoneState);
    const manualCount = state.classified_points.filter((p) => p.forced_by_zone_id !== undefined).length;
    expect(state.summary.forced_by_zone_count).toBe(manualCount);
  });

  it('Edges ohne stay_candidate werden nicht erzwungen', () => {
    const mm = makeMovementModel([
      { edge_id: 'e_no_stay', throughput_ratio: 0.20, density_score: 0.80, stay_candidate: false },
    ]);
    const state = computeSignalInterpretation(mm, mockOperatorZoneState);
    // Ohne stay_candidate greift operator_zone_forced nicht — wird als accumulation über Regel 3 klassifiziert
    expect(state.classified_points[0].reason).not.toBe('operator_zone_forced');
    expect(state.classified_points[0].forced_by_zone_id).toBeUndefined();
  });

  it('kein Forcing wenn keine Forcing-Zonen definiert sind', () => {
    const mm = makeMovementModel([
      { edge_id: 'e_stay', throughput_ratio: 0.20, density_score: 0.80, stay_candidate: true },
    ]);
    const state = computeSignalInterpretation(mm, undefined); // kein operatorZones
    expect(state.classified_points[0].reason).not.toBe('operator_zone_forced');
  });
});

describe('SignalInterpretation – 41.6 compute: Ergebnis-Konsistenz', () => {
  it('summary-Zähler stimmen mit classified_points überein', () => {
    const mm = makeMovementModel([
      { edge_id: 'e1', throughput_ratio: 0.80, density_score: 0.30 }, // flow
      { edge_id: 'e2', throughput_ratio: 0.20, density_score: 0.70 }, // accumulation
      { edge_id: 'e3', throughput_ratio: 0.20, density_score: 0.20 }, // ambiguous
      { edge_id: 'e4', throughput_ratio: 0.45, density_score: 0.20 }, // conflicting → ambiguous
    ]);
    const state = computeSignalInterpretation(mm, undefined);
    expect(state.summary.flow_count).toBe(1);
    expect(state.summary.accumulation_count).toBe(1);
    expect(state.summary.ambiguous_count).toBe(2);
  });

  it('point_id enthält die edge_id', () => {
    const mm = makeMovementModel([
      { edge_id: 'e_test_123', throughput_ratio: 0.8, density_score: 0.3 },
    ]);
    const state = computeSignalInterpretation(mm, undefined);
    expect(state.classified_points[0].point_id).toContain('e_test_123');
  });

  it('raw_load_score entspricht normalized_movement_score der Edge', () => {
    const mm = makeMovementModel([
      { edge_id: 'e_score', throughput_ratio: 0.8, density_score: 0.3, normalized_movement_score: 0.77 },
    ]);
    const state = computeSignalInterpretation(mm, undefined);
    expect(state.classified_points[0].raw_load_score).toBe(0.77);
  });

  it('verwendete Schwellenwerte sind im State gespeichert', () => {
    const customThresholds = { min_throughput_for_flow: 0.70, max_throughput_for_accumulation: 0.20, min_density_for_accumulation: 0.40 };
    const state = computeSignalInterpretation(undefined, undefined, customThresholds);
    expect(state.thresholds).toEqual(customThresholds);
  });

  it('interpretation_id hat das erwartete Format (si_<timestamp>)', () => {
    const state = computeSignalInterpretation(undefined, undefined);
    expect(state.interpretation_id).toMatch(/^si_\d+$/);
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
