// Playbook-Sim — Kern (Umbauplan #2 · S2). Erzeugt die per-Segment-Last über die
// Tageszeit aus gerouteten OD-Flows. Rein + testbar; das Routing selbst
// (Bus→Attraktor via buildRoutePath → ODFlow.segmentIds) ist die Integration
// (S2b, in P06). „10 Pers/10 m = rot" → load = persons / personsForRed.

import type { ResampledNet, LatLng } from '../wegnetz/netResample';
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

// Sonntags-Tageskurve (Juni): ~0 vor 7:00, Anstieg ab 8:30, Plateau/Peak Mittag
// (~12–14), Abklang bis Abend. Liefert einen Faktor 0..1. Logistik-Anstieg ×
// Logistik-Abfall — glatt, kein Sprung.
export function arrivalCurve(hour: number): number {
  const rise = 1 / (1 + Math.exp(-(hour - 9) * 1.5));   // ~0 bei 7, ~0.5 bei 9, ~1 ab 11
  const fall = 1 / (1 + Math.exp((hour - 17) * 1.2));   // ~1 bis 15, ~0.5 bei 17, ~0 ab 19
  return clamp01(rise * fall);
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

export interface BuildFlowsOpts {
  intensityPerFlow?: number;  // Personen je Strom bei vollem Aufkommen
  tolMeters?: number;         // Pfad→Segment-Toleranz
  maxStraightMeters?: number; // Fallback-Grenze des Routers
}

export function buildFlows(
  edges: PathEdge[],
  net: ResampledNet,
  pois: CatalogPoi[],
  opts: BuildFlowsOpts = {},
): ODFlow[] {
  const intensity = opts.intensityPerFlow ?? 2;
  const tol = opts.tolMeters ?? 10;
  const toLatLng = (p: CatalogPoi): LatLng => [p.coord[1], p.coord[0]];
  const usable = pois.filter((p) => p.subcategory !== 'Cluster');
  const sources = usable.filter((p) => SOURCE_BUCKETS.has(p.bucket)).map(toLatLng);
  const attractors = usable.filter((p) => ATTRACTOR_BUCKETS.has(p.bucket)).map(toLatLng);
  if (sources.length === 0 || attractors.length === 0 || edges.length === 0) return [];

  const segs = netSegments(net);
  const flows: ODFlow[] = [];
  for (const a of sources) {
    for (const b of attractors) {
      const res = buildRoutePath(edges, a, b, [], { maxStraightMeters: opts.maxStraightMeters ?? 800 });
      if (!res || res.points.length < 2) continue;
      const ids = coveredSegmentIds(segs, res.points, tol);
      if (ids.length) flows.push({ segmentIds: ids, intensity });
    }
  }
  return flows;
}
