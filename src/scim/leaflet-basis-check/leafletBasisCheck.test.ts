import { describe, it, expect } from 'vitest';
import { mockLeafletBasisCheckState } from './leafletBasisCheck.mock';
import { validateLeafletBasisCheck } from './leafletBasisCheck.validation';
import { applyLeafletBasisCheckToContext } from './leafletBasisCheck.context';
import { mockBasisLayerState } from '../basis-layer/basisLayer.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('LeafletBasisCheck – 37.1 valid mock passes validation', () => {
  it('mock state is valid with basis layer', () => {
    const result = validateLeafletBasisCheck(mockLeafletBasisCheckState, mockBasisLayerState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('LeafletBasisCheck – 37.2 basis layer missing', () => {
  it('produces LBC_BASIS_LAYER_MISSING', () => {
    const result = validateLeafletBasisCheck(mockLeafletBasisCheckState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LBC_BASIS_LAYER_MISSING')).toBe(true);
  });
});

describe('LeafletBasisCheck – 37.3 not overall_ready', () => {
  it('produces LBC_NOT_READY', () => {
    const state = {
      ...mockLeafletBasisCheckState,
      check_result: { ...mockLeafletBasisCheckState.check_result, overall_ready: false },
    };
    const result = validateLeafletBasisCheck(state, mockBasisLayerState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LBC_NOT_READY')).toBe(true);
  });
});

describe('LeafletBasisCheck – 37.4 viewport invalid', () => {
  it('produces LBC_VIEWPORT_INVALID', () => {
    const state = {
      ...mockLeafletBasisCheckState,
      check_result: { ...mockLeafletBasisCheckState.check_result, viewport_valid: false },
    };
    const result = validateLeafletBasisCheck(state, mockBasisLayerState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LBC_VIEWPORT_INVALID')).toBe(true);
  });
});

describe('LeafletBasisCheck – 37.5 no tile layers triggers warning', () => {
  it('produces LBC_NO_TILE_LAYERS as warning', () => {
    const state = {
      ...mockLeafletBasisCheckState,
      check_result: { ...mockLeafletBasisCheckState.check_result, tile_layers_count: 0 },
    };
    const result = validateLeafletBasisCheck(state, mockBasisLayerState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'LBC_NO_TILE_LAYERS')).toBe(true);
  });
});

describe('LeafletBasisCheck – 37.6 context protection', () => {
  it('writes only leaflet_check', () => {
    const context = makeEmptyContext();
    const updated = applyLeafletBasisCheckToContext(context, mockLeafletBasisCheckState);
    expect(updated.basis_layer).toBe(context.basis_layer);
    expect(updated.leaflet_check).toBe(mockLeafletBasisCheckState);
  });
});

describe('LeafletBasisCheck – 37.7 invalid status blocks apply', () => {
  it('throws when status is leaflet_basis_failed', () => {
    const state = { ...mockLeafletBasisCheckState, status: 'leaflet_basis_failed' as const };
    expect(() => applyLeafletBasisCheckToContext(makeEmptyContext(), state)).toThrow();
  });
});
