// Digit-Glyphs (vorbereitend für ann_044 Elevation-Decoration).
// Eigene Asset-Klasse — getrennt von POI-Icons:
//   - viewBox 0 0 4 5 (deutlich kleiner als 48×48, hochformatig 5:4)
//   - Pure Strich-Glyphen ohne Container, ohne Decoration
//   - Zur Composite-Zeit (Phase D) skaliert der Renderer sie auf die in
//     ann_044 berechnete Ziffernreihen-Höhe.
//
// Quelle: data/digits/<deutscher-name>.svg (null, eins, …, neun).
// Werden zur Build-Zeit über Vite-Glob als Strings geladen.

const NAME_TO_DIGIT: Record<string, number> = {
  null: 0, eins: 1, zwei: 2, drei: 3, vier: 4,
  'fünf': 5, sechs: 6, sieben: 7, acht: 8, neun: 9,
};

const DIGIT_TO_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(NAME_TO_DIGIT).map(([k, v]) => [v, k]),
);

export interface DigitGlyph {
  digit: number;          // 0–9
  name: string;           // 'null', 'eins', 'fünf', …
  svg_raw: string;        // unveränderter SVG-Inhalt
}

const modules = import.meta.glob<string>('../../../data/digits/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function fileStem(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1].replace(/\.svg$/i, '');
}

function buildRegistry(): DigitGlyph[] {
  const entries: DigitGlyph[] = [];
  for (const [path, svgRaw] of Object.entries(modules)) {
    const name = fileStem(path);
    const digit = NAME_TO_DIGIT[name];
    if (digit === undefined) continue; // unbekannter Name → ignoriert
    entries.push({ digit, name, svg_raw: svgRaw });
  }
  // Numerisch sortiert 0 → 9
  entries.sort((a, b) => a.digit - b.digit);
  return entries;
}

export const DIGIT_GLYPHS: DigitGlyph[] = buildRegistry();

export function digitGlyph(d: number): DigitGlyph | undefined {
  return DIGIT_GLYPHS.find((g) => g.digit === d);
}

// Hilfen für Phase D: eine Zahl als Liste von Glyphen
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
  return DIGIT_TO_NAME[d];
}
