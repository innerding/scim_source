// Anthem-Encoder (Plan T · T4 / Umbauplan Phase 1) — das Gegenstück zum Origin-
// Manifest-Builder. Packt die normalisierte Last [0..1] je Segment in den
// AnthemSnapshot: Reihenfolge = Origin-Net-Segment-Index, OHNE Koordinaten.
// Die App mappt Index → Geometrie über das Origin-Netz. Reine Funktion.
// Maßgeblich: docs/anthem_snapshot_spec.md · src/scim/sensus/packageContract.ts.

import type { AnthemSnapshot } from './packageContract';

// Last [0..1] geklemmt + auf 2 Nachkommastellen gerundet (kompakt; das Wire-Format
// quantisiert später auf ~1 Byte/Segment).
export function buildAnthemSnapshot(loads: number[], repId: string, t: string): AnthemSnapshot {
  const rounded = loads.map((l) => Math.round(Math.max(0, Math.min(1, l)) * 100) / 100);
  return { kind: 'anthem_snapshot_v1', repId, t, loads: rounded };
}
