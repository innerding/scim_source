import { describe, it, expect } from 'vitest';
import { mockSensusCorePackageState } from './sensusCorePackage.mock';
import { validateSensusCorePackage } from './sensusCorePackage.validation';
import { applySensusCorePackageToContext } from './sensusCorePackage.context';
import { mockLayerModelState } from '../layer-model/layerModel.mock';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('SensusCorePackage – 38.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateSensusCorePackage(mockSensusCorePackageState, mockLayerModelState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('SensusCorePackage – 38.2 layer model missing', () => {
  it('produces PKG_LAYER_MODEL_MISSING', () => {
    const result = validateSensusCorePackage(mockSensusCorePackageState, undefined, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'PKG_LAYER_MODEL_MISSING')).toBe(true);
  });
});

describe('SensusCorePackage – 38.3 raw signals present forbidden', () => {
  it('produces PKG_RAW_SIGNALS_FORBIDDEN', () => {
    const state = {
      ...mockSensusCorePackageState,
      content: { ...mockSensusCorePackageState.content, raw_signals_present: true as unknown as false },
    };
    const result = validateSensusCorePackage(state, mockLayerModelState, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'PKG_RAW_SIGNALS_FORBIDDEN')).toBe(true);
  });
});

describe('SensusCorePackage – 38.4 device ids present forbidden', () => {
  it('produces PKG_DEVICE_IDS_FORBIDDEN', () => {
    const state = {
      ...mockSensusCorePackageState,
      content: { ...mockSensusCorePackageState.content, device_ids_present: true as unknown as false },
    };
    const result = validateSensusCorePackage(state, mockLayerModelState, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'PKG_DEVICE_IDS_FORBIDDEN')).toBe(true);
  });
});

describe('SensusCorePackage – 38.5 debug data present forbidden', () => {
  it('produces PKG_DEBUG_DATA_FORBIDDEN', () => {
    const state = {
      ...mockSensusCorePackageState,
      content: { ...mockSensusCorePackageState.content, debug_data_present: true as unknown as false },
    };
    const result = validateSensusCorePackage(state, mockLayerModelState, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'PKG_DEBUG_DATA_FORBIDDEN')).toBe(true);
  });
});

describe('SensusCorePackage – 38.6 no route segments triggers warning', () => {
  it('produces PKG_NO_ROUTE_SEGMENTS as warning', () => {
    const state = {
      ...mockSensusCorePackageState,
      content: { ...mockSensusCorePackageState.content, route_segments_count: 0 },
    };
    const result = validateSensusCorePackage(state, mockLayerModelState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'PKG_NO_ROUTE_SEGMENTS')).toBe(true);
  });
});

describe('SensusCorePackage – 38.7 context protection', () => {
  it('writes only sensus_core_package', () => {
    const context = makeEmptyContext();
    const updated = applySensusCorePackageToContext(context, mockSensusCorePackageState);
    expect(updated.layer_model).toBe(context.layer_model);
    expect(updated.sensus_core_package).toBe(mockSensusCorePackageState);
  });
});

describe('SensusCorePackage – 38.8 invalid status blocks apply', () => {
  it('throws when status is package_invalid', () => {
    const state = { ...mockSensusCorePackageState, status: 'package_invalid' as const };
    expect(() => applySensusCorePackageToContext(makeEmptyContext(), state)).toThrow();
  });
});
