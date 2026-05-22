import type { ScimContext } from '../context/scimContext.types';
import type { MovementModelState } from './movementModel.types';

export function applyMovementModelToContext(context: ScimContext, movementModel: MovementModelState): ScimContext {
  if (movementModel.status !== 'movement_model_valid' && movementModel.status !== 'movement_model_warning') {
    throw new Error('Cannot apply invalid or uncomputed Movement-Model state to SCIM context.');
  }
  return { ...context, movement_model: movementModel };
}
