export type SensusCorePackageStatus =
  | 'not_built'
  | 'building'
  | 'package_valid'
  | 'package_invalid'
  | 'package_warning';

export type SensusCoreExportFormat =
  | 'sensus_core_json'
  | 'geojson'
  | 'protobuf'
  | 'internal_snapshot';

export interface SensusCorePackageContent {
  route_segments_count: number;
  poi_states_count: number;
  layer_count: number;
  data_classes_included: string[];
  raw_signals_present: false;
  device_ids_present: false;
  debug_data_present: false;
  /**
   * Klassifikations-Modus zum Zeitpunkt der Package-Erstellung.
   * Steuert in der Ziel-App ob Step-2-Features (BCK-Rest, Comfort-Slider)
   * sichtbar und aktiv sind.
   *   'movement_only'    → kein Stau bestätigt, Step-2-UI ausgeblendet
   *   'movement_and_stay' → Stau bestätigt, BCK-Rest + Comfort-Slider aktiv
   */
  classification_mode: 'movement_only' | 'movement_and_stay';
}

export interface SensusCorePackageIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface SensusCorePackageValidationResult {
  is_valid: boolean;
  errors: SensusCorePackageIssue[];
  warnings: SensusCorePackageIssue[];
  checked_at: string;
  checked_against_layer_model_id: string;
  checked_against_system_adjust_version: string;
}

export interface SensusCorePackageState {
  package_id: string;
  layer_model_id: string;
  route_layer_model_id?: string;
  poi_model_id?: string;
  export_format: SensusCoreExportFormat;
  schema_version: string;
  content: SensusCorePackageContent;
  validation: SensusCorePackageValidationResult;
  status: SensusCorePackageStatus;
  generated_at: string;
}
