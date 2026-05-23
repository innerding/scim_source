import type { ScimContext } from '../context/scimContext.types';
import type { GraphState } from '../graph/graph.types';
import type { RouteLayerModelState } from '../route-layer-model/routeLayerModel.types';
import type { PoiModelState } from '../poi-output/poiOutput.types';
import type { BasisLayerState } from '../basis-layer/basisLayer.types';
import type { ReleaseExportState } from './releaseExport.types';
import type { RegioContentState } from '../regio-content/regioContent.types';
import type { ScimBundle, ScimRouteFeature, ScimPoiFeature } from './scimBundle.types';

/**
 * Assembles the full pipeline context into a self-contained Ziel-App bundle.
 *
 * Joins:
 *   Graph.edges (geometry) × RouteLayerModel.segments (score_class, style)
 *   RegioContent.approved_pois (coordinates) × PoiModel.evaluated_pois (load_class)
 */
export function generateScimBundle(
  context: ScimContext,
  release: ReleaseExportState,
): ScimBundle {
  const graph         = context.graph          as unknown as GraphState;
  const rlm           = context.route_layer_model as unknown as RouteLayerModelState;
  const poiModel      = context.poi_model      as unknown as PoiModelState;
  const basisLayer    = context.basis_layer    as unknown as BasisLayerState;
  const regioContent  = context.regio_content  as unknown as RegioContentState;

  // ── Routes ──────────────────────────────────────────────────────────────────
  // Build edge_id → geometry lookup from the computed graph.
  const edgeGeom = new Map(
    (graph?.edges ?? []).map((e) => [e.edge_id, e.geometry.coordinates as [number, number][]]),
  );

  const routeFeatures: ScimRouteFeature[] = (rlm?.segments ?? [])
    .filter((seg) => seg.visible)
    .map((seg): ScimRouteFeature | null => {
      const coords = edgeGeom.get(seg.edge_id) ?? [];
      if (coords.length < 2) return null;
      return {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {
          edge_id:    seg.edge_id,
          score_class: seg.score_class,
          color:      seg.style.color,
          weight:     seg.style.weight,
          opacity:    seg.style.opacity,
          decision:   seg.decision,
          visible:    seg.visible,
        },
      };
    })
    .filter((f): f is ScimRouteFeature => f !== null);

  // ── POIs ─────────────────────────────────────────────────────────────────────
  // POI load scores keyed by poi_id.
  const poiScores = new Map(
    (poiModel?.evaluated_pois ?? []).map((p) => [p.poi_id, p]),
  );

  const poiFeatures: ScimPoiFeature[] = (regioContent?.approved_pois ?? [])
    .reduce<ScimPoiFeature[]>((acc, poi) => {
      const score = poiScores.get(poi.poi_id);
      if (!score || score.privacy_masked) return acc;
      acc.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: poi.center.coordinates as [number, number],
        },
        properties: {
          poi_id:                poi.poi_id,
          name:                  poi.name ?? poi.poi_id,
          load_class:            score.load_class,
          normalized_load_score: score.normalized_load_score,
          privacy_masked:        false,
        },
      });
      return acc;
    }, []);

  // ── Region + Viewport ────────────────────────────────────────────────────────
  const bbox = basisLayer?.viewport.bbox ?? [0, 0, 0, 0];
  const center = basisLayer?.viewport.center.coordinates ?? [0, 0];
  const zoom   = basisLayer?.viewport.default_zoom ?? 13;

  const regionId   = regioContent?.region?.region_id ?? 'unknown';
  const regionName = regioContent?.region?.region_name ?? regionId;

  return {
    schema:       'scim3_bundle_v1',
    package_id:   release.package_id,
    release_id:   release.release_id,
    generated_at: release.released_at,
    expires_at:   release.expires_at,
    region: {
      id:   regionId,
      name: regionName,
      bbox: bbox as [number, number, number, number],
    },
    viewport: {
      center: center as [number, number],
      zoom,
    },
    routes: {
      type: 'FeatureCollection',
      features: routeFeatures,
    },
    pois: {
      type: 'FeatureCollection',
      features: poiFeatures,
    },
    privacy: {
      verified:             release.metadata.privacy_verified,
      raw_signals_excluded: true,
      device_ids_excluded:  true,
    },
  };
}

/** Triggers a browser download of the bundle as a .json file. */
export function downloadScimBundle(bundle: ScimBundle): void {
  const filename = `scim3_${bundle.region.id}_${bundle.package_id}.json`;
  const json     = JSON.stringify(bundle, null, 2);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = filename;
  a.click();
  URL.revokeObjectURL(url);
}
