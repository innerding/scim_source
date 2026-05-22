import type { SensusCoreLocalState, SensusCoreLocalIssue, SensusCoreLocalValidationResult } from './sensusCoreLocal.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';

function err(code: string, message: string, field?: string): SensusCoreLocalIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): SensusCoreLocalIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateSensusCoreLocal(
  state: SensusCoreLocalState,
  systemAdjust: SystemAdjustState | undefined,
): SensusCoreLocalValidationResult {
  const errors: SensusCoreLocalIssue[] = [];
  const warnings: SensusCoreLocalIssue[] = [];

  if (!systemAdjust) {
    errors.push(err('LOCAL_SYSTEM_ADJUST_MISSING', 'System-Adjust is missing.', 'system_adjust'));
  }

  const t = state.tolerances;
  if (t.route_load_tolerance < 0 || t.route_load_tolerance > 1) {
    errors.push(err('LOCAL_TOLERANCE_OUT_OF_RANGE', `route_load_tolerance ${t.route_load_tolerance} must be in [0, 1].`, 'tolerances.route_load_tolerance'));
  }
  if (t.max_acceptable_load_score < 0 || t.max_acceptable_load_score > 1) {
    errors.push(err('LOCAL_MAX_LOAD_OUT_OF_RANGE', `max_acceptable_load_score ${t.max_acceptable_load_score} must be in [0, 1].`, 'tolerances.max_acceptable_load_score'));
  }

  if (systemAdjust) {
    const excludeThreshold = systemAdjust.default_parameters.default_route_exclude_threshold;
    if (t.max_acceptable_load_score > excludeThreshold) {
      warnings.push(warn('LOCAL_TOLERANCE_ABOVE_EXCLUDE', `max_acceptable_load_score ${t.max_acceptable_load_score} exceeds system exclude threshold ${excludeThreshold}.`, 'tolerances.max_acceptable_load_score'));
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
  };
}
