import type { ScimContext } from '../context/scimContext.types';
import type { ReleaseExportState } from './releaseExport.types';

export function applyReleaseExportToContext(context: ScimContext, release: ReleaseExportState): ScimContext {
  if (release.status !== 'released') {
    throw new Error('Cannot apply unreleased or failed Release Export to SCIM context.');
  }
  if (!release.metadata.privacy_verified || !release.metadata.sensus_core_safe) {
    throw new Error('Cannot apply Release Export without privacy_verified and sensus_core_safe.');
  }
  return { ...context, release };
}
