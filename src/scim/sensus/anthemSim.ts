// Anthem-Sim (Sim-Telco) — der erste Link der Anthem-Kette.
//
// Bis echtes Telco da ist, simuliert dies das volatile Load-Array: einen
// Last-Wert (0..1) je Segment des resampelten origin-net. Deterministisch
// (kein Math.random zur Laufzeit → stabil über Renders), glattes Raumfeld
// (Nachbarsegmente ähnlich → sieht aus wie echte Last, nicht wie Rauschen).
//
// load → Farbe ist die Colorist-Funktion `heatColor` (colour = G(load)),
// hier als `loadColour` re-exportiert: EINE Farbwahrheit für Inspector + Mesh.

import type { ResampledNet } from '../wegnetz/netResample';
export { heatColor as loadColour } from './loadColour';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Glattes, deterministisches Last-Feld am Segment-Mittelpunkt.
function fieldAt(lat: number, lng: number): number {
  const a = Math.sin(lat * 300) * Math.cos(lng * 300);   // Hauptmuster
  const b = Math.sin((lat - lng) * 220);                  // Diagonal-Schwebung
  return clamp01(0.5 + 0.5 * (0.6 * a + 0.4 * b));
}

// Ein Last-Wert (0..1) je Segment, in Strecken-/Segment-Reihenfolge des Netzes
// (dieselbe Reihenfolge, in der man die Segmente zeichnet/indexiert).
export function simSegmentLoads(net: ResampledNet): number[] {
  const loads: number[] = [];
  for (const s of net.stretches) {
    for (let i = 1; i < s.points.length; i++) {
      const a = s.points[i - 1], b = s.points[i];
      loads.push(fieldAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2));
    }
  }
  return loads;
}

export interface StretchLoad {
  id: string;          // Strecken-id '<edgeId>.<piece>'
  average: number;     // Ø-Last (0..1) zwischen den Kreuzungen
  segmentCount: number;
}

// Ø-Last je Strecke (zwischen Kreuzungsknoten). `loads` ist die flache
// Segment-Last-Liste in derselben Strecken-/Segment-Reihenfolge wie
// simSegmentLoads sie liefert (MUSS vom selben Netz stammen).
//
// Grundlage für Ausschluss/Degradierung (Umbauplan A1): die werden je STRECKE
// über diese Ø-Last entschieden — nur an Kreuzungen schaltbar —, während die
// Anzeige weiter pro Segment gefärbt wird.
export function stretchAverages(net: ResampledNet, loads: number[]): StretchLoad[] {
  const out: StretchLoad[] = [];
  let idx = 0;
  for (const s of net.stretches) {
    const segs = Math.max(0, s.points.length - 1);
    let sum = 0;
    for (let i = 0; i < segs; i++) sum += loads[idx++] ?? 0;
    out.push({ id: s.id, average: segs > 0 ? sum / segs : 0, segmentCount: segs });
  }
  return out;
}

export interface NormalizeParams {
  spread?: number;      // 0 = roh/absolut … 1 = voll relativ (min→kalt, max→heiß)
  floor?: number;       // Mindest-Rot: der Peak erreicht mind. floor (wenn Last da ist)
  minPartial?: number;  // unter diesem Peak gilt das Netz als ruhig → kein Mindest-Rot
}

// System-Normalisierung (Umbauplan A3). Macht die Anzeige aussagekräftig, ohne
// die Daten zu ändern (reine Darstellung):
//   - spread: blendet zwischen roher Last und min/max-Normalisierung. Bei voll
//     (1) spannt jede Rep blau→rot über ihren eigenen Bereich → „nicht alles
//     rot / nicht alles blau" und Reps werden vergleichbar (relativ, nicht
//     absolut — bewusster Trade-off).
//   - floor (Mindest-Rot): hat das Netz genug Last (Peak ≥ minPartial), wird die
//     Verteilung so angehoben, dass der Peak mindestens `floor` erreicht (etwas
//     Rot zeigt sich immer). Ein faktisch ruhiges Netz (Peak < minPartial)
//     bleibt kalt.
export function normalizeLoads(loads: number[], params: NormalizeParams = {}): number[] {
  if (loads.length === 0) return [];
  const spread = clamp01(params.spread ?? 0);
  const floor = clamp01(params.floor ?? 0);
  const minPartial = params.minPartial ?? 0.05;

  let min = Infinity, max = -Infinity;
  for (const l of loads) { if (l < min) min = l; if (l > max) max = l; }
  const range = max - min;

  const out = loads.map((l) => {
    const norm = range > 0 ? (l - min) / range : l;
    return clamp01(l + (norm - l) * spread);
  });

  if (floor > 0 && max >= minPartial) {
    let curMax = 0;
    for (const v of out) if (v > curMax) curMax = v;
    if (curMax > 0 && curMax < floor) {
      const lift = floor / curMax;
      return out.map((v) => clamp01(v * lift));
    }
  }
  return out;
}

export type StretchState = 'normal' | 'degraded' | 'excluded';

export interface ClassifiedStretch {
  id: string;
  average: number;
  state: StretchState;
}

export interface ClassifyParams {
  degradier?: number;   // Operator: ab dieser Ø-Last → 'degraded' (visuell entdrängt)
  ausschluss?: number;  // User: ab dieser Ø-Last → 'excluded' (farblos neutralisiert)
}

// Klassifiziert je STRECKE über die Ø-Last (Umbauplan A4). Crossing-gated, weil
// die Eingabe (stretchAverages) schon je Kreuzung→Kreuzung gemittelt ist — nur
// ganze Strecken werden degradiert/ausgeschlossen, nie einzelne Segmente.
// Ausschluss schlägt Degradierung. Undefinierte Schwelle = Stufe aus.
// Wichtig (§2a): das ist die ENTSCHEIDUNG, nicht der Gradient — der bleibt stetig.
export function classifyStretches(stretches: StretchLoad[], params: ClassifyParams = {}): ClassifiedStretch[] {
  const deg = params.degradier;
  const exc = params.ausschluss;
  return stretches.map((s) => {
    let state: StretchState = 'normal';
    if (exc != null && s.average >= exc) state = 'excluded';
    else if (deg != null && s.average >= deg) state = 'degraded';
    return { id: s.id, average: s.average, state };
  });
}
