import type { GeoPoint } from '../context/scimContext.types';

// ── Kategorien ────────────────────────────────────────────────────────────────

/** Primäre Klassifikation eines Telco-Signalpunkts. */
export type SignalCategory = 'flow' | 'accumulation' | 'ambiguous';

/** Grund für die Klassifikation — nachvollziehbar im Ergebnis-Tab. */
export type SignalClassificationReason =
  | 'high_throughput_ratio'         // flow:  schnelle Durchbewegung erkennbar
  | 'low_throughput_high_density'   // accumulation: viele Geräte, kaum Bewegung
  | 'operator_zone_forced'          // accumulation: Operator-Zone erzwingt Aufenthalt
  | 'below_threshold_ambiguous'     // ambiguous: Signal zu schwach für sichere Entscheidung
  | 'conflicting_signals'           // ambiguous: Durchsatz und Dichte widersprechen sich
  | 'permanent_zone_forced';        // flow/accumulation: permanent-Zone überlagert

// ── Einzelpunkt ───────────────────────────────────────────────────────────────

export interface ClassifiedSignalPoint {
  point_id: string;
  geometry: GeoPoint;
  raw_load_score: number;           // normierter Rohwert aus TelcoLoad (0–1)
  density_score: number;            // Gerätedichte (0–1)
  throughput_ratio: number;         // Anteil Durchbewegung (0–1)
  category: SignalCategory;
  reason: SignalClassificationReason;
  forced_by_zone_id?: string;       // gesetzt wenn operator_zone_forced / permanent_zone_forced
}

// ── Zusammenfassung ───────────────────────────────────────────────────────────

export interface SignalCategorySummary {
  flow_count: number;
  accumulation_count: number;
  ambiguous_count: number;
  forced_by_zone_count: number;     // davon durch Operator-Zone erzwungen
}

// ── Validierung ───────────────────────────────────────────────────────────────

export type SignalInterpretationStatus =
  | 'not_evaluated'
  | 'signal_interpretation_valid'
  | 'signal_interpretation_warning'
  | 'signal_interpretation_invalid';

export interface SignalInterpretationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
}

export interface SignalInterpretationValidationResult {
  is_valid: boolean;
  errors: SignalInterpretationIssue[];
  warnings: SignalInterpretationIssue[];
}

// ── State ─────────────────────────────────────────────────────────────────────

export interface SignalInterpretationState {
  interpretation_id: string;
  classified_points: ClassifiedSignalPoint[];
  summary: SignalCategorySummary;
  /** Schwellenwerte, die für diese Klassifikation verwendet wurden. */
  thresholds: {
    min_throughput_for_flow: number;      // Standard: 0.6
    max_throughput_for_accumulation: number; // Standard: 0.3
    min_density_for_accumulation: number; // Standard: 0.5
  };
  validation: SignalInterpretationValidationResult;
  status: SignalInterpretationStatus;
  evaluated_at: string;
}
