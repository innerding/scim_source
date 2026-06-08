# Pathworks Hub — Modell & Versionierung

Stand 2026-06-08. Die **technisch-logische Grundlage** (Schicht 1) für Pathworks
Hub + Versionierung. Bewusst zuerst die Logik, dann (Schicht 2) der UI-Umbau.

Code: `src/scim/pathworks/` — `pathworks.types.ts` (Vokabular), `lifecycle.ts`
(Lebenszyklus/Commit/Version), `visibility.ts` (Rechte-Matrix), `store.ts`
(Persistenz-Naht). Noch **nicht** an die UI verdrahtet.

## Leitsatz: es gibt nur Representationen (Konsens 2026-06-08)
Die nutzerseitige **Einheit und der Eingang** ist immer die **Representation**.
Keine freischwebenden Kataloge/Geometrien als eigene Ziele — alles lebt **in**
einer Representation. Man legt zuerst einen **Rep-Draft** an (der zwingt eine
Region, `regional` oder `unbound`); **aus ihm heraus** entstehen Katalog, Boundary,
Wegnetz, Thresholds, Farbe. Folgen:
- **Bestandteile gehören immer einem Rep** (`PartDraft.repId` ist nicht-null).
  Intern bleiben sie inhalts-adressiert (`contentHash`) für Versions-Diff & Freeze.
- **Committete Rep = nur lesbar:** ihre Karte öffnet Katalog/Drawer als
  **Betrachter** dieser Version; editieren geht nicht → neuer Draft → neue Version.
- **UI-Konsequenz (Schicht 2):** Katalog/Drawer/Thresholds sind keine
  freistehenden Panels mit eigenem Region-Wähler mehr, sondern **Werkzeuge im
  Kontext einer Representation** (geöffnet über deren Karte).

## Zwei Achsen
- **Baum:** `Nation → Region → Representation`. Eine Representation hängt an einer
  Region, mit Bindung **`regional`** (geografisch, Anthem-Last wie gehabt) oder
  **`unbound`** (Regions-Zugehörigkeit ohne geografische Bindung — privat/Event;
  hier **kein Anthem in dieser Form**, das Mesh entsteht aus den User-Geräten).
- **Zustand (git-artig):** `local → submitted → committed(=Version)`.

| Zustand | git-Analogie | wer löst aus |
|---|---|---|
| `local` | Working Copy | jeder (Speichern) |
| `submitted` | Pull Request | jeder **außer** Operator (Senden zur Review) |
| `committed` = Version N | Merge + Tag | **nur Operator** (direkt, ohne Review) |

**„Ab wann gilt es als Version?"** → im Moment des Operator-Commits. Editor-Sends
erzeugen nie eine Version, sie befüllen die Einreichung.

## Rechte-Matrix (`visibility.ts`)
| Rolle | sieht | editiert | committen |
|---|---|---|---|
| **operator** | committet (sein Reich) + Einreichungen + eigene Drafts; **nicht** fremde un-eingereichte Drafts | sein Reich | **ja (direkt)** |
| **regio_editor** | **alle** Reps seiner Region | Region | nein |
| **rep_editor** | eigene Reps/Drafts/Kataloge | Eigenes | nein |
| **editor** (ohne Bindung) | eigener unbound-Kram | Eigenes | nein |
| **analyst** | wie Operator, **read-only** | — (Sandbox) | nein |

Keine Crop-Sperre: ein nicht-committetes Wegnetz ist reversibel, das Zuschneiden
also folgenlos bis zum Commit. „Gültig" wird das Wegnetz erst durch den
Operator-Commit, nicht durchs Croppen → der Editor darf beschneiden.

## Versionierung (`lifecycle.ts`)
- **Version = unveränderliches Manifest** `{ repId, version, regionId, binding,
  parts: PartRef[], committedBy, committedAt, note? }`.
- **Granularität = Part-Refs:** der Commit pinnt die Bauteile (catalog · geometry ·
  wegnetz · thresholds · colour) als eingefrorene Refs (`{kind, draftId, contentHash}`).
- **„Einzelteile … gibt es nicht mehr frei":** ein Inhalt, der in einer Version
  steckt, ist eingefroren (`isFrozen`). Ändern = neuer Draft (Fork) → künftige
  Version. Dafür die **Notiz** in der UI.
- `commitRepresentation(rep, parts, operatorId, now, note?)` ist rein (kein
  `Date.now()` intern) → deterministisch & resume-fest.

## Persistenz-Naht (`store.ts`)
Die Logik spricht nur mit `PathworksStore`. Heute später **localStorage** (ein
Browser, kommt mit der Editor-Übersicht), morgen **Worker/R2/D1** (echtes
Cross-User: Editor↔Operator über Geräte; Governance-Schicht ann_105). Interface
steht, Implementierung folgt.

## Editor-Blick = radikal schmal (Schicht 2, später)
Die Komplexität (Nation→Region→Rep-Tabs + Einreichungs-Queue) ist die Last des
**Operators**. Der Editor-Pathworks-Hub ist **eine scoped Liste „mein Kram"**:
Name · Art (regional/unbound) · Zustand-Badge (lokal/eingereicht/committet vN) ·
Aktionen (Speichern, Senden zur Review). Kein Baum. **Review = Sandbox-Sicht des
Operators.**

## Offene Entscheidungen
1. **Rollen-Mapping:** Login kennt `reg_editor`/`rep_editor`; das Domain-Modell
   kennt zusätzlich `editor` (unbound) und nutzt `regio_editor` als „Region-Aufsicht".
   Die saubere Zuordnung Login-Role ↔ Pathworks-ActorRole ist Governance (ann_105).
2. **unbound/Event-Runtime** (device-emergentes Mesh statt Anthem) — Flag steht,
   Runtime später.
3. **Region-Pflicht bei Erstanlage:** Operator legt bei der ersten Representation
   einer Region die Region an (Baustein der Erstanlage-Flows, Schicht 2).
4. **Werkzeuge-im-Rep-Kontext:** Katalog/Drawer/Thresholds vom freistehenden Panel
   zum Rep-Werkzeug umbauen — der konkrete Schicht-2-Schritt.
