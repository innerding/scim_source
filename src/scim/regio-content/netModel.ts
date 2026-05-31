// netModel — die EINZIGE Wahrheit des Wegnetz-Editors.
//
// Kern des Drawer-Rückbaus (siehe memory project_drawer_rueckbau):
//   - Ein gespeichertes Graph-Modell (Kanten + Ausschlüsse + Config) ist die
//     Wahrheit. ALLES (Färbung, Sackgassen-Sicht, Netz, Summen, „rot") wird
//     daraus per deriveNet() ABGELEITET — kein zweiter Zustand, kein Overlay.
//   - Jede Aktion ist eine REINE Funktion Model -> Model (zeichnen, löschen,
//     alles-Rote-löschen). Undo = Stapel von Modell-Schnappschüssen (in der UI).
//   - Kein React, kein Leaflet, kein Geoman. Voll testbar.
//
// „rot" hat KEINE technische Sonderbehandlung: es ist die abgeleitete Klasse
// „nicht im Netz oder Sackgasse". Die einzige Aktion dazu ist „alles Rote
// löschen" (deleteAllRed). Sackgassen werden NICHT getrennt behandelt.
// „lila" = gezeichnetes Segment, das noch nicht mit dem Netz verschmolzen ist.

import {
  graphCompose, bridgeGaps, filterEdges, netzComponents,
} from './netGraph';
import type { PathEdge } from './pathEngine';

// Gezeichnete Kanten bekommen IDs ab diesem Offset — weit über OSM-Way-IDs,
// und positiv (negative IDs sind in netGraph den Brücken vorbehalten).
const DRAWN_ID_BASE = 1_000_000_000_000;

export interface ModelEdge {
  id: number;                  // OSM-Way-ID (osm) oder ≥ DRAWN_ID_BASE (drawn)
  points: [number, number][];  // [lat, lng] entlang der Geometrie
  source: 'osm' | 'drawn';
  asphalt: boolean;
}

export interface NetModelConfig {
  netLenThresh: number;        // Netz-Schwelle in Metern (Komponente ≥ → Netz)
  gapTol: number;              // Verschmelz-Toleranz in Metern (bridgeGaps)
}

export interface NetModel {
  edges: ModelEdge[];
  excluded: string[];          // gelöschte Teilstück-Keys `wayId:seg`
  config: NetModelConfig;
}

// net  = im Netz (schwarz) · red = nicht im Netz ODER Sackgasse (Kontroll-Sicht)
// lila = gezeichnet, noch nicht mit dem Netz verschmolzen
export type EdgeClass = 'net' | 'red' | 'lila';

export interface DerivedEdge {
  key: string;                 // `wayId:seg` — stabiler Teilstück-Schlüssel
  wayId: number;
  seg: number;
  points: [number, number][];
  klass: EdgeClass;
  asphalt: boolean;
  deadEnd: boolean;            // degree-1 an mind. einem Ende
}

export interface DerivedNet {
  edges: DerivedEdge[];
  bridges: { points: [number, number][] }[];  // Verschmelz-Brücken (gapTol)
  redKeys: string[];           // alle roten Teilstücke → „alles Rote löschen"
  netMeters: number;
  restMeters: number;          // alles, was nicht im Netz liegt
}

export const DEFAULT_CONFIG: NetModelConfig = { netLenThresh: 300, gapTol: 8 };

export function emptyModel(config: NetModelConfig = DEFAULT_CONFIG): NetModel {
  return { edges: [], excluded: [], config };
}

// Modell-Kanten → PathEdge[] für graphCompose. inNet=true: alle Modell-Kanten
// gehören zum Kandidaten-Netz; was wirklich „Netz" ist, entscheidet die
// Komponenten-Länge in deriveNet. source/highway/tags sind hier irrelevant
// (graphCompose nutzt nur points + inNet); Asphalt führen wir separat.
function toPathEdges(edges: ModelEdge[]): PathEdge[] {
  return edges.map((e) => ({
    id: e.id, highway: '', source: 'primary', points: e.points, tags: {}, inNet: true,
  }));
}

// Die einzige Ableitung: Modell -> klassifizierter Graph. Hier passiert die
// gesamte „Logik" (Noden, Verschmelzen, Ausschlüsse, Netz/Rest, rot/lila).
export function deriveNet(model: NetModel): DerivedNet {
  const composed = graphCompose(toPathEdges(model.edges));
  const merged = bridgeGaps(composed, model.config.gapTol);
  const excludedSet = new Set(model.excluded);
  const graph = excludedSet.size > 0
    ? filterEdges(merged.graph, (e) => !excludedSet.has(`${e.edgeId}:${e.seg}`))
    : merged.graph;
  const netzSet = netzComponents(graph, model.config.netLenThresh);

  const asphaltOf = new Map(model.edges.map((e) => [e.id, e.asphalt]));
  const drawnIds = new Set(model.edges.filter((e) => e.source === 'drawn').map((e) => e.id));

  const edges: DerivedEdge[] = [];
  const redKeys: string[] = [];
  let netMeters = 0;
  let restMeters = 0;

  for (const ge of graph.edges) {
    if (ge.edgeId < 0) continue; // Brücken separat (unten)
    const key = `${ge.edgeId}:${ge.seg}`;
    const inNet = netzSet.has(graph.nodes[ge.from].component);
    const deadEnd = graph.nodes[ge.from].degree === 1 || graph.nodes[ge.to].degree === 1;
    const drawn = drawnIds.has(ge.edgeId);

    let klass: EdgeClass;
    if (drawn && !inNet) klass = 'lila';        // gezeichnet, noch nicht verschmolzen
    else if (!inNet || deadEnd) klass = 'red';  // nicht im Netz ODER Sackgasse
    else klass = 'net';

    if (klass === 'red') redKeys.push(key);
    if (inNet) netMeters += ge.meters; else restMeters += ge.meters;

    edges.push({
      key, wayId: ge.edgeId, seg: ge.seg, points: ge.points, klass,
      asphalt: asphaltOf.get(ge.edgeId) ?? false, deadEnd,
    });
  }

  return {
    edges,
    bridges: merged.bridges.map((b) => ({ points: b.points })),
    redKeys,
    netMeters,
    restMeters,
  };
}

// ─── Operationen (rein: Model -> Model) ─────────────────────────────────────────

function nextDrawnId(model: NetModel): number {
  let max = DRAWN_ID_BASE - 1;
  for (const e of model.edges) if (e.id > max) max = e.id;
  return max + 1;
}

/** Setzt das Basis-Netz (OSM-Fetch) — ersetzt die OSM-Kanten, behält gezeichnete. */
export function setOsmEdges(model: NetModel, osm: ModelEdge[]): NetModel {
  const drawn = model.edges.filter((e) => e.source === 'drawn');
  return { ...model, edges: [...osm.map((e) => ({ ...e, source: 'osm' as const })), ...drawn] };
}

/** Fügt ein gezeichnetes Segment hinzu (lila, bis es mit dem Netz verschmilzt). */
export function addDrawnEdge(
  model: NetModel, points: [number, number][], asphalt = false,
): NetModel {
  if (points.length < 2) return model;
  const edge: ModelEdge = { id: nextDrawnId(model), points, source: 'drawn', asphalt };
  return { ...model, edges: [...model.edges, edge] };
}

/** Löscht Teilstücke (zwischen Kreuzungen / einzelne Arme) per Key. */
export function deleteKeys(model: NetModel, keys: string[]): NetModel {
  if (keys.length === 0) return model;
  const next = new Set(model.excluded);
  for (const k of keys) next.add(k);
  return { ...model, excluded: [...next] };
}

/** Holt ein gelöschtes Teilstück zurück. */
export function restoreKeys(model: NetModel, keys: string[]): NetModel {
  if (keys.length === 0) return model;
  const drop = new Set(keys);
  return { ...model, excluded: model.excluded.filter((k) => !drop.has(k)) };
}

/** „Alles Rote löschen": entfernt alle nicht-im-Netz/Sackgassen-Teilstücke. */
export function deleteAllRed(model: NetModel): NetModel {
  return deleteKeys(model, deriveNet(model).redKeys);
}

export function setConfig(model: NetModel, patch: Partial<NetModelConfig>): NetModel {
  return { ...model, config: { ...model.config, ...patch } };
}
