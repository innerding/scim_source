// Anthem-Refresh-Gate (Shell-Engine, APP-SEITIG) — fristbasierte Selbst-Drosselung.
//
// Der Producer (Transmitter) re-encodet in einem festen Raster; er weiß aber NICHTS
// von User-Interaktionen. Also drosselt sich die Ziel-App SELBST — und zwar NICHT
// über geschätzte verstrichene Zeit, sondern über die ANGEKÜNDIGTE Nachfolge-Zeit
// des gehaltenen Snapshots: `snapshot.nextAtMin`. Der Consumer liest die Ansage und
// fordert erst ab `nextAtMin + Gap` einen neuen an. Bis dahin sind alle Interaktionen
// (Karte bewegen, POI tippen, …) zu KEINER Anforderung gebündelt.
//
// Warum nextAt statt Alter-seit-Bezug? Der Snapshot, den wir bekommen, ist evtl.
// schon mitten in seinem Fenster erzeugt — sein `tMin` liegt vor „jetzt". Würden wir
// ab Empfang eine feste Spanne zählen, hielten wir Daten bis ~2× Periode. Indem wir
// an `nextAtMin` (Producer-Raster) hängen, treffen wir jedes neue Fenster genau
// einmal und die Stale-Zeit bleibt eng (≈ 1 Periode + Gap).
//
// Der Gap (klein) deckt das Publish-Rennen: erst kurz NACH der angekündigten Zeit
// ist der neue Snapshot sicher bereit.
export const ANTHEM_REFRESH_GAP_MIN = 0.1;

export type HeldSnapshot = {
  /** Erzeugungs-Zeit des gehaltenen Snapshots (Sim-Min). */
  tMin: number;
  /** Vom Snapshot ANGEKÜNDIGTE Zeit des nächsten (Sim-Min). */
  nextAtMin: number;
};

export type GateState = {
  /** Aktuell gehaltener Snapshot; null = noch keiner bezogen. */
  held: HeldSnapshot | null;
};

export type GateReason = 'no-snapshot' | 'valid' | 'expired';

export type GateDecision = {
  /** Darf jetzt eine Snapshot-Anforderung raus? */
  allowed: boolean;
  /** Alter des gehaltenen Snapshots in Min (null = keiner gehalten). */
  ageMin: number | null;
  /** Frist bis zur nächsten erlaubten Anforderung in Min (0 = jetzt). */
  dueInMin: number;
  reason: GateReason;
};

/**
 * Entscheidet, ob eine (durch eine beliebige User-Interaktion ausgelöste)
 * Snapshot-Anforderung durchgelassen oder geblockt wird — anhand der vom Snapshot
 * angekündigten `nextAtMin` (+ Gap). Reine Funktion.
 */
export function evaluateGate(state: GateState, nowMin: number): GateDecision {
  if (state.held == null) {
    // Noch kein Snapshot gehalten → der erste Bezug ist immer erlaubt.
    return { allowed: true, ageMin: null, dueInMin: 0, reason: 'no-snapshot' };
  }
  const ageMin = Math.max(0, nowMin - state.held.tMin);
  const dueAt = state.held.nextAtMin + ANTHEM_REFRESH_GAP_MIN;
  if (nowMin >= dueAt) {
    return { allowed: true, ageMin, dueInMin: 0, reason: 'expired' };
  }
  return { allowed: false, ageMin, dueInMin: dueAt - nowMin, reason: 'valid' };
}
