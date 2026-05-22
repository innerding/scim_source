import type { LeafletEffectCheckState, LeafletEffectCheckIssue, LeafletEffectCheckValidationResult } from './leafletEffectCheck.types';
import type { SensusCorePackageState } from '../sensus-core-package/sensusCorePackage.types';

function err(code: string, message: string, field?: string): LeafletEffectCheckIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): LeafletEffectCheckIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateLeafletEffectCheck(
  state: LeafletEffectCheckState,
  sensusCorePackage: SensusCorePackageState | undefined,
): LeafletEffectCheckValidationResult {
  const errors: LeafletEffectCheckIssue[] = [];
  const warnings: LeafletEffectCheckIssue[] = [];

  if (!sensusCorePackage) {
    errors.push(err('LEC_PACKAGE_MISSING', 'Sensus-Core-Package is missing.', 'package'));
  } else if (sensusCorePackage.status !== 'package_valid' && sensusCorePackage.status !== 'package_warning') {
    errors.push(err('LEC_PACKAGE_INVALID', `Package status is '${sensusCorePackage.status}'.`, 'package'));
  }

  if (state.render_result.any_layer_error) {
    errors.push(err('LEC_LAYER_RENDER_ERROR', 'One or more layers had render errors.', 'render_result.any_layer_error'));
  }

  if (!state.render_result.route_layer_rendered) {
    warnings.push(warn('LEC_ROUTE_LAYER_NOT_RENDERED', 'Route layer was not rendered.', 'render_result.route_layer_rendered'));
  }

  if (state.render_result.visible_segment_count === 0) {
    warnings.push(warn('LEC_NO_VISIBLE_SEGMENTS', 'No visible route segments after render.', 'render_result.visible_segment_count'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_package_id: sensusCorePackage?.package_id,
  };
}
