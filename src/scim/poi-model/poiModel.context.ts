import type { ScimContext } from '../context/scimContext.types';
import type { PoiModelState } from './poiModel.types';

export function applyPoiModelToContext(context: ScimContext, poiModel: PoiModelState): ScimContext {
  if (poiModel.status !== 'poi_model_valid' && poiModel.status !== 'poi_model_warning') {
    throw new Error('Cannot apply invalid or uncomputed POI-Model state to SCIM context.');
  }
  return { ...context, poi_model: poiModel };
}
