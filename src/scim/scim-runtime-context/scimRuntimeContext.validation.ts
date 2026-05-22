import type { ScimRuntimeContextState, ScimRuntimeContextIssue, ScimRuntimeContextValidationResult } from './scimRuntimeContext.types';

function err(code: string, message: string, field?: string): ScimRuntimeContextIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): ScimRuntimeContextIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateScimRuntimeContext(state: ScimRuntimeContextState): ScimRuntimeContextValidationResult {
  const errors: ScimRuntimeContextIssue[] = [];
  const warnings: ScimRuntimeContextIssue[] = [];

  if (!state.runtime_context_id) {
    errors.push(err('RTX_ID_MISSING', 'runtime_context_id is missing.', 'runtime_context_id'));
  }

  if (!state.versions.system_adjust_version) {
    errors.push(err('RTX_SYSTEM_ADJUST_VERSION_MISSING', 'system_adjust_version is required.', 'versions.system_adjust_version'));
  }

  if (state.pipeline_completeness < 0 || state.pipeline_completeness > 1) {
    errors.push(err('RTX_COMPLETENESS_INVALID', `pipeline_completeness ${state.pipeline_completeness} must be in [0, 1].`, 'pipeline_completeness'));
  }

  if (state.missing_panels.length > 0) {
    warnings.push(warn('RTX_PANELS_MISSING', `${state.missing_panels.length} panel(s) missing: ${state.missing_panels.join(', ')}.`, 'missing_panels'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
  };
}
