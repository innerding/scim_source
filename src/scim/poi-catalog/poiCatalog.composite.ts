// EDITOR-ADAPTER über den generischen Shell-Render-Kern (sensus/shellRenderCore).
//
// Der eigentliche Render-Code (Container ⊕ Icon ⊕ Deco, Glyph-Reihe, Cluster-
// Mathematik) lebt EINMAL im Kern — „eine Quelle je Engine" (Umbauplan). Diese
// Datei ist der EDITOR-seitige Adapter: sie „honoriert" Icons/Glyphen aus der
// Vite-Glob-Registry (data/icons, data/glyphs) und reicht sie als RenderAssets
// in den Kern. Die Ziel-App-Shell bringt einen eigenen Adapter (Origin-Paket)
// mit — der Kern wird REFERENZIERT, nie kopiert.
//
// Verwendet von Katalog-Tab und Karten-Inspector — damit ein POI überall
// identisch aussieht (gleicher Container, gleiche Farbe, gleiches Icon, gleiche
// Deco). Das ist NICHT das Ziel-App-Rendering; die Ziel-App rendert eigenständig
// über denselben Kern.

import { iconById } from './iconRegistry';
import { digitGlyph, glyphById } from './digitGlyphs';
import { extractDecoration, iconMeta } from './decorations';
import type { DecorationMatch } from './decorations';
import { containerOf, geometryOf } from './poiCatalog.containerSystem';
import type { Geometry, Subcategory } from './poiCatalog.types';
import {
  buildComposite,
  buildContainerSvg,
  buildGlyphRow,
  extractIconInner as coreExtractIconInner,
  type RenderAssets,
} from '../sensus/shellRenderCore';

// ── Re-Exports: bestehende Editor-API unverändert ───────────────────────────
export const extractIconInner = coreExtractIconInner;

export function buildContainerSvgString(geo: Geometry, color: string): string {
  return buildContainerSvg(geo, color);
}

// ── Editor-„Honorieren": Glyphen/Ziffern aus der data/-Registry ─────────────
const EDITOR_ASSETS: RenderAssets = {
  glyphRaw: (id) => glyphById(id)?.svg_raw ?? null,
  digitRaw: (d) => digitGlyph(d)?.svg_raw ?? null,
};

export function buildGlyphRowSvgString(deco: DecorationMatch): { inner: string; widthUnits: number } {
  return buildGlyphRow(deco, EDITOR_ASSETS);
}

// Auflösung des Icon-Referenz-Strings aus dem Plan:
//   - Exakter Treffer in der Registry → unverändert, Meta optional
//   - Trailing "+" (z.B. "Fernglas+") → fallback auf Basis-Icon, Elevation erzwungen
export function resolveIcon(name: string): { iconId: string; forceElevation: boolean } {
  if (iconById(name)) return { iconId: name, forceElevation: false };
  if (name.endsWith('+')) {
    const base = name.slice(0, -1);
    if (iconById(base)) return { iconId: base, forceElevation: true };
  }
  return { iconId: name, forceElevation: false };
}

export function buildPoiComposite(
  iconId: string,
  text: string,
  containerColor: string,
  geo: Geometry,
  size: number,
): string {
  const { iconId: resolvedId, forceElevation } = resolveIcon(iconId);
  const iconEntry = iconById(resolvedId);
  const iconInner = iconEntry ? extractIconInner(iconEntry.svg_cleaned) : '';

  const meta = iconMeta(resolvedId);
  const decoAllowed = (forceElevation || meta.decoration_below) && iconEntry;
  const deco = decoAllowed ? extractDecoration(text) : null;

  return buildComposite({ geo, containerColor, size, iconInner, deco, assets: EDITOR_ASSETS });
}

// Bequemer Einstieg: nur Subkategorie + Icon + Text → fertiges Composite-SVG
// (Container-Geometrie und Kategoriefarbe werden aus dem CONTAINER_SYSTEM
// aufgeloest). null, wenn die Subkategorie unbekannt ist.
export function poiCompositeSvg(
  iconId: string,
  text: string,
  subcategory: Subcategory,
  size: number,
): string | null {
  const spec = containerOf(subcategory);
  if (!spec) return null;
  const geo = geometryOf(spec.geometry_id);
  if (!geo) return null;
  return buildPoiComposite(iconId, text, spec.color, geo, size);
}
