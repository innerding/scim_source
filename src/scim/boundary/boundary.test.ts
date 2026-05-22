import { describe, it, expect } from 'vitest';
import { mockBoundaryState } from './boundary.mock';
import { validateBoundary } from './boundary.validation';
import { applyBoundaryToContext } from './boundary.context';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { mockRegioContentState } from '../regio-content/regioContent.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('Boundary – 25.1 valid mock passes validation', () => {
  it('mock state is valid with system adjust and regio content', () => {
    const result = validateBoundary(mockBoundaryState, mockSystemAdjustState, mockRegioContentState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Boundary – 25.2 system adjust missing', () => {
  it('produces BND_SYSTEM_ADJUST_MISSING', () => {
    const result = validateBoundary(mockBoundaryState, undefined, mockRegioContentState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'BND_SYSTEM_ADJUST_MISSING')).toBe(true);
  });
});

describe('Boundary – 25.3 regio content missing', () => {
  it('produces BND_REGIO_CONTENT_MISSING', () => {
    const result = validateBoundary(mockBoundaryState, mockSystemAdjustState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'BND_REGIO_CONTENT_MISSING')).toBe(true);
  });
});

describe('Boundary – 25.4 buffer below system minimum', () => {
  it('produces BND_BUFFER_BELOW_SYSTEM_MIN', () => {
    const state = {
      ...mockBoundaryState,
      buffer_spec: { ...mockBoundaryState.buffer_spec, computed_buffer_meters: 50 },
    };
    const result = validateBoundary(state, mockSystemAdjustState, mockRegioContentState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'BND_BUFFER_BELOW_SYSTEM_MIN')).toBe(true);
  });
});

describe('Boundary – 25.5 buffer above system maximum', () => {
  it('produces BND_BUFFER_ABOVE_SYSTEM_MAX', () => {
    const state = {
      ...mockBoundaryState,
      buffer_spec: { ...mockBoundaryState.buffer_spec, computed_buffer_meters: 999 },
    };
    const result = validateBoundary(state, mockSystemAdjustState, mockRegioContentState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'BND_BUFFER_ABOVE_SYSTEM_MAX')).toBe(true);
  });
});

describe('Boundary – 25.6 invalid bbox', () => {
  it('produces BND_BBOX_INVALID when maxLon <= minLon', () => {
    const state = {
      ...mockBoundaryState,
      computed_boundary: {
        ...mockBoundaryState.computed_boundary,
        bbox: [15.4, 47.5, 15.0, 47.8] as [number, number, number, number],
      },
    };
    const result = validateBoundary(state, mockSystemAdjustState, mockRegioContentState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'BND_BBOX_INVALID')).toBe(true);
  });
});

describe('Boundary – 25.7 no POI within boundary triggers warning', () => {
  it('produces BND_NO_POI_WITHIN_BOUNDARY as warning (not error)', () => {
    const state = { ...mockBoundaryState, poi_count_within: 0 };
    const result = validateBoundary(state, mockSystemAdjustState, mockRegioContentState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'BND_NO_POI_WITHIN_BOUNDARY')).toBe(true);
  });
});

describe('Boundary – 25.8 context protection', () => {
  it('does not mutate other context keys', () => {
    const context = makeEmptyContext();
    const updated = applyBoundaryToContext(context, mockBoundaryState);
    expect(updated.system_adjust).toBe(context.system_adjust);
    expect(updated.regio_content).toBe(context.regio_content);
    expect(updated.boundary).toBe(mockBoundaryState);
  });
});

describe('Boundary – 25.9 invalid status blocks context apply', () => {
  it('throws when status is boundary_invalid', () => {
    const state = { ...mockBoundaryState, status: 'boundary_invalid' as const };
    expect(() => applyBoundaryToContext(makeEmptyContext(), state)).toThrow();
  });
});
