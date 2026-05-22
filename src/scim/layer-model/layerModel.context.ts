import type { ScimContext } from '../context/scimContext.types';
import type { LayerModelState } from './layerModel.types';

export function applyLayerModelToContext(context: ScimContext, layerModel: LayerModelState): ScimContext {
  if (layerModel.status !== 'layer_model_valid' && layerModel.status !== 'layer_model_warning') {
    throw new Error('Cannot apply invalid or unbuilt Layer-Model state to SCIM context.');
  }
  return { ...context, layer_model: layerModel };
}
