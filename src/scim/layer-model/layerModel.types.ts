export type LayerModelStatus =
  | 'not_built'
  | 'building'
  | 'layer_model_valid'
  | 'layer_model_invalid'
  | 'layer_model_warning';

export type ScimLayerType =
  | 'route_score_layer'
  | 'poi_load_layer'
  | 'movement_flow_layer'
  | 'masking_overlay'
  | 'debug_layer'
  | 'basis_tile_layer'
  | 'stay_zone_edge_layer';

export type StayZoneClassification = 'rast' | 'stau' | 'undecided';

export interface TransitionGradient {
  from_color: string;
  to_color: string;
  transition_width_meters: number;
}

export interface StayZoneEdgeLayer {
  layer_id: string;
  zone_id: string;
  classification: StayZoneClassification;
  gradient: TransitionGradient;
  edge_ids: string[];
  visible: boolean;
  opacity: number;
}

export type LayerDataClass =
  | 'public_aggregate'
  | 'reduced_scim_result'
  | 'operator_internal'
  | 'debug'
  | 'raw_signal'
  | 'forbidden_for_sensus_core';

export interface ScimLayer {
  layer_id: string;
  layer_type: ScimLayerType;
  display_name: string;
  visible: boolean;
  z_index: number;
  opacity: number;
  data_class: LayerDataClass;
  depends_on_feature_flag?: string;
}

export interface LayerModelIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface LayerModelValidationResult {
  is_valid: boolean;
  errors: LayerModelIssue[];
  warnings: LayerModelIssue[];
  checked_at: string;
  checked_against_route_layer_model_id?: string;
  checked_against_basis_layer_id?: string;
}

export interface LayerModelState {
  layer_model_id: string;
  route_layer_model_id?: string;
  basis_layer_id?: string;
  layers: ScimLayer[];
  stay_zone_edge_layers?: StayZoneEdgeLayer[];
  visible_layer_count: number;
  validation: LayerModelValidationResult;
  status: LayerModelStatus;
  built_at: string;
}
