// Eine Quelle für die Kennzahlen — das Leistungsblatt (System ◈) UND das Usage-
// Manual (Reader-Diode) lesen DARAUS, damit sie nie mehr auseinanderlaufen.
// Hier pflegen → beide aktuell. Commits/Zeilen real gemessen über die drei
// Auslieferungs-Repos (SCIM3-Werkbank + Runtime + shell-kit). Stand 2026-06-06.

export const LEISTUNGEN_STAND = '2026-06-06';

export interface Kennzahl { label: string; wert: string; detail: string; }

export const LEISTUNGEN: Kennzahl[] = [
  { label: 'Quellcode',      wert: '~56.000 Zeilen',          detail: 'Gesamtsystem (TS/TSX): SCIM3 50.122 · Runtime 4.381 · shell-kit 1.493 · gemessen' },
  { label: 'Git-Commits',    wert: '934',                     detail: 'SCIM3 762 · Runtime 130 · shell-kit 42 · Auto-Deploy je main-Push' },
  { label: 'Test-Dateien',   wert: '45 + Node',               detail: 'Vitest (SCIM3) · shell-kit Node-Tests (bak/Skala)' },
  { label: 'Pipeline',       wert: '14 P-Panels + 7 Compute', detail: 'stabile Architektur seit v0.2' },
  { label: 'Region-Katalog', wert: '3 Regionen · 55 POIs',    detail: 'publiziert: Grünberg 31 · Lichtenberg 24 · Gaisberg prepared' },
  { label: 'Icon-Bibliothek',wert: '64 SVG-Assets',           detail: 'POI-Icons + Glyphs + Identity/Region-Icons (data/)' },
];

// Monospace-Block fürs Usage-Manual (gleiche Quelle wie das Leistungsblatt).
export function leistungenManualBlock(): string {
  return LEISTUNGEN.map((k) => {
    const head = '  ' + k.label.padEnd(30) + k.wert;
    const sub = ' '.repeat(32) + k.detail;
    return head + '\n' + sub;
  }).join('\n');
}
