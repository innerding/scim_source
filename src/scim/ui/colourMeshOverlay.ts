// Colour-Mesh Overlay — Phase 1: Fake-Load Heatmap + POI-zu-POI Routen mit Glow.
//
// Idee: Innerhalb der Geometry erzeugen wir ein heat-pipe-iges Mesh aus
// pseudo-zufaelligen Last-Punkten (Fake-Load, kein realer Bezug). Darauf
// werden POIs als Knoten gelegt; zwischen nahen POIs spannen wir geglaettete
// Routen mit zweilagigem Rendering (breite weisse Glow-Linie + farbige
// Hauptlinie). Heat- und Routen-Farben sprechen dieselbe Sprache.
//
// Spaeter (Phase 2): echte Load-Daten ersetzen Fake-Load, BCK/BAK navigiert
// auf den Routen.

import L from 'leaflet';
import 'leaflet.heat';

// Typen-Stub fuer leaflet.heat (kein offizielles @types-Paket).
type HeatPoint = [number, number, number]; // [lat, lon, intensity 0..1]
interface HeatLayerOptions {
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
  minOpacity?: number;
  gradient?: Record<number, string>;
}
type HeatLayer = L.Layer & { setLatLngs(points: HeatPoint[]): HeatLayer };
const heatLayer = (points: HeatPoint[], opts?: HeatLayerOptions): HeatLayer =>
  (L as unknown as { heatLayer: (p: HeatPoint[], o?: HeatLayerOptions) => HeatLayer })
    .heatLayer(points, opts);

// Heat-Gradient: heat-pipe-Look (cool blau -> magenta -> warm).
export const HEAT_GRADIENT: Record<number, string> = {
  0.0: '#1e3a5f',
  0.2: '#0099ff',
  0.4: '#00d4aa',
  0.6: '#ffd700',
  0.8: '#ff8c00',
  1.0: '#ff4e6e',
};

// Route-Farben aus dem Heat-Gradient, fuer visuelle Konsistenz.
const ROUTE_COLORS = ['#0099ff', '#00d4aa', '#ffd700', '#ff8c00', '#ff4e6e'];

interface POI {
  poi_id: string;
  center: { coordinates: [number, number] }; // [lon, lat]
  name?: string;
}

// ─── Fake-Load Heat-Punkte erzeugen ──────────────────────────────────────────

// Deterministisches Pseudo-Random (mulberry32), damit das Mesh stabil bleibt.
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateFakeHeatPoints(
  bbox: [number, number, number, number],
  pois: POI[],
  count: number = 600,
): HeatPoint[] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const lonSpan = maxLon - minLon;
  const latSpan = maxLat - minLat;
  const rng = makeRng(42);
  const points: HeatPoint[] = [];

  // 1) Streupunkte ueber bbox (Grundrauschen).
  for (let i = 0; i < count * 0.4; i++) {
    const lon = minLon + rng() * lonSpan;
    const lat = minLat + rng() * latSpan;
    const intensity = 0.15 + rng() * 0.35;
    points.push([lat, lon, intensity]);
  }

  // 2) Cluster-Punkte um POIs herum (Hotspots).
  for (const poi of pois) {
    const [plon, plat] = poi.center.coordinates;
    const cluster = 6 + Math.floor(rng() * 10);
    for (let i = 0; i < cluster; i++) {
      const r = 0.0008 + rng() * 0.0022;
      const angle = rng() * Math.PI * 2;
      const lon = plon + Math.cos(angle) * r;
      const lat = plat + Math.sin(angle) * r * 0.65;
      const intensity = 0.55 + rng() * 0.45;
      points.push([lat, lon, intensity]);
    }
  }

  return points;
}

export function addHeatLayer(
  group: L.LayerGroup,
  bbox: [number, number, number, number],
  pois: POI[],
): void {
  const points = generateFakeHeatPoints(bbox, pois);
  const layer = heatLayer(points, {
    radius: 28,
    blur: 38,
    maxZoom: 17,
    minOpacity: 0.35,
    gradient: HEAT_GRADIENT,
  });
  layer.addTo(group);
}

// ─── POI-zu-POI Routen mit Glow ──────────────────────────────────────────────

function distSq(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

// k-NN Routen-Graph: pro POI bis zu k naechste Nachbarn verbinden, Duplikate
// werden via "kleinerer-zuerst"-Konvention vermieden.
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

// Quadratische Bezier mit leichtem Versatz fuer die "smooth"-Optik.
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
  // Senkrechte (in Lat/Lon-Raum approximiert) zur Verbindungslinie
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
  if (pois.length < 2) return;
  const edges = buildPoiRoutes(pois, 3);

  let colorIdx = 0;
  for (const [a, b] of edges) {
    const aLatLon: [number, number] = [a.center.coordinates[1], a.center.coordinates[0]];
    const bLatLon: [number, number] = [b.center.coordinates[1], b.center.coordinates[0]];
    const curve = bezierBetween(aLatLon, bLatLon);

    // 1) Weisser Glow darunter (breiter, halbtransparent).
    L.polyline(curve, {
      color: '#ffffff',
      weight: 11,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group);

    // 2) Farbige Hauptlinie obendrauf.
    const color = ROUTE_COLORS[colorIdx % ROUTE_COLORS.length];
    colorIdx++;
    L.polyline(curve, {
      color,
      weight: 4.5,
      opacity: 0.92,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group);
  }
}

// ─── Base-Tile-Layer im Mesh-Modus: weniger Strassen ─────────────────────────
//
// Im Colour-Mesh-Modus tauschen wir die volle OSM-Kachel gegen eine
// reduziertere Variante (CartoDB Positron no-labels), damit das Mesh nicht
// vom Strassennetz konkurriert wird.

export const TILE_OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_OSM_ATTR = '© OpenStreetMap contributors';

export const TILE_MESH_URL =
  'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
export const TILE_MESH_ATTR =
  '© OpenStreetMap contributors, © CARTO';
