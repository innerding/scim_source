import type { BBox, GeoJsonLineString, GeoPoint } from '../context/scimContext.types';
import type { GraphEdgeType, GraphNodeType, DifficultyClass } from '../graph/graph.types';
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';
import type { RegioContentState } from '../regio-content/regioContent.types';
import type { TargetAppUiState } from '../target-app-ui/targetAppUi.types';
import type { TelcoLoadState } from '../telco-load/telcoLoad.types';
import type { ScimContext } from '../context/scimContext.types';
import type { ReleaseExportState } from '../release-export/releaseExport.types';

// ── Raw road-network input ────────────────────────────────────────────────────

export interface RoadNetworkNode {
  node_id: string;
  geometry: GeoPoint;
  node_type: GraphNodeType;
  elevation_meters?: number;
}

export interface RoadNetworkEdge {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  geometry: GeoJsonLineString;
  length_meters: number;
  edge_type: GraphEdgeType;
  surface_type?: string;
  difficulty_class: DifficultyClass;
  bidirectional: boolean;
}

export interface RoadNetworkData {
  source: 'osm' | 'local_geojson' | 'mock';
  nodes: RoadNetworkNode[];
  edges: RoadNetworkEdge[];
  bbox?: BBox;
  extracted_at?: string;
}

// ── User tolerances input ─────────────────────────────────────────────────────

export interface UserTolerancesInput {
  route_load_tolerance: number;
  max_acceptable_load_score: number;
  preferred_difficulty?: 'easy' | 'moderate' | 'difficult' | 'any';
  prefer_quiet_pois?: boolean;
}

// ── Pipeline inputs ───────────────────────────────────────────────────────────

export interface ScimPipelineInputs {
  /** System configuration — provided by the operator via SCIM console. */
  system_adjust: SystemAdjustState;
  /** Regional POI and parameter data — from the regio dashboard. */
  regio_content: RegioContentState;
  /** Target-app UI profile configuration. */
  target_app_ui: TargetAppUiState;
  /** Aggregated telco load measurements. */
  telco_load: TelcoLoadState;
  /** Raw road-network topology (e.g. from OSM). */
  road_network: RoadNetworkData;
  /** Optional user-specific tolerances (activates Panel 10). */
  user_tolerances?: UserTolerancesInput;

  run_id?: string;
  requested_at?: string;
  operator_id?: string;
}

// ── Per-step result ───────────────────────────────────────────────────────────

export type ScimPipelineStepId =
  // Group 1 — Inputs
  | 'P01_system_adjust'
  | 'P02_regio_content'
  | 'P03_target_app_ui'
  | 'P04_telco_load'
  | 'P05_operator_zones'
  | 'P06_signal_interpretation'
  // Group 2 — Boundary + Graph
  | 'P07_boundary'
  | 'P07_extraction'
  | 'P08_graph'
  | 'P08_basis_layer'
  // Group 3 — Engine
  | 'P09_load_projection'
  | 'P09_movement_model'
  | 'P09_stay_zone_detector'
  | 'P09_operator_decision'
  | 'P09_step2_activation'
  | 'P09_poi_model'
  | 'P09_masking_model'
  // Group 3 — Route
  | 'P10_route_model'
  | 'P10_route_layer_model'
  | 'P10_layer_model'
  // Group 4 — Export
  | 'P11_sensus_core_package'
  | 'P12_sensus_core_local'
  | 'P13_leaflet_effect_check'
  | 'P14_release_export';

export interface ScimPipelineStepResult {
  step_id: ScimPipelineStepId;
  success: boolean;
  duration_ms: number;
  validation_errors: number;
  validation_warnings: number;
}

export interface ScimPipelineError {
  step_id: ScimPipelineStepId;
  code: string;
  message: string;
}

// ── Final pipeline result ─────────────────────────────────────────────────────

export interface ScimPipelineResult {
  run_id: string;
  success: boolean;
  /** Full context at completion — all panel states are populated on success. */
  context: ScimContext;
  /** The releasable output — only set when success is true. */
  release?: ReleaseExportState;
  failed_at_step?: ScimPipelineStepId;
  steps: ScimPipelineStepResult[];
  errors: ScimPipelineError[];
  warnings: ScimPipelineError[];
  started_at: string;
  completed_at: string;
  duration_ms: number;
}
