import type { ScimContext } from '../context/scimContext.types';
import type { LeafletBasisCheckState } from './leafletBasisCheck.types';

export function applyLeafletBasisCheckToContext(context: ScimContext, check: LeafletBasisCheckState): ScimContext {
  if (check.status !== 'leaflet_basis_ok' && check.status !== 'leaflet_basis_warning') {
    throw new Error('Cannot apply failed or unchecked Leaflet Basis Check to SCIM context.');
  }
  return { ...context, leaflet_check: check };
}
