import type { GeoPoint } from '../context/scimContext.types';

export type SensusCoreViewStatus =
  | 'not_initialized'
  | 'view_active'
  | 'view_stale'
  | 'view_error';

export interface ActiveLayerState {
  layer_id: string;
  visible: boolean;
  opacity: number;
}

export interface ViewInteractionState {
  selected_poi_id?: string;
  highlighted_edge_id?: string;
  hovered_segment_id?: string;
}

export interface SensusCoreViewIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}

export interface SensusCoreViewValidationResult {
  is_valid: boolean;
  errors: SensusCoreViewIssue[];
  warnings: SensusCoreViewIssue[];
  checked_at: string;
  checked_against_package_id?: string;
}

export interface SensusCoreViewState {
  view_id: string;
  package_id?: string;
  active_layers: ActiveLayerState[];
  viewport_center: GeoPoint;
  viewport_zoom: number;
  interaction: ViewInteractionState;
  validation: SensusCoreViewValidationResult;
  status: SensusCoreViewStatus;
  initialized_at: string;
  last_updated_at: string;
}
