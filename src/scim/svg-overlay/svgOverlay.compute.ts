import type { RouteLayerModelState } from '../route-layer-model/routeLayerModel.types';
import type { RouteModelState } from '../route-model/routeModel.types';
import type { GraphState } from '../graph/graph.types';
import type { BBox } from '../context/scimContext.types';
import type {
  SvgSegment,
  SvgOverlayState,
  SvgOverlayStatus,
  SvgOverlayIssue,
  SvgOverlayValidationResult,
} from './svgOverlay.types';

// ── Internal helpers ──────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

/**
 * Expand [minLon, minLat, maxLon, maxLat] bbox to include a coordinate.
 */
function expandBbox(
  bbox: [number, number, number, number],
  coord: [number, number],
): [number, number, number, number] {
  return [
    Math.min(bbox[0], coord[0]),
    Math.min(bbox[1], coord[1]),
    Math.max(bbox[2], coord[0]),
    Math.max(bbox[3], coord[1]),
  ];
}

function makeValidation(
  errors: SvgOverlayIssue[],
  warnings: SvgOverlayIssue[],
): SvgOverlayValidationResult {
  return {
    is_valid: errors.filter((e) => e.blocking).length === 0,
    errors,
    warnings,
    checked_at: now(),
  };
}

function resolveStatus(
  validation: SvgOverlayValidationResult,
  visibleCount: number,
): SvgOverlayStatus {
  if (!validation.is_valid) return 'svg_overlay_invalid';
  if (visibleCount === 0)   return 'svg_overlay_empty';
  if (validation.warnings.length > 0) return 'svg_overlay_warning';
  return 'svg_overlay_valid';
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Derive an SvgOverlayState from the already-computed route layer model.
 *
 * Algorithm:
 * 1. Join RouteLayerSegment (visibility + score_class) with
 *    RouteEdgeEvaluation (normalized_load_score) by edge_id.
 * 2. Resolve the geographic geometry from GraphEdge.
 * 3. Extract from_coord / to_coord from the coordinate sequence.
 * 4. Accumulate a bounding box over all visible coordinates.
 * 5. Validate and assign status.
 *
 * Segments for edges not found in the graph or route model are skipped with
 * a warning — this handles partial graph builds gracefully.
 */
export function computeSvgOverlay(
  routeLayerModel: RouteLayerModelState,
  routeModel: RouteModelState,
  graph: GraphState,
  _bbox: BBox,                     // kept for API symmetry; we derive the live bbox
): SvgOverlayState {
  const errors: SvgOverlayIssue[] = [];
  const warnings: SvgOverlayIssue[] = [];

  // Fast-lookup maps
  const edgeById = new Map(graph.edges.map((e) => [e.edge_id, e]));
  const evalById = new Map(routeModel.edge_evaluations.map((ev) => [ev.edge_id, ev]));

  const segments: SvgSegment[] = [];
  let bbox: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  let skipped = 0;

  for (const seg of routeLayerModel.segments) {
    const edge = edgeById.get(seg.edge_id);
    if (!edge) {
      skipped++;
      continue;
    }

    const coords = edge.geometry.coordinates as [number, number][];
    if (coords.length < 2) {
      skipped++;
      continue;
    }

    const evaluation = evalById.get(seg.edge_id);
    // If no evaluation exists, treat as unknown load (0.5) — non-blocking
    const load_value = evaluation?.normalized_load_score ?? 0.5;

    const from_coord = coords[0];
    const to_coord   = coords[coords.length - 1];

    // Only expand bbox for visible segments — invisible ones should not drive
    // the viewport in the app.
    if (seg.visible) {
      for (const coord of coords) {
        bbox = expandBbox(bbox, coord);
      }
    }

    segments.push({
      edge_id:     seg.edge_id,
      coordinates: coords,
      load_value:  Math.min(1, Math.max(0, load_value)),
      score_class: seg.score_class,
      from_coord,
      to_coord,
      visible: seg.visible,
    });
  }

  if (skipped > 0) {
    warnings.push({
      code: 'SVG_EDGE_NOT_FOUND',
      severity: 'warning',
      message: `${skipped} segment(s) skipped — edge_id not found in graph or geometry too short.`,
      blocking: false,
    });
  }

  // Guard: if bbox was never expanded (no visible segments), fall back to
  // the supplied pipeline bbox so the app still gets a usable viewport.
  const finalBbox: [number, number, number, number] =
    bbox[0] === Infinity
      ? _bbox
      : bbox;

  const visibleCount = segments.filter((s) => s.visible).length;

  if (segments.length === 0) {
    errors.push({
      code: 'SVG_NO_SEGMENTS',
      severity: 'error',
      message: 'No segments could be produced from the route layer model.',
      blocking: true,
    });
  }

  const validation = makeValidation(errors, warnings);
  const status     = resolveStatus(validation, visibleCount);

  return {
    svg_overlay_id:       `svo_${routeLayerModel.route_layer_model_id}_${Date.now()}`,
    route_layer_model_id: routeLayerModel.route_layer_model_id,
    bbox:                 finalBbox,
    segments,
    visible_segment_count: visibleCount,
    generated_at:         now(),
    validation,
    status,
  };
}
