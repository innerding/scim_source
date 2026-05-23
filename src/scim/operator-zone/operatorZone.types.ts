import type { GeoPoint } from '../context/scimContext.types';

export type OperatorZoneStatus =
  | 'not_evaluated'
  | 'operator_zone_valid'
  | 'operator_zone_warning'
  | 'operator_zone_invalid';

// ── Dimension 1: Semantik ─────────────────────────────────────────────────────

export type ZoneSemanticType =
  | 'rest_area'        // Berggasthof, Schutzhütte, Rastplatz
  | 'viewpoint'        // Aussichtspunkt
  | 'gathering_point'  // Dorfplatz, Treffpunkt
  | 'event_area'       // Veranstaltungsfläche
  | 'custom';          // manuell beschrieben

// ── Dimension 2: Zeitlichkeit ─────────────────────────────────────────────────

export type ZoneTemporalScope =
  | 'permanent'  // immer aktiv
  | 'seasonal'   // z.B. Sommersaison, braucht valid_from + valid_until
  | 'event';     // einmalige Veranstaltung, braucht valid_from + valid_until

// ── Dimension 3: Klassifizierungsgrundlage ────────────────────────────────────

export type ZoneClassificationBasis =
  | 'operator_defined'  // manuell gesetzt
  | 'signal_pattern'    // aus räumlichem Signalmuster abgeleitet
  | 'dwell_time';       // aus Telco-Verweildaten

// ── Kartendarstellung ─────────────────────────────────────────────────────────

export type ZoneMapIcon =
  | 'hut'          // rest_area
  | 'binoculars'   // viewpoint
  | 'people'       // gathering_point
  | 'flag'         // event_area
  | 'circle';      // custom / fallback

export interface ZoneMapStyle {
  icon: ZoneMapIcon;
  color: string;   // hex
  fill_opacity: number;
  border_opacity: number;
}

// ── Kerntyp ───────────────────────────────────────────────────────────────────

export interface OperatorDefinedZone {
  zone_id: string;
  label: string;
  center: GeoPoint;
  radius_meters: number;
  semantic_type: ZoneSemanticType;
  temporal_scope: ZoneTemporalScope;
  valid_from?: string;           // ISO-Datum, für seasonal + event
  valid_until?: string;          // ISO-Datum, für seasonal + event
  classification_basis: ZoneClassificationBasis;
  exclude_from_routing: boolean;
  map_style?: ZoneMapStyle;
  custom_description?: string;
  created_at: string;
  created_by?: string;
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface OperatorZoneIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface OperatorZoneValidationResult {
  is_valid: boolean;
  errors: OperatorZoneIssue[];
  warnings: OperatorZoneIssue[];
  checked_at: string;
  active_zone_count: number;
  expired_zone_count: number;
}

// ── State ─────────────────────────────────────────────────────────────────────

export interface OperatorZoneState {
  zone_set_id: string;
  zones: OperatorDefinedZone[];
  active_zone_count: number;
  expired_zone_count: number;
  pending_zone_count: number;     // valid_from in der Zukunft
  operator_only_basis: boolean;   // alle Zonen sind operator_defined
  validation: OperatorZoneValidationResult;
  status: OperatorZoneStatus;
  evaluated_at: string;
}
