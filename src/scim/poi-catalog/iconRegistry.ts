// Icon-Registry (ann_040 + ann_041 — Phase B).
// Lädt zur Build-Zeit alle SVG-Dateien aus data/icons/ via Vite-Glob.
// Pro Datei werden zwei Namen extrahiert (dual-naming):
//   - file_name (z.B. "Aussichtspunkt") — was das Icon im Katalog REPRÄSENTIERT
//   - drawing_id (z.B. "fernglas")     — was tatsächlich GEZEICHNET ist (Group-ID)
//
// Beide Namen sind suchbar; dasselbe Drawing kann unter mehreren file_names
// auftreten. Die Registry-Eintrags-id ist immer file_name (eindeutig).

export interface IconRegistryEntry {
  id: string;            // = file_name; eindeutig pro Bibliothek
  file_name: string;     // 'Aussichtspunkt' (ohne .svg-Endung)
  drawing_id: string | null;  // aus <g id="…"> im SVG; null wenn nicht gefunden
  svg_raw: string;       // unveränderter SVG-Inhalt
  warnings: string[];    // Spec-Abweichungen, leichtgewichtig erkannt
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

function extractDrawingId(svg: string): string | null {
  const match = svg.match(/<g\s+[^>]*\bid="([^"]+)"/);
  return match ? match[1] : null;
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
    if (!/<path[^>]*\bid="fill"/.test(svg)) warnings.push('Layer "fill" nicht gefunden');
    if (!/<path[^>]*\bid="stroke"/.test(svg)) warnings.push('Layer "stroke" nicht gefunden');
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
    entries.push({
      id: file_name,
      file_name,
      drawing_id: extractDrawingId(svgRaw),
      svg_raw: svgRaw,
      warnings: liteValidate(svgRaw),
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
