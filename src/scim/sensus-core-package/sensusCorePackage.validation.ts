import type { SensusCorePackageState, SensusCorePackageIssue, SensusCorePackageValidationResult } from './sensusCorePackage.types';
import type { LayerModelState } from '../layer-model/layerModel.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';

function err(code: string, message: string, field?: string): SensusCorePackageIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): SensusCorePackageIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateSensusCorePackage(
  state: SensusCorePackageState,
  layerModel: LayerModelState | undefined,
  systemAdjust: SystemAdjustState | undefined,
): SensusCorePackageValidationResult {
  const errors: SensusCorePackageIssue[] = [];
  const warnings: SensusCorePackageIssue[] = [];

  if (!layerModel) {
    errors.push(err('PKG_LAYER_MODEL_MISSING', 'Layer-Model is missing.', 'layer_model'));
  } else if (layerModel.status !== 'layer_model_valid' && layerModel.status !== 'layer_model_warning') {
    errors.push(err('PKG_LAYER_MODEL_INVALID', `Layer-Model status is '${layerModel.status}'.`, 'layer_model'));
  }

  if (!systemAdjust) {
    errors.push(err('PKG_SYSTEM_ADJUST_MISSING', 'System-Adjust is missing.', 'system_adjust'));
  }

  // Hardcoded privacy invariants
  if ((state.content.raw_signals_present as unknown as boolean) !== false) {
    errors.push(err('PKG_RAW_SIGNALS_FORBIDDEN', 'content.raw_signals_present must be false for Sensus-Core packages.', 'content.raw_signals_present'));
  }
  if ((state.content.device_ids_present as unknown as boolean) !== false) {
    errors.push(err('PKG_DEVICE_IDS_FORBIDDEN', 'content.device_ids_present must be false for Sensus-Core packages.', 'content.device_ids_present'));
  }
  if ((state.content.debug_data_present as unknown as boolean) !== false) {
    errors.push(err('PKG_DEBUG_DATA_FORBIDDEN', 'content.debug_data_present must be false for Sensus-Core packages.', 'content.debug_data_present'));
  }

  if (!state.schema_version) {
    errors.push(err('PKG_SCHEMA_VERSION_MISSING', 'schema_version is missing.', 'schema_version'));
  }

  if (state.content.route_segments_count === 0) {
    warnings.push(warn('PKG_NO_ROUTE_SEGMENTS', 'Package contains no route segments.', 'content.route_segments_count'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_layer_model_id: layerModel?.layer_model_id ?? 'missing',
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
  };
}
