import type { PoiModelState } from './poiModel.types';

export const mockPoiModelState: PoiModelState = {
  poi_model_id: 'poi_model_001',
  extraction_id: 'ext_001',
  evaluated_pois: [
    {
      poi_id: 'poi_001',
      name: 'Beispielhütte',
      load_class: 'moderate',
      normalized_load_score: 0.61,
      stay_classification: 'likely_stay',
      contributing_signal_group_ids: ['sg_002'],
      confidence_score: 0.84,
      privacy_masked: false,
      signal_count_sufficient: true,
    },
  ],
  metrics: {
    evaluated_poi_count: 1,
    masked_poi_count: 0,
    busy_poi_count: 0,
    quiet_poi_count: 0,
    unknown_poi_count: 0,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:05:00.000Z',
    checked_against_extraction_id: 'ext_001',
    checked_against_system_adjust_version: 'sys_v1.0.0',
  },
  status: 'poi_model_valid',
  computed_at: '2026-05-21T00:05:00.000Z',
};
