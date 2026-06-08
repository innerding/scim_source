// Pathworks Hub — localStorage-Realisierung des EDITOR-Ausschnitts (Schicht 2,
// „von der Naht zur Wurzel"). Adapter über die ECHTEN heutigen Daten:
//   • draftStore (scim3:drafts)      → Rep-Drafts            (state local|submitted)
//   • REPRESENTATIONS (data/*.json)  → committete Reps       (state committed, vN)
//   • scim3:pathworks:meta (NEU)     → die genuin neuen Bits je Draft:
//                                       owner · binding · eingereicht-Zustand
//
// workspace bleibt die Speicher-WAHRHEIT — hier nur lesen + ins View-Model mappen
// + die neuen Bits dazuschreiben. Die Logik (lifecycle/visibility) wird dabei an
// den echten Daten ausgeübt: so bewährt oder bricht sich das Modell.
//
// Der VOLLE async PathworksStore (Operator-Baum Nation→Region→Rep + commit +
// echtes Cross-User über Server) kommt mit dem Operator-Panel; dies hier ist die
// localStorage-Wurzel des Editor-Slices. Synchron (localStorage ist synchron) —
// die Server-Variante wird async hinter derselben Naht stehen.

import { listDrafts, removeDraft, type Draft } from '../workspace/draftStore';
import { REPRESENTATIONS, geometryById } from '../workspace/workspace.registry';
import { slugify } from '../../runtime/router';
import type { Role } from '../ui/RoleContext';
import { canSee } from './visibility';
import { canTransition } from './lifecycle';
import type { Actor, ActorRole, Binding, LifecycleState, RepView } from './pathworks.types';

const META_KEY = 'scim3:pathworks:meta';

interface DraftMeta { ownerId?: string; binding?: Binding; submitted?: boolean; submittedAt?: number; nation?: string; region?: string; }
type MetaMap = Record<string, DraftMeta>;

function loadMeta(): MetaMap {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') as MetaMap; } catch { return {}; }
}
function saveMeta(m: MetaMap): void {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* Quota o.ä. — Meta ist klein */ }
}
function patchMeta(id: string, patch: DraftMeta): void {
  const m = loadMeta();
  m[id] = { ...m[id], ...patch };
  saveMeta(m);
}

// Login-Rolle → Pathworks-Domain-Rolle. Best-effort; die saubere Zuordnung
// (inkl. der dritten „editor"-Rolle ohne Bindung) ist offene Governance (ann_105).
export function mapLoginRole(r: Role): ActorRole {
  switch (r) {
    case 'operator': return 'operator';
    case 'analyst': return 'analyst';
    case 'rep_editor': return 'rep_editor';
    case 'reg_editor': return 'regio_editor';
    case 'regio_editor': return 'regio_editor';
  }
}

// Login-Identität → Pathworks-Actor. Heute: userName als ActorId; regionIds leer
// (Region-Zuweisung kommt mit Governance ann_105 → regio_editor-Scoping noch No-op).
export function actorFrom(userName: string, role: Role): Actor {
  return { id: userName || 'anon', role: mapLoginRole(role), regionIds: [] };
}

// Region eines Drafts: aus der ausgecheckten Boundary (intake) ableiten, sonst keine.
function draftRegion(d: Draft): { id: string | null; label: string } {
  if (d.source_geometry_id) {
    const g = geometryById(d.source_geometry_id);
    if (g?.region) return { id: slugify(g.region), label: g.region };
  }
  return { id: null, label: '—' };
}

// „Meine Reps" für den Editor-Home: Drafts (editierbar) + committete Reps
// (read-only), durch die Sichtbarkeits-Funktion gefiltert. Drafts zuerst.
export function repsForActor(actor: Actor): RepView[] {
  const meta = loadMeta();
  const views: RepView[] = [];

  // (1) Drafts = nicht-committete Rep-Drafts. In einem Browser ist alles Lokale
  // der aktuelle Nutzer → ownerId fällt auf actor.id zurück.
  for (const d of listDrafts()) {
    const m = meta[d.id] ?? {};
    const ownerId = m.ownerId ?? actor.id;
    const binding: Binding = m.binding ?? 'regional';
    const state: LifecycleState = m.submitted ? 'submitted' : 'local';
    // Verortung: vom Editor gesetzt (Meta), sonst aus der Intake-Geometrie abgeleitet.
    const region = m.region ? { id: slugify(m.region), label: m.region } : draftRegion(d);
    const nationLabel = m.nation;
    if (!canSee(actor, { ownerId, regionId: region.id, binding, state })) continue;
    views.push({
      id: d.id, name: d.name, regionId: region.id, regionLabel: region.label, nationLabel,
      binding, state, currentVersion: 0, origin: 'draft', owner: ownerId,
      catalogId: d.catalog_id ?? null, geometryId: null,
      parts: {
        geometry: !!(d.boundary?.length || d.reference?.length),
        wegnetz: !!(d.net_masked || d.net_unmasked),
        catalog: !!d.catalog_id,
        thresholds: false,   // Farbe/Thresholds heute noch nicht im Draft erfasst
      },
      updatedAt: Date.parse(d.updated_at) || undefined,
    });
  }

  // (2) committete Representations (file-basiert) = read-only, state committed.
  // Besitz/Region committeter Reps sind heute nicht erfasst → ownerId = actor.id
  // (Browser-Wahrheit), Region aus der Geometry.
  for (const r of REPRESENTATIONS) {
    const geo = r.geometry_id ? geometryById(r.geometry_id) : undefined;
    const regionId = geo?.region ? slugify(geo.region) : null;
    const binding: Binding = 'regional';
    if (!canSee(actor, { ownerId: actor.id, regionId, binding, state: 'committed' })) continue;
    views.push({
      id: r.id, name: r.name, regionId, regionLabel: geo?.region ?? '—', nationLabel: geo?.nation ?? undefined,
      binding, state: 'committed', currentVersion: r.version ?? 1, origin: 'committed',
      createdBy: r.created_by, committedBy: r.committed_by,
      catalogId: r.catalog_id ?? null, geometryId: r.geometry_id ?? null,
      parts: { geometry: !!r.geometry_id, wegnetz: !!r.wegnetz_id, catalog: !!r.catalog_id, thresholds: true },
      updatedAt: undefined,
    });
  }

  return views;
}

// ── Zustands-Übergänge (über die State-Machine geprüft) ──────────────────────
// Senden zur Review: local → submitted. Setzt das Meta-Flag (Browser-Schale;
// echtes Cross-User folgt mit dem Server). Liefert false, wenn die Rolle nicht darf.
export function submitRep(repId: string, actor: Actor, now: number): boolean {
  if (!canTransition(actor.role, 'local', 'submitted')) return false;
  patchMeta(repId, { submitted: true, submittedAt: now, ownerId: actor.id });
  return true;
}

// Zurückziehen: submitted → local.
export function withdrawRep(repId: string, actor: Actor): boolean {
  if (!canTransition(actor.role, 'submitted', 'local')) return false;
  patchMeta(repId, { submitted: false });
  return true;
}

// Bindung setzen (regional|unbound) — Eigenschaft der Rep, kein Zustandsübergang.
export function setRepBinding(repId: string, binding: Binding): void {
  patchMeta(repId, { binding });
}

// Verortung setzen (Nation/Region). Editor beim Anlegen, Operator bis zum Commit.
export function setRepPlacement(repId: string, nation: string, region: string): void {
  patchMeta(repId, { nation: nation.trim() || undefined, region: region.trim() || undefined });
}

// Bekannte Nationen/Regionen (aus committeten Reps) — als Vorschläge für die Eingabe.
export function knownPlacements(): { nations: string[]; regions: string[] } {
  const nations = new Set<string>(); const regions = new Set<string>();
  for (const r of REPRESENTATIONS) {
    const geo = r.geometry_id ? geometryById(r.geometry_id) : undefined;
    if (geo?.nation) nations.add(geo.nation);
    if (geo?.region) regions.add(geo.region);
  }
  return { nations: [...nations], regions: [...regions] };
}

// Draft löschen (committete Reps sind eingefroren → nicht löschbar). Entfernt den
// Draft aus dem draftStore und seine Pathworks-Meta. Eingereichte erst zurückziehen.
export function deleteRep(repId: string): void {
  removeDraft(repId);
  const m = loadMeta();
  if (m[repId]) { delete m[repId]; saveMeta(m); }
}
