// Pathworks Hub — Lebenszyklus & Versionierung (reine Logik).
//
// Die State-Machine lokal → eingereicht → committet und der Commit, der ein
// unveränderliches Versions-Manifest erzeugt. Alles reine Funktionen (kein
// State, keine Seiteneffekte) → server-/UI-agnostisch testbar.
//
// Kern-Regeln (aus dem Konsens):
//   • Jeder kann SPEICHERN (local) und EINREICHEN (submitted) … außer dem
//     Operator, der direkt COMMITTET. Analyst ist read-only (Sandbox).
//   • Eine VERSION entsteht ausschließlich beim Operator-Commit.
//   • Committete Bauteile sind eingefroren („nicht mehr frei") — Ändern = neuer
//     Draft (Fork) → künftige Version.

import type {
  ActorId, ActorRole, LifecycleState, PartDraft, PartRef, Representation, VersionManifest,
} from './pathworks.types';

// Wer darf einreichen? Jeder außer Operator (committet direkt) und Analyst (read-only).
export function canSubmit(role: ActorRole): boolean {
  return role !== 'operator' && role !== 'analyst';
}

// Wer darf committen? Nur der Operator.
export function canCommit(role: ActorRole): boolean {
  return role === 'operator';
}

// State-Machine: erlaubte Folge-Zustände je Rolle.
//   local     → Operator: committed (direkt) · Einreicher: submitted
//   submitted → Operator: committed (annehmen) ODER local (zurückgeben) ·
//               Einreicher: local (zurückziehen)
//   committed → (nichts — eingefroren)
export function nextStates(role: ActorRole, from: LifecycleState): LifecycleState[] {
  switch (from) {
    case 'local':
      if (role === 'operator') return ['committed'];
      return canSubmit(role) ? ['submitted'] : [];
    case 'submitted':
      if (role === 'operator') return ['committed', 'local'];
      return canSubmit(role) ? ['local'] : [];
    case 'committed':
      return [];
  }
}

export function canTransition(role: ActorRole, from: LifecycleState, to: LifecycleState): boolean {
  return nextStates(role, from).includes(to);
}

// Operator-Commit: friert die übergebenen Bauteil-Drafts einer Rep zu einem
// unveränderlichen Versions-Manifest ein und hebt die Versionsnummer um 1.
// Reine Funktion — liefert das Manifest + die zu 'committed' zu markierenden
// Draft-Ids; das Schreiben besorgt der Aufrufer über den PathworksStore.
// `now` als Parameter (statt Date.now()) hält die Funktion pur & deterministisch.
export function commitRepresentation(
  rep: Representation,
  parts: PartDraft[],
  operatorId: ActorId,
  now: number,
  note?: string,
): { manifest: VersionManifest; committedDraftIds: string[] } {
  const refs: PartRef[] = parts.map((p) => ({ kind: p.kind, draftId: p.id, contentHash: p.contentHash }));
  const manifest: VersionManifest = {
    repId: rep.id,
    version: rep.currentVersion + 1,
    regionId: rep.regionId,
    binding: rep.binding,
    parts: refs,
    committedBy: operatorId,
    committedAt: now,
    note,
  };
  return { manifest, committedDraftIds: parts.map((p) => p.id) };
}

// Ist ein Bauteil-Inhalt bereits in IRGENDEINER Version eingefroren? Dann ist er
// „nicht mehr frei": Bearbeiten heißt forken (neuer Draft) → neue Version.
export function isFrozen(contentHash: string, versions: VersionManifest[]): boolean {
  return versions.some((v) => v.parts.some((p) => p.contentHash === contentHash));
}
