import type { ScimContext } from './scimContext.types';
import type { ScimPanelId, ScimContextPath } from './scimContext.paths';
import type { ScimIssue } from './scimContext.issues';
import type { ScimContextWritePolicy } from './scimContext.writePolicies';
import { makeIssue } from './scimContext.issues';
import { validateWritePaths } from './scimContext.writePolicies';
import { WRITE_POLICIES } from './scimContext.writePolicies';

export interface ScimContextUpdateResult<T = unknown> {
  context: ScimContext;
  updated_paths: ScimContextPath[];
  rejected_paths: ScimContextPath[];
  issues: ScimIssue[];
  success: boolean;
  payload?: T;
}

// Maps ScimContextPath → key in ScimContext
const PATH_TO_KEY: Partial<Record<ScimContextPath, keyof ScimContext>> = {
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
};

export function applyPanelContextUpdate<T = unknown>(
  context: ScimContext,
  panel: ScimPanelId,
  update: Partial<ScimContext>,
  writePolicy?: ScimContextWritePolicy,
  payload?: T
): ScimContextUpdateResult<T> {
  const policy = writePolicy ?? WRITE_POLICIES[panel];
  const issues: ScimIssue[] = [];
  const updated_paths: ScimContextPath[] = [];
  const rejected_paths: ScimContextPath[] = [];

  // Determine which paths the update touches
  const requestedPaths = (Object.keys(update) as (keyof ScimContext)[])
    .map((key) => {
      const entry = Object.entries(PATH_TO_KEY).find(([, v]) => v === key);
      return entry ? (entry[0] as ScimContextPath) : null;
    })
    .filter((p): p is ScimContextPath => p !== null);

  // Validate representation_id write
  let newRepresentationId = context.representation_id;
  if (update.representation_id !== undefined) {
    if (!policy.may_write_representation_id) {
      rejected_paths.push('context.status'); // placeholder — represents the id write
      issues.push(
        makeIssue(
          panel,
          'blocker',
          'WRITE_POLICY_VIOLATION_REPRESENTATION_ID',
          `Panel ${panel} is not allowed to write representation_id`,
          { affected_context_path: 'context.boundary' }
        )
      );
    } else {
      newRepresentationId = update.representation_id;
    }
  }

  const { allowed, rejected } = validateWritePaths(panel, requestedPaths);
  rejected_paths.push(...rejected);

  if (rejected.length > 0) {
    issues.push(
      makeIssue(
        panel,
        'blocker',
        'WRITE_POLICY_VIOLATION',
        `Panel ${panel} attempted to write to forbidden paths: ${rejected.join(', ')}`,
        {}
      )
    );
  }

  // Apply allowed updates
  let next = { ...context, representation_id: newRepresentationId };
  for (const path of allowed) {
    const key = PATH_TO_KEY[path];
    if (key && key in update) {
      next = { ...next, [key]: (update as Record<string, unknown>)[key] };
      updated_paths.push(path);
    }
  }

  const success = rejected_paths.length === 0 && issues.every((i) => !i.blocking);

  return {
    context: next,
    updated_paths,
    rejected_paths,
    issues,
    success,
    payload,
  };
}
