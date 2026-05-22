import type { GeoPoint, BBox } from '../context/scimContext.types';

export type BasisLayerStatus =
  | 'not_built'
  | 'building'
  | 'basis_layer_valid'
  | 'basis_layer_invalid'
  | 'basis_layer_warning';

export type TileLayerType =
  | 'osm_base'
  | 'hillshade'
  | 'terrain'
  | 'aerial'
  | 'satellite'
  | 'custom';

export interface TileLayerSpec {
  tile_layer_id: string;
  layer_type: TileLayerType;
  tile_url_template: string;
  min_zoom: number;
  max_zoom: number;
  attribution: string;
  opacity: number;
  visible: boolean;
  z_index: number;
}

export interface BasisLayerViewport {
  center: GeoPoint;
  bbox: BBox;
  default_zoom: number;
  min_zoom: number;
  max_zoom: number;
  aspect_ratio?: number;
}

export interface BasisLayerIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface BasisLayerValidationResult {
  is_valid: boolean;
  errors: BasisLayerIssue[];
  warnings: BasisLayerIssue[];
  checked_at: string;
  checked_against_boundary_id: string;
  checked_against_graph_id?: string;
}

export interface BasisLayerState {
  basis_layer_id: string;
  boundary_id: string;
  graph_id?: string;
  tile_layers: TileLayerSpec[];
  viewport: BasisLayerViewport;
  validation: BasisLayerValidationResult;
  status: BasisLayerStatus;
  built_at: string;
}
