// OSM-Edge-Fetch + Base-Tile-URLs für die Editor-Karte.
// (Das alte Heat-entlang-Strassen-Overlay inkl. heatColor/synthetische Edges/
//  POI-Routen wurde ausgemustert — Stufe 6. Hier bleibt nur das OSM-Wege-Laden.)

interface Edge {
  edge_id: string;
  geometry: { coordinates: [number, number][] }; // [lon, lat] pairs
}

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

  // Cache begrenzen: nur die neuesten paar Einträge behalten, alte v1-Generation
  // ganz weg. Verhindert, dass jeder Filter-Toggle ~700 KB anhäuft und den
  // localStorage zustopft (war die Ursache, dass Draft-Speichern scheiterte).
  pruneOsmEdgeCache(3);
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), edges }));
  } catch { /* localStorage voll oder gesperrt — egal, Cache ist optional */ }

  return edges;
}

// Behält die neuesten `keep` v2-Einträge (nach ts), löscht den Rest + alle v1.
function pruneOsmEdgeCache(keep: number): void {
  try {
    const v2: { key: string; ts: number }[] = [];
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('scim3_osm_edges_v1')) { stale.push(k); continue; }
      if (k.startsWith(OSM_CACHE_KEY_PREFIX)) {
        let ts = 0;
        try { ts = (JSON.parse(localStorage.getItem(k) || '{}') as { ts?: number }).ts ?? 0; } catch { /* ignore */ }
        v2.push({ key: k, ts });
      }
    }
    v2.sort((a, b) => b.ts - a.ts);
    for (const { key } of v2.slice(keep)) stale.push(key);
    for (const k of stale) localStorage.removeItem(k);
  } catch { /* ignore */ }
}

// ─── Base-Tile-URLs ──────────────────────────────────────────────────────────

export const TILE_OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_OSM_ATTR = '© OpenStreetMap contributors';

export const TILE_MESH_URL =
  'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
export const TILE_MESH_ATTR = '© OpenStreetMap contributors, © CARTO';
