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
  edgeId: number;     // OSM way id der Quell-Kante
  from: number;       // Knoten-ID
  to: number;         // Knoten-ID
  meters: number;     // Polylinien-Länge der Quell-Kante
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

// Verschweißt Endpunkte naher Kanten zu Knoten und baut den Graphen.
// weldMeters: Endpunkte näher als dieser Wert gelten als derselbe Knoten.
export function graphCompose(edges: PathEdge[], weldMeters = 1.5): NetGraph {
  const net = edges.filter((e) => e.inNet && e.points.length >= 2);
  const nodes: NetNode[] = [];

  // Endpunkt → bestehender Knoten (innerhalb weldMeters) oder neuer Knoten.
  const findOrAddNode = (lat: number, lng: number): number => {
    for (const n of nodes) {
      if (distMeters(lat, lng, n.lat, n.lng) <= weldMeters) return n.id;
    }
    const id = nodes.length;
    nodes.push({ id, lat, lng, degree: 0, component: -1 });
    return id;
  };

  const graphEdges: NetGraphEdge[] = [];
  for (const e of net) {
    const a = e.points[0];
    const b = e.points[e.points.length - 1];
    const from = findOrAddNode(a[0], a[1]);
    const to = findOrAddNode(b[0], b[1]);
    if (from === to) continue; // entartete/Schleifen-Kante überspringen
    // Polylinien-Länge der Quell-Kante (Summe der Segmente).
    let meters = 0;
    for (let i = 1; i < e.points.length; i++) {
      meters += distMeters(e.points[i - 1][0], e.points[i - 1][1], e.points[i][0], e.points[i][1]);
    }
    graphEdges.push({ edgeId: e.id, from, to, meters });
    nodes[from].degree += 1;
    nodes[to].degree += 1;
  }

  // Union-Find für Komponenten.
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
  for (const ge of graphEdges) union(ge.from, ge.to);

  const compIndex = new Map<number, number>();
  for (const n of nodes) {
    const root = find(n.id);
    if (!compIndex.has(root)) compIndex.set(root, compIndex.size);
    n.component = compIndex.get(root) as number;
  }

  return { nodes, edges: graphEdges, componentCount: compIndex.size };
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
