import type { SensusCoreLocalState } from './sensusCoreLocal.types';

export const mockSensusCoreLocalState: SensusCoreLocalState = {
  local_context_id: 'local_default',
  tolerances: {
    route_load_tolerance: 0.7,
    preferred_difficulty: 'moderate',
    prefer_quiet_pois: false,
    max_acceptable_load_score: 0.8,
  },
  is_default: true,
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:15:00.000Z',
    checked_against_system_adjust_version: 'sys_v1.0.0',
  },
  status: 'local_context_valid',
  loaded_at: '2026-05-21T00:15:00.000Z',
};
