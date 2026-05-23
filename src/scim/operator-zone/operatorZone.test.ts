import { describe, it, expect } from 'vitest';
import {
  mockOperatorZoneState,
  mockOperatorZoneStateWithExpired,
  mockZoneRestArea,
  mockZoneEventArea,
} from './operatorZone.mock';
import { validateOperatorZones } from './operatorZone.validation';
import { applyOperatorZonesToContext } from './operatorZone.context';
import { makeEmptyContext } from '../context/scimContext.types';

// Festes Datum für reproduzierbare Tests (vor dem Event-Datum 2026-06-06)
const NOW = '2026-05-23T12:00:00.000Z';

// ── 40.1 Valid mock ───────────────────────────────────────────────────────────

describe('OperatorZone – 40.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateOperatorZones(mockOperatorZoneState, NOW);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('mock has 2 active zones (rest_area + viewpoint; event noch pending)', () => {
    const result = validateOperatorZones(mockOperatorZoneState, NOW);
    expect(result.active_zone_count).toBe(2);
    expect(result.expired_zone_count).toBe(0);
  });
});

// ── 40.2 Ablaufwarnungen ──────────────────────────────────────────────────────

describe('OperatorZone – 40.2 expired zone warning', () => {
  it('warns for expired zone', () => {
    const result = validateOperatorZones(mockOperatorZoneStateWithExpired, NOW);
    expect(result.warnings.some(w => w.code === 'OZ_ZONE_EXPIRED')).toBe(true);
  });

  it('expired zone reduces active_zone_count', () => {
    const result = validateOperatorZones(mockOperatorZoneStateWithExpired, NOW);
    expect(result.expired_zone_count).toBe(1);
  });

  it('warns for pending zone (valid_from in Zukunft)', () => {
    const result = validateOperatorZones(mockOperatorZoneState, NOW);
    expect(result.warnings.some(w => w.code === 'OZ_ZONE_STARTS_IN_FUTURE')).toBe(true);
  });
});

// ── 40.3 Validierungsfehler ───────────────────────────────────────────────────

describe('OperatorZone – 40.3 validation errors', () => {
  it('blocks when radius_meters is 0', () => {
    const state = {
      ...mockOperatorZoneState,
      zones: [{ ...mockZoneRestArea, radius_meters: 0 }],
    };
    const result = validateOperatorZones(state, NOW);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'OZ_RADIUS_INVALID')).toBe(true);
  });

  it('blocks when seasonal zone has no valid_from/valid_until', () => {
    const state = {
      ...mockOperatorZoneState,
      zones: [{ ...mockZoneRestArea, temporal_scope: 'seasonal' as const }],
    };
    const result = validateOperatorZones(state, NOW);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'OZ_TEMPORAL_WITHOUT_DATES')).toBe(true);
  });

  it('blocks when valid_until is before valid_from', () => {
    const state = {
      ...mockOperatorZoneState,
      zones: [{
        ...mockZoneEventArea,
        valid_from: '2026-06-08T00:00:00.000Z',
        valid_until: '2026-06-06T00:00:00.000Z',
      }],
    };
    const result = validateOperatorZones(state, NOW);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'OZ_TEMPORAL_INVALID_RANGE')).toBe(true);
  });
});

// ── 40.4 Warnungen auf State-Ebene ────────────────────────────────────────────

describe('OperatorZone – 40.4 state-level warnings', () => {
  it('warns when operator_only_basis is true', () => {
    const result = validateOperatorZones(mockOperatorZoneState, NOW);
    expect(result.warnings.some(w => w.code === 'OZ_OPERATOR_ONLY_BASIS')).toBe(true);
  });

  it('warns when no zones defined', () => {
    const state = { ...mockOperatorZoneState, zones: [], active_zone_count: 0, expired_zone_count: 0, pending_zone_count: 0 };
    const result = validateOperatorZones(state, NOW);
    expect(result.warnings.some(w => w.code === 'OZ_NO_ZONES')).toBe(true);
  });

  it('warns when more than 50 zones defined', () => {
    const manyZones = Array.from({ length: 51 }, (_, i) => ({
      ...mockZoneRestArea,
      zone_id: `oz_${String(i).padStart(3, '0')}`,
    }));
    const state = { ...mockOperatorZoneState, zones: manyZones, active_zone_count: 51 };
    const result = validateOperatorZones(state, NOW);
    expect(result.warnings.some(w => w.code === 'OZ_HIGH_ZONE_COUNT')).toBe(true);
  });
});

// ── 40.5 Context ─────────────────────────────────────────────────────────────

describe('OperatorZone – 40.5 context apply', () => {
  it('writes operator_zones to context', () => {
    const ctx = makeEmptyContext();
    const updated = applyOperatorZonesToContext(ctx, mockOperatorZoneState);
    expect(updated.operator_zones).toBe(mockOperatorZoneState);
  });

  it('does not mutate other context keys', () => {
    const ctx = { ...makeEmptyContext(), system_adjust: { status: 'system_adjust_valid' } };
    const updated = applyOperatorZonesToContext(ctx, mockOperatorZoneState);
    expect(updated.system_adjust).toBe(ctx.system_adjust);
  });

  it('throws when status is operator_zone_invalid', () => {
    const invalid = { ...mockOperatorZoneState, status: 'operator_zone_invalid' as const };
    expect(() => applyOperatorZonesToContext(makeEmptyContext(), invalid)).toThrow();
  });
});
