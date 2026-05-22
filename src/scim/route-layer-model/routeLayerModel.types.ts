import type { RouteScoreClass, RouteDecision } from '../route-model/routeModel.types';

export type RouteLayerModelStatus =
  | 'not_built'
  | 'building'
  | 'route_layer_model_valid'
  | 'route_layer_model_invalid'
  | 'route_layer_model_warning';

export interface ScoreClassStyle {
  score_class: RouteScoreClass;
  color: string;
  opacity: number;
  weight: number;
  dash_pattern?: string;
}

export interface RouteLayerSegment {
  segment_id: string;
  edge_id: string;
  score_class: RouteScoreClass;
  decision: RouteDecision;
  style: ScoreClassStyle;
  visible: boolean;
}

export interface RouteLayerModelIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface RouteLayerModelValidationResult {
  is_valid: boolean;
  errors: RouteLayerModelIssue[];
  warnings: RouteLayerModelIssue[];
  checked_at: string;
  checked_against_route_model_id: string;
}

export interface RouteLayerModelState {
  route_layer_model_id: string;
  route_model_id: string;
  segments: RouteLayerSegment[];
  score_class_styles: ScoreClassStyle[];
  visible_segment_count: number;
  validation: RouteLayerModelValidationResult;
  status: RouteLayerModelStatus;
  built_at: string;
}
