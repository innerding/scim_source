import type { PoiModelState, PoiModelIssue, PoiModelValidationResult } from './poiModel.types';
import type { ExtractionState } from '../extraction/extraction.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';

function err(code: string, message: string, field?: string, related_id?: string): PoiModelIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): PoiModelIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

export function validatePoiModel(
  state: PoiModelState,
  extraction: ExtractionState | undefined,
  systemAdjust: SystemAdjustState | undefined,
): PoiModelValidationResult {
  const errors: PoiModelIssue[] = [];
  const warnings: PoiModelIssue[] = [];

  if (!extraction) {
    errors.push(err('POI_EXTRACTION_MISSING', 'Extraction is missing.', 'extraction'));
  } else if (extraction.status !== 'extraction_valid' && extraction.status !== 'extraction_warning') {
    errors.push(err('POI_EXTRACTION_INVALID', `Extraction status is '${extraction.status}'.`, 'extraction'));
  }

  if (!systemAdjust) {
    errors.push(err('POI_SYSTEM_ADJUST_MISSING', 'System-Adjust is missing.', 'system_adjust'));
  }

  for (const poi of state.evaluated_pois) {
    if (poi.normalized_load_score < 0 || poi.normalized_load_score > 1) {
      errors.push(err('POI_LOAD_SCORE_OUT_OF_RANGE', `POI ${poi.poi_id}: normalized_load_score ${poi.normalized_load_score} must be in [0, 1].`, 'evaluated_pois', poi.poi_id));
    }
    if (poi.confidence_score < 0 || poi.confidence_score > 1) {
      errors.push(err('POI_CONFIDENCE_INVALID', `POI ${poi.poi_id}: confidence_score ${poi.confidence_score} must be in [0, 1].`, 'evaluated_pois', poi.poi_id));
    }
  }

  if (state.evaluated_pois.length > 0 && state.evaluated_pois.every(p => p.privacy_masked)) {
    warnings.push(warn('POI_ALL_MASKED', 'All evaluated POIs are privacy-masked.', 'evaluated_pois'));
  }

  if (state.evaluated_pois.some(p => !p.signal_count_sufficient)) {
    warnings.push(warn('POI_NO_SIGNAL_COVERAGE', 'One or more POIs have insufficient signal coverage.', 'evaluated_pois'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_extraction_id: extraction?.extraction_id ?? 'missing',
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
  };
}
