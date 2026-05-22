import { describe, it, expect } from 'vitest';
import { mockSensusCoreViewState } from './sensusCoreView.mock';
import { validateSensusCoreView } from './sensusCoreView.validation';
import { applySensusCoreViewToContext } from './sensusCoreView.context';
import { mockSensusCorePackageState } from '../sensus-core-package/sensusCorePackage.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('SensusCoreView – 40.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateSensusCoreView(mockSensusCoreViewState, mockSensusCorePackageState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('SensusCoreView – 40.2 package missing', () => {
  it('produces VIEW_PACKAGE_MISSING', () => {
    const result = validateSensusCoreView(mockSensusCoreViewState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'VIEW_PACKAGE_MISSING')).toBe(true);
  });
});

describe('SensusCoreView – 40.3 viewport zoom out of range', () => {
  it('produces VIEW_ZOOM_OUT_OF_RANGE', () => {
    const state = { ...mockSensusCoreViewState, viewport_zoom: 25 };
    const result = validateSensusCoreView(state, mockSensusCorePackageState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'VIEW_ZOOM_OUT_OF_RANGE')).toBe(true);
  });
});

describe('SensusCoreView – 40.4 duplicate active layer id', () => {
  it('produces VIEW_DUPLICATE_LAYER_ID', () => {
    const state = {
      ...mockSensusCoreViewState,
      active_layers: [
        mockSensusCoreViewState.active_layers[0],
        { ...mockSensusCoreViewState.active_layers[1], layer_id: 'layer_osm_base' },
      ],
    };
    const result = validateSensusCoreView(state, mockSensusCorePackageState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'VIEW_DUPLICATE_LAYER_ID')).toBe(true);
  });
});

describe('SensusCoreView – 40.5 all layers hidden triggers warning', () => {
  it('produces VIEW_ALL_LAYERS_HIDDEN as warning', () => {
    const state = {
      ...mockSensusCoreViewState,
      active_layers: mockSensusCoreViewState.active_layers.map(l => ({ ...l, visible: false })),
    };
    const result = validateSensusCoreView(state, mockSensusCorePackageState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'VIEW_ALL_LAYERS_HIDDEN')).toBe(true);
  });
});

describe('SensusCoreView – 40.6 context protection', () => {
  it('writes only view_state', () => {
    const context = makeEmptyContext();
    const updated = applySensusCoreViewToContext(context, mockSensusCoreViewState);
    expect(updated.sensus_core_package).toBe(context.sensus_core_package);
    expect(updated.view_state).toBe(mockSensusCoreViewState);
  });
});

describe('SensusCoreView – 40.7 invalid status blocks apply', () => {
  it('throws when status is view_stale', () => {
    const state = { ...mockSensusCoreViewState, status: 'view_stale' as const };
    expect(() => applySensusCoreViewToContext(makeEmptyContext(), state)).toThrow();
  });
});
