import type { MovementModelState } from '../movement-model/movementModel.types';
import type { OperatorZoneState } from '../operator-zone/operatorZone.types';
import type {
  ClassifiedSignalPoint,
  SignalCategory,
  SignalClassificationReason,
  SignalCategorySummary,
  SignalInterpretationState,
} from './signalInterpretation.types';

const DEFAULT_THRESHOLDS = {
  min_throughput_for_flow: 0.60,
  max_throughput_for_accumulation: 0.30,
  min_density_for_accumulation: 0.50,
};

/**
 * Classifies each edge from the MovementModel as a signal point.
 *
 * Classification logic (in priority order):
 *  1. operator_zone_forced  — edge is within an active operator zone
 *     that forces accumulation
 *  2. high_throughput_ratio — throughput_ratio >= min_throughput_for_flow → flow
 *  3. low_throughput_high_density — throughput <= max_acc AND density >= min_density → accumulation
 *  4. below_threshold_ambiguous — throughput <= max_acc AND density < min_density → ambiguous
 *  5. conflicting_signals — between the two thresholds → ambiguous
 */
export function computeSignalInterpretation(
  movementModel: MovementModelState | undefined,
  operatorZones: OperatorZoneState | undefined,
  thresholds = DEFAULT_THRESHOLDS,
): SignalInterpretationState {
  const now = new Date().toISOString();
  const { min_throughput_for_flow, max_throughput_for_accumulation, min_density_for_accumulation } = thresholds;

  // Build a set of edge IDs forced to accumulation by active operator zones.
  // OperatorDefinedZone carries edge_ids indirectly — for now we use
  // StayZoneDetector edge_ids_within_radius if available. Since we only have
  // operator_zones here, we mark any zone with exclude_from_routing=true
  // as a forcing zone and tag all edges that are "stay_candidates" in the
  // movement model as potentially forced.
  const forcingZones = (operatorZones?.zones ?? []).filter(
    (z) => z.exclude_from_routing && z.temporal_scope !== undefined,
  );
  const hasForcingZones = forcingZones.length > 0;

  const edges = movementModel?.edge_movement_states ?? [];
  const classified: ClassifiedSignalPoint[] = edges.map((edge, idx) => {
    // Placeholder geometry — edge geometry lives in GraphState, not MovementModel.
    const geometry = { type: 'Point' as const, coordinates: [0, 0] as [number, number] };

    let category: SignalCategory;
    let reason: SignalClassificationReason;
    let forced_by_zone_id: string | undefined;

    // Rule 1: operator zone forces accumulation for stay_candidates
    if (hasForcingZones && edge.stay_candidate) {
      category = 'accumulation';
      reason = 'operator_zone_forced';
      forced_by_zone_id = forcingZones[0].zone_id; // simplified: first matching zone
    }
    // Rule 2: clear flow
    else if (edge.throughput_ratio >= min_throughput_for_flow) {
      category = 'flow';
      reason = 'high_throughput_ratio';
    }
    // Rule 3: accumulation (low throughput + sufficient density)
    else if (
      edge.throughput_ratio <= max_throughput_for_accumulation &&
      edge.density_score >= min_density_for_accumulation
    ) {
      category = 'accumulation';
      reason = 'low_throughput_high_density';
    }
    // Rule 4: below threshold — density too low to confirm accumulation
    else if (edge.throughput_ratio <= max_throughput_for_accumulation) {
      category = 'ambiguous';
      reason = 'below_threshold_ambiguous';
    }
    // Rule 5: in the gap between thresholds — conflicting signals
    else {
      category = 'ambiguous';
      reason = 'conflicting_signals';
    }

    const point: ClassifiedSignalPoint = {
      point_id: `sp_${edge.edge_id}_${idx}`,
      geometry,
      raw_load_score: edge.normalized_movement_score,
      density_score: edge.density_score,
      throughput_ratio: edge.throughput_ratio,
      category,
      reason,
    };
    if (forced_by_zone_id) point.forced_by_zone_id = forced_by_zone_id;
    return point;
  });

  const summary: SignalCategorySummary = {
    flow_count: classified.filter((p) => p.category === 'flow').length,
    accumulation_count: classified.filter((p) => p.category === 'accumulation').length,
    ambiguous_count: classified.filter((p) => p.category === 'ambiguous').length,
    forced_by_zone_count: classified.filter((p) => p.forced_by_zone_id).length,
  };

  return {
    interpretation_id: `si_${Date.now()}`,
    classified_points: classified,
    summary,
    thresholds,
    validation: { is_valid: true, errors: [], warnings: [] },
    status: 'signal_interpretation_valid',
    evaluated_at: now,
  };
}
