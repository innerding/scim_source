// Anthem-Producer — die EINE deterministische Pipeline, die aus einem Origin-Netz
// + einer (Sim-)Zeit einen AnthemSnapshot rechnet. Bewusst rein und ohne UI/DOM/
// Leaflet, damit BEIDE Seiten sie teilen: der Editor-Coder (P02) und der Worker
// (GET /api/anthem/:repId, „Worker rechnet selbst"). KEINE Code-Dopplung —
// Leitplanke „eine Quelle je Engine".
//
// Kette: simSegmentLoads (Sim-Telco) → normalizeLoads (deuten) → Tageskurve
// (5-Min-Atem) → buildAnthemSnapshot (packen). Maßgeblich: docs/anthem_snapshot_spec.md.

import type { AnthemSnapshot } from './packageContract';
import { simSegmentLoads, normalizeLoads, type NormalizeParams, type SegmentedNet } from './anthemSim';
import { buildAnthemSnapshot } from './anthemEncoder';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Tageskurve 6–20 h: die Last „atmet" mit der Sim-Zeit (0 nachts → 1 mittags).
// Deterministisch (kein Zufall) → Editor und Worker rechnen denselben Wert.
export function dayPhase(simMin: number): number {
  const h = Math.min(20, Math.max(6, simMin / 60));
  return Math.sin(((h - 6) / 14) * Math.PI);
}

// Die geteilte Produktion: gleiche Eingaben → bit-gleicher Snapshot, egal ob im
// Editor oder im Worker. `simMin` = (Sim-)Zeit in Minuten; `norm` optional
// (Thresholds-Parameter, sobald sie verdrahtet sind — heute Default).
export function produceAnthem(
  net: SegmentedNet,
  repId: string,
  simMin: number,
  norm: NormalizeParams = {},
): AnthemSnapshot {
  const base = normalizeLoads(simSegmentLoads(net), norm);
  const phase = dayPhase(simMin);
  const loads = base.map((l) => clamp01(l * (0.35 + 0.65 * phase)));
  return buildAnthemSnapshot(loads, repId, simMin);
}
