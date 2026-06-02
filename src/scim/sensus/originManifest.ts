// Origin-Manifest-Builder (Vorschlag A · Schritt 2 / Umbauplan Phase 1) — die
// „Kapselung": aus einer committeten Representation (dem Auftraggeber) das echte
// OriginManifest (L0) bauen, das die gestaffelten Origin-Schichten + den Anthem-
// Endpoint verlinkt. Reine Funktion über vorhandene Resolver; nutzt die Phase-0-
// Vertragstypen (packageContract). Maßgeblich: docs/ziel_app_umbauplan.md.

import type { Representation } from '../workspace/workspace.types';
import { geometryById } from '../workspace/workspace.registry';
import { buildOriginPackage } from './originPackage';
import type { OriginManifest, OriginLayerRef, Bbox } from './packageContract';

// Reveal-/Lade-Reihenfolge der nachladbaren Schichten (L1..L4).
const LAYER_ORDER: OriginLayerRef['id'][] = [
  'origin-net', 'origin-asset-set', 'origin-poi-set', 'origin-pixel-charges',
];

export function buildOriginManifest(rep: Representation): OriginManifest | null {
  const origin = buildOriginPackage(rep);
  const geo = rep.geometry_id ? geometryById(rep.geometry_id) : undefined;
  const ring = (geo?.polygon ?? []) as [number, number][]; // [lon, lat][]
  if (ring.length < 3) return null;

  const lons = ring.map((p) => p[0]), lats = ring.map((p) => p[1]);
  const bbox: Bbox = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];

  const byId = new Map(origin.particles.map((p) => [p.id, p]));
  const layers: OriginLayerRef[] = LAYER_ORDER
    .map((id): OriginLayerRef | null => {
      const p = byId.get(id);
      const ref = `packages/${rep.id}/${id}.json`;
      if (p) return { id, ref, bytes: p.bytes };
      // origin-pixel-charges existiert im MVP nicht als Partikel → reserviert.
      return id === 'origin-pixel-charges' ? { id, ref } : null;
    })
    .filter((x): x is OriginLayerRef => x !== null);

  return {
    kind: 'origin_manifest_v1',
    repId: rep.id,
    repName: rep.name,
    version: rep.version ?? 0,
    bbox,
    boundary: ring,
    anthemEndpoint: `/api/anthem/${rep.id}`,
    layers,
  };
}
