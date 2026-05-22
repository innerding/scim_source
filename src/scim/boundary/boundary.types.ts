import type { GeoJsonPolygon, GeoJsonMultiPolygon, BBox, GeoPoint } from '../context/scimContext.types';

export type BoundaryStatus =
  | 'not_computed'
  | 'computing'
  | 'boundary_valid'
  | 'boundary_invalid'
  | 'boundary_warning'
  | 'boundary_error';

export type BoundarySource =
  | 'regio_content_geometry'
  | 'regio_content_bbox'
  | 'system_adjust_fallback'
  | 'manual_override';

export interface BoundaryBufferSpec {
  computed_buffer_meters: number;
  min_buffer_meters: number;
  max_buffer_meters: number;
  max_poi_radius_meters: number;
  comparison_margin_meters: number;
  clamped: boolean;
  clamped_reason?: 'below_min' | 'above_max';
}

export interface ComputedBoundary {
  boundary_id: string;
  geometry: GeoJsonPolygon | GeoJsonMultiPolygon;
  bbox: BBox;
  center: GeoPoint;
  area_sqkm?: number;
  related_region_id?: string;
  computed_at: string;
  source: BoundarySource;
}

export interface BoundaryIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface BoundaryValidationResult {
  is_valid: boolean;
  errors: BoundaryIssue[];
  warnings: BoundaryIssue[];
  checked_at: string;
  checked_against_system_adjust_version: string;
  checked_against_regio_content_version?: string;
}

export interface BoundaryState {
  boundary_id: string;
  computed_boundary: ComputedBoundary;
  buffer_spec: BoundaryBufferSpec;
  poi_count_within: number;
  validation: BoundaryValidationResult;
  status: BoundaryStatus;
  computed_at: string;
}
