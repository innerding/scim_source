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
