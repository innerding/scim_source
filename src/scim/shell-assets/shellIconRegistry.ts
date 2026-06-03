// Shell-Icon-Registry — der High-Shell-Speicher data/icons-shell/, gespiegelt durch
// DENSELBEN Cleaner wie die Katalog-Icons (cleanIconSvg). Eigener Speicher, NICHT über
// origin-capsuler (representation-unabhängig). Heute manuell befüllt; Drawer-icon-
// Speisung = Zukunft. Glob ist leer, solange noch keine SVGs im Ordner liegen.

import { cleanIconSvg } from '../poi-catalog/svgCleaner';

const modules = import.meta.glob<string>('../../../data/icons-shell/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export interface ShellIcon {
  id: string;       // Dateiname ohne .svg
  svg: string;      // bereinigt (svg_cleaned)
}

export const SHELL_ICONS: ShellIcon[] = Object.entries(modules)
  .map(([path, raw]) => {
    const file = path.split('/').pop()?.replace(/\.svg$/i, '') ?? path;
    const { cleaned } = cleanIconSvg(raw);
    return { id: file, svg: cleaned };
  })
  .sort((a, b) => a.id.localeCompare(b.id, 'de'));
