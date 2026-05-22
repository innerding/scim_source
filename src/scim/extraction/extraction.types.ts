import type { GeoPoint } from '../context/scimContext.types';

export type ExtractionStatus =
  | 'not_extracted'
  | 'extracting'
  | 'extraction_valid'
  | 'extraction_invalid'
  | 'extraction_warning'
  | 'extraction_error';

export interface ExtractedPoi {
  poi_id: string;
  name?: string;
  category: string;
  center: GeoPoint;
  radius_meters: number;
  comparison_margin_meters: number;
  effective_comparison_radius_meters: number;
  within_boundary: true;
  regio_content_version: string;
}

export interface ExtractedSignalGroup {
  signal_group_id: string;
  signal_type: string;
  aggregation_unit: string;
  within_boundary: boolean;
  normalized_load_score?: number;
  confidence_score?: number;
  projected_to_boundary: boolean;
}

export interface ExtractionIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface ExtractionValidationResult {
  is_valid: boolean;
  errors: ExtractionIssue[];
  warnings: ExtractionIssue[];
  checked_at: string;
  checked_against_boundary_id: string;
  checked_against_regio_content_version?: string;
  checked_against_telco_load_batch_id?: string;
}

export interface ExtractionState {
  extraction_id: string;
  boundary_id: string;
  extracted_pois: ExtractedPoi[];
  excluded_poi_count: number;
  extracted_signal_groups: ExtractedSignalGroup[];
  excluded_signal_count: number;
  out_of_boundary_signal_count: number;
  validation: ExtractionValidationResult;
  status: ExtractionStatus;
  extracted_at: string;
}
