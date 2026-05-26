// Decoration-System für POI-Composites (ann_044, Phase D + Glyph-Erweiterung).
//
// Eine Decoration ist ein Zusatzelement, das beim Rendering auf das
// Composite (Container + Icon) draufgesetzt wird. Bis zur Glyph-
// Erweiterung gab es nur 'elevation' (Hoehenmeter). Seit Einfuehrung
// des Glyph-Pools unter data/glyphs/ kennt das System mehrere
// Decoration-Arten — jede ist eine Kombination aus Zahl + Einheit:
//
//   kind        Beispiel        Einheits-Glyph   Position
//   elevation   "927 m"         meter            rechts
//   distance    "4 km"          kilometer        rechts (k+m)
//   anno        "A° 1702"       anno             links
//   grad        "22°"           grad             rechts
//   prozent     "12 %"          prozent          rechts
//   stars       "★★★★" oder "4★" — Sonderfall, Glyph wiederholt sich
//
// Welche Icons eine Decoration tragen koennen: in ICONS_META deklariert
// (Opt-in). Plus-Suffix im Icon-Namen (z.B. `aussichtspunkt+`) zwingt
// Decoration auch bei nicht-opted-in Icons.

export type DecorationKind = 'elevation' | 'distance' | 'anno' | 'grad' | 'prozent' | 'stars';

export interface IconMeta {
  decoration_below?: DecorationKind;
}

export const ICONS_META: Record<string, IconMeta> = {
  aussichtspunkt: { decoration_below: 'elevation' },
};

export function iconMeta(iconId: string): IconMeta {
  return ICONS_META[iconId] ?? {};
}

// ─── Erkannte Decoration ─────────────────────────────────────────────────────

export interface DecorationMatch {
  kind: DecorationKind;
  value: number;           // numerischer Wert (Hoehe, Jahr, Stern-Anzahl, …)
  digits: string;          // Zeichenkette die als Ziffern gerendert wird
  unit_glyph: string | null; // Glyph-ID in der GLYPHS-Registry; null bei Sternen
  unit_position: 'left' | 'right'; // wo die Einheit relativ zur Zahl steht
}

// Reihenfolge wichtig: spezifischere Muster zuerst. anno braucht den
// "A°"-Anker, ohne den der Pattern-Match fuer "1702" sonst von elevation
// oder anno-blind durchgehen wuerde.
//
// Wir suchen mit \b-Grenzen, damit "927m" und "927 m" beide treffen,
// aber "927mm" nicht.
const PATTERNS: Array<{
  kind: DecorationKind;
  re: RegExp;
  group_value: number;
  digits_from?: (m: RegExpMatchArray) => string;
  unit_glyph: string | null;
  unit_position: 'left' | 'right';
}> = [
  {
    kind: 'anno',
    // "A° 1702", "Aº 1857", "a° 1948", auch "A·1702" toleriert
    re: /\b[Aa][°·º]\s*(\d{3,4})\b/,
    group_value: 1,
    unit_glyph: 'anno',
    unit_position: 'left',
  },
  {
    kind: 'distance',
    // "4 km", "12 km" — Ganzzahlen, kein Dezimal (KISS bis spaeter)
    re: /\b(\d{1,3})\s*km\b/,
    group_value: 1,
    unit_glyph: 'kilometer',
    unit_position: 'right',
  },
  {
    kind: 'elevation',
    // "927 m", "1234 m", "9m" reicht NICHT (mind 2 Stellen)
    re: /\b(\d{2,5})\s*m\b/,
    group_value: 1,
    unit_glyph: 'meter',
    unit_position: 'right',
  },
  {
    kind: 'prozent',
    // "12 %", "12%"
    re: /\b(\d{1,3})\s*%/,
    group_value: 1,
    unit_glyph: 'prozent',
    unit_position: 'right',
  },
  {
    kind: 'grad',
    // "22°", "8 °" — muss NACH anno (sonst frisst grad das A° auf)
    re: /\b(\d{1,2})\s*°/,
    group_value: 1,
    unit_glyph: 'grad',
    unit_position: 'right',
  },
  {
    kind: 'stars',
    // "4★", "★★★★" (1–5 Sterne)
    re: /(\d)\s*★|(★+)/,
    group_value: 0, // wird unten speziell behandelt
    digits_from: (m) => {
      // entweder "4★" → "4", oder "★★★★" → Anzahl als String
      if (m[1]) return m[1];
      return String((m[2] ?? '').length);
    },
    unit_glyph: 'star-5',
    unit_position: 'right',
  },
];

export function extractDecoration(text: string): DecorationMatch | null {
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (!m) continue;
    let digits: string;
    let value: number;
    if (p.digits_from) {
      digits = p.digits_from(m);
      value = parseInt(digits, 10);
    } else {
      digits = m[p.group_value];
      value = parseInt(digits, 10);
    }
    if (!Number.isFinite(value)) continue;
    return {
      kind: p.kind,
      value,
      digits,
      unit_glyph: p.unit_glyph,
      unit_position: p.unit_position,
    };
  }
  return null;
}

// ─── Backward-Compat: alte extractElevation-API ──────────────────────────────
//
// Bestehende Callsites (Renderer) nutzen noch extractElevation(text) und
// erwarten number | null. Wir delegieren auf extractDecoration und liefern
// nur dann eine Zahl zurueck, wenn die erkannte Decoration auch wirklich
// 'elevation' ist (keine Vermischung mit anno/grad/…).
export function extractElevation(text: string): number | null {
  const d = extractDecoration(text);
  return d && d.kind === 'elevation' ? d.value : null;
}

// ─── Layout-Math (unveraendert) ──────────────────────────────────────────────

export interface SummitLayout {
  iconX: number; iconY: number; iconW: number; iconH: number;
  textX: number; textY: number; textW: number; textH: number;
  gap: number;
}

export function summitLayout(p: number, iconAspect = 2 / 3): SummitLayout {
  const W_i = 48 - 2 * p;
  const H_i = W_i * iconAspect;
  const gap = p / 2;
  const H_t = 48 - 5 * p / 2 - H_i;
  return {
    iconX: p, iconY: p, iconW: W_i, iconH: H_i,
    textX: p, textY: 48 - p - H_t, textW: W_i, textH: H_t,
    gap,
  };
}
