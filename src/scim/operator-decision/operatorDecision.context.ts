import type { ScimContext } from '../context/scimContext.types';
import type { OperatorDecisionState } from './operatorDecision.types';

export function applyOperatorDecisionToContext(
  ctx: ScimContext,
  state: OperatorDecisionState,
): ScimContext {
  if (state.status === 'operator_decision_invalid') {
    throw new Error(`Cannot apply OperatorDecisionState with status '${state.status}' to context.`);
  }
  return { ...ctx, operator_decision: state };
}
