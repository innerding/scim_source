import type { PoiModelState, PoiModelIssue, PoiModelValidationResult } from './poiOutput.types';
import type { StayZoneDetectorState } from '../stay-zone-detector/stayZoneDetector.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';

function err(code: string, message: string, field?: string, related_id?: string): PoiModelIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): PoiModelIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

export function validatePoiModel(
  state: PoiModelState,
  detector: StayZoneDetectorState | undefined,
  systemAdjust: SystemAdjustState | undefined,
): PoiModelValidationResult {
  const errors: PoiModelIssue[] = [];
  const warnings: PoiModelIssue[] = [];

  if (!detector) {
    errors.push(err('POI_DETECTOR_MISSING', 'StayZoneDetector state is missing.', 'detector'));
  } else if (detector.status === 'stay_zone_error') {
    errors.push(err('POI_DETECTOR_INVALID', `StayZoneDetector status is '${detector.status}'.`, 'detector'));
  }

  if (!systemAdjust) {
    errors.push(err('POI_SYSTEM_ADJUST_MISSING', 'System-Adjust is missing.', 'system_adjust'));
  }

  for (const poi of state.evaluated_pois) {
    if (poi.normalized_load_score < 0 || poi.normalized_load_score > 1) {
      errors.push(err('POI_LOAD_SCORE_OUT_OF_RANGE', `POI ${poi.poi_id}: normalized_load_score must be in [0, 1].`, 'evaluated_pois', poi.poi_id));
    }
    if (poi.confidence_score < 0 || poi.confidence_score > 1) {
      errors.push(err('POI_CONFIDENCE_INVALID', `POI ${poi.poi_id}: confidence_score must be in [0, 1].`, 'evaluated_pois', poi.poi_id));
    }
    if (poi.zone_radius_meters !== undefined && poi.zone_radius_meters <= 0) {
      errors.push(err('POI_ZONE_RADIUS_INVALID', `POI ${poi.poi_id}: zone_radius_meters must be > 0.`, 'evaluated_pois', poi.poi_id));
    }
    if (poi.is_off_path) {
      warnings.push(warn('POI_OFF_PATH', `POI ${poi.poi_id} is off-path — not used for routing (Sonderfall 2).`, 'evaluated_pois', poi.poi_id));
    }
    if (poi.overlap_flagged) {
      warnings.push(warn('POI_OVERLAP_FLAGGED', `POI ${poi.poi_id} has an overlap conflict (Sonderfall 1).`, 'evaluated_pois', poi.poi_id));
    }
  }

  if (state.evaluated_pois.length > 0 && state.evaluated_pois.every(p => p.privacy_masked)) {
    warnings.push(warn('POI_ALL_MASKED', 'All evaluated POIs are privacy-masked.', 'evaluated_pois'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_detector_id: detector?.detector_id ?? 'missing',
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
  };
}
