import type { ScimContext } from '../context/scimContext.types';
import type { BasisLayerState } from './basisLayer.types';

export function applyBasisLayerToContext(
  context: ScimContext,
  basisLayer: BasisLayerState,
): ScimContext {
  if (basisLayer.status !== 'basis_layer_valid' && basisLayer.status !== 'basis_layer_warning') {
    throw new Error('Cannot apply invalid or unbuilt BasisLayer state to SCIM context.');
  }
  return { ...context, basis_layer: basisLayer };
}
