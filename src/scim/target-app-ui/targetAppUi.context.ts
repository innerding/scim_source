import type { ScimContext } from '../context/scimContext.types';
import type { TargetAppUiState } from './targetAppUi.types';

export function applyTargetAppUiToContext(
  context: ScimContext,
  targetAppUi: TargetAppUiState,
): ScimContext {
  if (targetAppUi.status !== 'target_app_ui_valid' && targetAppUi.status !== 'target_app_ui_warning') {
    throw new Error('Cannot apply invalid or draft Target-App UI state to SCIM context.');
  }
  if (targetAppUi.release.release_status !== 'released' || targetAppUi.release.blocks_runtime_use) {
    throw new Error('Cannot apply unreleased Target-App UI state to runtime SCIM context.');
  }
  return { ...context, target_app_ui: targetAppUi };
}
