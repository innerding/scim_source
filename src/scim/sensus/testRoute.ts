// Test-Route-Store (Umbauplan #2 · S4b) — eine Testperson-Route + ihr
// Comfort-Befund, geteilt zwischen P09 Move (Button/Report) und ScimMap
// (Routing + Highlight). Singleton + Subscriber.
//
// Ablauf: P09-Button ruft requestTestRoute() (seed++). ScimMap (hat die Daten)
// routet auf seed-Wechsel, setzt route; im Render prüft es den Comfort zur
// Sim-Zeit und setzt comfort. P09 zeigt den Report.

import type { TestRoute } from './playbook';
import type { ComfortResult } from './netRoute';

let seed = 0;
let route: TestRoute | null = null;
let comfort: ComfortResult | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function requestTestRoute(): void { seed += 1; emit(); }
export function getTestSeed(): number { return seed; }
export function getTestRoute(): TestRoute | null { return route; }
export function getTestComfort(): ComfortResult | null { return comfort; }

export function setTestRoute(r: TestRoute | null): void { route = r; comfort = null; emit(); }
export function setTestComfort(c: ComfortResult | null): void { comfort = c; emit(); }

export function subscribeTestRoute(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
