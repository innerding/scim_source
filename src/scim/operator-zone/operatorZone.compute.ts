import type { OperatorZoneState } from './operatorZone.types';

/**
 * Computes a baseline OperatorZone state for the pipeline.
 *
 * Operator zones are defined interactively via the P05 form and are
 * not auto-derived from signals. This function returns an empty-zone
 * state so the pipeline can proceed without blocking.
 *
 * In a production system the P05 form state would be passed in via
 * ScimPipelineInputs.operator_zones and applied directly — the compute
 * step here acts as a safe fallback when no zones have been defined yet.
 */
export function computeOperatorZones(): OperatorZoneState {
  const now = new Date().toISOString();
  return {
    zone_set_id: `ozs_${Date.now()}`,
    zones: [],
    active_zone_count: 0,
    expired_zone_count: 0,
    pending_zone_count: 0,
    operator_only_basis: false,
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      active_zone_count: 0,
      expired_zone_count: 0,
    },
    status: 'not_evaluated',
    evaluated_at: now,
  };
}
