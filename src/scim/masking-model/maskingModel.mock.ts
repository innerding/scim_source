import type { MaskingModelState, MaskedElement } from './maskingModel.types';

export const mockStayZoneMaskedElement: MaskedElement = {
  element_type: 'area',
  element_id: 'zone_001',
  masking_reason: 'stay_zone_confirmed',
  rule_code: 'MASK_STAY_ZONE_CONFIRMED',
};

export const mockOffPathMaskedElement: MaskedElement = {
  element_type: 'area',
  element_id: 'zone_off_001',
  masking_reason: 'off_path_zone_excluded',
  rule_code: 'MASK_OFF_PATH_ZONE',
};

export const mockMaskingModelState: MaskingModelState = {
  masking_model_id: 'mask_001',
  masked_elements: [],
  metrics: {
    total_evaluated: 4,
    total_masked: 0,
    masked_pois: 0,
    masked_edges: 0,
    masking_ratio: 0,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:08:00.000Z',
    checked_against_system_adjust_version: 'sys_v1.0.0',
  },
  status: 'masking_model_valid',
  applied_at: '2026-05-21T00:08:00.000Z',
};
