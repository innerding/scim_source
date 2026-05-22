import type { ScimRuntimeContextState } from './scimRuntimeContext.types';

export const mockScimRuntimeContextState: ScimRuntimeContextState = {
  runtime_context_id: 'rtx_hochwab_001',
  versions: {
    system_adjust_version: 'sys_v1.0.0',
    regio_content_version: 'regio_v1.0.0',
    target_app_ui_version: 'ui_v1.0.0',
    telco_load_batch_id: 'load_001',
    boundary_id: 'bnd_hochwab_nord_001',
    extraction_id: 'ext_001',
    graph_id: 'graph_hochwab_001',
    basis_layer_id: 'bl_hochwab_001',
    poi_model_id: 'poi_model_001',
    load_projection_id: 'lp_001',
    movement_model_id: 'mm_001',
    masking_model_id: 'mask_001',
    route_model_id: 'route_model_001',
    layer_model_id: 'lm_001',
  },
  pipeline_completeness: 1.0,
  assembled_panels: [
    'system_adjust', 'regio_content', 'target_app_ui', 'telco_load',
    'boundary', 'extraction', 'graph', 'basis_layer',
    'poi_model', 'load_projection', 'movement_model', 'masking_model',
    'route_model', 'route_layer_model', 'layer_model',
  ],
  missing_panels: [],
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:12:00.000Z',
  },
  status: 'runtime_context_valid',
  assembled_at: '2026-05-21T00:12:00.000Z',
};
