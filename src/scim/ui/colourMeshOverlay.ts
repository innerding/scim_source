// Colour-Mesh Overlay — Phase 1.5: Heat *entlang der Straßen* statt freier
// Heat-Wolke. Jede OSM-Edge bekommt eine pseudo-zufaellige Last und wird als
// Heat-Pipe gerendert (weisser Glow + farbige Hauptlinie). Zwischen POIs
// laufen smoothe Bezier-Routen (wenn >= 2 POIs vorhanden).
//
// Fake-Load = Summe gaussian-Bumps von synthetischen Hotspots + POI-Positionen.
// Spaeter (Phase 2): echte Telco-Load.

import L from 'leaflet';

// ─── Farbpalette: heat-pipe, kein gelber Sumpf ───────────────────────────────

const HEAT_STOPS: Array<{ at: number; color: [number, number, number] }> = [
  { at: 0.00, color: [30, 58, 95]    },  // #1e3a5f — deep navy
  { at: 0.25, color: [0, 153, 255]   },  // #0099ff — electric blue
  { at: 0.50, color: [0, 212, 170]   },  // #00d4aa — cyan-teal
  { at: 0.75, color: [192, 132, 252] },  // #c084fc — lavender
  { at: 1.00, color: [236, 72, 153]  },  // #ec4899 — magenta
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function heatColor(t: number): string {
  const u = Math.max(0, Math.min(1, t));
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const a = HEAT_STOPS[i], b = HEAT_STOPS[i + 1];
    if (u <= b.at) {
      const f = (u - a.at) / (b.at - a.at || 1);
      const r = Math.round(lerp(a.color[0], b.color[0], f));
      const g = Math.round(lerp(a.color[1], b.color[1], f));
      const bl = Math.round(lerp(a.color[2], b.color[2], f));
      return `rgb(${r},${g},${bl})`;
    }
  }
  const last = HEAT_STOPS[HEAT_STOPS.length - 1].color;
  return `rgb(${last[0]},${last[1]},${last[2]})`;
}

// ─── Pseudo-Random ───────────────────────────────────────────────────────────

function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Synthetische Hotspots + Load-Funktion ───────────────────────────────────

interface POI {
  poi_id: string;
  center: { coordinates: [number, number] }; // [lon, lat]
  name?: string;
}

interface Edge {
  edge_id: string;
  geometry: { coordinates: [number, number][] }; // [lon, lat] pairs
}

interface Hotspot {
  lat: number;
  lon: number;
  strength: number;  // 0..1 Peak
  sigma: number;     // Lat/Lon-Reichweite (Gauss-sigma)
}

function generateHotspots(
  bbox: [number, number, number, number],
  pois: POI[],
): Hotspot[] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const lonSpan = maxLon - minLon;
  const latSpan = maxLat - minLat;
  const rng = makeRng(42);
  const hotspots: Hotspot[] = [];

  // 4 synthetische Hotspots verteilt ueber bbox.
  for (let i = 0; i < 4; i++) {
    hotspots.push({
      lat: minLat + 0.18 * latSpan + rng() * 0.64 * latSpan,
      lon: minLon + 0.18 * lonSpan + rng() * 0.64 * lonSpan,
      strength: 0.65 + rng() * 0.35,
      sigma: 0.08 * Math.max(lonSpan, latSpan),
    });
  }
  // POIs werden ebenfalls Hotspots (etwas staerker).
  for (const p of pois) {
    hotspots.push({
      lat: p.center.coordinates[1],
      lon: p.center.coordinates[0],
      strength: 0.85,
      sigma: 0.05 * Math.max(lonSpan, latSpan),
    });
  }
  return hotspots;
}

function loadAt(lat: number, lon: number, hotspots: Hotspot[]): number {
  let total = 0;
  for (const h of hotspots) {
    const dLat = (lat - h.lat) / h.sigma;
    const dLon = (lon - h.lon) / h.sigma;
    const d2 = dLat * dLat + dLon * dLon;
    total = Math.max(total, h.strength * Math.exp(-d2));
  }
  return Math.min(1, total);
}

// ─── Synthetisches Wegenetz (Fallback wenn echter Graph dünn) ────────────────

// Wenn nur Mock-Daten vorhanden sind (3 Edges), generiert dies ein dichteres
// pseudo-OSM-Netz: N gestreute Knoten + k-NN-Verbindungen mit leichter Krümmung.
// Deterministisch (seed=7), damit das Bild zwischen Reloads stabil bleibt.
export function generateSyntheticEdges(
  bbox: [number, number, number, number],
  nodeCount: number = 32,
): Edge[] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const lonSpan = maxLon - minLon;
  const latSpan = maxLat - minLat;
  const rng = makeRng(7);

  const nodes: [number, number][] = [];
  for (let i = 0; i < nodeCount; i++) {
    const lat = minLat + (0.08 + rng() * 0.84) * latSpan;
    const lon = minLon + (0.08 + rng() * 0.84) * lonSpan;
    nodes.push([lon, lat]);
  }

  const edges: Edge[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const neighbors = nodes
      .map((p, j) => ({ j, d: j === i ? Infinity : (a[0] - p[0]) ** 2 + (a[1] - p[1]) ** 2 }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 2 + Math.floor(rng() * 2));   // 2..3 Nachbarn

    for (const { j } of neighbors) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const b = nodes[j];
      // Quadratic Bezier mit leichtem Versatz fuer organischen Look
      const midLon = (a[0] + b[0]) / 2;
      const midLat = (a[1] + b[1]) / 2;
      const dLat = b[1] - a[1], dLon = b[0] - a[0];
      const len = Math.hypot(dLat, dLon) || 1;
      const offset = (rng() - 0.5) * 0.15;
      const cLon = midLon + (-dLat / len) * len * offset;
      const cLat = midLat + (dLon / len) * len * offset;

      const coords: [number, number][] = [];
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const u = 1 - t;
        const lon = u * u * a[0] + 2 * u * t * cLon + t * t * b[0];
        const lat = u * u * a[1] + 2 * u * t * cLat + t * t * b[1];
        coords.push([lon, lat]);
      }

      edges.push({
        edge_id: `syn_${key}`,
        geometry: { coordinates: coords },
      });
    }
  }
  return edges;
}

// ─── Per-Edge-Gradient: Edge in K Segmente teilen, Heat pro Segment ──────────

function paintEdgeWithGradient(
  group: L.LayerGroup,
  latLngs: [number, number][],
  hotspots: Hotspot[],
  K: number = 6,
): void {
  if (latLngs.length < 2) return;

  // Kumulative Bogenlaenge fuer arc-length-Sampling
  const cum: number[] = [0];
  for (let i = 1; i < latLngs.length; i++) {
    const [aLat, aLon] = latLngs[i - 1];
    const [bLat, bLon] = latLngs[i];
    cum.push(cum[i - 1] + Math.hypot(bLat - aLat, bLon - aLon));
  }
  const total = cum[cum.length - 1];
  if (total === 0) return;

  const pointAt = (s: number): [number, number] => {
    if (s <= 0) return latLngs[0];
    if (s >= total) return latLngs[latLngs.length - 1];
    for (let i = 1; i < cum.length; i++) {
      if (s <= cum[i]) {
        const span = cum[i] - cum[i - 1] || 1;
        const f = (s - cum[i - 1]) / span;
        const [aLat, aLon] = latLngs[i - 1];
        const [bLat, bLon] = latLngs[i];
        return [aLat + (bLat - aLat) * f, aLon + (bLon - aLon) * f];
      }
    }
    return latLngs[latLngs.length - 1];
  };

  for (let i = 0; i < K; i++) {
    const s0 = (i / K) * total;
    const s1 = ((i + 1) / K) * total;
    const subSteps = 4;
    const pts: [number, number][] = [];
    for (let k = 0; k <= subSteps; k++) {
      pts.push(pointAt(s0 + (s1 - s0) * (k / subSteps)));
    }
    const mid = pointAt((s0 + s1) / 2);
    const t = loadAt(mid[0], mid[1], hotspots);
    const color = heatColor(t);

    // Glow
    L.polyline(pts, {
      color: '#ffffff',
      weight: 7,
      opacity: 0.38,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group);

    // Hauptlinie mit Heat-Farbe
    L.polyline(pts, {
      color,
      weight: 3.2,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group);
  }
}

// ─── Edge-Heat: jede Strasse bekommt eine Heat-Pipe ──────────────────────────

export function addRoadHeatMesh(
  group: L.LayerGroup,
  edges: Edge[],
  bbox: [number, number, number, number],
  pois: POI[],
): void {
  const hotspots = generateHotspots(bbox, pois);

  // Falls echter Graph duenn (z.B. Mock mit 3 Edges) — synthetisches Netz dazu.
  const allEdges: Edge[] = [];
  if (edges) allEdges.push(...edges);
  if (allEdges.length < 20) {
    allEdges.push(...generateSyntheticEdges(bbox));
  }

  for (const edge of allEdges) {
    const coords = edge.geometry.coordinates;
    if (!coords || coords.length < 2) continue;
    const latLngs: [number, number][] = coords.map(([lon, lat]) => [lat, lon]);
    paintEdgeWithGradient(group, latLngs, hotspots, 6);
  }
}

// ─── POI-zu-POI Routen (smooth Bezier) ───────────────────────────────────────

function distSq(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

export function buildPoiRoutes(pois: POI[], k: number = 3): Array<[POI, POI]> {
  const edges = new Set<string>();
  const result: Array<[POI, POI]> = [];
  for (let i = 0; i < pois.length; i++) {
    const a = pois[i];
    const neighbors = pois
      .map((p, j) => ({ p, j, d: j === i ? Infinity : distSq(a.center.coordinates, p.center.coordinates) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, k);
    for (const { p, j } of neighbors) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (edges.has(key)) continue;
      edges.add(key);
      result.push([a, p]);
    }
  }
  return result;
}

function bezierBetween(
  aLatLon: [number, number],
  bLatLon: [number, number],
  curveFactor: number = 0.18,
  steps: number = 24,
): [number, number][] {
  const [aLat, aLon] = aLatLon;
  const [bLat, bLon] = bLatLon;
  const mLat = (aLat + bLat) / 2;
  const mLon = (aLon + bLon) / 2;
  const dLat = bLat - aLat, dLon = bLon - aLon;
  const len = Math.hypot(dLat, dLon) || 1;
  const cLat = mLat + (-dLon / len) * len * curveFactor;
  const cLon = mLon + (dLat / len) * len * curveFactor;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const lat = u * u * aLat + 2 * u * t * cLat + t * t * bLat;
    const lon = u * u * aLon + 2 * u * t * cLon + t * t * bLon;
    pts.push([lat, lon]);
  }
  return pts;
}

export function addPoiRoutes(group: L.LayerGroup, pois: POI[]): void {
  // Braucht mindestens 2 POIs.
  if (pois.length < 2) return;
  const edges = buildPoiRoutes(pois, 3);

  for (const [a, b] of edges) {
    const aLatLon: [number, number] = [a.center.coordinates[1], a.center.coordinates[0]];
    const bLatLon: [number, number] = [b.center.coordinates[1], b.center.coordinates[0]];
    const curve = bezierBetween(aLatLon, bLatLon);

    // Glow breiter und weicher als die Strassen-Heat-Pipes
    L.polyline(curve, {
      color: '#ffffff',
      weight: 13,
      opacity: 0.42,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group);

    L.polyline(curve, {
      color: '#ec4899',  // Magenta-Akzent: POI-Routen sind die warmen Achsen
      weight: 4.8,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group);
  }
}

// ─── Echte OSM-Wege via Overpass-API ────────────────────────────────────────
//
// Holt highway-Wege innerhalb der bbox aus OSM. Antwort wird in localStorage
// gecached (24h pro bbox-Key). Cancelable beim Component-Unmount via Wrapper.

// Cache-Bump v2: enthaelt jetzt den Typen-Filter im Schluessel, damit ein
// Filterwechsel nicht alten Cache zieht. Alte v1-Eintraege liegen weiter
// im localStorage rum, schaden aber nicht.
const OSM_CACHE_KEY_PREFIX = 'scim3_osm_edges_v2';
const OSM_CACHE_TTL_MS = 24 * 3600 * 1000;

// Default-Whitelist (Wander-Profil), wenn der Aufrufer keine uebergibt.
const DEFAULT_HIGHWAY_TYPES: readonly string[] = [
  'primary', 'secondary', 'tertiary', 'unclassified', 'residential',
  'service', 'track', 'path', 'footway', 'cycleway',
];

interface OverpassWay {
  type: 'way';
  id: number;
  geometry?: Array<{ lat: number; lon: number }>;
}
interface OverpassResponse {
  elements?: Array<{ type: string; id: number; geometry?: Array<{ lat: number; lon: number }> }>;
}

// Sanitize Whitelist gegen einfache Overpass-Regex-Injektion — wir lassen
// nur Lower-Case-Buchstaben + Underscore zu (OSM-highway-Werte sehen so aus).
function sanitizeTypes(types: readonly string[] | undefined): string[] {
  const candidates = types && types.length > 0 ? types : DEFAULT_HIGHWAY_TYPES;
  const cleaned = candidates
    .map((t) => t.trim().toLowerCase())
    .filter((t) => /^[a-z_]+$/.test(t));
  // Dedup, stabil sortieren — gleiche Auswahl ergibt gleichen Cache-Key.
  return [...new Set(cleaned)].sort();
}

export async function fetchOsmEdges(
  bbox: [number, number, number, number],
  highwayTypes?: readonly string[],
): Promise<Edge[]> {
  const types = sanitizeTypes(highwayTypes);
  if (types.length === 0) return [];

  // Cache-Key enthaelt bbox + sortierte Typenliste (kurzes SHA-haftiges
  // join). Damit fuehrt jede Filteraenderung zu eigenem Cache-Slot — kein
  // stale-Result aus alter Auswahl.
  const typesKey = types.join('|');
  const cacheKey = `${OSM_CACHE_KEY_PREFIX}:${bbox.map((n) => n.toFixed(4)).join(',')}:${typesKey}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const { ts, edges } = JSON.parse(raw) as { ts: number; edges: Edge[] };
      if (Date.now() - ts < OSM_CACHE_TTL_MS && Array.isArray(edges) && edges.length) {
        return edges;
      }
    }
  } catch { /* ignore cache fehler */ }

  const [minLon, minLat, maxLon, maxLat] = bbox;
  const regexBody = types.join('|');
  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"^(${regexBody})$"]
        (${minLat},${minLon},${maxLat},${maxLon});
    );
    out geom;
  `.trim();

  const url = 'https://overpass-api.de/api/interpreter';
  const resp = await fetch(url, {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!resp.ok) throw new Error(`Overpass error: ${resp.status}`);
  const data = (await resp.json()) as OverpassResponse;

  const edges: Edge[] = (data.elements ?? [])
    .filter((e): e is OverpassWay => e.type === 'way' && Array.isArray(e.geometry))
    .map((e) => ({
      edge_id: `osm_${e.id}`,
      geometry: {
        coordinates: (e.geometry ?? []).map((g) => [g.lon, g.lat] as [number, number]),
      },
    }));

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), edges }));
  } catch { /* localStorage voll oder gesperrt — egal */ }

  return edges;
}

// ─── Base-Tile-URLs ──────────────────────────────────────────────────────────

export const TILE_OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_OSM_ATTR = '© OpenStreetMap contributors';

export const TILE_MESH_URL =
  'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
export const TILE_MESH_ATTR = '© OpenStreetMap contributors, © CARTO';
