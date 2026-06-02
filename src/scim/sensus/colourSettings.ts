// Farb-/Schwellen-Settings (Umbauplan B1) — die Operator-Parameter der Farb-
// Kette, persistiert pro Region (localStorage, wie edgeTypeConfig). Speisen die
// Engine-Funktionen aus Phase A:
//   P04 Load   → spectrum            (colorize: Spektrum-Charakter)
//   P02 Region → bias · safety       (colorize: Tendenz + Safety-Default)
//               degradier            (classifyStretches: Degradier-Schwelle)
//   P01 System → spread · floor      (normalizeLoads)
// Defaults = neutrale Kette (≙ heatColor, keine Normalisierung) — bis getunt
// wird, ändert sich nichts. §2a bleibt gewahrt (Schwellen sind Werte, der
// Gradient ist stetig).
//
// Die User-Ausschluss-Schwelle ist NICHT hier — sie ist runtime/user (P09 Mask).

import { PALETTES, DEFAULT_PALETTE, type PaletteId } from './loadColour';

export interface ColourSettings {
  palette: PaletteId;        // P04 — Palette-Modell (Grund-Spektrum)
  spectrum: number;          // P04 — 0 ruhig … 0.5 linear … 1 aggressiv
  bias: number;              // P02 — −1 kühler … 0 … +1 heißer (regionale Tendenz)
  safety: number;            // P02 — 0 … 1 zusätzliche Aggressivität (Safety-Default)
  degradier: number | null;  // P02 — Ø-Last-Schwelle (null = aus)
  spread: number;            // P01 — 0 absolut … 1 voll relativ
  floor: number;             // P01 — 0 … 1 Mindest-Rot
}

export const DEFAULT_COLOUR_SETTINGS: ColourSettings = {
  palette: DEFAULT_PALETTE, spectrum: 0.5, bias: 0, safety: 0, degradier: null, spread: 0, floor: 0,
};

export const COLOUR_SETTINGS_EVENT = 'scim:colour-settings:changed';

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const num = (v: unknown, def: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : def;

// Mischt beliebige (Teil-/Korrupt-)Eingaben mit den Defaults und clampt jeden
// Wert in seinen gültigen Bereich. Reine Funktion → testbar ohne localStorage.
export function coerceSettings(raw: unknown): ColourSettings {
  const r = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const d = DEFAULT_COLOUR_SETTINGS;
  const degValid = typeof r.degradier === 'number' && Number.isFinite(r.degradier);
  const palette = (typeof r.palette === 'string' && r.palette in PALETTES) ? r.palette as PaletteId : d.palette;
  return {
    palette,
    spectrum: clamp(num(r.spectrum, d.spectrum), 0, 1),
    bias: clamp(num(r.bias, d.bias), -1, 1),
    safety: clamp(num(r.safety, d.safety), 0, 1),
    degradier: degValid ? clamp(r.degradier as number, 0, 1) : null,
    spread: clamp(num(r.spread, d.spread), 0, 1),
    floor: clamp(num(r.floor, d.floor), 0, 1),
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
