export type ScimSourceType =
  | 'scim3_atlas_console'
  | 'path_works_regio_dashboard'
  | 'sensus_core_config'
  | 'target_app_config'
  | 'telco_load_api'
  | 'runtime_load_service'
  | 'aggregated_load_backend'
  | 'simulation'
  | 'mock'
  | 'local_json'
  | 'geojson_import'
  | 'api'
  | 'derived'
  | 'manual';

export interface ScimSourceRef {
  source_type: ScimSourceType;
  source_id?: string;
  source_name?: string;
  source_version?: string;
  loaded_at?: string;
  generated_at?: string;
}
