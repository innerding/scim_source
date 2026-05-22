import type { ReleaseExportState, ReleaseExportIssue, ReleaseExportValidationResult } from './releaseExport.types';
import type { SensusCorePackageState } from '../sensus-core-package/sensusCorePackage.types';
import type { LeafletEffectCheckState } from '../leaflet-effect-check/leafletEffectCheck.types';

function err(code: string, message: string, field?: string): ReleaseExportIssue {
  return { code, severity: 'error', field, message, blocking: true };
}

function warn(code: string, message: string, field?: string): ReleaseExportIssue {
  return { code, severity: 'warning', field, message, blocking: false };
}

export function validateReleaseExport(
  state: ReleaseExportState,
  sensusCorePackage: SensusCorePackageState | undefined,
  effectCheck: LeafletEffectCheckState | undefined,
): ReleaseExportValidationResult {
  const errors: ReleaseExportIssue[] = [];
  const warnings: ReleaseExportIssue[] = [];

  if (!sensusCorePackage) {
    errors.push(err('REL_PACKAGE_MISSING', 'Sensus-Core-Package is missing.', 'package'));
  } else if (sensusCorePackage.status !== 'package_valid' && sensusCorePackage.status !== 'package_warning') {
    errors.push(err('REL_PACKAGE_INVALID', `Package status is '${sensusCorePackage.status}'.`, 'package'));
  }

  // Hardcoded export safety invariants
  if (!state.metadata.privacy_verified) {
    errors.push(err('REL_PRIVACY_NOT_VERIFIED', 'metadata.privacy_verified must be true for release.', 'metadata.privacy_verified'));
  }
  if (!state.metadata.sensus_core_safe) {
    errors.push(err('REL_NOT_SENSUS_CORE_SAFE', 'metadata.sensus_core_safe must be true for release.', 'metadata.sensus_core_safe'));
  }
  if ((state.metadata.raw_signals_excluded as unknown as boolean) !== true) {
    errors.push(err('REL_RAW_SIGNALS_NOT_EXCLUDED', 'metadata.raw_signals_excluded must be true.', 'metadata.raw_signals_excluded'));
  }
  if ((state.metadata.device_ids_excluded as unknown as boolean) !== true) {
    errors.push(err('REL_DEVICE_IDS_NOT_EXCLUDED', 'metadata.device_ids_excluded must be true.', 'metadata.device_ids_excluded'));
  }

  if (!state.metadata.released_by) {
    errors.push(err('REL_RELEASED_BY_MISSING', 'metadata.released_by is missing.', 'metadata.released_by'));
  }

  if (!effectCheck) {
    warnings.push(warn('REL_EFFECT_CHECK_MISSING', 'No Leaflet effect check was performed before release.', 'effect_check'));
  } else if (effectCheck.status !== 'effect_check_ok') {
    warnings.push(warn('REL_EFFECT_CHECK_NOT_OK', `Leaflet effect check status is '${effectCheck.status}'.`, 'effect_check'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_package_id: sensusCorePackage?.package_id ?? 'missing',
    checked_against_effect_check_id: effectCheck?.check_id,
  };
}
