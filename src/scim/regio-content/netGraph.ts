// Netz-Graph-Komposition (Um-/Ausbauplan E1, ann_080).
//
// Verwandelt die geholten/gefilterten Wegnetz-Kanten (PathEdge[], Punkte als
// [lat,lng]) in einen echten GRAPHEN: Endpunkte naher Kanten werden zu EINEM
// Knoten verschweißt (per Meter-ε), Kanten tragen from/to-Knoten-IDs, jeder
// Knoten kennt seinen GRAD, und die zusammenhängenden KOMPONENTEN werden per
// Union-Find bestimmt.
//
// Das ist das Fundament für:
//   - Sackgassen (degree-1-Knoten, E2)
//   - Lückenschließen (mehrere Komponenten → Lücken, E3)
//   - „zusammengeschweißt, sackgassenfrei, nur POIs als Endknoten".
//
// Bewusst einfach (Stabilität): verschweißt nur ENDpunkte (OSM-Ways treffen sich
// i. d. R. an gemeinsamen Endpunkten). Mid-Segment-Kreuzungen ohne gemeinsamen
// Knoten sind eine spätere Verfeinerung. Reine Funktion, kein UI, kein Leaflet.

import type { PathEdge } from './pathEngine';

export interface NetNode {
  id: number;
  lat: number;
  lng: number;
  degree: number;     // Anzahl anliegender Kanten
  component: number;  // 0-basierter Komponenten-Index (Union-Find)
}

export interface NetGraphEdge {
  edgeId: number;            // OSM way id der Quell-Kante (negativ = E3-Brücke)
  seg: number;               // Teil-Index innerhalb des Ways (0-basiert); Brücke: 0
  from: number;              // Knoten-ID
  to: number;                // Knoten-ID
  meters: number;            // Länge dieses Teilstücks
  points: [number, number][]; // Teil-Polylinie zwischen from und to (fürs Rendering)
}

export interface NetGraph {
  nodes: NetNode[];
  edges: NetGraphEdge[];
  componentCount: number;
}

// Pro Komponente: Gesamtlänge + ob sie als „Netz" (schwarz) gilt (Länge ≥ Schwelle).
// Kleinere Komponenten = „Rest" (grün). E2-Klassifizierung (ann_080).
export interface ComponentInfo {
  component: number;
  meters: number;
  edgeCount: number;
  nodeCount: number;
  isNetz: boolean;
}

// Haversine-Distanz in Metern.
function distMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Koordinaten-Schlüssel: OSM teilt an Kreuzungen denselben Knoten → identische
// Koordinaten. 7 Nachkommastellen (~1 cm) machen geteilte Stützpunkte exakt
// gleich, ohne real verschiedene Knoten zu verschmelzen.
const coordKey = (lat: number, lng: number): string => `${lat.toFixed(7)},${lng.toFixed(7)}`;

// Baut aus den Kanten einen ECHTEN, genodeten Graphen: jeder Stützpunkt, der von
// ≥2 Ways benutzt wird (oder ein Way-Endpunkt ist), wird zu einem Knoten; jeder
// Way wird an diesen Knoten in Teilstücke GESPLITTET. So werden T-Kreuzungen
// (Ende eines Weges trifft die Mitte eines anderen) korrekt verbunden — und nur
// ECHTE degree-1-Enden bleiben Sackgassen. (Ersetzt das frühere reine
// Endpunkt-Verschweißen; behebt falsche Sackgassen + nicht greifendes Merge.)
export function graphCompose(edges: PathEdge[]): NetGraph {
  const net = edges.filter((e) => e.inNet && e.points.length >= 2);

  // 1) Wie viele Ways benutzen jeden Stützpunkt? (pro Way entduppliziert)
  const usage = new Map<string, number>();
  for (const e of net) {
    const seen = new Set<string>();
    for (const p of e.points) {
      const k = coordKey(p[0], p[1]);
      if (seen.has(k)) continue;
      seen.add(k);
      usage.set(k, (usage.get(k) ?? 0) + 1);
    }
  }

  // 2) Knoten-Registry per Koordinaten-Schlüssel.
  const nodeOf = new Map<string, number>();
  const nodes: NetNode[] = [];
  const getNode = (lat: number, lng: number): number => {
    const k = coordKey(lat, lng);
    let id = nodeOf.get(k);
    if (id === undefined) { id = nodes.length; nodes.push({ id, lat, lng, degree: 0, component: -1 }); nodeOf.set(k, id); }
    return id;
  };

  // 3) Jeden Way an Kreuzungs-Stützpunkten (geteilt oder Endpunkt) splitten.
  const graphEdges: NetGraphEdge[] = [];
  for (const e of net) {
    const pts = e.points;
    let fromNode = getNode(pts[0][0], pts[0][1]);
    let segPoints: [number, number][] = [[pts[0][0], pts[0][1]]];
    let segMeters = 0;
    let seg = 0;
    for (let i = 1; i < pts.length; i++) {
      segMeters += distMeters(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      segPoints.push([pts[i][0], pts[i][1]]);
      const isLast = i === pts.length - 1;
      const shared = (usage.get(coordKey(pts[i][0], pts[i][1])) ?? 0) >= 2;
      if (isLast || shared) {
        const toNode = getNode(pts[i][0], pts[i][1]);
        if (toNode !== fromNode && segPoints.length >= 2) {
          graphEdges.push({ edgeId: e.id, seg: seg++, from: fromNode, to: toNode, meters: segMeters, points: segPoints });
        }
        fromNode = toNode;
        segPoints = [[pts[i][0], pts[i][1]]];
        segMeters = 0;
      }
    }
  }

  return finalize(nodes, graphEdges);
}

// Grad (Neuzählung aus den Kanten) + Komponenten (Union-Find) setzen. Geteilt von
// graphCompose und bridgeGaps, damit nach dem Brückenbau alles konsistent neu
// gerechnet wird (verbundene Enden verlieren ihren degree-1-Status).
function finalize(nodes: NetNode[], edges: NetGraphEdge[]): NetGraph {
  for (const n of nodes) n.degree = 0;
  for (const e of edges) { nodes[e.from].degree += 1; nodes[e.to].degree += 1; }

  const parent = nodes.map((_, i) => i);
  const find = (x: number): number => {
    let r = x;
    while (parent[r] !== r) { parent[r] = parent[parent[r]]; r = parent[r]; }
    return r;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a); const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (const e of edges) union(e.from, e.to);

  const compIndex = new Map<number, number>();
  for (const n of nodes) {
    const root = find(n.id);
    if (!compIndex.has(root)) compIndex.set(root, compIndex.size);
    n.component = compIndex.get(root) as number;
  }

  return { nodes, edges, componentCount: compIndex.size };
}

// Bequeme Ableitungen fürs spätere E2/E3.
export function deadEndNodes(graph: NetGraph): NetNode[] {
  return graph.nodes.filter((n) => n.degree === 1);
}

// E2-Klassifizierung: pro Komponente Gesamtlänge + Netz/Rest (Länge ≥ Schwelle).
// Rückgabe nach Komponenten-Index sortiert; die längste zuerst zu finden ist trivial.
export function classifyComponents(graph: NetGraph, minNetMeters: number): ComponentInfo[] {
  const meters = new Map<number, number>();
  const edgeCount = new Map<number, number>();
  for (const e of graph.edges) {
    // beide Endknoten liegen in derselben Komponente — Komponente des from-Knotens.
    const comp = graph.nodes[e.from]?.component ?? -1;
    meters.set(comp, (meters.get(comp) ?? 0) + e.meters);
    edgeCount.set(comp, (edgeCount.get(comp) ?? 0) + 1);
  }
  const nodeCount = new Map<number, number>();
  for (const n of graph.nodes) nodeCount.set(n.component, (nodeCount.get(n.component) ?? 0) + 1);

  const out: ComponentInfo[] = [];
  for (let c = 0; c < graph.componentCount; c++) {
    const m = meters.get(c) ?? 0;
    out.push({
      component: c,
      meters: m,
      edgeCount: edgeCount.get(c) ?? 0,
      nodeCount: nodeCount.get(c) ?? 0,
      isNetz: m >= minNetMeters,
    });
  }
  return out;
}

// Hilfs-Lookup: ist die Komponente eines Knotens ein „Netz" (schwarz)?
export function netzComponents(graph: NetGraph, minNetMeters: number): Set<number> {
  return new Set(classifyComponents(graph, minNetMeters).filter((c) => c.isNetz).map((c) => c.component));
}

// E3 — Lückenfüller-Automat: lose Enden (degree-1) verschiedener Komponenten, die
// näher als toleranceMeters liegen, mit einer Brücke verbinden → Komponenten
// verschmelzen. Bewusst EINFACH + NACHVOLLZIEHBAR (SCIM-Stabilitätsregel):
//   - nur Endpunkt↔Endpunkt (lose Enden), nicht Mid-Segment,
//   - Kruskal-artig: kürzeste Lücken zuerst, jede Brücke verbindet zwei noch
//     getrennte Komponenten (keine Mehrfach-/Ringbrücken).
// Brücken tragen negative edgeId (−1, −2, …) zur Unterscheidung von OSM-Ways.
export function bridgeGaps(
  graph: NetGraph,
  toleranceMeters: number,
): { graph: NetGraph; bridges: NetGraphEdge[] } {
  if (toleranceMeters <= 0) return { graph, bridges: [] };

  const ends = graph.nodes.filter((n) => n.degree === 1);
  const pairs: { a: number; b: number; d: number }[] = [];
  for (let i = 0; i < ends.length; i++) {
    for (let j = i + 1; j < ends.length; j++) {
      const na = ends[i]; const nb = ends[j];
      if (na.component === nb.component) continue;
      const d = distMeters(na.lat, na.lng, nb.lat, nb.lng);
      if (d <= toleranceMeters) pairs.push({ a: na.id, b: nb.id, d });
    }
  }
  pairs.sort((x, y) => x.d - y.d);

  // Union-Find über die bestehenden Komponenten-Indizes.
  const parent: number[] = [];
  for (let c = 0; c < graph.componentCount; c++) parent.push(c);
  const find = (x: number): number => {
    let r = x;
    while (parent[r] !== r) { parent[r] = parent[parent[r]]; r = parent[r]; }
    return r;
  };

  const bridges: NetGraphEdge[] = [];
  let nextId = -1;
  for (const p of pairs) {
    const ca = find(graph.nodes[p.a].component);
    const cb = find(graph.nodes[p.b].component);
    if (ca === cb) continue; // schon (über eine kürzere Brücke) verbunden
    parent[ca] = cb;
    const na = graph.nodes[p.a]; const nb = graph.nodes[p.b];
    bridges.push({
      edgeId: nextId--, seg: 0, from: p.a, to: p.b, meters: p.d,
      points: [[na.lat, na.lng], [nb.lat, nb.lng]],
    });
  }

  if (bridges.length === 0) return { graph, bridges: [] };

  // Knoten klonen (degree/component werden in finalize neu gesetzt), neu rechnen.
  const nodes: NetNode[] = graph.nodes.map((n) => ({ ...n }));
  const merged = finalize(nodes, [...graph.edges, ...bridges]);
  return { graph: merged, bridges };
}
