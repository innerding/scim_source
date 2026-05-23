import type { StayZoneDetectorState, StayZoneDetectorValidationResult, StayZoneDetectorIssue } from './stayZoneDetector.types';

function err(code: string, message: string, field?: string, related_id?: string): StayZoneDetectorIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): StayZoneDetectorIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

export function validateStayZoneDetector(state: StayZoneDetectorState): StayZoneDetectorValidationResult {
  const errors: StayZoneDetectorIssue[] = [];
  const warnings: StayZoneDetectorIssue[] = [];

  if (state.status === 'stay_zone_skipped') {
    return { is_valid: true, errors: [], warnings: [], checked_at: new Date().toISOString() };
  }

  // Metrik-Konsistenz
  const actualJam = state.detected_zones.filter(z => z.classification === 'stau').length;
  if (actualJam !== state.jam_count) {
    errors.push(err('SZD_JAM_COUNT_MISMATCH', `jam_count=${state.jam_count} does not match actual stau zones=${actualJam}.`, 'jam_count'));
  }

  const actualRast = state.detected_zones.filter(z => z.classification === 'rast').length;
  if (actualRast !== state.rast_count) {
    errors.push(err('SZD_RAST_COUNT_MISMATCH', `rast_count=${state.rast_count} does not match actual rast zones=${actualRast}.`, 'rast_count'));
  }

  const expectedStep2 = actualJam > 0;
  if (state.step2_activation_condition_met !== expectedStep2) {
    errors.push(err('SZD_STEP2_FLAG_MISMATCH', `step2_activation_condition_met=${state.step2_activation_condition_met} but jam_count=${actualJam}.`, 'step2_activation_condition_met'));
  }

  // Einzelne Zonen
  for (const zone of state.detected_zones) {
    if (zone.radius_meters <= 0) {
      errors.push(err('SZD_ZONE_RADIUS_INVALID', `Zone ${zone.zone_id}: radius_meters must be > 0.`, 'detected_zones', zone.zone_id));
    }
    if (zone.throughput_ratio < 0 || zone.throughput_ratio > 1) {
      errors.push(err('SZD_ZONE_THROUGHPUT_OUT_OF_RANGE', `Zone ${zone.zone_id}: throughput_ratio ${zone.throughput_ratio} must be in [0, 1].`, 'detected_zones', zone.zone_id));
    }
    if (zone.confidence_score < 0 || zone.confidence_score > 1) {
      errors.push(err('SZD_ZONE_CONFIDENCE_OUT_OF_RANGE', `Zone ${zone.zone_id}: confidence_score must be in [0, 1].`, 'detected_zones', zone.zone_id));
    }
    if (zone.edge_ids_within_radius.length === 0) {
      errors.push(err('SZD_ZONE_NO_EDGES', `Zone ${zone.zone_id}: no edges within radius.`, 'detected_zones', zone.zone_id));
    }
    if (zone.classification === 'stau' && zone.operator_status === 'pending') {
      warnings.push(warn('SZD_STAU_AWAITING_OPERATOR', `Zone ${zone.zone_id}: Stau detected — Operator-Commit ausstehend (Sonderfall 3).`, 'detected_zones', zone.zone_id));
    }
    if (zone.overlap_conflict && !state.overlap_conflicts.includes(zone.zone_id)) {
      errors.push(err('SZD_OVERLAP_CONFLICT_NOT_REGISTERED', `Zone ${zone.zone_id}: overlap_conflict=true but zone_id missing in overlap_conflicts list.`, 'detected_zones', zone.zone_id));
    }
    if (zone.confidence_score < 0.5) {
      warnings.push(warn('SZD_LOW_CONFIDENCE', `Zone ${zone.zone_id}: confidence_score ${zone.confidence_score} is low.`, 'detected_zones', zone.zone_id));
    }
  }

  if (state.overlap_conflicts.length > 0) {
    warnings.push(warn('SZD_OVERLAP_CONFLICTS_PRESENT', `${state.overlap_conflicts.length} overlap conflict(s) require Operator action (Sonderfall 1).`, 'overlap_conflicts'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
  };
}
