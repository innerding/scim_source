import type { RouteModelState } from './routeModel.types';

export const mockRouteModelState: RouteModelState = {
  route_model_id: 'route_model_001',
  graph_id: 'graph_hochwab_001',
  movement_model_id: 'mm_001',
  masking_model_id: 'mask_001',
  route_degrade_threshold: 0.65,
  route_exclude_threshold: 0.9,
  route_exceedance_behavior: 'degrade',
  edge_evaluations: [
    {
      edge_id: 'e_001',
      normalized_load_score: 0.58,
      score_class: 'yellow',
      decision: 'include',
      applied_behavior: 'degrade',
      confidence_score: 0.82,
    },
    {
      edge_id: 'e_002',
      normalized_load_score: 0.42,
      score_class: 'green',
      decision: 'include',
      applied_behavior: 'degrade',
      confidence_score: 0.78,
    },
    {
      edge_id: 'e_003',
      normalized_load_score: 0.18,
      score_class: 'green',
      decision: 'include',
      applied_behavior: 'degrade',
      confidence_score: 0.55,
    },
  ],
  metrics: {
    evaluated_edge_count: 3,
    included_edge_count: 3,
    degraded_edge_count: 0,
    excluded_edge_count: 0,
    warn_edge_count: 0,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:09:00.000Z',
    checked_against_movement_model_id: 'mm_001',
    checked_against_system_adjust_version: 'sys_v1.0.0',
  },
  status: 'route_model_valid',
  computed_at: '2026-05-21T00:09:00.000Z',
};
