import type { ScimContext } from './scimContext.types';
import type { ScimIssue } from './scimContext.issues';
import type { ScimValidationSeverity } from './scimContext.validation';
import type { ScimContextPath } from './scimContext.paths';
import { makeIssue } from './scimContext.issues';

export interface ScimPanelGuardResult {
  can_run: boolean;
  severity: ScimValidationSeverity;
  blockers: ScimIssue[];
  warnings: ScimIssue[];
}

function blocked(blockers: ScimIssue[]): ScimPanelGuardResult {
  return { can_run: false, severity: 'blocker', blockers, warnings: [] };
}

function ok(warnings: ScimIssue[] = []): ScimPanelGuardResult {
  return {
    can_run: true,
    severity: warnings.length > 0 ? 'warning' : 'valid',
    blockers: [],
    warnings,
  };
}

function requireState(
  panel: Parameters<typeof makeIssue>[0],
  stateKey: string,
  state: unknown,
  contextPath: ScimContextPath
): ScimIssue | null {
  if (state === undefined || state === null) {
    return makeIssue(
      panel,
      'blocker',
      `MISSING_UPSTREAM_${stateKey.toUpperCase()}`,
      `Required upstream state '${stateKey}' is missing`,
      { affected_context_path: contextPath }
    );
  }
  return null;
}

export function canRunSystemAdjustInput(_context: ScimContext): ScimPanelGuardResult {
  return ok();
}

export function canRunRegioContentInput(context: ScimContext): ScimPanelGuardResult {
  const b = requireState(
    'panel_2_regio_content_input',
    'system_adjust',
    context.system_adjust,
    'context.system_adjust'
  );
  return b ? blocked([b]) : ok();
}

export function canRunTargetAppUiInput(context: ScimContext): ScimPanelGuardResult {
  const blockers: ScimIssue[] = [];
  const b1 = requireState(
    'panel_3_target_app_ui_input',
    'system_adjust',
    context.system_adjust,
    'context.system_adjust'
  );
  const b2 = requireState(
    'panel_3_target_app_ui_input',
    'regio_content',
    context.regio_content,
    'context.regio_content'
  );
  if (b1) blockers.push(b1);
  if (b2) blockers.push(b2);
  return blockers.length > 0 ? blocked(blockers) : ok();
}

export function canRunTelcoLoadInput(context: ScimContext): ScimPanelGuardResult {
  const blockers: ScimIssue[] = [];
  const b1 = requireState(
    'panel_4_telco_load_input',
    'system_adjust',
    context.system_adjust,
    'context.system_adjust'
  );
  if (b1) blockers.push(b1);
  return blockers.length > 0 ? blocked(blockers) : ok();
}

export function canRunBoundaryExtraction(context: ScimContext): ScimPanelGuardResult {
  const blockers: ScimIssue[] = [];
  for (const [key, path] of [
    ['system_adjust', 'context.system_adjust'],
    ['regio_content', 'context.regio_content'],
    ['target_app_ui', 'context.target_app_ui'],
  ] as const) {
    const b = requireState(
      'panel_7_boundary_extraction',
      key,
      (context as unknown as Record<string, unknown>)[key],
      path
    );
    if (b) blockers.push(b);
  }
  return blockers.length > 0 ? blocked(blockers) : ok();
}

export function canRunGraphBasisLayer(context: ScimContext): ScimPanelGuardResult {
  const blockers: ScimIssue[] = [];
  for (const [key, path] of [
    ['boundary', 'context.boundary'],
    ['extracted_data', 'context.extracted_data'],
    ['system_adjust', 'context.system_adjust'],
  ] as const) {
    const b = requireState(
      'panel_8_graph_basislayer',
      key,
      (context as unknown as Record<string, unknown>)[key],
      path
    );
    if (b) blockers.push(b);
  }
  return blockers.length > 0 ? blocked(blockers) : ok();
}

export function canRunPoiLoadMovement(context: ScimContext): ScimPanelGuardResult {
  const blockers: ScimIssue[] = [];
  for (const [key, path] of [
    ['graph', 'context.graph'],
    ['basis_layer', 'context.basis_layer'],
    ['system_adjust', 'context.system_adjust'],
    ['regio_content', 'context.regio_content'],
  ] as const) {
    const b = requireState(
      'panel_9_poi_load_movement',
      key,
      (context as unknown as Record<string, unknown>)[key],
      path
    );
    if (b) blockers.push(b);
  }
  return blockers.length > 0 ? blocked(blockers) : ok();
}

export function canRunRouteEvaluationDisplay(context: ScimContext): ScimPanelGuardResult {
  const blockers: ScimIssue[] = [];
  for (const [key, path] of [
    ['poi_model', 'context.poi_model'],
    ['movement_model', 'context.movement_model'],
    ['masking_model', 'context.masking_model'],
    ['graph', 'context.graph'],
  ] as const) {
    const b = requireState(
      'panel_10_route_evaluation_display',
      key,
      (context as unknown as Record<string, unknown>)[key],
      path
    );
    if (b) blockers.push(b);
  }
  return blockers.length > 0 ? blocked(blockers) : ok();
}

export function canRunSensusCorePackageBuilder(context: ScimContext): ScimPanelGuardResult {
  const blockers: ScimIssue[] = [];
  for (const [key, path] of [
    ['route_model', 'context.route_model'],
    ['route_layer_model', 'context.route_layer_model'],
    ['system_adjust', 'context.system_adjust'],
  ] as const) {
    const b = requireState(
      'panel_11_sensus_core_package_builder',
      key,
      (context as unknown as Record<string, unknown>)[key],
      path
    );
    if (b) blockers.push(b);
  }
  return blockers.length > 0 ? blocked(blockers) : ok();
}

export function canRunSensusCoreLocal(context: ScimContext): ScimPanelGuardResult {
  const b = requireState(
    'panel_12_sensus_core_local',
    'sensus_core_package',
    context.sensus_core_package,
    'context.sensus_core_package'
  );
  return b ? blocked([b]) : ok();
}

export function canRunLeafletEffectCheck(context: ScimContext): ScimPanelGuardResult {
  const blockers: ScimIssue[] = [];
  for (const [key, path] of [
    ['sensus_core_package', 'context.sensus_core_package'],
    ['route_model', 'context.route_model'],
  ] as const) {
    const b = requireState(
      'panel_13_leaflet_effect_check',
      key,
      (context as unknown as Record<string, unknown>)[key],
      path
    );
    if (b) blockers.push(b);
  }
  return blockers.length > 0 ? blocked(blockers) : ok();
}

export function canRunReleaseExport(context: ScimContext): ScimPanelGuardResult {
  const blockers: ScimIssue[] = [];
  for (const [key, path] of [
    ['sensus_core_package', 'context.sensus_core_package'],
    ['leaflet_effect_check', 'context.leaflet_effect_check'],
    ['system_adjust', 'context.system_adjust'],
  ] as const) {
    const b = requireState(
      'panel_14_release_export',
      key,
      (context as unknown as Record<string, unknown>)[key],
      path
    );
    if (b) blockers.push(b);
  }
  return blockers.length > 0 ? blocked(blockers) : ok();
}
