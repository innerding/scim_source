// PanelIcon — rendert das icon-Feld eines Panels: entweder ein System-Icon-SVG
// (`sys:<name>` aus dem System-Icons-Set) oder einen Unicode-Glyph (Fallback).
// Größe per `size` (px → fontSize/1em), Farbe per `color`, Deckkraft per `opacity`.
import type { CSSProperties } from 'react';
import { systemIconSvg, glyphIconSvg, PANEL_ICON_BY_ID } from '../../assets/system';

export default function PanelIcon({
  id, icon, size = 22, color, opacity, style, gradientClass, fill,
}: { id?: string; icon?: string; size?: number; color?: string; opacity?: number; style?: CSSProperties; gradientClass?: string; fill?: boolean }) {
  // Auflösung: erst Panel-Glyph nach ID (neues SVG-Set), dann sys:<name>-Token,
  // dann Glyph→SVG (Tab-Glyphen), sonst der rohe Unicode-Glyph als Fallback.
  const svg = (id && PANEL_ICON_BY_ID[id]) ?? systemIconSvg(icon) ?? glyphIconSvg(icon);
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size, lineHeight: 1, color, opacity, ...style,
  };
  // Fill-Modus: SVG füllt 100 % des (extern dimensionierten) Wrappers — für das
  // große Panel-Wasserzeichen (Breite z. B. 50 % der Panel-Breite).
  if (svg && fill) {
    const filled = svg.replace('width="1em" height="1em"', 'width="100%" height="100%"');
    return <span aria-hidden style={{ display: 'block', width: '100%', height: '100%', color, opacity, ...style }} dangerouslySetInnerHTML={{ __html: filled }} />;
  }
  // Gradient-Modus (Logo-Fill): SVG als CSS-Maske, Fläche = animierter Gradient (gradientClass).
  if (svg && gradientClass) {
    const uri = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    const mask: CSSProperties = {
      display: 'inline-block', width: size, height: size, opacity, ...style,
      WebkitMaskImage: uri, maskImage: uri,
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain', maskSize: 'contain',
      WebkitMaskPosition: 'center', maskPosition: 'center',
    };
    return <span aria-hidden className={gradientClass} style={mask} />;
  }
  if (svg) {
    return <span aria-hidden style={base} dangerouslySetInnerHTML={{ __html: svg }} />;
  }
  return <span aria-hidden style={base}>{icon}</span>;
}
