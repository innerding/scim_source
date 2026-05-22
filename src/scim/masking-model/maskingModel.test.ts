import { describe, it, expect } from 'vitest';
import { mockMaskingModelState } from './maskingModel.mock';
import { validateMaskingModel } from './maskingModel.validation';
import { applyMaskingModelToContext } from './maskingModel.context';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('MaskingModel – 32.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateMaskingModel(mockMaskingModelState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('MaskingModel – 32.2 system adjust missing', () => {
  it('produces MASK_SYSTEM_ADJUST_MISSING', () => {
    const result = validateMaskingModel(mockMaskingModelState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'MASK_SYSTEM_ADJUST_MISSING')).toBe(true);
  });
});

describe('MaskingModel – 32.3 masking ratio invalid', () => {
  it('produces MASK_RATIO_INVALID when ratio > 1', () => {
    const state = {
      ...mockMaskingModelState,
      metrics: { ...mockMaskingModelState.metrics, masking_ratio: 1.5 },
    };
    const result = validateMaskingModel(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'MASK_RATIO_INVALID')).toBe(true);
  });
});

describe('MaskingModel – 32.4 masking ratio inconsistent', () => {
  it('produces MASK_RATIO_INCONSISTENT when computed ratio differs', () => {
    const state = {
      ...mockMaskingModelState,
      metrics: { ...mockMaskingModelState.metrics, total_evaluated: 10, total_masked: 5, masking_ratio: 0.1 },
    };
    const result = validateMaskingModel(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'MASK_RATIO_INCONSISTENT')).toBe(true);
  });
});

describe('MaskingModel – 32.5 high masking ratio triggers warning', () => {
  it('produces MASK_HIGH_MASKING_RATIO as warning', () => {
    const state = {
      ...mockMaskingModelState,
      metrics: { ...mockMaskingModelState.metrics, total_evaluated: 10, total_masked: 9, masking_ratio: 0.9 },
    };
    const result = validateMaskingModel(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'MASK_HIGH_MASKING_RATIO')).toBe(true);
  });
});

describe('MaskingModel – 32.6 context protection', () => {
  it('writes only masking_model', () => {
    const context = makeEmptyContext();
    const updated = applyMaskingModelToContext(context, mockMaskingModelState);
    expect(updated.movement_model).toBe(context.movement_model);
    expect(updated.masking_model).toBe(mockMaskingModelState);
  });
});

describe('MaskingModel – 32.7 invalid status blocks apply', () => {
  it('throws when status is masking_model_invalid', () => {
    const state = { ...mockMaskingModelState, status: 'masking_model_invalid' as const };
    expect(() => applyMaskingModelToContext(makeEmptyContext(), state)).toThrow();
  });
});
