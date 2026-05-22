import type { ScimContext } from '../context/scimContext.types';
import type { RouteLayerModelState } from './routeLayerModel.types';

export function applyRouteLayerModelToContext(context: ScimContext, routeLayerModel: RouteLayerModelState): ScimContext {
  if (routeLayerModel.status !== 'route_layer_model_valid' && routeLayerModel.status !== 'route_layer_model_warning') {
    throw new Error('Cannot apply invalid or unbuilt Route-Layer-Model state to SCIM context.');
  }
  return { ...context, route_layer_model: routeLayerModel };
}
