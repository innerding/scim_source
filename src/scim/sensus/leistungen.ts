// Eine Quelle für die Kennzahlen — das Leistungsblatt (System ◈) UND das Usage-
// Manual (Reader-Diode) lesen DARAUS, damit sie nie mehr auseinanderlaufen.
// Hier pflegen → beide aktuell. Commits/Zeilen real gemessen über die drei
// Auslieferungs-Repos (SCIM3-Werkbank + Runtime + shell-kit). Stand 2026-06-12.

export const LEISTUNGEN_STAND = '2026-06-12';

export interface Kennzahl { label: string; wert: string; detail: string; }

export const LEISTUNGEN: Kennzahl[] = [
  { label: 'Systemarchitektur', wert: 'ab 09.2025',           detail: 'Konzept & Architektur (Dietmar Broda)' },
  { label: 'Implementierung',  wert: '~1 Monat',              detail: 'eine Person (Dietmar Broda) · dichte tägliche Arbeit (der Bau)' },
  { label: 'Quellcode',      wert: '~62.900 Zeilen',          detail: 'Gesamtsystem (TS/TSX): SCIM3 54.750 · Runtime 5.766 · shell-kit 2.427 · gemessen' },
  { label: 'Git-Commits',    wert: '1.275',                   detail: 'SCIM3 977 · Runtime 217 · shell-kit 81 · Auto-Deploy je main-Push' },
  { label: 'shell-kit-Kernel', wert: '18 Module · 75 Tests',  detail: 'reine Logik-Bibliothek (Skala/BAK/Anthem/Walker/Detour/Comfort) — Runtime = dünner Adapter' },
  { label: 'Test-Dateien',   wert: '45 + 9 Node',             detail: 'Vitest (SCIM3) 45 · shell-kit Node 9 Dateien / 75 Fälle (Skala/BAK/Walker/Anthem/…)' },
  { label: 'Pipeline',       wert: '14 P-Panels + 7 Compute', detail: 'stabile Architektur seit v0.2' },
  { label: 'Region-Katalog', wert: '3 Regionen · 55 POIs',    detail: 'publiziert: Grünberg 31 · Lichtenberg 24 · Gaisberg prepared' },
  { label: 'Icon-Bibliothek',wert: '64 SVG-Assets',           detail: 'POI-Icons + Glyphs + Identity/Region-Icons (data/)' },
  { label: 'Paket Lichtenberg', wert: '~200 KB Erstlieferung', detail: 'gzip — Shell ~147 (JS 139 + CSS 8) + Origin 49 (648 Segmente, ohne px-Bilder) + Anthem 3,3 KB · laufend (Bestandsnutzer) nur Anthem ~3,3 KB / 5 Min' },
];
