import { describe, it, expect } from 'vitest';
import { mockPoiModelState } from './poiOutput.mock';
import { validatePoiModel } from './poiOutput.validation';
import { applyPoiModelToContext } from './poiOutput.context';
import { mockStayZoneDetectorState, mockStayZoneDetectorSkipped } from '../stay-zone-detector/stayZoneDetector.mock';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { makeEmptyContext } from '../context/scimContext.types';

// ── 35.1 Valid mock ───────────────────────────────────────────────────────────

describe('PoiOutput – 35.1 valid mock passes validation', () => {
  it('mock state is valid with detector', () => {
    const result = validatePoiModel(mockPoiModelState, mockStayZoneDetectorState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ── 35.2 Detector missing / invalid ──────────────────────────────────────────

describe('PoiOutput – 35.2 detector missing', () => {
  it('blocks when detector is missing', () => {
    const result = validatePoiModel(mockPoiModelState, undefined, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'POI_DETECTOR_MISSING')).toBe(true);
  });

  it('blocks when detector status is stay_zone_error', () => {
    const invalid = { ...mockStayZoneDetectorState, status: 'stay_zone_error' as const };
    const result = validatePoiModel(mockPoiModelState, invalid, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'POI_DETECTOR_INVALID')).toBe(true);
  });

  it('accepts skipped detector (movement_only mode)', () => {
    const result = validatePoiModel(mockPoiModelState, mockStayZoneDetectorSkipped, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
  });
});

// ── 35.3 Neue Felder ──────────────────────────────────────────────────────────

describe('PoiOutput – 35.3 new Transform Geometries fields', () => {
  it('mock POI has zone_radius_meters, zone_center, is_off_path, operator_confirmed, overlap_flagged', () => {
    const poi = mockPoiModelState.evaluated_pois[0];
    expect(poi.zone_radius_meters).toBe(35);
    expect(poi.zone_center).toBeDefined();
    expect(poi.is_off_path).toBe(false);
    expect(poi.operator_confirmed).toBe(false);
    expect(poi.overlap_flagged).toBe(false);
  });

  it('warns for off-path POI (Sonderfall 2)', () => {
    const state = {
      ...mockPoiModelState,
      evaluated_pois: [{ ...mockPoiModelState.evaluated_pois[0], is_off_path: true }],
    };
    const result = validatePoiModel(state, mockStayZoneDetectorState, mockSystemAdjustState);
    expect(result.warnings.some(w => w.code === 'POI_OFF_PATH')).toBe(true);
  });

  it('warns for overlap-flagged POI (Sonderfall 1)', () => {
    const state = {
      ...mockPoiModelState,
      evaluated_pois: [{ ...mockPoiModelState.evaluated_pois[0], overlap_flagged: true }],
    };
    const result = validatePoiModel(state, mockStayZoneDetectorState, mockSystemAdjustState);
    expect(result.warnings.some(w => w.code === 'POI_OVERLAP_FLAGGED')).toBe(true);
  });

  it('blocks zone_radius_meters <= 0', () => {
    const state = {
      ...mockPoiModelState,
      evaluated_pois: [{ ...mockPoiModelState.evaluated_pois[0], zone_radius_meters: 0 }],
    };
    const result = validatePoiModel(state, mockStayZoneDetectorState, mockSystemAdjustState);
    expect(result.errors.some(e => e.code === 'POI_ZONE_RADIUS_INVALID')).toBe(true);
  });
});

// ── 35.4 Context ─────────────────────────────────────────────────────────────

describe('PoiOutput – 35.4 context apply', () => {
  it('writes poi_model to context', () => {
    const ctx = makeEmptyContext();
    const updated = applyPoiModelToContext(ctx, mockPoiModelState);
    expect(updated.poi_model).toBe(mockPoiModelState);
  });

  it('does not mutate other context keys', () => {
    const ctx = { ...makeEmptyContext(), system_adjust: { status: 'system_adjust_valid' } };
    const updated = applyPoiModelToContext(ctx, mockPoiModelState);
    expect(updated.system_adjust).toBe(ctx.system_adjust);
  });

  it('throws when status is poi_model_invalid', () => {
    const invalid = { ...mockPoiModelState, status: 'poi_model_invalid' as const };
    expect(() => applyPoiModelToContext(makeEmptyContext(), invalid)).toThrow();
  });
});
