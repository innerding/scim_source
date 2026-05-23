import type { StayZoneDetectorState } from '../stay-zone-detector/stayZoneDetector.types';
import type { OperatorDecisionState } from '../operator-decision/operatorDecision.types';
import type { Step2ActivationState } from './step2Activation.types';

/**
 * Computes a Step2Activation state from the detector and operator decision.
 *
 * - No jam → not_triggered, classification_mode stays 'movement_only'
 * - Jam detected, decision pending → triggered_awaiting_operator
 * - Decision confirmed → operator_confirmed, classification_mode = 'movement_and_stay'
 * - Decision rejected → operator_rejected
 */
export function computeStep2Activation(
  detector: StayZoneDetectorState | undefined,
  operatorDecision: OperatorDecisionState | undefined,
): Step2ActivationState {
  const now = new Date().toISOString();
  const jamCount = detector?.jam_count ?? 0;
  const jamZoneIds = (detector?.detected_zones ?? [])
    .filter((z) => z.classification === 'stau')
    .map((z) => z.zone_id);

  // No jam — stay in movement_only mode
  if (jamCount === 0 || !detector?.step2_activation_condition_met) {
    return {
      activation_id: `s2a_${Date.now()}`,
      trigger: {
        trigger_id: `trg_${Date.now()}`,
        detector_id: detector?.detector_id ?? 'none',
        jam_count: 0,
        triggering_zone_ids: [],
        triggered_at: now,
      },
      resulting_classification_mode: 'movement_only',
      validation: { is_valid: true, errors: [], warnings: [], checked_at: now },
      status: 'not_triggered',
      created_at: now,
    };
  }

  // Jam detected — derive status from operator decision
  const decisionStatus = operatorDecision?.status ?? 'not_started';
  let status: Step2ActivationState['status'];
  let resultingMode: Step2ActivationState['resulting_classification_mode'] = 'movement_only';

  if (decisionStatus === 'completed') {
    status = 'operator_confirmed';
    resultingMode = 'movement_and_stay';
  } else if (decisionStatus === 'operator_decision_invalid') {
    status = 'operator_rejected';
  } else {
    status = 'triggered_awaiting_operator';
  }

  return {
    activation_id: `s2a_${Date.now()}`,
    trigger: {
      trigger_id: `trg_${Date.now()}`,
      detector_id: detector.detector_id,
      jam_count: jamCount,
      triggering_zone_ids: jamZoneIds,
      triggered_at: now,
    },
    resulting_classification_mode: resultingMode,
    validation: { is_valid: true, errors: [], warnings: [], checked_at: now },
    status,
    created_at: now,
  };
}
