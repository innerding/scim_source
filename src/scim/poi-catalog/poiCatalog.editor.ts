// Editor-Layer für den POI-Katalog (Phase 3).
// localStorage-Overlay über dem geparsten Plan: kein Schreibzugriff auf .md
// zur Laufzeit — Änderungen werden beim Export in eine neue .md serialisiert.

import type {
  CatalogPoi, MergedCatalog, MergedPoi,
  PoiCatalogEditState, PoiCatalogState, PoiPatch,
} from './poiCatalog.types';
import { mintToken } from './poiCatalog.token';

const STORAGE_PREFIX = 'scim3:catalog-edit:';
// v2: POI-id ist jetzt der stabile Fixstern-Token (vorher positionelles
// poi_NNN). Alte v1-Patches (an poi_NNN gebunden) verfallen beim Laden sauber.
const CURRENT_SCHEMA_VERSION = 2;

export function storageKey(regionId: string): string {
  return `${STORAGE_PREFIX}${regionId}`;
}

export function emptyEditState(regionId: string): PoiCatalogEditState {
  return {
    region_id: regionId,
    patches: {},
    next_new_id: 1,
    updated_at: new Date().toISOString(),
    schema_version: CURRENT_SCHEMA_VERSION,
  };
}

export function loadEditState(regionId: string): PoiCatalogEditState {
  if (typeof localStorage === 'undefined') return emptyEditState(regionId);
  try {
    const raw = localStorage.getItem(storageKey(regionId));
    if (!raw) return emptyEditState(regionId);
    const parsed = JSON.parse(raw) as PoiCatalogEditState;
    if (parsed.schema_version !== CURRENT_SCHEMA_VERSION) {
      // Unbekannte Version → leerer State, nichts überschreiben.
      return emptyEditState(regionId);
    }
    return parsed;
  } catch {
    return emptyEditState(regionId);
  }
}

export function saveEditState(state: PoiCatalogEditState): void {
  if (typeof localStorage === 'undefined') return;
  const toSave: PoiCatalogEditState = { ...state, updated_at: new Date().toISOString() };
  localStorage.setItem(storageKey(state.region_id), JSON.stringify(toSave));
}

export function clearEditState(regionId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(storageKey(regionId));
}

// ─── Reducer-artige Operationen ──────────────────────────────────────────────

export function patchPoi(
  state: PoiCatalogEditState,
  id: string,
  changes: Partial<Omit<CatalogPoi, 'id'>>,
): PoiCatalogEditState {
  const existing = state.patches[id] ?? {};
  // Neu angelegte POI: in new_poi direkt mergen, nicht in changes.
  if (existing.is_new && existing.new_poi) {
    return {
      ...state,
      patches: {
        ...state.patches,
        [id]: { ...existing, new_poi: { ...existing.new_poi, ...changes } },
      },
    };
  }
  return {
    ...state,
    patches: {
      ...state.patches,
      [id]: { ...existing, changes: { ...(existing.changes ?? {}), ...changes } },
    },
  };
}

export function deletePoi(state: PoiCatalogEditState, id: string): PoiCatalogEditState {
  const existing = state.patches[id];
  // Neu-Anlage löschen → Patch komplett entfernen.
  if (existing?.is_new) {
    const next = { ...state.patches };
    delete next[id];
    return { ...state, patches: next };
  }
  return {
    ...state,
    patches: { ...state.patches, [id]: { ...(existing ?? {}), deleted: true } },
  };
}

export function undeletePoi(state: PoiCatalogEditState, id: string): PoiCatalogEditState {
  const existing = state.patches[id];
  if (!existing) return state;
  const { deleted: _drop, ...rest } = existing;
  // Wenn sonst nichts übrig: Patch entfernen, sonst behalten.
  if (Object.keys(rest).length === 0) {
    const next = { ...state.patches };
    delete next[id];
    return { ...state, patches: next };
  }
  return { ...state, patches: { ...state.patches, [id]: rest } };
}

export function addNewPoi(
  state: PoiCatalogEditState,
  template: Omit<CatalogPoi, 'id'>,
  takenIds: Iterable<string> = [],
): { state: PoiCatalogEditState; id: string } {
  // Neue POIs bekommen sofort einen stabilen Fixstern-Token (keine
  // positionellen new_NNN mehr). Kollision gegen Basis-IDs + bestehende Patches.
  const taken = new Set<string>(takenIds);
  for (const k of Object.keys(state.patches)) taken.add(k);
  const id = mintToken(state.region_id, taken);
  return {
    state: {
      ...state,
      next_new_id: state.next_new_id + 1,
      patches: {
        ...state.patches,
        [id]: { is_new: true, new_poi: { id, ...template } },
      },
    },
    id,
  };
}

export function resetPoi(state: PoiCatalogEditState, id: string): PoiCatalogEditState {
  const next = { ...state.patches };
  delete next[id];
  return { ...state, patches: next };
}

// ─── Merge: Plan + Patches → finale POI-Liste ────────────────────────────────

export function mergeEdits(base: PoiCatalogState, edits: PoiCatalogEditState): MergedCatalog {
  const merged: MergedPoi[] = [];
  let dirty = 0;
  let newCount = 0;
  let deletedCount = 0;

  // 1) Plan-POIs in Reihenfolge, mit Patches überlagert
  for (const p of base.pois) {
    const patch = edits.patches[p.id];
    if (!patch) {
      merged.push({ ...p, _isDirty: false, _isNew: false, _isDeleted: false });
      continue;
    }
    const isDeleted = !!patch.deleted;
    const isDirty = !!patch.changes && Object.keys(patch.changes).length > 0;
    merged.push({
      ...p,
      ...(patch.changes ?? {}),
      _isDirty: isDirty,
      _isNew: false,
      _isDeleted: isDeleted,
    });
    if (isDirty) dirty++;
    if (isDeleted) deletedCount++;
  }

  // 2) Neu angelegte POIs (synthetische IDs)
  for (const [id, patch] of Object.entries(edits.patches)) {
    if (!patch.is_new || !patch.new_poi) continue;
    merged.push({ ...patch.new_poi, id, _isDirty: false, _isNew: true, _isDeleted: false });
    newCount++;
  }

  // 3) Cluster aus den lebenden POIs ableiten (member_count + identity)
  const liveByCluster = new Map<string, MergedPoi[]>();
  for (const p of merged) {
    if (p._isDeleted || !p.cluster) continue;
    const list = liveByCluster.get(p.cluster) ?? [];
    list.push(p);
    liveByCluster.set(p.cluster, list);
  }
  const clusters = base.clusters.map((c) => {
    const members = liveByCluster.get(c.name) ?? [];
    const identity = members.find((m) => m.is_cluster_identity);
    return { ...c, member_count: members.length, identity_poi_id: identity?.id };
  });

  // 4) Ghost-Coord-Inheritance (analog Parser, aber auch fuer im Editor
  // neu-angelegte Ghosts mit synthetischen IDs). Jeder cluster_ghost POI
  // erbt seine Coord von dem Member im selben Cluster mit is_cluster_identity.
  // Wenn kein Parent existiert, bleibt die Template-Coord stehen ([0,0] bei
  // Neu-Anlage). Mutation in-place ist erlaubt — merged ist ein lokales Array.
  for (const ghost of merged) {
    if (ghost._isDeleted) continue;
    if (ghost.coord_status !== 'cluster_ghost') continue;
    if (!ghost.cluster) continue;
    const members = liveByCluster.get(ghost.cluster) ?? [];
    const parent = members.find((m) => m.is_cluster_identity);
    if (parent) {
      ghost.coord = [parent.coord[0], parent.coord[1]];
    }
  }

  return { pois: merged, clusters, dirty_count: dirty, new_count: newCount, deleted_count: deletedCount };
}

export function hasEdits(state: PoiCatalogEditState): boolean {
  return Object.keys(state.patches).length > 0;
}

// ─── Reconciliation: nach Commit Patches nur fallenlassen, was nachweislich
// in der frischen Basis-.md angekommen ist ──────────────────────────────────
//
// Ersetzt das blinde clearEditState() beim Commit (Schritt C). Der Commit-dann-
// Clear-Lauf hatte ein Loch: zwischen Commit und neuer Basis konnte ein Patch
// verworfen werden, dessen Inhalt noch nicht in der Basis stand → „Änderung weg".
// Hier wird konservativ abgeglichen: ein Patch (-Feld) fällt NUR weg, wenn sein
// Inhalt beweisbar in der Basis steht. Im Zweifel BEHALTEN — übrig gebliebener
// Patch ist harmlos (Operator kann „Zurücksetzen"), verlorener Patch ist Datenverlust.

// Normalisiert leere/undefinierte Strings zu '' und trimmt — '' und undefined
// gelten als gleich.
function normStr(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function coordEq(a: [number, number] | undefined, b: [number, number] | undefined): boolean {
  if (!a || !b) return a === b;
  return a[0].toFixed(5) === b[0].toFixed(5) && a[1].toFixed(5) === b[1].toFixed(5);
}

// Ist der Wert von `field` im Patch identisch mit dem in der Basis-POI?
function fieldMatchesBase(
  field: keyof Omit<CatalogPoi, 'id'>,
  patchVal: unknown,
  basePoi: CatalogPoi,
): boolean {
  if (field === 'coord') {
    return coordEq(patchVal as [number, number], basePoi.coord);
  }
  if (field === 'is_cluster_identity') {
    return !!patchVal === !!basePoi.is_cluster_identity;
  }
  return normStr(patchVal) === normStr((basePoi as unknown as Record<string, unknown>)[field]);
}

export function reconcileEdits(
  state: PoiCatalogEditState,
  base: PoiCatalogState,
): PoiCatalogEditState {
  const baseById = new Map<string, CatalogPoi>();
  for (const p of base.pois) baseById.set(p.id, p);

  const nextPatches: Record<string, PoiPatch> = {};

  for (const [id, patch] of Object.entries(state.patches)) {
    const basePoi = baseById.get(id);

    // Neu-Anlage: in der Basis vorhanden (Token committet) → Patch erledigt.
    if (patch.is_new && patch.new_poi) {
      if (basePoi) continue;          // committet → fallenlassen
      nextPatches[id] = patch;        // noch nicht in Basis → behalten
      continue;
    }

    // Löschung: aus der Basis verschwunden → Löschung erledigt.
    if (patch.deleted) {
      if (!basePoi) continue;         // committet (nicht mehr in Basis) → fallenlassen
      // Noch in Basis: Löschung behalten (evtl. mit Restfeldern aus changes).
      nextPatches[id] = patch;
      continue;
    }

    // Feld-Änderungen: nur die Felder behalten, die noch NICHT in der Basis stehen.
    if (patch.changes) {
      if (!basePoi) {
        // POI nicht (mehr) in Basis, aber kein deleted-Patch → konservativ behalten.
        nextPatches[id] = patch;
        continue;
      }
      const remaining: Partial<Omit<CatalogPoi, 'id'>> = {};
      for (const [field, val] of Object.entries(patch.changes)) {
        const f = field as keyof Omit<CatalogPoi, 'id'>;
        if (!fieldMatchesBase(f, val, basePoi)) {
          (remaining as Record<string, unknown>)[field] = val;
        }
      }
      if (Object.keys(remaining).length > 0) {
        nextPatches[id] = { ...patch, changes: remaining };
      }
      // sonst: alle Änderungen in Basis angekommen → Patch fällt weg.
      continue;
    }

    // Sonstiger (leerer) Patch: nichts zu tun → fallenlassen.
  }

  return { ...state, patches: nextPatches };
}
