import type {
  ClassifiedSignalPoint,
  SignalInterpretationState,
} from './signalInterpretation.types';

// ── Einzelpunkte ──────────────────────────────────────────────────────────────

/** Klarer Bewegungspunkt — hohes Durchsatz-Verhältnis. */
export const mockPointFlow: ClassifiedSignalPoint = {
  point_id: 'sp_flow_001',
  geometry: { type: 'Point', coordinates: [13.405, 52.52] },
  raw_load_score: 0.72,
  density_score: 0.45,
  throughput_ratio: 0.81,
  category: 'flow',
  reason: 'high_throughput_ratio',
};

/** Klarer Aufenthaltspunkt — hohe Dichte, niedriger Durchsatz. */
export const mockPointAccumulation: ClassifiedSignalPoint = {
  point_id: 'sp_acc_001',
  geometry: { type: 'Point', coordinates: [13.41, 52.518] },
  raw_load_score: 0.88,
  density_score: 0.79,
  throughput_ratio: 0.18,
  category: 'accumulation',
  reason: 'low_throughput_high_density',
};

/** Punkt durch Operator-Zone als Aufenthalt erzwungen. */
export const mockPointForcedByZone: ClassifiedSignalPoint = {
  point_id: 'sp_acc_002',
  geometry: { type: 'Point', coordinates: [13.412, 52.519] },
  raw_load_score: 0.55,
  density_score: 0.41,
  throughput_ratio: 0.52,   // wäre sonst ambiguous
  category: 'accumulation',
  reason: 'operator_zone_forced',
  forced_by_zone_id: 'oz_rest_area_001',
};

/** Mehrdeutiger Punkt — Signal zu schwach. */
export const mockPointAmbiguous: ClassifiedSignalPoint = {
  point_id: 'sp_amb_001',
  geometry: { type: 'Point', coordinates: [13.415, 52.521] },
  raw_load_score: 0.22,
  density_score: 0.31,
  throughput_ratio: 0.44,
  category: 'ambiguous',
  reason: 'below_threshold_ambiguous',
};

// ── States ────────────────────────────────────────────────────────────────────

/** Normaler State: gemischte Punkte, keine Fehler. */
export const mockSignalInterpretationState: SignalInterpretationState = {
  interpretation_id: 'si_20260523_001',
  classified_points: [
    mockPointFlow,
    mockPointAccumulation,
    mockPointForcedByZone,
    mockPointAmbiguous,
  ],
  summary: {
    flow_count: 1,
    accumulation_count: 2,
    ambiguous_count: 1,
    forced_by_zone_count: 1,
  },
  thresholds: {
    min_throughput_for_flow: 0.6,
    max_throughput_for_accumulation: 0.3,
    min_density_for_accumulation: 0.5,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
  },
  status: 'signal_interpretation_valid',
  evaluated_at: '2026-05-23T12:00:00.000Z',
};

/** State ohne klassifizierte Punkte — erzeugt Warnung. */
export const mockSignalInterpretationEmpty: SignalInterpretationState = {
  interpretation_id: 'si_20260523_empty',
  classified_points: [],
  summary: {
    flow_count: 0,
    accumulation_count: 0,
    ambiguous_count: 0,
    forced_by_zone_count: 0,
  },
  thresholds: {
    min_throughput_for_flow: 0.6,
    max_throughput_for_accumulation: 0.3,
    min_density_for_accumulation: 0.5,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
  },
  status: 'not_evaluated',
  evaluated_at: '2026-05-23T12:00:00.000Z',
};
