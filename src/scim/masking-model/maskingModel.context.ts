import type { ScimContext } from '../context/scimContext.types';
import type { MaskingModelState } from './maskingModel.types';

export function applyMaskingModelToContext(context: ScimContext, maskingModel: MaskingModelState): ScimContext {
  if (maskingModel.status !== 'masking_model_valid' && maskingModel.status !== 'masking_model_warning') {
    throw new Error('Cannot apply invalid or uncomputed Masking-Model state to SCIM context.');
  }
  return { ...context, masking_model: maskingModel };
}
