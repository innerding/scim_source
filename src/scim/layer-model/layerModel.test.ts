import { describe, it, expect } from 'vitest';
import { mockLayerModelState } from './layerModel.mock';
import { validateLayerModel } from './layerModel.validation';
import { applyLayerModelToContext } from './layerModel.context';
import { mockRouteLayerModelState } from '../route-layer-model/routeLayerModel.mock';
import { mockBasisLayerState } from '../basis-layer/basisLayer.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('LayerModel – 35.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateLayerModel(mockLayerModelState, mockRouteLayerModelState, mockBasisLayerState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('LayerModel – 35.2 no layers', () => {
  it('produces LM_NO_LAYERS', () => {
    const state = { ...mockLayerModelState, layers: [], visible_layer_count: 0 };
    const result = validateLayerModel(state, mockRouteLayerModelState, mockBasisLayerState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LM_NO_LAYERS')).toBe(true);
  });
});

describe('LayerModel – 35.3 duplicate layer id', () => {
  it('produces LM_DUPLICATE_LAYER_ID', () => {
    const state = {
      ...mockLayerModelState,
      layers: [
        mockLayerModelState.layers[0],
        { ...mockLayerModelState.layers[1], layer_id: 'layer_osm_base' },
      ],
      visible_layer_count: 2,
    };
    const result = validateLayerModel(state, mockRouteLayerModelState, mockBasisLayerState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LM_DUPLICATE_LAYER_ID')).toBe(true);
  });
});

describe('LayerModel – 35.4 visible count mismatch', () => {
  it('produces LM_VISIBLE_COUNT_MISMATCH', () => {
    const state = { ...mockLayerModelState, visible_layer_count: 99 };
    const result = validateLayerModel(state, mockRouteLayerModelState, mockBasisLayerState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LM_VISIBLE_COUNT_MISMATCH')).toBe(true);
  });
});

describe('LayerModel – 35.5 all layers invisible triggers warning', () => {
  it('produces LM_ALL_LAYERS_INVISIBLE as warning', () => {
    const state = {
      ...mockLayerModelState,
      layers: mockLayerModelState.layers.map(l => ({ ...l, visible: false })),
      visible_layer_count: 0,
    };
    const result = validateLayerModel(state, mockRouteLayerModelState, mockBasisLayerState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'LM_ALL_LAYERS_INVISIBLE')).toBe(true);
  });
});

describe('LayerModel – 35.6 route layer missing triggers warning', () => {
  it('produces LM_ROUTE_LAYER_MISSING as warning (not error)', () => {
    const result = validateLayerModel(mockLayerModelState, undefined, mockBasisLayerState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'LM_ROUTE_LAYER_MISSING')).toBe(true);
  });
});

describe('LayerModel – 35.7 context protection', () => {
  it('writes only layer_model', () => {
    const context = makeEmptyContext();
    const updated = applyLayerModelToContext(context, mockLayerModelState);
    expect(updated.route_layer_model).toBe(context.route_layer_model);
    expect(updated.layer_model).toBe(mockLayerModelState);
  });
});

describe('LayerModel – 35.8 invalid status blocks apply', () => {
  it('throws when status is layer_model_invalid', () => {
    const state = { ...mockLayerModelState, status: 'layer_model_invalid' as const };
    expect(() => applyLayerModelToContext(makeEmptyContext(), state)).toThrow();
  });
});
