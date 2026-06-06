// @LEGACY (2026-06-06): Typen des alten Weg-1-Bundles (scim3_bundle_v1). Abgelöst durch
// den Origin-Weg (originPackage.ts). NICHT im Auslieferungspfad (Design-Manifest ·
// Auslieferung). Löschen erst auf Operator-Commit. Siehe docs/aufraeum_inventar.md (K3.1).
import type { RouteScoreClass } from '../route-model/routeModel.types';
import type { PoiLoadClass } from '../poi-output/poiOutput.types';

export interface ScimBundleRegion {
  id: string;   // organisatorischer Zusammenschluss, z.B. "skg"
  name: string; // z.B. "Salzkammergut"
}

export interface ScimBundleRepresentation {
  id: string;   // z.B. "gruenberg"
  name: string; // z.B. "Grünberg"
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
  region?: ScimBundleRegion;
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
