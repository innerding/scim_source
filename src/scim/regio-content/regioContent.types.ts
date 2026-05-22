import type { GeoJsonGeometry, GeoPoint } from '../context/scimContext.types';

export type RegioContentSource = 'path_works_regio_dashboard' | 'mock' | 'local_json' | 'api';

export type RegioContentStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'regio_content_valid'
  | 'regio_content_invalid'
  | 'regio_content_warning'
  | 'regio_content_draft'
  | 'regio_content_error';

export type RouteExceedanceBehavior = 'warn' | 'degrade' | 'exclude' | 'profile_dependent';

export type FallbackRoutePolicy =
  | 'allow_degraded_if_no_alternative'
  | 'block_if_threshold_exceeded'
  | 'warn_and_allow'
  | 'profile_dependent';

export interface RegioRegion {
  region_id: string;
  region_name: string;
  region_type: 'admin_area' | 'park' | 'trail_area' | 'custom_region' | 'representation_area';
  country_code?: string;
  admin_code?: string;
  default_language?: string;
  timezone?: string;
  region_geometry?: GeoJsonGeometry;
  bbox?: [number, number, number, number];
}

export type PoiSource = 'osm' | 'manual' | 'import' | 'regional_dataset' | 'system_suggestion';

export type PoiCandidateClass = 'safe_relevant' | 'possibly_relevant' | 'manual' | 'unknown';

export type PoiApprovalStatus = 'candidate' | 'approved' | 'rejected' | 'pending_review' | 'disabled';

export type PoiVisibility = 'operator_only' | 'scim_active' | 'sensus_core_visible' | 'hidden';

export type RegioPoiCategory =
  | 'alpine_hut' | 'wilderness_hut' | 'picnic_site' | 'viewpoint' | 'shelter'
  | 'restaurant' | 'cafe' | 'drinking_water' | 'toilets' | 'peak' | 'waterfall'
  | 'parking' | 'public_transport' | 'aerialway_station' | 'information' | 'shop'
  | 'wayside_cross' | 'tower' | 'spring' | 'cave_entrance' | 'manual_other';

export interface RegioPoi {
  poi_id: string;
  source_poi_id?: string;
  source: PoiSource;
  name?: string;
  category: RegioPoiCategory;
  candidate_class: PoiCandidateClass;
  status: PoiApprovalStatus;
  center: GeoPoint;
  radius_meters: number;
  comparison_margin_meters?: number;
  effective_comparison_radius_meters?: number;
  visibility: PoiVisibility;
  valid_from?: string;
  valid_until?: string;
  operator_note?: string;
  approved_by?: string;
  approved_at?: string;
  system_adjust_version: string;
}

export type RejectedPoiReason =
  | 'not_stay_relevant' | 'duplicate' | 'wrong_location'
  | 'unsafe_source' | 'temporary_not_relevant' | 'other';

export interface RejectedPoi {
  poi_id: string;
  source_poi_id?: string;
  source: PoiSource;
  name?: string;
  category?: RegioPoiCategory;
  center?: GeoPoint;
  rejected_reason: RejectedPoiReason;
  rejected_by?: string;
  rejected_at?: string;
  operator_note?: string;
}

export interface PendingPoi {
  poi_id: string;
  source_poi_id?: string;
  source: PoiSource;
  name?: string;
  category?: RegioPoiCategory;
  candidate_class: PoiCandidateClass;
  center: GeoPoint;
  suggested_radius_meters?: number;
  suggested_comparison_margin_meters?: number;
  review_reason?: string;
  created_at?: string;
}

export type RadiusSource = 'system_default' | 'category_default' | 'operator_adjusted' | 'regional_template' | 'manual';

export type RadiusStatus = 'suggested' | 'confirmed' | 'needs_review' | 'invalid';

export interface PoiRadius {
  poi_id: string;
  radius_meters: number;
  radius_source: RadiusSource;
  radius_status: RadiusStatus;
  comparison_margin_meters: number;
  effective_comparison_radius_meters: number;
  min_allowed_radius_meters: number;
  max_allowed_radius_meters: number;
  system_adjust_version: string;
  updated_by?: string;
  updated_at?: string;
}

export interface RegionalRouteProfile {
  profile_id: string;
  label: string;
  description?: string;
  movement_load_threshold?: number;
  stay_load_threshold?: number;
  route_degrade_threshold?: number;
  route_exclude_threshold?: number;
  route_exceedance_behavior?: RouteExceedanceBehavior;
  enabled: boolean;
}

export interface RegionalParameters {
  parameter_version: string;
  comparison_margin_meters: number;
  stay_density_ratio: number;
  movement_load_threshold: number;
  stay_load_threshold: number;
  route_degrade_threshold: number;
  route_exclude_threshold: number;
  route_exceedance_behavior: RouteExceedanceBehavior;
  signal_validity_seconds?: number;
  aggregation_window_seconds?: number;
  smoothing_strength?: number;
  edge_weight_factor?: number;
  fallback_route_policy: FallbackRoutePolicy;
  route_profiles: RegionalRouteProfile[];
  system_adjust_version: string;
}

export type RegionalRestrictionType =
  | 'closure' | 'seasonal_closure' | 'hazard' | 'construction'
  | 'warning' | 'local_note' | 'jam_indicator_review' | 'operator_note';

export type RestrictionSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type RestrictionRouteEffect = 'none' | 'warn' | 'degrade' | 'exclude';

export type RestrictionDisplayEffect = 'operator_only' | 'sensus_core_hint' | 'sensus_core_warning' | 'hidden';

export type RestrictionSource = 'operator' | 'regional_import' | 'external_dataset' | 'system_suggestion';

export type RestrictionStatus = 'draft' | 'approved' | 'expired' | 'disabled' | 'needs_review';

export interface RegionalRestriction {
  restriction_id: string;
  type: RegionalRestrictionType;
  geometry: GeoJsonGeometry;
  label?: string;
  description?: string;
  severity: RestrictionSeverity;
  route_effect: RestrictionRouteEffect;
  display_effect: RestrictionDisplayEffect;
  valid_from?: string;
  valid_until?: string;
  source: RestrictionSource;
  status: RestrictionStatus;
  approved_by?: string;
  approved_at?: string;
}

export interface RegionalWarning {
  warning_id: string;
  type: 'parameter_warning' | 'poi_warning' | 'restriction_warning' | 'release_warning';
  severity: 'info' | 'warning';
  message: string;
  field?: string;
  related_id?: string;
}

export type RegioReleaseStatus = 'draft' | 'in_review' | 'released' | 'rejected' | 'archived';

export interface RegioReleaseState {
  release_status: RegioReleaseStatus;
  release_id?: string;
  released_by?: string;
  released_at?: string;
  draft_id?: string;
  previous_release_id?: string;
  changelog?: string;
  blocks_runtime_use: boolean;
}

export interface RegioContentIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface RegioContentValidationResult {
  is_valid: boolean;
  errors: RegioContentIssue[];
  warnings: RegioContentIssue[];
  checked_at: string;
  checked_against_system_adjust_version: string;
}

export interface RegioContentState {
  regio_content_version: string;
  source: RegioContentSource;
  loaded_at: string;
  region: RegioRegion;
  approved_pois: RegioPoi[];
  rejected_pois: RejectedPoi[];
  pending_pois: PendingPoi[];
  poi_radii: PoiRadius[];
  regional_parameters: RegionalParameters;
  regional_restrictions: RegionalRestriction[];
  regional_warnings: RegionalWarning[];
  release: RegioReleaseState;
  validation: RegioContentValidationResult;
  status: RegioContentStatus;
}
