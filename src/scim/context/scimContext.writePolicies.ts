import type { ScimPanelId, ScimContextPath } from './scimContext.paths';
import { PANEL_WRITE_MAP } from './scimContext.paths';

export interface ScimContextWritePolicy {
  panel: ScimPanelId;
  allowed_write_paths: ScimContextPath[];
  may_write_representation_id: boolean;
}

function policy(
  panel: ScimPanelId,
  extra?: { may_write_representation_id?: boolean }
): ScimContextWritePolicy {
  return {
    panel,
    allowed_write_paths: PANEL_WRITE_MAP[panel],
    may_write_representation_id: extra?.may_write_representation_id ?? false,
  };
}

export const WRITE_POLICIES: Record<ScimPanelId, ScimContextWritePolicy> = {
  panel_1_system_adjust_input: policy('panel_1_system_adjust_input'),
  panel_2_regio_content_input: policy('panel_2_regio_content_input'),
  panel_3_target_app_ui_input: policy('panel_3_target_app_ui_input'),
  panel_4_telco_load_input: policy('panel_4_telco_load_input'),
  panel_5_boundary_extraction: policy('panel_5_boundary_extraction', {
    may_write_representation_id: true,
  }),
  panel_6_graph_basislayer: policy('panel_6_graph_basislayer'),
  panel_7_poi_load_movement: policy('panel_7_poi_load_movement'),
  panel_8_route_evaluation_display: policy('panel_8_route_evaluation_display'),
  panel_9_sensus_core_package_builder: policy('panel_9_sensus_core_package_builder'),
  panel_10_sensus_core_local: policy('panel_10_sensus_core_local'),
  panel_11_leaflet_effect_check: policy('panel_11_leaflet_effect_check'),
  panel_12_release_export: policy('panel_12_release_export'),
};

export function isPanelAllowedToWrite(
  panel: ScimPanelId,
  path: ScimContextPath
): boolean {
  const p = WRITE_POLICIES[panel];
  return p.allowed_write_paths.includes(path);
}

export function validateWritePaths(
  panel: ScimPanelId,
  paths: ScimContextPath[]
): { allowed: ScimContextPath[]; rejected: ScimContextPath[] } {
  const policy = WRITE_POLICIES[panel];
  const allowed: ScimContextPath[] = [];
  const rejected: ScimContextPath[] = [];
  for (const path of paths) {
    if (policy.allowed_write_paths.includes(path)) {
      allowed.push(path);
    } else {
      rejected.push(path);
    }
  }
  return { allowed, rejected };
}
