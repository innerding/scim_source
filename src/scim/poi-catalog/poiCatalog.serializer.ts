// Serializer: regeneriert `## Tabelle 1` (POI-Liste) und `## Cluster` aus dem
// gemergten Editor-Stand und ersetzt nur diese Bereiche im Original-Markdown.
// Tabelle 2, Tabelle 3, Konventionen und Notiz bleiben wörtlich erhalten.
//
// Reihenfolge der POIs in Tabelle 1: gemäß CONTAINER_SYSTEM-Reihenfolge der
// Subkategorien, innerhalb jeder Subkategorie in der Reihenfolge wie im
// MergedCatalog (Plan-POIs zuerst, neue POIs hinten).

import { CONTAINER_SYSTEM } from './poiCatalog.containerSystem';
import type {
  CatalogPoi, MergedCatalog, MergedPoi, Subcategory,
} from './poiCatalog.types';

interface DiffLine {
  kind: 'add' | 'del' | 'ctx';
  text: string;
}

// ─── Hilfen ───────────────────────────────────────────────────────────────────

function fmtCoord(p: CatalogPoi): string {
  if (p.coord_status === 'cluster_ghost') return '↑';
  if (p.coord_status === 'missing') return '❓';
  return `${p.coord[0].toFixed(5)}, ${p.coord[1].toFixed(5)}`;
}

function fmtStatus(p: CatalogPoi): string {
  switch (p.coord_status) {
    case 'exact':         return '✓';
    case 'estimated':     return '≈';
    case 'missing':       return '❓';
    case 'cluster_ghost': return 'cluster_ghost';
  }
}

function fmtClusterCell(p: CatalogPoi, clustersWithIdentity: Set<string>): string {
  if (!p.cluster) return '—';
  if (p.is_cluster_identity) return `${p.cluster} *(Cluster-Icon)*`;
  // Optional-Cluster (kein identity-POI) → in Klammern
  if (!clustersWithIdentity.has(p.cluster)) return `(${p.cluster})`;
  return p.cluster;
}

function fmtText(p: CatalogPoi): string {
  if (p.raw_notes) return `${p.text} *(${p.raw_notes})*`;
  return p.text;
}

// Subkategorien-Heading wie im Plan: Transport_Parking → "Transport_Parking/(Charging)"
function subHeading(sub: Subcategory): string {
  if (sub === 'Transport_Parking') return 'Transport_Parking/(Charging)';
  return sub;
}

// Wenn ein Ghost-POI Coord ausgibt, soll es NICHT die geerbte konkrete Coord
// sein (sonst wird beim Re-Parse nichts mehr als Ghost erkannt), sondern der
// Marker ↑. Genauso für Status: 'cluster_ghost' bleibt erhalten.

// ─── Tabelle 1 regenerieren ──────────────────────────────────────────────────

function renderTabelle1(catalog: MergedCatalog): string {
  const live = catalog.pois.filter((p) => !p._isDeleted);
  const bySub = new Map<Subcategory, MergedPoi[]>();
  for (const p of live) {
    // Ghost-POIs (subcategory='Cluster') werden mit ausgegeben, damit beim
    // Re-Import nichts verloren geht (Round-Trip-Sicherheit, ann_048).
    const list = bySub.get(p.subcategory) ?? [];
    list.push(p);
    bySub.set(p.subcategory, list);
  }
  const clustersWithIdentity = new Set(
    live.filter((p) => p.is_cluster_identity && p.cluster).map((p) => p.cluster!),
  );

  const out: string[] = ['## Tabelle 1 · POI-Liste', ''];
  // Cluster-Subkategorie wird mit ausgegeben (Ghost-POIs leben dort, ann_048).
  for (const c of CONTAINER_SYSTEM) {
    const list = bySub.get(c.subcategory);
    if (!list || list.length === 0) continue;
    out.push(`### ${subHeading(c.subcategory)}`);
    out.push('');
    out.push('| Code | Icon | Tagline | Description | Coord | Cluster | Status |');
    out.push('|---|---|---|---|---|---|---|');
    for (const p of list) {
      out.push(
        `| ${p.id} | ${p.icon} | ${fmtText(p)} | ${p.description_short ?? ''} | ${fmtCoord(p)} | ${fmtClusterCell(p, clustersWithIdentity)} | ${fmtStatus(p)} |`,
      );
    }
    out.push('');
  }
  // Trailing separator vor dem nächsten ## Tabelle 2
  out.push('---');
  out.push('');
  return out.join('\n');
}

// ─── Cluster-Sektion regenerieren ────────────────────────────────────────────

function renderClusterSection(catalog: MergedCatalog): string {
  const live = catalog.pois.filter((p) => !p._isDeleted);
  const byCluster = new Map<string, MergedPoi[]>();
  for (const p of live) {
    if (!p.cluster) continue;
    const list = byCluster.get(p.cluster) ?? [];
    list.push(p);
    byCluster.set(p.cluster, list);
  }

  const out: string[] = ['## Cluster', ''];
  for (const c of catalog.clusters) {
    const members = byCluster.get(c.name) ?? [];
    if (members.length === 0) continue;
    const hasIdentity = members.some((m) => m.is_cluster_identity);
    if (hasIdentity) {
      out.push(`### ${c.name} *(${members.length} POIs)*`);
    } else {
      out.push(`### Optional ${c.name} *(${members.length} POIs, kein Cluster-Icon)*`);
    }
    out.push('');
    // Identity zuerst, sonst Reihenfolge wie im Katalog
    const sorted = [...members].sort((a, b) => {
      const ai = a.is_cluster_identity ? 0 : 1;
      const bi = b.is_cluster_identity ? 0 : 1;
      return ai - bi;
    });
    const memberStr = sorted.map((m) => {
      const tag = m.is_cluster_identity ? ' *(Cluster-Icon)*' : '';
      return `${m.icon} ${m.text}${tag}`;
    }).join(' · ');
    out.push(memberStr);
    out.push('');
  }
  out.push('---');
  out.push('');
  return out.join('\n');
}

// ─── Token-Präfix-Zeile updaten ──────────────────────────────────────────────
// Schreibt `**Token-Präfix:** <verbund> · <slug>` in den Header. Ersetzt eine
// vorhandene Zeile oder fügt sie direkt nach der `**Stand:**`-Zeile ein. So
// reist das Präfix mit der .md (Frontmatter ist die Wahrheit, ann_C2).
function updateTokenPrefixLine(prefix: string, verbund: string, slug: string): string {
  const line = `**Token-Präfix:** ${verbund} · ${slug}`;
  if (/^\*\*Token-Präfix:\*\*[^\n]*/m.test(prefix)) {
    return prefix.replace(/^\*\*Token-Präfix:\*\*[^\n]*/m, line);
  }
  // Einfügen nach der Stand-Zeile.
  if (/^\*\*Stand:\*\*[^\n]*/m.test(prefix)) {
    return prefix.replace(/^(\*\*Stand:\*\*[^\n]*)/m, `$1\n${line}`);
  }
  return prefix;
}

// ─── Header-Counts updaten ───────────────────────────────────────────────────

function updateHeaderCounts(prefix: string, catalog: MergedCatalog): string {
  const live = catalog.pois.filter((p) => !p._isDeleted);
  const exact = live.filter((p) => p.coord_status === 'exact').length;
  const estimated = live.filter((p) => p.coord_status === 'estimated').length;
  const missing = live.filter((p) => p.coord_status === 'missing').length;
  const today = new Date().toISOString().slice(0, 10);
  const line = `**Stand:** ${today}  ·  **${live.length} POIs**  ·  ✓ ${exact} · ≈ ${estimated} · ❓ ${missing}`;
  // Ersetzt die erste Zeile, die mit "**Stand:**" beginnt.
  return prefix.replace(/^\*\*Stand:\*\*[^\n]*/m, line);
}

// ─── Haupt-Funktion: Original-md + Edits → neue md ───────────────────────────

interface SerializeOptions {
  tokenVerbund?: string;
  tokenSlug?: string;
}

export function serializeCatalogToMd(
  originalMd: string,
  catalog: MergedCatalog,
  opts: SerializeOptions = {},
): string {
  const lines = originalMd.split('\n');

  // Section-Grenzen suchen
  const tab1Start = lines.findIndex((l) => /^##\s+Tabelle 1\b/.test(l));
  const tab2Start = lines.findIndex((l) => /^##\s+Tabelle 2\b/.test(l));
  const clusterStart = lines.findIndex((l) => /^##\s+Cluster\s*$/.test(l));
  const notizStart = lines.findIndex((l, idx) => idx > clusterStart && /^##\s+Notiz\b/.test(l));

  if (tab1Start < 0 || tab2Start < 0 || clusterStart < 0) {
    throw new Error('Plan-Markdown hat unerwartete Struktur — Sections fehlen.');
  }

  // Prefix = alles bis Tabelle 1 (ohne)
  const prefixLines = lines.slice(0, tab1Start);
  // Tabelle 2..3 + Konventionen = alles zwischen Tabelle 2 und Cluster
  const middleLines = lines.slice(tab2Start, clusterStart);
  // Suffix = alles ab Notiz (falls vorhanden), sonst leer
  const suffixLines = notizStart > 0 ? lines.slice(notizStart) : [];

  // "---"-Separator vor Tabelle 1 wegnehmen, falls in prefix das letzte ist:
  // wir fügen ihn selbst wieder oben in renderTabelle1's Vorgänger ein.
  while (prefixLines.length > 0 && /^---\s*$/.test(prefixLines[prefixLines.length - 1])) {
    prefixLines.pop();
  }
  while (prefixLines.length > 0 && prefixLines[prefixLines.length - 1].trim() === '') {
    prefixLines.pop();
  }

  let prefix = updateHeaderCounts(prefixLines.join('\n'), catalog);
  if (opts.tokenVerbund && opts.tokenSlug) {
    prefix = updateTokenPrefixLine(prefix, opts.tokenVerbund, opts.tokenSlug);
  }
  const tab1 = renderTabelle1(catalog);
  const middle = middleLines.join('\n').replace(/\n+$/, '') + '\n\n---\n\n';
  const cluster = renderClusterSection(catalog);
  const suffix = suffixLines.length > 0 ? suffixLines.join('\n').replace(/^\n+/, '') : '';

  return [
    prefix,
    '',
    '---',
    '',
    tab1,
    middle,
    cluster,
    suffix,
  ].join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

// ─── Einfacher Zeilen-Diff für Vorschau ──────────────────────────────────────

export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  // LCS-DP
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ kind: 'ctx', text: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ kind: 'del', text: a[i] }); i++; }
    else { out.push({ kind: 'add', text: b[j] }); j++; }
  }
  while (i < n) { out.push({ kind: 'del', text: a[i++] }); }
  while (j < m) { out.push({ kind: 'add', text: b[j++] }); }
  return out;
}

// Komprimiert lange unveränderte Abschnitte zu `… N unveränderte Zeilen …`
// und zeigt 3 Zeilen Kontext um jede Änderung.
export function compactDiff(diff: DiffLine[], context = 3): DiffLine[] {
  const changeIdx = new Set<number>();
  diff.forEach((d, i) => { if (d.kind !== 'ctx') changeIdx.add(i); });
  if (changeIdx.size === 0) return [];

  const keep = new Set<number>();
  for (const i of changeIdx) {
    for (let k = i - context; k <= i + context; k++) {
      if (k >= 0 && k < diff.length) keep.add(k);
    }
  }
  const out: DiffLine[] = [];
  let lastEmitted = -1;
  const sortedKeep = [...keep].sort((a, b) => a - b);
  for (const i of sortedKeep) {
    if (lastEmitted >= 0 && i > lastEmitted + 1) {
      const skipped = i - lastEmitted - 1;
      out.push({ kind: 'ctx', text: `… ${skipped} unveränderte Zeile${skipped === 1 ? '' : 'n'} …` });
    }
    out.push(diff[i]);
    lastEmitted = i;
  }
  return out;
}
