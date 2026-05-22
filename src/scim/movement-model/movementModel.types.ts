export type MovementModelStatus =
  | 'not_computed'
  | 'computing'
  | 'movement_model_valid'
  | 'movement_model_invalid'
  | 'movement_model_warning'
  | 'movement_model_error';

export type MovementClass =
  | 'high_flow'
  | 'moderate_flow'
  | 'low_flow'
  | 'static'
  | 'unknown';

export type FlowDirection =
  | 'bidirectional'
  | 'from_to_dominant'
  | 'to_from_dominant'
  | 'unknown';

export interface EdgeMovementState {
  edge_id: string;
  movement_class: MovementClass;
  movement_ratio: number;
  stillness_ratio: number;
  flow_direction: FlowDirection;
  normalized_movement_score: number;
  confidence_score: number;
  privacy_masked: boolean;
}

export interface MovementModelMetrics {
  evaluated_edge_count: number;
  high_flow_edge_count: number;
  static_edge_count: number;
  masked_edge_count: number;
  avg_movement_score: number;
}

export interface MovementModelIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface MovementModelValidationResult {
  is_valid: boolean;
  errors: MovementModelIssue[];
  warnings: MovementModelIssue[];
  checked_at: string;
  checked_against_graph_id: string;
  checked_against_load_projection_id: string;
}

export interface MovementModelState {
  movement_model_id: string;
  graph_id: string;
  load_projection_id: string;
  edge_movement_states: EdgeMovementState[];
  metrics: MovementModelMetrics;
  validation: MovementModelValidationResult;
  status: MovementModelStatus;
  computed_at: string;
}
