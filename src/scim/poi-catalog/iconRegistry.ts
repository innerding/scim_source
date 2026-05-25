// Icon-Registry (ann_040 + ann_041 — Phase B).
// Lädt zur Build-Zeit alle SVG-Dateien aus data/icons/ via Vite-Glob.
// Pro Datei werden zwei Namen extrahiert (dual-naming):
//   - file_name (z.B. "Aussichtspunkt") — was das Icon im Katalog REPRÄSENTIERT
//   - drawing_id (z.B. "fernglas")     — was tatsächlich GEZEICHNET ist (Group-ID)
//
// Beide Namen sind suchbar; dasselbe Drawing kann unter mehreren file_names
// auftreten. Die Registry-Eintrags-id ist immer file_name (eindeutig).

import { cleanIconSvg } from './svgCleaner';

export interface IconRegistryEntry {
  id: string;            // = file_name; eindeutig pro Bibliothek
  file_name: string;     // 'Aussichtspunkt' (ohne .svg-Endung)
  drawing_id: string | null;  // bei <g>-Icons aus <g id="…">; bei Strich-only-
                              // Icons aus dem id der Wurzel-Form
                              // (path/polyline/etc.); null nur wenn nirgends id
  is_stroke_only: boolean;    // true wenn das SVG keine <g>-Gruppe hat
                              // (Sonderregel aus ann_040)
  svg_raw: string;       // unveränderter SVG-Inhalt aus der Datei
  svg_cleaned: string;   // bereinigte Version (Cleaner angewendet)
  cleaning_changes: string[];  // was der Cleaner verändert hat
  warnings: string[];    // verbleibende Spec-Abweichungen nach Cleaning
}

// Vite lädt alle .svg-Dateien im Ordner als String zur Build-Zeit.
// Pfad ist relativ zu dieser Datei: src/scim/poi-catalog → 3× hoch → /data/icons
const modules = import.meta.glob<string>('../../../data/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function fileNameFromPath(path: string): string {
  const parts = path.split('/');
  const file = parts[parts.length - 1];
  return file.replace(/\.svg$/i, '');
}

// Drawing-ID-Extraktion:
//  - Primär: <g id="…"> der Top-Level-Gruppe (normaler Icon-Fall)
//  - Fallback (Strich-only-Icons ohne <g>): id der ersten Wurzel-Form
//    (path/polyline/polygon/line/rect/circle), damit auch diese Icons
//    einen sprechenden drawing_id-Namen tragen.
function extractDrawingId(svg: string): string | null {
  const groupMatch = svg.match(/<g\s+[^>]*\bid="([^"]+)"/);
  if (groupMatch) return groupMatch[1];
  const rootShapeMatch = svg.match(/<(?:path|polyline|polygon|line|rect|circle)\s+[^>]*\bid="([^"]+)"/);
  return rootShapeMatch ? rootShapeMatch[1] : null;
}

function hasGroup(svg: string): boolean {
  return /<g\s+[^>]*\bid="/.test(svg);
}

function liteValidate(svg: string): string[] {
  const warnings: string[] = [];
  // viewBox 0 0 48 48 erwartet
  if (!/viewBox\s*=\s*"0\s+0\s+48\s+48"/.test(svg)) {
    warnings.push('viewBox ≠ "0 0 48 48"');
  }

  // Sonderregel (ann_040): SVG ohne <g id="…"> ist erlaubt — die Stroke-Elemente
  // auf Root-Ebene gelten dann implizit als Stroke-Layer. fill-Layer entfällt.
  // Als gültige Stroke-Elemente zählen: <path>, <polyline>, <line>, <polygon>.
  const hasGroup = /<g\s+[^>]*\bid="/.test(svg);
  if (hasGroup) {
    // Layer-IDs sind case-insensitive. Als Fill/Stroke-Element zählen alle
    // gängigen Form-Elemente — Illustrator exportiert je nach Original-Form
    // mal <path>, mal <rect>, mal <polygon>, mal eine Gruppe.
    const layerEls = '(path|rect|polygon|polyline|circle|g)';

    // Fill-Layer: muss existieren und darf kein echtes stroke-Attribut tragen
    // (vergessene Strich-Attribute aus Illustrator-Workflows fangen).
    const fillRe = new RegExp(`<${layerEls}[^>]*\\bid="fill"[^>]*>`, 'i');
    const fillMatch = fillRe.exec(svg);
    if (!fillMatch) {
      warnings.push('Layer "fill" nicht gefunden');
    } else {
      const strokeAttr = fillMatch[0].match(/\bstroke="([^"]*)"/i);
      if (strokeAttr && strokeAttr[1].trim().toLowerCase() !== 'none') {
        warnings.push(`Fill-Layer hat unerwartetes stroke="${strokeAttr[1]}" (sollte fehlen oder "none" sein)`);
      }
    }

    // Stroke-Layer: muss existieren und darf kein echtes fill-Attribut tragen.
    const strokeRe = new RegExp(`<${layerEls}[^>]*\\bid="stroke"[^>]*>`, 'i');
    const strokeMatch = strokeRe.exec(svg);
    if (!strokeMatch) {
      warnings.push('Layer "stroke" nicht gefunden');
    } else {
      const fillAttr = strokeMatch[0].match(/\bfill="([^"]*)"/i);
      if (fillAttr && fillAttr[1].trim().toLowerCase() !== 'none') {
        warnings.push(`Stroke-Layer hat unerwartetes fill="${fillAttr[1]}" (sollte fehlen oder "none" sein)`);
      }
    }
  } else {
    // Mindestens ein Stroke-Element wird verlangt.
    const hasStrokeElement = /<(path|polyline|polygon|line)\b/.test(svg);
    if (!hasStrokeElement) warnings.push('Kein Stroke-Element gefunden (path/polyline/polygon/line)');
  }

  // Illustrator-Preview-Metadaten auf Root-SVG?
  if (/<svg[^>]*\bid="kbc-/.test(svg)) warnings.push('Illustrator-Preview-ID am Root-SVG (sollte bereinigt werden)');
  return warnings;
}

function buildRegistry(): IconRegistryEntry[] {
  const entries: IconRegistryEntry[] = [];
  for (const [path, svgRaw] of Object.entries(modules)) {
    const file_name = fileNameFromPath(path);
    const { cleaned, changes } = cleanIconSvg(svgRaw);
    entries.push({
      id: file_name,
      file_name,
      drawing_id: extractDrawingId(svgRaw),
      is_stroke_only: !hasGroup(svgRaw),
      svg_raw: svgRaw,
      svg_cleaned: cleaned,
      cleaning_changes: changes,
      // Validierung läuft auf der bereinigten Version — der Cleaner hat
      // Phantom-Attribute schon entfernt, übrig bleiben echte Struktur-Probleme.
      warnings: liteValidate(cleaned),
    });
  }
  // Stabile alphabetische Sortierung nach file_name
  entries.sort((a, b) => a.file_name.localeCompare(b.file_name, 'de'));
  return entries;
}

export const ICON_REGISTRY: IconRegistryEntry[] = buildRegistry();

// ─── Suche über beide Namen ──────────────────────────────────────────────────

export function findIcons(query: string): IconRegistryEntry[] {
  const q = query.trim().toLowerCase();
  if (q === '') return ICON_REGISTRY;
  return ICON_REGISTRY.filter((e) =>
    e.file_name.toLowerCase().includes(q) ||
    (e.drawing_id ?? '').toLowerCase().includes(q),
  );
}

export function iconById(id: string): IconRegistryEntry | undefined {
  return ICON_REGISTRY.find((e) => e.id === id);
}
