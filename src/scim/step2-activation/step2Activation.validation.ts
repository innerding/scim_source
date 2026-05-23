import type {
  Step2ActivationState,
  Step2ActivationIssue,
  Step2ActivationValidationResult,
} from './step2Activation.types';

function err(code: string, message: string, field?: string): Step2ActivationIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): Step2ActivationIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateStep2Activation(
  state: Step2ActivationState,
): Step2ActivationValidationResult {
  const errors: Step2ActivationIssue[] = [];
  const warnings: Step2ActivationIssue[] = [];

  // Trigger-Konsistenz
  if (state.trigger.jam_count < 0) {
    errors.push(err('S2A_JAM_COUNT_NEGATIVE', 'trigger.jam_count must be >= 0.', 'trigger.jam_count'));
  }

  if (state.trigger.jam_count === 0 && state.status !== 'not_triggered') {
    errors.push(err(
      'S2A_NO_JAM_BUT_TRIGGERED',
      `Status is '${state.status}' but jam_count is 0 — activation requires at least one jam.`,
      'trigger.jam_count',
    ));
  }

  if (state.trigger.jam_count > 0 && state.trigger.triggering_zone_ids.length === 0) {
    errors.push(err(
      'S2A_JAM_ZONES_MISSING',
      'jam_count > 0 but triggering_zone_ids is empty.',
      'trigger.triggering_zone_ids',
    ));
  }

  // Entscheidungs-Konsistenz
  if (state.status === 'operator_confirmed') {
    if (state.resulting_classification_mode !== 'movement_and_stay') {
      errors.push(err(
        'S2A_CONFIRMED_MODE_MISMATCH',
        `Status is 'operator_confirmed' but resulting_classification_mode is '${state.resulting_classification_mode}' — expected 'movement_and_stay'.`,
        'resulting_classification_mode',
      ));
    }
    if (!state.decision) {
      errors.push(err('S2A_CONFIRMED_NO_DECISION', "Status is 'operator_confirmed' but no decision is recorded.", 'decision'));
    }
  }

  if (state.status === 'operator_rejected' || state.status === 'operator_deferred') {
    if (state.resulting_classification_mode !== 'movement_only') {
      errors.push(err(
        'S2A_REJECTED_MODE_MISMATCH',
        `Status is '${state.status}' but resulting_classification_mode is '${state.resulting_classification_mode}' — expected 'movement_only'.`,
        'resulting_classification_mode',
      ));
    }
  }

  if (state.status === 'triggered_awaiting_operator') {
    warnings.push(warn(
      'S2A_AWAITING_OPERATOR',
      `Step-2 activation triggered (${state.trigger.jam_count} jam zone(s)) — operator confirmation pending.`,
      'status',
    ));
  }

  if (state.decision?.result === 'deferred' && !state.decision.defer_until) {
    warnings.push(warn('S2A_DEFERRED_NO_DATE', "Decision is 'deferred' but no defer_until date is set.", 'decision.defer_until'));
  }

  if (state.decision?.result === 'rejected' && !state.decision.rejection_reason) {
    warnings.push(warn('S2A_REJECTED_NO_REASON', "Decision is 'rejected' without a rejection_reason.", 'decision.rejection_reason'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
  };
}
