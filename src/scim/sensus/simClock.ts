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
// Snapshot-Leiter: Basis 5-Min-Signal; bei Turbo gröber (bis Stundenschritte),
// damit die Render-Rate gedeckelt bleibt statt 5-Min-Schritte zu fluten.
const SNAPSHOT_LADDER_MIN = [5, 10, 20, 30, 60];
const MAX_RENDERS_PER_SEC = 8;

let hour = 9.5;
let speed = 0;                          // Sim-Minuten je realer Sekunde (0 = Pause)
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const emit = () => listeners.forEach((l) => l());

export const SIM_CLOCK = { MIN, MAX };

// ── reine, testbare Kerne ──
export function coerceSpeed(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : NaN;
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}
// Snapshot-Schritt (Sim-Min) zum Tempo: kleinster Leiter-Wert, bei dem die
// Render-Rate ≤ MAX_RENDERS_PER_SEC bleibt. Pause/lahm → 5 Min, Turbo → gröber.
export function snapshotMin(speed: number): number {
  if (speed <= 0) return SNAPSHOT_LADDER_MIN[0];
  const need = speed / MAX_RENDERS_PER_SEC;
  return SNAPSHOT_LADDER_MIN.find((m) => m >= need) ?? SNAPSHOT_LADDER_MIN[SNAPSHOT_LADDER_MIN.length - 1];
}
// Nächste Stunde nach einem Snapshot-Schritt — umlaufend (MAX → MIN).
export function nextHour(h: number, stepMin = 5): number {
  const n = h + stepMin / 60;
  return n > MAX + 1e-9 ? MIN : n;
}

function stop() { if (timer != null) { clearTimeout(timer); timer = null; } }
function schedule() {
  if (speed <= 0) { stop(); return; }
  const stepMin = snapshotMin(speed);
  const ms = Math.max(16, (stepMin / speed) * 1000); // Snapshot-Schritt / Tempo → reale Sekunden
  timer = setTimeout(() => { hour = nextHour(hour, stepMin); emit(); schedule(); }, ms);
}

export function getSimHour() { return hour; }
export function getSimSpeed() { return speed; }
export function setSimHour(h: number) { hour = clamp(h, MIN, MAX); emit(); }
export function setSimSpeed(s: number) { speed = coerceSpeed(s); stop(); schedule(); emit(); }
export function subscribeSimClock(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
