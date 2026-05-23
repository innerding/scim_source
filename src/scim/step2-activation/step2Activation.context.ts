import type { ScimContext } from '../context/scimContext.types';
import type { Step2ActivationState } from './step2Activation.types';

export function applyStep2ActivationToContext(
  ctx: ScimContext,
  state: Step2ActivationState,
): ScimContext {
  if (state.status === 'step2_activation_invalid') {
    throw new Error(`Cannot apply Step2ActivationState with status '${state.status}' to context.`);
  }
  return {
    ...ctx,
    step2_activation: state,
    classification_mode: state.resulting_classification_mode,
  };
}
