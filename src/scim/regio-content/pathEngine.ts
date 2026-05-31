// Wanderwegnetz-Ableitungs-Engine (ann_072, Phase 3).
//
// Phase 3 deckt die ersten beiden Pipeline-Schritte ab:
//   1. OSM-Fetch (Overpass) fuer die Boundary-bbox
//   2. Primaer-Filter (highway in Whitelist) + Ausschluss-Filter (foot/access)
//
// Direkt aus dem Browser gegen die oeffentliche Overpass-API (CORS erlaubt).
// Konnektoren, Topologie-Gate, Graph-Komposition, Crop, Luecken und Sackgassen
// folgen ab Phase 4 — hier werden Strassen-Klassen zwar mitgeladen, aber noch
// nicht ausgewertet.

import type { Position } from 'geojson';
import type { PathConfig, BridlewayMode } from './pathConfig';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

// Klassen, die in Phase 3 als primaere Wege auswertbar sind.
const PRIMARY_CLASSES = ['track', 'footway', 'path', 'steps', 'pedestrian', 'bridleway'] as const;
// Strassen-Klassen (Konnektor-Kandidaten ab Phase 4) — werden mitgeladen,
// damit Phase 4 keinen zweiten Fetch braucht.
const CONNECTOR_CLASSES = [
  'service', 'residential', 'living_street', 'unclassified',
  'tertiary', 'secondary', 'primary',
] as const;

export type EdgeSource = 'primary' | 'connector_candidate';

export interface PathEdge {
  id: number;            // OSM way id
  highway: string;       // roher highway-Tag
  source: EdgeSource;    // 'primary' | 'connector_candidate'
  // Leaflet-fertige Punkte ([lat, lng]) entlang der Way-Geometrie.
  // Bei zugelassenen Konnektoren auf das bridgende Teilstueck zugeschnitten.
  points: [number, number][];
  tags: Record<string, string>;
  // Teil des aktiven Netzes? Primaere Wege immer; Konnektoren nur nach dem
  // Gate (gateConnectors): bridgen sie zwei gruene Anschluesse unter Max-Laenge.
  inNet: boolean;
}

export interface PathFetchResult {
  edges: PathEdge[];        // gefiltert (primary) + Konnektor-Kandidaten
  primaryCount: number;
  connectorCount: number;   // aktive Konnektoren (per Config) — Teil des Netzes
  rawWayCount: number;
  bbox: [number, number, number, number]; // [south, west, north, east]
  fetchedAt: number;
}

// ─── Netz-Datengröße ──────────────────────────────────────────────────────────
// Stabile, wiederverwendbare Kennzahl eines Netzes: Kanten, Stützpunkte und die
// serialisierte Byte-Größe (UTF-8). Dient dem Speicher-Budget (localStorage-Draft)
// UND später dem Auslieferungs-Budget (Sensus-Core-Paket / Colour-Mesh).
export interface NetStats {
  edgeCount: number;
  pointCount: number;   // Summe aller Stützpunkte über alle Kanten
  bytes: number;        // JSON-Größe in Bytes (UTF-8)
}

export function netStats(edges: PathEdge[]): NetStats {
  let pointCount = 0;
  for (const e of edges) pointCount += e.points.length;
  const bytes = new TextEncoder().encode(JSON.stringify(edges)).length;
  return { edgeCount: edges.length, pointCount, bytes };
}

// Bytes hübsch (B / KB / MB).
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── bbox aus Boundary-Polygon ────────────────────────────────────────────────
// polygon ist Position[] = [lng, lat][]. Rueckgabe im Overpass-Format
// [south, west, north, east].
export function bboxFromPolygon(polygon: Position[]): [number, number, number, number] | null {
  if (!polygon || polygon.length < 3) return null;
  let south = Infinity, west = Infinity, north = -Infinity, east = -Infinity;
  for (const [lng, lat] of polygon) {
    if (lat < south) south = lat;
    if (lat > north) north = lat;
    if (lng < west) west = lng;
    if (lng > east) east = lng;
  }
  if (!isFinite(south) || !isFinite(west) || !isFinite(north) || !isFinite(east)) return null;
  return [south, west, north, east];
}

function buildOverpassQuery(bbox: [number, number, number, number]): string {
  const [s, w, n, e] = bbox;
  const classes = [...PRIMARY_CLASSES, ...CONNECTOR_CLASSES].join('|');
  return `[out:json][timeout:60];
way["highway"~"^(${classes})$"](${s},${w},${n},${e});
out geom tags;`;
}

interface OverpassWay {
  type: 'way';
  id: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

// ─── Filter-Logik ─────────────────────────────────────────────────────────────

function isExcluded(tags: Record<string, string>, cfg: PathConfig): boolean {
  if (cfg.ausschluesse.foot_no && tags.foot === 'no') return true;
  if (cfg.ausschluesse.access_private && tags.access === 'private') return true;
  if (cfg.ausschluesse.access_no && tags.access === 'no') return true;
  return false;
}

const FOOT_ALLOWED = new Set(['yes', 'designated', 'permissive', 'official']);

function bridlewayAllowed(tags: Record<string, string>, mode: BridlewayMode): boolean {
  if (mode === true) return true;
  if (mode === false) return false;
  // 'nur_wenn_foot_erlaubt': explizit erlaubt, oder plausibel zulaessig
  // (kein entgegenstehender foot-Tag).
  if (tags.foot && FOOT_ALLOWED.has(tags.foot)) return true;
  if (tags.foot && tags.foot === 'no') return false;
  return true; // kein foot-Tag => plausibel zulaessig
}

// Entscheidet, ob ein highway-Wert nach der Primaer-Whitelist der Config zaehlt.
function isPrimaryEnabled(highway: string, cfg: PathConfig, tags: Record<string, string>): boolean {
  const p = cfg.primaere_wege;
  switch (highway) {
    case 'track':      return p.track;
    case 'footway':    return p.footway;
    case 'path':       return p.path;
    case 'steps':      return p.steps;
    case 'pedestrian': return p.pedestrian;
    case 'bridleway':  return bridlewayAllowed(tags, p.bridleway);
    default:           return false;
  }
}

// ─── Netz-Zugehoerigkeit ───────────────────────────────────────────────────────
// Das "Netz" = primaere Wege + aktive Konnektoren (Asphalt). Konnektoren werden
// immer geladen, zaehlen aber nur, wenn ihre Gruppe in der Config aktiv ist.
export type ConnectorGroup = 'nebenstrasse' | 'landstrasse';

const NEBENSTRASSE = new Set(['service', 'residential', 'living_street', 'unclassified']);
const LANDSTRASSE = new Set(['tertiary', 'secondary', 'primary']);

export function connectorGroupOf(highway: string): ConnectorGroup | null {
  if (NEBENSTRASSE.has(highway)) return 'nebenstrasse';
  if (LANDSTRASSE.has(highway)) return 'landstrasse';
  return null;
}

// Gehoert die Kante zum aktiven Netz (rendern + Anker-Snap)?
// Nach gateConnectors entscheidet allein das inNet-Flag.
export function isNetEdge(edge: PathEdge): boolean {
  return edge.inNet;
}

// Asphalt-Erkennung (project_asphalt_tracking): das Netz geht von Wanderwegen aus;
// hereingenommene Connector-Straßen sind i. d. R. Asphalt. Der Runtime soll später
// vor Asphalt-Strecken warnen — darum als Eigenschaft ableiten.
//   1) expliziter surface-Tag entscheidet (paved → Asphalt, unpaved → nicht),
//   2) sonst per Klasse: primäre Wanderweg-Klassen = nicht-Asphalt, Straßen = Asphalt.
const PAVED_SURFACES = ['asphalt', 'paved', 'concrete', 'paving_stones', 'sett', 'cobblestone', 'concrete:plates'];
const UNPAVED_SURFACES = ['unpaved', 'gravel', 'fine_gravel', 'compacted', 'ground', 'dirt', 'earth', 'grass', 'sand', 'mud', 'wood', 'pebblestone'];
export function isAsphalt(edge: PathEdge): boolean {
  const s = (edge.tags?.surface ?? '').toLowerCase();
  if (s) {
    if (PAVED_SURFACES.includes(s)) return true;
    if (UNPAVED_SURFACES.includes(s)) return false;
  }
  // Fallback per Klasse: Connector (Straße) = Asphalt, primärer Wanderweg = nicht.
  return edge.source !== 'primary';
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

// Koordinaten-Reduktion über NACHKOMMASTELLEN: rundet jede Koordinate auf N
// Stellen → kürzere Zahlen → kleineres JSON (Auslieferungs-Budget). Topologie-
// sicher: identische Koordinaten runden identisch, geteilte Kreuzungsknoten
// bleiben geteilt. (7 Stellen ≈ 1 cm, 6 ≈ 0,11 m, 5 ≈ 1,1 m.)
export function roundPolyline(points: [number, number][], decimals: number): [number, number][] {
  const f = Math.pow(10, decimals);
  return points.map(([lat, lng]) => [Math.round(lat * f) / f, Math.round(lng * f) / f] as [number, number]);
}

// Senkrecht-Abstand (Meter, lokal-planar) eines Punkts zur Geraden a–b.
function perpDistMeters(p: [number, number], a: [number, number], b: [number, number]): number {
  const mLng = 111320 * Math.cos((p[0] * Math.PI) / 180);
  const px = p[1] * mLng, py = p[0] * M_LAT;
  const ax = a[1] * mLng, ay = a[0] * M_LAT;
  const bx = b[1] * mLng, by = b[0] * M_LAT;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const cross = Math.abs(dx * (ay - py) - (ax - px) * dy);
  return cross / Math.sqrt(len2);
}

// Douglas-Peucker: behält nur Punkte, ohne die ein Originalpunkt weiter als eps
// (Meter) von der vereinfachten Linie abwiche → garantierter ±eps-Korridor (auch
// in Kurven; enge Kurven behalten ihre Punkte, Geraden kollabieren).
function douglasPeucker(points: [number, number][], eps: number): [number, number][] {
  if (points.length < 3) return points;
  let maxD = -1; let idx = -1;
  const a = points[0]; const b = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistMeters(points[i], a, b);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [a, b];
  const left = douglasPeucker(points.slice(0, idx + 1), eps);
  const right = douglasPeucker(points.slice(idx), eps);
  return [...left.slice(0, -1), ...right];
}

// Topologie-sicheres DP fürs ganze Netz: jeder Way wird zuerst an seinen
// Kreuzungs-Stützpunkten (geteilte Koordinaten + Endpunkte) zerlegt, dann läuft DP
// nur INNERHALB der Stücke. So bleiben Kreuzungsknoten exakt erhalten (keine
// brechenden T-Kreuzungen), und jeder Punkt bleibt im ±eps-Korridor.
export function simplifyNet(edges: PathEdge[], eps: number): PathEdge[] {
  if (eps <= 0) return edges;
  const key = (lat: number, lng: number) => `${lat.toFixed(7)},${lng.toFixed(7)}`;
  const usage = new Map<string, number>();
  for (const e of edges) {
    if (!e.inNet) continue;
    const seen = new Set<string>();
    for (const p of e.points) {
      const k = key(p[0], p[1]);
      if (seen.has(k)) continue;
      seen.add(k);
      usage.set(k, (usage.get(k) ?? 0) + 1);
    }
  }
  return edges.map((e) => {
    if (!e.inNet || e.points.length <= 2) return e;
    const pts = e.points;
    const out: [number, number][] = [];
    let runStart = 0;
    for (let i = 1; i < pts.length; i++) {
      const shared = (usage.get(key(pts[i][0], pts[i][1])) ?? 0) >= 2;
      if (i === pts.length - 1 || shared) {
        const simp = douglasPeucker(pts.slice(runStart, i + 1), eps);
        for (let j = out.length ? 1 : 0; j < simp.length; j++) out.push(simp[j]);
        runStart = i;
      }
    }
    return { ...e, points: out };
  });
}

// Gesamtlänge des Netzes in Metern (alle inNet-Kanten). Wanderweg = netMeters − asphaltMeters.
export function netMeters(edges: PathEdge[]): number {
  let m = 0;
  for (const e of edges) {
    if (!e.inNet) continue;
    for (let i = 1; i < e.points.length; i++) {
      m += distMeters(e.points[i - 1][0], e.points[i - 1][1], e.points[i][0], e.points[i][1]);
    }
  }
  return m;
}

// Asphalt-Länge eines Netzes in Metern (nur inNet-Kanten) — Basis fürs spätere
// „Route führt über X m Asphalt" + Mindestlänge-Schwelle.
export function asphaltMeters(edges: PathEdge[]): number {
  let m = 0;
  for (const e of edges) {
    if (!e.inNet || !isAsphalt(e)) continue;
    for (let i = 1; i < e.points.length; i++) {
      m += distMeters(e.points[i - 1][0], e.points[i - 1][1], e.points[i][0], e.points[i][1]);
    }
  }
  return m;
}

function classify(ways: OverpassWay[], cfg: PathConfig): PathEdge[] {
  const edges: PathEdge[] = [];
  for (const way of ways) {
    if (!way.geometry || way.geometry.length < 2) continue;
    const tags = way.tags ?? {};
    const highway = tags.highway ?? '';
    const points = way.geometry.map((g) => [g.lat, g.lon] as [number, number]);

    const isPrimaryClass = (PRIMARY_CLASSES as readonly string[]).includes(highway);
    if (isPrimaryClass) {
      if (isExcluded(tags, cfg)) continue;
      if (!isPrimaryEnabled(highway, cfg, tags)) continue;
      edges.push({ id: way.id, highway, source: 'primary', points, tags, inNet: true });
    } else {
      // Strasse — Konnektor-Kandidat; inNet entscheidet erst gateConnectors.
      edges.push({ id: way.id, highway, source: 'connector_candidate', points, tags, inNet: false });
    }
  }
  return edges;
}

// ─── Konnektor-Gate (Phase 4) ───────────────────────────────────────────────────
// Eine Konnektor-Strasse wird an jedem gruenen Anschlusspunkt (Endpunkt eines
// primaeren Wegs, innerhalb der Anschluss-Toleranz) zerschnitten. Jedes
// *benachbarte* Anschluss-Paar wird einzeln als Bridge behalten, sofern sein
// Teilstueck kuerzer als die Max-Laenge der Gruppe ist. So bekommt jede Gabel
// ihren eigenen kurzen Asphalt-Stummel; lange Luecken fallen einzeln raus, statt
// die ganze Strasse zu verwerfen. Die Anschluss-Toleranz ist faktisch der
// Verschweiss-Regler (cfg.konnektoren.anschluss_toleranz_meter).

const M_LAT = 110540;

// Naechster Punkt auf einer Polyline + Bogenlaenge bis dorthin (Meter, lokal-planar).
function projectToPolyline(
  lat: number, lng: number, pts: [number, number][], mLng: number,
): { s: number; dist: number } {
  const px = lng * mLng, py = lat * M_LAT;
  let best = Infinity, bestS = 0, acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const ax = pts[i][1] * mLng, ay = pts[i][0] * M_LAT;
    const bx = pts[i + 1][1] * mLng, by = pts[i + 1][0] * M_LAT;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const segLen = Math.sqrt(len2);
    let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const sx = ax + t * dx, sy = ay + t * dy;
    const d = Math.hypot(px - sx, py - sy);
    if (d < best) { best = d; bestS = acc + t * segLen; }
    acc += segLen;
  }
  return { s: bestS, dist: best };
}

// Polyline auf das Bogenlaengen-Intervall [sLo, sHi] zuschneiden.
function cropPolyline(
  pts: [number, number][], sLo: number, sHi: number, mLng: number,
): [number, number][] {
  const out: [number, number][] = [];
  let acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [aLat, aLng] = pts[i];
    const [bLat, bLng] = pts[i + 1];
    const segLen = Math.hypot((bLng - aLng) * mLng, (bLat - aLat) * M_LAT);
    if (segLen > 0 && acc + segLen >= sLo && acc <= sHi) {
      const tA = Math.max(0, (sLo - acc) / segLen);
      const tB = Math.min(1, (sHi - acc) / segLen);
      const p1: [number, number] = [aLat + (bLat - aLat) * tA, aLng + (bLng - aLng) * tA];
      const p2: [number, number] = [aLat + (bLat - aLat) * tB, aLng + (bLng - aLng) * tB];
      if (out.length === 0) out.push(p1);
      out.push(p2);
    }
    acc += segLen;
  }
  return out;
}

// Liefert die Bridge-Teilstuecke (inNet=true) aus den Konnektor-Kandidaten.
// Die Original-Kandidaten bleiben mit inNet=false unangetastet im edges-Array.
function gateConnectors(edges: PathEdge[], cfg: PathConfig): PathEdge[] {
  // Anschlusspunkte = Endpunkte aller primaeren Wege.
  const endpoints: [number, number][] = [];
  for (const e of edges) {
    if (e.source !== 'primary' || e.points.length < 2) continue;
    endpoints.push(e.points[0], e.points[e.points.length - 1]);
  }
  const tol = cfg.konnektoren.anschluss_toleranz_meter;
  const bridges: PathEdge[] = [];
  for (const e of edges) {
    if (e.source !== 'connector_candidate' || e.points.length < 2) continue;
    const g = connectorGroupOf(e.highway);
    if (!g || !cfg.konnektoren[g].aktiv) continue;     // Gruppe deaktiviert → keine Bridge
    const maxLen = cfg.konnektoren[g].max_laenge_meter;
    const mLng = 111320 * Math.cos((e.points[0][0] * Math.PI) / 180);

    // Bogenlaengen der Anschlusspunkte einsammeln, sortieren, nah beieinander-
    // liegende (selber Knoten ueber mehrere primaere Ways) zusammenfassen.
    const raw: number[] = [];
    for (const [eLat, eLng] of endpoints) {
      const { s, dist } = projectToPolyline(eLat, eLng, e.points, mLng);
      if (dist <= tol) raw.push(s);
    }
    if (raw.length < 2) continue;
    raw.sort((a, b) => a - b);
    const attachS: number[] = [];
    for (const s of raw) {
      if (attachS.length === 0 || s - attachS[attachS.length - 1] > 0.5) attachS.push(s);
    }

    // Jedes benachbarte Paar einzeln als Bridge pruefen.
    for (let i = 0; i + 1 < attachS.length; i++) {
      const span = attachS[i + 1] - attachS[i];
      if (span <= 0 || span > maxLen) continue;        // Luecke zu gross → dieses Paar raus
      const cropped = cropPolyline(e.points, attachS[i], attachS[i + 1], mLng);
      if (cropped.length >= 2) {
        bridges.push({ id: e.id, highway: e.highway, source: 'connector_candidate', points: cropped, tags: e.tags, inNet: true });
      }
    }
  }
  return bridges;
}

// ─── A→B Graph-Routing (manuelles Lückenfüllen über mehrere Ways) ──────────────
// Der Ursprungsfehler von connectorPieceBetween: es schneidet EIN einzelnes Way.
// An Kreuzungen ist eine Straße in mehrere Ways zerlegt → A und B auf
// verschiedenen Ways liessen sich nicht spannen, man musste Stück für Stück
// klicken. Hier wird stattdessen über den genodeten GESAMT-Graphen geroutet
// (alle gefetchten Kanten — Wanderweg UND Connector). Ein einziges A→B-Paar
// spannt damit die ganze Strecke über beliebig viele Ways/Kreuzungen.
//
// Mehrdeutige Verzweigungen entscheidet die Hover-Spur (trail, [lat,lng][]):
// Kanten fern der Spur werden teurer, der Pfad hugt also den Cursor-Pfad statt
// blind die kürzeste (oft falsche) Route zu nehmen. Ohne Spur → kürzeste Route.
//
// Findet sich keine Verbindung (Teilstück fehlt im Overpass), kommt ein gerades
// Stück A→B (≤ maxStraightMeters) — das ist Fall 5 (Wanderweg→Wanderweg, Lücke
// in den OSM-Daten selbst).

interface RouteSeg { from: number; to: number; meters: number; points: [number, number][]; }
interface RoutingGraph { segs: RouteSeg[]; nodeCount: number; }

const ROUTE_KEY = (lat: number, lng: number): string => `${lat.toFixed(7)},${lng.toFixed(7)}`;

// Wie composeGraph in netGraph, aber OHNE inNet-Filter (Connector-Kandidaten
// müssen mitrouten) und self-contained (kein Cross-Import).
function composeRoutingGraph(edges: PathEdge[]): RoutingGraph {
  const valid = edges.filter((e) => e.points.length >= 2);
  const usage = new Map<string, number>();
  for (const e of valid) {
    const seen = new Set<string>();
    for (const p of e.points) {
      const k = ROUTE_KEY(p[0], p[1]);
      if (seen.has(k)) continue;
      seen.add(k);
      usage.set(k, (usage.get(k) ?? 0) + 1);
    }
  }
  // Knoten-Registry mit Toleranz: exakt gleiche Koordinaten teilen sofort einen
  // Knoten; zusätzlich werden Punkte, die nur WENIGE METER auseinanderliegen,
  // zum selben Knoten verschmolzen. Grund: OSM-Strecken sind an „Knien" nicht
  // immer exakt genodet — der Endpunkt der Verbindungsstrecke liegt dann ein
  // paar Meter neben dem Knie und wäre sonst ein isolierter Sackgassen-Knoten,
  // den das Routing nie erreicht. (Wie bridgeGaps fürs Netz, hier fürs Routing.)
  const MERGE_TOL_M = 3;
  const nodeOf = new Map<string, number>();
  const nodeCoords: [number, number][] = [];
  const getNode = (lat: number, lng: number): number => {
    const k = ROUTE_KEY(lat, lng);
    const exact = nodeOf.get(k);
    if (exact !== undefined) return exact;
    const mLng = 111320 * Math.cos((lat * Math.PI) / 180);
    for (let j = 0; j < nodeCoords.length; j++) {
      const [nlat, nlng] = nodeCoords[j];
      if (Math.hypot((lng - nlng) * mLng, (lat - nlat) * M_LAT) <= MERGE_TOL_M) {
        nodeOf.set(k, j);
        return j;
      }
    }
    const id = nodeCoords.length;
    nodeCoords.push([lat, lng]);
    nodeOf.set(k, id);
    return id;
  };
  const segs: RouteSeg[] = [];
  for (const e of valid) {
    const pts = e.points;
    const mLng = 111320 * Math.cos((pts[0][0] * Math.PI) / 180);
    let from = getNode(pts[0][0], pts[0][1]);
    let sp: [number, number][] = [[pts[0][0], pts[0][1]]];
    let m = 0;
    for (let i = 1; i < pts.length; i++) {
      m += Math.hypot((pts[i][1] - pts[i - 1][1]) * mLng, (pts[i][0] - pts[i - 1][0]) * M_LAT);
      sp.push([pts[i][0], pts[i][1]]);
      const last = i === pts.length - 1;
      const shared = (usage.get(ROUTE_KEY(pts[i][0], pts[i][1])) ?? 0) >= 2;
      if (last || shared) {
        const to = getNode(pts[i][0], pts[i][1]);
        if (to !== from && sp.length >= 2) segs.push({ from, to, meters: m, points: sp });
        from = to; sp = [[pts[i][0], pts[i][1]]]; m = 0;
      }
    }
  }
  return { segs, nodeCount: nodeCoords.length };
}

// Mittlere Distanz Segment→Hover-Spur (Meter), gemittelt über die MITTEN der
// Teilstrecken. Bewusst NICHT die Eck-/Endpunkte abtasten: an einer Verzweigung
// teilen sich beide Zweige die Kreuzungsknoten, und die liegen oft auf der Spur
// (Distanz 0) — würden sie mitzählen, verschwände der Unterschied zwischen den
// Zweigen. Die Segment-Mitten sind das, was die Zweige unterscheidet.
function segTrailDist(seg: RouteSeg, trail: [number, number][]): number {
  if (trail.length < 2) return 0;
  const mLng = 111320 * Math.cos((seg.points[0][0] * Math.PI) / 180);
  let sum = 0; let n = 0;
  for (let i = 0; i + 1 < seg.points.length; i++) {
    const a = seg.points[i]; const b = seg.points[i + 1];
    const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    sum += projectToPolyline(mid[0], mid[1], trail, mLng).dist; n++;
  }
  return n ? sum / n : 0;
}

export interface RoutePathResult {
  points: [number, number][];
  mode: 'routed' | 'straight';
  meters: number;
}

export function buildRoutePath(
  edges: PathEdge[],
  a: [number, number],
  b: [number, number],
  trail: [number, number][],
  opts: { snapTolMeters?: number; trailWeight?: number; maxStraightMeters?: number } = {},
): RoutePathResult | null {
  const K = opts.trailWeight ?? 12;
  const maxStraight = opts.maxStraightMeters ?? 400;

  const straightFallback = (): RoutePathResult | null => {
    const mLng = 111320 * Math.cos((a[0] * Math.PI) / 180);
    const d = Math.hypot((b[1] - a[1]) * mLng, (b[0] - a[0]) * M_LAT);
    if (d > maxStraight) return null;
    return { points: [a, b], mode: 'straight', meters: d };
  };

  const g = composeRoutingGraph(edges);
  if (g.segs.length === 0) return straightFallback();

  // A/B auf das jeweils nächste Segment projizieren.
  const snap = (lat: number, lng: number) => {
    let best = Infinity, segIdx = -1, s = 0;
    for (let i = 0; i < g.segs.length; i++) {
      const seg = g.segs[i];
      const mLng = 111320 * Math.cos((seg.points[0][0] * Math.PI) / 180);
      const r = projectToPolyline(lat, lng, seg.points, mLng);
      if (r.dist < best) { best = r.dist; segIdx = i; s = r.s; }
    }
    return { segIdx, s, dist: best };
  };
  const sa = snap(a[0], a[1]);
  const sb = snap(b[0], b[1]);
  if (sa.segIdx < 0 || sb.segIdx < 0) return straightFallback();

  const segA = g.segs[sa.segIdx];
  const segB = g.segs[sb.segIdx];
  const mLngA = 111320 * Math.cos((segA.points[0][0] * Math.PI) / 180);
  const mLngB = 111320 * Math.cos((segB.points[0][0] * Math.PI) / 180);

  // Sonderfall: A und B auf demselben Segment → direkt zuschneiden.
  if (sa.segIdx === sb.segIdx) {
    const lo = Math.min(sa.s, sb.s); const hi = Math.max(sa.s, sb.s);
    if (hi - lo < 1) return straightFallback();
    const pts = cropPolyline(segA.points, lo, hi, mLngA);
    return { points: pts, mode: 'routed', meters: hi - lo };
  }

  // Adjazenz aufbauen (beide Richtungen), Kosten = Länge + K · Spur-Distanz.
  const adj: { to: number; segIdx: number; cost: number }[][] =
    Array.from({ length: g.nodeCount }, () => []);
  for (let i = 0; i < g.segs.length; i++) {
    const seg = g.segs[i];
    const cost = seg.meters + K * segTrailDist(seg, trail);
    adj[seg.from].push({ to: seg.to, segIdx: i, cost });
    adj[seg.to].push({ to: seg.from, segIdx: i, cost });
  }

  // Multi-Source-Dijkstra: Start an beiden Enden von segA mit den Teilkosten
  // vom Projektionspunkt pA bis zum jeweiligen Knoten.
  const dist = new Array(g.nodeCount).fill(Infinity);
  const prevNode = new Array(g.nodeCount).fill(-1);
  const prevSeg = new Array(g.nodeCount).fill(-1);
  const seed = (node: number, d: number) => { if (d < dist[node]) { dist[node] = d; } };
  seed(segA.from, sa.s);                       // pA → from (Bogenlänge ab Segmentanfang)
  seed(segA.to, segA.meters - sa.s);           // pA → to
  const visited = new Array(g.nodeCount).fill(false);
  // Simple O(V^2)-Dijkstra (Graphen sind klein: einige hundert Knoten).
  for (;;) {
    let u = -1, bestD = Infinity;
    for (let i = 0; i < g.nodeCount; i++) if (!visited[i] && dist[i] < bestD) { bestD = dist[i]; u = i; }
    if (u < 0) break;
    visited[u] = true;
    for (const e of adj[u]) {
      const nd = dist[u] + e.cost;
      if (nd < dist[e.to]) { dist[e.to] = nd; prevNode[e.to] = u; prevSeg[e.to] = e.segIdx; }
    }
  }

  // Bestes Ziel-Ende von segB wählen.
  const endFrom = dist[segB.from] + sb.s;
  const endTo = dist[segB.to] + (segB.meters - sb.s);
  const exitNode = endFrom <= endTo ? segB.from : segB.to;
  if (!Number.isFinite(dist[exitNode])) return straightFallback();

  // Knotenkette exitNode → … → (Start-Ende von segA) rückwärts einsammeln.
  const segChain: number[] = [];
  let cur = exitNode;
  while (prevSeg[cur] >= 0) { segChain.push(prevSeg[cur]); cur = prevNode[cur]; }
  const entryNode = cur; // ein Ende von segA
  segChain.reverse();

  // Polylinie zusammensetzen: pA → entryNode (Teil von segA), Kette, exitNode → pB.
  const out: [number, number][] = [];
  const pushPts = (pts: [number, number][]) => {
    for (const p of pts) {
      const last = out[out.length - 1];
      if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
    }
  };
  // Teil A: von pA zum entryNode.
  if (entryNode === segA.from) {
    pushPts(cropPolyline(segA.points, 0, sa.s, mLngA).reverse()); // segStart..pA → reversed = pA..from
  } else {
    pushPts(cropPolyline(segA.points, sa.s, segA.meters, mLngA)); // pA..to
  }
  // Mitte: Segmente der Kette, jeweils richtig orientiert.
  let node = entryNode;
  for (const si of segChain) {
    const seg = g.segs[si];
    const pts = seg.from === node ? seg.points : [...seg.points].reverse();
    pushPts(pts);
    node = seg.from === node ? seg.to : seg.from;
  }
  // Teil B: vom exitNode zu pB.
  if (exitNode === segB.from) {
    pushPts(cropPolyline(segB.points, 0, sb.s, mLngB)); // from..pB
  } else {
    pushPts(cropPolyline(segB.points, sb.s, segB.meters, mLngB).reverse()); // pB..to → reversed = to..pB
  }

  if (out.length < 2) return straightFallback();
  let meters = 0;
  for (let i = 1; i < out.length; i++) {
    meters += Math.hypot((out[i][1] - out[i - 1][1]) * mLngA, (out[i][0] - out[i - 1][0]) * M_LAT);
  }
  return { points: out, mode: 'routed', meters };
}

// ─── Oeffentlicher Einstieg ────────────────────────────────────────────────────

export async function deriveWanderwegnetz(
  polygon: Position[],
  cfg: PathConfig,
  signal?: AbortSignal,
): Promise<PathFetchResult> {
  const bbox = bboxFromPolygon(polygon);
  if (!bbox) throw new Error('Boundary-Polygon fehlt oder hat weniger als 3 Punkte.');

  const query = buildOverpassQuery(bbox);
  const res = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Overpass-Fehler ${res.status} ${res.statusText}`);
  }
  const json = await res.json() as { elements?: OverpassWay[] };
  const ways = (json.elements ?? []).filter((el): el is OverpassWay => el.type === 'way');

  const classified = classify(ways, cfg);
  const bridges = gateConnectors(classified, cfg);
  const edges = [...classified, ...bridges];
  return {
    edges,
    primaryCount: edges.filter((e) => e.source === 'primary').length,
    connectorCount: bridges.length,
    rawWayCount: ways.length,
    bbox,
    fetchedAt: Date.now(),
  };
}

// ─── Maskierung / Crop (ann_074, Umbauplan D) ───────────────────────────────────
// Das fertige Wegnetz wird mit einer ueber das Netz gelegten Masken-Boundary
// (Slot 2) zugeschnitten. Kernregel aus ann_074: NICHT am geometrischen
// Polygon-Schnittpunkt kappen, sondern am naechsten ECHTEN OSM-Knoten. Mit
// Overpass `out geom` ist jeder Way-Vertex ein realer OSM-Knoten — der Schnitt
// faellt also auf Vertices, nicht auf interpolierte Punkte.
//
//   inner-gate = letzter Vertex INNEN vor dem Uebertritt (user-facing Eintritt,
//                bleibt im Netz; frueherer "Boundary-Port").
//   outer-gate = erster Vertex AUSSEN (deterministischer Anschluss an die
//                Nachbar-Representation; selbst nicht Teil des Netzes).

export interface GateNode {
  edgeId: number;                       // OSM way id der gekappten Kante
  inner: [number, number];              // [lat, lng] inner-gate (im Netz)
  outer: [number, number] | null;       // [lat, lng] outer-gate (ausserhalb), falls vorhanden
}

export interface CropResult {
  edges: PathEdge[];        // Netz-Kanten auf das Maskeninnere zugeschnitten (inNet=true)
  gates: GateNode[];        // gefundene Gate-Knoten (inner/outer)
  keptCount: number;        // Kanten ganz innen (unveraendert uebernommen)
  clippedCount: number;     // Kanten, die die Maske kreuzten und gekappt wurden
  droppedCount: number;     // Netz-Kanten ganz ausserhalb (verworfen)
}

// Schneidet die Netz-Kanten (inNet) auf das Innere der Masken-Boundary zu.
// Nicht-Netz-Kandidaten (inNet=false) werden unveraendert durchgereicht.
// mask ist Position[] = [lng, lat][].
export function cropNetToMask(edges: PathEdge[], mask: Position[]): CropResult {
  if (!mask || mask.length < 3) {
    return { edges, gates: [], keptCount: 0, clippedCount: 0, droppedCount: 0 };
  }
  const out: PathEdge[] = [];
  const gates: GateNode[] = [];
  let keptCount = 0, clippedCount = 0, droppedCount = 0;

  for (const e of edges) {
    if (!e.inNet) { out.push(e); continue; }          // Nicht-Netz unangetastet
    const pts = e.points;
    if (pts.length < 2) { out.push(e); continue; }

    const inside = pts.map(([lat, lng]) => pointInRing(lng, lat, mask));
    const allIn = inside.every(Boolean);
    const allOut = inside.every((v) => !v);

    if (allIn) { out.push(e); keptCount++; continue; } // ganz innen → 1:1
    if (allOut) { droppedCount++; continue; }          // ganz aussen → weg

    // Kreuzt die Maske: in zusammenhaengende Innen-Laeufe zerlegen, an den
    // Vertices kappen und Gate-Knoten an jedem Uebertritt notieren.
    clippedCount++;
    let run: [number, number][] = [];
    const flush = () => {
      if (run.length >= 2) {
        out.push({ ...e, points: run, inNet: true });
      }
      run = [];
    };
    for (let i = 0; i < pts.length; i++) {
      if (inside[i]) {
        run.push(pts[i]);
        // Innen→Aussen-Uebertritt am Ende dieses Laufs?
        if (i + 1 < pts.length && !inside[i + 1]) {
          gates.push({ edgeId: e.id, inner: pts[i], outer: pts[i + 1] });
          flush();
        }
      } else {
        // Aussen→Innen-Uebertritt: Gate mit dem folgenden Innen-Vertex.
        if (i + 1 < pts.length && inside[i + 1]) {
          gates.push({ edgeId: e.id, inner: pts[i + 1], outer: pts[i] });
        }
      }
    }
    flush();
  }

  return { edges: out, gates, keptCount, clippedCount, droppedCount };
}

// ─── Anker: POI ↔ Netz (ann_074) ──────────────────────────────────────────────
// Jeder POI liegt nie exakt auf einem Pfad → das System legt einen Stich an.
// Hier nur die MESSUNG (nearest point on net + Distanz) + Klassifikation:
//   - außerhalb der Boundary           → 'outside' (Normalfall bei frei
//                                          gezeichneter finaler Boundary)
//   - Distanz < Snap-Schwelle          → 'on_path' (gilt als auf dem Pfad)
//   - Distanz ≥ Snap-Schwelle          → 'connected' (echter connected-POI-Stich)
// Materialisierung des Stichs (Phase 5) und Gate-Logik kommen später.

export interface PoiInput {
  text: string;
  lat: number;
  lng: number;
}

export type AnchorStatus = 'on_path' | 'connected' | 'outside';

export interface AnchorResult {
  text: string;
  poi: [number, number];          // [lat, lng]
  status: AnchorStatus;
  distanceMeters: number;          // NaN bei 'outside', Infinity wenn kein Netz
  snap: [number, number] | null;   // [lat, lng] naechster Punkt im Netz
}

export interface AnchorSummary {
  results: AnchorResult[];
  onPath: number;
  connected: number;
  outside: number;
}

// Ray-Casting Punkt-in-Polygon. ring ist Position[] = [lng, lat][].
function pointInRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat))
      && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Naechster Punkt auf den primaeren Kanten, lokal-planar projiziert (in Metern).
// Fuer Regions-Distanzen (< wenige km) ausreichend genau.
function nearestOnNet(lat: number, lng: number, edges: PathEdge[]): { dist: number; snap: [number, number] | null } {
  const mLat = 110540;
  const mLng = 111320 * Math.cos((lat * Math.PI) / 180);
  const px = lng * mLng, py = lat * mLat;
  let best = Infinity;
  let bestSnap: [number, number] | null = null;
  for (const e of edges) {
    if (!e.inNet) continue;
    for (let i = 0; i + 1 < e.points.length; i++) {
      const ax = e.points[i][1] * mLng, ay = e.points[i][0] * mLat;
      const bx = e.points[i + 1][1] * mLng, by = e.points[i + 1][0] * mLat;
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const sx = ax + t * dx, sy = ay + t * dy;
      const d = Math.hypot(px - sx, py - sy);
      if (d < best) {
        best = d;
        bestSnap = [sy / mLat, sx / mLng];
      }
    }
  }
  return { dist: best, snap: bestSnap };
}

export function anchorPois(
  pois: PoiInput[],
  result: PathFetchResult,
  snapThresholdMeters: number,
  boundary: Position[],
): AnchorSummary {
  const results: AnchorResult[] = pois.map((p) => {
    if (boundary.length >= 3 && !pointInRing(p.lng, p.lat, boundary)) {
      return { text: p.text, poi: [p.lat, p.lng] as [number, number], status: 'outside' as const, distanceMeters: NaN, snap: null };
    }
    const { dist, snap } = nearestOnNet(p.lat, p.lng, result.edges);
    const status: AnchorStatus = dist < snapThresholdMeters ? 'on_path' : 'connected';
    return { text: p.text, poi: [p.lat, p.lng] as [number, number], status, distanceMeters: dist, snap };
  });
  return {
    results,
    onPath: results.filter((r) => r.status === 'on_path').length,
    connected: results.filter((r) => r.status === 'connected').length,
    outside: results.filter((r) => r.status === 'outside').length,
  };
}
