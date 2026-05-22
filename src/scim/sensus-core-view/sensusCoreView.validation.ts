import type { SensusCoreViewState, SensusCoreViewIssue, SensusCoreViewValidationResult } from './sensusCoreView.types';
import type { SensusCorePackageState } from '../sensus-core-package/sensusCorePackage.types';

function err(code: string, message: string, field?: string): SensusCoreViewIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): SensusCoreViewIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateSensusCoreView(
  state: SensusCoreViewState,
  sensusCorePackage: SensusCorePackageState | undefined,
): SensusCoreViewValidationResult {
  const errors: SensusCoreViewIssue[] = [];
  const warnings: SensusCoreViewIssue[] = [];

  if (!sensusCorePackage) {
    errors.push(err('VIEW_PACKAGE_MISSING', 'Sensus-Core-Package is missing.', 'package'));
  } else if (sensusCorePackage.status !== 'package_valid' && sensusCorePackage.status !== 'package_warning') {
    errors.push(err('VIEW_PACKAGE_INVALID', `Package status is '${sensusCorePackage.status}'.`, 'package'));
  }

  if (state.viewport_zoom < 1 || state.viewport_zoom > 22) {
    errors.push(err('VIEW_ZOOM_OUT_OF_RANGE', `viewport_zoom ${state.viewport_zoom} must be in [1, 22].`, 'viewport_zoom'));
  }

  const seenIds = new Set<string>();
  for (const layer of state.active_layers) {
    if (seenIds.has(layer.layer_id)) {
      errors.push(err('VIEW_DUPLICATE_LAYER_ID', `Duplicate active layer_id: '${layer.layer_id}'.`, 'active_layers'));
    }
    seenIds.add(layer.layer_id);
    if (layer.opacity < 0 || layer.opacity > 1) {
      errors.push(err('VIEW_LAYER_OPACITY_INVALID', `Layer '${layer.layer_id}': opacity ${layer.opacity} must be in [0, 1].`, 'active_layers'));
    }
  }

  if (state.active_layers.every(l => !l.visible)) {
    warnings.push(warn('VIEW_ALL_LAYERS_HIDDEN', 'All active layers are hidden — nothing visible.', 'active_layers'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_package_id: sensusCorePackage?.package_id,
  };
}
