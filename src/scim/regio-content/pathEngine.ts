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
  source: EdgeSource;    // Phase 3: nur 'primary' wird gerendert
  // Leaflet-fertige Punkte ([lat, lng]) entlang der Way-Geometrie.
  points: [number, number][];
  tags: Record<string, string>;
}

export interface PathFetchResult {
  edges: PathEdge[];        // gefiltert (primary) + Konnektor-Kandidaten
  primaryCount: number;
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
      edges.push({ id: way.id, highway, source: 'primary', points, tags });
    } else {
      // Strasse — Konnektor-Kandidat, in Phase 3 nur vorgehalten.
      edges.push({ id: way.id, highway, source: 'connector_candidate', points, tags });
    }
  }
  return edges;
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

  const edges = classify(ways, cfg);
  return {
    edges,
    primaryCount: edges.filter((e) => e.source === 'primary').length,
    rawWayCount: ways.length,
    bbox,
    fetchedAt: Date.now(),
  };
}
