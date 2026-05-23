/**
 * Compute functions for all pipeline panels.
 *
 * Panels 1–4: normalization + derivation (Step B).
 * Panels 5–6: spatial computation — boundary, extraction, graph, basis layer (Step C).
 * Panels 7–12: stubs returning mocks, replaced in Steps D–E.
 *
 * Each function returns a state with status = 'not_computed' / 'not_built' etc.
 * The orchestrator stamps the real status from the validation result.
 */

import type { GeoPoint, BBox, GeoJsonPolygon } from '../context/scimContext.types';
import type { ScimContext } from '../context/scimContext.types';
import type { ScimPipelineInputs } from './scimPipeline.types';

// Panel 1–4 types
import type { SystemAdjustState } from '../system-adjust/systemAdjust.types';
import type { RegioContentState, PoiRadius } from '../regio-content/regioContent.types';
import type { TargetAppUiState } from '../target-app-ui/targetAppUi.types';
import type {
  TelcoLoadState,
  LoadSignalQualitySummary,
  LoadPrivacyCheck,
  LoadQualityLevel,
} from '../telco-load/telcoLoad.types';

// Panel 5 types
import type {
  BoundaryState,
  BoundaryBufferSpec,
  ComputedBoundary,
} from '../boundary/boundary.types';
import type {
  ExtractionState,
  ExtractedPoi,
  ExtractedSignalGroup,
} from '../extraction/extraction.types';

// Panel 6 types
import type { GraphState, GraphNode, GraphEdge, GraphMetrics } from '../graph/graph.types';
import type {
  BasisLayerState,
  TileLayerSpec,
  BasisLayerViewport,
} from '../basis-layer/basisLayer.types';
import type {
  LeafletBasisCheckState,
  LeafletBasisCheckResult,
} from '../leaflet-basis-check/leafletBasisCheck.types';

// Panel 7–12 types
import type {
  PoiModelState,
  PoiLoadState,
  PoiModelMetrics,
  PoiLoadClass,
  StayClassification,
} from '../poi-model/poiModel.types';
import type {
  LoadProjectionState,
  EdgeLoadScore,
  LoadProjectionMetrics,
  EdgeLoadClass,
} from '../load-projection/loadProjection.types';
import type {
  MovementModelState,
  EdgeMovementState,
  MovementModelMetrics,
  MovementClass,
} from '../movement-model/movementModel.types';
import type {
  MaskingModelState,
  MaskedElement,
  MaskingModelMetrics,
} from '../masking-model/maskingModel.types';
import type {
  RouteModelState,
  RouteEdgeEvaluation,
  RouteModelMetrics,
  RouteScoreClass,
  RouteDecision,
} from '../route-model/routeModel.types';
import type {
  RouteLayerModelState,
  RouteLayerSegment,
  ScoreClassStyle,
} from '../route-layer-model/routeLayerModel.types';
import type { LayerModelState, ScimLayer } from '../layer-model/layerModel.types';
import type {
  SensusCorePackageState,
  SensusCorePackageContent,
} from '../sensus-core-package/sensusCorePackage.types';
import type {
  SensusCoreLocalState,
  UserTolerances,
} from '../sensus-core-local/sensusCoreLocal.types';
import type {
  SensusCoreViewState,
  ActiveLayerState,
} from '../sensus-core-view/sensusCoreView.types';
import type {
  LeafletEffectCheckState,
  LeafletRenderResult,
} from '../leaflet-effect-check/leafletEffectCheck.types';
import type {
  ReleaseExportState,
  ReleaseExportMetadata,
} from '../release-export/releaseExport.types';
import type {
  ScimRuntimeContextState,
  ScimRuntimeContextVersions,
} from '../scim-runtime-context/scimRuntimeContext.types';


// ── Geo helpers ───────────────────────────────────────────────────────────────

function inBbox(lon: number, lat: number, bbox: BBox): boolean {
  return lon >= bbox[0] && lon <= bbox[2] && lat >= bbox[1] && lat <= bbox[3];
}

/** Expand a bbox outward by `meters` in all directions. */
function expandBbox(bbox: BBox, meters: number): BBox {
  const midLat = (bbox[1] + bbox[3]) / 2;
  const deltaLat = meters / 111_000;
  const deltaLon = meters / (111_000 * Math.cos((midLat * Math.PI) / 180));
  return [bbox[0] - deltaLon, bbox[1] - deltaLat, bbox[2] + deltaLon, bbox[3] + deltaLat];
}

/** Compute center point of a bbox. */
function bboxCenter(bbox: BBox): GeoPoint {
  return { type: 'Point', coordinates: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] };
}

/** Rectangular polygon from a bbox. */
function bboxToPolygon(bbox: BBox): GeoJsonPolygon {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  return {
    type: 'Polygon',
    coordinates: [
      [
        [minLon, minLat],
        [maxLon, minLat],
        [maxLon, maxLat],
        [minLon, maxLat],
        [minLon, minLat],
      ],
    ],
  };
}

/** Approximate area of a bbox in km². */
function bboxAreaSqkm(bbox: BBox): number {
  const midLat = (bbox[1] + bbox[3]) / 2;
  const dLon = bbox[2] - bbox[0];
  const dLat = bbox[3] - bbox[1];
  return dLon * dLat * 111 * 111 * Math.cos((midLat * Math.PI) / 180);
}

/** Approximate distance in meters between two lon/lat points. */
function geoDistMeters(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const midLat = (lat1 + lat2) / 2;
  const dLat = (lat2 - lat1) * 111_000;
  const dLon = (lon2 - lon1) * 111_000 * Math.cos((midLat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/** Mid-coordinate of a LineString geometry. */
function lineMidCoord(coords: [number, number][]): [number, number] {
  if (coords.length === 0) return [0, 0];
  return coords[Math.floor(coords.length / 2)];
}

function scoreToPoiLoadClass(score: number): PoiLoadClass {
  if (score >= 0.8) return 'very_busy';
  if (score >= 0.6) return 'busy';
  if (score >= 0.3) return 'moderate';
  if (score > 0) return 'quiet';
  return 'unknown';
}

function scoreToEdgeLoadClass(score: number): EdgeLoadClass {
  if (score >= 0.8) return 'very_busy';
  if (score >= 0.6) return 'busy';
  if (score >= 0.3) return 'moderate';
  if (score > 0) return 'quiet';
  return 'unknown';
}

function scoreToMovementClass(score: number): MovementClass {
  if (score >= 0.7) return 'high_flow';
  if (score >= 0.4) return 'moderate_flow';
  if (score >= 0.1) return 'low_flow';
  return 'static';
}

function scoreToRouteClass(score: number): RouteScoreClass {
  if (score >= 0.9) return 'red';
  if (score >= 0.65) return 'orange';
  if (score >= 0.4) return 'yellow';
  if (score > 0) return 'green';
  return 'unknown';
}

const SCORE_CLASS_STYLES: ScoreClassStyle[] = [
  { score_class: 'green',   color: '#3d9970', opacity: 0.8, weight: 4 },
  { score_class: 'yellow',  color: '#ffdc00', opacity: 0.8, weight: 4 },
  { score_class: 'orange',  color: '#ff851b', opacity: 0.9, weight: 5 },
  { score_class: 'red',     color: '#ff4136', opacity: 0.9, weight: 5 },
  { score_class: 'blocked', color: '#b10dc9', opacity: 1.0, weight: 6, dash_pattern: '5,5' },
  { score_class: 'unknown', color: '#aaaaaa', opacity: 0.5, weight: 3, dash_pattern: '3,3' },
];

/** Number of connected components via iterative DFS. */
function connectedComponents(nodeIds: string[], edges: Array<{ from: string; to: string; bidirectional: boolean }>): number {
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of edges) {
    adj.get(e.from)?.push(e.to);
    if (e.bidirectional) adj.get(e.to)?.push(e.from);
  }
  const visited = new Set<string>();
  let count = 0;
  for (const id of nodeIds) {
    if (visited.has(id)) continue;
    count++;
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const nb of adj.get(cur) ?? []) {
        if (!visited.has(nb)) stack.push(nb);
      }
    }
  }
  return count;
}

// ── Panel 1: SystemAdjust ─────────────────────────────────────────────────────

export function computeSystemAdjust(
  _context: ScimContext,
  inputs: ScimPipelineInputs,
): SystemAdjustState {
  const raw = inputs.system_adjust;
  return {
    ...raw,
    loaded_at: raw.loaded_at || new Date().toISOString(),
    source: raw.source || 'scim3_atlas_console',
    status: 'loaded_unvalidated',
    validation: { is_valid: true, errors: [], warnings: [], checked_at: '' },
  };
}

// ── Panel 2: RegioContent ─────────────────────────────────────────────────────

export function computeRegioContent(
  _context: ScimContext,
  inputs: ScimPipelineInputs,
): RegioContentState {
  const raw = inputs.regio_content;
  const saVersion = inputs.system_adjust.system_adjust_version;
  const defaultMargin = raw.regional_parameters.comparison_margin_meters;

  const approved_pois = raw.approved_pois.map((poi) => {
    const margin = poi.comparison_margin_meters ?? defaultMargin;
    return {
      ...poi,
      comparison_margin_meters: margin,
      effective_comparison_radius_meters: poi.radius_meters + margin,
    };
  });

  const poi_radii: PoiRadius[] =
    raw.poi_radii.length > 0
      ? raw.poi_radii
      : approved_pois.map((poi) => ({
          poi_id: poi.poi_id,
          radius_meters: poi.radius_meters,
          radius_source: 'operator_adjusted' as const,
          radius_status: 'confirmed' as const,
          comparison_margin_meters: poi.comparison_margin_meters ?? defaultMargin,
          effective_comparison_radius_meters: poi.effective_comparison_radius_meters,
          min_allowed_radius_meters: 5,
          max_allowed_radius_meters: 500,
          system_adjust_version: saVersion,
        }));

  return {
    ...raw,
    approved_pois,
    poi_radii,
    loaded_at: raw.loaded_at || new Date().toISOString(),
    status: 'loaded_unvalidated',
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: '',
      checked_against_system_adjust_version: saVersion,
    },
  };
}

// ── Panel 3: TargetAppUi ──────────────────────────────────────────────────────

export function computeTargetAppUi(
  _context: ScimContext,
  inputs: ScimPipelineInputs,
): TargetAppUiState {
  const raw = inputs.target_app_ui;
  const flags = inputs.system_adjust.feature_flags;

  const visible_layers = raw.visible_layers.filter((layer) =>
    layer.depends_on_feature_flag ? flags[layer.depends_on_feature_flag] === true : true,
  );

  return {
    ...raw,
    visible_layers,
    loaded_at: raw.loaded_at || new Date().toISOString(),
    status: 'loaded_unvalidated',
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: '',
      checked_against_system_adjust_version: inputs.system_adjust.system_adjust_version,
    },
  };
}

// ── Panel 4: TelcoLoad ────────────────────────────────────────────────────────

export function computeTelcoLoad(
  _context: ScimContext,
  inputs: ScimPipelineInputs,
): TelcoLoadState {
  const raw = inputs.telco_load;
  const groups = raw.load_signals;

  const valid_group_count = groups.filter(
    (g) => !g.validity.expired && g.quality.quality_level !== 'unusable',
  ).length;
  const warning_group_count = groups.filter(
    (g) => g.quality.quality_level === 'low' || g.quality.quality_level === 'unknown',
  ).length;
  const invalid_group_count = groups.filter((g) => g.quality.quality_level === 'unusable').length;
  const expired_group_count = groups.filter((g) => g.validity.expired).length;
  const privacy_blocked_group_count = groups.filter((g) => !g.privacy.sensus_core_safe).length;
  const conflict_group_count = groups.filter((g) => g.quality.has_conflicts).length;

  let overall_quality: LoadQualityLevel;
  if (invalid_group_count > 0 || privacy_blocked_group_count > 0) overall_quality = 'unusable';
  else if (expired_group_count > 0 || warning_group_count > valid_group_count / 2) overall_quality = 'low';
  else if (warning_group_count > 0) overall_quality = 'medium';
  else if (groups.length === 0) overall_quality = 'unknown';
  else overall_quality = 'high';

  const signal_quality: LoadSignalQualitySummary = {
    overall_quality,
    valid_group_count,
    warning_group_count,
    invalid_group_count,
    expired_group_count,
    privacy_blocked_group_count,
    conflict_group_count,
  };

  const blocked_group_ids = groups.filter((g) => !g.privacy.sensus_core_safe).map((g) => g.signal_group_id);
  const warning_group_ids = groups
    .filter(
      (g) =>
        g.privacy.sensus_core_safe &&
        (!g.privacy.aggregation_verified || !g.privacy.meets_min_distinct_devices || !g.privacy.meets_min_signal_count),
    )
    .map((g) => g.signal_group_id);

  const privacy_check: LoadPrivacyCheck = {
    is_privacy_valid: blocked_group_ids.length === 0,
    checked_against_system_adjust_version: inputs.system_adjust.system_adjust_version,
    blocked_group_ids,
    warning_group_ids,
    raw_payload_detected: false,
    device_level_data_detected: false,
    exact_trace_detected: false,
  };

  return {
    ...raw,
    signal_quality,
    privacy_check,
    loaded_at: raw.loaded_at || new Date().toISOString(),
    status: 'loaded_unvalidated',
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: '',
      checked_against_system_adjust_version: inputs.system_adjust.system_adjust_version,
    },
  };
}

// ── Panel 5: Boundary ─────────────────────────────────────────────────────────

export function computeBoundary(
  _context: ScimContext,
  inputs: ScimPipelineInputs,
): BoundaryState {
  const regio = inputs.regio_content;
  const sa = inputs.system_adjust;
  const now = new Date().toISOString();

  // Max radius from approved POIs; fall back to system default.
  const approved = regio.approved_pois;
  const maxPoiRadius =
    approved.length > 0
      ? Math.max(...approved.map((p) => p.radius_meters))
      : sa.default_parameters.default_poi_radius_meters;

  const comparisonMargin = regio.regional_parameters.comparison_margin_meters;
  const rawBuffer = maxPoiRadius + comparisonMargin;
  const { min: bufMin, max: bufMax } = sa.allowed_ranges.boundary_buffer_meters;
  const computedBuffer = Math.min(Math.max(rawBuffer, bufMin), bufMax);
  const clamped = rawBuffer < bufMin || rawBuffer > bufMax;
  const clamped_reason: BoundaryBufferSpec['clamped_reason'] =
    rawBuffer < bufMin ? 'below_min' : rawBuffer > bufMax ? 'above_max' : undefined;

  const bufferSpec: BoundaryBufferSpec = {
    computed_buffer_meters: computedBuffer,
    min_buffer_meters: bufMin,
    max_buffer_meters: bufMax,
    max_poi_radius_meters: maxPoiRadius,
    comparison_margin_meters: comparisonMargin,
    clamped,
    clamped_reason,
  };

  // Base bbox from region; fall back to bounding box of all POI centroids.
  let baseBbox: BBox;
  if (regio.region.bbox) {
    baseBbox = regio.region.bbox;
  } else if (approved.length > 0) {
    const lons = approved.map((p) => p.center.coordinates[0]);
    const lats = approved.map((p) => p.center.coordinates[1]);
    baseBbox = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
  } else {
    baseBbox = [14.0, 47.0, 16.0, 48.0];
  }

  const expandedBbox = expandBbox(baseBbox, computedBuffer);
  const center = bboxCenter(expandedBbox);
  const area_sqkm = parseFloat(bboxAreaSqkm(expandedBbox).toFixed(2));
  const geometry = bboxToPolygon(expandedBbox);

  const boundaryId = `bnd_${regio.region.region_id}`;

  const computedBoundary: ComputedBoundary = {
    boundary_id: boundaryId,
    geometry,
    bbox: expandedBbox,
    center,
    area_sqkm,
    related_region_id: regio.region.region_id,
    computed_at: now,
    source: regio.region.bbox ? 'regio_content_bbox' : 'regio_content_geometry',
  };

  const poi_count_within = approved.filter((poi) =>
    inBbox(poi.center.coordinates[0], poi.center.coordinates[1], expandedBbox),
  ).length;

  return {
    boundary_id: boundaryId,
    computed_boundary: computedBoundary,
    buffer_spec: bufferSpec,
    poi_count_within,
    status: 'not_computed',
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: '',
      checked_against_system_adjust_version: sa.system_adjust_version,
    },
    computed_at: now,
  };
}

// ── Panel 5: Extraction ───────────────────────────────────────────────────────

export function computeExtraction(
  context: ScimContext,
  inputs: ScimPipelineInputs,
): ExtractionState {
  const boundary = context.boundary as BoundaryState;
  const regio = inputs.regio_content;
  const telco = inputs.telco_load;
  const now = new Date().toISOString();

  const bbox = boundary.computed_boundary.bbox;

  // Filter approved POIs within boundary.
  const extractedPois: ExtractedPoi[] = [];
  let excludedPoiCount = 0;
  for (const poi of regio.approved_pois) {
    const [lon, lat] = poi.center.coordinates;
    if (inBbox(lon, lat, bbox)) {
      extractedPois.push({
        poi_id: poi.poi_id,
        name: poi.name,
        category: poi.category,
        center: poi.center,
        radius_meters: poi.radius_meters,
        comparison_margin_meters:
          poi.comparison_margin_meters ?? regio.regional_parameters.comparison_margin_meters,
        effective_comparison_radius_meters:
          poi.effective_comparison_radius_meters ??
          poi.radius_meters + (poi.comparison_margin_meters ?? regio.regional_parameters.comparison_margin_meters),
        within_boundary: true,
        regio_content_version: regio.regio_content_version,
      });
    } else {
      excludedPoiCount++;
    }
  }

  // Filter signal groups by approximate center; groups without a center are included.
  const extractedGroups: ExtractedSignalGroup[] = [];
  let outOfBoundaryCount = 0;
  for (const grp of telco.load_signals) {
    const c = grp.approximate_center;
    const withinBoundary = c ? inBbox(c.coordinates[0], c.coordinates[1], bbox) : true;
    if (withinBoundary) {
      extractedGroups.push({
        signal_group_id: grp.signal_group_id,
        signal_type: grp.signal_type,
        aggregation_unit: grp.aggregation_unit,
        within_boundary: true,
        normalized_load_score: grp.metrics.normalized_load_score,
        confidence_score: grp.quality.confidence_score,
        projected_to_boundary: c === undefined,
      });
    } else {
      outOfBoundaryCount++;
    }
  }

  return {
    extraction_id: `ext_${boundary.boundary_id}`,
    boundary_id: boundary.boundary_id,
    extracted_pois: extractedPois,
    excluded_poi_count: excludedPoiCount,
    extracted_signal_groups: extractedGroups,
    excluded_signal_count: telco.load_signals.length - extractedGroups.length,
    out_of_boundary_signal_count: outOfBoundaryCount,
    status: 'not_extracted',
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: '',
      checked_against_boundary_id: boundary.boundary_id,
      checked_against_regio_content_version: regio.regio_content_version,
      checked_against_telco_load_batch_id: telco.telco_load_batch_id,
    },
    extracted_at: now,
  };
}

// ── Panel 6: Graph ────────────────────────────────────────────────────────────

export function computeGraph(
  context: ScimContext,
  inputs: ScimPipelineInputs,
): GraphState {
  const boundary = context.boundary as BoundaryState;
  const extraction = context.extracted_data as ExtractionState | undefined;
  const network = inputs.road_network;
  const now = new Date().toISOString();

  const bbox = boundary.computed_boundary.bbox;

  // Keep nodes within boundary bbox.
  const filteredNodes = network.nodes.filter((n) =>
    inBbox(n.geometry.coordinates[0], n.geometry.coordinates[1], bbox),
  );
  const nodeIdSet = new Set(filteredNodes.map((n) => n.node_id));

  // Keep edges whose both endpoints are inside the boundary.
  const filteredEdges = network.edges.filter(
    (e) => nodeIdSet.has(e.from_node_id) && nodeIdSet.has(e.to_node_id),
  );

  // Map node → connected edges.
  const edgeMap = new Map<string, string[]>();
  for (const n of filteredNodes) edgeMap.set(n.node_id, []);
  for (const e of filteredEdges) {
    edgeMap.get(e.from_node_id)?.push(e.edge_id);
    if (e.bidirectional) edgeMap.get(e.to_node_id)?.push(e.edge_id);
  }

  // Identify POI-anchor nodes: closest node in bbox to each extracted POI.
  const poiAnchorIds = new Set<string>();
  if (extraction) {
    for (const poi of extraction.extracted_pois) {
      let minDist = Infinity;
      let closestId = '';
      for (const n of filteredNodes) {
        const dx = n.geometry.coordinates[0] - poi.center.coordinates[0];
        const dy = n.geometry.coordinates[1] - poi.center.coordinates[1];
        const d = dx * dx + dy * dy;
        if (d < minDist) { minDist = d; closestId = n.node_id; }
      }
      if (closestId) poiAnchorIds.add(closestId);
    }
  }

  const nodes: GraphNode[] = filteredNodes.map((n) => ({
    node_id: n.node_id,
    geometry: n.geometry,
    node_type: poiAnchorIds.has(n.node_id) ? 'poi_anchor' : n.node_type,
    elevation_meters: n.elevation_meters,
    connected_edge_ids: edgeMap.get(n.node_id) ?? [],
  }));

  const edges: GraphEdge[] = filteredEdges.map((e) => ({
    edge_id: e.edge_id,
    from_node_id: e.from_node_id,
    to_node_id: e.to_node_id,
    geometry: e.geometry,
    length_meters: e.length_meters,
    edge_type: e.edge_type,
    surface_type: e.surface_type,
    difficulty_class: e.difficulty_class,
    bidirectional: e.bidirectional,
  }));

  const components = connectedComponents(
    nodes.map((n) => n.node_id),
    edges.map((e) => ({ from: e.from_node_id, to: e.to_node_id, bidirectional: e.bidirectional })),
  );

  const totalLength = parseFloat(edges.reduce((s, e) => s + e.length_meters, 0).toFixed(1));
  const coverageRatio =
    nodes.length > 0 ? parseFloat((edges.length / nodes.length).toFixed(3)) : 0;

  const metrics: GraphMetrics = {
    node_count: nodes.length,
    edge_count: edges.length,
    total_length_meters: totalLength,
    connected_components: components,
    poi_anchor_count: poiAnchorIds.size,
    coverage_ratio: coverageRatio,
  };

  const graphId = `graph_${boundary.boundary_id}`;

  return {
    graph_id: graphId,
    boundary_id: boundary.boundary_id,
    extraction_id: extraction?.extraction_id,
    nodes,
    edges,
    metrics,
    status: 'not_built',
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: '',
      checked_against_boundary_id: boundary.boundary_id,
    },
    built_at: now,
  };
}

// ── Panel 6: BasisLayer ───────────────────────────────────────────────────────

export function computeBasisLayer(
  context: ScimContext,
  _inputs: ScimPipelineInputs,
): BasisLayerState {
  const boundary = context.boundary as BoundaryState;
  const graph = context.graph as GraphState | undefined;
  const now = new Date().toISOString();

  const bbox = boundary.computed_boundary.bbox;
  const center = boundary.computed_boundary.center;

  // Choose zoom level based on bbox width.
  const bboxWidth = bbox[2] - bbox[0];
  const defaultZoom = bboxWidth < 0.05 ? 14 : bboxWidth < 0.2 ? 13 : bboxWidth < 0.5 ? 12 : 11;

  const tileLayers: TileLayerSpec[] = [
    {
      tile_layer_id: 'osm_base',
      layer_type: 'osm_base',
      tile_url_template: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      min_zoom: 1,
      max_zoom: 19,
      attribution: '© OpenStreetMap contributors',
      opacity: 1.0,
      visible: true,
      z_index: 0,
    },
  ];

  // Add hillshade when graph has elevation data.
  const hasElevation = graph?.nodes.some((n) => n.elevation_meters !== undefined);
  if (hasElevation) {
    tileLayers.push({
      tile_layer_id: 'hillshade',
      layer_type: 'hillshade',
      tile_url_template: 'https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png',
      min_zoom: 1,
      max_zoom: 17,
      attribution: 'SRTM',
      opacity: 0.4,
      visible: true,
      z_index: 1,
    });
  }

  const viewport: BasisLayerViewport = {
    center,
    bbox,
    default_zoom: defaultZoom,
    min_zoom: 8,
    max_zoom: 18,
  };

  const basisLayerId = `bl_${boundary.boundary_id}`;

  return {
    basis_layer_id: basisLayerId,
    boundary_id: boundary.boundary_id,
    graph_id: graph?.graph_id,
    tile_layers: tileLayers,
    viewport,
    status: 'not_built',
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: '',
      checked_against_boundary_id: boundary.boundary_id,
      checked_against_graph_id: graph?.graph_id,
    },
    built_at: now,
  };
}

// ── LeafletBasisCheck ─────────────────────────────────────────────────────────

export function computeLeafletBasisCheck(
  context: ScimContext,
  _inputs: ScimPipelineInputs,
): LeafletBasisCheckState {
  const basisLayer = context.basis_layer as BasisLayerState | undefined;
  const graph = context.graph as GraphState | undefined;
  const now = new Date().toISOString();

  const tileLayerCount = basisLayer?.tile_layers.length ?? 0;
  const viewportValid = basisLayer
    ? basisLayer.viewport.default_zoom >= basisLayer.viewport.min_zoom &&
      basisLayer.viewport.default_zoom <= basisLayer.viewport.max_zoom
    : false;

  const checkResult: LeafletBasisCheckResult = {
    basis_layer_available: basisLayer !== undefined,
    graph_available: graph !== undefined,
    viewport_valid: viewportValid,
    tile_layers_count: tileLayerCount,
    overall_ready: basisLayer !== undefined && viewportValid && tileLayerCount > 0,
  };

  return {
    check_id: `lbc_${basisLayer?.basis_layer_id ?? 'unknown'}`,
    basis_layer_id: basisLayer?.basis_layer_id,
    graph_id: graph?.graph_id,
    check_result: checkResult,
    status: 'not_checked',
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_basis_layer_id: basisLayer?.basis_layer_id,
    },
    checked_at: now,
  };
}

// ── Panel 7: PoiModel ─────────────────────────────────────────────────────────

export function computePoiModel(
  context: ScimContext,
  inputs: ScimPipelineInputs,
): PoiModelState {
  const extraction = context.extracted_data as ExtractionState;
  const sa = inputs.system_adjust;
  const rawSignals = inputs.telco_load.load_signals;
  const blockedIds = new Set(inputs.telco_load.privacy_check?.blocked_group_ids ?? []);
  const now = new Date().toISOString();

  const minDistinctDevices = sa.privacy_limits.min_distinct_devices_per_visible_aggregate;
  const minSignalCount = sa.privacy_limits.min_signals_per_visible_aggregate;
  const minForStay = sa.privacy_limits.min_signals_for_stay_classification;

  const evaluatedPois: PoiLoadState[] = extraction.extracted_pois.map((poi) => {
    const effectiveRadius = poi.effective_comparison_radius_meters;
    const [pLon, pLat] = poi.center.coordinates;

    // Find raw signals within effective radius of this POI.
    const nearby = rawSignals.filter((sg) => {
      const c = sg.approximate_center;
      if (!c) return false;
      return geoDistMeters(c.coordinates[0], c.coordinates[1], pLon, pLat) <= effectiveRadius;
    });

    const contributing_ids = nearby.map((sg) => sg.signal_group_id);
    const privacyMasked =
      contributing_ids.some((id) => blockedIds.has(id)) ||
      nearby.reduce((s, sg) => s + (sg.metrics.distinct_device_count ?? 0), 0) < minDistinctDevices ||
      nearby.reduce((s, sg) => s + (sg.metrics.signal_count ?? 0), 0) < minSignalCount;

    const totalSignals = nearby.reduce((s, sg) => s + (sg.metrics.signal_count ?? 0), 0);
    const signal_count_sufficient = totalSignals >= minForStay;

    const normalized_load_score =
      nearby.length > 0
        ? parseFloat((nearby.reduce((s, sg) => s + (sg.metrics.normalized_load_score ?? 0), 0) / nearby.length).toFixed(3))
        : 0;

    const load_class = privacyMasked ? 'unknown' : scoreToPoiLoadClass(normalized_load_score);

    const stay_classification: StayClassification =
      !signal_count_sufficient
        ? 'unknown'
        : normalized_load_score >= 0.6
        ? 'confirmed_stay'
        : normalized_load_score >= 0.4
        ? 'likely_stay'
        : normalized_load_score >= 0.2
        ? 'possible_stay'
        : 'transit';

    const confidence_score =
      nearby.length > 0
        ? parseFloat((nearby.reduce((s, sg) => s + sg.quality.confidence_score, 0) / nearby.length).toFixed(3))
        : 0;

    return {
      poi_id: poi.poi_id,
      name: poi.name,
      load_class,
      normalized_load_score,
      stay_classification,
      contributing_signal_group_ids: contributing_ids,
      confidence_score,
      privacy_masked: privacyMasked,
      signal_count_sufficient,
    } satisfies PoiLoadState;
  });

  const masked_poi_count = evaluatedPois.filter((p) => p.privacy_masked).length;
  const metrics: PoiModelMetrics = {
    evaluated_poi_count: evaluatedPois.length,
    masked_poi_count,
    busy_poi_count: evaluatedPois.filter((p) => p.load_class === 'busy' || p.load_class === 'very_busy').length,
    quiet_poi_count: evaluatedPois.filter((p) => p.load_class === 'quiet').length,
    unknown_poi_count: evaluatedPois.filter((p) => p.load_class === 'unknown').length,
  };

  const extractionId = extraction.extraction_id;
  return {
    poi_model_id: `pm_${extractionId}`,
    extraction_id: extractionId,
    evaluated_pois: evaluatedPois,
    metrics,
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_extraction_id: extractionId,
      checked_against_system_adjust_version: sa.system_adjust_version,
    },
    status: 'not_computed',
    computed_at: now,
  };
}

// ── Panel 7: LoadProjection ───────────────────────────────────────────────────

export function computeLoadProjection(
  context: ScimContext,
  inputs: ScimPipelineInputs,
): LoadProjectionState {
  const graph = context.graph as GraphState;
  const boundary = context.boundary as BoundaryState;
  const extraction = context.extracted_data as ExtractionState;
  const rawSignals = inputs.telco_load.load_signals;
  const blockedIds = new Set(inputs.telco_load.privacy_check?.blocked_group_ids ?? []);
  const now = new Date().toISOString();

  // Build a node coordinate lookup.
  const nodeCoords = new Map<string, [number, number]>();
  for (const n of graph.nodes) nodeCoords.set(n.node_id, n.geometry.coordinates);

  // Projection radius = quarter of the boundary bbox diagonal (regional scale).
  const [bMinLon, bMinLat, bMaxLon, bMaxLat] = boundary.computed_boundary.bbox;
  const bMidLat = (bMinLat + bMaxLat) / 2;
  const bDLon = (bMaxLon - bMinLon) * 111_000 * Math.cos((bMidLat * Math.PI) / 180);
  const bDLat = (bMaxLat - bMinLat) * 111_000;
  const projectionRadius = Math.sqrt(bDLon * bDLon + bDLat * bDLat) / 4;

  const edgeLoadScores: EdgeLoadScore[] = graph.edges.map((edge) => {
    const fromCoord = nodeCoords.get(edge.from_node_id);
    const toCoord = nodeCoords.get(edge.to_node_id);
    const midCoord = lineMidCoord(edge.geometry.coordinates);
    const [mLon, mLat] = midCoord[0] !== undefined ? midCoord : (fromCoord ?? [0, 0]);
    void fromCoord; void toCoord;

    const nearby = rawSignals.filter((sg) => {
      const c = sg.approximate_center;
      if (!c) return false;
      return geoDistMeters(c.coordinates[0], c.coordinates[1], mLon, mLat) <= projectionRadius;
    });

    const privacyMasked = nearby.some((sg) => blockedIds.has(sg.signal_group_id));
    const contributing_ids = nearby.map((sg) => sg.signal_group_id);

    const normalized_load_score =
      nearby.length > 0
        ? parseFloat((nearby.reduce((s, sg) => s + (sg.metrics.normalized_load_score ?? 0), 0) / nearby.length).toFixed(3))
        : 0;

    const confidence_score =
      nearby.length > 0
        ? parseFloat((nearby.reduce((s, sg) => s + sg.quality.confidence_score, 0) / nearby.length).toFixed(3))
        : 0;

    const method = privacyMasked
      ? 'default_fallback'
      : nearby.length > 0
      ? 'signal_to_edge'
      : 'default_fallback';

    return {
      edge_id: edge.edge_id,
      normalized_load_score: privacyMasked ? 0 : normalized_load_score,
      load_class: privacyMasked ? 'unknown' : scoreToEdgeLoadClass(normalized_load_score),
      contributing_signal_group_ids: contributing_ids,
      confidence_score,
      method,
      privacy_masked: privacyMasked,
    } satisfies EdgeLoadScore;
  });

  const projected = edgeLoadScores.filter((e) => e.method !== 'default_fallback' || e.contributing_signal_group_ids.length > 0);
  const masked = edgeLoadScores.filter((e) => e.privacy_masked);
  const unprojected = edgeLoadScores.filter((e) => e.method === 'default_fallback' && !e.privacy_masked);
  const scores = edgeLoadScores.map((e) => e.normalized_load_score);
  const avgScore = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3)) : 0;
  const maxScore = scores.length > 0 ? parseFloat(Math.max(...scores).toFixed(3)) : 0;

  const metrics: LoadProjectionMetrics = {
    projected_edge_count: projected.length,
    masked_edge_count: masked.length,
    unprojected_edge_count: unprojected.length,
    avg_load_score: avgScore,
    max_load_score: maxScore,
  };

  return {
    load_projection_id: `lp_${graph.graph_id}`,
    graph_id: graph.graph_id,
    extraction_id: extraction.extraction_id,
    edge_load_scores: edgeLoadScores,
    metrics,
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_graph_id: graph.graph_id,
      checked_against_extraction_id: extraction.extraction_id,
    },
    status: 'not_computed',
    projected_at: now,
  };
}

// ── Panel 7: MovementModel ────────────────────────────────────────────────────

export function computeMovementModel(
  context: ScimContext,
  _inputs: ScimPipelineInputs,
): MovementModelState {
  const loadProjection = context.load_model as LoadProjectionState;
  const graph = context.graph as GraphState;
  const now = new Date().toISOString();

  const edgeMap = new Map(graph.edges.map((e) => [e.edge_id, e]));

  const edgeMovementStates: EdgeMovementState[] = loadProjection.edge_load_scores.map((els) => {
    const edge = edgeMap.get(els.edge_id);
    const score = els.normalized_load_score;
    const movement_ratio = parseFloat(Math.min(score * 1.2, 1.0).toFixed(3));
    const stillness_ratio = parseFloat((1 - movement_ratio).toFixed(3));
    const flow_direction = els.privacy_masked
      ? 'unknown'
      : edge?.bidirectional
      ? 'bidirectional'
      : 'from_to_dominant';

    const density_score = parseFloat((score * 1.5).toFixed(3));
    const throughput_ratio = parseFloat(Math.min(movement_ratio * 1.1, 1.0).toFixed(3));
    const sa = context.system_adjust as import('../system-adjust/systemAdjust.types').SystemAdjustState | undefined;
    const jamThreshold = sa?.default_parameters.default_max_jam_throughput_ratio ?? 0.20;
    const rastThreshold = sa?.default_parameters.default_min_throughput_ratio_for_rast ?? 0.60;
    const isStatic = stillness_ratio > 0.7;
    const jam_detected = isStatic && throughput_ratio <= jamThreshold;
    const stay_candidate = isStatic && !jam_detected && throughput_ratio >= rastThreshold;

    return {
      edge_id: els.edge_id,
      movement_class: els.privacy_masked ? 'unknown' : scoreToMovementClass(score),
      movement_ratio,
      stillness_ratio,
      flow_direction,
      normalized_movement_score: score,
      confidence_score: els.confidence_score,
      privacy_masked: els.privacy_masked,
      density_score,
      throughput_ratio,
      jam_detected,
      stay_candidate,
    } satisfies EdgeMovementState;
  });

  const masked = edgeMovementStates.filter((e) => e.privacy_masked);
  const highFlow = edgeMovementStates.filter((e) => e.movement_class === 'high_flow');
  const staticEdges = edgeMovementStates.filter((e) => e.movement_class === 'static');
  const avgMovement =
    edgeMovementStates.length > 0
      ? parseFloat((edgeMovementStates.reduce((s, e) => s + e.normalized_movement_score, 0) / edgeMovementStates.length).toFixed(3))
      : 0;

  const jamEdges = edgeMovementStates.filter(e => e.jam_detected);
  const stayCandidates = edgeMovementStates.filter(e => e.stay_candidate);
  const maxDensity = edgeMovementStates.length > 0
    ? parseFloat(Math.max(...edgeMovementStates.map(e => e.density_score)).toFixed(3))
    : 0;

  const metrics: MovementModelMetrics = {
    evaluated_edge_count: edgeMovementStates.length,
    high_flow_edge_count: highFlow.length,
    static_edge_count: staticEdges.length,
    masked_edge_count: masked.length,
    avg_movement_score: avgMovement,
    jam_edge_count: jamEdges.length,
    stay_candidate_edge_count: stayCandidates.length,
    max_density_score: maxDensity,
  };

  return {
    movement_model_id: `mm_${loadProjection.load_projection_id}`,
    graph_id: loadProjection.graph_id,
    load_projection_id: loadProjection.load_projection_id,
    edge_movement_states: edgeMovementStates,
    metrics,
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_graph_id: loadProjection.graph_id,
      checked_against_load_projection_id: loadProjection.load_projection_id,
    },
    status: 'not_computed',
    computed_at: now,
  };
}

// ── Panel 7: MaskingModel ─────────────────────────────────────────────────────

export function computeMaskingModel(
  context: ScimContext,
  inputs: ScimPipelineInputs,
): MaskingModelState {
  const poiModel = context.poi_model as PoiModelState;
  const loadProjection = context.load_model as LoadProjectionState;
  const sa = inputs.system_adjust;
  const now = new Date().toISOString();

  const masked: MaskedElement[] = [];

  for (const poi of poiModel.evaluated_pois) {
    if (poi.privacy_masked) {
      masked.push({
        element_type: 'poi',
        element_id: poi.poi_id,
        masking_reason: poi.signal_count_sufficient ? 'single_device_visibility_risk' : 'below_min_signal_count',
        rule_code: 'PRIV_POI_MASK',
      });
    }
  }

  const minEdgeLength = 10; // edges shorter than this are masked regardless of signal data
  for (const edge of loadProjection.edge_load_scores) {
    if (edge.privacy_masked) {
      masked.push({
        element_type: 'edge',
        element_id: edge.edge_id,
        masking_reason: 'privacy_rule_violation',
        rule_code: 'PRIV_EDGE_MASK',
      });
    }
  }

  // Mask edges below minimum length.
  const graph = context.graph as GraphState;
  for (const edge of graph.edges) {
    if (edge.length_meters < minEdgeLength) {
      if (!masked.some((m) => m.element_id === edge.edge_id)) {
        masked.push({
          element_type: 'edge',
          element_id: edge.edge_id,
          masking_reason: 'edge_below_min_length',
          rule_code: 'GEO_EDGE_MIN_LEN',
        });
      }
    }
  }

  const maskedPois = masked.filter((m) => m.element_type === 'poi').length;
  const maskedEdges = masked.filter((m) => m.element_type === 'edge').length;
  const totalEvaluated = poiModel.evaluated_pois.length + loadProjection.edge_load_scores.length;

  const metrics: MaskingModelMetrics = {
    total_evaluated: totalEvaluated,
    total_masked: masked.length,
    masked_pois: maskedPois,
    masked_edges: maskedEdges,
    masking_ratio: totalEvaluated > 0 ? parseFloat((masked.length / totalEvaluated).toFixed(3)) : 0,
  };

  return {
    masking_model_id: `msk_${poiModel.poi_model_id}`,
    masked_elements: masked,
    metrics,
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_system_adjust_version: sa.system_adjust_version,
    },
    status: 'not_computed',
    applied_at: now,
  };
}

// ── Panel 8: RouteModel ───────────────────────────────────────────────────────

export function computeRouteModel(
  context: ScimContext,
  inputs: ScimPipelineInputs,
): RouteModelState {
  const movementModel = context.movement_model as MovementModelState;
  const maskingModel = context.masking_model as MaskingModelState | undefined;
  const graph = context.graph as GraphState;
  const sa = inputs.system_adjust;
  const now = new Date().toISOString();

  const degradeThreshold = sa.default_parameters.default_route_degrade_threshold;
  const excludeThreshold = sa.default_parameters.default_route_exclude_threshold;
  const behavior = sa.default_parameters.route_exceedance_default_behavior;

  const maskedEdgeIds = new Set(
    (maskingModel?.masked_elements ?? [])
      .filter((m) => m.element_type === 'edge')
      .map((m) => m.element_id),
  );

  const edgeEvaluations: RouteEdgeEvaluation[] = movementModel.edge_movement_states.map((ems) => {
    const score = ems.normalized_movement_score;
    const isMasked = maskedEdgeIds.has(ems.edge_id);

    let score_class: RouteScoreClass;
    let decision: RouteDecision;
    let exceeded_threshold: RouteEdgeEvaluation['exceeded_threshold'];

    if (isMasked) {
      score_class = 'blocked';
      decision = 'exclude';
    } else {
      score_class = scoreToRouteClass(score);
      if (score >= excludeThreshold) {
        exceeded_threshold = 'exclude';
        decision = behavior === 'warn' ? 'warn' : 'exclude';
      } else if (score >= degradeThreshold) {
        exceeded_threshold = 'degrade';
        decision = behavior === 'exclude' ? 'exclude' : behavior === 'warn' ? 'warn' : 'degrade';
      } else {
        decision = 'include';
      }
    }

    return {
      edge_id: ems.edge_id,
      normalized_load_score: score,
      score_class,
      decision,
      exceeded_threshold,
      applied_behavior: behavior,
      confidence_score: ems.confidence_score,
    } satisfies RouteEdgeEvaluation;
  });

  // Also add evaluations for graph edges not in movement model (fallback).
  const evaluatedIds = new Set(edgeEvaluations.map((e) => e.edge_id));
  for (const edge of graph.edges) {
    if (!evaluatedIds.has(edge.edge_id)) {
      edgeEvaluations.push({
        edge_id: edge.edge_id,
        normalized_load_score: 0,
        score_class: 'unknown',
        decision: 'include',
        applied_behavior: behavior,
        confidence_score: 0,
      });
    }
  }

  const metrics: RouteModelMetrics = {
    evaluated_edge_count: edgeEvaluations.length,
    included_edge_count: edgeEvaluations.filter((e) => e.decision === 'include').length,
    degraded_edge_count: edgeEvaluations.filter((e) => e.decision === 'degrade').length,
    excluded_edge_count: edgeEvaluations.filter((e) => e.decision === 'exclude').length,
    warn_edge_count: edgeEvaluations.filter((e) => e.decision === 'warn').length,
  };

  return {
    route_model_id: `rm_${graph.graph_id}`,
    graph_id: graph.graph_id,
    movement_model_id: movementModel.movement_model_id,
    masking_model_id: maskingModel?.masking_model_id,
    route_degrade_threshold: degradeThreshold,
    route_exclude_threshold: excludeThreshold,
    route_exceedance_behavior: behavior,
    edge_evaluations: edgeEvaluations,
    metrics,
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_movement_model_id: movementModel.movement_model_id,
      checked_against_system_adjust_version: sa.system_adjust_version,
    },
    status: 'not_computed',
    computed_at: now,
  };
}

// ── Panel 8: RouteLayerModel ──────────────────────────────────────────────────

export function computeRouteLayerModel(
  context: ScimContext,
  _inputs: ScimPipelineInputs,
): RouteLayerModelState {
  const routeModel = context.route_model as RouteModelState;
  const now = new Date().toISOString();

  const styleMap = new Map(SCORE_CLASS_STYLES.map((s) => [s.score_class, s]));

  const segments: RouteLayerSegment[] = routeModel.edge_evaluations.map((ev) => {
    const style = styleMap.get(ev.score_class) ?? styleMap.get('unknown')!;
    return {
      segment_id: `seg_${ev.edge_id}`,
      edge_id: ev.edge_id,
      score_class: ev.score_class,
      decision: ev.decision,
      style,
      visible: ev.decision !== 'exclude',
    } satisfies RouteLayerSegment;
  });

  return {
    route_layer_model_id: `rlm_${routeModel.route_model_id}`,
    route_model_id: routeModel.route_model_id,
    segments,
    score_class_styles: SCORE_CLASS_STYLES,
    visible_segment_count: segments.filter((s) => s.visible).length,
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_route_model_id: routeModel.route_model_id,
    },
    status: 'not_built',
    built_at: now,
  };
}

// ── Panel 8: LayerModel ───────────────────────────────────────────────────────

export function computeLayerModel(
  context: ScimContext,
  _inputs: ScimPipelineInputs,
): LayerModelState {
  const routeLayerModel = context.route_layer_model as RouteLayerModelState | undefined;
  const basisLayer = context.basis_layer as BasisLayerState | undefined;
  const now = new Date().toISOString();

  const layers: ScimLayer[] = [];

  // Basis tile layers first (lowest z-index).
  if (basisLayer) {
    for (const tl of basisLayer.tile_layers) {
      layers.push({
        layer_id: `lyr_${tl.tile_layer_id}`,
        layer_type: 'basis_tile_layer',
        display_name: tl.tile_layer_id === 'osm_base' ? 'OpenStreetMap' : 'Hillshade',
        visible: tl.visible,
        z_index: tl.z_index,
        opacity: tl.opacity,
        data_class: 'public_aggregate',
      });
    }
  }

  // Route score layer.
  if (routeLayerModel) {
    layers.push({
      layer_id: `lyr_route_score`,
      layer_type: 'route_score_layer',
      display_name: 'Route Load Score',
      visible: true,
      z_index: 10,
      opacity: 0.85,
      data_class: 'reduced_scim_result',
    });
  }

  // POI load layer.
  layers.push({
    layer_id: 'lyr_poi_load',
    layer_type: 'poi_load_layer',
    display_name: 'POI Load',
    visible: true,
    z_index: 20,
    opacity: 0.9,
    data_class: 'reduced_scim_result',
  });

  // Movement flow layer.
  layers.push({
    layer_id: 'lyr_movement_flow',
    layer_type: 'movement_flow_layer',
    display_name: 'Movement Flow',
    visible: false,
    z_index: 15,
    opacity: 0.7,
    data_class: 'operator_internal',
    depends_on_feature_flag: 'enable_movement_layer',
  });

  const layerModelId = `lm_${routeLayerModel?.route_layer_model_id ?? basisLayer?.basis_layer_id ?? 'unknown'}`;

  return {
    layer_model_id: layerModelId,
    route_layer_model_id: routeLayerModel?.route_layer_model_id,
    basis_layer_id: basisLayer?.basis_layer_id,
    layers,
    visible_layer_count: layers.filter((l) => l.visible).length,
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_route_layer_model_id: routeLayerModel?.route_layer_model_id,
      checked_against_basis_layer_id: basisLayer?.basis_layer_id,
    },
    status: 'not_built',
    built_at: now,
  };
}

// ── Panel 9: SensusCorePackage ────────────────────────────────────────────────

export function computeSensusCorePackage(
  context: ScimContext,
  inputs: ScimPipelineInputs,
): SensusCorePackageState {
  const layerModel = context.layer_model as LayerModelState;
  const routeLayerModel = context.route_layer_model as RouteLayerModelState | undefined;
  const poiModel = context.poi_model as PoiModelState | undefined;
  const sa = inputs.system_adjust;
  const now = new Date().toISOString();

  const dataClassesIncluded = [
    ...new Set(layerModel.layers.map((l) => l.data_class)),
  ];

  const content: SensusCorePackageContent = {
    route_segments_count: routeLayerModel?.segments.length ?? 0,
    poi_states_count: poiModel?.evaluated_pois.length ?? 0,
    layer_count: layerModel.layers.length,
    data_classes_included: dataClassesIncluded,
    raw_signals_present: false,
    device_ids_present: false,
    debug_data_present: false,
  };

  const packageId = `pkg_${layerModel.layer_model_id}`;

  return {
    package_id: packageId,
    layer_model_id: layerModel.layer_model_id,
    route_layer_model_id: routeLayerModel?.route_layer_model_id,
    poi_model_id: poiModel?.poi_model_id,
    export_format: 'sensus_core_json',
    schema_version: '1.0.0',
    content,
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_layer_model_id: layerModel.layer_model_id,
      checked_against_system_adjust_version: sa.system_adjust_version,
    },
    status: 'not_built',
    generated_at: now,
  };
}

// ── Panel 10: SensusCoreLocal ─────────────────────────────────────────────────

export function computeSensusCoreLocal(
  _context: ScimContext,
  inputs: ScimPipelineInputs,
): SensusCoreLocalState | null {
  if (!inputs.user_tolerances) return null;

  const raw = inputs.user_tolerances;
  const sa = inputs.system_adjust;
  const now = new Date().toISOString();

  const degradeRange = sa.allowed_ranges.route_degrade_threshold;
  const excludeRange = sa.allowed_ranges.route_exclude_threshold;

  // Clamp values within allowed ranges.
  const route_load_tolerance = Math.min(
    Math.max(raw.route_load_tolerance, degradeRange.min),
    degradeRange.max,
  );
  const max_acceptable_load_score = Math.min(
    Math.max(raw.max_acceptable_load_score, excludeRange.min),
    excludeRange.max,
  );

  const validDifficulties = ['easy', 'moderate', 'difficult', 'any'] as const;
  const preferred_difficulty =
    raw.preferred_difficulty && validDifficulties.includes(raw.preferred_difficulty as never)
      ? (raw.preferred_difficulty as UserTolerances['preferred_difficulty'])
      : 'any';

  const tolerances: UserTolerances = {
    route_load_tolerance,
    preferred_difficulty,
    prefer_quiet_pois: raw.prefer_quiet_pois ?? false,
    max_acceptable_load_score,
  };

  const isDefault =
    route_load_tolerance === sa.default_parameters.default_route_degrade_threshold &&
    max_acceptable_load_score === sa.default_parameters.default_route_exclude_threshold;

  return {
    local_context_id: `luc_${Date.now()}`,
    tolerances,
    is_default: isDefault,
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_system_adjust_version: sa.system_adjust_version,
    },
    status: 'local_context_valid',
    loaded_at: now,
  };
}

// ── Panel 10 (cont.): SensusCoreView ─────────────────────────────────────────

export function computeSensusCoreView(
  context: ScimContext,
  _inputs: ScimPipelineInputs,
): SensusCoreViewState {
  const pkg = context.sensus_core_package as SensusCorePackageState | undefined;
  const layerModel = context.layer_model as LayerModelState | undefined;
  const basisLayer = context.basis_layer as BasisLayerState | undefined;
  const now = new Date().toISOString();

  const active_layers: ActiveLayerState[] = (layerModel?.layers ?? []).map((l) => ({
    layer_id: l.layer_id,
    visible: l.visible,
    opacity: l.opacity,
  }));

  const viewport_center = basisLayer?.viewport.center ?? {
    type: 'Point' as const,
    coordinates: [0, 0] as [number, number],
  };
  const viewport_zoom = basisLayer?.viewport.default_zoom ?? 13;

  const viewId = `view_${pkg?.package_id ?? 'unknown'}`;

  return {
    view_id: viewId,
    package_id: pkg?.package_id,
    active_layers,
    viewport_center,
    viewport_zoom,
    interaction: {},
    validation: {
      is_valid: true,
      errors: [],
      warnings: [],
      checked_at: now,
      checked_against_package_id: pkg?.package_id,
    },
    status: 'view_active',
    initialized_at: now,
    last_updated_at: now,
  };
}

// ── Panel 11: LeafletEffectCheck ──────────────────────────────────────────────

export function computeLeafletEffectCheck(
  context: ScimContext,
  _inputs: ScimPipelineInputs,
): LeafletEffectCheckState {
  const pkg = context.sensus_core_package as SensusCorePackageState | undefined;
  const view = context.view_state as SensusCoreViewState | undefined;
  const routeLayerModel = context.route_layer_model as RouteLayerModelState | undefined;
  const poiModel = context.poi_model as PoiModelState | undefined;
  const now = new Date().toISOString();

  const visibleSegmentCount = routeLayerModel?.visible_segment_count ?? 0;
  const visiblePoiCount = poiModel
    ? poiModel.evaluated_pois.filter((p) => !p.privacy_masked).length
    : 0;

  const routeLayerRendered = visibleSegmentCount > 0;
  const poiLayerRendered = visiblePoiCount > 0;
  const anyLayerError = !routeLayerRendered && !poiLayerRendered;

  const renderResult: LeafletRenderResult = {
    route_layer_rendered: routeLayerRendered,
    poi_layer_rendered: poiLayerRendered,
    visible_segment_count: visibleSegmentCount,
    visible_poi_count: visiblePoiCount,
    any_layer_error: anyLayerError,
  };

  const checkId = `lec_${pkg?.package_id ?? 'unknown'}`;

  return {
    check_id: checkId,
    package_id: pkg?.package_id,
    view_id: view?.view_id,
    render_result: renderResult,
    validation: {
      is_valid: !anyLayerError,
      errors: anyLayerError
        ? [{ code: 'LEAFLET_NO_LAYERS_RENDERED', severity: 'error', message: 'No layers rendered', blocking: true }]
        : [],
      warnings: [],
      checked_at: now,
      checked_against_package_id: pkg?.package_id,
    },
    status: anyLayerError ? 'effect_check_failed' : 'effect_check_ok',
    checked_at: now,
  };
}

// ── Panel 12: ReleaseExport ───────────────────────────────────────────────────

export function computeReleaseExport(
  context: ScimContext,
  inputs: ScimPipelineInputs,
): ReleaseExportState {
  const pkg = context.sensus_core_package as SensusCorePackageState;
  const effectCheck = context.leaflet_effect_check as LeafletEffectCheckState | undefined;
  const now = new Date().toISOString();

  const privacyVerified =
    !pkg.content.raw_signals_present &&
    !pkg.content.device_ids_present &&
    !pkg.content.debug_data_present;

  const metadata: ReleaseExportMetadata = {
    released_by: inputs.operator_id ?? 'scim3_pipeline',
    target_format: 'sensus_core_json',
    schema_version: pkg.schema_version,
    privacy_verified: privacyVerified,
    sensus_core_safe: privacyVerified,
    raw_signals_excluded: true,
    device_ids_excluded: true,
  };

  const releaseId = `rel_${pkg.package_id}`;

  // Expires in 30 days.
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    release_id: releaseId,
    package_id: pkg.package_id,
    effect_check_id: effectCheck?.check_id,
    metadata,
    validation: {
      is_valid: privacyVerified,
      errors: privacyVerified
        ? []
        : [{ code: 'RELEASE_PRIVACY_FAIL', severity: 'error', message: 'Privacy check failed', blocking: true }],
      warnings: [],
      checked_at: now,
      checked_against_package_id: pkg.package_id,
      checked_against_effect_check_id: effectCheck?.check_id,
    },
    status: privacyVerified ? 'released' : 'release_failed',
    released_at: now,
    expires_at: expires,
  };
}

// ── Runtime context (cross-cutting) ───────────────────────────────────────────

const ALL_PANELS = [
  'system_adjust', 'regio_content', 'telco_load', 'boundary', 'extracted_data',
  'graph', 'basis_layer', 'poi_model', 'load_model', 'movement_model',
  'masking_model', 'route_model', 'route_layer_model', 'layer_model',
  'sensus_core_package', 'release',
] as const;

export function computeScimRuntimeContext(
  context: ScimContext,
  inputs: ScimPipelineInputs,
): ScimRuntimeContextState {
  const sa = inputs.system_adjust;
  const now = new Date().toISOString();

  const assembled = ALL_PANELS.filter((p) => context[p] !== undefined);
  const missing = ALL_PANELS.filter((p) => context[p] === undefined);
  const completeness = parseFloat((assembled.length / ALL_PANELS.length).toFixed(3));

  // Cast stub context types to their real counterparts to access ID fields.
  const rc = context.regio_content as RegioContentState | undefined;
  const tau = context.target_app_ui as TargetAppUiState | undefined;
  const tl = context.telco_load as TelcoLoadState | undefined;
  const bnd = context.boundary as BoundaryState | undefined;
  const ext = context.extracted_data as ExtractionState | undefined;
  const gr = context.graph as GraphState | undefined;
  const bl = context.basis_layer as BasisLayerState | undefined;
  const pm = context.poi_model as PoiModelState | undefined;
  const lp = context.load_model as LoadProjectionState | undefined;
  const mm = context.movement_model as MovementModelState | undefined;
  const msk = context.masking_model as MaskingModelState | undefined;
  const rm = context.route_model as RouteModelState | undefined;
  const lm = context.layer_model as LayerModelState | undefined;

  const versions: ScimRuntimeContextVersions = {
    system_adjust_version: sa.system_adjust_version,
    regio_content_version: rc?.regio_content_version,
    target_app_ui_version: tau?.target_app_ui_version,
    telco_load_batch_id: tl?.telco_load_batch_id,
    boundary_id: bnd?.boundary_id,
    extraction_id: ext?.extraction_id,
    graph_id: gr?.graph_id,
    basis_layer_id: bl?.basis_layer_id,
    poi_model_id: pm?.poi_model_id,
    load_projection_id: lp?.load_projection_id,
    movement_model_id: mm?.movement_model_id,
    masking_model_id: msk?.masking_model_id,
    route_model_id: rm?.route_model_id,
    layer_model_id: lm?.layer_model_id,
  };

  return {
    runtime_context_id: `rtx_${inputs.run_id ?? now}`,
    versions,
    pipeline_completeness: completeness,
    assembled_panels: assembled as unknown as string[],
    missing_panels: missing as unknown as string[],
    validation: {
      is_valid: missing.length === 0,
      errors: [],
      warnings: missing.map((p) => ({
        code: `PANEL_MISSING_${p.toUpperCase()}`,
        severity: 'warning' as const,
        message: `Panel '${p}' not assembled`,
        blocking: false,
      })),
      checked_at: now,
    },
    status: missing.length === 0 ? 'runtime_context_valid' : 'runtime_context_warning',
    assembled_at: now,
  };
}
