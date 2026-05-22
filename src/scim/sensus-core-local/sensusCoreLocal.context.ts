import type { ScimContext } from '../context/scimContext.types';
import type { SensusCoreLocalState } from './sensusCoreLocal.types';

export function applySensusCoreLocalToContext(context: ScimContext, local: SensusCoreLocalState): ScimContext {
  if (local.status !== 'local_context_valid' && local.status !== 'local_context_default') {
    throw new Error('Cannot apply invalid Sensus-Core Local Context to SCIM context.');
  }
  return { ...context, local_user_context: local };
}
