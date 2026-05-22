import type { ExtractionState, ExtractionIssue, ExtractionValidationResult } from './extraction.types';
import type { BoundaryState } from '../boundary/boundary.types';
import type { RegioContentState } from '../regio-content/regioContent.types';
import type { TelcoLoadState } from '../telco-load/telcoLoad.types';

function err(code: string, message: string, field?: string, related_id?: string): ExtractionIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): ExtractionIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

export function validateExtraction(
  state: ExtractionState,
  boundary: BoundaryState | undefined,
  regioContent?: RegioContentState,
  telcoLoad?: TelcoLoadState,
): ExtractionValidationResult {
  const errors: ExtractionIssue[] = [];
  const warnings: ExtractionIssue[] = [];

  if (!boundary) {
    errors.push(err('EXT_BOUNDARY_MISSING', 'Boundary is missing.', 'boundary'));
  } else if (boundary.status !== 'boundary_valid' && boundary.status !== 'boundary_warning') {
    errors.push(err('EXT_BOUNDARY_INVALID', `Boundary status is '${boundary.status}'.`, 'boundary'));
  }

  if (!regioContent) {
    warnings.push(warn('EXT_REGIO_CONTENT_MISSING', 'Regio-Content is not available for extraction validation.', 'regio_content'));
  }

  if (!state.extraction_id) {
    errors.push(err('EXT_ID_MISSING', 'extraction_id is missing.', 'extraction_id'));
  }

  if (!state.boundary_id) {
    errors.push(err('EXT_BOUNDARY_ID_MISSING', 'boundary_id reference is missing.', 'boundary_id'));
  }

  if (boundary && state.boundary_id && state.boundary_id !== boundary.boundary_id) {
    errors.push(err('EXT_BOUNDARY_ID_MISMATCH', `extraction boundary_id '${state.boundary_id}' does not match boundary '${boundary.boundary_id}'.`, 'boundary_id'));
  }

  if (state.extracted_pois.length === 0 && (state.excluded_poi_count === 0)) {
    warnings.push(warn('EXT_NO_POI_EXTRACTED', 'No approved POIs were extracted.', 'extracted_pois'));
  }

  for (const poi of state.extracted_pois) {
    if (poi.effective_comparison_radius_meters !== poi.radius_meters + poi.comparison_margin_meters) {
      errors.push(err(
        'EXT_POI_RADIUS_MISMATCH',
        `POI ${poi.poi_id}: effective_comparison_radius_meters ${poi.effective_comparison_radius_meters} does not equal radius_meters + comparison_margin_meters.`,
        'extracted_pois',
        poi.poi_id,
      ));
    }
  }

  if (state.out_of_boundary_signal_count > 0) {
    warnings.push(warn('EXT_SIGNAL_OUT_OF_BOUNDARY', `${state.out_of_boundary_signal_count} signal group(s) are outside the boundary.`, 'extracted_signal_groups'));
  }

  if (state.extracted_signal_groups.length === 0 && !telcoLoad) {
    warnings.push(warn('EXT_NO_SIGNALS_EXTRACTED', 'No telco signal groups were extracted (no Telco-Load provided).', 'extracted_signal_groups'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_boundary_id: boundary?.boundary_id ?? 'missing',
    checked_against_regio_content_version: (regioContent as { regio_content_version?: string } | undefined)?.regio_content_version,
    checked_against_telco_load_batch_id: telcoLoad?.telco_load_batch_id,
  };
}
