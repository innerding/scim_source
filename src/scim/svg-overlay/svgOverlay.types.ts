import type { RouteScoreClass } from '../route-model/routeModel.types';

// ── SvgSegment ────────────────────────────────────────────────────────────────
// One road-network edge as a renderable segment for the app-side SVG overlay.
// Geometry is stored in geographic coordinates [lon, lat]; the app handles
// map projection (Leaflet) and color interpolation.

export interface SvgSegment {
  /** Matches GraphEdge.edge_id for cross-referencing. */
  edge_id: string;
  /** Full coordinate sequence [lon, lat] — mirrors the source GeoJsonLineString. */
  coordinates: [number, number][];
  /** Normalised load score 0–1 from RouteEdgeEvaluation.normalized_load_score. */
  load_value: number;
  /** Human-readable score class — used as fallback colour key by the app. */
  score_class: RouteScoreClass;
  /** First coordinate — used by app to anchor gradient direction. */
  from_coord: [number, number];
  /** Last coordinate — used by app to anchor gradient direction. */
  to_coord: [number, number];
  /** False = excluded by edge-type filter or masked; app should not render. */
  visible: boolean;
}

// ── SvgOverlayStatus ─────────────────────────────────────────────────────────

export type SvgOverlayStatus =
  | 'svg_overlay_valid'
  | 'svg_overlay_warning'
  | 'svg_overlay_invalid'
  | 'svg_overlay_empty';

// ── SvgOverlayIssue ───────────────────────────────────────────────────────────

export interface SvgOverlayIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  blocking: boolean;
}

// ── SvgOverlayValidationResult ────────────────────────────────────────────────

export interface SvgOverlayValidationResult {
  is_valid: boolean;
  errors: SvgOverlayIssue[];
  warnings: SvgOverlayIssue[];
  checked_at: string;
}

// ── SvgOverlayState ───────────────────────────────────────────────────────────
// Top-level result — embedded in ScimContext and later in SensusCorePackage.

export interface SvgOverlayState {
  svg_overlay_id: string;
  /** Back-reference to the RouteLayerModelState that generated the segments. */
  route_layer_model_id: string;
  /**
   * Bounding box of all visible segments [minLon, minLat, maxLon, maxLat].
   * App uses this for initial viewport positioning.
   */
  bbox: [number, number, number, number];
  segments: SvgSegment[];
  /** Count of segments where visible === true. */
  visible_segment_count: number;
  /** ISO timestamp at compute time. */
  generated_at: string;
  validation: SvgOverlayValidationResult;
  status: SvgOverlayStatus;
}
