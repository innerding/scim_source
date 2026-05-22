import { describe, it, expect } from 'vitest';
import { mockRegioContentState } from './regioContent.mock';
import { validateRegioContent } from './regioContent.validation';
import { applyRegioContentToContext } from './regioContent.context';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { makeEmptyContext } from '../context/scimContext.types';
import type { RegioContentState } from './regioContent.types';

function clone(overrides: Partial<RegioContentState>): RegioContentState {
  return { ...mockRegioContentState, ...overrides };
}

// ── 21.1 Valid mock ───────────────────────────────────────────────────────────

describe('RegioContent validation — valid mock', () => {
  it('mock state passes validation', () => {
    const result = validateRegioContent(mockRegioContentState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(mockRegioContentState.status).toBe('regio_content_valid');
  });
});

// ── 21.2 System-Adjust missing ────────────────────────────────────────────────

describe('RegioContent validation — system_adjust missing', () => {
  it('blocks when system_adjust is undefined', () => {
    const result = validateRegioContent(mockRegioContentState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'REGIO_SYSTEM_ADJUST_MISSING')).toBe(true);
  });
});

// ── 21.3 Radius out of range ──────────────────────────────────────────────────

describe('RegioContent validation — poi radius out of range', () => {
  it('blocks approved POI with radius outside system_adjust range', () => {
    const state = clone({
      approved_pois: [
        { ...mockRegioContentState.approved_pois[0], radius_meters: 9999 },
      ],
    });
    const result = validateRegioContent(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'REGIO_POI_RADIUS_OUT_OF_RANGE')).toBe(true);
  });
});

// ── 21.4 Radius not confirmed ─────────────────────────────────────────────────

describe('RegioContent validation — radius not confirmed', () => {
  it('blocks when approved POI radius is not confirmed', () => {
    const state = clone({
      poi_radii: [
        { ...mockRegioContentState.poi_radii[0], radius_status: 'suggested' },
      ],
    });
    const result = validateRegioContent(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'REGIO_POI_RADIUS_NOT_CONFIRMED')).toBe(true);
  });
});

// ── 21.5 Rejected POI duplicate ───────────────────────────────────────────────

describe('RegioContent validation — rejected POI duplicate', () => {
  it('blocks POI that appears in both approved and rejected lists', () => {
    const state = clone({
      rejected_pois: [
        { ...mockRegioContentState.rejected_pois[0], poi_id: 'poi_001' },
      ],
    });
    const result = validateRegioContent(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'REGIO_REJECTED_POI_DUPLICATE_WITH_APPROVED')).toBe(true);
  });
});

// ── 21.6 Pending POI becomes active ──────────────────────────────────────────

describe('RegioContent validation — pending POI active', () => {
  it('blocks pending POI with status approved', () => {
    const state = clone({
      pending_pois: [
        { ...mockRegioContentState.pending_pois[0], status: 'approved' } as typeof mockRegioContentState.pending_pois[0],
      ],
    });
    const result = validateRegioContent(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'REGIO_PENDING_POI_ACTIVE_FORBIDDEN')).toBe(true);
  });
});

// ── 21.7 Regional parameter out of range ──────────────────────────────────────

describe('RegioContent validation — regional parameter out of range', () => {
  it('blocks stay_density_ratio outside system_adjust range', () => {
    const state = clone({
      regional_parameters: {
        ...mockRegioContentState.regional_parameters,
        stay_density_ratio: 99,
      },
    });
    const result = validateRegioContent(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'REGIO_PARAMETER_OUT_OF_RANGE')).toBe(true);
  });
});

// ── 21.8 Route logic inconsistent ────────────────────────────────────────────

describe('RegioContent validation — route logic inconsistent', () => {
  it('blocks degrade > exclude threshold', () => {
    const state = clone({
      regional_parameters: {
        ...mockRegioContentState.regional_parameters,
        route_degrade_threshold: 0.95,
        route_exclude_threshold: 0.8,
      },
    });
    const result = validateRegioContent(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'REGIO_DEGRADE_EXCEEDS_EXCLUDE')).toBe(true);
  });
});

// ── 21.9 Draft blocks runtime ─────────────────────────────────────────────────

describe('RegioContent validation — draft release', () => {
  it('blocks when release_status is draft', () => {
    const state = clone({
      release: { ...mockRegioContentState.release, release_status: 'draft' },
    });
    const result = validateRegioContent(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'REGIO_RELEASE_NOT_RELEASED')).toBe(true);
  });

  it('applyRegioContentToContext throws on draft status', () => {
    const state = clone({ status: 'regio_content_draft' });
    expect(() => applyRegioContentToContext(makeEmptyContext(), state)).toThrow();
  });
});

// ── 21.10 Context protection ──────────────────────────────────────────────────

describe('RegioContent context apply', () => {
  it('writes only regio_content and leaves other context keys intact', () => {
    const sa = { status: 'system_adjust_valid' };
    const graph = { status: 'graph_valid' };
    const target = { status: 'target_app_ui_valid' };
    const ctx = { ...makeEmptyContext(), system_adjust: sa, graph, target_app_ui: target };
    const ctxAfter = applyRegioContentToContext(ctx, mockRegioContentState);
    expect(ctxAfter.regio_content).toBe(mockRegioContentState);
    expect(ctxAfter.system_adjust).toBe(sa);
    expect(ctxAfter.graph).toBe(graph);
    expect(ctxAfter.target_app_ui).toBe(target);
  });
});
