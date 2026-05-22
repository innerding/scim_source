import type { ExtractionState } from './extraction.types';

export const mockExtractionState: ExtractionState = {
  extraction_id: 'ext_001',
  boundary_id: 'bnd_hochwab_nord_001',
  extracted_pois: [
    {
      poi_id: 'poi_001',
      name: 'Beispielhütte',
      category: 'alpine_hut',
      center: { type: 'Point', coordinates: [15.21, 47.64] },
      radius_meters: 50,
      comparison_margin_meters: 25,
      effective_comparison_radius_meters: 75,
      within_boundary: true,
      regio_content_version: 'regio_v1.0.0',
    },
  ],
  excluded_poi_count: 0,
  extracted_signal_groups: [
    {
      signal_group_id: 'sg_001',
      signal_type: 'runtime_load',
      aggregation_unit: 'area_bucket',
      within_boundary: true,
      normalized_load_score: 0.58,
      confidence_score: 0.82,
      projected_to_boundary: false,
    },
    {
      signal_group_id: 'sg_002',
      signal_type: 'stillness_indicator',
      aggregation_unit: 'poi_radius_candidate',
      within_boundary: true,
      normalized_load_score: 0.71,
      confidence_score: 0.86,
      projected_to_boundary: false,
    },
  ],
  excluded_signal_count: 0,
  out_of_boundary_signal_count: 0,
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:02:00.000Z',
    checked_against_boundary_id: 'bnd_hochwab_nord_001',
    checked_against_regio_content_version: 'regio_v1.0.0',
    checked_against_telco_load_batch_id: 'load_001',
  },
  status: 'extraction_valid',
  extracted_at: '2026-05-21T00:02:00.000Z',
};
