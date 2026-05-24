import type { RouteScoreClass } from '../route-model/routeModel.types';
import type { PoiLoadClass } from '../poi-output/poiOutput.types';

export interface ScimBundleRegion {
  id: string;   // top-level geographic region, e.g. "skg"
  name: string; // e.g. "Salzkammergut"
}

export interface ScimBundleRepresentation {
  id: string;   // specific representation within the region, e.g. "gruenberg"
  name: string; // e.g. "Grünberg"
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}

export interface ScimBundleViewport {
  center: [number, number]; // [lon, lat]
  zoom: number;
}

export interface ScimRouteFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: {
    edge_id: string;
    score_class: RouteScoreClass;
    color: string;
    weight: number;
    opacity: number;
    decision: string;
    visible: boolean;
  };
}

export interface ScimPoiFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    poi_id: string;
    name: string;
    load_class: PoiLoadClass;
    normalized_load_score: number;
    privacy_masked: boolean;
  };
}

export interface ScimBundlePrivacy {
  verified: boolean;
  raw_signals_excluded: true;
  device_ids_excluded: true;
}

/** Standalone deliverable consumed by the Ziel-App. */
export interface ScimBundle {
  schema: 'scim3_bundle_v1';
  package_id: string;
  release_id: string;
  generated_at: string;
  expires_at?: string;
  region: ScimBundleRegion;
  representation: ScimBundleRepresentation;
  viewport: ScimBundleViewport;
  routes: {
    type: 'FeatureCollection';
    features: ScimRouteFeature[];
  };
  pois: {
    type: 'FeatureCollection';
    features: ScimPoiFeature[];
  };
  privacy: ScimBundlePrivacy;
}
