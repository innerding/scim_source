// Pathworks Hub — Persistenz-Naht (Server-Seam).
//
// Die Logik-Schicht (lifecycle/visibility) spricht NUR mit diesem Interface.
// Heute später eine localStorage-Implementierung (ein Browser), morgen eine
// Worker/R2/D1-Implementierung (echtes Cross-User: Editor↔Operator über Geräte).
// Die Logik bleibt bei beidem unberührt — das ist der Sinn der Naht.
//
// Bewusst noch OHNE Implementierung: „technisch-logisch zuerst". Der Contract
// steht; die localStorage-Impl kommt mit der Editor-Übersicht, die Worker-Impl
// mit der Governance-/Server-Schicht (ann_105).

import type {
  ActorId, Nation, NationId, PartDraft, Region, RegionId, RepId, Representation, VersionManifest,
} from './pathworks.types';

export interface PathworksStore {
  // Baum
  listNations(): Promise<Nation[]>;
  listRegions(nationId: NationId): Promise<Region[]>;
  listRepresentations(regionId: RegionId): Promise<Representation[]>;

  // Bauteil-Drafts (Bearbeitung vor dem Commit)
  getDrafts(ownerId: ActorId): Promise<PartDraft[]>;
  saveDraft(d: PartDraft): Promise<void>;        // Speichern (local)
  submitDraft(draftId: string): Promise<void>;   // Senden zur Review (submitted)
  withdrawDraft(draftId: string): Promise<void>; // zurückziehen (submitted → local)

  // Einreichungs-Warteschlange (nur Operator)
  listSubmissions(): Promise<PartDraft[]>;

  // Versionierung — der Operator-Commit schreibt ein Manifest; Versionen sind
  // unveränderlich (append-only).
  commit(m: VersionManifest): Promise<void>;
  listVersions(repId: RepId): Promise<VersionManifest[]>;
}
