import type { LoadProjectionState, LoadProjectionIssue, LoadProjectionValidationResult } from './loadProjection.types';
import type { GraphState } from '../graph/graph.types';
import type { ExtractionState } from '../extraction/extraction.types';

function err(code: string, message: string, field?: string, related_id?: string): LoadProjectionIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): LoadProjectionIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

export function validateLoadProjection(
  state: LoadProjectionState,
  graph: GraphState | undefined,
  extraction: ExtractionState | undefined,
): LoadProjectionValidationResult {
  const errors: LoadProjectionIssue[] = [];
  const warnings: LoadProjectionIssue[] = [];

  if (!graph) {
    errors.push(err('LP_GRAPH_MISSING', 'Graph is missing.', 'graph'));
  } else if (graph.status !== 'graph_valid' && graph.status !== 'graph_warning') {
    errors.push(err('LP_GRAPH_INVALID', `Graph status is '${graph.status}'.`, 'graph'));
  }

  if (!extraction) {
    errors.push(err('LP_EXTRACTION_MISSING', 'Extraction is missing.', 'extraction'));
  } else if (extraction.status !== 'extraction_valid' && extraction.status !== 'extraction_warning') {
    errors.push(err('LP_EXTRACTION_INVALID', `Extraction status is '${extraction.status}'.`, 'extraction'));
  }

  if (state.edge_load_scores.length === 0) {
    errors.push(err('LP_NO_EDGE_SCORES', 'No edge load scores computed.', 'edge_load_scores'));
  }

  for (const score of state.edge_load_scores) {
    if (score.normalized_load_score < 0 || score.normalized_load_score > 1) {
      errors.push(err('LP_LOAD_SCORE_OUT_OF_RANGE', `Edge ${score.edge_id}: normalized_load_score ${score.normalized_load_score} must be in [0, 1].`, 'edge_load_scores', score.edge_id));
    }
  }

  const total = state.metrics.projected_edge_count + state.metrics.masked_edge_count + state.metrics.unprojected_edge_count;
  if (total > 0 && state.metrics.masked_edge_count / total > 0.5) {
    warnings.push(warn('LP_HIGH_MASKED_RATIO', `${state.metrics.masked_edge_count} of ${total} edges are masked (>50%).`, 'metrics.masked_edge_count'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_graph_id: graph?.graph_id ?? 'missing',
    checked_against_extraction_id: extraction?.extraction_id ?? 'missing',
  };
}
