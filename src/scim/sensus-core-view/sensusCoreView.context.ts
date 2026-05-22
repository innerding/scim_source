import type { ScimContext } from '../context/scimContext.types';
import type { SensusCoreViewState } from './sensusCoreView.types';

export function applySensusCoreViewToContext(context: ScimContext, viewState: SensusCoreViewState): ScimContext {
  if (viewState.status !== 'view_active') {
    throw new Error('Cannot apply inactive or errored Sensus-Core View State to SCIM context.');
  }
  return { ...context, view_state: viewState };
}
