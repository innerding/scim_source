// SCIM3 Stroke-Font — pure data model.
//
// Eine Schrift, deren Zeichen je EINE Mittellinie sind (ein Pfad, ≤8 Punkte),
// gerendert mit fill:none; stroke:currentColor. Das Gewicht ist EIN Parameter
// (stroke-width), kein separater Fett-Schnitt. Verallgemeinert clockDigitSvg()
// (DurationClock.tsx) von monospace-Ziffern auf proportionale Glyphen.
//
// Diese Logik ist bewusst framework-frei und gehört perspektivisch nach
// shell-kit (pure, node-test-bar); das SCIM3-Panel ist nur der Editor darüber.

/** Vertikale Metriken — geteilt über ALLE Glyphen (Fluchtung). y wächst nach unten. */
export interface FontMetrics {
  /** Gesamthöhe der Glyph-Box in User-Units. Alle Glyphen gleich hoch. */
  boxHeight: number;
  /** Akzent-Linie: Oberkante der Umlaut-Zone (ÄÖÜ-Punkte sitzen darunter). */
  accentY: number;
  /** Versalhöhe (cap height) — Oberkante der Großbuchstaben-Mittellinie. */
  capY: number;
  /** x-Höhe — Oberkante der Gemeinen ohne Oberlänge. */
  xHeightY: number;
  /** Grundlinie. */
  baselineY: number;
  /** Unterlängen-Unterkante. */
  descenderY: number;
  /** Standard-Seitenband links/rechts (in der advance enthalten). */
  sideBearing: number;
  /**
   * Schwerstes Gewicht (max stroke-width). Eich-Anker: Hilfslinien müssen
   * ≥ maxStroke/2 von den Box-Rändern weg sein, sonst clippt das fetteste Gewicht.
   */
  maxStroke: number;
}

/** Ein benanntes Gewicht = eine stroke-width. Kein eigener Glyph-Satz. */
export interface FontWeight {
  name: string;
  stroke: number;
}

/**
 * Ein Teil-Strich eines Glyphs. Erlaubt es, Teile (Akzente, der innere Ring im
 * `@`) in EINER ANDEREN relativen Strichstärke zu führen — OHNE das „Gewicht =
 * ein Parameter"-Modell aufzugeben: `w` ist ein FAKTOR auf das globale Gewicht,
 * kein absoluter Wert. So bleibt das Verhältnis zweier Stärken über alle Gewichte
 * konstant. Der dickste Layer ist die Basis (w = 1), dünnere bekommen w < 1.
 */
export interface GlyphStroke {
  /** SVG-Pfad-`d` der Mittellinie, im Koordinatenraum 0..advance × 0..boxHeight. */
  d: string;
  /** Gewichts-Faktor relativ zum Basis-Gewicht (Default 1 = Basis). */
  w?: number;
  /** Optionale Transform-Matrix (aus Gruppen-/Pfad-Transform beim Import). */
  transform?: string;
}

/** Ein Glyph = eine oder mehrere Mittellinien plus seine Vorschubbreite. */
export interface GlyphDef {
  /** Vorschubbreite (advance) inkl. eigener Seitenbänder, in User-Units. */
  advance: number;
  /** Kurzform für einen einzelnen Strich (Faktor 1). Entweder `d` ODER `strokes`. */
  d?: string;
  /** Mehrere Teil-Striche mit eigenem relativen Gewicht (@, Diakritika). */
  strokes?: GlyphStroke[];
  /** true bei akzentuierten Zeichen — nutzt die Akzent-Zone über capY. */
  hasAccent?: boolean;
}

export interface FontModel {
  name: string;
  metrics: FontMetrics;
  /** Benannte Gewichte, aufsteigend nach stroke. Das letzte = maxStroke-Anker. */
  weights: FontWeight[];
  /** Kursiv-Neigung in Grad (leicht, ≈6–10° → Handschrift-Anmutung). */
  italicSkewDeg: number;
  /**
   * Glyphen nach Schlüssel. Schlüssel = das Zeichen selbst (A–Z, 0–9, a–z) oder
   * ein ASCII-Token für Sonderzeichen (Auml, Ouml, Uuml, sz, comma, …), das per
   * `tokens` auf das echte Zeichen abgebildet wird.
   */
  glyphs: Record<string, GlyphDef>;
  /** Token→Zeichen für Sonderzeichen, die man nicht als Dateinamen tippen will. */
  tokens: Record<string, string>;
}
