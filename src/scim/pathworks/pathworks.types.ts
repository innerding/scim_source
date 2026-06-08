// Pathworks Hub — Domain-Modell (Logik-Schicht, UI-FREI).
//
// Die technisch-logische Grundlage für Pathworks Hub + Versionierung. Hier wohnt
// das Vokabular und die Form der Daten; die REGELN liegen in lifecycle.ts
// (Lebenszyklus/Commit/Version) und visibility.ts (Sichtbarkeit/Rechte). Noch
// nichts davon ist an die UI verdrahtet — bewusst „technisch-logisch zuerst".
//
// Zwei Achsen:
//   • Baum-Achse:    Nation → Region → Representation (mit Bindung regional|unbound)
//   • Zustands-Achse: lokal → eingereicht → committet(=Version)  [git-artig]
//
// Annahmen (Defaults, revidierbar):
//   1) Versions-Granularität = PART-REFS: eine Version pinnt ihre Bauteile als
//      eingefrorene Refs (wiederverwendbar, aber nach Commit „nicht mehr frei").
//   2) unbound/Event = vorerst nur ein FLAG am Datensatz; der abweichende Runtime
//      (Mesh aus den User-Geräten statt Anthem) kommt später.
//   3) Persistenz heute = localStorage hinter PathworksStore (Server-Naht);
//      morgen Worker/R2/D1 — die Logik bleibt unberührt.

export type NationId = string;
export type RegionId = string;
export type RepId = string;
export type ActorId = string;

// Regionale Bindung der Representation. 'unbound' = Regions-ZUGEHÖRIGKEIT ohne
// geografische Bindung (privat/Event); hier kein Anthem in dieser Form.
export type Binding = 'regional' | 'unbound';

// Die Bauteile, aus denen eine Representation committet wird.
export type PartKind = 'catalog' | 'geometry' | 'wegnetz' | 'thresholds' | 'colour';

// Lebenszyklus eines Artefakts (Bauteil-Draft ODER Representation).
//   local     — Entwurf, beim Besitzer (Speichern)
//   submitted — eingereicht (Senden zur Review) → Operator-Warteschlange
//   committed — vom Operator eingefroren in eine Version („nicht mehr frei")
export type LifecycleState = 'local' | 'submitted' | 'committed';

export interface Nation { id: NationId; name: string; }
export interface Region { id: RegionId; nationId: NationId; name: string; }

// Ein Bauteil-Draft VOR dem Commit. Nach dem Commit wird sein Inhalt als PartRef
// in ein Versions-Manifest eingefroren.
export interface PartDraft {
  id: string;
  kind: PartKind;
  name: string;
  ownerId: ActorId;
  repId: RepId | null;        // Ziel-Rep (null = lose/noch keiner Rep zugeordnet)
  state: LifecycleState;      // 'local' | 'submitted' (committet lebt als PartRef)
  contentHash: string;        // Inhalts-Fingerabdruck → trägt die Versionierung
  updatedAt: number;
}

// Eine Representation = Knoten im Baum Nation→Region→Rep.
export interface Representation {
  id: RepId;
  regionId: RegionId;
  binding: Binding;
  name: string;
  ownerId: ActorId;
  currentVersion: number;     // 0 = nie committet
}

// Eingefrorener Verweis auf genau einen Bauteil-Inhalt in einer Version.
export interface PartRef {
  kind: PartKind;
  draftId: string;            // Herkunfts-Draft
  contentHash: string;        // genau dieser Inhalt (unveränderlich)
}

// Unveränderliches Versions-Manifest — entsteht GENAU beim Operator-Commit.
// „Ab wann gilt es als Version?" → ab hier. Editor-Sends erzeugen das NIE.
export interface VersionManifest {
  repId: RepId;
  version: number;
  regionId: RegionId;
  binding: Binding;
  parts: PartRef[];
  committedBy: ActorId;
  committedAt: number;
  note?: string;
}

// Rollen in der Pathworks-LOGIK (Domain). Bewusst NICHT 1:1 das Login-Role-Enum
// — die Zuordnung (heute reg_editor/rep_editor; das dritte „editor" ohne Bindung
// ist neu) ist eine offene Governance-Frage (ACCESS, ann_105). Siehe doc.
export type ActorRole =
  | 'operator'      // committet direkt; sein Reich + Einreichungs-Warteschlange
  | 'regio_editor'  // Aufsicht: ALLE Reps seiner Region
  | 'rep_editor'    // eigene Representationen/Drafts/Kataloge
  | 'editor'        // OHNE regionale Bindung (privat/unbound)
  | 'analyst';      // Review = Sandbox-Sicht des Operators (read-only)

export interface Actor {
  id: ActorId;
  role: ActorRole;
  regionIds: RegionId[];      // für regio_editor: seine zuständige(n) Region(en)
}

// Das, worüber Sichtbarkeit/Rechte entscheiden: ein Ding mit Besitzer, Region,
// Bindung, Zustand. Representation und PartDraft lassen sich darauf abbilden.
export interface Artifact {
  ownerId: ActorId;
  regionId: RegionId | null;  // null = unbound/lose
  binding: Binding;
  state: LifecycleState;
}
