import type { GeoJsonGeometry, GeoPoint } from '../context/scimContext.types';

export type TelcoLoadSource =
  | 'telco_load_api' | 'runtime_load_service' | 'aggregated_load_backend'
  | 'mock' | 'local_json' | 'api';

export type TelcoLoadStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'telco_load_valid'
  | 'telco_load_invalid'
  | 'telco_load_warning'
  | 'telco_load_expired'
  | 'telco_load_privacy_blocked'
  | 'telco_load_error';

export type AnonymizationMethod =
  | 'pre_aggregated' | 'spatial_bucketed' | 'graph_projected'
  | 'cell_area_aggregated' | 'unknown';

export interface TelcoProviderInfo {
  provider_id: string;
  provider_name?: string;
  data_contract_version?: string;
  anonymization_method?: AnonymizationMethod;
  raw_signal_access: false;
  device_level_access: false;
}

export interface LoadTimeWindow {
  start_at: string;
  end_at: string;
  duration_seconds: number;
  aggregation_window_seconds: number;
  generated_at: string;
  timezone?: string;
}

export type LoadProjectionMethod =
  | 'not_projected' | 'cell_to_area' | 'point_to_grid' | 'point_to_graph_segment'
  | 'aggregate_to_graph_segment' | 'aggregate_to_poi_radius' | 'unknown';

export interface LoadSpatialScope {
  scope_id: string;
  scope_type: 'region' | 'representation_boundary' | 'bbox' | 'tile_set' | 'graph_segment_set' | 'unknown';
  bbox?: [number, number, number, number];
  geometry?: GeoJsonGeometry;
  spatial_resolution_meters: number;
  projection_method: LoadProjectionMethod;
  related_region_id?: string;
  related_representation_id?: string;
}

export type LoadSignalType =
  | 'runtime_load' | 'telco_density' | 'movement_indicator' | 'stillness_indicator'
  | 'stay_candidate_indicator' | 'jam_candidate_indicator' | 'mixed_load' | 'unknown';

export type LoadAggregationUnit =
  | 'area_bucket' | 'grid_cell' | 'cell_area' | 'graph_segment_candidate'
  | 'poi_radius_candidate' | 'route_corridor_candidate' | 'unknown';

export type LoadIntendedUse =
  | 'stay_classification_input' | 'movement_load_input' | 'jam_indicator_input'
  | 'route_relevance_input' | 'quality_reference_only' | 'excluded';

export interface LoadSignalMetrics {
  signal_count: number;
  distinct_device_count?: number;
  density_score?: number;
  normalized_load_score?: number;
  movement_ratio?: number;
  stillness_ratio?: number;
  confidence_score?: number;
  sample_duration_seconds?: number;
}

export type LoadQualityLevel = 'high' | 'medium' | 'low' | 'unusable' | 'unknown';
export type AccuracyLevel = 'high' | 'medium' | 'low' | 'unknown';
export type CompletenessLevel = 'complete' | 'partial' | 'sparse' | 'unknown';

export interface LoadSignalQuality {
  quality_level: LoadQualityLevel;
  confidence_score: number;
  spatial_accuracy_level: AccuracyLevel;
  temporal_accuracy_level: AccuracyLevel;
  aggregation_completeness: CompletenessLevel;
  has_conflicts: boolean;
  conflict_reason?: string;
}

export interface LoadSignalPrivacyState {
  aggregation_verified: boolean;
  meets_min_distinct_devices: boolean;
  meets_min_signal_count: boolean;
  single_device_visibility_possible: false;
  raw_signal_payload_present: false;
  device_ids_present: false;
  exact_trace_present: false;
  sensus_core_safe: boolean;
  privacy_block_reason?: string;
}

export type LoadValidityStatus = 'fresh' | 'valid' | 'stale' | 'expired' | 'historical_only' | 'invalid';

export interface LoadSignalValidityState {
  validity_status: LoadValidityStatus;
  valid_until?: string;
  age_seconds?: number;
  decay_factor?: number;
  expired: boolean;
  stale: boolean;
  usable_for_runtime: boolean;
}

export interface LoadSignalGroup {
  signal_group_id: string;
  signal_type: LoadSignalType;
  aggregation_unit: LoadAggregationUnit;
  geometry_ref?: string;
  geometry?: GeoJsonGeometry;
  approximate_center?: GeoPoint;
  time_window: LoadTimeWindow;
  metrics: LoadSignalMetrics;
  quality: LoadSignalQuality;
  privacy: LoadSignalPrivacyState;
  validity: LoadSignalValidityState;
  intended_use: LoadIntendedUse[];
}

export type LoadAggregationType =
  | 'provider_pre_aggregated' | 'backend_aggregated' | 'runtime_aggregated' | 'mixed' | 'unknown';

export interface LoadAggregationLevel {
  aggregation_level_id: string;
  aggregation_type: LoadAggregationType;
  min_distinct_devices_observed?: number;
  min_signal_count_observed: number;
  aggregation_window_seconds: number;
  spatial_resolution_meters: number;
  stable_aggregate_duration_seconds?: number;
  pre_aggregated_by_provider: boolean;
}

export interface LoadSignalQualitySummary {
  overall_quality: LoadQualityLevel;
  valid_group_count: number;
  warning_group_count: number;
  invalid_group_count: number;
  expired_group_count: number;
  privacy_blocked_group_count: number;
  conflict_group_count: number;
}

export type ExpiredGroupBehavior = 'exclude' | 'historical_only' | 'warn_and_exclude';
export type StaleGroupBehavior = 'allow_with_warning' | 'apply_decay' | 'exclude' | 'quality_reference_only';

export interface LoadExpiryRules {
  max_validity_seconds: number;
  decay_supported: boolean;
  decay_half_life_seconds?: number;
  expired_group_behavior: ExpiredGroupBehavior;
  stale_group_behavior: StaleGroupBehavior;
}

export interface LoadPrivacyCheck {
  is_privacy_valid: boolean;
  checked_against_system_adjust_version: string;
  blocked_group_ids: string[];
  warning_group_ids: string[];
  raw_payload_detected: boolean;
  device_level_data_detected: boolean;
  exact_trace_detected: boolean;
  notes?: string[];
}

export interface TelcoLoadIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface TelcoLoadValidationResult {
  is_valid: boolean;
  errors: TelcoLoadIssue[];
  warnings: TelcoLoadIssue[];
  checked_at: string;
  checked_against_system_adjust_version: string;
  checked_against_regio_content_version?: string;
  checked_against_target_app_ui_version?: string;
}

export interface TelcoLoadState {
  telco_load_batch_id: string;
  source: TelcoLoadSource;
  loaded_at: string;
  provider?: TelcoProviderInfo;
  time_window: LoadTimeWindow;
  spatial_scope: LoadSpatialScope;
  // Transform Geometries — Phase 3
  short_interval_window_seconds: number;
  short_interval_enabled: boolean;
  load_signals: LoadSignalGroup[];
  aggregation_level: LoadAggregationLevel;
  signal_quality: LoadSignalQualitySummary;
  expiry_rules: LoadExpiryRules;
  privacy_check: LoadPrivacyCheck;
  validation: TelcoLoadValidationResult;
  status: TelcoLoadStatus;
}
