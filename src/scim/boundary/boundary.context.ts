import type { ScimContext } from '../context/scimContext.types';
import type { BoundaryState } from './boundary.types';

export function applyBoundaryToContext(
  context: ScimContext,
  boundary: BoundaryState,
): ScimContext {
  if (boundary.status !== 'boundary_valid' && boundary.status !== 'boundary_warning') {
    throw new Error('Cannot apply invalid or uncomputed Boundary state to SCIM context.');
  }
  return { ...context, boundary };
}
