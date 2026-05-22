import type { ScimContext } from '../context/scimContext.types';
import type { RegioContentState } from './regioContent.types';

export function applyRegioContentToContext(
  context: ScimContext,
  regioContent: RegioContentState,
): ScimContext {
  if (regioContent.status !== 'regio_content_valid' && regioContent.status !== 'regio_content_warning') {
    throw new Error('Cannot apply invalid or draft Regio-Content state to SCIM context.');
  }
  if (regioContent.release.release_status !== 'released' || regioContent.release.blocks_runtime_use) {
    throw new Error('Cannot apply unreleased Regio-Content to runtime SCIM context.');
  }
  return { ...context, regio_content: regioContent };
}
