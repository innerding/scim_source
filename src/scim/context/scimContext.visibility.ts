export type ScimVisibility =
  | 'sensus_core_visible'
  | 'operator_preview_only'
  | 'debug_only'
  | 'hidden'
  | 'export_public'
  | 'archive_internal';

export type ScimLayerDataClass =
  | 'public_aggregate'
  | 'reduced_scim_result'
  | 'public_route'
  | 'public_warning'
  | 'operator_internal'
  | 'debug'
  | 'raw_signal'
  | 'privacy_blocked';

export const SENSUS_CORE_ALLOWED_DATA_CLASSES = new Set<ScimLayerDataClass>([
  'public_aggregate',
  'reduced_scim_result',
  'public_route',
  'public_warning',
]);

export const SENSUS_CORE_ALLOWED_VISIBILITIES = new Set<ScimVisibility>([
  'sensus_core_visible',
  'export_public',
]);

export function isSensusCoreSafe(dataClass: ScimLayerDataClass): boolean {
  return SENSUS_CORE_ALLOWED_DATA_CLASSES.has(dataClass);
}

export function isVisibilityAllowedInSensusCore(visibility: ScimVisibility): boolean {
  return SENSUS_CORE_ALLOWED_VISIBILITIES.has(visibility);
}
