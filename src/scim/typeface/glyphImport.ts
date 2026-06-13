import type { GlyphStroke } from './types';

// Glyph-Import — eine aus Illustrator exportierte SVG in einen GlyphDef wandeln.
// BROWSER-ONLY (nutzt DOMParser + getCTM); wird aus dem Panel aufgerufen, nicht
// aus dem node-testbaren Kern. Behandelt mehrere Layer (= mehrere <path>) und
// Gruppen/Transforms: die zusammengesetzte Matrix wird vom Browser via getCTM
// gerechnet und als transform am Teil-Strich mitgeführt (kein eigenes Matrix-
// Geraffel, exakt). Strichstärken werden NICHT absolut übernommen, sondern als
// Faktor relativ zum dicksten Layer (= Basis, w = 1).

export interface ImportedGlyph {
  advance: number;
  /** Box-Höhe laut viewBox der Quelle (zum Abgleich mit der Schrift-Box). */
  boxHeightSeen: number;
  strokes: GlyphStroke[];
  /** nicht-blockierende Hinweise (Versatz, Höhen-Abweichung, Fremd-Elemente). */
  warnings: string[];
}

// Dateiname → Glyph-Schlüssel. ASCII-Token für Zeichen, die man nicht tippen will.
const FILENAME_TOKENS: Record<string, string> = {
  Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', auml: 'ä', ouml: 'ö', uuml: 'ü',
  sz: 'ß', comma: ',', period: '.', dot: '.', at: '@',
  degree: '°', approx: '≈', hat: '^', macron: '¯',
  hyphen: '-', slash: '/', colon: ':', semicolon: ';',
  exclaim: '!', question: '?', lparen: '(', rparen: ')',
};

export function keyFromFilename(name: string): string {
  const base = name.replace(/\.svg$/i, '');
  return FILENAME_TOKENS[base] ?? base;
}

const isIdentity = (m: DOMMatrix): boolean =>
  m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1 && m.e === 0 && m.f === 0;

export function parseGlyphSvg(svgText: string, boxHeight: number): ImportedGlyph {
  const warnings: string[] = [];
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('SVG nicht lesbar (parsererror).');
  const srcSvg = doc.querySelector('svg');
  if (!srcSvg) throw new Error('Keine <svg>-Wurzel gefunden.');

  // viewBox → advance + Höhe; Versatz/Abweichung melden (nicht blockieren).
  let advance = 0, hSeen = boxHeight;
  const vb = (srcSvg.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
  if (vb.length === 4 && vb.every((n) => !Number.isNaN(n))) {
    const [minx, miny, w, hh] = vb;
    advance = Math.round(w);
    hSeen = hh;
    if (minx !== 0 || miny !== 0) warnings.push(`viewBox-Versatz (${minx} ${miny}) — sollte „0 0 …" sein.`);
    if (Math.abs(hh - boxHeight) > 0.5) warnings.push(`Box-Höhe ${hh} ≠ Schrift-Box ${boxHeight} — Glyph fluchtet evtl. nicht.`);
  } else {
    warnings.push('Keine/ungültige viewBox — advance und Höhe unbekannt.');
  }

  // Fremd-Elemente melden (nur <path> wird übernommen).
  const allowed = new Set(['svg', 'g', 'path', 'title', 'desc', 'defs', 'metadata']);
  const foreign = [...new Set(
    [...srcSvg.querySelectorAll('*')]
      .map((el) => el.tagName.toLowerCase())
      .filter((t) => !allowed.has(t)),
  )];
  if (foreign.length) warnings.push(`Nicht-Pfad-Elemente ignoriert: ${foreign.join(', ')}.`);

  // In den lebenden DOM hängen, damit getCTM die Gruppen-/Pfad-Transforms liefert.
  const host = document.createElement('div');
  host.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden;opacity:0;');
  const live = document.importNode(srcSvg, true) as SVGSVGElement;
  host.appendChild(live);
  document.body.appendChild(host);
  try {
    const paths = [...live.querySelectorAll('path')];
    if (!paths.length) throw new Error('Keine <path>-Elemente in der SVG.');

    const raw = paths.map((p) => {
      const d = p.getAttribute('d') || '';
      const swAttr = p.getAttribute('stroke-width') || p.style.strokeWidth || '1';
      const sw = parseFloat(String(swAttr)) || 1;
      const m = (p as SVGGraphicsElement).getCTM();
      const transform = m && !isIdentity(m)
        ? `matrix(${+m.a.toFixed(5)},${+m.b.toFixed(5)},${+m.c.toFixed(5)},${+m.d.toFixed(5)},${+m.e.toFixed(3)},${+m.f.toFixed(3)})`
        : undefined;
      return { d, sw, transform };
    });

    // Basis = dickster Layer (w = 1); dünnere bekommen Faktor < 1.
    const base = Math.max(...raw.map((r) => r.sw));
    const strokes: GlyphStroke[] = raw.map((r) => {
      const w = base > 0 ? Math.round((r.sw / base) * 100) / 100 : 1;
      return {
        d: r.d,
        ...(Math.abs(w - 1) > 1e-6 ? { w } : {}),
        ...(r.transform ? { transform: r.transform } : {}),
      };
    });

    if (strokes.length > 1) {
      const factors = strokes.map((s) => s.w ?? 1);
      warnings.push(`${strokes.length} Layer · Gewichts-Faktoren ${factors.map((f) => f.toFixed(2)).join(' · ')} (dickster = Basis).`);
    }

    return { advance, boxHeightSeen: hSeen, strokes, warnings };
  } finally {
    document.body.removeChild(host);
  }
}
