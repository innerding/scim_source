// Reveal-Prep-Trigger (P07) — winziger Pub/Sub-Store wie testRoute. Der P07-
// Button ruft playReveal(); die ScimMap (Inspector) hört darauf und spielt die
// Boundary-Reveal-Animation. Reiner Auslöser, kein Zustand außer Zähler.

let token = 0;
const listeners = new Set<() => void>();

export function playReveal(): void { token += 1; listeners.forEach((l) => l()); }
export function getRevealToken(): number { return token; }
export function subscribeReveal(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
