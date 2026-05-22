import type { LeafletBasisCheckState, LeafletBasisCheckIssue, LeafletBasisCheckValidationResult } from './leafletBasisCheck.types';
import type { BasisLayerState } from '../basis-layer/basisLayer.types';

function err(code: string, message: string, field?: string): LeafletBasisCheckIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): LeafletBasisCheckIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateLeafletBasisCheck(
  state: LeafletBasisCheckState,
  basisLayer: BasisLayerState | undefined,
): LeafletBasisCheckValidationResult {
  const errors: LeafletBasisCheckIssue[] = [];
  const warnings: LeafletBasisCheckIssue[] = [];

  if (!basisLayer) {
    errors.push(err('LBC_BASIS_LAYER_MISSING', 'Basis-Layer is missing.', 'basis_layer'));
  } else if (basisLayer.status !== 'basis_layer_valid' && basisLayer.status !== 'basis_layer_warning') {
    errors.push(err('LBC_BASIS_LAYER_INVALID', `Basis-Layer status is '${basisLayer.status}'.`, 'basis_layer'));
  }

  if (!state.check_result.overall_ready) {
    errors.push(err('LBC_NOT_READY', 'Leaflet basis check did not pass overall_ready.', 'check_result.overall_ready'));
  }

  if (!state.check_result.viewport_valid) {
    errors.push(err('LBC_VIEWPORT_INVALID', 'Viewport is not valid for rendering.', 'check_result.viewport_valid'));
  }

  if (state.check_result.tile_layers_count === 0) {
    warnings.push(warn('LBC_NO_TILE_LAYERS', 'No tile layers available for rendering.', 'check_result.tile_layers_count'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_basis_layer_id: basisLayer?.basis_layer_id,
  };
}
