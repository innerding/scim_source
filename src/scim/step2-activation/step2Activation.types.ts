import type { ScimClassificationMode } from '../context/scimContext.types';

export type Step2ActivationStatus =
  | 'not_triggered'
  | 'observation_running'          // Bedingung erfüllt, Beobachtungsfenster läuft noch
  | 'triggered_awaiting_operator'  // Fenster abgeschlossen, wartet auf Operator-Bestätigung
  | 'operator_confirmed'
  | 'operator_deferred'
  | 'operator_rejected'
  | 'step2_activation_invalid';

export type Step2ActivationDecisionResult =
  | 'confirmed'
  | 'deferred'
  | 'rejected';

export interface Step2ActivationTrigger {
  trigger_id: string;
  detector_id: string;
  jam_count: number;
  triggering_zone_ids: string[];
  triggered_at: string;
}

export interface Step2ActivationDecision {
  result: Step2ActivationDecisionResult;
  decided_by?: string;
  decided_at?: string;
  defer_until?: string;
  rejection_reason?: string;
}

export interface Step2ActivationIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface Step2ActivationValidationResult {
  is_valid: boolean;
  errors: Step2ActivationIssue[];
  warnings: Step2ActivationIssue[];
  checked_at: string;
}

export interface Step2ActivationState {
  activation_id: string;
  trigger: Step2ActivationTrigger;
  decision?: Step2ActivationDecision;
  resulting_classification_mode: ScimClassificationMode;
  /**
   * Anzahl aufeinanderfolgender Runs, in denen die Stau-Bedingung erfüllt war.
   * Wird über Runs hinweg akkumuliert (via previous_step2_state in PipelineInputs).
   * Zurückgesetzt auf 0 wenn die Bedingung nicht mehr erfüllt ist.
   */
  observation_run_count: number;
  /**
   * Zeitstempel der ersten Erkennung in der aktuellen Beobachtungssequenz.
   * Null wenn Bedingung nicht erfüllt.
   */
  first_detected_at: string | null;
  /** Abgeleitet: Minuten seit first_detected_at. 0 wenn nicht beobachtet. */
  sustained_duration_minutes: number;
  validation: Step2ActivationValidationResult;
  status: Step2ActivationStatus;
  created_at: string;
  updated_at?: string;
}
