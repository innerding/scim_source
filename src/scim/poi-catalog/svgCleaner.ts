// SVG-Cleaner für POI-Icons.
// Macht aus einem rohen Illustrator-Export ein sauberes, kanonisches SVG.
// Nicht-destruktiv für das Quellfile — der Cleaner produziert eine neue
// Version als String. Wer schreiben will (z.B. der Phase-E-Importer), nimmt
// die zurückgegebene `cleaned`.
//
// Eingriffe (jeder zählt als ein Eintrag in `changes`):
//   - Phantom-stroke vom Fill-Layer entfernen (samt orphaned stroke-* Attribute)
//   - Phantom-fill vom Stroke-Layer entfernen (außer "none")
//   - Illustrator-Root-IDs strippen (SCIM3_POI_Icons, Ebene_X, Layer_X, kbc-*)
//   - Root-data-name entfernen
//   - Root width/height entfernen (für responsive Skalierung im DOM)
//   - Copyright-Stempel idempotent injizieren:
//       Kommentar    <!-- © YYYY diesenpark.com · SCIM3 POI Icon -->
//       data-source  am Root: "diesenpark.com"
//       data-year    am Root: aktueller Jahreswert

export interface CleanResult {
  cleaned: string;
  changes: string[];
}

const SOURCE_MARK = 'diesenpark.com';
const LAYER_ELS = '(path|rect|polygon|polyline|circle|g)';

function stripExistingCopyright(svg: string): string {
  // Entferne bestehende © diesenpark.com-Kommentare am Anfang.
  return svg.replace(/<!--\s*©\s*\d{4}\s*diesenpark\.com[^>]*-->\s*/gi, '');
}

function stripRootAttribute(svg: string, attrName: string): { svg: string; removed: string | null } {
  const re = new RegExp(`(<svg[^>]*?)\\s+${attrName}="([^"]*)"`, 'i');
  const match = re.exec(svg);
  if (!match) return { svg, removed: null };
  return { svg: svg.replace(re, '$1'), removed: match[2] };
}

function stripIllustratorRootId(svg: string): { svg: string; removed: string | null } {
  // Bekannte Illustrator-Muster auf dem Root-SVG: id="SCIM3_POI_Icons",
  // id="Ebene_2", id="Layer_1", id="kbc-…"
  const re = /(<svg[^>]*?)\s+id="(SCIM3_POI_Icons|Ebene_\d+|Layer_\d+|kbc-[^"]*)"/i;
  const match = re.exec(svg);
  if (!match) return { svg, removed: null };
  return { svg: svg.replace(re, '$1'), removed: match[2] };
}

// Bekanntes Illustrator-Problem: das Programm exportiert manchmal eine Gruppe
// mit korrekt benanntem fill-Pfad, ABER der Stroke-Pfad bleibt ohne id="stroke".
// Wenn klar erkennbar (Pfad ohne id, mit stroke="X" non-none), tagen wir ihn
// nachträglich. Heuristik: nur tun, wenn (a) noch kein id="stroke" existiert
// und (b) ein id="fill" existiert (= wir sind in einem klassischen Fill+Stroke-
// Icon, nicht in einem strich-only nach Sonderregel).
function tagUnnamedStrokeLayer(svg: string): { svg: string; strokeValue: string | null } {
  if (/<path[^>]*\bid="stroke"/i.test(svg)) return { svg, strokeValue: null };
  if (!/<path[^>]*\bid="fill"/i.test(svg)) return { svg, strokeValue: null };

  const pathRe = /<path\s+[^>]*?(?:\/>|>)/g;
  let match: RegExpExecArray | null;
  while ((match = pathRe.exec(svg)) !== null) {
    const pathTag = match[0];
    // Hat schon eine id? Skip.
    if (/\bid=/.test(pathTag)) continue;
    // Stroke vorhanden und nicht "none"?
    const strokeMatch = pathTag.match(/\bstroke="([^"]+)"/i);
    if (!strokeMatch) continue;
    if (strokeMatch[1].trim().toLowerCase() === 'none') continue;
    // Treffer: id="stroke" voranstellen.
    const newPathTag = pathTag.replace(/^<path/, '<path id="stroke"');
    const newSvg = svg.substring(0, match.index) + newPathTag + svg.substring(match.index + pathTag.length);
    return { svg: newSvg, strokeValue: strokeMatch[1] };
  }
  return { svg, strokeValue: null };
}

function stripPhantomStrokeFromFill(svg: string): { svg: string; removed: string | null } {
  // Sucht Element mit id="fill" (case-insensitive); wenn ein stroke="…"
  // dranhängt (Wert != none), wird es samt orphan-stroke-* Attributen entfernt.
  const re = new RegExp(`<${LAYER_ELS}[^>]*\\bid="fill"[^>]*>`, 'i');
  const match = re.exec(svg);
  if (!match) return { svg, removed: null };
  const opening = match[0];
  const strokeAttr = opening.match(/\bstroke="([^"]*)"/i);
  if (!strokeAttr || strokeAttr[1].trim().toLowerCase() === 'none') {
    return { svg, removed: null };
  }
  // Entfernen: stroke + alle orphan stroke-* Attribute am selben Tag.
  let cleanedOpening = opening
    .replace(/\s+stroke="[^"]*"/i, '')
    .replace(/\s+stroke-(width|linecap|linejoin|miterlimit|dasharray|dashoffset|opacity)="[^"]*"/gi, '');
  return { svg: svg.replace(opening, cleanedOpening), removed: strokeAttr[1] };
}

function stripPhantomFillFromStroke(svg: string): { svg: string; removed: string | null } {
  const re = new RegExp(`<${LAYER_ELS}[^>]*\\bid="stroke"[^>]*>`, 'i');
  const match = re.exec(svg);
  if (!match) return { svg, removed: null };
  const opening = match[0];
  const fillAttr = opening.match(/\bfill="([^"]*)"/i);
  if (!fillAttr || fillAttr[1].trim().toLowerCase() === 'none') {
    return { svg, removed: null };
  }
  // Den unerwarteten Fill durch ein sauberes fill="none" ersetzen.
  const cleanedOpening = opening.replace(/\bfill="[^"]*"/i, 'fill="none"');
  return { svg: svg.replace(opening, cleanedOpening), removed: fillAttr[1] };
}

function injectCopyright(svg: string, year: number): string {
  // Bestehende data-source/data-year am Root vorher rausnehmen (Idempotenz)
  let result = svg
    .replace(/(<svg[^>]*?)\s+data-source="[^"]*"/i, '$1')
    .replace(/(<svg[^>]*?)\s+data-year="[^"]*"/i, '$1');

  // data-Attribute am Root injizieren (vor dem schließenden '>').
  result = result.replace(/<svg([^>]*?)>/, `<svg$1 data-source="${SOURCE_MARK}" data-year="${year}">`);

  // Kommentar nach der XML-Deklaration einfügen, oder am Anfang wenn keine da.
  const comment = `<!-- © ${year} ${SOURCE_MARK} · SCIM3 POI Icon -->`;
  if (/<\?xml[^>]*\?>/.test(result)) {
    result = result.replace(/(<\?xml[^>]*\?>)\s*/, `$1\n${comment}\n`);
  } else {
    result = `${comment}\n${result}`;
  }
  return result;
}

// Tabler-Adapter (https://tabler.io/icons).
// Tabler liefert 24×24-viewBox-Icons mit stroke="currentColor", optional einem
// transparenten 24×24-Platzhalter-Pfad als "Hitbox", und einem Klassen-Attribut
// wie 'icon-tabler-<name>'. Wir adaptieren das automatisch in SCIM-Format:
//   - viewBox 0 0 24 24 → 0 0 48 48
//   - Inhalte in <g transform="translate(12,12)"> zentriert (Größe bleibt!)
//   - currentColor → #000
//   - Platzhalter-Pfad (d="M0 0h24v24H0z") entfernt
//   - drawing-id aus 'icon-tabler-<name>' extrahiert und auf die wrapping Gruppe gesetzt
function adaptTablerIfNeeded(svg: string): { svg: string; changes: string[] } {
  const changes: string[] = [];
  const isTabler =
    /viewBox\s*=\s*"0\s+0\s+24\s+24"/.test(svg) || /icon-tabler/.test(svg);
  if (!isTabler) return { svg, changes };

  // drawing-id aus Klasse 'icon-tabler-<name>' ableiten, falls vorhanden
  const classMatch = svg.match(/icon-tabler-([a-z0-9-]+)/);
  const drawingId = classMatch ? classMatch[1] : null;

  // Inhalt zwischen <svg ...> und </svg> extrahieren
  const innerMatch = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (!innerMatch) return { svg, changes };
  let inner = innerMatch[1];

  // Tabler-Hintergrund-Platzhalter strippen
  const placeholderRe = /<path[^>]*stroke="none"[^>]*d="M0\s+0h24v24H0z"[^>]*\/?>(?:\s*<\/path>)?\s*/g;
  if (placeholderRe.test(inner)) {
    inner = inner.replace(placeholderRe, '');
    changes.push('Tabler-Hintergrund-Platzhalter entfernt');
  }

  // currentColor → #000
  if (/currentColor/.test(inner)) {
    inner = inner.replace(/currentColor/g, '#000');
    changes.push('Tabler currentColor → #000');
  }

  // Neues SCIM-konformes SVG aufbauen: 48×48 viewBox, Inhalte translate(12,12)
  const groupAttrs = [
    drawingId ? `id="${drawingId}"` : '',
    'transform="translate(12,12)"',
    'fill="none"',
    'stroke="#000"',
    'stroke-width="1"',
    'stroke-linecap="round"',
    'stroke-linejoin="round"',
  ].filter(Boolean).join(' ');

  const newSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g ${groupAttrs}>${inner.trim()}</g></svg>`;

  changes.push('Tabler-Adapter: 24×24 in 48×48-viewBox zentriert (translate 12,12)');
  if (drawingId) changes.push(`Drawing-ID '${drawingId}' aus Tabler-Klasse uebernommen`);

  return { svg: newSvg, changes };
}

export function cleanIconSvg(raw: string): CleanResult {
  let svg = raw;
  const changes: string[] = [];

  // -1) Tabler-Adapter: wenn das Input eine Tabler-SVG ist, in SCIM-Format wandeln
  const adapted = adaptTablerIfNeeded(svg);
  svg = adapted.svg;
  changes.push(...adapted.changes);

  // 0) Bestehende Copyright-Kommentare wegputzen (für Idempotenz)
  const beforeCopyrightStrip = svg;
  svg = stripExistingCopyright(svg);
  // Kein Eintrag in changes — das ist nur Vorbereitung, kein eigener Fix.

  // 1) Illustrator-Root-ID
  {
    const r = stripIllustratorRootId(svg);
    svg = r.svg;
    if (r.removed) changes.push(`Illustrator-Root-ID entfernt (${r.removed})`);
  }

  // 2) data-name am Root
  {
    const r = stripRootAttribute(svg, 'data-name');
    svg = r.svg;
    if (r.removed !== null) changes.push('Root-data-name entfernt');
  }

  // 3) width/height am Root (für responsive Skalierung)
  {
    const r1 = stripRootAttribute(svg, 'width');
    svg = r1.svg;
    if (r1.removed !== null) changes.push(`Root-width entfernt (${r1.removed})`);
    const r2 = stripRootAttribute(svg, 'height');
    svg = r2.svg;
    if (r2.removed !== null) changes.push(`Root-height entfernt (${r2.removed})`);
  }

  // 3.5) Unbenannten Stroke-Layer nachträglich mit id="stroke" taggen
  //      (klassisches Illustrator-Export-Problem: Fill bekommt id, Stroke nicht)
  {
    const r = tagUnnamedStrokeLayer(svg);
    svg = r.svg;
    if (r.strokeValue) {
      changes.push(`Stroke-Layer-ID 'stroke' nachgetragen (Pfad war ohne id, hatte stroke="${r.strokeValue}")`);
    }
  }

  // 4) Phantom-stroke am Fill-Layer
  {
    const r = stripPhantomStrokeFromFill(svg);
    svg = r.svg;
    if (r.removed) changes.push(`Phantom-stroke="${r.removed}" am Fill-Layer entfernt`);
  }

  // 5) Phantom-fill am Stroke-Layer
  {
    const r = stripPhantomFillFromStroke(svg);
    svg = r.svg;
    if (r.removed) changes.push(`Phantom-fill="${r.removed}" am Stroke-Layer durch "none" ersetzt`);
  }

  // 6) Copyright-Stempel idempotent injizieren
  const year = new Date().getFullYear();
  const before = svg;
  svg = injectCopyright(svg, year);
  if (before !== svg || beforeCopyrightStrip !== svg) {
    // Aktualisierung des Stempels ist erwähnenswert, auch wenn nur das Jahr
    // geändert wurde — das ist Teil der Wartung.
    changes.push(`Copyright-Stempel © ${year} ${SOURCE_MARK} gesetzt`);
  }

  return { cleaned: svg, changes };
}
