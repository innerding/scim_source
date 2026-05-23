import type { GeoPoint, GeoJsonPolygon } from '../context/scimContext.types';

export type StayZoneStatus =
  | 'not_computed'
  | 'computing'
  | 'stay_zone_valid'
  | 'stay_zone_warning'
  | 'stay_zone_error'
  | 'stay_zone_skipped'; // classification_mode = 'movement_only'

export type ZoneClassification =
  | 'rast'       // Stufe 3a: Stillstand + hoher Durchsatz
  | 'stau'       // Stufe 3b: Stillstand + kein Durchsatz
  | 'undecided'; // Operator-Entscheid ausstehend

export type ZoneOperatorStatus =
  | 'pending'
  | 'committed_full'
  | 'committed_adapted'
  | 'rejected_with_reason';

export interface DetectedStayZone {
  zone_id: string;
  center: GeoPoint;
  radius_meters: number;
  classification: ZoneClassification;
  throughput_ratio: number;
  confidence_score: number;
  edge_ids_within_radius: string[];
  is_off_path: boolean;
  overlap_conflict: boolean;
  operator_status: ZoneOperatorStatus;
  operator_rejection_reason?: string;
  operator_freflaeche_geometry?: GeoJsonPolygon;
}

export interface StayZoneDetectorIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface StayZoneDetectorValidationResult {
  is_valid: boolean;
  errors: StayZoneDetectorIssue[];
  warnings: StayZoneDetectorIssue[];
  checked_at: string;
}

export interface StayZoneDetectorState {
  detector_id: string;
  movement_model_id: string;
  detected_zones: DetectedStayZone[];
  jam_count: number;
  rast_count: number;
  overlap_conflicts: string[];
  step2_activation_condition_met: boolean;
  validation: StayZoneDetectorValidationResult;
  status: StayZoneStatus;
  computed_at: string;
}
