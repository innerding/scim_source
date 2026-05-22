import type { ScimIssue } from './scimContext.issues';

export type ScimDataPrivacyLevel =
  | 'public_safe'
  | 'reduced_public'
  | 'operator_internal'
  | 'debug_only'
  | 'raw_forbidden'
  | 'privacy_blocked';

export type ScimRunMode = 'draft' | 'test' | 'staging' | 'production';

export interface ScimPrivacyStatus {
  status: 'valid' | 'warning' | 'blocked';
  checked_at: string;
  raw_signals_absent: boolean;
  device_level_data_absent: boolean;
  single_device_visibility_absent: boolean;
  debug_data_absent_from_public_outputs: boolean;
  operator_data_absent_from_public_outputs: boolean;
  minimum_aggregation_met: boolean;
  blockers: ScimIssue[];
  warnings: ScimIssue[];
}

export const SENSUS_CORE_ALLOWED_PRIVACY_LEVELS = new Set<ScimDataPrivacyLevel>([
  'public_safe',
  'reduced_public',
]);

export function isPrivacyLevelAllowedInSensusCore(level: ScimDataPrivacyLevel): boolean {
  return SENSUS_CORE_ALLOWED_PRIVACY_LEVELS.has(level);
}

// Hardcoded system constraints — never overridable by downstream panels
export const PRIVACY_HARDCODED_RULES = {
  allow_single_device_visibility: false,
  allow_raw_signals_in_sensus_core: false,
  allow_debug_data_in_sensus_core: false,
  production_blocks_simulation_load: true,
} as const;

export function makeCleanPrivacyStatus(): ScimPrivacyStatus {
  return {
    status: 'valid',
    checked_at: new Date().toISOString(),
    raw_signals_absent: true,
    device_level_data_absent: true,
    single_device_visibility_absent: true,
    debug_data_absent_from_public_outputs: true,
    operator_data_absent_from_public_outputs: true,
    minimum_aggregation_met: true,
    blockers: [],
    warnings: [],
  };
}
