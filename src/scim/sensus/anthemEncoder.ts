// Anthem-Encoder (Plan T · T4 / Umbauplan Phase 1) — das Gegenstück zum Origin-
// Manifest-Builder. Packt die normalisierte Last [0..1] je Segment in den
// AnthemSnapshot: Reihenfolge = Origin-Net-Segment-Index, OHNE Koordinaten.
// Die App mappt Index → Geometrie über das Origin-Netz. Reine Funktion.
// Maßgeblich: docs/anthem_snapshot_spec.md · src/scim/sensus/packageContract.ts.

import type { AnthemSnapshot } from './packageContract';
import { ANTHEM_PERIOD_MIN } from './packageContract';

// HH:MM aus (Sim-)Minuten, fürs Anzeige-Feld `t`.
function clockLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} · Sim`;
}

// Der Snapshot kündigt seine Nachfolge an: `tMin` aufs Producer-Raster gelegt,
// dann + ein Takt. So weiß der Consumer ohne Raten, wann der nächste fällig ist.
export function nextAtFor(tMin: number): number {
  return Math.floor(tMin / ANTHEM_PERIOD_MIN) * ANTHEM_PERIOD_MIN + ANTHEM_PERIOD_MIN;
}

// Last [0..1] geklemmt + auf 2 Nachkommastellen gerundet (kompakt; das Wire-Format
// quantisiert später auf ~1 Byte/Segment). `tMin` = Erzeugungs-Zeit in Min.
export function buildAnthemSnapshot(loads: number[], repId: string, tMin: number): AnthemSnapshot {
  const rounded = loads.map((l) => Math.round(Math.max(0, Math.min(1, l)) * 100) / 100);
  return {
    kind: 'anthem_snapshot_v1',
    repId,
    t: clockLabel(tMin),
    tMin,
    nextAtMin: nextAtFor(tMin),
    loads: rounded,
  };
}
