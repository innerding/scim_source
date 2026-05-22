import type { ScimContext } from '../context/scimContext.types';
import type { LoadProjectionState } from './loadProjection.types';

export function applyLoadProjectionToContext(context: ScimContext, loadProjection: LoadProjectionState): ScimContext {
  if (loadProjection.status !== 'load_projection_valid' && loadProjection.status !== 'load_projection_warning') {
    throw new Error('Cannot apply invalid or uncomputed Load-Projection state to SCIM context.');
  }
  return { ...context, load_model: loadProjection };
}
