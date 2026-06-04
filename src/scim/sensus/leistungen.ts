// Eine Quelle für die Kennzahlen — das Leistungsblatt (System ◈) UND das Usage-
// Manual (Reader-Diode) lesen DARAUS, damit sie nie mehr auseinanderlaufen.
// Früher divergent: Manual 232 Commits / ~36.000 Zeilen vs. Leistungsblatt 130 /
// ~31.000. Jetzt: hier pflegen → beide aktuell. Commits/Zeilen real gemessen.
// Stand 2026-06-04.

export const LEISTUNGEN_STAND = '2026-06-04';

export interface Kennzahl { label: string; wert: string; detail: string; }

export const LEISTUNGEN: Kennzahl[] = [
  { label: 'Quellcode',      wert: '~49.600 Zeilen',          detail: 'SCIM3 Operator-Tool (TS/TSX) · gemessen' },
  { label: 'Git-Commits',    wert: '636',                     detail: 'Auto-Deploy bei jedem main-Push' },
  { label: 'Test-Dateien',   wert: '45',                      detail: 'Vitest' },
  { label: 'Pipeline',       wert: '14 P-Panels + 7 Compute', detail: 'stabile Architektur seit v0.2' },
  { label: 'Region-Katalog', wert: '3 Regionen · 60 POIs',    detail: 'Grünberg 49 · Lichtenberg 11 · Gaisberg prepared' },
  { label: 'Icon-Bibliothek',wert: '49 SVG-Assets',           detail: 'POI-Icons + Glyphs + Identity-Icons' },
];

// Monospace-Block fürs Usage-Manual (gleiche Quelle wie das Leistungsblatt).
export function leistungenManualBlock(): string {
  return LEISTUNGEN.map((k) => {
    const head = '  ' + k.label.padEnd(30) + k.wert;
    const sub = ' '.repeat(32) + k.detail;
    return head + '\n' + sub;
  }).join('\n');
}
