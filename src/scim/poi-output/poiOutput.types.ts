import type { GeoPoint } from '../context/scimContext.types';

export type PoiModelStatus =
  | 'not_computed'
  | 'computing'
  | 'poi_model_valid'
  | 'poi_model_invalid'
  | 'poi_model_warning'
  | 'poi_model_error';

export type PoiLoadClass = 'quiet' | 'moderate' | 'busy' | 'very_busy' | 'unknown';

export type StayClassification =
  | 'confirmed_stay'
  | 'likely_stay'
  | 'possible_stay'
  | 'transit'
  | 'unknown';

export interface PoiLoadState {
  poi_id: string;
  name?: string;
  load_class: PoiLoadClass;
  normalized_load_score: number;
  stay_classification: StayClassification;
  contributing_signal_group_ids: string[];
  confidence_score: number;
  privacy_masked: boolean;
  signal_count_sufficient: boolean;
  // Transform Geometries — Phase 6
  zone_radius_meters?: number;
  zone_center?: GeoPoint;
  is_off_path: boolean;
  operator_confirmed: boolean;
  overlap_flagged: boolean;
}

export interface PoiModelMetrics {
  evaluated_poi_count: number;
  masked_poi_count: number;
  busy_poi_count: number;
  quiet_poi_count: number;
  unknown_poi_count: number;
}

export interface PoiModelIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface PoiModelValidationResult {
  is_valid: boolean;
  errors: PoiModelIssue[];
  warnings: PoiModelIssue[];
  checked_at: string;
  checked_against_detector_id: string;
  checked_against_system_adjust_version: string;
}

export interface PoiModelState {
  poi_model_id: string;
  detector_id: string;
  evaluated_pois: PoiLoadState[];
  metrics: PoiModelMetrics;
  validation: PoiModelValidationResult;
  status: PoiModelStatus;
  computed_at: string;
}
