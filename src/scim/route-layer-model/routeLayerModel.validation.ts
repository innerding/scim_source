import type { RouteLayerModelState, RouteLayerModelIssue, RouteLayerModelValidationResult } from './routeLayerModel.types';
import type { RouteModelState } from '../route-model/routeModel.types';

function err(code: string, message: string, field?: string): RouteLayerModelIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): RouteLayerModelIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateRouteLayerModel(
  state: RouteLayerModelState,
  routeModel: RouteModelState | undefined,
): RouteLayerModelValidationResult {
  const errors: RouteLayerModelIssue[] = [];
  const warnings: RouteLayerModelIssue[] = [];

  if (!routeModel) {
    errors.push(err('RLM_ROUTE_MODEL_MISSING', 'Route-Model is missing.', 'route_model'));
  } else if (routeModel.status !== 'route_model_valid' && routeModel.status !== 'route_model_warning') {
    errors.push(err('RLM_ROUTE_MODEL_INVALID', `Route-Model status is '${routeModel.status}'.`, 'route_model'));
  }

  if (state.segments.length === 0) {
    errors.push(err('RLM_NO_SEGMENTS', 'No route layer segments built.', 'segments'));
  }

  if (state.score_class_styles.length === 0) {
    errors.push(err('RLM_NO_STYLES', 'No score class styles defined.', 'score_class_styles'));
  }

  const computedVisible = state.segments.filter(s => s.visible).length;
  if (computedVisible !== state.visible_segment_count) {
    errors.push(err('RLM_VISIBLE_COUNT_MISMATCH', `visible_segment_count ${state.visible_segment_count} does not match actual visible segments ${computedVisible}.`, 'visible_segment_count'));
  }

  if (state.segments.length > 0 && state.segments.every(s => !s.visible)) {
    warnings.push(warn('RLM_ALL_INVISIBLE', 'All route layer segments are invisible.', 'segments'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_route_model_id: routeModel?.route_model_id ?? 'missing',
  };
}
