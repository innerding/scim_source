import type { NumericRange } from '../context/scimContext.types';

export type SystemAdjustSource = 'scim3_atlas_console' | 'mock' | 'local_json' | 'api';

export type SystemAdjustStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'system_adjust_valid'
  | 'system_adjust_invalid'
  | 'system_adjust_warning'
  | 'system_adjust_error';

export type RouteExceedanceBehavior = 'warn' | 'degrade' | 'exclude' | 'profile_dependent';

export interface PrivacyLimits {
  min_distinct_devices_per_visible_aggregate: number;
  min_signals_per_visible_aggregate: number;
  min_signals_per_route_relevance: number;
  min_signals_for_stay_classification: number;
  min_signals_for_movement_load: number;
  min_aggregation_window_seconds: number;
  max_raw_signal_validity_seconds: number;
  max_raw_signal_storage_seconds: number;
  max_aggregated_signal_storage_seconds: number;
  spatial_min_resolution_meters: number;
  min_visible_edge_length_meters: number;
  min_visible_stay_area_radius_meters: number;
  allow_single_device_visibility: false;
  allow_raw_signals_in_operator_ui: boolean;
  allow_raw_signals_in_sensus_core: false;
  allow_debug_data_in_sensus_core: false;
}

export interface AggregationLimits {
  min_time_window_seconds: number;
  max_time_window_seconds: number;
  default_time_window_seconds: number;
  min_distinct_devices: number;
  min_signal_count: number;
  min_stable_aggregate_duration_seconds: number;
  decay_supported: boolean;
  default_decay_half_life_seconds?: number;
}

export interface AllowedRanges {
  poi_radius_meters: NumericRange;
  comparison_margin_meters: NumericRange;
  boundary_buffer_meters: NumericRange;
  stay_density_ratio: NumericRange;
  movement_load_threshold: NumericRange;
  stay_load_threshold: NumericRange;
  route_degrade_threshold: NumericRange;
  route_exclude_threshold: NumericRange;
  signal_validity_seconds: NumericRange;
  smoothing_strength: NumericRange;
  edge_weight_factor: NumericRange;
  // Transform Geometries — Phase 2
  density_threshold_persons_per_sqm: NumericRange;
  measurement_interval_seconds: NumericRange;
  slowdown_threshold_ratio: NumericRange;
  standstill_threshold_ms: NumericRange;
  min_standstill_duration_seconds: NumericRange;
  min_throughput_ratio_for_rast: NumericRange;
  min_compactness_ratio: NumericRange;
  min_observation_window_seconds: NumericRange;
  max_jam_throughput_ratio: NumericRange;
}

export interface DefaultParameters {
  default_poi_radius_meters: number;
  default_comparison_margin_meters: number;
  default_stay_density_ratio: number;
  default_movement_load_threshold: number;
  default_stay_load_threshold: number;
  default_route_degrade_threshold: number;
  default_route_exclude_threshold: number;
  default_signal_validity_seconds: number;
  default_decay_half_life_seconds?: number;
  default_smoothing_strength: number;
  default_edge_weight_factor: number;
  route_exceedance_default_behavior: RouteExceedanceBehavior;
  // Transform Geometries — Phase 2
  default_density_threshold_persons_per_sqm: number;
  default_measurement_interval_seconds: number;
  default_slowdown_threshold_ratio: number;
  default_standstill_threshold_ms: number;
  default_min_standstill_duration_seconds: number;
  default_min_throughput_ratio_for_rast: number;
  default_min_compactness_ratio: number;
  default_min_observation_window_seconds: number;
  default_max_jam_throughput_ratio: number;
}

export interface RuleVersions {
  system_rules: string;
  privacy_rules: string;
  aggregation_rules: string;
  poi_candidate_rules: string;
  stay_classification_rules: string;
  movement_classification_rules: string;
  route_evaluation_rules: string;
  layer_reduction_rules: string;
  sensus_core_export_rules: string;
}

export interface SystemFeatureFlags {
  enable_poi_candidate_suggestions: boolean;
  enable_stay_classification: boolean;
  enable_movement_load: boolean;
  enable_route_evaluation: boolean;
  enable_jam_indicators: boolean;
  enable_leaflet_debug_layers: boolean;
  enable_sensus_core_export: boolean;
  enable_local_user_tolerances: boolean;
  // Transform Geometries — Phase 2
  enable_stay_zone_detection: boolean;
  enable_step2_classification: boolean;
}

export interface SystemAdjustIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface SystemAdjustValidationResult {
  is_valid: boolean;
  errors: SystemAdjustIssue[];
  warnings: SystemAdjustIssue[];
  checked_at: string;
}

export interface SystemAdjustState {
  system_adjust_version: string;
  source: SystemAdjustSource;
  loaded_at: string;
  privacy_limits: PrivacyLimits;
  aggregation_limits: AggregationLimits;
  allowed_ranges: AllowedRanges;
  default_parameters: DefaultParameters;
  rule_versions: RuleVersions;
  feature_flags: SystemFeatureFlags;
  validation: SystemAdjustValidationResult;
  status: SystemAdjustStatus;
}
