// Playbook-Sim — Kern (Umbauplan #2 · S2). Erzeugt die per-Segment-Last über die
// Tageszeit aus gerouteten OD-Flows. Rein + testbar; das Routing selbst
// (Bus→Attraktor via buildRoutePath → ODFlow.segmentIds) ist die Integration
// (S2b, in P06). „10 Pers/10 m = rot" → load = persons / personsForRed.

import type { ResampledNet } from '../wegnetz/netResample';
import { netSegments } from './netRoute';

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
