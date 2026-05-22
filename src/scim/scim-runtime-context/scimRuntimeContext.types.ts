export type ScimRuntimeContextStatus =
  | 'not_assembled'
  | 'assembling'
  | 'runtime_context_valid'
  | 'runtime_context_invalid'
  | 'runtime_context_warning';

export interface ScimRuntimeContextVersions {
  system_adjust_version: string;
  regio_content_version?: string;
  target_app_ui_version?: string;
  telco_load_batch_id?: string;
  boundary_id?: string;
  extraction_id?: string;
  graph_id?: string;
  basis_layer_id?: string;
  poi_model_id?: string;
  load_projection_id?: string;
  movement_model_id?: string;
  masking_model_id?: string;
  route_model_id?: string;
  layer_model_id?: string;
}

export interface ScimRuntimeContextIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface ScimRuntimeContextValidationResult {
  is_valid: boolean;
  errors: ScimRuntimeContextIssue[];
  warnings: ScimRuntimeContextIssue[];
  checked_at: string;
}

export interface ScimRuntimeContextState {
  runtime_context_id: string;
  versions: ScimRuntimeContextVersions;
  pipeline_completeness: number;
  assembled_panels: string[];
  missing_panels: string[];
  validation: ScimRuntimeContextValidationResult;
  status: ScimRuntimeContextStatus;
  assembled_at: string;
}
