import type { MovementModelState, MovementModelIssue, MovementModelValidationResult } from './movementModel.types';
import type { GraphState } from '../graph/graph.types';
import type { LoadProjectionState } from '../load-projection/loadProjection.types';

function err(code: string, message: string, field?: string, related_id?: string): MovementModelIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): MovementModelIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

export function validateMovementModel(
  state: MovementModelState,
  graph: GraphState | undefined,
  loadProjection: LoadProjectionState | undefined,
): MovementModelValidationResult {
  const errors: MovementModelIssue[] = [];
  const warnings: MovementModelIssue[] = [];

  if (!graph) {
    errors.push(err('MM_GRAPH_MISSING', 'Graph is missing.', 'graph'));
  } else if (graph.status !== 'graph_valid' && graph.status !== 'graph_warning') {
    errors.push(err('MM_GRAPH_INVALID', `Graph status is '${graph.status}'.`, 'graph'));
  }

  if (!loadProjection) {
    errors.push(err('MM_LOAD_PROJECTION_MISSING', 'Load-Projection is missing.', 'load_projection'));
  } else if (loadProjection.status !== 'load_projection_valid' && loadProjection.status !== 'load_projection_warning') {
    errors.push(err('MM_LOAD_PROJECTION_INVALID', `Load-Projection status is '${loadProjection.status}'.`, 'load_projection'));
  }

  for (const edge of state.edge_movement_states) {
    const sum = edge.movement_ratio + edge.stillness_ratio;
    if (Math.abs(sum - 1.0) > 0.05) {
      errors.push(err('MM_RATIO_SUM_INVALID', `Edge ${edge.edge_id}: movement_ratio + stillness_ratio = ${sum.toFixed(3)}, expected ~1.0.`, 'edge_movement_states', edge.edge_id));
    }
    if (edge.normalized_movement_score < 0 || edge.normalized_movement_score > 1) {
      errors.push(err('MM_MOVEMENT_SCORE_OUT_OF_RANGE', `Edge ${edge.edge_id}: normalized_movement_score ${edge.normalized_movement_score} must be in [0, 1].`, 'edge_movement_states', edge.edge_id));
    }
  }

  if (state.edge_movement_states.length > 0 && state.edge_movement_states.every(e => e.movement_class === 'static')) {
    warnings.push(warn('MM_ALL_STATIC', 'All edges have static movement class — no movement detected.', 'edge_movement_states'));
  }

  const total = state.metrics.evaluated_edge_count;
  if (total > 0 && state.metrics.masked_edge_count / total > 0.5) {
    warnings.push(warn('MM_HIGH_MASKED_RATIO', `${state.metrics.masked_edge_count} of ${total} edges masked (>50%).`, 'metrics'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_graph_id: graph?.graph_id ?? 'missing',
    checked_against_load_projection_id: loadProjection?.load_projection_id ?? 'missing',
  };
}
