import type {
  SystemAdjustState,
  SystemAdjustValidationResult,
  SystemAdjustIssue,
  AllowedRanges,
} from './systemAdjust.types';
import { ALL_GRAPH_EDGE_TYPES } from './systemAdjust.types';
import type { NumericRange } from '../context/scimContext.types';

function err(code: string, field: string, message: string): SystemAdjustIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, field: string, message: string): SystemAdjustIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

function inRange(value: number, range: NumericRange): boolean {
  return value >= range.min && value <= range.max;
}

export function validateSystemAdjust(state: SystemAdjustState): SystemAdjustValidationResult {
  const errors: SystemAdjustIssue[] = [];
  const warnings: SystemAdjustIssue[] = [];

  // Version
  if (!state.system_adjust_version) {
    errors.push(err('SYSADJ_VERSION_MISSING', 'system_adjust_version', 'System-Adjust version is missing.'));
  }

  // Privacy limits present
  if (!state.privacy_limits) {
    errors.push(err('SYSADJ_PRIVACY_LIMITS_MISSING', 'privacy_limits', 'Privacy limits are missing.'));
  } else {
    const p = state.privacy_limits;
    if ((p.allow_single_device_visibility as unknown as boolean) !== false) {
      errors.push(err('SYSADJ_SINGLE_DEVICE_VISIBILITY_FORBIDDEN', 'privacy_limits.allow_single_device_visibility', 'Single device visibility must be false.'));
    }
    if ((p.allow_raw_signals_in_sensus_core as unknown as boolean) !== false) {
      errors.push(err('SYSADJ_RAW_SIGNALS_IN_SENSUS_CORE_FORBIDDEN', 'privacy_limits.allow_raw_signals_in_sensus_core', 'Raw signals in Sensus Core must be false.'));
    }
    if ((p.allow_debug_data_in_sensus_core as unknown as boolean) !== false) {
      errors.push(err('SYSADJ_DEBUG_IN_SENSUS_CORE_FORBIDDEN', 'privacy_limits.allow_debug_data_in_sensus_core', 'Debug data in Sensus Core must be false.'));
    }
    if (p.min_distinct_devices_per_visible_aggregate < 2) {
      errors.push(err('SYSADJ_PRIVACY_MINIMUM_TOO_LOW', 'privacy_limits.min_distinct_devices_per_visible_aggregate', 'Minimum distinct devices must be at least 2.'));
    }
    if (p.min_signals_per_visible_aggregate < 2) {
      errors.push(err('SYSADJ_PRIVACY_MINIMUM_TOO_LOW', 'privacy_limits.min_signals_per_visible_aggregate', 'Minimum signals per aggregate must be at least 2.'));
    }
    if (p.max_raw_signal_validity_seconds <= 0) {
      errors.push(err('SYSADJ_INVALID_RANGE', 'privacy_limits.max_raw_signal_validity_seconds', 'Max raw signal validity must be > 0.'));
    }
    if (p.max_raw_signal_storage_seconds < 0) {
      errors.push(err('SYSADJ_INVALID_RANGE', 'privacy_limits.max_raw_signal_storage_seconds', 'Max raw signal storage must be >= 0.'));
    }
    if (p.spatial_min_resolution_meters <= 0) {
      errors.push(err('SYSADJ_INVALID_RANGE', 'privacy_limits.spatial_min_resolution_meters', 'Spatial min resolution must be > 0.'));
    }
    // Warnings
    if (p.min_distinct_devices_per_visible_aggregate < 5) {
      warnings.push(warn('SYSADJ_LOW_PRIVACY_MARGIN', 'privacy_limits.min_distinct_devices_per_visible_aggregate', 'Low minimum distinct devices — consider increasing before production.'));
    }
    if (p.min_signals_per_visible_aggregate < 10) {
      warnings.push(warn('SYSADJ_LOW_PRIVACY_MARGIN', 'privacy_limits.min_signals_per_visible_aggregate', 'Low minimum signals per aggregate — consider increasing before production.'));
    }
    if (p.max_raw_signal_storage_seconds > 3600) {
      warnings.push(warn('SYSADJ_LONG_RAW_SIGNAL_STORAGE', 'privacy_limits.max_raw_signal_storage_seconds', 'Raw signal storage exceeds 1 hour.'));
    }
  }

  // Aggregation limits
  if (!state.aggregation_limits) {
    errors.push(err('SYSADJ_AGGREGATION_LIMITS_MISSING', 'aggregation_limits', 'Aggregation limits are missing.'));
  } else {
    const a = state.aggregation_limits;
    if (a.min_time_window_seconds <= 0) {
      errors.push(err('SYSADJ_INVALID_RANGE', 'aggregation_limits.min_time_window_seconds', 'Min time window must be > 0.'));
    }
    if (a.max_time_window_seconds < a.min_time_window_seconds) {
      errors.push(err('SYSADJ_INVALID_RANGE', 'aggregation_limits.max_time_window_seconds', 'Max time window must be >= min time window.'));
    }
    if (a.default_time_window_seconds < a.min_time_window_seconds || a.default_time_window_seconds > a.max_time_window_seconds) {
      errors.push(err('SYSADJ_DEFAULT_OUT_OF_RANGE', 'aggregation_limits.default_time_window_seconds', 'Default time window must be within min/max.'));
    }
    if (state.privacy_limits && a.min_distinct_devices < state.privacy_limits.min_distinct_devices_per_visible_aggregate) {
      errors.push(err('SYSADJ_PRIVACY_MINIMUM_TOO_LOW', 'aggregation_limits.min_distinct_devices', 'Aggregation min distinct devices must be >= privacy minimum.'));
    }
    if (state.privacy_limits && a.min_signal_count < state.privacy_limits.min_signals_per_visible_aggregate) {
      errors.push(err('SYSADJ_PRIVACY_MINIMUM_TOO_LOW', 'aggregation_limits.min_signal_count', 'Aggregation min signal count must be >= privacy minimum.'));
    }
  }

  // Allowed ranges
  if (!state.allowed_ranges) {
    errors.push(err('SYSADJ_ALLOWED_RANGES_MISSING', 'allowed_ranges', 'Allowed ranges are missing.'));
  } else {
    for (const [key, range] of Object.entries(state.allowed_ranges) as [keyof AllowedRanges, NumericRange][]) {
      if (range.min > range.max) {
        errors.push(err('SYSADJ_INVALID_RANGE', `allowed_ranges.${key}`, `Range ${key} has min > max.`));
      }
    }
    const r = state.allowed_ranges;
    if (r.poi_radius_meters.max > 1000) {
      warnings.push(warn('SYSADJ_LARGE_POI_RADIUS_RANGE', 'allowed_ranges.poi_radius_meters', 'POI radius max is unusually large.'));
    }
  }

  // Default parameters
  if (!state.default_parameters) {
    errors.push(err('SYSADJ_DEFAULTS_MISSING', 'default_parameters', 'Default parameters are missing.'));
  } else {
    const d = state.default_parameters;
    const r = state.allowed_ranges;

    if (r) {
      const checks: [number, NumericRange, string][] = [
        [d.default_poi_radius_meters, r.poi_radius_meters, 'default_poi_radius_meters'],
        [d.default_comparison_margin_meters, r.comparison_margin_meters, 'default_comparison_margin_meters'],
        [d.default_stay_density_ratio, r.stay_density_ratio, 'default_stay_density_ratio'],
        [d.default_movement_load_threshold, r.movement_load_threshold, 'default_movement_load_threshold'],
        [d.default_stay_load_threshold, r.stay_load_threshold, 'default_stay_load_threshold'],
        [d.default_route_degrade_threshold, r.route_degrade_threshold, 'default_route_degrade_threshold'],
        [d.default_route_exclude_threshold, r.route_exclude_threshold, 'default_route_exclude_threshold'],
        [d.default_signal_validity_seconds, r.signal_validity_seconds, 'default_signal_validity_seconds'],
        [d.default_smoothing_strength, r.smoothing_strength, 'default_smoothing_strength'],
        [d.default_edge_weight_factor, r.edge_weight_factor, 'default_edge_weight_factor'],
        [d.default_density_threshold_persons_per_sqm, r.density_threshold_persons_per_sqm, 'default_density_threshold_persons_per_sqm'],
        [d.default_measurement_interval_seconds, r.measurement_interval_seconds, 'default_measurement_interval_seconds'],
        [d.default_slowdown_threshold_ratio, r.slowdown_threshold_ratio, 'default_slowdown_threshold_ratio'],
        [d.default_standstill_threshold_ms, r.standstill_threshold_ms, 'default_standstill_threshold_ms'],
        [d.default_min_standstill_duration_seconds, r.min_standstill_duration_seconds, 'default_min_standstill_duration_seconds'],
        [d.default_min_throughput_ratio_for_rast, r.min_throughput_ratio_for_rast, 'default_min_throughput_ratio_for_rast'],
        [d.default_min_compactness_ratio, r.min_compactness_ratio, 'default_min_compactness_ratio'],
        [d.default_min_observation_window_seconds, r.min_observation_window_seconds, 'default_min_observation_window_seconds'],
        [d.default_max_jam_throughput_ratio, r.max_jam_throughput_ratio, 'default_max_jam_throughput_ratio'],
      ];
      for (const [value, range, field] of checks) {
        if (!inRange(value, range)) {
          errors.push(err('SYSADJ_DEFAULT_OUT_OF_RANGE', `default_parameters.${field}`, `Default ${field} (${value}) is outside allowed range [${range.min}, ${range.max}].`));
        }
      }
    }

    if (d.default_route_degrade_threshold > d.default_route_exclude_threshold) {
      errors.push(err('SYSADJ_DEGRADE_EXCEEDS_EXCLUDE', 'default_parameters', 'Route degrade threshold must be <= route exclude threshold.'));
    }

    if (d.default_max_jam_throughput_ratio >= d.default_min_throughput_ratio_for_rast) {
      errors.push(err('SYSADJ_JAM_THRESHOLD_EXCEEDS_RAST', 'default_parameters', 'max_jam_throughput_ratio must be < min_throughput_ratio_for_rast (Stau threshold below Rast threshold).'));
    }

    if (d.default_comparison_margin_meters === 0) {
      warnings.push(warn('SYSADJ_ZERO_COMPARISON_MARGIN', 'default_parameters.default_comparison_margin_meters', 'Comparison margin is 0 — no buffer around POI radius.'));
    }
    if (d.route_exceedance_default_behavior === 'exclude') {
      warnings.push(warn('SYSADJ_HARD_EXCLUDE_DEFAULT', 'default_parameters.route_exceedance_default_behavior', 'Default exceedance behavior is hard exclude — consider degrade first.'));
    }
  }

  // Rule versions
  if (!state.rule_versions) {
    errors.push(err('SYSADJ_RULE_VERSIONS_MISSING', 'rule_versions', 'Rule versions are missing.'));
  } else {
    for (const [key, value] of Object.entries(state.rule_versions)) {
      if (!value || value.trim() === '') {
        errors.push(err('SYSADJ_RULE_VERSION_EMPTY', `rule_versions.${key}`, `Rule version '${key}' is empty.`));
      }
    }
  }

  // SVG Overlay Filter
  if (state.svg_overlay) {
    const excluded = state.svg_overlay.excluded_edge_types;
    const unknown = excluded.filter(t => !ALL_GRAPH_EDGE_TYPES.includes(t));
    if (unknown.length > 0) {
      errors.push(err('SA_OVERLAY_UNKNOWN_EDGE_TYPE', 'svg_overlay.excluded_edge_types',
        `Unknown edge types in SVG overlay filter: ${unknown.join(', ')}.`));
    }
    if (excluded.length >= ALL_GRAPH_EDGE_TYPES.length) {
      errors.push(err('SA_OVERLAY_ALL_TYPES_EXCLUDED', 'svg_overlay.excluded_edge_types',
        'All edge types are excluded — SVG overlay would be empty.'));
    }
  }

  // Feature flag warnings
  if (state.feature_flags?.enable_leaflet_debug_layers) {
    warnings.push(warn('SYSADJ_DEBUG_ENABLED', 'feature_flags.enable_leaflet_debug_layers', 'Leaflet debug layers are enabled.'));
  }
  if (state.feature_flags?.enable_step2_classification && !state.feature_flags.enable_stay_zone_detection) {
    warnings.push(warn('SYSADJ_STEP2_WITHOUT_DETECTOR', 'feature_flags.enable_step2_classification', 'Step-2 classification is enabled but stay_zone_detection is disabled — Step 2 will have no detector input.'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
  };
}
