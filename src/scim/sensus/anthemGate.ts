// Anthem-Refresh-Gate (Shell-Engine, APP-SEITIG) — Request-Coalescing per Snapshot-Alter.
//
// Der Producer (Transmitter) re-encodet alle 5 Min; er weiß aber NICHTS von
// User-Interaktionen. Also drosselt sich die Ziel-App SELBST: nicht jede Interaktion
// (Karte bewegen, POI tippen, …) darf eine Snapshot-Anforderung auslösen. Eine neue
// Anforderung ist erst erlaubt, wenn der gehaltene Snapshot „stale" ist
// (Alter ≥ Schwelle). Ein Schwung Interaktionen wird so zu HÖCHSTENS EINER
// Anforderung pro Fenster zusammengefasst.
//
// Voraussetzung: die App kennt das ALTER des Snapshots — der Anthem-Snapshot trägt
// seine Erzeugungs-Zeit `t` (siehe packageContract.AnthemSnapshot). Alter = jetzt − t.
//
// Schwelle bewusst > 5.0 Min: der Producer arbeitet im 5-Min-Takt; fordert die App
// exakt bei 5.0 an, riskiert sie ein Rennen und bekommt evtl. denselben Snapshot.
// 5.1 Min Sicherheitsabstand → der nächste ist garantiert ein frischer.
export const ANTHEM_STALE_AFTER_MIN = 5.1;

export type GateState = {
  /** Erzeugungs-Zeit (Sim-Minuten) des aktuell gehaltenen Snapshots; null = noch keiner. */
  lastSnapshotMin: number | null;
};

export type GateReason = 'no-snapshot' | 'stale' | 'fresh';

export type GateDecision = {
  /** Darf jetzt eine Snapshot-Anforderung raus? */
  allowed: boolean;
  /** Alter des gehaltenen Snapshots in Min (null = keiner gehalten). */
  ageMin: number | null;
  /** Restzeit bis zur nächsten erlaubten Anforderung in Min (0 = jetzt). */
  nextEligibleInMin: number;
  reason: GateReason;
};

/**
 * Entscheidet, ob eine (durch eine beliebige User-Interaktion ausgelöste)
 * Snapshot-Anforderung durchgelassen oder geblockt wird. Reine Funktion.
 */
export function evaluateGate(state: GateState, nowMin: number): GateDecision {
  if (state.lastSnapshotMin == null) {
    // Noch kein Snapshot gehalten → der erste Bezug ist immer erlaubt.
    return { allowed: true, ageMin: null, nextEligibleInMin: 0, reason: 'no-snapshot' };
  }
  const ageMin = Math.max(0, nowMin - state.lastSnapshotMin);
  if (ageMin >= ANTHEM_STALE_AFTER_MIN) {
    return { allowed: true, ageMin, nextEligibleInMin: 0, reason: 'stale' };
  }
  return {
    allowed: false,
    ageMin,
    nextEligibleInMin: ANTHEM_STALE_AFTER_MIN - ageMin,
    reason: 'fresh',
  };
}
