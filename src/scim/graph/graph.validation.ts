import type { GraphState, GraphIssue, GraphValidationResult } from './graph.types';
import type { BoundaryState } from '../boundary/boundary.types';
import type { ExtractionState } from '../extraction/extraction.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';

function err(code: string, message: string, field?: string, related_id?: string): GraphIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): GraphIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

export function validateGraph(
  state: GraphState,
  boundary: BoundaryState | undefined,
  extraction?: ExtractionState,
  systemAdjust?: SystemAdjustState,
): GraphValidationResult {
  const errors: GraphIssue[] = [];
  const warnings: GraphIssue[] = [];

  if (!boundary) {
    errors.push(err('GRAPH_BOUNDARY_MISSING', 'Boundary is missing.', 'boundary'));
  } else if (boundary.status !== 'boundary_valid' && boundary.status !== 'boundary_warning') {
    errors.push(err('GRAPH_BOUNDARY_INVALID', `Boundary status is '${boundary.status}'.`, 'boundary'));
  }

  if (!state.graph_id) {
    errors.push(err('GRAPH_ID_MISSING', 'graph_id is missing.', 'graph_id'));
  }

  if (state.nodes.length === 0) {
    errors.push(err('GRAPH_NO_NODES', 'Graph contains no nodes.', 'nodes'));
  }

  if (state.edges.length === 0) {
    errors.push(err('GRAPH_NO_EDGES', 'Graph contains no edges.', 'edges'));
  }

  if (state.metrics.connected_components > 1) {
    warnings.push(warn('GRAPH_DISCONNECTED', `Graph has ${state.metrics.connected_components} connected components (not fully connected).`, 'metrics.connected_components'));
  }

  if (systemAdjust) {
    const minEdgeLength = systemAdjust.privacy_limits.min_visible_edge_length_meters;
    for (const edge of state.edges) {
      if (edge.length_meters < minEdgeLength) {
        errors.push(err(
          'GRAPH_EDGE_BELOW_MIN_LENGTH',
          `Edge ${edge.edge_id}: length_meters ${edge.length_meters} < system min ${minEdgeLength}.`,
          'edges',
          edge.edge_id,
        ));
      }
    }
  }

  const nodeIdsWithEdges = new Set<string>();
  for (const edge of state.edges) {
    nodeIdsWithEdges.add(edge.from_node_id);
    nodeIdsWithEdges.add(edge.to_node_id);
  }
  for (const node of state.nodes) {
    if (!nodeIdsWithEdges.has(node.node_id)) {
      warnings.push(warn('GRAPH_NODE_ORPHAN', `Node ${node.node_id} has no connected edges.`, 'nodes', node.node_id));
    }
  }

  if (state.metrics.poi_anchor_count === 0) {
    warnings.push(warn('GRAPH_NO_POI_ANCHOR', 'Graph has no POI anchor nodes.', 'nodes'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_boundary_id: boundary?.boundary_id ?? 'missing',
    checked_against_extraction_id: extraction?.extraction_id,
  };
}
