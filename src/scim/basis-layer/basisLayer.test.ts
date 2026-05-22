import { describe, it, expect } from 'vitest';
import { mockBasisLayerState } from './basisLayer.mock';
import { validateBasisLayer } from './basisLayer.validation';
import { applyBasisLayerToContext } from './basisLayer.context';
import { mockBoundaryState } from '../boundary/boundary.mock';
import { mockGraphState } from '../graph/graph.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('BasisLayer – 28.1 valid mock passes validation', () => {
  it('mock state is valid with boundary and graph', () => {
    const result = validateBasisLayer(mockBasisLayerState, mockBoundaryState, mockGraphState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('BasisLayer – 28.2 boundary missing', () => {
  it('produces BL_BOUNDARY_MISSING', () => {
    const result = validateBasisLayer(mockBasisLayerState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'BL_BOUNDARY_MISSING')).toBe(true);
  });
});

describe('BasisLayer – 28.3 no tile layers', () => {
  it('produces BL_NO_TILE_LAYERS', () => {
    const state = { ...mockBasisLayerState, tile_layers: [] };
    const result = validateBasisLayer(state, mockBoundaryState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'BL_NO_TILE_LAYERS')).toBe(true);
  });
});

describe('BasisLayer – 28.4 duplicate tile layer id', () => {
  it('produces BL_DUPLICATE_TILE_LAYER_ID', () => {
    const state = {
      ...mockBasisLayerState,
      tile_layers: [
        mockBasisLayerState.tile_layers[0],
        { ...mockBasisLayerState.tile_layers[1], tile_layer_id: 'tl_osm_base' },
      ],
    };
    const result = validateBasisLayer(state, mockBoundaryState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'BL_DUPLICATE_TILE_LAYER_ID')).toBe(true);
  });
});

describe('BasisLayer – 28.5 viewport zoom invalid', () => {
  it('produces BL_VIEWPORT_ZOOM_INVALID when min > max', () => {
    const state = {
      ...mockBasisLayerState,
      viewport: { ...mockBasisLayerState.viewport, min_zoom: 18, max_zoom: 10 },
    };
    const result = validateBasisLayer(state, mockBoundaryState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'BL_VIEWPORT_ZOOM_INVALID')).toBe(true);
  });
});

describe('BasisLayer – 28.6 graph missing triggers warning', () => {
  it('produces BL_GRAPH_MISSING as warning (not error)', () => {
    const result = validateBasisLayer(mockBasisLayerState, mockBoundaryState, undefined);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'BL_GRAPH_MISSING')).toBe(true);
  });
});

describe('BasisLayer – 28.7 context protection', () => {
  it('does not mutate other context keys', () => {
    const context = makeEmptyContext();
    const updated = applyBasisLayerToContext(context, mockBasisLayerState);
    expect(updated.boundary).toBe(context.boundary);
    expect(updated.graph).toBe(context.graph);
    expect(updated.basis_layer).toBe(mockBasisLayerState);
  });
});

describe('BasisLayer – 28.8 invalid status blocks context apply', () => {
  it('throws when status is basis_layer_invalid', () => {
    const state = { ...mockBasisLayerState, status: 'basis_layer_invalid' as const };
    expect(() => applyBasisLayerToContext(makeEmptyContext(), state)).toThrow();
  });
});
