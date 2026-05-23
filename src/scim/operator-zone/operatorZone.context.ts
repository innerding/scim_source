import type { ScimContext } from '../context/scimContext.types';
import type { OperatorZoneState } from './operatorZone.types';

export function applyOperatorZonesToContext(
  ctx: ScimContext,
  state: OperatorZoneState,
): ScimContext {
  if (state.status === 'operator_zone_invalid') {
    throw new Error(`Cannot apply OperatorZoneState with status '${state.status}' to context.`);
  }
  return { ...ctx, operator_zones: state };
}
