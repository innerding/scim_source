export type LoadProjectionStatus =
  | 'not_computed'
  | 'computing'
  | 'load_projection_valid'
  | 'load_projection_invalid'
  | 'load_projection_warning'
  | 'load_projection_error';

export type EdgeLoadClass = 'quiet' | 'moderate' | 'busy' | 'very_busy' | 'unknown';

export type EdgeLoadProjectionMethod =
  | 'signal_to_edge'
  | 'signal_to_area'
  | 'interpolated'
  | 'default_fallback'
  | 'unknown';

export interface EdgeLoadScore {
  edge_id: string;
  normalized_load_score: number;
  load_class: EdgeLoadClass;
  contributing_signal_group_ids: string[];
  confidence_score: number;
  method: EdgeLoadProjectionMethod;
  privacy_masked: boolean;
}

export interface LoadProjectionMetrics {
  projected_edge_count: number;
  masked_edge_count: number;
  unprojected_edge_count: number;
  avg_load_score: number;
  max_load_score: number;
}

export interface LoadProjectionIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface LoadProjectionValidationResult {
  is_valid: boolean;
  errors: LoadProjectionIssue[];
  warnings: LoadProjectionIssue[];
  checked_at: string;
  checked_against_graph_id: string;
  checked_against_extraction_id: string;
}

export interface LoadProjectionState {
  load_projection_id: string;
  graph_id: string;
  extraction_id: string;
  edge_load_scores: EdgeLoadScore[];
  metrics: LoadProjectionMetrics;
  validation: LoadProjectionValidationResult;
  status: LoadProjectionStatus;
  projected_at: string;
}
