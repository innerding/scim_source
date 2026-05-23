import type { ScimClassificationMode } from '../context/scimContext.types';

export type Step2ActivationStatus =
  | 'not_triggered'
  | 'triggered_awaiting_operator'
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
  validation: Step2ActivationValidationResult;
  status: Step2ActivationStatus;
  created_at: string;
  updated_at?: string;
}
