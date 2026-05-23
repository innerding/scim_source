import type { ScimContext } from './scimContext.types';
import type { ScimContextPath } from './scimContext.paths';

// Invalidation cascades from the spec (section 18)
const INVALIDATION_MAP: Record<ScimContextPath, ScimContextPath[]> = {
  'context.system_adjust': [
    'context.regio_content',
    'context.target_app_ui',
    'context.telco_load',
    'context.boundary',
    'context.extracted_data',
    'context.scim_context',
    'context.graph',
    'context.basis_layer',
    'context.leaflet_check',
    'context.poi_model',
    'context.load_model',
    'context.movement_model',
    'context.masking_model',
    'context.route_model',
    'context.route_layer_model',
    'context.layer_model',
    'context.sensus_core_package',
    'context.local_user_context',
    'context.view_state',
    'context.leaflet_effect_check',
    'context.release',
  ],
  'context.regio_content': [
    'context.extracted_data',
    'context.scim_context',
    'context.poi_model',
    'context.load_model',
    'context.movement_model',
    'context.masking_model',
    'context.route_model',
    'context.sensus_core_package',
    'context.local_user_context',
    'context.view_state',
    'context.leaflet_effect_check',
    'context.release',
  ],
  'context.target_app_ui': [
    'context.sensus_core_package',
    'context.local_user_context',
    'context.view_state',
    'context.leaflet_effect_check',
    'context.release',
  ],
  'context.telco_load': [
    'context.load_model',
    'context.movement_model',
    'context.masking_model',
    'context.route_model',
    'context.sensus_core_package',
    'context.local_user_context',
    'context.view_state',
    'context.leaflet_effect_check',
    'context.release',
  ],
  'context.operator_zones': [
    'context.signal_interpretation',
    'context.load_model',
    'context.movement_model',
    'context.masking_model',
    'context.route_model',
    'context.sensus_core_package',
    'context.local_user_context',
    'context.view_state',
    'context.leaflet_effect_check',
    'context.release',
  ],
  'context.signal_interpretation': [
    'context.load_model',
    'context.movement_model',
    'context.masking_model',
    'context.route_model',
    'context.sensus_core_package',
    'context.local_user_context',
    'context.view_state',
    'context.leaflet_effect_check',
    'context.release',
  ],
  'context.boundary': [
    'context.scim_context',
    'context.graph',
    'context.basis_layer',
    'context.leaflet_check',
    'context.poi_model',
    'context.load_model',
    'context.movement_model',
    'context.masking_model',
    'context.route_model',
    'context.route_layer_model',
    'context.sensus_core_package',
    'context.local_user_context',
    'context.view_state',
    'context.leaflet_effect_check',
    'context.release',
  ],
  'context.extracted_data': [
    'context.scim_context',
    'context.graph',
    'context.basis_layer',
    'context.leaflet_check',
    'context.poi_model',
    'context.load_model',
    'context.movement_model',
    'context.masking_model',
    'context.route_model',
    'context.route_layer_model',
    'context.sensus_core_package',
    'context.local_user_context',
    'context.view_state',
    'context.leaflet_effect_check',
    'context.release',
  ],
  'context.graph': [
    'context.poi_model',
    'context.load_model',
    'context.movement_model',
    'context.masking_model',
    'context.route_model',
    'context.route_layer_model',
    'context.sensus_core_package',
    'context.local_user_context',
    'context.view_state',
    'context.leaflet_effect_check',
    'context.release',
  ],
  'context.sensus_core_package': [
    'context.local_user_context',
    'context.view_state',
    'context.leaflet_effect_check',
    'context.release',
  ],
  // Paths that do not cascade further
  'context.scim_context': [],
  'context.basis_layer': [],
  'context.leaflet_check': [],
  'context.poi_model': [],
  'context.load_model': [],
  'context.movement_model': [],
  'context.masking_model': [],
  'context.route_model': [],
  'context.route_layer_model': [],
  'context.layer_model': [],
  'context.local_user_context': [],
  'context.view_state': [],
  'context.leaflet_effect_check': [],
  'context.release': [],
  'context.status': [],
  'context.stay_zone_detector': [],
  'context.classification_mode': [],
  'context.step2_activation_condition_met': [],
  'context.operator_decision': [],
  'context.step2_activation': [],
};

const PATH_TO_KEY: Record<ScimContextPath, keyof ScimContext | null> = {
  'context.system_adjust': 'system_adjust',
  'context.regio_content': 'regio_content',
  'context.target_app_ui': 'target_app_ui',
  'context.telco_load': 'telco_load',
  'context.boundary': 'boundary',
  'context.extracted_data': 'extracted_data',
  'context.scim_context': 'scim_context',
  'context.graph': 'graph',
  'context.basis_layer': 'basis_layer',
  'context.leaflet_check': 'leaflet_check',
  'context.poi_model': 'poi_model',
  'context.load_model': 'load_model',
  'context.movement_model': 'movement_model',
  'context.masking_model': 'masking_model',
  'context.route_model': 'route_model',
  'context.route_layer_model': 'route_layer_model',
  'context.layer_model': 'layer_model',
  'context.sensus_core_package': 'sensus_core_package',
  'context.local_user_context': 'local_user_context',
  'context.view_state': 'view_state',
  'context.leaflet_effect_check': 'leaflet_effect_check',
  'context.release': 'release',
  'context.status': 'status',
  'context.operator_zones': 'operator_zones',
  'context.signal_interpretation': 'signal_interpretation',
  'context.stay_zone_detector': 'stay_zone_detector',
  'context.classification_mode': null,
  'context.step2_activation_condition_met': null,
  'context.operator_decision': 'operator_decision',
  'context.step2_activation': 'step2_activation',
};

export function getInvalidationCascade(changedPath: ScimContextPath): ScimContextPath[] {
  return INVALIDATION_MAP[changedPath] ?? [];
}

export function invalidateDownstream(
  context: ScimContext,
  changedPath: ScimContextPath
): { context: ScimContext; invalidated_paths: ScimContextPath[] } {
  const cascade = getInvalidationCascade(changedPath);
  const invalidated_paths: ScimContextPath[] = [];
  let next = { ...context };

  for (const path of cascade) {
    const key = PATH_TO_KEY[path];
    if (key && next[key] !== undefined) {
      // null the downstream state — panel must re-run
      next = { ...next, [key]: undefined };
      invalidated_paths.push(path);
    }
  }

  return { context: next, invalidated_paths };
}

export function checkRepresentationIdConsistency(context: ScimContext): {
  consistent: boolean;
  mismatches: Array<{ path: ScimContextPath; expected: string; found: string }>;
} {
  const expected = context.representation_id;
  if (!expected) return { consistent: true, mismatches: [] };

  const SPATIAL_PATHS: Array<[ScimContextPath, keyof ScimContext]> = [
    ['context.boundary', 'boundary'],
    ['context.extracted_data', 'extracted_data'],
    ['context.scim_context', 'scim_context'],
    ['context.graph', 'graph'],
    ['context.basis_layer', 'basis_layer'],
    ['context.poi_model', 'poi_model'],
    ['context.load_model', 'load_model'],
    ['context.movement_model', 'movement_model'],
    ['context.masking_model', 'masking_model'],
    ['context.route_model', 'route_model'],
    ['context.route_layer_model', 'route_layer_model'],
    ['context.sensus_core_package', 'sensus_core_package'],
    ['context.local_user_context', 'local_user_context'],
    ['context.view_state', 'view_state'],
    ['context.leaflet_effect_check', 'leaflet_effect_check'],
    ['context.release', 'release'],
  ];

  const mismatches: Array<{ path: ScimContextPath; expected: string; found: string }> = [];

  for (const [path, key] of SPATIAL_PATHS) {
    const state = context[key] as { representation_id?: string } | undefined;
    if (state?.representation_id !== undefined && state.representation_id !== expected) {
      mismatches.push({ path, expected, found: state.representation_id });
    }
  }

  return { consistent: mismatches.length === 0, mismatches };
}
