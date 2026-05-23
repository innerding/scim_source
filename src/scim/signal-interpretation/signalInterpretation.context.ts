import type { ScimContext } from '../context/scimContext.types';
import type { SignalInterpretationState } from './signalInterpretation.types';

export function applySignalInterpretationToContext(
  ctx: ScimContext,
  state: SignalInterpretationState,
): ScimContext {
  if (state.status === 'signal_interpretation_invalid') {
    throw new Error(
      `Cannot apply SignalInterpretationState with status '${state.status}' to context.`,
    );
  }
  return { ...ctx, signal_interpretation: state };
}
