import type { ScimIssue } from './scimContext.issues';

export type ScimValidationSeverity = 'valid' | 'info' | 'warning' | 'error' | 'blocker';

export interface ScimValidationResult {
  checked_at: string;
  valid: boolean;
  severity: ScimValidationSeverity;
  errors: ScimIssue[];
  warnings: ScimIssue[];
  blockers: ScimIssue[];
}

export function makeEmptyValidation(): ScimValidationResult {
  return {
    checked_at: new Date().toISOString(),
    valid: true,
    severity: 'valid',
    errors: [],
    warnings: [],
    blockers: [],
  };
}

export function deriveValidationSeverity(result: ScimValidationResult): ScimValidationSeverity {
  if (result.blockers.length > 0) return 'blocker';
  if (result.errors.length > 0) return 'error';
  if (result.warnings.length > 0) return 'warning';
  return 'valid';
}

export function isValidationBlocked(result: ScimValidationResult): boolean {
  return result.blockers.length > 0;
}

export function isValidationValid(result: ScimValidationResult): boolean {
  return result.valid && result.blockers.length === 0 && result.errors.length === 0;
}

export function combineValidations(a: ScimValidationResult, b: ScimValidationResult): ScimValidationResult {
  const combined: ScimValidationResult = {
    checked_at: new Date().toISOString(),
    valid: a.valid && b.valid,
    severity: 'valid',
    errors: [...a.errors, ...b.errors],
    warnings: [...a.warnings, ...b.warnings],
    blockers: [...a.blockers, ...b.blockers],
  };
  combined.severity = deriveValidationSeverity(combined);
  if (combined.blockers.length > 0 || combined.errors.length > 0) {
    combined.valid = false;
  }
  return combined;
}
