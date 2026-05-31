// netModel — die EINZIGE Wahrheit des Wegnetz-Editors.
//
// Kern des Drawer-Rückbaus. Maßgebliche Spec: docs/wegnetz_drawer_spec.md.
//   - OP { edges, excluded, gates } ist die Wahrheit. deriveNet() leitet ALLES
//     ab (noden, 1 m-Verschweißen, Endpunkt-auf-Linie, Fly-over→Brücke,
//     längste Komponente = Netz, Sackgassen-Arm rot, net/red/lila, POI-Status).
//   - Aktionen sind reine Funktionen OP -> OP. Undo = Stapel von OP (in der UI).
//   - Kein React/Leaflet/Geoman. Voll testbar.
//
// Klassen:  net (schwarz, längste Komponente, kein Sackgassen-Arm) ·
//           red (nicht im Netz ODER Sackgassen-Arm ohne Gate-POI) ·
//           lila (gezeichnet, noch nicht im Netz).
// „rot" hat KEINE Sonderbehandlung — nur Klasse + Aktion deleteAllRed.

import { graphCompose, bridgeGaps, filterEdges, type NetGraph } from './netGraph';
import type { PathEdge } from './pathEngine';

// ─── Konstanten (zwei getrennte Toleranzen) ─────────────────────────────────────
export const WELD_TOL_M = 1;    // fix: deckungsgleiche Enden / Endpunkt-auf-Linie / POI
export const HIT_TOL_M = 12;    // großzügig: Treffer beim Klicken/Greifen
const DRAWN_ID_BASE = 1_000_000_000_000; // gezeichnete IDs ab hier (positiv, ≠ OSM)
const M_LAT = 110540;

// ─── Typen ──────────────────────────────────────────────────────────────────────
export type LatLng = [number, number]; // [lat, lng]

export interface ModelEdge {
  id: number;
  points: LatLng[];
  source: 'osm' | 'drawn';
  asphalt: boolean;
}
// Platzierter POI / Registry-Eintrag. Ein POI an einer Sackgassen-Spitze
// legitimiert deren Arm (rot→net). Token erst beim Export → im Drawer nur id.
export interface GatePoi {
  at: LatLng;
  category?: string;   // Katalog-Subcategory | 'gate'
  tagline?: string;
  note?: string;       // ein Satz → grau in Kurz-Description
  icon?: string;       // gewähltes Icon (id) — sonst iconNote
  iconNote?: string;   // Beschreibung, wenn kein Icon gewählt
  id?: string;         // lokale temp-ID
  poiId?: string;
}
export interface NetModel {
  edges: ModelEdge[];
  excluded: string[];   // gelöschte Teilstück-Keys `wayId:seg`
  gates: GatePoi[];     // legitimierte Sackgassen-Enden
}

export type EdgeClass = 'net' | 'red' | 'lila';
export interface DerivedEdge {
  key: string; wayId: number; seg: number;
  points: LatLng[]; klass: EdgeClass; asphalt: boolean; deadEnd: boolean;
}
export interface BridgeMark { at: LatLng; overEdgeId: number; }
export interface DerivedPoi { at: LatLng; connected: boolean; gate: boolean; tagline?: string; category?: string; }
export interface DerivedNet {
  edges: DerivedEdge[];
  bridges: BridgeMark[];
  pois: DerivedPoi[];
  redKeys: string[];
  netMeters: number;
  deadEnds: LatLng[];   // degree-1-Enden OHNE Gate-POI (rote Sackgassen-Spitzen)
  nodes: LatLng[];      // alle Graph-Knoten (für Snap beim POI-Setzen)
}

export function emptyModel(): NetModel {
  return { edges: [], excluded: [], gates: [] };
}

// ─── Planar-Geometrie (lokal, Meter) ────────────────────────────────────────────
const mLngAt = (lat: number): number => 111320 * Math.cos((lat * Math.PI) / 180);
const distM = (a: LatLng, b: LatLng): number => {
  const mLng = mLngAt(a[0]);
  return Math.hypot((b[1] - a[1]) * mLng, (b[0] - a[0]) * M_LAT);
};

// Schnittpunkt zweier Segmente (echt, inkl. Berührung an Endpunkten) oder null.
function segCross(p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng): LatLng | null {
  const mLng = mLngAt(p1[0]);
  const x = (p: LatLng) => p[1] * mLng;
  const y = (p: LatLng) => p[0] * M_LAT;
  const x1 = x(p1), y1 = y(p1), x2 = x(p2), y2 = y(p2);
  const x3 = x(p3), y3 = y(p3), x4 = x(p4), y4 = y(p4);
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-9) return null; // parallel/kollinear
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
}

// Projektion eines Punkts auf ein Segment → { point, dist, t }.
function projOnSeg(p: LatLng, a: LatLng, b: LatLng): { point: LatLng; dist: number; t: number } {
  const mLng = mLngAt(a[0]);
  const ax = a[1] * mLng, ay = a[0] * M_LAT;
  const bx = b[1] * mLng, by = b[0] * M_LAT;
  const px = p[1] * mLng, py = p[0] * M_LAT;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const point: LatLng = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  return { point, dist: distM(p, point), t };
}

// ─── Integration der gezeichneten Kanten (Noding-Vorstufe) ──────────────────────
// Liefert: edges mit eingefügten Split-Punkten (für die Verbindung) + Brücken
// (Fly-over). Regeln (siehe Spec):
//   - Trasse ENDET auf fremder Linie (Endpunkt ≤ HIT, im Linieninneren) → fremde
//     Linie dort splitten + Trassen-Endpunkt darauf einrasten → Verbindung.
//   - Trasse läuft MITTEN über fremde Linie (Kreuzung nicht an Trassen-Endpunkt)
//     → KEIN Knoten, BridgeMark.
//   - OSM × OSM bleibt unberührt (nur gemeinsame Koordinaten verbinden → Brücken).
function integrate(edges: ModelEdge[]): { edges: ModelEdge[]; bridges: BridgeMark[] } {
  // Arbeitskopie der Punktlisten (wird durch Splits ergänzt).
  const work: ModelEdge[] = edges.map((e) => ({ ...e, points: e.points.map((p) => [p[0], p[1]] as LatLng) }));
  const byId = new Map(work.map((e) => [e.id, e]));
  const bridges: BridgeMark[] = [];
  // Einzufügende Split-Punkte je Ziel-Kante: { afterIndex, point }.
  const splits = new Map<number, { afterIndex: number; point: LatLng }[]>();
  const addSplit = (id: number, afterIndex: number, point: LatLng) => {
    const arr = splits.get(id) ?? [];
    arr.push({ afterIndex, point });
    splits.set(id, arr);
  };

  for (const d of work) {
    if (d.source !== 'drawn' || d.points.length < 2) continue;
    const dEnds: LatLng[] = [d.points[0], d.points[d.points.length - 1]];
    const isDrawnEnd = (p: LatLng) => dEnds.some((e) => distM(p, e) <= HIT_TOL_M);

    for (const o of work) {
      if (o.id === d.id || o.points.length < 2) continue;

      // (1) Trassen-Endpunkt liegt auf dem Inneren von o → splitten + einrasten.
      for (const end of dEnds) {
        let best: { dist: number; afterIndex: number; point: LatLng } | null = null;
        for (let i = 0; i + 1 < o.points.length; i++) {
          const pr = projOnSeg(end, o.points[i], o.points[i + 1]);
          if (pr.dist <= HIT_TOL_M && (!best || pr.dist < best.dist)) {
            best = { dist: pr.dist, afterIndex: i, point: pr.point };
          }
        }
        if (best) {
          // Nur splitten, wenn der Treffer NICHT schon ein Stützpunkt von o ist.
          const nearVertex = o.points.some((p) => distM(p, best!.point) <= WELD_TOL_M);
          if (!nearVertex) addSplit(o.id, best.afterIndex, best.point);
          // Trassen-Endpunkt exakt auf den Punkt setzen → gemeinsame Koordinate.
          const which = distM(end, d.points[0]) <= distM(end, d.points[d.points.length - 1]) ? 0 : d.points.length - 1;
          d.points[which] = best.point;
        }
      }

      // (2) Fly-over = TRANSVERSALE Kreuzung im Segment-Inneren — NICHT an einem
      // geteilten Knoten. Eine Trasse, die einer Linie folgt, läuft durch deren
      // Kreuzungen (geteilte Stützpunkte); diese Berührungen sind KEINE Brücken.
      for (let j = 0; j + 1 < d.points.length; j++) {
        for (let i = 0; i + 1 < o.points.length; i++) {
          const P = segCross(d.points[j], d.points[j + 1], o.points[i], o.points[i + 1]);
          if (!P) continue;
          if (isDrawnEnd(P)) continue;                                   // Trassen-Endpunkt = Verbindung
          if (d.points.some((p) => distM(P, p) <= WELD_TOL_M)) continue; // auf Trassen-Knoten
          if (o.points.some((p) => distM(P, p) <= WELD_TOL_M)) continue; // auf Linien-Knoten = Kreuzung
          bridges.push({ at: P, overEdgeId: d.id });
        }
      }
    }
  }

  // Doppelte Brückenzeichen (≈ gleicher Punkt) zusammenfassen.
  const dedupedBridges: BridgeMark[] = [];
  for (const b of bridges) {
    if (!dedupedBridges.some((x) => distM(x.at, b.at) <= WELD_TOL_M)) dedupedBridges.push(b);
  }

  // Split-Punkte in die Ziel-Kanten einfügen (von hinten, Indizes stabil halten).
  for (const [id, list] of splits) {
    const e = byId.get(id);
    if (!e) continue;
    list.sort((a, b) => b.afterIndex - a.afterIndex);
    for (const s of list) e.points.splice(s.afterIndex + 1, 0, s.point);
  }
  return { edges: work, bridges: dedupedBridges };
}

// ─── Ableitung ───────────────────────────────────────────────────────────────────
function toPathEdges(edges: ModelEdge[]): PathEdge[] {
  return edges.map((e) => ({
    id: e.id, highway: '', source: 'primary', points: e.points, tags: {}, inNet: true,
  }));
}

// Längste Komponente nach Gesamt-Metern.
function longestComponent(graph: NetGraph): number {
  const meters = new Map<number, number>();
  for (const e of graph.edges) {
    const c = graph.nodes[e.from]?.component ?? -1;
    meters.set(c, (meters.get(c) ?? 0) + e.meters);
  }
  let best = -1; let bestM = -1;
  for (const [c, m] of meters) if (m > bestM) { bestM = m; best = c; }
  return best;
}

// Sackgassen-Arme: von jedem degree-1-Ende (kein Gate) entlang degree-2-Ketten
// zurück bis zum nächsten Knoten degree ≥ 3 — alle durchlaufenen Teilstücke rot.
function deadArmKeys(graph: NetGraph, gateNodeIds: Set<number>): Set<string> {
  const incident = new Map<number, number[]>(); // node -> edge-Indizes
  const push = (n: number, idx: number): void => {
    const arr = incident.get(n);
    if (arr) arr.push(idx); else incident.set(n, [idx]);
  };
  graph.edges.forEach((e, idx) => { push(e.from, idx); push(e.to, idx); });

  const keyOf = (i: number): string => `${graph.edges[i].edgeId}:${graph.edges[i].seg}`;
  const dead = new Set<string>();
  for (const tip of graph.nodes) {
    if (tip.degree !== 1 || gateNodeIds.has(tip.id)) continue;
    let node = tip.id;
    let guard = 0;
    let edgeIdx: number | undefined = incident.get(node)?.[0];
    while (edgeIdx !== undefined && guard++ < graph.edges.length + 1) {
      dead.add(keyOf(edgeIdx));
      const e = graph.edges[edgeIdx];
      const next: number = e.from === node ? e.to : e.from;
      if ((graph.nodes[next]?.degree ?? 0) !== 2) break; // Kreuzung (≥3) oder anderes Ende
      // entlang der degree-2-Kette weiter (das andere anliegende Teilstück).
      const inc: number[] = incident.get(next) ?? [];
      const here = edgeIdx;
      edgeIdx = inc.find((k) => k !== here);
      node = next;
    }
  }
  return dead;
}

export function deriveNet(model: NetModel, poiCoords: LatLng[] = []): DerivedNet {
  const integrated = integrate(model.edges);
  const composed = graphCompose(toPathEdges(integrated.edges));
  const merged = bridgeGaps(composed, WELD_TOL_M); // nur fast deckungsgleiche Enden
  const excludedSet = new Set(model.excluded);
  const graph = excludedSet.size > 0
    ? filterEdges(merged.graph, (e) => !excludedSet.has(`${e.edgeId}:${e.seg}`))
    : merged.graph;

  const NET = longestComponent(graph);
  const gateNodeIds = new Set<number>();
  for (const n of graph.nodes) {
    if (n.degree === 1 && model.gates.some((g) => distM([n.lat, n.lng], g.at) <= HIT_TOL_M)) {
      gateNodeIds.add(n.id);
    }
  }
  const dead = deadArmKeys(graph, gateNodeIds);

  const asphaltOf = new Map(model.edges.map((e) => [e.id, e.asphalt]));
  const drawnIds = new Set(model.edges.filter((e) => e.source === 'drawn').map((e) => e.id));

  const edges: DerivedEdge[] = [];
  const redKeys: string[] = [];
  let netMeters = 0;
  for (const ge of graph.edges) {
    if (ge.edgeId < 0) continue; // Verschweiß-Brücken (negativ) nicht als Teilstück zeigen
    const key = `${ge.edgeId}:${ge.seg}`;
    const inNet = graph.nodes[ge.from].component === NET;
    const drawn = drawnIds.has(ge.edgeId);
    const isDeadArm = dead.has(key);
    const deadEnd = graph.nodes[ge.from].degree === 1 || graph.nodes[ge.to].degree === 1;

    let klass: EdgeClass;
    if (drawn && !inNet) klass = 'lila';
    else if (!inNet || isDeadArm) klass = 'red';
    else klass = 'net';

    if (klass === 'red') redKeys.push(key);
    if (inNet) netMeters += ge.meters;
    edges.push({
      key, wayId: ge.edgeId, seg: ge.seg, points: ge.points, klass,
      asphalt: asphaltOf.get(ge.edgeId) ?? false, deadEnd,
    });
  }

  // POIs: Katalog-POIs (poiCoords) UND Gate-POIs (model.gates). Angebunden, wenn
  // ≤ WELD an einem Netz-Knoten; gate, wenn als Gate gesetzt. Doppelte (Gate, das
  // auch ein Katalog-POI ist) werden zusammengefasst.
  const netNodes = graph.nodes.filter((n) => n.component === NET);
  const allPoiCoords: LatLng[] = [...poiCoords];
  for (const g of model.gates) {
    if (!allPoiCoords.some((p) => distM(p, g.at) <= WELD_TOL_M)) allPoiCoords.push(g.at);
  }
  const pois: DerivedPoi[] = allPoiCoords.map((at) => {
    const g = model.gates.find((gg) => distM(gg.at, at) <= WELD_TOL_M);
    return {
      at,
      connected: netNodes.some((n) => distM([n.lat, n.lng], at) <= WELD_TOL_M),
      gate: !!g,
      tagline: g?.tagline,
      category: g?.category,
    };
  });

  // Rote Sackgassen-Spitzen = degree-1-Knoten, die KEIN Gate sind.
  const deadEnds: LatLng[] = graph.nodes
    .filter((n) => n.degree === 1 && !gateNodeIds.has(n.id))
    .map((n) => [n.lat, n.lng] as LatLng);

  const nodes: LatLng[] = graph.nodes.map((n) => [n.lat, n.lng] as LatLng);
  return { edges, bridges: integrated.bridges, pois, redKeys, netMeters, deadEnds, nodes };
}

// ─── Aktionen (rein: NetModel -> NetModel) ──────────────────────────────────────
function nextDrawnId(model: NetModel): number {
  let max = DRAWN_ID_BASE - 1;
  for (const e of model.edges) if (e.id > max) max = e.id;
  return max + 1;
}

export function setOsmEdges(model: NetModel, osm: ModelEdge[]): NetModel {
  const drawn = model.edges.filter((e) => e.source === 'drawn');
  return { ...model, edges: [...osm.map((e) => ({ ...e, source: 'osm' as const })), ...drawn] };
}

export function addDrawnEdge(model: NetModel, points: LatLng[], asphalt = false): NetModel {
  if (points.length < 2) return model;
  return { ...model, edges: [...model.edges, { id: nextDrawnId(model), points, source: 'drawn', asphalt }] };
}

export function deleteKeys(model: NetModel, keys: string[]): NetModel {
  if (keys.length === 0) return model;
  const next = new Set(model.excluded);
  for (const k of keys) next.add(k);
  return { ...model, excluded: [...next] };
}

export function restoreKeys(model: NetModel, keys: string[]): NetModel {
  if (keys.length === 0) return model;
  const drop = new Set(keys);
  return { ...model, excluded: model.excluded.filter((k) => !drop.has(k)) };
}

export function deleteAllRed(model: NetModel): NetModel {
  return deleteKeys(model, deriveNet(model).redKeys);
}

export function setGatePoi(model: NetModel, at: LatLng, poiId?: string): NetModel {
  return { ...model, gates: [...model.gates, { at, poiId }] };
}

/** Platzierten POI (Registry-Eintrag) hinzufügen. */
export function addPoi(model: NetModel, poi: GatePoi): NetModel {
  return { ...model, gates: [...model.gates, poi] };
}

/** Platzierten POI per id entfernen. */
export function removePoi(model: NetModel, id: string): NetModel {
  return { ...model, gates: model.gates.filter((g) => g.id !== id) };
}

/** Gate am Punkt setzen oder (falls dort schon eins ist) entfernen. */
export function toggleGatePoi(
  model: NetModel, at: LatLng, meta: { poiId?: string; tagline?: string; category?: string } = {}, tolMeters = HIT_TOL_M,
): NetModel {
  const hit = model.gates.find((g) => distM(g.at, at) <= tolMeters);
  if (hit) return { ...model, gates: model.gates.filter((g) => g !== hit) };
  return { ...model, gates: [...model.gates, { at, ...meta }] };
}
