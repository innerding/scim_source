// Operator-Commit: einen committbaren Draft (Boundary + maskiertes Netz) zu einer
// committeten Representation versiegeln — schreibt Boundary → Wegnetz →
// Representation in den Repo (über commitToRepo), hebt die Version, entfernt den
// Draft. Aus dem alten WorkspacePanel herausgelöst, damit der Operator-Pathworks
// (OperatorRepsHome) genau diese eine Commit-Wahrheit nutzt.
//
// Hinweis: schreibt echt nach GitHub — wird NUR durch einen Operator-Klick
// ausgelöst (kein autonomes Prod-Schreiben).

import { commitToRepo } from '../../runtime/commitBridge';
import { REPRESENTATIONS } from '../workspace/workspace.registry';
import { removeDraft, type Draft } from '../workspace/draftStore';
import type { BoundaryGeometryFile, WegnetzFile, RepresentationFile } from '../workspace/workspace.types';
import type { Position } from 'geojson';

export function isDraftCommittable(d: Draft): boolean {
  return !!d.boundary && d.boundary.length >= 3 && !!d.net_masked;
}

function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'boundary';
}

function closedRing(polygon: Position[]): Position[] {
  if (polygon.length < 3) return polygon;
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return polygon;
  return [...polygon, first];
}

export interface CommitDraftResult { ok: boolean; text: string; url?: string; }

// `today` als Parameter (statt new Date()) hält die Funktion deterministisch.
export async function commitDraftToRepo(d: Draft, today: string): Promise<CommitDraftResult> {
  if (!isDraftCommittable(d) || !d.boundary || !d.net_masked) {
    return { ok: false, text: 'Nicht committbar (braucht Boundary + maskiertes Netz).' };
  }
  const slug = slugify(d.name || 'representation');
  const net = d.net_masked;
  const geom: BoundaryGeometryFile = {
    type: 'Feature',
    properties: { name: d.name || slug, source: 'Pathworks-Commit', drawn_at: today },
    geometry: { type: 'Polygon', coordinates: [closedRing(d.boundary)] },
  };
  const weg: WegnetzFile = {
    schema: 'scim3_wegnetz_v1', id: slug, geometry_id: slug,
    edges: net.edges, gates: net.gates, cropped: net.cropped,
    primary_count: net.primaryCount, connector_count: net.connectorCount,
    created_at: today,
  };
  const repId = `rep-${slug}`;
  const nextVersion = (REPRESENTATIONS.find((r) => r.id === repId)?.version ?? 0) + 1;
  const rep: RepresentationFile = {
    schema: 'scim3_representation_v1', id: repId, name: d.name || slug,
    geometry_id: slug, catalog_id: d.catalog_id || undefined, wegnetz_id: slug,
    version: nextVersion, created_at: today, note: 'via Pathworks-Commit',
  };
  // Reihenfolge: Boundary → Wegnetz → Representation (Keystone zuletzt).
  const steps: [string, string, string][] = [
    [`data/geometries/${slug}.json`, JSON.stringify(geom, null, 2) + '\n', 'boundary'],
    [`data/wegnetze/${slug}.json`, JSON.stringify(weg, null, 2) + '\n', 'wegnetz'],
    [`data/representations/rep-${slug}.json`, JSON.stringify(rep, null, 2) + '\n', 'representation'],
  ];
  let lastUrl: string | undefined;
  for (const [path, content, label] of steps) {
    const res = await commitToRepo({ path, content, message: `${label}: ${slug} via Pathworks-Commit` });
    if (!res.ok) return { ok: false, text: `${label} fehlgeschlagen: ${res.error}` };
    lastUrl = res.commit_url;
  }
  // Versiegelt: Draft verlässt die Pipeline (ist jetzt committete Representation v${nextVersion}).
  removeDraft(d.id);
  return { ok: true, text: `Representation rep-${slug} committet (v${nextVersion}) — Draft versiegelt.`, url: lastUrl };
}
