import type { GeoJsonPolygon } from '../context/scimContext.types';

export type OperatorDecisionStatus =
  | 'not_started'
  | 'awaiting_input'
  | 'in_progress'
  | 'completed'
  | 'operator_decision_invalid';

// ── Tab 1: Voraussetzungen ─────────────────────────────────────────────────────

export interface PrerequisiteCheck {
  jam_detected: boolean;
  step2_activation_condition_met: boolean;
  detector_id: string;
}

// ── Tab 2: Überlappungsmeldung ────────────────────────────────────────────────

export type OverlapResolutionMethod =
  | 'freflaeche_defined'
  | 'zone_merged'
  | 'zone_dismissed';

export interface OverlapResolution {
  resolution_id: string;
  zone_ids: string[];
  method: OverlapResolutionMethod;
  freflaeche_geometry?: GeoJsonPolygon;
  resolved_at?: string;
  resolved_by?: string;
}

// ── Tab 3: Off-path-Zone ──────────────────────────────────────────────────────

export type OffPathDecisionResult =
  | 'confirmed_excluded'
  | 'overridden_included'
  | 'pending';

export interface OffPathDecision {
  decision_id: string;
  zone_id: string;
  result: OffPathDecisionResult;
  override_reason?: string;
  decided_at?: string;
  decided_by?: string;
}

// ── Tab 4: Stau-Schnittmodell ─────────────────────────────────────────────────

export type StauCommitResult =
  | 'committed_full'
  | 'committed_partial'
  | 'rejected'
  | 'pending';

export interface StauCommit {
  commit_id: string;
  zone_id: string;
  result: StauCommitResult;
  rejection_reason?: string;
  committed_at?: string;
  committed_by?: string;
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface OperatorDecisionIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface OperatorDecisionValidationResult {
  is_valid: boolean;
  errors: OperatorDecisionIssue[];
  warnings: OperatorDecisionIssue[];
  checked_at: string;
  checked_against_detector_id: string;
}

// ── State ─────────────────────────────────────────────────────────────────────

export interface OperatorDecisionState {
  decision_id: string;
  detector_id: string;
  prerequisites: PrerequisiteCheck;
  overlap_resolutions: OverlapResolution[];
  off_path_decisions: OffPathDecision[];
  stau_commits: StauCommit[];
  validation: OperatorDecisionValidationResult;
  status: OperatorDecisionStatus;
  created_at: string;
  updated_at?: string;
}
