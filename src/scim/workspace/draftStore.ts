// Draft-Store (Umbauplan F, Stufe F4).
//
// Der Draft wird vom stillen Einzel-Autospeicher (scim3_geometry_draft) zu einer
// LISTE benannter Workspace-Objekte. Benennen + Katalog-Binden sind organisato-
// rische Akte und gehören in den Workspace (ann_076); Zeichnen bleibt im Drawer.
//
// Reifelogik (steuert die Farbe in der Pipeline-Liste):
//   benannt, ohne Boundary   → Slot (neutral)
//   Boundary, ohne Katalog   → gelb
//   Boundary, mit Katalog    → orange
//   committet                → kein Draft mehr (blaue Geometry)
//
// Dieser Store ersetzt schrittweise scim3_geometry_draft (F5) und später den
// Handoff scim3_represent_handoff (F7). In F4 wird der Legacy-Autospeicher beim
// ersten Zugriff EINMAL als Draft importiert (nichts geht verloren), nicht gelöscht.

import type { Position } from 'geojson';
import type { HandoffNet } from './draftHandoff';
import type { PathFetchResult } from '../regio-content/pathEngine';
import type { NetModel } from '../regio-content/netModel';
import type { CatalogPoi } from '../poi-catalog/poiCatalog.types';

export const DRAFTS_KEY = 'scim3:drafts';
const LEGACY_DRAFT_KEY = 'scim3_geometry_draft';

export type DraftStage = 'slot' | 'boundary' | 'catalog_bound' | 'committable';
export type DraftColor = 'neutral' | 'gelb' | 'orange' | 'rot';

export interface Draft {
  id: string;
  name: string;
  source: 'fresh' | 'intake';
  source_geometry_id?: string;     // bei source==='intake': die ausgecheckte Boundary
  // F7: zwei Boundaries (siehe ann_077 / docs/f7_bauplan_drawer_lifecycle.md).
  //   reference (B1): grobe Arbeits-/Referenz-Boundary, aus dem OSM-Netz, gelb/orange,
  //                   läuft bis zum Commit mit, wird beim Commit gelöscht.
  //   boundary  (B2): finale, netz-informierte Boundary = die Crop-Maske, wird committet.
  reference: Position[] | null;    // B1 — Referenz (OSM-grob); stirbt am Commit
  boundary: Position[] | null;     // B2 — finale Boundary = Maske; wird committet
  // F7-Neufassung: zwei Wegnetze. net_unmasked (OSM-roh, Arbeits-Schicht) stirbt
  // am Commit; net_masked (zugeschnitten) wird committet. net_masked vorhanden = rot.
  net_unmasked: HandoffNet | null;
  net_masked: HandoffNet | null;
  // Kompletter B1-Overpass-Fetch (ALLE Kanten inkl. Connector-Kandidaten + bbox +
  // Zähler). Damit der Drawer beim Wiederöffnen das Netz zeigt und A→B routen kann,
  // OHNE Overpass erneut abzufragen. Roh/Arbeits-Schicht — stirbt am Commit.
  path_fetch?: PathFetchResult | null;
  // Editiertes OP-Netz (Wegnetz-Editor: Trassierungen, Löschungen, Gates) — die
  // EINE Wahrheit des Netz-Edits. Wird beim Öffnen wiederhergestellt, damit
  // Edits nicht verloren gehen. (osmPool wird aus path_fetch rekonstruiert.)
  op_model?: NetModel | null;
  // POI-Posteingang: im Drawer erfasste, katalog-fertige POIs (mit Token), die an
  // den Katalog gehen sollen — der „rote Brief". Gates sind hier NICHT enthalten
  // (die bleiben netz-intern). Wird im Workspace gesichtet/importiert.
  poi_inbox?: { catalogId: string; pois: CatalogPoi[] } | null;
  catalog_id: string | null;       // gebundener Katalog → orange
  created_at: string;
  updated_at: string;
}

// ─── Reife/Farbe ──────────────────────────────────────────────────────────────

export function draftStage(d: Draft): DraftStage {
  if (d.net_masked) return 'committable';                 // rot — maskiertes Netz da
  const hasGeom = (d.reference?.length ?? 0) >= 3 || (d.boundary?.length ?? 0) >= 3;
  if (!hasGeom) return 'slot';
  if (d.catalog_id) return 'catalog_bound';               // orange
  return 'boundary';                                       // gelb
}

export function draftColor(d: Draft): DraftColor {
  switch (draftStage(d)) {
    case 'committable':   return 'rot';
    case 'catalog_bound': return 'orange';
    case 'boundary':      return 'gelb';
    default:              return 'neutral';
  }
}

// ─── Persistenz ─────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  // lokaler, nicht-kryptografischer Identifier — reicht für eine Browser-Liste.
  const rnd = Math.random().toString(36).slice(2, 8);
  return `draft-${rnd}`;
}

interface LegacyDraft {
  geometryId: string | 'new';
  name: string;
  region: string;
  polygon: Position[] | null;
  maskPolygon?: Position[] | null;
}

// Einmalige Übernahme des alten Einzel-Autospeichers in die Liste.
function migrateLegacy(): Draft[] {
  try {
    const raw = localStorage.getItem(LEGACY_DRAFT_KEY);
    if (!raw) return [];
    const l = JSON.parse(raw) as LegacyDraft;
    if (!l.polygon || l.polygon.length < 3) return [];
    const ts = nowIso();
    return [{
      id: newId(),
      name: l.name?.trim() || 'Übernommener Draft',
      source: 'fresh',
      reference: l.polygon,
      boundary: null,
      net_unmasked: null,
      net_masked: null,
      catalog_id: null,
      created_at: ts,
      updated_at: ts,
    }];
  } catch {
    return [];
  }
}

export function listDrafts(): Draft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (raw) return JSON.parse(raw) as Draft[];
  } catch { /* fällt auf Migration zurück */ }
  // Erstzugriff: Legacy übernehmen und Schlüssel schreiben (idempotent).
  const migrated = migrateLegacy();
  try { saveDrafts(migrated); } catch { /* Erstmigration darf still scheitern */ }
  return migrated;
}

// Wegwerfbare OSM-Fetch-Caches (colourMeshOverlay) — regenerierbar, dürfen bei
// Platznot fallen. Schlüssel-Präfixe von dort.
function pruneOsmCache(): number {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('scim3_osm_edges_v1') || k.startsWith('scim3_osm_edges_v2'))) keys.push(k);
  }
  for (const k of keys) localStorage.removeItem(k);
  return keys.length;
}

// WIRFT bei Fehler (z. B. Quota) — Aufrufer (onSave) macht das sichtbar.
// Selbstheilung: ist localStorage durch den OSM-Cache voll, räumen wir den
// (wegwerfbar) und versuchen genau einmal erneut.
export function saveDrafts(drafts: Draft[]): void {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (e) {
    if (pruneOsmCache() > 0) {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)); // wirft erneut, wenn's immer noch nicht reicht
    } else {
      throw e;
    }
  }
}

// Gesamtgröße des localStorage (Bytes, UTF-16-nah) — fürs Speicher-Budget.
export function localStorageBytes(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k == null) continue;
    total += k.length + (localStorage.getItem(k)?.length ?? 0);
  }
  return total * 2; // UTF-16: 2 Bytes/Zeichen
}

// Aufschlüsselung: welcher Schlüssel belegt wie viel (Bytes), absteigend.
export function localStorageBreakdown(): { key: string; bytes: number }[] {
  const out: { key: string; bytes: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k == null) continue;
    out.push({ key: k, bytes: (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2 });
  }
  return out.sort((a, b) => b.bytes - a.bytes);
}

export function getDraft(id: string): Draft | null {
  return listDrafts().find((d) => d.id === id) ?? null;
}

export function createDraft(name: string, opts: Partial<Draft> = {}): Draft {
  const ts = nowIso();
  const draft: Draft = {
    id: newId(),
    name: name.trim() || 'Neuer Draft',
    source: opts.source ?? 'fresh',
    source_geometry_id: opts.source_geometry_id,
    reference: opts.reference ?? null,
    boundary: opts.boundary ?? null,
    net_unmasked: opts.net_unmasked ?? null,
    net_masked: opts.net_masked ?? null,
    path_fetch: opts.path_fetch ?? null,
    op_model: opts.op_model ?? null,
    poi_inbox: opts.poi_inbox ?? null,
    catalog_id: opts.catalog_id ?? null,
    created_at: ts,
    updated_at: ts,
  };
  saveDrafts([...listDrafts(), draft]);
  return draft;
}

export function updateDraft(id: string, patch: Partial<Draft>): Draft | null {
  const drafts = listDrafts();
  const idx = drafts.findIndex((d) => d.id === id);
  if (idx < 0) return null;
  const updated: Draft = { ...drafts[idx], ...patch, id, updated_at: nowIso() };
  drafts[idx] = updated;
  saveDrafts(drafts);
  return updated;
}

export function removeDraft(id: string): void {
  saveDrafts(listDrafts().filter((d) => d.id !== id));
}
