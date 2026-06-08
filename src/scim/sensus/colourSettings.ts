// Farb-/Schwellen-Settings — die Operator-Parameter der Farb-Kette, persistiert
// pro Region (localStorage). Das Farb-Modell ist das Felder-/Grenzen-Modell
// (stops/borders/middleField → shell-kit ScaleSpec, colorAt). Die alte colorize-
// Kette (palette/spectrum/bias/safety) UND die spread/floor-Normalisierung sind
// ausgemustert (Stufe 6) — die Verteilung macht colorAt(borders) selbst.
//   degradier            → BCK-Degradier-Schwelle
//
// Die User-Ausschluss-Schwelle ist NICHT hier — sie ist runtime/user (P09 Mask).

export interface ColourSettings {
  degradier: number | null;  // Ø-Last-Schwelle (null = aus) — BCK-Degradier
  // ── Felder-/Grenzen-Modell (Stufe 1) — speist shell-kit ScaleSpec ──
  stops: string[];                       // 2–6 Farb-Felder (grün→rot, unten→oben)
  borders: number[];                     // N−1 innere Feldgrenzen (Load 0..1, sortiert) — Grenzen sind die Wahrheit
  middleField: number | null;            // in Schritt 1 zentriertes Feld (Index) — bleibt auf 0.5 fixiert; null = keins
  spreizung: { mitte: number; oben: number; unten: number };        // (vestigial, bis Mesh auf borders umgestellt ist)
  verjuengung: { unten: number; oben: number };                     // Wrap (Comfort-only)
}

const DEFAULT_STOPS = ['#2ecc40', '#ffd400', '#ff2d2d', '#ff0099'];  // grün · gelb · rot · pink (wie Comfort-Slider)

// Gleichmäßige innere Grenzen für n Felder: [1/n, 2/n, …, (n−1)/n].
export function evenBorders(n: number): number[] {
  if (n <= 1) return [];
  return Array.from({ length: n - 1 }, (_, i) => (i + 1) / n);
}

export const DEFAULT_COLOUR_SETTINGS: ColourSettings = {
  degradier: null,
  stops: [...DEFAULT_STOPS],
  borders: evenBorders(DEFAULT_STOPS.length),
  middleField: null,
  spreizung: { mitte: 0.5, oben: 0.5, unten: 0.5 },
  verjuengung: { unten: 0, oben: 0 },
};

export const COLOUR_SETTINGS_EVENT = 'scim:colour-settings:changed';

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const num = (v: unknown, def: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : def;

const isColor = (v: unknown): v is string =>
  typeof v === 'string' && /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgba?\([^)]+\))$/.test(v.trim());

// Stops: 2–6 gültige Farben, sonst Default. Längere werden gekappt, zu kurze gefüllt.
function coerceStops(v: unknown): string[] {
  if (!Array.isArray(v)) return [...DEFAULT_STOPS];
  const ok = v.filter(isColor);
  if (ok.length < 2) return [...DEFAULT_STOPS];
  return ok.slice(0, 6);
}

// Grenzen: genau n−1 finite Zahlen in (0,1), aufsteigend sortiert; sonst gleichmäßig.
function coerceBorders(v: unknown, n: number): number[] {
  const need = Math.max(0, n - 1);
  if (!Array.isArray(v) || v.length !== need) return evenBorders(n);
  const ok = v.map((x) => (typeof x === 'number' && Number.isFinite(x) ? clamp(x, 0.001, 0.999) : NaN));
  if (ok.some((x) => Number.isNaN(x))) return evenBorders(n);
  return ok.slice().sort((a, b) => a - b);
}

// Mischt beliebige (Teil-/Korrupt-)Eingaben mit den Defaults und clampt jeden
// Wert in seinen gültigen Bereich. Reine Funktion → testbar ohne localStorage.
export function coerceSettings(raw: unknown): ColourSettings {
  const r = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const d = DEFAULT_COLOUR_SETTINGS;
  const degValid = typeof r.degradier === 'number' && Number.isFinite(r.degradier);
  const stops = coerceStops(r.stops);
  return {
    degradier: degValid ? clamp(r.degradier as number, 0, 1) : null,
    stops,
    borders: coerceBorders(r.borders, stops.length),
    middleField: (typeof r.middleField === 'number' && Number.isInteger(r.middleField) && r.middleField >= 0 && r.middleField < stops.length) ? r.middleField : null,
    spreizung: {
      mitte: clamp(num((r.spreizung as Record<string, unknown>)?.mitte, d.spreizung.mitte), 0, 1),
      oben: clamp(num((r.spreizung as Record<string, unknown>)?.oben, d.spreizung.oben), 0, 1),
      unten: clamp(num((r.spreizung as Record<string, unknown>)?.unten, d.spreizung.unten), 0, 1),
    },
    verjuengung: {
      unten: clamp(num((r.verjuengung as Record<string, unknown>)?.unten, d.verjuengung.unten), 0, 1),
      oben: clamp(num((r.verjuengung as Record<string, unknown>)?.oben, d.verjuengung.oben), 0, 1),
    },
  };
}

function storageKey(regionSlug: string): string {
  return `scim3_colour_settings_${regionSlug || 'default'}`;
}

export function loadColourSettings(regionSlug: string): ColourSettings {
  try {
    const raw = localStorage.getItem(storageKey(regionSlug));
    if (raw) return coerceSettings(JSON.parse(raw));
  } catch { /* ignore */ }
  return { ...DEFAULT_COLOUR_SETTINGS };
}

export function saveColourSettings(regionSlug: string, settings: ColourSettings): void {
  const clean = coerceSettings(settings);
  try {
    localStorage.setItem(storageKey(regionSlug), JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent(COLOUR_SETTINGS_EVENT, {
      detail: { regionSlug: regionSlug || 'default', settings: clean },
    }));
  } catch { /* ignore */ }
}

export function isColourCustomized(regionSlug: string): boolean {
  try { return localStorage.getItem(storageKey(regionSlug)) !== null; } catch { return false; }
}

export function resetColourSettings(regionSlug: string): void {
  try { localStorage.removeItem(storageKey(regionSlug)); } catch { /* ignore */ }
}

// ── Default-Kaskade-Resolver (P01 Thresholds) ────────────────────────────────
// Was AUSGELIEFERT wird (Origin) bzw. in der Vorschau (ScimMap) gezeigt: der erste
// AUSDRÜCKLICH GESETZTE Wert im Rep-Strang, von spezifisch → allgemein:
//   rep-editor-rep → representation → global → (Region als nicht-brechender Fallback).
// Der Reg-Strang (region/reg-editor-reg) ist Richtschnur/Anzeige und fließt NICHT ein.
const GLOBAL_SCOPE_KEY = '__global__';
const repEditorKeyFor = (slug: string) => `__rep_editor__${slug || 'default'}`;
const representationKeyFor = (slug: string) => `__rep__${slug || 'default'}`;

export function effectiveRepColour(regionSlug: string): ColourSettings {
  const slug = regionSlug || 'default';
  if (isColourCustomized(repEditorKeyFor(slug)))     return loadColourSettings(repEditorKeyFor(slug));
  if (isColourCustomized(representationKeyFor(slug))) return loadColourSettings(representationKeyFor(slug));
  if (isColourCustomized(GLOBAL_SCOPE_KEY))           return loadColourSettings(GLOBAL_SCOPE_KEY);
  return loadColourSettings(slug);   // Fallback: bestehende Region (nicht-brechend)
}
