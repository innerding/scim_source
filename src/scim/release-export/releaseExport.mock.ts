import type { ReleaseExportState } from './releaseExport.types';

export const mockReleaseExportState: ReleaseExportState = {
  release_id: 'rel_hochwab_001',
  package_id: 'pkg_hochwab_001',
  effect_check_id: 'lec_001',
  metadata: {
    released_by: 'scim_pipeline',
    release_note: 'Hochschwab Nord — Mock-Release',
    target_format: 'sensus_core_json',
    schema_version: '3.0.0',
    privacy_verified: true,
    sensus_core_safe: true,
    raw_signals_excluded: true,
    device_ids_excluded: true,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:18:00.000Z',
    checked_against_package_id: 'pkg_hochwab_001',
    checked_against_effect_check_id: 'lec_001',
  },
  status: 'released',
  released_at: '2026-05-21T00:18:00.000Z',
};
