import type { MovementModelState } from '../movement-model/movementModel.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';
import type { ScimClassificationMode } from '../context/scimContext.types';
import type { StayZoneDetectorState, DetectedStayZone, ZoneClassification } from './stayZoneDetector.types';
import { validateStayZoneDetector } from './stayZoneDetector.validation';

function makeId(): string {
  return `szd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function classifyZone(throughputRatio: number, sa: SystemAdjustState): ZoneClassification {
  const rastThreshold = sa.default_parameters.default_min_throughput_ratio_for_rast;
  const jamThreshold = sa.default_parameters.default_max_jam_throughput_ratio;
  if (throughputRatio >= rastThreshold) return 'rast';
  if (throughputRatio <= jamThreshold) return 'stau';
  return 'undecided';
}

export function computeStayZoneDetector(
  movementModel: MovementModelState,
  systemAdjust: SystemAdjustState,
  classificationMode: ScimClassificationMode,
): StayZoneDetectorState {
  const computed_at = new Date().toISOString();
  const detector_id = makeId();

  if (classificationMode === 'movement_only') {
    return {
      detector_id,
      movement_model_id: movementModel.movement_model_id,
      detected_zones: [],
      jam_count: 0,
      rast_count: 0,
      overlap_conflicts: [],
      step2_activation_condition_met: false,
      validation: { is_valid: true, errors: [], warnings: [], checked_at: computed_at },
      status: 'stay_zone_skipped',
      computed_at,
    };
  }

  // Identifiziere Kanten mit stay_candidate oder jam_detected
  const candidates = movementModel.edge_movement_states.filter(
    e => e.stay_candidate || e.jam_detected,
  );

  // Einfaches Clustering: je Kandidat eine Zone (Phase 5 — räumliches Cluster-Merging folgt in Phase 12)
  const zones: DetectedStayZone[] = candidates.map((edge, i) => {
    const classification = edge.jam_detected
      ? 'stau'
      : classifyZone(edge.throughput_ratio, systemAdjust);

    return {
      zone_id: `zone_${String(i + 1).padStart(3, '0')}`,
      center: { type: 'Point', coordinates: [0, 0] }, // Koordinaten: Phase 6 (poi-output) ergänzt
      radius_meters: Math.max(20, edge.density_score * 40),
      classification,
      throughput_ratio: edge.throughput_ratio,
      confidence_score: edge.confidence_score,
      edge_ids_within_radius: [edge.edge_id],
      is_off_path: false,
      overlap_conflict: false,
      operator_status: 'pending',
    };
  });

  // Überlappungs-Erkennung (Phase 5: vereinfacht über shared edges)
  const edgeSeen = new Map<string, string>();
  const overlap_conflicts: string[] = [];
  for (const zone of zones) {
    for (const edgeId of zone.edge_ids_within_radius) {
      const existing = edgeSeen.get(edgeId);
      if (existing) {
        if (!overlap_conflicts.includes(zone.zone_id)) overlap_conflicts.push(zone.zone_id);
        if (!overlap_conflicts.includes(existing)) overlap_conflicts.push(existing);
        zone.overlap_conflict = true;
        const other = zones.find(z => z.zone_id === existing);
        if (other) other.overlap_conflict = true;
      } else {
        edgeSeen.set(edgeId, zone.zone_id);
      }
    }
  }

  const jam_count = zones.filter(z => z.classification === 'stau').length;
  const rast_count = zones.filter(z => z.classification === 'rast').length;
  const step2_activation_condition_met = jam_count > 0;

  const partial: StayZoneDetectorState = {
    detector_id,
    movement_model_id: movementModel.movement_model_id,
    detected_zones: zones,
    jam_count,
    rast_count,
    overlap_conflicts,
    step2_activation_condition_met,
    validation: { is_valid: true, errors: [], warnings: [], checked_at: computed_at },
    status: 'stay_zone_valid',
    computed_at,
  };

  const validation = validateStayZoneDetector(partial);
  const status: StayZoneDetectorState['status'] = !validation.is_valid
    ? 'stay_zone_error'
    : validation.warnings.length > 0
      ? 'stay_zone_warning'
      : 'stay_zone_valid';

  return { ...partial, validation, status };
}
