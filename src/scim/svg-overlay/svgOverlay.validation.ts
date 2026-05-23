import type { SvgOverlayState, SvgOverlayIssue, SvgOverlayValidationResult } from './svgOverlay.types';

export function validateSvgOverlay(state: SvgOverlayState): SvgOverlayValidationResult {
  const errors: SvgOverlayIssue[] = [];
  const warnings: SvgOverlayIssue[] = [];

  if (!state.svg_overlay_id) {
    errors.push({
      code: 'SVG_MISSING_ID',
      severity: 'error',
      message: 'svg_overlay_id is missing.',
      blocking: true,
    });
  }

  if (!state.route_layer_model_id) {
    errors.push({
      code: 'SVG_MISSING_ROUTE_LAYER_ID',
      severity: 'error',
      message: 'route_layer_model_id is missing — SVG overlay cannot be traced to its source.',
      blocking: true,
    });
  }

  if (!Array.isArray(state.segments)) {
    errors.push({
      code: 'SVG_SEGMENTS_NOT_ARRAY',
      severity: 'error',
      message: 'segments must be an array.',
      blocking: true,
    });
  } else {
    if (state.segments.length === 0) {
      warnings.push({
        code: 'SVG_EMPTY',
        severity: 'warning',
        message: 'No segments produced — the SVG overlay will be blank.',
        blocking: false,
      });
    }

    // Spot-check a sample of segments for structural validity
    const sample = state.segments.slice(0, 10);
    for (const seg of sample) {
      if (!seg.edge_id) {
        errors.push({
          code: 'SVG_SEGMENT_NO_EDGE_ID',
          severity: 'error',
          message: `A segment is missing edge_id.`,
          blocking: true,
        });
        break;
      }
      if (!Array.isArray(seg.coordinates) || seg.coordinates.length < 2) {
        warnings.push({
          code: 'SVG_SEGMENT_SHORT_COORDINATES',
          severity: 'warning',
          message: `Segment ${seg.edge_id} has fewer than 2 coordinates.`,
          blocking: false,
        });
      }
      if (seg.load_value < 0 || seg.load_value > 1) {
        warnings.push({
          code: 'SVG_SEGMENT_LOAD_OUT_OF_RANGE',
          severity: 'warning',
          message: `Segment ${seg.edge_id} has load_value ${seg.load_value} outside [0, 1].`,
          blocking: false,
        });
      }
    }
  }

  // Carry over any errors/warnings already attached by the compute step
  for (const e of state.validation?.errors ?? []) {
    if (!errors.find((x) => x.code === e.code)) errors.push(e);
  }
  for (const w of state.validation?.warnings ?? []) {
    if (!warnings.find((x) => x.code === w.code)) warnings.push(w);
  }

  return {
    is_valid: errors.filter((e) => e.blocking).length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
  };
}
