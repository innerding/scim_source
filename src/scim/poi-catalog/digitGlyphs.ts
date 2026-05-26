// Glyph-Registry — gemeinsamer Asset-Pool unter data/glyphs/.
//
// Frueher hiess das Modul digitGlyphs.ts und lud nur 0–9 aus data/digits/.
// Ab Phase „Decoration-Erweiterung" (m, km, A°, %, °, Sterne, Frame) liegt
// alles unter data/glyphs/. Datei-Name bleibt voruebergehend digitGlyphs.ts,
// damit bestehende Imports nicht brechen — Rename in eigenem Schritt.
//
// Glyph-Klassen:
//   - Ziffern 0–9 (viewBox 0 0 4 5) — deutsche Datei-Namen (null, eins, …)
//   - Einheits-Glyphen (meter, kilometer, anno, grad, prozent)
//   - Stern-Glyphen (star-5, star-6) — Hotel-Klasse / Genealogie
//   - Operator-Glyphen (plus, circa, und)
//   - Frame — Zifferncontainer-Huelle (viewBox 0 0 8 9, parametrisch breitenskaliert)
//
// Alle Glyphen sind reine Strich-/Pfad-Assets ohne Container, ohne Decoration.
// Composite-Zeit-Skalierung passiert im Renderer.

const DIGIT_NAME_TO_NUMBER: Record<string, number> = {
  null: 0, eins: 1, zwei: 2, drei: 3, vier: 4,
  'fünf': 5, sechs: 6, sieben: 7, acht: 8, neun: 9,
};

const DIGIT_NUMBER_TO_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(DIGIT_NAME_TO_NUMBER).map(([k, v]) => [v, k]),
);

export type GlyphKind = 'digit' | 'unit' | 'star' | 'operator' | 'frame';

export interface Glyph {
  id: string;             // Dateistamm: 'null', 'eins', 'meter', 'anno', 'frame', …
  kind: GlyphKind;
  digit?: number;         // nur bei kind='digit'
  svg_raw: string;
}

// Klassifizierung anhand des Dateinamens.
function classify(id: string): { kind: GlyphKind; digit?: number } {
  if (id in DIGIT_NAME_TO_NUMBER) return { kind: 'digit', digit: DIGIT_NAME_TO_NUMBER[id] };
  if (id === 'frame') return { kind: 'frame' };
  if (id === 'star-5' || id === 'star-6') return { kind: 'star' };
  if (id === 'plus' || id === 'circa' || id === 'und') return { kind: 'operator' };
  // Default: Einheits-Glyph (meter, kilometer, anno, grad, prozent, …)
  return { kind: 'unit' };
}

const modules = import.meta.glob<string>('../../../data/glyphs/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function fileStem(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1].replace(/\.svg$/i, '');
}

function buildRegistry(): Glyph[] {
  const entries: Glyph[] = [];
  for (const [path, svgRaw] of Object.entries(modules)) {
    const id = fileStem(path);
    const { kind, digit } = classify(id);
    entries.push({ id, kind, digit, svg_raw: svgRaw });
  }
  // Sortierung: Ziffern numerisch zuerst, dann alphabetisch
  entries.sort((a, b) => {
    if (a.kind === 'digit' && b.kind === 'digit') return (a.digit ?? 0) - (b.digit ?? 0);
    if (a.kind === 'digit') return -1;
    if (b.kind === 'digit') return 1;
    return a.id.localeCompare(b.id);
  });
  return entries;
}

export const GLYPHS: Glyph[] = buildRegistry();

export function glyphById(id: string): Glyph | undefined {
  return GLYPHS.find((g) => g.id === id);
}

// ─── Backward-Compat: digit-spezifische API ────────────────────────────────

export interface DigitGlyph {
  digit: number;
  name: string;
  svg_raw: string;
}

export const DIGIT_GLYPHS: DigitGlyph[] = GLYPHS
  .filter((g): g is Glyph & { digit: number } => g.kind === 'digit' && g.digit !== undefined)
  .map((g) => ({ digit: g.digit, name: g.id, svg_raw: g.svg_raw }));

export function digitGlyph(d: number): DigitGlyph | undefined {
  return DIGIT_GLYPHS.find((g) => g.digit === d);
}

export function glyphsForNumber(n: number): DigitGlyph[] {
  const str = String(Math.trunc(Math.abs(n)));
  const result: DigitGlyph[] = [];
  for (const ch of str) {
    const g = digitGlyph(parseInt(ch, 10));
    if (g) result.push(g);
  }
  return result;
}

export function nameForDigit(d: number): string | undefined {
  return DIGIT_NUMBER_TO_NAME[d];
}
