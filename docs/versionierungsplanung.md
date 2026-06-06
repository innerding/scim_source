# Versionierungsplanung — Representation als Kapsel (Planung, Bau verschoben)

**Status:** Konzept-Planung 2026-06-06 (Broda, laut gedacht → hier festgehalten).
**Bau bewusst verschoben** — dies ist die Richtungs-Entscheidung, nicht die Umsetzung.
Schließt an `docs/versionierung.md` an (dort: Shell/Origin/Anthem-Kadenz).

---

## Leitprinzip: Kapselung

> **Ein Objekt (Katalog, Boundary, Wegnetz) kann eigenständig erzeugt werden — aber
> sobald es in einer Representation aufgenommen wird, existiert es nicht mehr als
> Einzelobjekt. Es geht in der Representation auf.**

Das ist die entscheidende Regel. Folge: Die **Representation ist die Einheit von
Identität UND Version.** Keine losen Referenzen mehr, die sich „unter der Hand" ändern.

Eine Representation ist „eine **Gruppe mit Bindung**" (Geometry ⊕ Katalog ⊕ Wegnetz).

---

## Eine Versionslinie (vereinfacht)

Frühe Überlegung war: drei Versionslinien (Katalog / Boundary+Wegnetz / Representation).
**Verworfen zugunsten EINER Linie:** Weil die Komponenten absorbiert sind, wird **nur die
Representation versioniert.** Ein Katalog-Commit erzeugt **keine** eigenständige
Katalog-Version — er **aktualisiert** den (in der Rep gekapselten) Katalog, und die
**Representation** bekommt dadurch eine neue Version.

→ **Representation-Version = Origin-Version** (schließt die Kette aus `versionierung.md`).

---

## Lebenszyklus / Workflow

1. **Standalone erzeugen** (vor Aufnahme):
   - Ein **Katalog** kann angelegt werden.
   - Eine **Boundary** kann angelegt werden — mit oder ohne **Wegnetz**.
     (Das Wegnetz bindet sich immer an seine Boundary; Boundary zuerst.)
2. **Aufnahme in eine Representation:** Werden diese Objekte über eine Representation
   ausgewählt, **verschwinden sie als Einzelobjekte** und gehen in der Representation auf.
3. **Ändern = über die Representation:** Alles wird **aus der Representation heraus**
   geöffnet (Katalog-Editor, Drawer). Es gibt keinen Zugriff „an der Rep vorbei".
4. **Versionieren = Kopie → ändern → committen:**
   - Eine Representation wird **kopiert** (Kopierfunktion im Workspace) → liegt als
     **Ghost/Kopie** vor (uncommitted Arbeitsstand).
   - Aus der Kopie Katalog oder Drawer öffnen, ändern, committen.
   - Der **„Representations-Kopie-Commit-Button"** macht aus der Kopie eine **Version**.
     (Das ist der EINZIGE Ort, an dem eine Version entsteht.)
   - Normales Speichern (z.B. ein Drawer-Draft) erzeugt **keine** Version — nur einen
     Arbeitsstand.
5. **Invariante:** Versionierbar ist eine Representation **nur, wenn sie voll ist**
   (verfügt über Geometry + Katalog + Wegnetz).
6. **Sonderfall Hülle:** Aus einer kopierten Representation können Objekte gelöscht
   werden → ein Einzelobjekt besteht dann wieder, aber **innerhalb einer
   Representations-Hülle**. Solange unvollständig: nicht versionierbar.

---

## Workspace-Konsequenzen (was fehlt / zu bauen wäre)

- **Kopierfunktion** für Representations im Workspace (erzeugt den Ghost/Arbeitsstand).
- **„Öffnen aus der Representation"**: Katalog-Editor und Drawer werden über die
  Representation aufgerufen, nicht über freistehende Objekte.
- **Wegnetz-Logik im Workspace** ist heute dünn — Boundary↔Wegnetz-Bindung sauber
  abbilden.
- **Absorption sichtbar machen:** Einzelobjekte, die in eine Rep aufgegangen sind,
  verschwinden aus den Einzel-Listen (oder werden als „in Rep X gebunden" markiert).
- **Vollständigkeits-Check** als Voraussetzung für den Versions-Commit.

---

## Verhältnis zum Ist-Stand (heute)

- Heute: `id = 'rep-' + slugify(name)` aus freiem Namen; Geometry ist Anker, Katalog nur
  optionale Referenz; `version` zählt beim Re-Commit hoch (`WorkspacePanel.tsx:262`).
- Problem: lose Referenzen (Katalog ändert sich „unter der Hand"), ID aus freiem Text
  (Umbenennen verwaist die ID + alle Downstream-Keys).
- Das Kapsel-Modell ersetzt das: stabile Rep-Identität, absorbierte Komponenten,
  Version nur über Kopie-Commit.

---

## Offene Entscheidungen (vor dem Bau zu klären)

1. **Teilen/Besitz:** Darf derselbe Katalog in **mehreren** Representations stecken,
   oder ist er nach Aufnahme **exklusiv** dieser einen Rep (Kopie statt Teilen)?
   (Exklusiv = einfacher, jede Rep self-contained. Empfehlung: exklusiv für MVP.)
2. **Identitäts-Schema der repId:** woraus die stabile ID? (Katalog-verankert /
   Region+Katalog / fixe ID frei benennbar — noch offen, siehe `versionierung.md`.)
3. **Absorption technisch:** wird das Einzelobjekt beim Aufnehmen **verschoben**
   (in die Rep), **kopiert**, oder bleibt es liegen und wird nur als „gebunden" markiert?
4. **Downstream-Migration:** repId ist load-bearing (Runtime-URL, Worker-Keys, Presence).
   Schema-Wechsel = Migration, eigener Schritt.

---

## Abgrenzung

Dies ist **Planung**. Der Umbau ist **verschoben**. Akute Frische-Probleme
(Re-Publish/Deco) werden unabhängig über den kleinen `no-store`-Fix gelöst, nicht über
diesen Umbau.
