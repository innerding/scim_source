// Panel-Glyphen als echte SVGs — ersetzen die Unicode-Glyphen der Panels durch
// ein kohärentes, strichbasiertes Icon-Set (currentColor, 24×24, 1em). Keyed nach
// Panel-ID; aufgelöst von <PanelIcon id=…> (Fallback bleibt der Descriptor-Glyph).
// Teil des System-Icons-Sets (src/assets/system/index.ts).

const wrap = (inner: string): string =>
  `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

// Innen-Markup je Panel (semantisch gewählt).
const INNER: Record<string, string> = {
  // ── Transmitter / Schwellen ──
  P01: '<line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="9" cy="8" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="2" fill="currentColor" stroke="none"/>', // Thresholds — Schieber
  P02: '<path d="M9 8l-4 4 4 4"/><path d="M15 8l4 4-4 4"/>',                                              // Coder — Code-Klammern
  P03: '<rect x="6" y="3" width="12" height="18" rx="2"/><line x1="10" y1="18" x2="14" y2="18"/>',         // TargetAppUi — Gerät
  P04: '<path d="M5 13a7 7 0 0 1 14 0"/><path d="M8 13a4 4 0 0 1 8 0"/><circle cx="12" cy="13" r="1.3" fill="currentColor" stroke="none"/>', // Telco — Signal
  P05: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>', // Grund — Zonen
  P06: '<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M8 8a6 6 0 0 0 0 8"/><path d="M16 8a6 6 0 0 1 0 8"/><path d="M5.5 5.5a9 9 0 0 0 0 13"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>', // Transmitter — Broadcast
  // ── Komposit ──
  P07: '<path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z"/>',                                                    // High-Shell — Hexagon
  P08: '<path d="M13 3L6 13h5l-1 8 8-11h-5z"/>',                                                            // Deep-Shell — Blitz
  P09: '<rect x="3" y="9" width="18" height="6" rx="3"/><line x1="12" y1="9" x2="12" y2="15"/>',            // Origin-Capsuler — Pille
  P10: '<circle cx="6" cy="18" r="2" fill="currentColor" stroke="none"/><circle cx="18" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 16c0-6 12-4 12-8"/>', // Route+Layer — Route
  P12: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/>',       // boxed-x
  P13: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',                                    // Doppelring
  P14: '<path d="M12 16V5"/><path d="M7 10l5-5 5 5"/><path d="M5 19h14"/>',                                  // Upload
  // ── Müllwagen-Rest (R0x) ──
  R03: '<path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>',                                  // Download
  R04: '<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>',                                                  // Flagge
  R05: '<rect x="5" y="5" width="14" height="14" rx="2"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>', // boxed-dot
  R06: '<path d="M4 13l3-5 4 8 4-10 3 6 2-3"/>',                                                            // Zickzack
  R07: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',  // Ziel
  R08: '<line x1="5" y1="7" x2="19" y2="7"/><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="17" x2="19" y2="17"/>', // Zeilen
  // ── Mond (V0x) ──
  V01: '<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 16l8 4 8-4"/>',                  // All-Publications — Schichten
  V02: '<path d="M12 21s6.5-5.5 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.5 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/>', // Region — Pin
  V03: '<rect x="3" y="4" width="18" height="13" rx="2"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>', // Monitor
  // ── Komposit-Faces / Substrat ──
  catalog: '<line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.6" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.6" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.6" cy="18" r="1.2" fill="currentColor" stroke="none"/>', // Katalog — Liste mit Punkten
  workspace: '<circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="4.6" r="1.7"/><circle cx="5" cy="17.2" r="1.7"/><circle cx="19" cy="17.2" r="1.7"/><line x1="12" y1="9.6" x2="12" y2="6.3"/><line x1="10" y1="13.4" x2="6.4" y2="15.8"/><line x1="14" y1="13.4" x2="17.6" y2="15.8"/>', // Pathworks Hub — Drehscheibe
  geometry_editor: '<path d="M5 19l1-4 9-9 3 3-9 9-4 1z"/><path d="M14 6l3 3"/>',                          // Drawer — Stift
  system: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>', // System — Zahnrad
  ai_interface: '<path d="M5 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H10l-4 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>', // AI — Chat
  ipills: '<rect x="3" y="9" width="11" height="6" rx="3"/><line x1="8.5" y1="9" x2="8.5" y2="15"/><circle cx="17" cy="13" r="4"/>', // i-Pills — Pillen
  cloud: '<path d="M7 18a4 4 0 0 1 .4-7.98A5.5 5.5 0 0 1 18 11.2 3.5 3.5 0 0 1 17.5 18z"/>',                // Cloud — Wolke (Strich)
};

export const PANEL_GLYPHS: Record<string, string> = Object.fromEntries(
  Object.entries(INNER).map(([k, v]) => [k, wrap(v)]),
);

// P11 (Sensus Core Publishing) = das importierte Package-Icon der Runtime
// (src/assets/Package.svg), auf currentColor umgefärbt → invertiert automatisch:
// hell auf dunklem Header, dunkel auf aktivem Amber-Button. Eigene 28er-viewBox.
PANEL_GLYPHS.P11 = '<svg width="1em" height="1em" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2">'
  + '<path d="M22.458,12.099l-8.448,3.168M14.01,15.267l-8.448-3.168v8.448l8.448,3.168v-8.448M14.01,8.931l-8.448,3.168v8.448l8.448,3.168,8.448-3.168v-8.448l-8.448-3.168Z"/>'
  + '<path fill="currentColor" stroke="none" d="M18.574,12.723l-3.513-1.097,3.328-1.215c.235-.085.356-.345.27-.58-.084-.235-.342-.355-.58-.27l-4.442,1.62-4.462-1.393c-.24-.078-.494.058-.567.297-.074.239.058.493.297.567l3.331,1.04-2.84,1.037c-.062.023-.115.059-.16.102l-3.463-1.299c-.312-.116-.661.04-.777.353-.117.312.041.66.353.777l.212.08v7.804l3.593,1.347c-.033.063-.056.131-.056.207v.558c0,.25.203.453.453.453s.453-.203.453-.453v-.446l3.403,1.276v.226c0,.334.27.603.603.603s.603-.27.603-.603v-8.448s-.002-.008-.002-.012c0-.047-.016-.091-.027-.135-.008-.032-.01-.066-.023-.095-.015-.034-.04-.06-.061-.09-.023-.034-.041-.07-.07-.098-.022-.022-.052-.034-.078-.052-.039-.027-.075-.057-.12-.075-.004-.002-.006-.005-.011-.007l-3.743-1.404,3.181-1.16,4.326,1.35v9.171c0,.25.203.453.453.453s.453-.203.453-.453v-9.504c0-.198-.128-.373-.318-.432Z"/>'
  + '</svg>';
