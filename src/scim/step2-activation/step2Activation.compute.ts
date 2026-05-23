import type { StayZoneDetectorState } from '../stay-zone-detector/stayZoneDetector.types';
import type { OperatorDecisionState } from '../operator-decision/operatorDecision.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';
import type { Step2ActivationState } from './step2Activation.types';
import type { PreviousStep2ObservationState } from '../pipeline/scimPipeline.types';

/**
 * Computes a Step2ActivationState with temporal observation gating.
 *
 * Lifecycle:
 *
 *   1. No jam detected  →  not_triggered  (observation_run_count reset to 0)
 *
 *   2. Jam detected, count < step2_min_observation_runs
 *                       →  observation_running  (counting, not yet actionable)
 *
 *   3. Jam detected, count >= step2_min_observation_runs, awaiting operator
 *                       →  triggered_awaiting_operator
 *
 *   4. Operator confirms  →  operator_confirmed, mode = 'movement_and_stay'
 *   5. Operator rejects   →  operator_rejected   (count reset)
 *   6. Operator defers    →  operator_deferred    (count preserved)
 *
 * The observation_run_count is accumulated across runs via previous_step2_state
 * passed in by the SCIM console. The pipeline itself is stateless — persistence
 * is the console's responsibility.
 */
export function computeStep2Activation(
  detector: StayZoneDetectorState | undefined,
  operatorDecision: OperatorDecisionState | undefined,
  systemAdjust: SystemAdjustState | undefined,
  previousState: PreviousStep2ObservationState | undefined,
): Step2ActivationState {
  const now = new Date().toISOString();
  const minRuns = systemAdjust?.default_parameters.step2_min_observation_runs ?? 3;

  const jamCount = detector?.jam_count ?? 0;
  const jamZoneIds = (detector?.detected_zones ?? [])
    .filter((z) => z.classification === 'stau')
    .map((z) => z.zone_id);

  const conditionMet = jamCount > 0 && (detector?.step2_activation_condition_met ?? false);

  // ── No jam: reset observation ─────────────────────────────────────────────
  if (!conditionMet) {
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
      observation_run_count: 0,
      first_detected_at: null,
      sustained_duration_minutes: 0,
      validation: { is_valid: true, errors: [], warnings: [], checked_at: now },
      status: 'not_triggered',
      created_at: now,
    };
  }

  // ── Jam detected: accumulate observation count ────────────────────────────
  const prevCount = previousState?.observation_run_count ?? 0;
  const prevFirstDetected = previousState?.first_detected_at ?? null;

  // Only accumulate if the previous run also had a jam condition
  // (reset if the previous run was 'not_triggered' or 'operator_rejected')
  const prevWasObserving =
    previousState !== undefined &&
    previousState.status !== 'not_triggered' &&
    previousState.status !== 'operator_rejected';

  const observation_run_count = prevWasObserving ? prevCount + 1 : 1;
  const first_detected_at = prevWasObserving && prevFirstDetected
    ? prevFirstDetected
    : now;

  const elapsedMs = new Date(now).getTime() - new Date(first_detected_at).getTime();
  const sustained_duration_minutes = Math.round(elapsedMs / 60_000);

  const trigger = {
    trigger_id: `trg_${Date.now()}`,
    detector_id: detector!.detector_id,
    jam_count: jamCount,
    triggering_zone_ids: jamZoneIds,
    triggered_at: first_detected_at,
  };

  // ── Still within observation window ──────────────────────────────────────
  if (observation_run_count < minRuns) {
    return {
      activation_id: `s2a_${Date.now()}`,
      trigger,
      resulting_classification_mode: 'movement_only',
      observation_run_count,
      first_detected_at,
      sustained_duration_minutes,
      validation: {
        is_valid: true,
        errors: [],
        warnings: [{
          code: 'STEP2_OBSERVATION_RUNNING',
          severity: 'warning',
          message: `Stauindikation läuft seit Run ${observation_run_count}/${minRuns} — Beobachtungsfenster noch nicht abgeschlossen.`,
          blocking: false,
        }],
        checked_at: now,
      },
      status: 'observation_running',
      created_at: now,
    };
  }

  // ── Observation window complete: derive status from operator decision ──────
  const decisionStatus = operatorDecision?.status ?? 'not_started';
  let status: Step2ActivationState['status'];
  let resultingMode: Step2ActivationState['resulting_classification_mode'] = 'movement_only';

  if (decisionStatus === 'completed') {
    status = 'operator_confirmed';
    resultingMode = 'movement_and_stay';
  } else if (decisionStatus === 'operator_decision_invalid') {
    status = 'operator_rejected';
  } else {
    // Awaiting operator — count continues to accumulate
    status = 'triggered_awaiting_operator';
  }

  return {
    activation_id: `s2a_${Date.now()}`,
    trigger,
    resulting_classification_mode: resultingMode,
    observation_run_count,
    first_detected_at,
    sustained_duration_minutes,
    validation: { is_valid: true, errors: [], warnings: [], checked_at: now },
    status,
    created_at: now,
  };
}
