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
