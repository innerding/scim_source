import type { ScimContext } from '../context/scimContext.types';
import type { ScimRuntimeContextState } from './scimRuntimeContext.types';

export function applyScimRuntimeContextToContext(context: ScimContext, runtimeCtx: ScimRuntimeContextState): ScimContext {
  if (runtimeCtx.status !== 'runtime_context_valid' && runtimeCtx.status !== 'runtime_context_warning') {
    throw new Error('Cannot apply invalid or unassembled SCIM Runtime Context to SCIM context.');
  }
  return { ...context, scim_context: runtimeCtx };
}
