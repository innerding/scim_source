export type LeafletBasisCheckStatus =
  | 'not_checked'
  | 'checking'
  | 'leaflet_basis_ok'
  | 'leaflet_basis_failed'
  | 'leaflet_basis_warning';

export interface LeafletBasisCheckResult {
  basis_layer_available: boolean;
  graph_available: boolean;
  viewport_valid: boolean;
  tile_layers_count: number;
  overall_ready: boolean;
}

export interface LeafletBasisCheckIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface LeafletBasisCheckValidationResult {
  is_valid: boolean;
  errors: LeafletBasisCheckIssue[];
  warnings: LeafletBasisCheckIssue[];
  checked_at: string;
  checked_against_basis_layer_id?: string;
}

export interface LeafletBasisCheckState {
  check_id: string;
  basis_layer_id?: string;
  graph_id?: string;
  check_result: LeafletBasisCheckResult;
  validation: LeafletBasisCheckValidationResult;
  status: LeafletBasisCheckStatus;
  checked_at: string;
}
