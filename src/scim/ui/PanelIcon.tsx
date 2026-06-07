// PanelIcon — rendert das icon-Feld eines Panels: entweder ein System-Icon-SVG
// (`sys:<name>` aus dem System-Icons-Set) oder einen Unicode-Glyph (Fallback).
// Größe per `size` (px → fontSize/1em), Farbe per `color`, Deckkraft per `opacity`.
import type { CSSProperties } from 'react';
import { systemIconSvg } from '../../assets/system';

export default function PanelIcon({
  icon, size = 22, color, opacity, style,
}: { icon?: string; size?: number; color?: string; opacity?: number; style?: CSSProperties }) {
  const svg = systemIconSvg(icon);
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size, lineHeight: 1, color, opacity, ...style,
  };
  if (svg) {
    return <span aria-hidden style={base} dangerouslySetInnerHTML={{ __html: svg }} />;
  }
  return <span aria-hidden style={base}>{icon}</span>;
}
