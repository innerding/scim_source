// Colorist — die eine Farbwahrheit: Last (0..1) → Farbe. `colour = G(load)`.
// Rein (kein Leaflet/DOM), damit Sim + Tests sie ohne UI nutzen können; der
// Colour-Mesh-Overlay UND der Inspector-Last-Layer teilen genau diese Funktion.
// Heat-pipe-Palette: navy → electric-blue → cyan-teal → lavender → magenta.

const HEAT_STOPS: Array<{ at: number; color: [number, number, number] }> = [
  { at: 0.00, color: [30, 58, 95] },     // #1e3a5f — deep navy
  { at: 0.25, color: [0, 153, 255] },    // #0099ff — electric blue
  { at: 0.50, color: [0, 212, 170] },    // #00d4aa — cyan-teal
  { at: 0.75, color: [192, 132, 252] },  // #c084fc — lavender
  { at: 1.00, color: [236, 72, 153] },   // #ec4899 — magenta
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function heatColor(t: number): string {
  const u = Math.max(0, Math.min(1, t));
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const a = HEAT_STOPS[i], b = HEAT_STOPS[i + 1];
    if (u <= b.at) {
      const f = (u - a.at) / (b.at - a.at || 1);
      return `rgb(${Math.round(lerp(a.color[0], b.color[0], f))},${Math.round(lerp(a.color[1], b.color[1], f))},${Math.round(lerp(a.color[2], b.color[2], f))})`;
    }
  }
  const last = HEAT_STOPS[HEAT_STOPS.length - 1].color;
  return `rgb(${last[0]},${last[1]},${last[2]})`;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Parametrisierter Colorist (Umbauplan A2). Beugt die Last STETIG vor dem
// Mappen auf die durchgehende heat-Palette — nie geschnitten/gebändert
// (§2a Regler-Grundsatz):
//   - spectrum  ∈ [0,1]: 0 = ruhig (langsam heiß) · 0.5 = linear · 1 = aggressiv
//                        (früh heiß). Realisiert als Gamma 2^(1−2·spectrum).
//   - bias      ∈ [−1,1]: regionale Tendenz, verschiebt die Skala kühler/heißer.
// Defaults (spectrum 0.5, bias 0) ⇒ identisch zu heatColor (rückwärtskompatibel).
export interface ColorizeParams {
  spectrum?: number;
  bias?: number;
}

// Beugt nur die Last (gibt 0..1 zurück) — getrennt von der Farbe, damit System-
// Normalisierung (A3) darauf aufsetzen kann.
export function shapeLoad(load: number, params: ColorizeParams = {}): number {
  const spectrum = params.spectrum ?? 0.5;
  const bias = params.bias ?? 0;
  const gamma = Math.pow(2, 1 - 2 * clamp01(spectrum));
  const v = Math.pow(clamp01(load), gamma);
  return clamp01(v + bias * 0.5);
}

export function colorize(load: number, params: ColorizeParams = {}): string {
  return heatColor(shapeLoad(load, params));
}
