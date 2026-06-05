// Anthem-Producer — packt die geteilte Last-Mathematik (shell-kit) in einen
// AnthemSnapshot (Worker-Format). Die Last-Kette selbst (simSegmentLoads →
// normalizeLoads → dayPhase) lebt in shell-kit/app/anthem — EINE Quelle für
// Editor-Coder (P02), Worker (GET /api/anthem/:repId) und Runtime. Hier bleibt
// nur das Snapshot-Encoding. Maßgeblich: docs/anthem_snapshot_spec.md.

import type { AnthemSnapshot } from './packageContract';
import { produceAnthemLoads, dayPhase, type NormalizeParams, type SegmentedNet } from 'shell-kit';
import { buildAnthemSnapshot } from './anthemEncoder';

// dayPhase bleibt über diesen Pfad erreichbar (bestehende Importeure).
export { dayPhase };

// Gleiche Eingaben → bit-gleicher Snapshot, egal ob Editor oder Worker.
// `simMin` = (Sim-)Zeit in Minuten; `norm` = Thresholds (spread/floor).
export function produceAnthem(
  net: SegmentedNet,
  repId: string,
  simMin: number,
  norm: NormalizeParams = {},
): AnthemSnapshot {
  return buildAnthemSnapshot(produceAnthemLoads(net, simMin, norm), repId, simMin);
}
