import { describe, it, expect } from 'vitest';
import { mockPoiModelState } from './poiModel.mock';
import { validatePoiModel } from './poiModel.validation';
import { applyPoiModelToContext } from './poiModel.context';
import { mockExtractionState } from '../extraction/extraction.mock';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('PoiModel – 29.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validatePoiModel(mockPoiModelState, mockExtractionState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('PoiModel – 29.2 extraction missing', () => {
  it('produces POI_EXTRACTION_MISSING', () => {
    const result = validatePoiModel(mockPoiModelState, undefined, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'POI_EXTRACTION_MISSING')).toBe(true);
  });
});

describe('PoiModel – 29.3 system adjust missing', () => {
  it('produces POI_SYSTEM_ADJUST_MISSING', () => {
    const result = validatePoiModel(mockPoiModelState, mockExtractionState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'POI_SYSTEM_ADJUST_MISSING')).toBe(true);
  });
});

describe('PoiModel – 29.4 load score out of range', () => {
  it('produces POI_LOAD_SCORE_OUT_OF_RANGE', () => {
    const state = {
      ...mockPoiModelState,
      evaluated_pois: [{ ...mockPoiModelState.evaluated_pois[0], normalized_load_score: 1.5 }],
    };
    const result = validatePoiModel(state, mockExtractionState, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'POI_LOAD_SCORE_OUT_OF_RANGE')).toBe(true);
  });
});

describe('PoiModel – 29.5 all masked triggers warning', () => {
  it('produces POI_ALL_MASKED as warning', () => {
    const state = {
      ...mockPoiModelState,
      evaluated_pois: [{ ...mockPoiModelState.evaluated_pois[0], privacy_masked: true }],
    };
    const result = validatePoiModel(state, mockExtractionState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'POI_ALL_MASKED')).toBe(true);
  });
});

describe('PoiModel – 29.6 context protection', () => {
  it('writes only poi_model', () => {
    const context = makeEmptyContext();
    const updated = applyPoiModelToContext(context, mockPoiModelState);
    expect(updated.extracted_data).toBe(context.extracted_data);
    expect(updated.poi_model).toBe(mockPoiModelState);
  });
});

describe('PoiModel – 29.7 invalid status blocks apply', () => {
  it('throws when status is poi_model_invalid', () => {
    const state = { ...mockPoiModelState, status: 'poi_model_invalid' as const };
    expect(() => applyPoiModelToContext(makeEmptyContext(), state)).toThrow();
  });
});
