import { describe, it, expect } from 'vitest';
import { mockMaskingModelState, mockStayZoneMaskedElement, mockOffPathMaskedElement } from './maskingModel.mock';
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

// ── 32.8 Stay-Zone Masking Reasons ───────────────────────────────────────────

describe('MaskingModel – 32.8 stay-zone masking reasons', () => {
  it('mock stay-zone elements have correct reasons', () => {
    expect(mockStayZoneMaskedElement.masking_reason).toBe('stay_zone_confirmed');
    expect(mockOffPathMaskedElement.masking_reason).toBe('off_path_zone_excluded');
  });

  it('warns when jam_zone_flagged elements present', () => {
    const state = {
      ...mockMaskingModelState,
      masked_elements: [
        { element_type: 'area' as const, element_id: 'z_jam', masking_reason: 'jam_zone_flagged' as const, rule_code: 'MASK_JAM' },
      ],
      metrics: { ...mockMaskingModelState.metrics, total_evaluated: 1, total_masked: 1, masking_ratio: 1.0 },
    };
    const result = validateMaskingModel(state, mockSystemAdjustState);
    expect(result.warnings.some(w => w.code === 'MASK_JAM_ZONES_FLAGGED')).toBe(true);
  });

  it('warns when stay_zone_overlap_conflict elements present', () => {
    const state = {
      ...mockMaskingModelState,
      masked_elements: [
        { element_type: 'area' as const, element_id: 'z_ov', masking_reason: 'stay_zone_overlap_conflict' as const, rule_code: 'MASK_OVERLAP' },
      ],
      metrics: { ...mockMaskingModelState.metrics, total_evaluated: 1, total_masked: 1, masking_ratio: 1.0 },
    };
    const result = validateMaskingModel(state, mockSystemAdjustState);
    expect(result.warnings.some(w => w.code === 'MASK_OVERLAP_CONFLICT_PRESENT')).toBe(true);
  });

  it('stay_zone_confirmed element passes validation without warning', () => {
    const state = {
      ...mockMaskingModelState,
      masked_elements: [mockStayZoneMaskedElement],
      metrics: { ...mockMaskingModelState.metrics, total_evaluated: 1, total_masked: 1, masking_ratio: 1.0 },
    };
    const result = validateMaskingModel(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'MASK_JAM_ZONES_FLAGGED')).toBe(false);
    expect(result.warnings.some(w => w.code === 'MASK_OVERLAP_CONFLICT_PRESENT')).toBe(false);
  });

  it('off_path_zone_excluded element passes validation without warning', () => {
    const state = {
      ...mockMaskingModelState,
      masked_elements: [mockOffPathMaskedElement],
      metrics: { ...mockMaskingModelState.metrics, total_evaluated: 1, total_masked: 1, masking_ratio: 1.0 },
    };
    const result = validateMaskingModel(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
  });
});
