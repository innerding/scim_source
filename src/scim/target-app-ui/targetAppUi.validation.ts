import type {
  TargetAppUiState,
  TargetAppUiValidationResult,
  TargetAppUiIssue,
  VisibleLayerConfig,
  UserControlConfig,
  ReductionProfile,
  RouteModeConfig,
} from './targetAppUi.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';
import type { RegioContentState } from '../regio-content/regioContent.types';

function err(code: string, message: string, field?: string): TargetAppUiIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): TargetAppUiIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

function validateVisibleLayers(
  layers: VisibleLayerConfig[],
  _sa: SystemAdjustState,
  profile_audience: string,
  issues: TargetAppUiIssue[],
): void {
  for (const layer of layers) {
    if (layer.layer_type === 'raw_signals' && layer.visibility === 'sensus_core_visible') {
      issues.push(err('TAPP_RAW_LAYER_VISIBLE_FORBIDDEN', `Layer ${layer.layer_id}: raw_signals must not be sensus_core_visible.`, 'visible_layers'));
    }
    if (layer.layer_type === 'debug_graph' && layer.visibility === 'sensus_core_visible') {
      issues.push(err('TAPP_DEBUG_LAYER_VISIBLE_FORBIDDEN', `Layer ${layer.layer_id}: debug_graph must not be sensus_core_visible.`, 'visible_layers'));
    }
    if (layer.data_class === 'raw_signal' && layer.visibility === 'sensus_core_visible') {
      issues.push(err('TAPP_RAW_LAYER_VISIBLE_FORBIDDEN', `Layer ${layer.layer_id}: raw_signal data_class must not be sensus_core_visible.`, 'visible_layers'));
    }
    if (layer.data_class === 'debug' && layer.visibility === 'sensus_core_visible') {
      issues.push(err('TAPP_DEBUG_LAYER_VISIBLE_FORBIDDEN', `Layer ${layer.layer_id}: debug data_class must not be sensus_core_visible.`, 'visible_layers'));
    }
    if (layer.data_class === 'operator_internal' && profile_audience === 'public_user' && layer.visibility === 'sensus_core_visible') {
      issues.push(err('TAPP_OPERATOR_INTERNAL_VISIBLE_FORBIDDEN', `Layer ${layer.layer_id}: operator_internal must not be sensus_core_visible for public_user.`, 'visible_layers'));
    }
    if (layer.data_class === 'forbidden_for_sensus_core' && (layer.visibility === 'sensus_core_visible' || layer.visibility === 'operator_preview_only')) {
      issues.push(err('TAPP_FORBIDDEN_DATA_CLASS_VISIBLE', `Layer ${layer.layer_id}: forbidden_for_sensus_core must be hidden.`, 'visible_layers'));
    }
  }
}

function validateRouteModes(
  modes: RouteModeConfig[],
  issues: TargetAppUiIssue[],
): void {
  const enabled = modes.filter((m) => m.enabled);
  if (enabled.length === 0) {
    issues.push(err('TAPP_NO_ROUTE_MODE_ENABLED', 'At least one route mode must be enabled.', 'available_route_modes'));
  }
  const defaults = modes.filter((m) => m.default_selected);
  if (defaults.length > 1) {
    issues.push(err('TAPP_MULTIPLE_DEFAULT_ROUTE_MODES', 'At most one route mode may be default_selected.', 'available_route_modes'));
  }
}

function validateUserControls(
  controls: UserControlConfig[],
  sa: SystemAdjustState,
  issues: TargetAppUiIssue[],
): void {
  for (const c of controls) {
    if (c.system_range_key && c.min_value !== undefined && c.max_value !== undefined) {
      const range = sa.allowed_ranges[c.system_range_key];
      if (range) {
        if (c.min_value < range.min) {
          issues.push(err('TAPP_CONTROL_OUT_OF_SYSTEM_RANGE', `Control ${c.control_id}: min_value ${c.min_value} < system min ${range.min}.`, 'allowed_user_controls'));
        }
        if (c.max_value > range.max) {
          issues.push(err('TAPP_CONTROL_OUT_OF_SYSTEM_RANGE', `Control ${c.control_id}: max_value ${c.max_value} > system max ${range.max}.`, 'allowed_user_controls'));
        }
      }
    }
  }
}

function validateReductionProfile(
  profile: ReductionProfile,
  issues: TargetAppUiIssue[],
): void {
  if ((profile.remove_raw_signals as unknown as boolean) !== true) {
    issues.push(err('TAPP_RAW_SIGNALS_NOT_REMOVED', 'remove_raw_signals must be true.', 'reduction_profile'));
  }
  if ((profile.remove_debug_data as unknown as boolean) !== true) {
    issues.push(err('TAPP_DEBUG_DATA_NOT_REMOVED', 'remove_debug_data must be true.', 'reduction_profile'));
  }
  if ((profile.hide_device_counts as unknown as boolean) !== true) {
    issues.push(err('TAPP_DEVICE_COUNTS_NOT_HIDDEN', 'hide_device_counts must be true.', 'reduction_profile'));
  }
  for (const dc of profile.allowed_output_data_classes) {
    if (dc === 'raw_signal' || dc === 'debug' || dc === 'forbidden_for_sensus_core') {
      issues.push(err('TAPP_FORBIDDEN_OUTPUT_DATA_CLASS', `allowed_output_data_classes must not include '${dc}'.`, 'reduction_profile'));
    }
  }
}

export function validateTargetAppUi(
  state: TargetAppUiState,
  systemAdjust: SystemAdjustState | undefined,
  regioContent?: RegioContentState,
): TargetAppUiValidationResult {
  const errors: TargetAppUiIssue[] = [];
  const warnings: TargetAppUiIssue[] = [];

  // System-Adjust check
  if (!systemAdjust) {
    errors.push(err('TAPP_SYSTEM_ADJUST_MISSING', 'System-Adjust is missing.', 'system_adjust'));
  } else if (systemAdjust.status !== 'system_adjust_valid' && systemAdjust.status !== 'system_adjust_warning') {
    errors.push(err('TAPP_SYSTEM_ADJUST_INVALID', `System-Adjust status is '${systemAdjust.status}'.`, 'system_adjust'));
  }

  // Version and profile
  if (!state.target_app_ui_version) {
    errors.push(err('TAPP_VERSION_MISSING', 'target_app_ui_version is missing.', 'target_app_ui_version'));
  }
  if (!state.app_profile?.profile_id) errors.push(err('TAPP_PROFILE_ID_MISSING', 'app_profile.profile_id is missing.', 'app_profile.profile_id'));
  if (!state.app_profile?.profile_name) errors.push(err('TAPP_PROFILE_NAME_MISSING', 'app_profile.profile_name is missing.', 'app_profile.profile_name'));
  if (!state.app_profile?.app_family) errors.push(err('TAPP_PROFILE_APP_FAMILY_MISSING', 'app_profile.app_family is missing.', 'app_profile.app_family'));
  if (!state.app_profile?.audience) errors.push(err('TAPP_PROFILE_AUDIENCE_MISSING', 'app_profile.audience is missing.', 'app_profile.audience'));
  if (!state.app_profile?.map_mode) errors.push(err('TAPP_PROFILE_MAP_MODE_MISSING', 'app_profile.map_mode is missing.', 'app_profile.map_mode'));

  // Visible layers
  if (!state.visible_layers) {
    errors.push(err('TAPP_VISIBLE_LAYERS_MISSING', 'visible_layers is missing.', 'visible_layers'));
  } else if (systemAdjust) {
    validateVisibleLayers(state.visible_layers, systemAdjust, state.app_profile?.audience ?? '', errors);
  }

  // Route modes
  if (!state.available_route_modes || state.available_route_modes.length === 0) {
    errors.push(err('TAPP_ROUTE_MODES_MISSING', 'available_route_modes is missing or empty.', 'available_route_modes'));
  } else {
    validateRouteModes(state.available_route_modes, errors);
  }

  // User controls
  if (!state.allowed_user_controls) {
    errors.push(err('TAPP_USER_CONTROLS_MISSING', 'allowed_user_controls is missing.', 'allowed_user_controls'));
  } else if (systemAdjust) {
    validateUserControls(state.allowed_user_controls, systemAdjust, errors);
  }

  // Warning rules — just check message_key exists
  for (const wr of state.warning_rules ?? []) {
    if (!wr.message_key) {
      errors.push(err('TAPP_WARNING_RULE_MESSAGE_MISSING', `Warning rule ${wr.warning_rule_id}: message_key is missing.`, 'warning_rules'));
    }
  }

  // Reduction profile
  if (!state.reduction_profile) {
    errors.push(err('TAPP_REDUCTION_PROFILE_MISSING', 'reduction_profile is missing.', 'reduction_profile'));
  } else {
    validateReductionProfile(state.reduction_profile, errors);
  }

  // Release
  if (!state.release || state.release.release_status !== 'released') {
    errors.push(err('TAPP_RELEASE_NOT_RELEASED', `release_status is '${state.release?.release_status}', must be 'released'.`, 'release'));
  } else if (state.release.blocks_runtime_use) {
    errors.push(err('TAPP_RELEASE_BLOCKS_RUNTIME', 'Release blocks runtime use.', 'release'));
  } else if (!state.release.released_at) {
    errors.push(err('TAPP_RELEASE_TIMESTAMP_MISSING', 'released_at is missing.', 'release.released_at'));
  }

  // Warnings
  if (!regioContent) {
    warnings.push(warn('TAPP_REGIO_CONTENT_MISSING', 'Regio-Content is not available — some checks skipped.', 'regio_content'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
    checked_against_regio_content_version: regioContent?.regio_content_version,
  };
}
