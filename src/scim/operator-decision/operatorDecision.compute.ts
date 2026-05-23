import type { StayZoneDetectorState } from '../stay-zone-detector/stayZoneDetector.types';
import type { OperatorDecisionState } from './operatorDecision.types';

/**
 * Computes a baseline OperatorDecision state based on the StayZoneDetector result.
 *
 * - If the Step-2 activation condition is met (jam detected), the decision
 *   starts in 'awaiting_input' — the operator must review the detected zones.
 * - Otherwise it remains 'not_started'.
 *
 * In production the operator actively works through the 4-tab decision UI (P09).
 * This compute provides the initial state for each pipeline run.
 */
export function computeOperatorDecision(
  detector: StayZoneDetectorState | undefined,
): OperatorDecisionState {
  const now = new Date().toISOString();
  const jamDetected = (detector?.jam_count ?? 0) > 0;
  const step2Met = detector?.step2_activation_condition_met ?? false;

  return {
    decision_id: `opdec_${Date.now()}`,
    detector_id: detector?.detector_id ?? 'none',
    prerequisites: {
      jam_detected: jamDetected,
      step2_activation_condition_met: step2Met,
      detector_id: detector?.detector_id ?? 'none',
    },
    overlap_resolutions: [],
    off_path_decisions: [],
    stau_commits: [],
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_detector_id: detector?.detector_id ?? 'none',
    },
    status: step2Met ? 'awaiting_input' : 'not_started',
    created_at: now,
  };
}
