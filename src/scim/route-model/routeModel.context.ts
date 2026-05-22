import type { ScimContext } from '../context/scimContext.types';
import type { RouteModelState } from './routeModel.types';

export function applyRouteModelToContext(context: ScimContext, routeModel: RouteModelState): ScimContext {
  if (routeModel.status !== 'route_model_valid' && routeModel.status !== 'route_model_warning') {
    throw new Error('Cannot apply invalid or uncomputed Route-Model state to SCIM context.');
  }
  return { ...context, route_model: routeModel };
}
