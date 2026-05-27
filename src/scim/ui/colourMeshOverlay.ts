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

// ─── Edge-Heat: jede Strasse bekommt eine Heat-Pipe ──────────────────────────

export function addRoadHeatMesh(
  group: L.LayerGroup,
  edges: Edge[],
  bbox: [number, number, number, number],
  pois: POI[],
): void {
  if (!edges || edges.length === 0) return;
  const hotspots = generateHotspots(bbox, pois);

  for (const edge of edges) {
    const coords = edge.geometry.coordinates;
    if (!coords || coords.length < 2) continue;
    // LatLon-Reihe aus GeoJSON [lon,lat] -> Leaflet [lat,lon]
    const latLngs: [number, number][] = coords.map(([lon, lat]) => [lat, lon]);
    // Last am Mittelpunkt der Edge (genuegt fuer den Look)
    const mid = latLngs[Math.floor(latLngs.length / 2)];
    const t = loadAt(mid[0], mid[1], hotspots);
    const color = heatColor(t);

    // Glow: weiss, breiter, halbtransparent
    L.polyline(latLngs, {
      color: '#ffffff',
      weight: 7,
      opacity: 0.32 + 0.18 * t,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group);

    // Hauptlinie: heat color
    L.polyline(latLngs, {
      color,
      weight: 3.2,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group);
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

// ─── Base-Tile-URLs ──────────────────────────────────────────────────────────

export const TILE_OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_OSM_ATTR = '© OpenStreetMap contributors';

export const TILE_MESH_URL =
  'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
export const TILE_MESH_ATTR = '© OpenStreetMap contributors, © CARTO';
