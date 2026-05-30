// Runtime-Parser für POI-Plan-Markdown nach PoiCatalogState.
// Erwartet die Struktur von data/gruenberg_pois_plan.md:
//   ### <Subcategory>
//   | Icon | Text | Coord | Cluster | Status |
//   |---|---|---|---|---|
//   | ... data rows ... |
//
// Cluster-Tabellen folgen unter ## Cluster mit `### <ClusterName> *(N POIs)*`
// und Hover-Text-Marker `**Hover:** „..."`

import type {
  CatalogCluster, CatalogPoi, CoordStatus, PoiCatalogState, Subcategory,
} from './poiCatalog.types';
import { bucketOf, containerOf } from './poiCatalog.containerSystem';
import { isToken, sanitizeSlug, sanitizeVerbund, verbundOf } from './poiCatalog.token';

interface ParseOptions {
  region_id: string;
  region_name: string;
  source_path: string;
}

const SUBCATEGORIES: readonly Subcategory[] = [
  'Points_historical', 'Points_others',
  'Square_Rest', 'Square_Move',
  'Regenerate_Substanze', 'Regenerate_Water',
  'Transport_Vehicle', 'Transport_Parking',
  'Service_Sleep', 'Service_Others',
  'Help_order', 'Help_emergency',
  'Cluster',  // Ghost-POIs (ann_048)
];

// `Transport_Parking/(Charging)` in the md → normalize to `Transport_Parking`
function normalizeSubHeading(s: string): Subcategory | null {
  const trimmed = s.trim().replace(/\/\(.*\)$/, '');
  return (SUBCATEGORIES as readonly string[]).includes(trimmed) ? (trimmed as Subcategory) : null;
}

function parseRow(line: string): string[] {
  const cells = line.split('|').map((c) => c.trim());
  // First and last are empty around the outer pipes
  return cells.slice(1, -1);
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|\s*[-:\s|]+\|\s*$/.test(line);
}

function parseCoord(s: string): { coord: [number, number]; status: CoordStatus } {
  const trimmed = s.trim();
  if (trimmed === '❓' || trimmed === '') {
    return { coord: [0, 0], status: 'missing' };
  }
  const cleaned = trimmed
    .replace(/^≈\s*/, '')
    .replace(/^✓\s*/, '');
  const match = cleaned.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  if (!match) {
    return { coord: [0, 0], status: 'missing' };
  }
  const lon = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  const status: CoordStatus = trimmed.startsWith('≈') ? 'estimated' : 'exact';
  return { coord: [lon, lat], status };
}

function parseStatus(s: string): CoordStatus {
  const t = s.trim().toLowerCase();
  if (t === 'cluster_ghost' || t.includes('ghost')) return 'cluster_ghost';
  if (t.includes('❓')) return 'missing';
  if (t.includes('≈')) return 'estimated';
  if (t.includes('✓')) return 'exact';
  return 'exact';
}

function parseCluster(s: string): { name?: string; is_identity: boolean; note?: string } {
  const t = s.trim();
  if (t === '—' || t === '') return { is_identity: false };
  const identityMatch = t.match(/^(.+?)\s*\*\(Cluster-Icon\)\*$/);
  if (identityMatch) {
    return { name: identityMatch[1].trim(), is_identity: true };
  }
  const optionalMatch = t.match(/^\((.+)\)$/);
  if (optionalMatch) {
    return { name: optionalMatch[1].trim(), is_identity: false, note: 'optional' };
  }
  return { name: t.replace(/\*.*\*/g, '').trim(), is_identity: false };
}

function stripMdInline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim();
}

export function parsePoiCatalog(md: string, opts: ParseOptions): PoiCatalogState {
  const lines = md.split('\n');
  const pois: CatalogPoi[] = [];
  const clusters: CatalogCluster[] = [];
  const warnings: string[] = [];

  // Token-Präfix aus der Header-Zeile `**Token-Präfix:** <verbund> · <slug>`.
  // Default: verbundOf(region_id) bzw. region_id, damit Bestandskataloge ohne
  // die Zeile genau das bisherige Verhalten behalten.
  let tokenVerbund = verbundOf(opts.region_id);
  let tokenSlug = sanitizeSlug(opts.region_id) || opts.region_id;
  const prefixMatch = md.match(/^\*\*Token-Präfix:\*\*\s*([a-z0-9]{1,4})\s*·\s*([a-z0-9]{1,12})/m);
  if (prefixMatch) {
    tokenVerbund = sanitizeVerbund(prefixMatch[1]) || tokenVerbund;
    tokenSlug = sanitizeSlug(prefixMatch[2]) || tokenSlug;
  }

  let i = 0;
  let currentSub: Subcategory | null = null;
  let poiCounter = 0;
  let warnedMissingCode = false;
  let inClusterSection = false;
  let currentClusterName: string | null = null;

  while (i < lines.length) {
    const line = lines[i];

    // Detect Cluster section
    if (/^##\s+Cluster\s*$/.test(line)) {
      inClusterSection = true;
      currentSub = null;
      i++;
      continue;
    }

    // Detect next major section after clusters
    if (inClusterSection && /^##\s+(?!Cluster)/.test(line)) {
      inClusterSection = false;
    }

    if (inClusterSection) {
      // Cluster heading: ### <Name> *(<n> POIs)*  or  ### Optional <Name> *(...)*
      const clusterHeadMatch = line.match(/^###\s+(?:Optional\s+)?(.+?)\s*\*\((\d+)\s*POIs?(?:,\s*[^)]*)?\)\*\s*$/);
      if (clusterHeadMatch) {
        currentClusterName = clusterHeadMatch[1].trim();
        // Cluster sofort registrieren (frueher: erst nach **Hover:**-Match,
        // hover_text wurde Mai 2026 entfernt). member_count wird unten
        // re-counted nach komplettem Parsen.
        clusters.push({
          name: currentClusterName,
          member_count: 0,
        });
        i++;
        continue;
      }
      // Hover-Zeilen aus alten md still durchwinken (Tolerance, ignorierter Inhalt)
      i++;
      continue;
    }

    // Subcategory heading
    const subMatch = line.match(/^###\s+([A-Za-z_/()]+)(?:\s+\*.*\*)?\s*$/);
    if (subMatch) {
      const candidate = normalizeSubHeading(subMatch[1]);
      currentSub = candidate;
      i++;
      continue;
    }

    // Reset subcategory when a different ## section starts
    if (/^##\s+/.test(line) && !/^##\s+Tabelle 1/.test(line)) {
      currentSub = null;
    }

    // Table row processing (within a subcategory)
    if (currentSub && line.trim().startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      // Code-Spalte STRUKTURELL an der Kopfzeile erkennen, nicht am Inhalt der
      // ersten Zelle. Sonst verrutschen Tabellen, deren Code keine Token sind
      // (z.B. poi_NNN bei noch nicht migrierten Regionen wie Lichtenberg) — die
      // Code-Zelle würde als Icon gelesen und alle Spalten kippen um eins.
      const headerCells = parseRow(line);
      const hasCodeColumn = headerCells.length > 0 && headerCells[0].trim().toLowerCase() === 'code';
      // Skip header + separator
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = parseRow(lines[i]);
        // Wenn die Tabelle eine Code-Spalte hat, ist die erste Zelle IMMER der
        // Code (Token oder poi_NNN) und wird abgetrennt. Als stabile id zählt
        // sie nur, wenn sie ein echter Fixstern-Token ist; poi_NNN → Fallback.
        const codeCell = hasCodeColumn && cells.length >= 1 ? cells[0].trim() : null;
        const codeId = codeCell && isToken(codeCell) ? codeCell : null;
        const body = hasCodeColumn ? cells.slice(1) : cells;
        // 5 Spalten (alt):  Icon | Tagline | Coord | Cluster | Status
        // 6 Spalten (neu):  Icon | Tagline | Description | Coord | Cluster | Status
        const isNew = body.length >= 6;
        const minCells = isNew ? 6 : 5;
        if (body.length >= minCells) {
          const icon = stripMdInline(body[0]);
          const text = stripMdInline(body[1].replace(/\s*\*\([^)]*\)\*$/, ''));
          const rawNotesMatch = body[1].match(/\*\(([^)]+)\)\*/);
          const rawNotes = rawNotesMatch ? rawNotesMatch[1] : undefined;
          // Description-Spalte nur im neuen Format vorhanden
          const description_short = isNew
            ? (stripMdInline(body[2]) || undefined)
            : undefined;
          const coordIdx   = isNew ? 3 : 2;
          const clusterIdx = isNew ? 4 : 3;
          const statusIdx  = isNew ? 5 : 4;
          const { coord, status: coordStatus } = parseCoord(body[coordIdx]);
          const cluster = parseCluster(body[clusterIdx]);
          const statusFromCol = parseStatus(body[statusIdx]);

          let id: string;
          if (codeId) {
            id = codeId;
          } else {
            poiCounter++;
            id = `poi_${String(poiCounter).padStart(3, '0')}`;
            if (!warnedMissingCode) {
              warnings.push('Mindestens ein POI ohne Fixstern-Code — positioneller Fallback poi_NNN aktiv, Migration ausstehend.');
              warnedMissingCode = true;
            }
          }

          const bucket = bucketOf(currentSub);
          if (!bucket) {
            warnings.push(`Subkategorie ohne Container-Mapping: ${currentSub}`);
            i++;
            continue;
          }

          // Status-Auflösung: 'cluster_ghost' aus Status-Spalte gewinnt immer
          // (überschreibt missing/exact/estimated aus der Coord-Spalte).
          let finalStatus: CoordStatus;
          if (statusFromCol === 'cluster_ghost') finalStatus = 'cluster_ghost';
          else if (coordStatus === 'missing') finalStatus = 'missing';
          else finalStatus = statusFromCol;

          pois.push({
            id,
            bucket,
            subcategory: currentSub,
            icon,
            text,
            description_short,
            coord,
            coord_status: finalStatus,
            cluster: cluster.name,
            is_cluster_identity: cluster.is_identity,
            raw_notes: rawNotes,
          });
        }
        i++;
      }
      continue;
    }

    i++;
  }

  // Recount cluster members after all POIs parsed
  for (const c of clusters) {
    c.member_count = pois.filter((p) => p.cluster === c.name).length;
    const identityPoi = pois.find((p) => p.cluster === c.name && p.is_cluster_identity);
    if (identityPoi) c.identity_poi_id = identityPoi.id;
  }

  // Ghost-Coord-Vererbung (ann_048): jeder cluster_ghost-POI erbt die Coord
  // vom cluster.id-POI im selben Cluster. Wenn kein Parent gefunden, bleibt
  // [0,0] und Warnung wird ausgegeben.
  for (const ghost of pois.filter((p) => p.coord_status === 'cluster_ghost')) {
    if (!ghost.cluster) {
      warnings.push(`Ghost-POI ${ghost.id} (${ghost.text}) ohne Cluster-Zuordnung — Coord bleibt [0,0]`);
      continue;
    }
    const parent = pois.find((p) => p.cluster === ghost.cluster && p.is_cluster_identity);
    if (!parent) {
      warnings.push(`Ghost-POI ${ghost.id} (${ghost.text}) im Cluster "${ghost.cluster}" hat keinen Parent (kein POI mit cluster.id ✓) — Coord bleibt [0,0]`);
      continue;
    }
    ghost.coord = [parent.coord[0], parent.coord[1]];
  }

  // Sanity-Warnings
  for (const p of pois) {
    if (!containerOf(p.subcategory)) {
      warnings.push(`POI ${p.id} (${p.text}): Subkategorie ${p.subcategory} ohne Container-Spec`);
    }
  }
  for (const p of pois.filter((p) => p.cluster)) {
    if (!clusters.find((c) => c.name === p.cluster)) {
      warnings.push(`POI ${p.id} (${p.text}) verweist auf Cluster "${p.cluster}", der nicht als ### definiert ist`);
    }
  }

  // Multi-Identity-Check: pro Cluster darf nur EIN POI is_cluster_identity tragen.
  // Wenn mehrere gesetzt sind, picken Parser/Renderer den ersten — undefined,
  // also explizit warnen.
  const identityCounts = new Map<string, { count: number; texts: string[] }>();
  for (const p of pois.filter((p) => p.is_cluster_identity && p.cluster)) {
    const c = identityCounts.get(p.cluster!) ?? { count: 0, texts: [] };
    c.count++;
    c.texts.push(`${p.text} (${p.id})`);
    identityCounts.set(p.cluster!, c);
  }
  for (const [clusterName, info] of identityCounts) {
    if (info.count > 1) {
      warnings.push(`Cluster "${clusterName}" hat ${info.count} Identity-POIs (sollte 1 sein): ${info.texts.join(', ')}`);
    }
  }

  return {
    region_id: opts.region_id,
    region_name: opts.region_name,
    token_verbund: tokenVerbund,
    token_slug: tokenSlug,
    generated_at: new Date().toISOString(),
    pois,
    clusters,
    source: { type: 'markdown_runtime', path: opts.source_path },
    warnings,
  };
}
