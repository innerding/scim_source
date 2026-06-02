// Playbook-Sim — Kern (Umbauplan #2 · S2). Erzeugt die per-Segment-Last über die
// Tageszeit aus gerouteten OD-Flows. Rein + testbar; das Routing selbst
// (Bus→Attraktor via buildRoutePath → ODFlow.segmentIds) ist die Integration
// (S2b, in P06). „10 Pers/10 m = rot" → load = persons / personsForRed.

import { distMeters, type ResampledNet, type LatLng } from '../wegnetz/netResample';
import { netSegments, coveredSegmentIds } from './netRoute';
import { buildRoutePath, type PathEdge } from '../regio-content/pathEngine';
import type { CatalogPoi } from '../poi-catalog/poiCatalog.types';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Ein gerouteter Strom (Bus→Attraktor): welche Segmente er nutzt + Basis-
// Intensität (Personen bei vollem Aufkommen).
export interface ODFlow {
  segmentIds: string[];
  intensity: number;
}

// Sonntags-Tageskurve (Juni). Zwei Schwünge: Vormittag 8:30–10:30 und um 14:00;
// dazwischen/sonst kaum was los, mit kleinem Grund-Aufkommen (alle ein bisschen
// verteilt). Stundentakt: Welle zur halben Stunde (Bus :30), Senke dazwischen.
export function arrivalCurve(hour: number): number {
  const g = (mu: number, sig: number) => Math.exp(-((hour - mu) ** 2) / (2 * sig * sig));
  const envelope =
    0.9 * g(9.5, 1.0)              // Vormittags-Schwung 8:30–10:30
    + 0.75 * g(14, 0.8)           // Nachmittags-Schwung um 14:00
    + (hour >= 7 && hour <= 19 ? 0.06 : 0); // schwaches Grund-Aufkommen tagsüber
  const ripple = (Math.cos(2 * Math.PI * (hour - 0.5)) + 1) / 2; // 1 bei :30, 0 bei :00
  const pulse = 0.35 + 0.65 * ripple;                            // Stundentakt
  return clamp01(envelope * pulse);
}

// Per-Segment-Last (0..1) zur Stunde `hour`, ausgerichtet auf die
// netSegments(net)-Reihenfolge (= Render-Reihenfolge). Jede Flow legt
// intensity·arrivalCurve(hour) Personen auf ihre Segmente; Summe / personsForRed
// → load. Segmente ohne Flow (POI-ferne Netzteile) bleiben 0 → kühl.
export function playbookLoad(
  net: ResampledNet,
  flows: ODFlow[],
  hour: number,
  opts: { personsForRed?: number } = {},
): number[] {
  const personsForRed = opts.personsForRed ?? 10;
  const a = arrivalCurve(hour);
  const persons = new Map<string, number>();
  for (const f of flows) {
    const p = f.intensity * a;
    for (const id of f.segmentIds) persons.set(id, (persons.get(id) ?? 0) + p);
  }
  return netSegments(net).map((s) => clamp01((persons.get(s.id) ?? 0) / personsForRed));
}

// ─── S2b: Flows routen (Modell-Treue, Integration) ───────────────────────────
// Bus-Stationen (Quelle) → Attraktor-POIs (gis/square/point) je Paar via
// buildRoutePath routen, mit coveredSegmentIds (S1) die genutzten Segmente
// sammeln → ODFlow. Verschiedene Routenlängen ergeben sich aus den verschieden
// weiten Attraktoren. POI-coord ist [lon,lat] → [lat,lng] drehen.

const SOURCE_BUCKETS = new Set(['Transport']);
const ATTRACTOR_BUCKETS = new Set(['Points', 'Squares']);
// Stark frequentierte Bus-Stationen (Namens-Fragmente, lowercase) — der Rest
// trägt nur schwach bei. Szenario-Default für Lichtenberg.
const STRONG_SOURCES_DEFAULT = ['lichtenberg', 'rohrbach', 'kirchschlag', 'eidenberg'];
// Trotz Namens-Treffer ganz schwach (überstimmt die starke Liste).
const WEAK_OVERRIDES_DEFAULT = ['haslinger', 'neulichtenberg'];

export interface BuildFlowsOpts {
  intensityPerFlow?: number;  // Personen je Strom bei vollem Aufkommen
  tolMeters?: number;         // Pfad→Segment-Toleranz
  maxStraightMeters?: number; // Fallback-Grenze des Routers
  strongSources?: string[];   // starke Quellen (Namens-Fragmente, lowercase)
  weakOverrides?: string[];   // trotz Treffer ganz schwach
  strongWeight?: number;      // Gewicht starker Quellen (Default 1)
  weakWeight?: number;        // Gewicht der übrigen (Default 0.3)
  veryWeakWeight?: number;    // Gewicht der Overrides (Default 0.1)
  maxHours?: number;          // max GESAMT-Gehzeit eines Besuchers (Default 6)
  speedKmh?: number;          // Gehgeschwindigkeit (Default 4)
  roundTrip?: boolean;        // Hin+Zurück (Default true)
}

export function buildFlows(
  edges: PathEdge[],
  net: ResampledNet,
  pois: CatalogPoi[],
  opts: BuildFlowsOpts = {},
): ODFlow[] {
  const intensity = opts.intensityPerFlow ?? 2;
  const tol = opts.tolMeters ?? 10;
  const strong = (opts.strongSources ?? STRONG_SOURCES_DEFAULT).map((s) => s.toLowerCase());
  const overrides = (opts.weakOverrides ?? WEAK_OVERRIDES_DEFAULT).map((s) => s.toLowerCase());
  const strongW = opts.strongWeight ?? 1;
  const weakW = opts.weakWeight ?? 0.3;
  const veryWeakW = opts.veryWeakWeight ?? 0.1;
  const speed = (opts.speedKmh ?? 4) * 1000;
  const oneWayMax = ((opts.maxHours ?? 6) / (opts.roundTrip === false ? 1 : 2)) * speed; // m

  const toLatLng = (p: CatalogPoi): LatLng => [p.coord[1], p.coord[0]];
  const usable = pois.filter((p) => p.subcategory !== 'Cluster');
  const sources = usable.filter((p) => SOURCE_BUCKETS.has(p.bucket)).map((p) => {
    const t = (p.text ?? '').toLowerCase();
    const weight = overrides.some((s) => t.includes(s)) ? veryWeakW
      : strong.some((s) => t.includes(s)) ? strongW
      : weakW;
    return { coord: toLatLng(p), weight };
  });
  const attractors = usable.filter((p) => ATTRACTOR_BUCKETS.has(p.bucket)).map(toLatLng);
  if (sources.length === 0 || attractors.length === 0 || edges.length === 0) return [];

  const segs = netSegments(net);
  const flows: ODFlow[] = [];
  for (const src of sources) {
    if (src.weight <= 0) continue;
    for (const b of attractors) {
      if (distMeters(src.coord, b) > oneWayMax) continue;                 // Luftlinie schon zu weit
      const res = buildRoutePath(edges, src.coord, b, [], { maxStraightMeters: opts.maxStraightMeters ?? 800 });
      if (!res || res.points.length < 2 || res.meters > oneWayMax) continue; // > Gehzeit-Budget → kein Besucher
      const ids = coveredSegmentIds(segs, res.points, tol);
      if (ids.length) flows.push({ segmentIds: ids, intensity: intensity * src.weight });
    }
  }
  return flows;
}

// ─── S4b: eine Testperson-Route (Bus→Attraktor) für den Comfort-Check ─────────
export interface TestRoute {
  path: LatLng[];
  segmentIds: string[];
  from: string;
  to: string;
}

// Würfelt (deterministisch über seed) eine Route von einer starken Bus-Station
// zu einem Attraktor und liefert Pfad + überdeckte Segmente.
export function pickTestRoute(edges: PathEdge[], net: ResampledNet, pois: CatalogPoi[], seed: number): TestRoute | null {
  const usable = pois.filter((p) => p.subcategory !== 'Cluster');
  const sources = usable.filter((p) => SOURCE_BUCKETS.has(p.bucket));
  const attractors = usable.filter((p) => ATTRACTOR_BUCKETS.has(p.bucket));
  if (sources.length === 0 || attractors.length === 0 || edges.length === 0) return null;

  const strongSrc = sources.find((p) =>
    STRONG_SOURCES_DEFAULT.some((s) => (p.text ?? '').toLowerCase().includes(s))) ?? sources[0];
  const attr = attractors[((seed % attractors.length) + attractors.length) % attractors.length];

  const a: LatLng = [strongSrc.coord[1], strongSrc.coord[0]];
  const b: LatLng = [attr.coord[1], attr.coord[0]];
  const res = buildRoutePath(edges, a, b, [], { maxStraightMeters: 1500 });
  if (!res || res.points.length < 2) return null;

  return {
    path: res.points as LatLng[],
    segmentIds: coveredSegmentIds(netSegments(net), res.points as LatLng[]),
    from: strongSrc.text ?? 'Bus',
    to: attr.text ?? 'Ziel',
  };
}

// S5: Ausweichroute — routet A→B auf dem Netz OHNE die zu meidenden Kanten
// (deren OSM-way-id in avoidEdgeIds). So weicht der Router den überschrittenen
// Strecken aus. null, wenn dadurch kein Pfad mehr existiert (unvermeidbar).
export function reroute(
  edges: PathEdge[],
  net: ResampledNet,
  a: LatLng,
  b: LatLng,
  avoidEdgeIds: Set<number>,
): { path: LatLng[]; segmentIds: string[] } | null {
  const reduced = edges.filter((e) => !avoidEdgeIds.has(e.id));
  const res = buildRoutePath(reduced, a, b, [], { maxStraightMeters: 1500 });
  if (!res || res.points.length < 2) return null;
  return { path: res.points as LatLng[], segmentIds: coveredSegmentIds(netSegments(net), res.points as LatLng[]) };
}
