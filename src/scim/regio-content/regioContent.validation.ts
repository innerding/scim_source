import type {
  RegioContentState,
  RegioContentValidationResult,
  RegioContentIssue,
  RegioPoi,
  PoiRadius,
  RegionalParameters,
  RegionalRestriction,
} from './regioContent.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';

function err(code: string, message: string, field?: string, related_id?: string): RegioContentIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): RegioContentIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

function validatePoiAgainstSystemAdjust(
  poi: RegioPoi,
  sa: SystemAdjustState,
  issues: RegioContentIssue[],
): void {
  if (!poi.poi_id) issues.push(err('REGIO_APPROVED_POI_ID_MISSING', 'Approved POI is missing poi_id.', 'approved_pois'));
  if (!poi.center) issues.push(err('REGIO_APPROVED_POI_CENTER_MISSING', `POI ${poi.poi_id}: center is missing.`, 'approved_pois', poi.poi_id));
  if (poi.radius_meters === undefined || poi.radius_meters === null) {
    issues.push(err('REGIO_APPROVED_POI_RADIUS_MISSING', `POI ${poi.poi_id}: radius is missing.`, 'approved_pois', poi.poi_id));
  } else {
    const r = sa.allowed_ranges.poi_radius_meters;
    if (poi.radius_meters < r.min || poi.radius_meters > r.max) {
      issues.push(err('REGIO_POI_RADIUS_OUT_OF_RANGE', `POI ${poi.poi_id}: radius ${poi.radius_meters}m is outside [${r.min}, ${r.max}].`, 'approved_pois', poi.poi_id));
    }
    const min = r.min;
    if (poi.radius_meters < min + (r.max - r.min) * 0.05) {
      issues.push(warn('REGIO_POI_RADIUS_NEAR_MINIMUM', `POI ${poi.poi_id}: radius is near minimum.`, 'approved_pois', poi.poi_id));
    }
  }
}

function validatePoiRadii(
  approvedPois: RegioPoi[],
  poiRadii: PoiRadius[],
  sa: SystemAdjustState,
  issues: RegioContentIssue[],
): void {
  const radiiMap = new Map(poiRadii.map((r) => [r.poi_id, r]));
  for (const poi of approvedPois) {
    const radius = radiiMap.get(poi.poi_id);
    if (!radius) {
      issues.push(err('REGIO_POI_RADIUS_NOT_CONFIRMED', `POI ${poi.poi_id} has no confirmed radius entry.`, 'poi_radii', poi.poi_id));
      continue;
    }
    if (radius.radius_status !== 'confirmed') {
      issues.push(err('REGIO_POI_RADIUS_NOT_CONFIRMED', `POI ${poi.poi_id}: radius_status is '${radius.radius_status}', must be 'confirmed'.`, 'poi_radii', poi.poi_id));
    }
    const cm = sa.allowed_ranges.comparison_margin_meters;
    if (radius.comparison_margin_meters < cm.min || radius.comparison_margin_meters > cm.max) {
      issues.push(err('REGIO_COMPARISON_MARGIN_OUT_OF_RANGE', `POI ${poi.poi_id}: comparison margin ${radius.comparison_margin_meters}m outside [${cm.min}, ${cm.max}].`, 'poi_radii', poi.poi_id));
    }
    const expected = radius.radius_meters + radius.comparison_margin_meters;
    if (radius.effective_comparison_radius_meters !== expected) {
      issues.push(err('REGIO_EFFECTIVE_COMPARISON_RADIUS_INVALID', `POI ${poi.poi_id}: effective comparison radius ${radius.effective_comparison_radius_meters} != ${expected}.`, 'poi_radii', poi.poi_id));
    }
  }
}

function validateRegionalParameters(
  params: RegionalParameters,
  sa: SystemAdjustState,
  issues: RegioContentIssue[],
): void {
  const r = sa.allowed_ranges;
  const checks: [number, { min: number; max: number }, string][] = [
    [params.comparison_margin_meters, r.comparison_margin_meters, 'regional_parameters.comparison_margin_meters'],
    [params.stay_density_ratio, r.stay_density_ratio, 'regional_parameters.stay_density_ratio'],
    [params.movement_load_threshold, r.movement_load_threshold, 'regional_parameters.movement_load_threshold'],
    [params.stay_load_threshold, r.stay_load_threshold, 'regional_parameters.stay_load_threshold'],
    [params.route_degrade_threshold, r.route_degrade_threshold, 'regional_parameters.route_degrade_threshold'],
    [params.route_exclude_threshold, r.route_exclude_threshold, 'regional_parameters.route_exclude_threshold'],
  ];
  if (params.signal_validity_seconds !== undefined) {
    checks.push([params.signal_validity_seconds, r.signal_validity_seconds, 'regional_parameters.signal_validity_seconds']);
  }
  if (params.smoothing_strength !== undefined) {
    checks.push([params.smoothing_strength, r.smoothing_strength, 'regional_parameters.smoothing_strength']);
  }
  if (params.edge_weight_factor !== undefined) {
    checks.push([params.edge_weight_factor, r.edge_weight_factor, 'regional_parameters.edge_weight_factor']);
  }

  for (const [value, range, field] of checks) {
    if (value < range.min || value > range.max) {
      issues.push(err('REGIO_PARAMETER_OUT_OF_RANGE', `${field} value ${value} is outside [${range.min}, ${range.max}].`, field));
    }
  }

  if (params.route_degrade_threshold > params.route_exclude_threshold) {
    issues.push(err('REGIO_DEGRADE_EXCEEDS_EXCLUDE', 'route_degrade_threshold must be <= route_exclude_threshold.', 'regional_parameters'));
  }

  if (params.aggregation_window_seconds !== undefined) {
    const al = sa.aggregation_limits;
    if (params.aggregation_window_seconds < al.min_time_window_seconds) {
      issues.push(err('REGIO_AGGREGATION_UNDERCUTS_SYSTEM_LIMIT', `aggregation_window_seconds ${params.aggregation_window_seconds} < system min ${al.min_time_window_seconds}.`, 'regional_parameters.aggregation_window_seconds'));
    }
  }
}

function validateRestrictions(
  restrictions: RegionalRestriction[],
  issues: RegioContentIssue[],
): void {
  for (const r of restrictions) {
    if (!r.restriction_id) {
      issues.push(err('REGIO_RESTRICTION_ID_MISSING', 'Restriction is missing restriction_id.', 'regional_restrictions'));
    }
    if (!r.geometry) {
      issues.push(err('REGIO_RESTRICTION_GEOMETRY_MISSING', `Restriction ${r.restriction_id}: geometry is missing.`, 'regional_restrictions', r.restriction_id));
    }
    // Expired active route exclusions
    if (r.valid_until && new Date(r.valid_until) < new Date() && r.route_effect === 'exclude' && r.status === 'approved') {
      issues.push(err('REGIO_EXPIRED_RESTRICTION_ACTIVE', `Restriction ${r.restriction_id} is expired but still active as route exclusion.`, 'regional_restrictions', r.restriction_id));
    }
    // Operator-only content visible in Sensus Core
    if (r.display_effect !== 'operator_only' && r.display_effect !== 'hidden' && r.source === 'operator' && r.status === 'draft') {
      issues.push(warn('REGIO_OPERATOR_ONLY_VISIBLE_IN_SENSUS_CORE', `Restriction ${r.restriction_id} is draft but may be sensus_core visible.`, 'regional_restrictions', r.restriction_id));
    }
  }
}

export function validateRegioContent(
  state: RegioContentState,
  systemAdjust: SystemAdjustState | undefined,
): RegioContentValidationResult {
  const errors: RegioContentIssue[] = [];
  const warnings: RegioContentIssue[] = [];

  // System-Adjust check
  if (!systemAdjust) {
    errors.push(err('REGIO_SYSTEM_ADJUST_MISSING', 'System-Adjust is missing.', 'system_adjust'));
  } else if (systemAdjust.status !== 'system_adjust_valid' && systemAdjust.status !== 'system_adjust_warning') {
    errors.push(err('REGIO_SYSTEM_ADJUST_INVALID', `System-Adjust status is '${systemAdjust.status}', must be valid or warning.`, 'system_adjust'));
  }

  // Version and region
  if (!state.regio_content_version) {
    errors.push(err('REGIO_VERSION_MISSING', 'regio_content_version is missing.', 'regio_content_version'));
  }
  if (!state.region?.region_id) errors.push(err('REGIO_REGION_ID_MISSING', 'region.region_id is missing.', 'region.region_id'));
  if (!state.region?.region_name) errors.push(err('REGIO_REGION_NAME_MISSING', 'region.region_name is missing.', 'region.region_name'));
  if (!state.region?.region_type) errors.push(err('REGIO_REGION_TYPE_MISSING', 'region.region_type is missing.', 'region.region_type'));

  if (systemAdjust && systemAdjust.status !== 'system_adjust_invalid') {
    // POI validation
    const approvedIds = new Set(state.approved_pois.map((p) => p.poi_id));
    for (const poi of state.approved_pois) {
      validatePoiAgainstSystemAdjust(poi, systemAdjust, errors);
    }

    // Rejected duplicate check
    for (const rp of state.rejected_pois) {
      if (!rp.rejected_reason) errors.push(err('REGIO_REJECTED_REASON_MISSING', `RejectedPoi ${rp.poi_id}: rejected_reason is missing.`, 'rejected_pois', rp.poi_id));
      if (approvedIds.has(rp.poi_id)) {
        errors.push(err('REGIO_REJECTED_POI_DUPLICATE_WITH_APPROVED', `POI ${rp.poi_id} appears in both rejected and approved lists.`, 'rejected_pois', rp.poi_id));
      }
    }

    // Pending POI validation
    for (const pp of state.pending_pois) {
      if ((pp as unknown as { status?: string }).status === 'approved') {
        errors.push(err('REGIO_PENDING_POI_ACTIVE_FORBIDDEN', `PendingPoi ${pp.poi_id} has status 'approved' — pending POIs must not be active.`, 'pending_pois', pp.poi_id));
      }
    }

    // POI radii
    validatePoiRadii(state.approved_pois, state.poi_radii, systemAdjust, errors);

    // Regional parameters
    if (!state.regional_parameters) {
      errors.push(err('REGIO_REGIONAL_PARAMETERS_MISSING', 'regional_parameters is missing.', 'regional_parameters'));
    } else {
      validateRegionalParameters(state.regional_parameters, systemAdjust, errors);
    }
  }

  // Restrictions
  validateRestrictions(state.regional_restrictions, errors);

  // Warnings for pending pois
  if (state.pending_pois.length > 0) {
    warnings.push(warn('REGIO_PENDING_POIS_EXIST', `${state.pending_pois.length} pending POI(s) are awaiting review.`, 'pending_pois'));
  }
  if (state.rejected_pois.length > 5) {
    warnings.push(warn('REGIO_MANY_REJECTED_POIS', `${state.rejected_pois.length} rejected POIs — review may be needed.`, 'rejected_pois'));
  }

  // Release validation
  if (!state.release || state.release.release_status !== 'released') {
    errors.push(err('REGIO_RELEASE_NOT_RELEASED', `release_status is '${state.release?.release_status}', must be 'released' for runtime use.`, 'release'));
  } else if (state.release.blocks_runtime_use) {
    errors.push(err('REGIO_RELEASE_BLOCKS_RUNTIME', 'Release blocks runtime use.', 'release'));
  } else if (!state.release.released_at) {
    errors.push(err('REGIO_RELEASE_TIMESTAMP_MISSING', 'released_at is missing on a released release.', 'release.released_at'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
  };
}
