export type ScimGlobalStatus =
  | 'not_started'
  | 'draft'
  | 'input_ready'
  | 'spatial_context_ready'
  | 'graph_ready'
  | 'load_models_ready'
  | 'routes_ready'
  | 'package_ready'
  | 'local_view_ready'
  | 'effect_checked'
  | 'release_ready'
  | 'released'
  | 'warning'
  | 'blocked'
  | 'error';

export type SystemAdjustStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'system_adjust_valid'
  | 'system_adjust_invalid'
  | 'system_adjust_warning'
  | 'system_adjust_error';

export type RegioContentStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'regio_content_valid'
  | 'regio_content_invalid'
  | 'regio_content_warning'
  | 'regio_content_draft'
  | 'regio_content_error';

export type TargetAppUiStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'target_app_ui_valid'
  | 'target_app_ui_invalid'
  | 'target_app_ui_warning'
  | 'target_app_ui_draft'
  | 'target_app_ui_error';

export type TelcoLoadStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'telco_load_valid'
  | 'telco_load_invalid'
  | 'telco_load_warning'
  | 'telco_load_expired'
  | 'telco_load_privacy_blocked'
  | 'telco_load_error';

export type BoundaryStatus =
  | 'not_created'
  | 'drawing'
  | 'created_unvalidated'
  | 'validating'
  | 'boundary_valid'
  | 'boundary_invalid'
  | 'boundary_warning'
  | 'boundary_error';

export type ExtractionStatus =
  | 'not_extracted'
  | 'extracting'
  | 'extracted_unvalidated'
  | 'validating'
  | 'extraction_valid'
  | 'extraction_warning'
  | 'extraction_invalid'
  | 'extraction_error';

export type ScimRuntimeContextStatus =
  | 'not_checked'
  | 'checking'
  | 'scim_context_valid'
  | 'scim_context_warning'
  | 'scim_context_invalid'
  | 'scim_context_error';

export type GraphStatus =
  | 'not_created'
  | 'building'
  | 'graph_created_unvalidated'
  | 'validating'
  | 'graph_valid'
  | 'graph_warning'
  | 'graph_invalid'
  | 'graph_error';

export type BasisLayerStatus =
  | 'not_created'
  | 'building'
  | 'basis_layer_created_unvalidated'
  | 'validating'
  | 'basis_layer_valid'
  | 'basis_layer_warning'
  | 'basis_layer_invalid'
  | 'basis_layer_error';

export type LeafletBasisCheckStatus =
  | 'not_checked'
  | 'checking'
  | 'leaflet_basis_check_valid'
  | 'leaflet_basis_check_warning'
  | 'leaflet_basis_check_invalid'
  | 'leaflet_basis_check_error';

export type PoiModelStatus =
  | 'not_created'
  | 'building'
  | 'poi_model_created_unvalidated'
  | 'validating'
  | 'poi_model_valid'
  | 'poi_model_warning'
  | 'poi_model_invalid'
  | 'poi_model_error';

export type LoadProjectionStatus =
  | 'not_projected'
  | 'projecting'
  | 'loads_projected_unvalidated'
  | 'validating'
  | 'loads_projected'
  | 'load_projection_warning'
  | 'load_projection_invalid'
  | 'load_projection_error';

export type MovementModelStatus =
  | 'not_created'
  | 'building'
  | 'movement_model_created_unvalidated'
  | 'validating'
  | 'movement_model_valid'
  | 'movement_model_warning'
  | 'movement_model_invalid'
  | 'movement_model_error';

export type MaskingModelStatus =
  | 'not_created'
  | 'building'
  | 'masking_model_created_unvalidated'
  | 'validating'
  | 'masking_model_valid'
  | 'masking_model_warning'
  | 'masking_model_invalid'
  | 'masking_model_error';

export type RouteModelStatus =
  | 'not_created'
  | 'building'
  | 'route_model_created_unvalidated'
  | 'validating'
  | 'route_model_valid'
  | 'route_model_warning'
  | 'route_model_invalid'
  | 'route_model_error';

export type RouteLayerModelStatus =
  | 'not_created'
  | 'building'
  | 'route_layer_created_unvalidated'
  | 'validating'
  | 'route_layer_valid'
  | 'route_layer_warning'
  | 'route_layer_invalid'
  | 'route_layer_error';

export type LeafletRouteCheckStatus =
  | 'not_checked'
  | 'checking'
  | 'leaflet_route_check_valid'
  | 'leaflet_route_check_warning'
  | 'leaflet_route_check_invalid'
  | 'leaflet_route_check_error';

export type SensusCorePackageStatus =
  | 'not_created'
  | 'building'
  | 'sensus_core_package_created_unvalidated'
  | 'validating'
  | 'sensus_core_package_ready'
  | 'sensus_core_package_warning'
  | 'sensus_core_package_invalid'
  | 'sensus_core_package_privacy_blocked'
  | 'sensus_core_package_error';

export type SensusCoreLocalStatus =
  | 'not_created'
  | 'building'
  | 'sensus_core_local_valid'
  | 'sensus_core_local_warning'
  | 'sensus_core_local_invalid'
  | 'sensus_core_local_error';

export type SensusCoreViewStatus =
  | 'not_created'
  | 'building'
  | 'sensus_core_view_valid'
  | 'sensus_core_view_warning'
  | 'sensus_core_view_invalid'
  | 'sensus_core_view_error';

export type LeafletEffectCheckStatus =
  | 'not_checked'
  | 'checking'
  | 'leaflet_effect_valid'
  | 'leaflet_effect_warning'
  | 'leaflet_effect_invalid'
  | 'leaflet_effect_error';

export type ReleaseExportStatus =
  | 'not_created'
  | 'checking'
  | 'release_ready'
  | 'release_warning'
  | 'release_blocked'
  | 'exporting'
  | 'export_successful'
  | 'export_failed'
  | 'archived';

export type LayerModelStatus =
  | 'not_created'
  | 'building'
  | 'layer_model_valid'
  | 'layer_model_warning'
  | 'layer_model_invalid'
  | 'layer_model_error';
