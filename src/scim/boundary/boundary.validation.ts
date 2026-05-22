import type { BoundaryState, BoundaryIssue, BoundaryValidationResult } from './boundary.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';
import type { RegioContentState } from '../regio-content/regioContent.types';

function err(code: string, message: string, field?: string): BoundaryIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): BoundaryIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateBoundary(
  state: BoundaryState,
  systemAdjust: SystemAdjustState | undefined,
  regioContent?: RegioContentState,
): BoundaryValidationResult {
  const errors: BoundaryIssue[] = [];
  const warnings: BoundaryIssue[] = [];

  if (!systemAdjust) {
    errors.push(err('BND_SYSTEM_ADJUST_MISSING', 'System-Adjust is missing.', 'system_adjust'));
  } else if (systemAdjust.status !== 'system_adjust_valid' && systemAdjust.status !== 'system_adjust_warning') {
    errors.push(err('BND_SYSTEM_ADJUST_INVALID', `System-Adjust status is '${systemAdjust.status}'.`, 'system_adjust'));
  }

  if (!regioContent) {
    errors.push(err('BND_REGIO_CONTENT_MISSING', 'Regio-Content is missing.', 'regio_content'));
  } else if (regioContent.status !== 'regio_content_valid' && regioContent.status !== 'regio_content_warning') {
    errors.push(err('BND_REGIO_CONTENT_INVALID', `Regio-Content status is '${regioContent.status}'.`, 'regio_content'));
  }

  if (!state.boundary_id) {
    errors.push(err('BND_BOUNDARY_ID_MISSING', 'boundary_id is missing.', 'boundary_id'));
  }

  if (!state.computed_boundary) {
    errors.push(err('BND_GEOMETRY_MISSING', 'computed_boundary is missing.', 'computed_boundary'));
  } else {
    if (!state.computed_boundary.geometry) {
      errors.push(err('BND_GEOMETRY_MISSING', 'computed_boundary.geometry is missing.', 'computed_boundary.geometry'));
    }
    const bbox = state.computed_boundary.bbox;
    if (!bbox || bbox.length !== 4 || bbox[2] <= bbox[0] || bbox[3] <= bbox[1]) {
      errors.push(err('BND_BBOX_INVALID', 'computed_boundary.bbox is invalid (minLon >= maxLon or minLat >= maxLat).', 'computed_boundary.bbox'));
    }
  }

  if (systemAdjust && (systemAdjust.status === 'system_adjust_valid' || systemAdjust.status === 'system_adjust_warning')) {
    const range = systemAdjust.allowed_ranges.boundary_buffer_meters;
    const buf = state.buffer_spec.computed_buffer_meters;

    if (buf < range.min) {
      errors.push(err('BND_BUFFER_BELOW_SYSTEM_MIN', `computed_buffer_meters ${buf} < system min ${range.min}.`, 'buffer_spec.computed_buffer_meters'));
    }
    if (buf > range.max) {
      errors.push(err('BND_BUFFER_ABOVE_SYSTEM_MAX', `computed_buffer_meters ${buf} > system max ${range.max}.`, 'buffer_spec.computed_buffer_meters'));
    }
  }

  if (state.poi_count_within === 0) {
    warnings.push(warn('BND_NO_POI_WITHIN_BOUNDARY', 'No approved POIs are within the computed boundary.', 'poi_count_within'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
    checked_against_regio_content_version: (regioContent as { regio_content_version?: string } | undefined)?.regio_content_version,
  };
}
