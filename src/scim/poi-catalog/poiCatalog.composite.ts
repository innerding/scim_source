// SCIM-INTERNER Renderer (Operator-Anzeige): Katalog-Tab + Inspector. Das ist
// NICHT das Ziel-App-Rendering — die Ziel-App läuft lokal, ohne SCIM, und
// rendert eigenständig. Bei einer Ausspielung birgt P09-POI diese Function als
// versionierte, selbst-enthaltende KOPIE (Kapsel, mit Inhalts-Hash/Diff) →
// Sensus Core Service → App-Shell-Paket (long-horizon, Teil MVP-Lichtenberg).
//
// Composite-Renderer: Container (Geometrie + Kategoriefarbe) + Icon + optionale
// Decoration (Hoehe/Anno/Sterne …). Eine SVG-Wahrheit, die sowohl das
// Katalog-Panel als auch der Karten-Inspector verwenden — damit ein POI ueberall
// identisch aussieht (gleicher Container, gleiche Farbe, gleiches Icon, gleiche
// Deco). Frueher lag das inline in CatalogTab; das fuehrte zu Divergenz.

import { iconById } from './iconRegistry';
import { digitGlyph, glyphById } from './digitGlyphs';
import { extractDecoration, iconMeta } from './decorations';
import type { DecorationMatch } from './decorations';
import { containerOf, geometryOf } from './poiCatalog.containerSystem';
import type { Geometry, Subcategory } from './poiCatalog.types';

export function extractIconInner(svg: string): string {
  return svg
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .trim();
}

export function buildContainerSvgString(geo: Geometry, color: string): string {
  const isStroke = geo.fill_role === 'stroke';
  const fill = isStroke ? 'none' : color;
  const stroke = isStroke ? color : '#000';
  const strokeWidth = isStroke ? 3 : 1;
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"`;
  const s = geo.shape;
  switch (s.kind) {
    case 'circle':
      return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" ${common}/>`;
    case 'rect':
      return `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}"${s.rx != null ? ` rx="${s.rx}"` : ''} ${common}/>`;
    case 'polygon':
      return `<polygon points="${s.points.map((p) => p.join(',')).join(' ')}" ${common}/>`;
    case 'path':
      return `<path d="${s.d}" ${common}/>`;
  }
}

// Generische Glyph-Reihe fuer eine Decoration: optionales Einheits-Glyph links,
// dann Ziffern, dann optionales Einheits-Glyph rechts. Jeder Glyph ist 4
// viewBox-Einheiten breit, 5 hoch. Stars: Stern-Glyph (value)-mal wiederholt.
export function buildGlyphRowSvgString(deco: DecorationMatch): { inner: string; widthUnits: number } {
  const parts: string[] = [];
  let x = 0;
  const placeGlyph = (svgRaw: string) => {
    parts.push(`<svg x="${x}" y="0" width="4" height="5" viewBox="0 0 4 5">${extractIconInner(svgRaw)}</svg>`);
    x += 4;
  };

  if (deco.kind === 'stars') {
    const star = deco.unit_glyph ? glyphById(deco.unit_glyph) : undefined;
    if (star) {
      const n = Math.max(1, Math.min(5, deco.value));
      for (let i = 0; i < n; i++) placeGlyph(star.svg_raw);
    }
    return { inner: parts.join(''), widthUnits: x };
  }

  if (deco.unit_glyph && deco.unit_position === 'left') {
    const u = glyphById(deco.unit_glyph);
    if (u) placeGlyph(u.svg_raw);
  }
  for (const ch of deco.digits) {
    const g = digitGlyph(parseInt(ch, 10));
    if (g) placeGlyph(g.svg_raw);
  }
  if (deco.unit_glyph && deco.unit_position === 'right') {
    const u = glyphById(deco.unit_glyph);
    if (u) placeGlyph(u.svg_raw);
  }
  return { inner: parts.join(''), widthUnits: x };
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
  const container = buildContainerSvgString(geo, containerColor);
  const { iconId: resolvedId, forceElevation } = resolveIcon(iconId);
  const iconEntry = iconById(resolvedId);
  const iconInner = iconEntry ? extractIconInner(iconEntry.svg_cleaned) : '';

  const meta = iconMeta(resolvedId);
  const decoAllowed = (forceElevation || meta.decoration_below) && iconEntry;
  const deco = decoAllowed ? extractDecoration(text) : null;

  if (deco == null) {
    // Standard-Composite: Container füllt 48×48, Icon liegt darüber.
    const offsetY = geo.icon_offset_y ?? 0;
    const iconPart = !iconInner
      ? ''
      : offsetY === 0
        ? iconInner
        : `<g transform="translate(0,${offsetY})">${iconInner}</g>`;
    return `<svg viewBox="0 0 48 48" width="${size}" height="${size}">${container}${iconPart}</svg>`;
  }

  // Summit-Composite mit Zifferncontainer (Frame). Siehe ann_044.
  const { inner: glyphRow, widthUnits: contentUnits } = buildGlyphRowSvgString(deco);
  const FRAME_PADDING_X = 4;
  const FRAME_PADDING_Y = 2;
  const frameUnitsW = contentUnits + 2 * FRAME_PADDING_X;
  const frameUnitsH = 5 + 2 * FRAME_PADDING_Y;
  const UNIT_SCALE = 1.2;
  const frameW = frameUnitsW * UNIT_SCALE;
  const frameH = frameUnitsH * UNIT_SCALE;
  const frameX = 24 - frameW / 2;
  const FRAME_ANCHOR_Y = 45;
  const frameY = FRAME_ANCHOR_Y - frameH;
  const DECO_TEXT_SCALE = 0.9;
  const contentW = contentUnits * UNIT_SCALE * DECO_TEXT_SCALE;
  const contentH = 5 * UNIT_SCALE * DECO_TEXT_SCALE;
  const contentX = frameX + (frameW - contentW) / 2;
  const contentY = frameY + (frameH - contentH) / 2;
  const summitIconShift = 0;
  const iconPart = `<g transform="translate(0,${-summitIconShift})">${iconInner}</g>`;
  const frameEntry = glyphById('frame');
  const frameInner = frameEntry
    ? extractIconInner(frameEntry.svg_raw).replace('<path ', '<path vector-effect="non-scaling-stroke" ')
    : '';
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}">` +
    container +
    iconPart +
    `<svg x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" viewBox="0 0 8 9" preserveAspectRatio="none">${frameInner}</svg>` +
    `<svg x="${contentX}" y="${contentY}" width="${contentW}" height="${contentH}" viewBox="0 0 ${contentUnits} 5">${glyphRow}</svg>` +
    `</svg>`;
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
