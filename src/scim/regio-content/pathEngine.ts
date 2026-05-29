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
