// System-Icons-Set — die Icons der Navigator-Controls/Panels als echte SVG-Assets
// (currentColor, width/height 1em → skaliert per fontSize, einfärbbar per color).
// Heimat aller System-Icons. Referenziert über den Token `sys:<name>` im icon-Feld
// eines Panel-Descriptors; gerendert von <PanelIcon> (src/scim/ui/PanelIcon.tsx).
//
// Wächst inkrementell: weitere Control-Glyphen werden hier als SVG abgelegt und
// die Descriptor-icons von Unicode-Glyph auf `sys:<name>` umgestellt.

import paperclip from './paperclip.svg?raw';
import cloudFilled from './cosmo-cloud.svg?raw';
import { PANEL_GLYPHS } from './panelGlyphs';

export const SYSTEM_ICONS: Record<string, string> = {
  paperclip,           // Büroklammer — Pathworks (Hub)
  'cloud-filled': cloudFilled,   // gefüllte Wolke (NavCloud nutzt die Datei direkt)
};

// Panel-Glyphen (strichbasiert, keyed nach Panel-ID) ins Set aufnehmen.
export const PANEL_ICON_BY_ID: Record<string, string> = PANEL_GLYPHS;

export const SYS_ICON_PREFIX = 'sys:';

// Liefert das rohe SVG-Markup für einen icon-Wert, falls es ein System-Icon-Token
// (`sys:<name>`) ist — sonst undefined (dann ist es ein Unicode-Glyph).
export function systemIconSvg(icon: string | undefined): string | undefined {
  if (!icon || !icon.startsWith(SYS_ICON_PREFIX)) return undefined;
  return SYSTEM_ICONS[icon.slice(SYS_ICON_PREFIX.length)];
}
