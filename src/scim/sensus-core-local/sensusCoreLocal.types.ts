export type SensusCoreLocalStatus =
  | 'not_loaded'
  | 'local_context_valid'
  | 'local_context_invalid'
  | 'local_context_default';

export type PreferredDifficulty = 'easy' | 'moderate' | 'difficult' | 'any';

export interface UserTolerances {
  route_load_tolerance: number;
  preferred_difficulty: PreferredDifficulty;
  prefer_quiet_pois: boolean;
  max_acceptable_load_score: number;
}

export interface SensusCoreLocalIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface SensusCoreLocalValidationResult {
  is_valid: boolean;
  errors: SensusCoreLocalIssue[];
  warnings: SensusCoreLocalIssue[];
  checked_at: string;
  checked_against_system_adjust_version: string;
}

export interface SensusCoreLocalState {
  local_context_id: string;
  user_id?: string;
  tolerances: UserTolerances;
  is_default: boolean;
  validation: SensusCoreLocalValidationResult;
  status: SensusCoreLocalStatus;
  loaded_at: string;
}
