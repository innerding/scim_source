import type { ScimContext } from '../context/scimContext.types';
import type { LeafletEffectCheckState } from './leafletEffectCheck.types';

export function applyLeafletEffectCheckToContext(context: ScimContext, check: LeafletEffectCheckState): ScimContext {
  if (check.status !== 'effect_check_ok' && check.status !== 'effect_check_warning') {
    throw new Error('Cannot apply failed or unchecked Leaflet Effect Check to SCIM context.');
  }
  return { ...context, leaflet_effect_check: check };
}
