import type { AllowedRanges, SystemFeatureFlags } from '../system-adjust/systemAdjust.types';

export type TargetAppUiSource = 'sensus_core_config' | 'target_app_config' | 'mock' | 'local_json' | 'api';

export type TargetAppUiStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'target_app_ui_valid'
  | 'target_app_ui_invalid'
  | 'target_app_ui_warning'
  | 'target_app_ui_draft'
  | 'target_app_ui_error';

export type RouteExceedanceBehavior = 'warn' | 'degrade' | 'exclude' | 'profile_dependent';

export interface TargetAppProfile {
  profile_id: string;
  profile_name: string;
  app_family: 'sensus_core' | 'sensus_core_child' | 'custom_target_app';
  audience: 'public_user' | 'guided_user' | 'operator_preview' | 'restricted_test_user';
  default_language?: string;
  supported_languages?: string[];
  map_mode: 'leaflet_view' | 'native_map_view' | 'hybrid';
  offline_supported: boolean;
  requires_released_regio_content: boolean;
  requires_released_system_adjust: boolean;
}

export type TargetAppLayerType =
  | 'movement_load' | 'stay_density' | 'approved_pois' | 'stay_areas_reduced'
  | 'route_options' | 'route_warnings' | 'regional_restrictions' | 'jam_indicators'
  | 'base_paths' | 'debug_graph' | 'raw_signals';

export type LayerVisibility = 'sensus_core_visible' | 'operator_preview_only' | 'debug_only' | 'hidden';

export type LayerDataClass =
  | 'public_aggregate'
  | 'reduced_scim_result'
  | 'operator_internal'
  | 'debug'
  | 'raw_signal'
  | 'forbidden_for_sensus_core';

export interface VisibleLayerConfig {
  layer_id: string;
  layer_type: TargetAppLayerType;
  label: string;
  enabled_by_default: boolean;
  user_toggle_allowed: boolean;
  min_zoom?: number;
  max_zoom?: number;
  visibility: LayerVisibility;
  data_class: LayerDataClass;
  reduction_required: boolean;
  depends_on_feature_flag?: keyof SystemFeatureFlags;
  requires_regio_release?: boolean;
}

export type RoutePriority = 'fastest' | 'shortest' | 'low_load' | 'quiet' | 'balanced' | 'fallback';

export interface RouteModeConfig {
  route_mode_id: string;
  label: string;
  description?: string;
  enabled: boolean;
  default_selected: boolean;
  route_priority: RoutePriority;
  allowed_exceedance_behavior: RouteExceedanceBehavior[];
  user_selectable: boolean;
  depends_on_regional_profile_id?: string;
}

export type UserControlType =
  | 'route_mode_select' | 'movement_tolerance_slider' | 'stay_tolerance_slider'
  | 'display_intensity_slider' | 'warnings_toggle' | 'layer_toggle' | 'fallback_routes_toggle';

export type UserControlEffect =
  | 'route_filtering' | 'route_sorting' | 'map_visibility' | 'warning_visibility' | 'display_intensity' | 'none';

export interface UserControlConfig {
  control_id: string;
  control_type: UserControlType;
  label: string;
  enabled: boolean;
  default_value: number | string | boolean;
  min_value?: number;
  max_value?: number;
  step?: number;
  unit?: string;
  system_range_key?: keyof AllowedRanges;
  affects: UserControlEffect[];
  local_only: boolean;
}

export type TargetAppWarningType =
  | 'high_movement_load' | 'high_stay_density' | 'degraded_route_section'
  | 'excluded_route_section' | 'regional_restriction' | 'no_low_load_alternative'
  | 'data_quality_low' | 'stale_data' | 'privacy_reduction_active';

export interface WarningTrigger {
  source: 'route_model' | 'load_model' | 'regio_content' | 'system_status' | 'package_builder';
  field: string;
  operator: 'equals' | 'not_equals' | 'gte' | 'lte' | 'exists';
  value?: string | number | boolean;
}

export type WarningDisplayMode = 'inline_route_hint' | 'map_badge' | 'modal' | 'toast' | 'hidden';

export interface WarningRuleConfig {
  warning_rule_id: string;
  warning_type: TargetAppWarningType;
  enabled: boolean;
  severity: 'info' | 'warning' | 'critical';
  trigger: WarningTrigger;
  user_dismissible: boolean;
  display_mode: WarningDisplayMode;
  message_key: string;
}

export interface ReductionProfile {
  profile_id: string;
  remove_raw_signals: true;
  remove_debug_data: true;
  remove_operator_notes: boolean;
  remove_internal_ids: boolean;
  aggregate_scores_to_classes: boolean;
  score_class_count?: number;
  hide_exact_signal_counts: boolean;
  hide_device_counts: true;
  round_coordinates: boolean;
  coordinate_precision?: number;
  simplify_geometries: boolean;
  max_geometry_detail?: 'low' | 'medium' | 'high';
  allowed_output_data_classes: LayerDataClass[];
}

export type TargetAppUiReleaseStatus = 'draft' | 'in_review' | 'released' | 'rejected' | 'archived';

export interface TargetAppUiReleaseState {
  release_status: TargetAppUiReleaseStatus;
  release_id?: string;
  released_by?: string;
  released_at?: string;
  draft_id?: string;
  previous_release_id?: string;
  changelog?: string;
  blocks_runtime_use: boolean;
}

export interface TargetAppUiIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface TargetAppUiValidationResult {
  is_valid: boolean;
  errors: TargetAppUiIssue[];
  warnings: TargetAppUiIssue[];
  checked_at: string;
  checked_against_system_adjust_version: string;
  checked_against_regio_content_version?: string;
}

export interface TargetAppUiState {
  target_app_ui_version: string;
  source: TargetAppUiSource;
  loaded_at: string;
  app_profile: TargetAppProfile;
  visible_layers: VisibleLayerConfig[];
  available_route_modes: RouteModeConfig[];
  allowed_user_controls: UserControlConfig[];
  warning_rules: WarningRuleConfig[];
  reduction_profile: ReductionProfile;
  release: TargetAppUiReleaseState;
  validation: TargetAppUiValidationResult;
  status: TargetAppUiStatus;
}
