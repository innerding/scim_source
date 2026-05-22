import type { ScimContext } from '../context/scimContext.types';
import type { SystemAdjustState } from './systemAdjust.types';

export function applySystemAdjustToContext(
  context: ScimContext,
  systemAdjust: SystemAdjustState,
): ScimContext {
  if (systemAdjust.status !== 'system_adjust_valid' && systemAdjust.status !== 'system_adjust_warning') {
    throw new Error('Cannot apply invalid System-Adjust state to SCIM context.');
  }
  return { ...context, system_adjust: systemAdjust };
}
