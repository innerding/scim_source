// Colorist — Last (0..1) → Farbe. EINE Quelle: der Colorist lebt jetzt in shell-kit
// (app/colorist.ts), damit Editor UND Runtime exakt dieselbe Farbe rechnen. Diese Datei
// ist nur noch ein Re-Export-Shim, damit die bestehenden Importeure unverändert laufen.
export {
  colorize,
  shapeLoad,
  heatColor,
  PALETTES,
  DEFAULT_PALETTE,
} from 'shell-kit';
export type { PaletteId, ColorizeParams } from 'shell-kit';
