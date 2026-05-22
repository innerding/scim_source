import { describe, it, expect } from 'vitest';
import { mockExtractionState } from './extraction.mock';
import { validateExtraction } from './extraction.validation';
import { applyExtractionToContext } from './extraction.context';
import { mockBoundaryState } from '../boundary/boundary.mock';
import { mockRegioContentState } from '../regio-content/regioContent.mock';
import { mockTelcoLoadState } from '../telco-load/telcoLoad.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('Extraction – 26.1 valid mock passes validation', () => {
  it('mock state is valid with boundary, regio content and telco load', () => {
    const result = validateExtraction(mockExtractionState, mockBoundaryState, mockRegioContentState, mockTelcoLoadState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Extraction – 26.2 boundary missing', () => {
  it('produces EXT_BOUNDARY_MISSING', () => {
    const result = validateExtraction(mockExtractionState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EXT_BOUNDARY_MISSING')).toBe(true);
  });
});

describe('Extraction – 26.3 boundary invalid status', () => {
  it('produces EXT_BOUNDARY_INVALID', () => {
    const boundary = { ...mockBoundaryState, status: 'boundary_invalid' as const };
    const result = validateExtraction(mockExtractionState, boundary);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EXT_BOUNDARY_INVALID')).toBe(true);
  });
});

describe('Extraction – 26.4 boundary id mismatch', () => {
  it('produces EXT_BOUNDARY_ID_MISMATCH', () => {
    const state = { ...mockExtractionState, boundary_id: 'bnd_wrong_id' };
    const result = validateExtraction(state, mockBoundaryState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EXT_BOUNDARY_ID_MISMATCH')).toBe(true);
  });
});

describe('Extraction – 26.5 POI radius mismatch', () => {
  it('produces EXT_POI_RADIUS_MISMATCH when effective radius is wrong', () => {
    const state = {
      ...mockExtractionState,
      extracted_pois: [
        {
          ...mockExtractionState.extracted_pois[0],
          effective_comparison_radius_meters: 999,
        },
      ],
    };
    const result = validateExtraction(state, mockBoundaryState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EXT_POI_RADIUS_MISMATCH')).toBe(true);
  });
});

describe('Extraction – 26.6 out-of-boundary signals trigger warning', () => {
  it('produces EXT_SIGNAL_OUT_OF_BOUNDARY as warning', () => {
    const state = { ...mockExtractionState, out_of_boundary_signal_count: 2 };
    const result = validateExtraction(state, mockBoundaryState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'EXT_SIGNAL_OUT_OF_BOUNDARY')).toBe(true);
  });
});

describe('Extraction – 26.7 context protection', () => {
  it('does not mutate other context keys', () => {
    const context = makeEmptyContext();
    const updated = applyExtractionToContext(context, mockExtractionState);
    expect(updated.boundary).toBe(context.boundary);
    expect(updated.extracted_data).toBe(mockExtractionState);
  });
});

describe('Extraction – 26.8 invalid status blocks context apply', () => {
  it('throws when status is extraction_invalid', () => {
    const state = { ...mockExtractionState, status: 'extraction_invalid' as const };
    expect(() => applyExtractionToContext(makeEmptyContext(), state)).toThrow();
  });
});
