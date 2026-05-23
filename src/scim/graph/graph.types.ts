import type { GeoPoint, GeoJsonLineString } from '../context/scimContext.types';

export type GraphStatus =
  | 'not_built'
  | 'building'
  | 'graph_valid'
  | 'graph_invalid'
  | 'graph_warning'
  | 'graph_error';

export type GraphNodeType =
  | 'junction'
  | 'poi_anchor'
  | 'boundary_intersection'
  | 'trailhead'
  | 'endpoint'
  | 'elevation_peak'
  | 'stay_boundary'
  | 'entry_exit';

export type GraphNodeSemanticRole =
  | 'zone_boundary'
  | 'routing_excluded'
  | 'operator_entry_point';

export type GraphEdgeType =
  | 'trail'
  | 'path'
  | 'road'
  | 'connector'
  | 'boundary_edge';

export type DifficultyClass = 'easy' | 'moderate' | 'difficult' | 'expert' | 'unknown';

export interface GraphNode {
  node_id: string;
  geometry: GeoPoint;
  node_type: GraphNodeType;
  elevation_meters?: number;
  connected_edge_ids: string[];
  poi_id?: string;
  stay_zone_id?: string;
  semantic_role?: GraphNodeSemanticRole;
}

export interface GraphEdge {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  geometry: GeoJsonLineString;
  length_meters: number;
  edge_type: GraphEdgeType;
  surface_type?: string;
  difficulty_class: DifficultyClass;
  bidirectional: boolean;
  load_score?: number;
  route_relevance_score?: number;
}

export interface GraphMetrics {
  node_count: number;
  edge_count: number;
  total_length_meters: number;
  connected_components: number;
  poi_anchor_count: number;
  coverage_ratio: number;
}

export interface GraphIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}

export interface GraphValidationResult {
  is_valid: boolean;
  errors: GraphIssue[];
  warnings: GraphIssue[];
  checked_at: string;
  checked_against_boundary_id: string;
  checked_against_extraction_id?: string;
}

export interface GraphState {
  graph_id: string;
  boundary_id: string;
  extraction_id?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: GraphMetrics;
  validation: GraphValidationResult;
  status: GraphStatus;
  built_at: string;
}
