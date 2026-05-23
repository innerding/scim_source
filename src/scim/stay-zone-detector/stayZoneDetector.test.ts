import { describe, it, expect } from 'vitest';
import { mockStayZoneDetectorState, mockStayZoneDetectorSkipped } from './stayZoneDetector.mock';
import { validateStayZoneDetector } from './stayZoneDetector.validation';
import { computeStayZoneDetector } from './stayZoneDetector.compute';
import { applyStayZoneDetectorToContext } from './stayZoneDetector.context';
import { mockMovementModelState } from '../movement-model/movementModel.mock';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { makeEmptyContext } from '../context/scimContext.types';

// ── 40.1 Valid mock ───────────────────────────────────────────────────────────

describe('StayZoneDetector – 40.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateStayZoneDetector(mockStayZoneDetectorState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('mock skipped state is valid', () => {
    const result = validateStayZoneDetector(mockStayZoneDetectorSkipped);
    expect(result.is_valid).toBe(true);
  });
});

// ── 40.2 Metrik-Konsistenz ────────────────────────────────────────────────────

describe('StayZoneDetector – 40.2 metric consistency', () => {
  it('blocks jam_count mismatch', () => {
    const state = { ...mockStayZoneDetectorState, jam_count: 5 };
    const result = validateStayZoneDetector(state);
    expect(result.errors.some(e => e.code === 'SZD_JAM_COUNT_MISMATCH')).toBe(true);
  });

  it('blocks rast_count mismatch', () => {
    const state = { ...mockStayZoneDetectorState, rast_count: 0 };
    const result = validateStayZoneDetector(state);
    expect(result.errors.some(e => e.code === 'SZD_RAST_COUNT_MISMATCH')).toBe(true);
  });

  it('blocks step2_activation_condition_met inconsistency', () => {
    const state = { ...mockStayZoneDetectorState, step2_activation_condition_met: true };
    const result = validateStayZoneDetector(state);
    expect(result.errors.some(e => e.code === 'SZD_STEP2_FLAG_MISMATCH')).toBe(true);
  });
});

// ── 40.3 Zonen-Validierung ────────────────────────────────────────────────────

describe('StayZoneDetector – 40.3 zone validation', () => {
  it('blocks zone with radius_meters <= 0', () => {
    const state = {
      ...mockStayZoneDetectorState,
      detected_zones: [{ ...mockStayZoneDetectorState.detected_zones[0], radius_meters: 0 }],
    };
    const result = validateStayZoneDetector(state);
    expect(result.errors.some(e => e.code === 'SZD_ZONE_RADIUS_INVALID')).toBe(true);
  });

  it('blocks zone with no edges', () => {
    const state = {
      ...mockStayZoneDetectorState,
      detected_zones: [{ ...mockStayZoneDetectorState.detected_zones[0], edge_ids_within_radius: [] }],
    };
    const result = validateStayZoneDetector(state);
    expect(result.errors.some(e => e.code === 'SZD_ZONE_NO_EDGES')).toBe(true);
  });

  it('warns for stau zone awaiting operator commit', () => {
    const state = {
      ...mockStayZoneDetectorState,
      detected_zones: [{
        ...mockStayZoneDetectorState.detected_zones[0],
        classification: 'stau' as const,
        throughput_ratio: 0.1,
        operator_status: 'pending' as const,
      }],
      jam_count: 1,
      rast_count: 0,
      step2_activation_condition_met: true,
    };
    const result = validateStayZoneDetector(state);
    expect(result.warnings.some(w => w.code === 'SZD_STAU_AWAITING_OPERATOR')).toBe(true);
  });
});

// ── 40.4 Compute: movement_only überspringt ───────────────────────────────────

describe('StayZoneDetector – 40.4 compute skips in movement_only', () => {
  it('returns skipped status when classification_mode is movement_only', () => {
    const result = computeStayZoneDetector(mockMovementModelState, mockSystemAdjustState, 'movement_only');
    expect(result.status).toBe('stay_zone_skipped');
    expect(result.detected_zones).toHaveLength(0);
    expect(result.step2_activation_condition_met).toBe(false);
  });
});

// ── 40.5 Compute: Rast-Erkennung ──────────────────────────────────────────────

describe('StayZoneDetector – 40.5 compute detects rast zone', () => {
  it('detects one rast zone from mock movement model (e_003 is stay_candidate)', () => {
    const result = computeStayZoneDetector(mockMovementModelState, mockSystemAdjustState, 'movement_and_stay');
    expect(result.status).toBe('stay_zone_valid');
    expect(result.rast_count).toBe(1);
    expect(result.jam_count).toBe(0);
    expect(result.step2_activation_condition_met).toBe(false);
    expect(result.detected_zones[0].classification).toBe('rast');
    expect(result.detected_zones[0].edge_ids_within_radius).toContain('e_003');
  });
});

// ── 40.6 Compute: Stau aktiviert step2 ───────────────────────────────────────

describe('StayZoneDetector – 40.6 compute sets step2 on jam', () => {
  it('step2_activation_condition_met=true when a jam edge exists', () => {
    const mmWithJam = {
      ...mockMovementModelState,
      edge_movement_states: mockMovementModelState.edge_movement_states.map(e =>
        e.edge_id === 'e_003'
          ? { ...e, jam_detected: true, stay_candidate: false, throughput_ratio: 0.05 }
          : e,
      ),
      metrics: { ...mockMovementModelState.metrics, jam_edge_count: 1, stay_candidate_edge_count: 0 },
    };
    const result = computeStayZoneDetector(mmWithJam, mockSystemAdjustState, 'movement_and_stay');
    expect(result.jam_count).toBe(1);
    expect(result.step2_activation_condition_met).toBe(true);
    expect(result.detected_zones[0].classification).toBe('stau');
  });
});

// ── 40.7 Context ─────────────────────────────────────────────────────────────

describe('StayZoneDetector – 40.7 context apply', () => {
  it('writes stay_zone_detector and step2_activation_condition_met to context', () => {
    const ctx = makeEmptyContext();
    const updated = applyStayZoneDetectorToContext(ctx, mockStayZoneDetectorState);
    expect(updated.stay_zone_detector).toBe(mockStayZoneDetectorState);
    expect(updated.step2_activation_condition_met).toBe(false);
  });

  it('skipped state is accepted by context apply', () => {
    const ctx = makeEmptyContext();
    const updated = applyStayZoneDetectorToContext(ctx, mockStayZoneDetectorSkipped);
    expect(updated.stay_zone_detector).toBe(mockStayZoneDetectorSkipped);
    expect(updated.step2_activation_condition_met).toBe(false);
  });

  it('throws when state is stay_zone_error', () => {
    const invalid = { ...mockStayZoneDetectorState, status: 'stay_zone_error' as const };
    expect(() => applyStayZoneDetectorToContext(makeEmptyContext(), invalid)).toThrow();
  });

  it('does not mutate other context keys', () => {
    const ctx = { ...makeEmptyContext(), system_adjust: { status: 'system_adjust_valid' } };
    const updated = applyStayZoneDetectorToContext(ctx, mockStayZoneDetectorState);
    expect(updated.system_adjust).toBe(ctx.system_adjust);
  });
});
