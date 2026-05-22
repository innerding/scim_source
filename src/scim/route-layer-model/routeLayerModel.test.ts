import { describe, it, expect } from 'vitest';
import { mockRouteLayerModelState } from './routeLayerModel.mock';
import { validateRouteLayerModel } from './routeLayerModel.validation';
import { applyRouteLayerModelToContext } from './routeLayerModel.context';
import { mockRouteModelState } from '../route-model/routeModel.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('RouteLayerModel – 34.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateRouteLayerModel(mockRouteLayerModelState, mockRouteModelState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('RouteLayerModel – 34.2 route model missing', () => {
  it('produces RLM_ROUTE_MODEL_MISSING', () => {
    const result = validateRouteLayerModel(mockRouteLayerModelState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'RLM_ROUTE_MODEL_MISSING')).toBe(true);
  });
});

describe('RouteLayerModel – 34.3 no segments', () => {
  it('produces RLM_NO_SEGMENTS', () => {
    const state = { ...mockRouteLayerModelState, segments: [], visible_segment_count: 0 };
    const result = validateRouteLayerModel(state, mockRouteModelState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'RLM_NO_SEGMENTS')).toBe(true);
  });
});

describe('RouteLayerModel – 34.4 visible count mismatch', () => {
  it('produces RLM_VISIBLE_COUNT_MISMATCH', () => {
    const state = { ...mockRouteLayerModelState, visible_segment_count: 99 };
    const result = validateRouteLayerModel(state, mockRouteModelState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'RLM_VISIBLE_COUNT_MISMATCH')).toBe(true);
  });
});

describe('RouteLayerModel – 34.5 all invisible triggers warning', () => {
  it('produces RLM_ALL_INVISIBLE as warning', () => {
    const state = {
      ...mockRouteLayerModelState,
      segments: mockRouteLayerModelState.segments.map(s => ({ ...s, visible: false })),
      visible_segment_count: 0,
    };
    const result = validateRouteLayerModel(state, mockRouteModelState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'RLM_ALL_INVISIBLE')).toBe(true);
  });
});

describe('RouteLayerModel – 34.6 context protection', () => {
  it('writes only route_layer_model', () => {
    const context = makeEmptyContext();
    const updated = applyRouteLayerModelToContext(context, mockRouteLayerModelState);
    expect(updated.route_model).toBe(context.route_model);
    expect(updated.route_layer_model).toBe(mockRouteLayerModelState);
  });
});

describe('RouteLayerModel – 34.7 invalid status blocks apply', () => {
  it('throws when status is route_layer_model_invalid', () => {
    const state = { ...mockRouteLayerModelState, status: 'route_layer_model_invalid' as const };
    expect(() => applyRouteLayerModelToContext(makeEmptyContext(), state)).toThrow();
  });
});
