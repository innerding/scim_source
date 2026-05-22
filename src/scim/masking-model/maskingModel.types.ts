export type MaskingModelStatus =
  | 'not_computed'
  | 'computing'
  | 'masking_model_valid'
  | 'masking_model_invalid'
  | 'masking_model_warning'
  | 'masking_model_error';

export type MaskingReason =
  | 'below_min_distinct_devices'
  | 'below_min_signal_count'
  | 'single_device_visibility_risk'
  | 'edge_below_min_length'
  | 'stay_area_below_min_radius'
  | 'expired_signal'
  | 'privacy_rule_violation';

export type MaskedElementType = 'poi' | 'edge' | 'area';

export interface MaskedElement {
  element_type: MaskedElementType;
  element_id: string;
  masking_reason: MaskingReason;
  rule_code: string;
}

export interface MaskingModelMetrics {
  total_evaluated: number;
  total_masked: number;
  masked_pois: number;
  masked_edges: number;
  masking_ratio: number;
}

export interface MaskingModelIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface MaskingModelValidationResult {
  is_valid: boolean;
  errors: MaskingModelIssue[];
  warnings: MaskingModelIssue[];
  checked_at: string;
  checked_against_system_adjust_version: string;
}

export interface MaskingModelState {
  masking_model_id: string;
  masked_elements: MaskedElement[];
  metrics: MaskingModelMetrics;
  validation: MaskingModelValidationResult;
  status: MaskingModelStatus;
  applied_at: string;
}
