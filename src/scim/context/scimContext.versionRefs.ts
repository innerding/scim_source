import type { ScimSourceRef } from './scimContext.sourceRefs';

export type ScimVersionType =
  | 'system_adjust'
  | 'privacy_rule'
  | 'aggregation_rule'
  | 'regio_content'
  | 'regional_parameter'
  | 'target_app_ui'
  | 'telco_load_batch'
  | 'boundary'
  | 'extraction'
  | 'graph'
  | 'poi_model'
  | 'load_projection'
  | 'movement_model'
  | 'masking_model'
  | 'route_model'
  | 'route_layer_model'
  | 'sensus_core_package'
  | 'local_user_context'
  | 'view_state'
  | 'leaflet_effect_check'
  | 'release';

export interface ScimVersionRef {
  version_id: string;
  version_type: ScimVersionType;
  semantic_version?: string;
  created_at?: string;
  source_ref?: ScimSourceRef;
}
