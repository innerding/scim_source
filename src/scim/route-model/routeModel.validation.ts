import type { RouteModelState, RouteModelIssue, RouteModelValidationResult } from './routeModel.types';
import type { MovementModelState } from '../movement-model/movementModel.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';

function err(code: string, message: string, field?: string, related_id?: string): RouteModelIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): RouteModelIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

export function validateRouteModel(
  state: RouteModelState,
  movementModel: MovementModelState | undefined,
  systemAdjust: SystemAdjustState | undefined,
): RouteModelValidationResult {
  const errors: RouteModelIssue[] = [];
  const warnings: RouteModelIssue[] = [];

  if (!movementModel) {
    errors.push(err('ROUTE_MOVEMENT_MODEL_MISSING', 'Movement-Model is missing.', 'movement_model'));
  } else if (movementModel.status !== 'movement_model_valid' && movementModel.status !== 'movement_model_warning') {
    errors.push(err('ROUTE_MOVEMENT_MODEL_INVALID', `Movement-Model status is '${movementModel.status}'.`, 'movement_model'));
  }

  if (!systemAdjust) {
    errors.push(err('ROUTE_SYSTEM_ADJUST_MISSING', 'System-Adjust is missing.', 'system_adjust'));
  }

  if (state.route_degrade_threshold >= state.route_exclude_threshold) {
    errors.push(err('ROUTE_DEGRADE_EXCEEDS_EXCLUDE', `route_degrade_threshold ${state.route_degrade_threshold} must be < route_exclude_threshold ${state.route_exclude_threshold}.`, 'route_degrade_threshold'));
  }

  if (state.edge_evaluations.length === 0) {
    errors.push(err('ROUTE_NO_EVALUATIONS', 'No edge evaluations computed.', 'edge_evaluations'));
  }

  for (const ev of state.edge_evaluations) {
    if (ev.normalized_load_score < 0 || ev.normalized_load_score > 1) {
      errors.push(err('ROUTE_LOAD_SCORE_OUT_OF_RANGE', `Edge ${ev.edge_id}: normalized_load_score ${ev.normalized_load_score} must be in [0, 1].`, 'edge_evaluations', ev.edge_id));
    }
  }

  const total = state.metrics.evaluated_edge_count;
  if (total > 0 && state.metrics.excluded_edge_count === total) {
    warnings.push(warn('ROUTE_ALL_EXCLUDED', 'All edges are excluded — no routes available.', 'metrics'));
  }

  if (total > 0 && state.metrics.excluded_edge_count / total > 0.5) {
    warnings.push(warn('ROUTE_HIGH_EXCLUDED_RATIO', `${state.metrics.excluded_edge_count} of ${total} edges excluded (>50%).`, 'metrics'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_movement_model_id: movementModel?.movement_model_id ?? 'missing',
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
  };
}
