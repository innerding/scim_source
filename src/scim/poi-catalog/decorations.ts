// Decoration-System für POI-Composites (ann_044, Phase D).
//
// Eine Decoration ist ein Zusatzelement, das beim Rendering auf das
// Composite (Container + Icon) draufgesetzt wird. Aktuell nur eine Variante
// implementiert: 'elevation' rendert die aus dem POI-Text extrahierte Höhe
// als Ziffernreihe unter dem Icon.
//
// Welche Icons eine Decoration tragen: in ICONS_META deklariert (Opt-in).
// Hardcoded statt JSON-Datei, weil heute noch übersichtlich und type-safe.

export type DecorationKind = 'elevation';

export interface IconMeta {
  decoration_below?: DecorationKind;
  // Spätere Erweiterungen: decoration_above, decoration_corner, …
}

// Opt-in pro Icon — id = file_name aus iconRegistry.
// Aussichtspunkt-POIs können als Summit-Variante eine Höhenangabe tragen,
// wenn der POI-Text eine enthält. Alternativ wird die Decoration auch über
// das Plus-Suffix im Icon-Namen ausgelöst (z.B. `aussichtspunkt+`).
export const ICONS_META: Record<string, IconMeta> = {
  aussichtspunkt: { decoration_below: 'elevation' },
};

export function iconMeta(iconId: string): IconMeta {
  return ICONS_META[iconId] ?? {};
}

// Extrahiert eine Höhenangabe aus dem POI-Textfeld, z.B.
//   "Katzenstein 1349 m"  → 1349
//   "Grünberg 986 m"      → 986
//   "Aussichtsturm"       → null
// Akzeptiert 2-5 Ziffern (m, dm, hm — alles plausibel für Geländehöhen).
export function extractElevation(text: string): number | null {
  const m = text.match(/\b(\d{2,5})\s*m\b/);
  return m ? parseInt(m[1], 10) : null;
}

// Layout-Math aus ann_044, gegeben Padding p und Icon-Aspect-Ratio (H/W).
// Liefert konkrete Pixel-Maße für den 48×48-Viewport.
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
