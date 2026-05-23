import type {
  TelcoLoadState,
  TelcoLoadValidationResult,
  TelcoLoadIssue,
  LoadSignalGroup,
} from './telcoLoad.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';
import type { RegioContentState } from '../regio-content/regioContent.types';
import type { TargetAppUiState } from '../target-app-ui/targetAppUi.types';

function err(code: string, message: string, field?: string, related_id?: string): TelcoLoadIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): TelcoLoadIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

function validateTimeWindow(state: TelcoLoadState, sa: SystemAdjustState, issues: TelcoLoadIssue[]): void {
  const tw = state.time_window;
  if (!tw.start_at) issues.push(err('TELCO_TIME_START_MISSING', 'time_window.start_at is missing.', 'time_window.start_at'));
  if (!tw.end_at) issues.push(err('TELCO_TIME_END_MISSING', 'time_window.end_at is missing.', 'time_window.end_at'));
  if (tw.start_at && tw.end_at && new Date(tw.end_at) <= new Date(tw.start_at)) {
    issues.push(err('TELCO_TIME_END_BEFORE_START', 'time_window.end_at must be after start_at.', 'time_window'));
  }
  if (tw.duration_seconds <= 0) {
    issues.push(err('TELCO_DURATION_INVALID', 'time_window.duration_seconds must be > 0.', 'time_window.duration_seconds'));
  }
  const al = sa.aggregation_limits;
  if (tw.aggregation_window_seconds < al.min_time_window_seconds || tw.aggregation_window_seconds > al.max_time_window_seconds) {
    issues.push(err('TELCO_AGG_WINDOW_OUT_OF_RANGE', `aggregation_window_seconds ${tw.aggregation_window_seconds} outside [${al.min_time_window_seconds}, ${al.max_time_window_seconds}].`, 'time_window.aggregation_window_seconds'));
  }
  if (!tw.generated_at) issues.push(err('TELCO_TIME_START_MISSING', 'time_window.generated_at is missing.', 'time_window.generated_at'));
}

function validateSpatialScope(state: TelcoLoadState, sa: SystemAdjustState, issues: TelcoLoadIssue[]): void {
  const ss = state.spatial_scope;
  if (!ss) {
    issues.push(err('TELCO_SPATIAL_SCOPE_MISSING', 'spatial_scope is missing.', 'spatial_scope'));
    return;
  }
  if (ss.scope_type === 'unknown') {
    issues.push(err('TELCO_SPATIAL_SCOPE_UNKNOWN', 'spatial_scope.scope_type must not be unknown for runtime-valid batch.', 'spatial_scope.scope_type'));
  }
  if (ss.spatial_resolution_meters < sa.privacy_limits.spatial_min_resolution_meters) {
    issues.push(err('TELCO_SPATIAL_RESOLUTION_TOO_FINE', `spatial_resolution_meters ${ss.spatial_resolution_meters} < system min ${sa.privacy_limits.spatial_min_resolution_meters}.`, 'spatial_scope.spatial_resolution_meters'));
  }
}

function validateSignalGroup(sg: LoadSignalGroup, sa: SystemAdjustState, issues: TelcoLoadIssue[]): void {
  if (!sg.signal_group_id) {
    issues.push(err('TELCO_SIGNAL_GROUP_ID_MISSING', 'signal_group_id is missing.', 'load_signals'));
    return;
  }
  if (sg.signal_type === 'unknown') {
    issues.push(err('TELCO_SIGNAL_TYPE_UNKNOWN', `Signal group ${sg.signal_group_id}: signal_type is unknown.`, 'load_signals', sg.signal_group_id));
  }
  if (sg.aggregation_unit === 'unknown') {
    issues.push(err('TELCO_AGGREGATION_UNIT_UNKNOWN', `Signal group ${sg.signal_group_id}: aggregation_unit is unknown.`, 'load_signals', sg.signal_group_id));
  }
  if (sg.metrics.signal_count < sa.privacy_limits.min_signals_per_visible_aggregate) {
    issues.push(err('TELCO_SIGNAL_COUNT_TOO_LOW', `Signal group ${sg.signal_group_id}: signal_count ${sg.metrics.signal_count} < min ${sa.privacy_limits.min_signals_per_visible_aggregate}.`, 'load_signals', sg.signal_group_id));
  }
  if (sg.metrics.distinct_device_count !== undefined && sg.metrics.distinct_device_count < sa.privacy_limits.min_distinct_devices_per_visible_aggregate) {
    issues.push(err('TELCO_DISTINCT_DEVICE_COUNT_TOO_LOW', `Signal group ${sg.signal_group_id}: distinct_device_count ${sg.metrics.distinct_device_count} < min ${sa.privacy_limits.min_distinct_devices_per_visible_aggregate}.`, 'load_signals', sg.signal_group_id));
  }
  if (sg.quality.quality_level === 'unusable') {
    issues.push(err('TELCO_SIGNAL_QUALITY_UNUSABLE', `Signal group ${sg.signal_group_id}: quality_level is unusable.`, 'load_signals', sg.signal_group_id));
  }
  if (sg.quality.has_conflicts && !sg.intended_use.includes('quality_reference_only')) {
    issues.push(err('TELCO_SIGNAL_CONFLICT_BLOCKING', `Signal group ${sg.signal_group_id}: has conflicts and is not quality_reference_only.`, 'load_signals', sg.signal_group_id));
  }
  // Privacy checks
  const p = sg.privacy;
  if (!p.aggregation_verified) issues.push(err('TELCO_PRIVACY_NOT_VERIFIED', `Signal group ${sg.signal_group_id}: aggregation_verified is false.`, 'load_signals', sg.signal_group_id));
  if (!p.meets_min_distinct_devices) issues.push(err('TELCO_PRIVACY_NOT_VERIFIED', `Signal group ${sg.signal_group_id}: meets_min_distinct_devices is false.`, 'load_signals', sg.signal_group_id));
  if (!p.meets_min_signal_count) issues.push(err('TELCO_PRIVACY_NOT_VERIFIED', `Signal group ${sg.signal_group_id}: meets_min_signal_count is false.`, 'load_signals', sg.signal_group_id));
  if ((p.single_device_visibility_possible as unknown as boolean) !== false) {
    issues.push(err('TELCO_SINGLE_DEVICE_VISIBILITY_FORBIDDEN', `Signal group ${sg.signal_group_id}: single_device_visibility_possible must be false.`, 'load_signals', sg.signal_group_id));
  }
  if ((p.raw_signal_payload_present as unknown as boolean) !== false) {
    issues.push(err('TELCO_RAW_SIGNAL_PAYLOAD_FORBIDDEN', `Signal group ${sg.signal_group_id}: raw_signal_payload_present must be false.`, 'load_signals', sg.signal_group_id));
  }
  if ((p.device_ids_present as unknown as boolean) !== false) {
    issues.push(err('TELCO_DEVICE_IDS_FORBIDDEN', `Signal group ${sg.signal_group_id}: device_ids_present must be false.`, 'load_signals', sg.signal_group_id));
  }
  if ((p.exact_trace_present as unknown as boolean) !== false) {
    issues.push(err('TELCO_EXACT_TRACE_FORBIDDEN', `Signal group ${sg.signal_group_id}: exact_trace_present must be false.`, 'load_signals', sg.signal_group_id));
  }
  // Validity
  if (sg.validity.expired && sg.validity.usable_for_runtime) {
    issues.push(err('TELCO_GROUP_EXPIRED_RUNTIME_FORBIDDEN', `Signal group ${sg.signal_group_id}: expired group must not be usable_for_runtime.`, 'load_signals', sg.signal_group_id));
  }
  // Warnings
  if (sg.quality.quality_level === 'low') {
    issues.push(warn('TELCO_LOW_SIGNAL_QUALITY', `Signal group ${sg.signal_group_id}: quality_level is low.`, 'load_signals', sg.signal_group_id));
  }
  if (sg.quality.spatial_accuracy_level === 'low') {
    issues.push(warn('TELCO_LOW_SPATIAL_ACCURACY', `Signal group ${sg.signal_group_id}: spatial_accuracy_level is low.`, 'load_signals', sg.signal_group_id));
  }
  if (sg.validity.stale) {
    issues.push(warn('TELCO_STALE_SIGNAL_GROUP', `Signal group ${sg.signal_group_id}: is stale.`, 'load_signals', sg.signal_group_id));
  }
}

export function validateTelcoLoad(
  state: TelcoLoadState,
  systemAdjust: SystemAdjustState | undefined,
  regioContent?: RegioContentState,
  targetAppUi?: TargetAppUiState,
): TelcoLoadValidationResult {
  const errors: TelcoLoadIssue[] = [];
  const warnings: TelcoLoadIssue[] = [];

  // System-Adjust check
  if (!systemAdjust) {
    errors.push(err('TELCO_SYSTEM_ADJUST_MISSING', 'System-Adjust is missing.', 'system_adjust'));
  } else if (systemAdjust.status !== 'system_adjust_valid' && systemAdjust.status !== 'system_adjust_warning') {
    errors.push(err('TELCO_SYSTEM_ADJUST_INVALID', `System-Adjust status is '${systemAdjust.status}'.`, 'system_adjust'));
  }

  // Batch presence checks
  if (!state.telco_load_batch_id) errors.push(err('TELCO_BATCH_ID_MISSING', 'telco_load_batch_id is missing.', 'telco_load_batch_id'));
  if (!state.source) errors.push(err('TELCO_SOURCE_MISSING', 'source is missing.', 'source'));
  if (!state.loaded_at) errors.push(err('TELCO_LOADED_AT_MISSING', 'loaded_at is missing.', 'loaded_at'));
  if (!state.time_window) errors.push(err('TELCO_TIME_WINDOW_MISSING', 'time_window is missing.', 'time_window'));
  if (!state.load_signals) errors.push(err('TELCO_LOAD_SIGNALS_MISSING', 'load_signals is missing.', 'load_signals'));
  if (!state.aggregation_level) errors.push(err('TELCO_AGGREGATION_LEVEL_MISSING', 'aggregation_level is missing.', 'aggregation_level'));
  if (!state.expiry_rules) errors.push(err('TELCO_EXPIRY_RULES_MISSING', 'expiry_rules is missing.', 'expiry_rules'));
  if (!state.privacy_check) errors.push(err('TELCO_PRIVACY_CHECK_MISSING', 'privacy_check is missing.', 'privacy_check'));

  if (systemAdjust && systemAdjust.status !== 'system_adjust_invalid') {
    const sa = systemAdjust;

    // Time window
    if (state.time_window) validateTimeWindow(state, sa, errors);

    // Spatial scope
    if (state.spatial_scope) {
      validateSpatialScope(state, sa, errors);
    } else {
      errors.push(err('TELCO_SPATIAL_SCOPE_MISSING', 'spatial_scope is missing.', 'spatial_scope'));
    }

    // Signal groups
    for (const sg of state.load_signals ?? []) {
      validateSignalGroup(sg, sa, errors);
    }

    // Aggregation level
    if (state.aggregation_level) {
      const al = state.aggregation_level;
      if (al.aggregation_type === 'unknown') {
        errors.push(err('TELCO_AGGREGATION_TYPE_UNKNOWN', 'aggregation_level.aggregation_type must not be unknown.', 'aggregation_level.aggregation_type'));
      }
      if (al.min_signal_count_observed < sa.aggregation_limits.min_signal_count) {
        errors.push(err('TELCO_AGGREGATION_UNDER_SYSTEM_LIMIT', `min_signal_count_observed ${al.min_signal_count_observed} < system min ${sa.aggregation_limits.min_signal_count}.`, 'aggregation_level.min_signal_count_observed'));
      }
      if (al.aggregation_window_seconds < sa.aggregation_limits.min_time_window_seconds || al.aggregation_window_seconds > sa.aggregation_limits.max_time_window_seconds) {
        errors.push(err('TELCO_AGGREGATION_UNDER_SYSTEM_LIMIT', `aggregation_window_seconds ${al.aggregation_window_seconds} outside system range.`, 'aggregation_level.aggregation_window_seconds'));
      }
    }

    // Expiry rules
    if (state.expiry_rules) {
      if (state.expiry_rules.max_validity_seconds > sa.privacy_limits.max_raw_signal_validity_seconds) {
        errors.push(err('TELCO_BATCH_EXPIRED', `expiry_rules.max_validity_seconds ${state.expiry_rules.max_validity_seconds} exceeds system limit ${sa.privacy_limits.max_raw_signal_validity_seconds}.`, 'expiry_rules.max_validity_seconds'));
      }
    }

    // Privacy check
    if (state.privacy_check) {
      const pc = state.privacy_check;
      if (!pc.is_privacy_valid) errors.push(err('TELCO_BATCH_PRIVACY_INVALID', 'privacy_check.is_privacy_valid is false.', 'privacy_check'));
      if (pc.raw_payload_detected) errors.push(err('TELCO_RAW_SIGNAL_PAYLOAD_FORBIDDEN', 'privacy_check: raw_payload_detected is true.', 'privacy_check'));
      if (pc.device_level_data_detected) errors.push(err('TELCO_DEVICE_IDS_FORBIDDEN', 'privacy_check: device_level_data_detected is true.', 'privacy_check'));
      if (pc.exact_trace_detected) errors.push(err('TELCO_EXACT_TRACE_FORBIDDEN', 'privacy_check: exact_trace_detected is true.', 'privacy_check'));
    }
  }

  // Short interval
  if (state.short_interval_enabled && state.short_interval_window_seconds < 5) {
    warnings.push(warn('TELCO_SHORT_INTERVAL_TOO_SMALL', 'short_interval_window_seconds < 5s is unusually short for density analysis.', 'short_interval_window_seconds'));
  }
  if (state.short_interval_enabled && systemAdjust && state.short_interval_window_seconds > systemAdjust.default_parameters.default_measurement_interval_seconds * 3) {
    warnings.push(warn('TELCO_SHORT_INTERVAL_EXCEEDS_SYSTEM', 'short_interval_window_seconds exceeds 3× system measurement interval — density results may be coarse.', 'short_interval_window_seconds'));
  }

  // Optional warnings
  if (!regioContent) warnings.push(warn('TELCO_REGIO_CONTENT_MISSING', 'Regio-Content is not available.', 'regio_content'));
  if (!targetAppUi) warnings.push(warn('TELCO_TARGET_APP_UI_MISSING', 'Target-App-UI is not available.', 'target_app_ui'));

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
    checked_against_regio_content_version: regioContent?.regio_content_version,
    checked_against_target_app_ui_version: targetAppUi?.target_app_ui_version,
  };
}
