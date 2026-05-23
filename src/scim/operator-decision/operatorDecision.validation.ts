import type {
  OperatorDecisionState,
  OperatorDecisionIssue,
  OperatorDecisionValidationResult,
} from './operatorDecision.types';
import type { StayZoneDetectorState } from '../stay-zone-detector/stayZoneDetector.types';

function err(code: string, message: string, field?: string, related_id?: string): OperatorDecisionIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): OperatorDecisionIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

export function validateOperatorDecision(
  state: OperatorDecisionState,
  detector: StayZoneDetectorState | undefined,
): OperatorDecisionValidationResult {
  const errors: OperatorDecisionIssue[] = [];
  const warnings: OperatorDecisionIssue[] = [];

  // ── Detektor-Verknüpfung ───────────────────────────────────────────────────
  if (!detector) {
    errors.push(err('OPDEC_DETECTOR_MISSING', 'StayZoneDetector is missing.', 'detector_id'));
  } else if (detector.detector_id !== state.detector_id) {
    errors.push(err(
      'OPDEC_DETECTOR_ID_MISMATCH',
      `detector_id '${state.detector_id}' does not match actual detector '${detector.detector_id}'.`,
      'detector_id',
    ));
  }

  // ── Tab 1: Voraussetzungen ─────────────────────────────────────────────────
  if (state.prerequisites.step2_activation_condition_met && state.stau_commits.length === 0) {
    warnings.push(warn(
      'OPDEC_STAU_COMMIT_MISSING',
      'step2_activation_condition_met is true but no stau_commits are present.',
      'stau_commits',
    ));
  }

  // ── Tab 2: Überlappungsmeldung ─────────────────────────────────────────────
  for (const res of state.overlap_resolutions) {
    if (res.zone_ids.length < 2) {
      errors.push(err(
        'OPDEC_OVERLAP_TOO_FEW_ZONES',
        `OverlapResolution '${res.resolution_id}' must reference at least 2 zones.`,
        'overlap_resolutions',
        res.resolution_id,
      ));
    }
    if (res.method === 'freflaeche_defined' && !res.freflaeche_geometry) {
      errors.push(err(
        'OPDEC_FREFLAECHE_MISSING',
        `OverlapResolution '${res.resolution_id}': method is freflaeche_defined but no geometry provided.`,
        'overlap_resolutions',
        res.resolution_id,
      ));
    }
  }

  // ── Tab 3: Off-path-Zone ───────────────────────────────────────────────────
  for (const dec of state.off_path_decisions) {
    if (dec.result === 'pending') {
      warnings.push(warn(
        'OPDEC_OFF_PATH_PENDING',
        `OffPathDecision '${dec.decision_id}' for zone '${dec.zone_id}' is still pending.`,
        'off_path_decisions',
        dec.decision_id,
      ));
    }
    if (dec.result === 'overridden_included' && !dec.override_reason) {
      warnings.push(warn(
        'OPDEC_OFF_PATH_OVERRIDE_NO_REASON',
        `OffPathDecision '${dec.decision_id}': overridden_included without override_reason.`,
        'off_path_decisions',
        dec.decision_id,
      ));
    }
  }

  // ── Tab 4: Stau-Schnittmodell ──────────────────────────────────────────────
  for (const commit of state.stau_commits) {
    if (commit.result === 'pending') {
      warnings.push(warn(
        'OPDEC_STAU_PENDING',
        `StauCommit '${commit.commit_id}' for zone '${commit.zone_id}' is still pending — operator confirmation required.`,
        'stau_commits',
        commit.commit_id,
      ));
    }
    if (commit.result === 'rejected' && !commit.rejection_reason) {
      warnings.push(warn(
        'OPDEC_STAU_REJECTED_NO_REASON',
        `StauCommit '${commit.commit_id}' is rejected without a rejection_reason.`,
        'stau_commits',
        commit.commit_id,
      ));
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_detector_id: detector?.detector_id ?? 'missing',
  };
}
