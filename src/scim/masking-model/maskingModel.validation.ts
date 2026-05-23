import type { MaskingModelState, MaskingModelIssue, MaskingModelValidationResult } from './maskingModel.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';

function err(code: string, message: string, field?: string): MaskingModelIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): MaskingModelIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateMaskingModel(
  state: MaskingModelState,
  systemAdjust: SystemAdjustState | undefined,
): MaskingModelValidationResult {
  const errors: MaskingModelIssue[] = [];
  const warnings: MaskingModelIssue[] = [];

  if (!systemAdjust) {
    errors.push(err('MASK_SYSTEM_ADJUST_MISSING', 'System-Adjust is missing.', 'system_adjust'));
  } else if (systemAdjust.status !== 'system_adjust_valid' && systemAdjust.status !== 'system_adjust_warning') {
    errors.push(err('MASK_SYSTEM_ADJUST_INVALID', `System-Adjust status is '${systemAdjust.status}'.`, 'system_adjust'));
  }

  const { masking_ratio } = state.metrics;
  if (masking_ratio < 0 || masking_ratio > 1) {
    errors.push(err('MASK_RATIO_INVALID', `masking_ratio ${masking_ratio} must be in [0, 1].`, 'metrics.masking_ratio'));
  }

  const computedRatio = state.metrics.total_evaluated > 0
    ? state.metrics.total_masked / state.metrics.total_evaluated
    : 0;
  if (Math.abs(computedRatio - masking_ratio) > 0.01) {
    errors.push(err('MASK_RATIO_INCONSISTENT', `masking_ratio ${masking_ratio} does not match total_masked/total_evaluated = ${computedRatio.toFixed(3)}.`, 'metrics'));
  }

  if (masking_ratio > 0.8) {
    warnings.push(warn('MASK_HIGH_MASKING_RATIO', `${(masking_ratio * 100).toFixed(0)}% of elements are masked — output may be sparse.`, 'metrics.masking_ratio'));
  }

  const jamFlagged = state.masked_elements.filter(e => e.masking_reason === 'jam_zone_flagged');
  if (jamFlagged.length > 0) {
    warnings.push(warn('MASK_JAM_ZONES_FLAGGED', `${jamFlagged.length} element(s) flagged due to jam zone — operator confirmation may be required.`, 'masked_elements'));
  }

  const overlapConflicts = state.masked_elements.filter(e => e.masking_reason === 'stay_zone_overlap_conflict');
  if (overlapConflicts.length > 0) {
    warnings.push(warn('MASK_OVERLAP_CONFLICT_PRESENT', `${overlapConflicts.length} element(s) masked due to stay zone overlap conflict — Freifläche may need to be defined.`, 'masked_elements'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
  };
}
