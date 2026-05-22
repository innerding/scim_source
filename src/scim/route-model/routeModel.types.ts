import type { RouteExceedanceBehavior } from '../system-adjust/systemAdjust.types';

export type RouteModelStatus =
  | 'not_computed'
  | 'computing'
  | 'route_model_valid'
  | 'route_model_invalid'
  | 'route_model_warning'
  | 'route_model_error';

export type RouteScoreClass = 'green' | 'yellow' | 'orange' | 'red' | 'blocked' | 'unknown';

export type RouteDecision = 'include' | 'degrade' | 'exclude' | 'warn';

export interface RouteEdgeEvaluation {
  edge_id: string;
  normalized_load_score: number;
  score_class: RouteScoreClass;
  decision: RouteDecision;
  exceeded_threshold?: 'degrade' | 'exclude';
  applied_behavior: RouteExceedanceBehavior;
  confidence_score: number;
}

export interface RouteModelMetrics {
  evaluated_edge_count: number;
  included_edge_count: number;
  degraded_edge_count: number;
  excluded_edge_count: number;
  warn_edge_count: number;
}

export interface RouteModelIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface RouteModelValidationResult {
  is_valid: boolean;
  errors: RouteModelIssue[];
  warnings: RouteModelIssue[];
  checked_at: string;
  checked_against_movement_model_id: string;
  checked_against_system_adjust_version: string;
}

export interface RouteModelState {
  route_model_id: string;
  graph_id: string;
  movement_model_id: string;
  masking_model_id?: string;
  route_degrade_threshold: number;
  route_exclude_threshold: number;
  route_exceedance_behavior: RouteExceedanceBehavior;
  edge_evaluations: RouteEdgeEvaluation[];
  metrics: RouteModelMetrics;
  validation: RouteModelValidationResult;
  status: RouteModelStatus;
  computed_at: string;
}
