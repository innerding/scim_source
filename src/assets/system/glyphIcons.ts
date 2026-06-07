// Glyph-Icon-Set — wandelt die Unicode-Tab-Glyphen in dieselbe strichbasierte SVG-
// Sprache wie die Panel-/Control-Icons um. Keyed nach dem Glyph-Zeichen selbst, damit
// JEDER Tab, der diesen Glyph nutzt, automatisch das SVG bekommt. Aufgelöst von
// <PanelIcon> nach (id → sys:token →) Glyph. Teil des System-Icons-Sets.

const wrap = (inner: string): string =>
  `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const DOT = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" stroke="none"/>`;
const BOX = '<rect x="5" y="5" width="14" height="14" rx="2"/>';
const PLUS = '<path d="M12 8v8M8 12h8"/>';
const X = '<path d="M9 9l6 6M15 9l-6 6"/>';
const sine = (yo: number) => `<path d="M3 ${yo}q3 -4 6 0t6 0 6 0"/>`;

const INNER: Record<string, string> = {
  // ── Info / Code ──
  'ℹ': `<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/>${DOT(12, 7.6, 1)}`,
  'ⓘ': `<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/>${DOT(12, 7.6, 1)}`,
  '{}': '<path d="M9 4c-2 0-2.5 1.4-2.5 3.2 0 1.6-.4 2.4-1.5 2.8 1.1.4 1.5 1.2 1.5 2.8C6.5 18.6 7 20 9 20"/><path d="M15 4c2 0 2.5 1.4 2.5 3.2 0 1.6.4 2.4 1.5 2.8-1.1.4-1.5 1.2-1.5 2.8C17.5 18.6 17 20 15 20"/>',
  '⌗': '<path d="M9 4l-1.5 16M16.5 4L15 20M4.5 9h15M3.5 15h15"/>',
  // ── Bearbeiten / Marker ──
  '✎': '<path d="M5 19l1-4 9-9 3 3-9 9-4 1z"/><path d="M14 6l3 3"/>',
  '⚑': '<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>',
  '📋': '<rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2.5" width="6" height="3.5" rx="1"/><path d="M9 11h6M9 15h6"/>',
  '📥': '<path d="M5 13v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/><path d="M9 9l3 3 3-3M12 3v9"/>',
  '🔬': '<circle cx="11" cy="9" r="4.5"/><path d="M14.5 12.5L20 18M4 20h9"/>',
  '🎭': '<path d="M4 7c0-1 1-2 4-2s4 1 4 2v3a4 4 0 0 1-8 0z"/><path d="M12 9c0-1 1-2 4-2s4 1 4 2v3a4 4 0 0 1-8 0z"/>',
  '🎚': '<path d="M5 8h14M5 16h14"/>' + DOT(9, 8, 2) + DOT(15, 16, 2),
  // ── Wellen / Signal ──
  '〜': sine(12),
  '≈': `${sine(9)}${sine(15)}`,
  '≋': `${sine(7)}${sine(12)}${sine(17)}`,
  '📡': '<path d="M5 13a7 7 0 0 1 14 0"/><path d="M8 13a4 4 0 0 1 8 0"/>' + DOT(12, 13, 1.3),
  '⌁': '<path d="M4 13l3-5 4 8 4-10 3 6 2-3"/>',
  '↝': '<path d="M3 13q3 -4 6 0t6 0"/><path d="M14 9l3 4-3 2"/>',
  // ── Hexagone ──
  '⬡': '<path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z"/>',
  '⌬': '<path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z"/><circle cx="12" cy="12" r="3.4"/>',
  // ── Kreise / Ziele ──
  '◎': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
  '◉': `<circle cx="12" cy="12" r="8"/>${DOT(12, 12, 3)}`,
  '⊙': `<circle cx="12" cy="12" r="7"/>${DOT(12, 12, 1.4)}`,
  '⊚': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  '⊕': `<circle cx="12" cy="12" r="8"/>${PLUS}`,
  // ── Quadrate ──
  '◻': BOX,
  '▢': BOX,
  '◫': `${BOX}<path d="M12 5v14"/>`,
  '▣': '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  '▦': '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/>',
  '▥': `${BOX}<path d="M10 5v14M15 5v14"/>`,
  '▤': `${BOX}<path d="M5 10h14M5 15h14"/>`,
  '⊠': `${BOX}${X}`,
  '⊡': `${BOX}${DOT(12, 12, 2)}`,
  '⊞': `${BOX}${PLUS}`,
  '⬚': '<rect x="5" y="5" width="14" height="14" rx="2" stroke-dasharray="3 3"/>',
  '◈': '<path d="M12 3l7 9-7 9-7-9z" fill="currentColor" stroke="none"/>',
  '◇': '<path d="M12 3l7 9-7 9-7-9z"/>',
  // ── Pfeile ──
  '↓': '<path d="M12 4v12"/><path d="M7 11l5 5 5-5"/>',
  '↥': '<path d="M12 16V6"/><path d="M7 11l5-5 5 5"/><path d="M6 20h12"/>',
  '⇊': '<path d="M9 4v9M9 13l-2.5-2.5M9 13l2.5-2.5"/><path d="M15 4v9M15 13l-2.5-2.5M15 13l2.5-2.5"/>',
  '⇄': '<path d="M4 9h13l-3-3M20 15H7l3 3"/>',
  '⤧': '<path d="M5 8h10l-3-3M19 16H9l3 3"/>',
  '⏩': '<path d="M5 7l6 5-6 5zM13 7l6 5-6 5z" fill="currentColor" stroke="none"/>',
  '↯': '<path d="M13 3L6 13h5l-1 8 8-11h-5z"/>',
  // ── Sonstiges ──
  '☰': '<path d="M5 7h14M5 12h14M5 17h14"/>',
  '☁': '<path d="M7 18a4 4 0 0 1 .4-7.98A5.5 5.5 0 0 1 18 11.2 3.5 3.5 0 0 1 17.5 18z"/>',
  '⚙': '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  '⛉': '<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/>',
  '⌂': '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
  '▯': '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M10 18h4"/>',
  '⏱': '<circle cx="12" cy="13" r="7"/><path d="M12 13V9M10 3h4M18 6l1.5-1.5"/>',
};

export const GLYPH_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(INNER).filter(([, v]) => v).map(([k, v]) => [k, wrap(v)]),
);
