// Test-Route-Store (Umbauplan #2 · S4b) — eine Testperson-Route + ihr
// Comfort-Befund, geteilt zwischen P09 Move (Button/Report) und ScimMap
// (Routing + Highlight). Singleton + Subscriber.
//
// Ablauf: P09-Button ruft requestTestRoute() (seed++). ScimMap (hat die Daten)
// routet auf seed-Wechsel, setzt route; im Render prüft es den Comfort zur
// Sim-Zeit und setzt comfort. P09 zeigt den Report.

import type { TestRoute } from './playbook';
import type { ComfortResult } from './netRoute';

export interface AltRoute { path: TestRoute['path']; segmentIds: string[]; }

let seed = 0;
let route: TestRoute | null = null;
let comfort: ComfortResult | null = null;
let alt: AltRoute | null = null;
let altComfort: ComfortResult | null = null;
// S6: Alternativroute — frei gewähltes Ziel (angeklicktes POI). destPoi ist der
// Wunsch (setzt der Karten-Klick), routeDest die gebaute Route + ihr Befund.
let destPoi: { coord: TestRoute['path'][number]; label: string } | null = null;
let routeDest: TestRoute | null = null;
let destComfort: ComfortResult | null = null;
let destAlt: AltRoute | null = null;
let destAltComfort: ComfortResult | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function requestTestRoute(): void { seed += 1; emit(); }
export function getTestSeed(): number { return seed; }
export function getTestRoute(): TestRoute | null { return route; }
export function getTestComfort(): ComfortResult | null { return comfort; }
export function getTestAlt(): AltRoute | null { return alt; }
export function getTestAltComfort(): ComfortResult | null { return altComfort; }

// S6: Ziel-Wunsch (Karten-Klick auf POI) + gebaute Alternativroute.
export function requestAltRoute(coord: TestRoute['path'][number], label: string): void {
  destPoi = { coord, label }; emit();
}
export function clearAltRoute(): void {
  destPoi = null; routeDest = null; destComfort = null; destAlt = null; destAltComfort = null; emit();
}
export function getDestPoi(): { coord: TestRoute['path'][number]; label: string } | null { return destPoi; }
export function getRouteDest(): TestRoute | null { return routeDest; }
export function getDestComfort(): ComfortResult | null { return destComfort; }
export function getDestAlt(): AltRoute | null { return destAlt; }
export function getDestAltComfort(): ComfortResult | null { return destAltComfort; }

export function setTestRoute(r: TestRoute | null): void {
  route = r; comfort = null; alt = null; altComfort = null; emit();
}
// Befund in einem Rutsch (ein Emit): Comfort der Route + ggf. Ausweichroute.
export function setTestBefund(c: ComfortResult | null, a: AltRoute | null, ac: ComfortResult | null): void {
  comfort = c; alt = a; altComfort = ac; emit();
}
// S6: Befund der Alternativroute (die gebaute Route + Comfort + ggf. Ausweich).
export function setDestBefund(
  r: TestRoute | null, c: ComfortResult | null, a: AltRoute | null, ac: ComfortResult | null,
): void {
  routeDest = r; destComfort = c; destAlt = a; destAltComfort = ac; emit();
}

export function subscribeTestRoute(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
