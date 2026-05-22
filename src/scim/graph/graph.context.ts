import type { ScimContext } from '../context/scimContext.types';
import type { GraphState } from './graph.types';

export function applyGraphToContext(
  context: ScimContext,
  graph: GraphState,
): ScimContext {
  if (graph.status !== 'graph_valid' && graph.status !== 'graph_warning') {
    throw new Error('Cannot apply invalid or unbuilt Graph state to SCIM context.');
  }
  return { ...context, graph };
}
