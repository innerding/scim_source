export type ScimPanelId =
  | 'panel_1_system_adjust_input'
  | 'panel_2_regio_content_input'
  | 'panel_3_target_app_ui_input'
  | 'panel_4_telco_load_input'
  | 'panel_5_boundary_extraction'
  | 'panel_6_graph_basislayer'
  | 'panel_7_poi_load_movement'
  | 'panel_8_route_evaluation_display'
  | 'panel_9_sensus_core_package_builder'
  | 'panel_10_sensus_core_local'
  | 'panel_11_leaflet_effect_check'
  | 'panel_12_release_export';

export type ScimContextPath =
  | 'context.system_adjust'
  | 'context.regio_content'
  | 'context.target_app_ui'
  | 'context.telco_load'
  | 'context.boundary'
  | 'context.extracted_data'
  | 'context.scim_context'
  | 'context.graph'
  | 'context.basis_layer'
  | 'context.leaflet_check'
  | 'context.poi_model'
  | 'context.load_model'
  | 'context.movement_model'
  | 'context.masking_model'
  | 'context.route_model'
  | 'context.route_layer_model'
  | 'context.layer_model'
  | 'context.sensus_core_package'
  | 'context.local_user_context'
  | 'context.view_state'
  | 'context.leaflet_effect_check'
  | 'context.release'
  | 'context.status';

export const PANEL_WRITE_MAP: Record<ScimPanelId, ScimContextPath[]> = {
  panel_1_system_adjust_input: ['context.system_adjust'],
  panel_2_regio_content_input: ['context.regio_content'],
  panel_3_target_app_ui_input: ['context.target_app_ui'],
  panel_4_telco_load_input: ['context.telco_load'],
  panel_5_boundary_extraction: ['context.boundary', 'context.extracted_data'],
  panel_6_graph_basislayer: [
    'context.scim_context',
    'context.graph',
    'context.basis_layer',
    'context.leaflet_check',
  ],
  panel_7_poi_load_movement: [
    'context.poi_model',
    'context.load_model',
    'context.movement_model',
    'context.masking_model',
  ],
  panel_8_route_evaluation_display: [
    'context.route_model',
    'context.route_layer_model',
    'context.leaflet_check',
  ],
  panel_9_sensus_core_package_builder: ['context.sensus_core_package'],
  panel_10_sensus_core_local: ['context.local_user_context', 'context.view_state'],
  panel_11_leaflet_effect_check: ['context.leaflet_effect_check'],
  panel_12_release_export: ['context.release', 'context.status'],
};

// Panel 5 also owns representation_id, handled separately in update logic
export const PANEL_5_REPRESENTATION_ID_WRITE = true;
