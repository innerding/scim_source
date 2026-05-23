import type { SensusCorePackageState } from './sensusCorePackage.types';

export const mockSensusCorePackageState: SensusCorePackageState = {
  package_id: 'pkg_hochwab_001',
  layer_model_id: 'lm_001',
  route_layer_model_id: 'rlm_001',
  poi_model_id: 'poi_model_001',
  export_format: 'sensus_core_json',
  schema_version: '3.0.0',
  content: {
    route_segments_count: 3,
    poi_states_count: 1,
    layer_count: 3,
    data_classes_included: ['public_aggregate', 'reduced_scim_result'],
    raw_signals_present: false,
    device_ids_present: false,
    debug_data_present: false,
    classification_mode: 'movement_only',
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:14:00.000Z',
    checked_against_layer_model_id: 'lm_001',
    checked_against_system_adjust_version: 'sys_v1.0.0',
  },
  status: 'package_valid',
  generated_at: '2026-05-21T00:14:00.000Z',
};
