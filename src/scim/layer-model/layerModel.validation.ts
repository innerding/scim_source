import type { LayerModelState, LayerModelIssue, LayerModelValidationResult } from './layerModel.types';
import type { RouteLayerModelState } from '../route-layer-model/routeLayerModel.types';
import type { BasisLayerState } from '../basis-layer/basisLayer.types';

function err(code: string, message: string, field?: string): LayerModelIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): LayerModelIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateLayerModel(
  state: LayerModelState,
  routeLayerModel: RouteLayerModelState | undefined,
  basisLayer: BasisLayerState | undefined,
): LayerModelValidationResult {
  const errors: LayerModelIssue[] = [];
  const warnings: LayerModelIssue[] = [];

  if (!state.layers || state.layers.length === 0) {
    errors.push(err('LM_NO_LAYERS', 'Layer model contains no layers.', 'layers'));
  } else {
    const seenIds = new Set<string>();
    for (const layer of state.layers) {
      if (seenIds.has(layer.layer_id)) {
        errors.push(err('LM_DUPLICATE_LAYER_ID', `Duplicate layer_id: '${layer.layer_id}'.`, 'layers'));
      }
      seenIds.add(layer.layer_id);

      if (layer.opacity < 0 || layer.opacity > 1) {
        errors.push(err('LM_LAYER_OPACITY_INVALID', `Layer '${layer.layer_id}': opacity ${layer.opacity} must be in [0, 1].`, 'layers'));
      }
    }

    const computedVisible = state.layers.filter(l => l.visible).length;
    if (computedVisible !== state.visible_layer_count) {
      errors.push(err('LM_VISIBLE_COUNT_MISMATCH', `visible_layer_count ${state.visible_layer_count} does not match actual visible layers ${computedVisible}.`, 'visible_layer_count'));
    }

    if (state.layers.every(l => !l.visible)) {
      warnings.push(warn('LM_ALL_LAYERS_INVISIBLE', 'All layers are invisible — nothing will be rendered.', 'layers'));
    }
  }

  for (const szel of state.stay_zone_edge_layers ?? []) {
    if (szel.opacity < 0 || szel.opacity > 1) {
      errors.push(err('LM_SZEL_OPACITY_INVALID', `StayZoneEdgeLayer '${szel.layer_id}': opacity ${szel.opacity} must be in [0, 1].`, 'stay_zone_edge_layers'));
    }
    if (szel.gradient.transition_width_meters <= 0) {
      errors.push(err('LM_SZEL_GRADIENT_WIDTH_INVALID', `StayZoneEdgeLayer '${szel.layer_id}': transition_width_meters must be > 0.`, 'stay_zone_edge_layers'));
    }
    if (szel.edge_ids.length === 0) {
      warnings.push(warn('LM_SZEL_NO_EDGES', `StayZoneEdgeLayer '${szel.layer_id}' has no edge_ids — nothing will be rendered.`, 'stay_zone_edge_layers'));
    }
    if (szel.classification === 'stau') {
      warnings.push(warn('LM_SZEL_STAU_PENDING_OPERATOR', `StayZoneEdgeLayer '${szel.layer_id}' is classified as stau — operator confirmation may still be pending.`, 'stay_zone_edge_layers'));
    }
  }

  if (!routeLayerModel) {
    warnings.push(warn('LM_ROUTE_LAYER_MISSING', 'Route-Layer-Model is not available.', 'route_layer_model'));
  }

  if (!basisLayer) {
    warnings.push(warn('LM_BASIS_LAYER_MISSING', 'Basis-Layer is not available.', 'basis_layer'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_route_layer_model_id: routeLayerModel?.route_layer_model_id,
    checked_against_basis_layer_id: basisLayer?.basis_layer_id,
  };
}
