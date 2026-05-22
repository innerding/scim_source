import type { ScimSourceRef } from './scimContext.sourceRefs';
import type { ScimValidationResult } from './scimContext.validation';
import type { ScimIssue } from './scimContext.issues';
import type { ScimGlobalStatus } from './scimContext.status';
import type { ScimRunMode } from './scimContext.privacy';

// ── Geo primitives ────────────────────────────────────────────────────────────

export type BBox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lon, lat]
}

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: [number, number][][][];
}

export type GeoJsonGeometry =
  | GeoJsonPoint
  | GeoJsonLineString
  | GeoJsonPolygon
  | GeoJsonMultiPolygon;

export interface CoordinateReferenceSystem {
  crs_id: 'EPSG:4326' | 'EPSG:3857' | 'custom';
  axis_order: 'lon_lat' | 'lat_lon' | 'xy';
  source?: string;
}

// ── Shared primitives ─────────────────────────────────────────────────────────

export interface NumericRange {
  min: number;
  max: number;
  default?: number;
  step?: number;
  unit?: string;
}

// ── ScimStateBase ─────────────────────────────────────────────────────────────

export interface ScimStateBase {
  id: string;
  representation_id?: string;
  created_at: string;
  updated_at?: string;
  source?: ScimSourceRef;
  version?: string;
  validation: ScimValidationResult;
  issue_list: ScimIssue[];
  status: string;
}

// ── Panel state stubs ─────────────────────────────────────────────────────────
// Minimal structural contracts — each panel module defines the full type.
// Structural typing ensures panel-specific types are assignable here.

export interface SystemAdjustState { status: string }
export interface RegioContentState { status: string }
export interface TargetAppUiState { status: string }
export interface TelcoLoadState { status: string }
export interface BoundaryState { status: string; representation_id?: string }
export interface ExtractionState { status: string }
export interface ScimRuntimeContextState { status: string }
export interface GraphState { status: string; representation_id?: string }
export interface BasisLayerState { status: string }
export interface LeafletBasisCheckState { status: string }
export interface PoiModelState { status: string }
export interface LoadProjectionState { status: string }
export interface MovementModelState { status: string }
export interface MaskingModelState { status: string }
export interface RouteModelState { status: string }
export interface RouteLayerModelState { status: string }
export interface LayerModelState { status: string }
export interface SensusCorePackageState { status: string }
export interface SensusCoreLocalState { status: string }
export interface SensusCoreViewState { status: string }
export interface LeafletEffectCheckState { status: string }
export interface ReleaseExportState { status: string }

// ── ScimContextAudit ──────────────────────────────────────────────────────────
// Defined here to avoid circular import with scimContext.audit.ts

export type ScimContextAuditAction =
  | 'created'
  | 'updated'
  | 'validated'
  | 'invalidated'
  | 'blocked'
  | 'warning_added'
  | 'error_added'
  | 'exported'
  | 'released';

// ── ScimContext ───────────────────────────────────────────────────────────────

export interface ScimContext {
  representation_id?: string;
  run_mode?: ScimRunMode;

  system_adjust?: SystemAdjustState;
  regio_content?: RegioContentState;
  target_app_ui?: TargetAppUiState;
  telco_load?: TelcoLoadState;

  boundary?: BoundaryState;
  extracted_data?: ExtractionState;

  scim_context?: ScimRuntimeContextState;
  graph?: GraphState;
  basis_layer?: BasisLayerState;
  leaflet_check?: LeafletBasisCheckState;

  poi_model?: PoiModelState;
  load_model?: LoadProjectionState;
  movement_model?: MovementModelState;
  masking_model?: MaskingModelState;

  route_model?: RouteModelState;
  route_layer_model?: RouteLayerModelState;
  layer_model?: LayerModelState;

  sensus_core_package?: SensusCorePackageState;
  local_user_context?: SensusCoreLocalState;
  view_state?: SensusCoreViewState;

  leaflet_effect_check?: LeafletEffectCheckState;
  release?: ReleaseExportState;

  status?: ScimGlobalStatus;
  audit?: import('./scimContext.audit').ScimContextAudit;
}

export function makeEmptyContext(runMode: ScimRunMode = 'draft'): ScimContext {
  return {
    run_mode: runMode,
    status: 'not_started',
  };
}
