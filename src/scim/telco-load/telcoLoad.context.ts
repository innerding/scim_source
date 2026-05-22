import type { ScimContext } from '../context/scimContext.types';
import type { TelcoLoadState } from './telcoLoad.types';

export function applyTelcoLoadToContext(
  context: ScimContext,
  telcoLoad: TelcoLoadState,
): ScimContext {
  if (telcoLoad.status !== 'telco_load_valid' && telcoLoad.status !== 'telco_load_warning') {
    throw new Error('Cannot apply invalid, expired or privacy-blocked Telco-Load state to SCIM context.');
  }
  if (!telcoLoad.validation.is_valid) {
    throw new Error('Cannot apply Telco-Load state with blocking validation errors.');
  }
  if (!telcoLoad.privacy_check.is_privacy_valid) {
    throw new Error('Cannot apply Telco-Load state with invalid privacy check.');
  }
  return { ...context, telco_load: telcoLoad };
}
