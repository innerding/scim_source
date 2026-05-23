import type { PoiModelState } from './poiOutput.types';

export const mockPoiModelState: PoiModelState = {
  poi_model_id: 'poi_output_001',
  detector_id: 'szd_001',
  evaluated_pois: [
    {
      poi_id: 'poi_001',
      name: 'Beispielhütte',
      load_class: 'moderate',
      normalized_load_score: 0.61,
      stay_classification: 'confirmed_stay',
      contributing_signal_group_ids: ['sg_002'],
      confidence_score: 0.78,
      privacy_masked: false,
      signal_count_sufficient: true,
      zone_radius_meters: 35,
      zone_center: { type: 'Point', coordinates: [15.225, 47.651] },
      is_off_path: false,
      operator_confirmed: false,
      overlap_flagged: false,
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
    checked_at: '2026-05-21T00:09:00.000Z',
    checked_against_detector_id: 'szd_001',
    checked_against_system_adjust_version: 'sys_v1.0.0',
  },
  status: 'poi_model_valid',
  computed_at: '2026-05-21T00:09:00.000Z',
};
