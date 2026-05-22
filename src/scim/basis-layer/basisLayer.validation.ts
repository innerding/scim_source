import type { BasisLayerState, BasisLayerIssue, BasisLayerValidationResult } from './basisLayer.types';
import type { BoundaryState } from '../boundary/boundary.types';
import type { GraphState } from '../graph/graph.types';

function err(code: string, message: string, field?: string): BasisLayerIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): BasisLayerIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateBasisLayer(
  state: BasisLayerState,
  boundary: BoundaryState | undefined,
  graph?: GraphState,
): BasisLayerValidationResult {
  const errors: BasisLayerIssue[] = [];
  const warnings: BasisLayerIssue[] = [];

  if (!boundary) {
    errors.push(err('BL_BOUNDARY_MISSING', 'Boundary is missing.', 'boundary'));
  } else if (boundary.status !== 'boundary_valid' && boundary.status !== 'boundary_warning') {
    errors.push(err('BL_BOUNDARY_INVALID', `Boundary status is '${boundary.status}'.`, 'boundary'));
  }

  if (!state.basis_layer_id) {
    errors.push(err('BL_ID_MISSING', 'basis_layer_id is missing.', 'basis_layer_id'));
  }

  if (!state.tile_layers || state.tile_layers.length === 0) {
    errors.push(err('BL_NO_TILE_LAYERS', 'At least one tile layer is required.', 'tile_layers'));
  } else {
    const seenIds = new Set<string>();
    for (const layer of state.tile_layers) {
      if (seenIds.has(layer.tile_layer_id)) {
        errors.push(err('BL_DUPLICATE_TILE_LAYER_ID', `Duplicate tile_layer_id: '${layer.tile_layer_id}'.`, 'tile_layers'));
      }
      seenIds.add(layer.tile_layer_id);

      if (layer.min_zoom > layer.max_zoom) {
        errors.push(err('BL_TILE_ZOOM_INVALID', `Layer '${layer.tile_layer_id}': min_zoom ${layer.min_zoom} > max_zoom ${layer.max_zoom}.`, 'tile_layers'));
      }

      if (layer.opacity < 0 || layer.opacity > 1) {
        errors.push(err('BL_TILE_OPACITY_INVALID', `Layer '${layer.tile_layer_id}': opacity ${layer.opacity} must be between 0 and 1.`, 'tile_layers'));
      }
    }
  }

  if (!state.viewport) {
    errors.push(err('BL_VIEWPORT_MISSING', 'viewport is missing.', 'viewport'));
  } else {
    if (state.viewport.min_zoom > state.viewport.max_zoom) {
      errors.push(err('BL_VIEWPORT_ZOOM_INVALID', `viewport min_zoom ${state.viewport.min_zoom} > max_zoom ${state.viewport.max_zoom}.`, 'viewport'));
    }
    if (state.viewport.default_zoom < state.viewport.min_zoom || state.viewport.default_zoom > state.viewport.max_zoom) {
      errors.push(err('BL_VIEWPORT_DEFAULT_ZOOM_OUT_OF_RANGE', `viewport default_zoom ${state.viewport.default_zoom} outside [${state.viewport.min_zoom}, ${state.viewport.max_zoom}].`, 'viewport.default_zoom'));
    }
  }

  if (!graph) {
    warnings.push(warn('BL_GRAPH_MISSING', 'Graph is not available for basis layer.', 'graph'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_boundary_id: boundary?.boundary_id ?? 'missing',
    checked_against_graph_id: graph?.graph_id,
  };
}
