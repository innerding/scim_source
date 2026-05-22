export type ReleaseExportStatus =
  | 'not_released'
  | 'preparing'
  | 'released'
  | 'release_failed'
  | 'release_expired';

export type ReleaseExportFormat =
  | 'sensus_core_json'
  | 'geojson'
  | 'protobuf'
  | 'internal_snapshot';

export interface ReleaseExportMetadata {
  released_by: string;
  release_note?: string;
  target_format: ReleaseExportFormat;
  schema_version: string;
  privacy_verified: boolean;
  sensus_core_safe: boolean;
  raw_signals_excluded: true;
  device_ids_excluded: true;
}

export interface ReleaseExportIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface ReleaseExportValidationResult {
  is_valid: boolean;
  errors: ReleaseExportIssue[];
  warnings: ReleaseExportIssue[];
  checked_at: string;
  checked_against_package_id: string;
  checked_against_effect_check_id?: string;
}

export interface ReleaseExportState {
  release_id: string;
  package_id: string;
  effect_check_id?: string;
  metadata: ReleaseExportMetadata;
  validation: ReleaseExportValidationResult;
  status: ReleaseExportStatus;
  released_at: string;
  expires_at?: string;
}
