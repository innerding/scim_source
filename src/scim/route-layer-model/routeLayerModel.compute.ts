import type { RouteLayerModelState } from './routeLayerModel.types';
import type { GraphEdgeType } from '../graph/graph.types';

/**
 * Applies the SVG overlay edge-type filter from SystemAdjust to a RouteLayerModelState.
 *
 * Segments whose `edge_type` is in `excluded` are set to `visible: false`.
 * The `visible_segment_count` and `excluded_edge_types` fields are updated accordingly.
 *
 * This is a pure transformation — the input state is not mutated.
 */
export function applyEdgeTypeFilter(
  state: RouteLayerModelState,
  excluded: GraphEdgeType[],
): RouteLayerModelState {
  if (excluded.length === 0) {
    return { ...state, excluded_edge_types: [] };
  }

  const excludedSet = new Set<GraphEdgeType>(excluded);
  const segments = state.segments.map((seg) =>
    excludedSet.has(seg.edge_type) ? { ...seg, visible: false } : seg,
  );
  const visible_segment_count = segments.filter((s) => s.visible).length;

  return {
    ...state,
    segments,
    visible_segment_count,
    excluded_edge_types: excluded,
  };
}
