import type { FontModel, GlyphDef } from './types';

// renderText — verallgemeinert clockDigitSvg() (DurationClock.tsx) auf einen
// proportionalen Glyph-Lauf: reiht Mittellinien-Pfade mit x-Vorschub, ein
// Gewicht = stroke-width, currentColor, optional leicht geneigt (Kursiv).
// Reines Markup → wird wie clockDigitSvg per dangerouslySetInnerHTML gesetzt.
//
// Auslieferung später über die Shell als Glyph-DATEN (KEIN Webfont). Nur für
// sparsame UI-Texte gedacht; echter Text muss zur Barrierefreiheit in einer
// versteckten Schicht (aria-label/sr-only) mitlaufen — das ist Sache des Aufrufers.

export interface RenderOpts {
  /** stroke-width in User-Units. Default = schwerstes Gewicht der Schrift. */
  weight?: number;
  italic?: boolean;
  /** gerenderte Pixel-Höhe. Default = boxHeight (1 px = 1 User-Unit). */
  size?: number;
  /** CSS-Farbe. Default 'currentColor' (erbt die Themenfarbe). */
  color?: string;
  /** Hilfslinien (cap/x-Höhe/Grundlinie/…) einblenden — für den Editor. */
  showGuides?: boolean;
  guideColor?: string;
}

export interface RenderResult {
  /** vollständiges <svg>-Markup. */
  svg: string;
  width: number;
  height: number;
  /** Zeichen ohne Glyph (dedupliziert, in Reihenfolge des Auftretens). */
  missing: string[];
  /** Layout je Zeichen (User-Units), für klickbare Satz-Werkstatt. */
  layout: { ch: string; x: number; advance: number }[];
}

const DEG2RAD = Math.PI / 180;

export function resolveGlyph(model: FontModel, ch: string): GlyphDef | undefined {
  return model.glyphs[ch];
}

/** Default-Vorschub für noch nicht gezeichnete Zeichen (Platzhalter-Kästchen). */
function missingAdvance(model: FontModel): number {
  return Math.round(model.metrics.boxHeight * 0.45);
}

export function renderText(model: FontModel, text: string, opts: RenderOpts = {}): RenderResult {
  const m = model.metrics;
  const heaviest = model.weights.length ? model.weights[model.weights.length - 1].stroke : m.maxStroke;
  const weight = opts.weight ?? heaviest;
  const color = opts.color ?? 'currentColor';
  const size = opts.size ?? m.boxHeight;
  const skew = opts.italic ? model.italicSkewDeg : 0;

  const missing: string[] = [];
  const parts: string[] = [];
  const layout: { ch: string; x: number; advance: number }[] = [];
  let x = 0;

  for (const ch of text) {
    const g = resolveGlyph(model, ch);
    if (!g) {
      if (!missing.includes(ch) && ch !== '\n') missing.push(ch);
      const adv = missingAdvance(model);
      if (ch !== ' ') {
        parts.push(
          `<rect x="${x + 3}" y="${m.capY}" width="${adv - 6}" height="${m.baselineY - m.capY}" ` +
          `rx="3" fill="none" stroke="${opts.guideColor ?? '#cbd5e0'}" stroke-width="1" stroke-dasharray="3 3"/>`,
        );
      }
      layout.push({ ch, x, advance: adv });
      x += adv;
      continue;
    }
    // Satz-Werkstatt: Versatz (lead, x-Verschiebung im Slot) + Letter-Stretch
    // (stretchX, horizontale Skalierung um den Slot-Anfang). advance = Slot-Breite.
    const lead = g.lead ?? 0;
    const sx = g.stretchX ?? 1;
    const strokes = g.strokes ?? (g.d ? [{ d: g.d }] : []);
    for (const s of strokes) {
      if (!s.d) continue;
      const sw = weight * (s.w ?? 1);
      const tf = `translate(${x + lead},0)${sx !== 1 ? ` scale(${sx},1)` : ''}${s.transform ? ' ' + s.transform : ''}`;
      parts.push(`<path d="${s.d}" stroke-width="${sw}" transform="${tf}"/>`);
    }
    layout.push({ ch, x, advance: g.advance });
    x += g.advance;
  }

  const totalUnits = Math.max(x, 1);
  // Kursiv schert horizontal; Box links um die Scherbreite weiten, damit nichts clippt.
  const shear = skew ? Math.tan(skew * DEG2RAD) * m.boxHeight : 0;
  const vbW = totalUnits + shear;
  const scale = size / m.boxHeight;

  const guides = opts.showGuides ? buildGuides(model, vbW, opts.guideColor ?? '#e2a23b') : '';

  const skewT = skew ? ` skewX(-${skew})` : '';
  const group =
    `<g transform="translate(${shear},0)${skewT}" fill="none" stroke="${color}" ` +
    `stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round">${parts.join('')}</g>`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${m.boxHeight}" ` +
    `width="${Math.round(vbW * scale)}" height="${Math.round(size)}" ` +
    `preserveAspectRatio="xMinYMid meet">${guides}${group}</svg>`;

  return { svg, width: Math.round(vbW * scale), height: Math.round(size), missing, layout };
}

function buildGuides(model: FontModel, width: number, color: string): string {
  const m = model.metrics;
  const line = (y: number, dash: boolean) =>
    `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${color}" stroke-width="0.75" ` +
    `${dash ? 'stroke-dasharray="2 3" ' : ''}opacity="0.7"/>`;
  return (
    line(m.accentY, true) +
    line(m.capY, false) +
    line(m.xHeightY, true) +
    line(m.baselineY, false) +
    line(m.descenderY, true)
  );
}
