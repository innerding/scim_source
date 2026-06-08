// Pathworks Hub — Sichtbarkeit & Rechte (reine Logik).
//
// Die Rechte-Matrix als Code: WER sieht/editiert WELCHES Artefakt. Reine
// Prädikate (Rolle × Artefakt → bool), server-/UI-agnostisch.
//
// Matrix:
//   operator     committet (sein Reich) + Einreichungen + eigene Drafts;
//                NICHT fremde un-eingereichte Drafts.
//   regio_editor ALLE Artefakte seiner Region (jeder Zustand).
//   rep_editor   eigene Artefakte.
//   editor       eigene UNBOUND-Artefakte (ohne regionale Bindung).
//   analyst      wie Operator, aber NUR lesend (Review = Sandbox).

import type { Actor, Artifact } from './pathworks.types';

// Darf der Akteur das Artefakt SEHEN?
export function canSee(actor: Actor, a: Artifact): boolean {
  switch (actor.role) {
    case 'operator':
    case 'analyst':
      // Sein Reich: alles Committete + alle Einreichungen + Eigenes. Fremde,
      // noch nicht eingereichte Drafts bleiben unsichtbar.
      return a.state === 'committed' || a.state === 'submitted' || a.ownerId === actor.id;
    case 'regio_editor':
      // Eigene Artefakte IMMER + zusätzlich ALLE seiner Region (Aufsicht).
      return a.ownerId === actor.id || (a.regionId != null && actor.regionIds.includes(a.regionId));
    case 'rep_editor':
      return a.ownerId === actor.id;
    case 'editor':
      // Ohne regionale Bindung: seine eigene Arbeit (die ist per Definition unbound;
      // Sicht hängt am Besitz, nicht am binding-Flag).
      return a.ownerId === actor.id;
  }
}

// Darf der Akteur das Artefakt EDITIEREN? Sichtbar + nicht eingefroren + nicht
// read-only-Rolle + Besitz/Zuständigkeit.
export function canEdit(actor: Actor, a: Artifact): boolean {
  if (actor.role === 'analyst') return false;   // Review = Sandbox (folgenlos)
  if (a.state === 'committed') return false;    // eingefroren
  if (!canSee(actor, a)) return false;
  if (actor.role === 'operator') return true;   // sein Reich
  if (actor.role === 'regio_editor') return a.regionId != null && actor.regionIds.includes(a.regionId);
  return a.ownerId === actor.id;                // rep_editor / editor: nur Eigenes
}

// Nur der Operator committet.
export function canCommit(actor: Actor): boolean {
  return actor.role === 'operator';
}

// Wegnetz BESCHNEIDEN (Crop/Maske) ist BEWUSST nicht gesperrt: ein nicht-
// committetes Wegnetz ist reversibel, das Zuschneiden also folgenlos bis zum
// Commit. „Gültig" wird das Wegnetz ohnehin erst durch den Operator-Commit,
// nicht durchs Croppen → keine eigene Crop-Sperre nötig (Konsens 2026-06-08).
