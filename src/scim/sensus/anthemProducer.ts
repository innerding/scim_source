// Anthem-Producer — packt die geteilte Last-Mathematik (shell-kit) in einen
// AnthemSnapshot (Worker-Format). Die Last-Kette selbst (simSegmentLoads →
// normalizeLoads → dayPhase) lebt in shell-kit/app/anthem — EINE Quelle für
// Editor-Coder (P02), Worker (GET /api/anthem/:repId) und Runtime. Hier bleibt
// nur das Snapshot-Encoding. Maßgeblich: docs/anthem_snapshot_spec.md.

import type { AnthemSnapshot } from './packageContract';
import { produceAnthemLoads, dayPhase, type SegmentedNet } from 'shell-kit';
import { buildAnthemSnapshot } from './anthemEncoder';

// dayPhase bleibt über diesen Pfad erreichbar (bestehende Importeure).
export { dayPhase };

// Gleiche Eingaben → bit-gleicher Snapshot, egal ob Editor oder Worker.
// `simMin` = (Sim-)Zeit in Minuten. Rohlast — keine spread/floor-Normalisierung
// mehr (Stufe 6: das Felder-/Grenzen-Modell färbt, nicht eine Vor-Normalisierung).
export function produceAnthem(
  net: SegmentedNet,
  repId: string,
  simMin: number,
): AnthemSnapshot {
  return buildAnthemSnapshot(produceAnthemLoads(net, simMin, {}), repId, simMin);
}
