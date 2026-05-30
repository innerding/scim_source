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

export const DRAFTS_KEY = 'scim3:drafts';
const LEGACY_DRAFT_KEY = 'scim3_geometry_draft';

export type DraftStage = 'slot' | 'boundary' | 'catalog_bound';
export type DraftColor = 'neutral' | 'gelb' | 'orange';

export interface Draft {
  id: string;
  name: string;
  source: 'fresh' | 'intake';
  source_geometry_id?: string;     // bei source==='intake': die ausgecheckte Boundary
  boundary: Position[] | null;     // im Drawer gezeichnet
  mask: Position[] | null;
  net: HandoffNet | null;          // abgeleitetes Wegnetz (fertig oder nicht)
  catalog_id: string | null;       // gebundener Katalog → steuert die Farbe
  created_at: string;
  updated_at: string;
}

// ─── Reife/Farbe ──────────────────────────────────────────────────────────────

export function draftStage(d: Draft): DraftStage {
  if (!d.boundary || d.boundary.length < 3) return 'slot';
  if (d.catalog_id) return 'catalog_bound';
  return 'boundary';
}

export function draftColor(d: Draft): DraftColor {
  switch (draftStage(d)) {
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
      boundary: l.polygon,
      mask: l.maskPolygon ?? null,
      net: null,
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
  saveDrafts(migrated);
  return migrated;
}

export function saveDrafts(drafts: Draft[]): void {
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)); } catch { /* ignore */ }
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
    boundary: opts.boundary ?? null,
    mask: opts.mask ?? null,
    net: opts.net ?? null,
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
