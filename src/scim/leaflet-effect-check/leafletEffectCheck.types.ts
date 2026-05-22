export type LeafletEffectCheckStatus =
  | 'not_checked'
  | 'effect_check_ok'
  | 'effect_check_failed'
  | 'effect_check_warning';

export interface LeafletRenderResult {
  route_layer_rendered: boolean;
  poi_layer_rendered: boolean;
  visible_segment_count: number;
  visible_poi_count: number;
  render_duration_ms?: number;
  any_layer_error: boolean;
}

export interface LeafletEffectCheckIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface LeafletEffectCheckValidationResult {
  is_valid: boolean;
  errors: LeafletEffectCheckIssue[];
  warnings: LeafletEffectCheckIssue[];
  checked_at: string;
  checked_against_package_id?: string;
}

export interface LeafletEffectCheckState {
  check_id: string;
  package_id?: string;
  view_id?: string;
  render_result: LeafletRenderResult;
  validation: LeafletEffectCheckValidationResult;
  status: LeafletEffectCheckStatus;
  checked_at: string;
}
