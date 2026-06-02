// Sim-Uhr / Zeitraffer (Umbauplan #2 · S3) — der „Time-Turbo des 5-Min-Signals".
//
// Die Uhr läuft in 5-Min-(Sim-)Schritten = der Transmitter-Signaltakt. Der Turbo
// (Tempo) bestimmt, wie schnell diese Schritte in REALER Zeit fallen — so spielt
// der Tag im Zeitraffer ab. Der Slider hängt also HINTER dem 5-Min-Signal: er
// setzt die Sim-Zeit, aus der der Transmitter das Last-Signal bildet — er malt
// nicht direkt aufs Mesh.
//
// Singleton (läuft panel-unabhängig weiter); Subscriber (P06-Control, ScimMap)
// re-rendern bei jedem Schritt.

const MIN = 6, MAX = 20;
const STEP_SIM_MIN = 5;                 // 5-Min-Signal
const STEP_HOURS = STEP_SIM_MIN / 60;

let hour = 9.5;
let speed = 0;                          // Sim-Minuten je realer Sekunde (0 = Pause)
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const emit = () => listeners.forEach((l) => l());

export const SIM_CLOCK = { MIN, MAX, STEP_HOURS };

// ── reine, testbare Kerne ──
export function coerceSpeed(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : NaN;
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}
// Nächste Stunde nach einem 5-Min-Schritt — umlaufend (MAX → MIN).
export function nextHour(h: number): number {
  const n = h + STEP_HOURS;
  return n > MAX + 1e-9 ? MIN : n;
}

function stop() { if (timer != null) { clearTimeout(timer); timer = null; } }
function schedule() {
  if (speed <= 0) { stop(); return; }
  const ms = Math.max(16, (STEP_SIM_MIN / speed) * 1000); // 5 Sim-Min / Tempo → reale Sekunden
  timer = setTimeout(() => { hour = nextHour(hour); emit(); schedule(); }, ms);
}

export function getSimHour() { return hour; }
export function getSimSpeed() { return speed; }
export function setSimHour(h: number) { hour = clamp(h, MIN, MAX); emit(); }
export function setSimSpeed(s: number) { speed = coerceSpeed(s); stop(); schedule(); emit(); }
export function subscribeSimClock(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
