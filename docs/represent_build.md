# Represent Build — Architektur der Operator-Werkbank

Stand: 2026-05-27 · Verfasst nach Architektur-Konsens Operator + KI

---

## Worum geht es

Das **Represent Build**-Modell beschreibt die Operator-seitige Werkbank der
SCIM. Es geht nicht um die Pipeline (Telco-Signale, Compute-Schritte) und
nicht um die Endkonsumenten (Ziel-App). Dazwischen liegt der Bereich, in dem
ein Mensch Inhalte komponiert, prüft und für den Deploy freigibt — und genau
dieser Bereich heißt jetzt mit klarem Namen **Represent Build**.

Die Werkbank ist als **Tetraeder** modelliert: drei Produktions-Seiten und
eine Boden-Seite. Jede Seite hat eine klare Verantwortlichkeit und kann von
einem anderen Menschen bedient werden, ohne dass die anderen Seiten warten
müssen. Was die Seiten zusammenhält ist die Organisation am Boden — sie ist
die Empfangshalle, das Sortierregal und der Komponierraum in einem.

---

## Die vier Seiten

### Seite 1 · Geometry Draw

Wer hier arbeitet, denkt **territorial**. Wo verläuft die Grenze des Gebiets?
Was gehört dazu, was nicht? Die Geometrie ist die räumliche Hülle, in der
später die POIs leben werden. Sie wird mit Maus und Geoman-Werkzeugen direkt
auf die Karte gezeichnet, optional mit eingeblendeten POIs eines Katalogs als
visuelle Orientierung. Beim Export entsteht eine GeoJSON-Datei, die im Repo
committed wird.

Die Geometry-Werkbank kennt **keinen** Katalog — sie liest ihn nur lesend zur
Orientierung. Sie weiß auch nichts von Representations, die später ihre Form
weiterverwenden werden. Sie ist purer Geometer.

### Seite 2 · Catalog Magazination

Wer hier arbeitet, denkt **inhaltlich**. Welche POIs gehören in den Katalog?
Welche Beschreibungen, welche Cluster, welche Ghosts? Magazination meint das
Sammeln, Beschriften und Sortieren — wie der Magazinier im Lager, der jedes
Objekt am richtigen Platz weiß. Die POIs werden in einer Plan-md mit Tabelle
gepflegt, gegliedert nach Subkategorien und Clustern.

Die Catalog-Werkbank kennt **keine** Geometrie. Sie weiß nicht, in welcher
räumlichen Hülle ihre POIs später dargestellt werden. Sie ist reiner
Lagerverwalter.

### Seite 3 · Represent Inspection

Wer hier arbeitet, denkt **verifizierend**. Funktioniert die Pipeline? Sind
die berechneten Boundary-Bounds plausibel? Sind die POI-Marker an den
erwarteten Stellen? Welche Routen entstehen unter welcher Auslastung? Die
Inspection-Werkbank rendert die Pipeline-Ergebnisse live auf eine Karte und
erlaubt dem Operator, einzelne Layer ein- oder auszublenden.

Die Inspection-Werkbank produziert **keine** Daten — sie betrachtet nur.
Sie ist die rein observatorische Seite des Tetraeders.

### Seite 4 · Represent Organisation

Wer hier arbeitet, denkt **organisierend**. Welche Geometrie passt zu welchem
Katalog? Welche Kombination soll als Representation deployt werden? Wie heißt
sie, wer hat sie erstellt, wann? Die Organisation-Werkbank ist die
Empfangshalle der drei anderen Seiten: hier laufen die Listen aller
Geometrien, Kataloge und Representations zusammen.

Hier — und nur hier — entstehen neue Representations. Der Wizard ist das
Werkzeug, das eine Geometry und einen Katalog zu einem deploybaren Ganzen
verklebt.

---

## Die Kupplung

Die drei Produktions-Seiten arbeiten **entkoppelt**. Jede produziert in ihren
eigenen Bereich des Repos:

- Geometry Draw → `data/geometries/*.json`
- Catalog Magazination → `data/*_pois_plan.md`
- Represent Inspection → keine Persistenz (rendert nur)

Die Verklebung passiert ausschließlich am Boden, in **Represent Organisation**:

- Eine Representation-Datei in `data/representations/*.json` enthält zwei
  Verweise: `geometry_id` und `catalog_id`. Sonst nichts.
- Eine Geometrie kann von mehreren Representations referenziert werden.
- Ein Katalog kann von mehreren Representations referenziert werden.
- Versionen einer Geometry leben als separate Dateien (`gruenberg.json`,
  `gruenberg-v2.json`) und werden in der Representation explizit per ID
  angesprochen.

---

## Versionierung

Geometrien und Kataloge sind versionierbar. Der **Display-Name** in den
Properties bleibt typischerweise konstant (`name: "Grünberg"`), während die
**technische ID** im Dateinamen die Version trägt (`gruenberg-v2.json`).
So sieht die Ziel-App immer „Grünberg", die Operator-Werkbank weiß aber
genau welche Variante referenziert wird.

Bei mehreren Autoren sortiert die Workspace-Liste nach Display-Name,
gruppiert die Versionen darunter und zeigt pro Version Author und Datum.

---

## Soziale Skalierung

- **Ein Operator (heute):** alle vier Seiten in einer Person, das Tetraeder
  zusammengeklappt im Kopf.
- **Zwei Operatoren:** einer macht Geometry + Organisation, einer macht
  Catalog. Tetraeder klappt auf.
- **Mehrere Operatoren über mehrere Regionen:** spezialisierte Rollen,
  Pull-Requests gegen das Repo, Workspace zeigt nach Author und Region
  filterbar.
- **Mit Auto-Sourcen (z.B. OSM-Bot importiert POI-Kandidaten):** zusätzliche
  Eingangsschleusen mit Validierungsfiltern, neue Rolle „Bot-Aufsicht".

---

## MANUAL · Geometry Draw

1. **Im SCIM-Navigator** den Tab `🗺 Geometry-Editor` öffnen.
2. **Oben links** im Geometry-Picker entweder `— Neu —` wählen oder eine
   existierende Geometrie zum Editieren laden.
3. Wenn neu: **Name** eintragen (Display-Name, später in der Ziel-App
   sichtbar) und optional **Region** als grobe Einordnung.
4. **Rechts oben** im POI-Overlay-Picker einen Katalog wählen, falls du die
   POIs als Orientierungshilfe einblenden willst.
5. **Polygon zeichnen** mit dem Polygon- oder Rechteck-Tool (Toolbar links
   oben auf der Karte). Bei Bedarf editieren, verschieben, löschen.
6. **„⬇ Export"** klicken sobald das Polygon stimmt. Im Modal den JSON-Inhalt
   kopieren.
7. **Datei anlegen** unter `data/geometries/<id>.json` (der Dateiname wird im
   Modal vorgeschlagen). Committen und pushen.
8. **NICHT die rechte Auto-Generierung umgehen.** Wenn der vorgeschlagene
   Dateiname existiert (z.B. `gruenberg.json`), wirst du das Original
   überschreiben — das ist Edit-in-Place. Für eine Version den Dateinamen
   manuell ergänzen (`gruenberg-v2.json`) und in den Properties ergänzen.

---

## MANUAL · Catalog Magazination

1. **Im SCIM-Navigator** den Tab `P02 RegioContent → Katalog` öffnen
   (Operator-Rolle erforderlich).
2. **Region auswählen** oben im Dropdown.
3. **Bearbeiten-Modus** einschalten falls Änderungen geplant.
4. **POI-Zeilen editieren:** Icon, Tagline, Description, Coords, Cluster,
   Status. Tagline-Konventionen (z.B. „A° 1702", „2-Stern", „927 m") triggern
   automatisch passende Decorations.
5. **Cluster-Sort-Modus** wenn du nach Cluster-Zugehörigkeit gruppieren
   willst (Toggle in der Region-Bar).
6. **Änderungs-Popover** wenn du Patches einzeln zurücknehmen willst.
7. **„⬇ Plan exportieren"** sobald fertig. Im Diff-Modal die rechte Spalte
   (neuer Stand) kopieren.
8. **Datei ersetzen** unter `data/<region_id>_pois_plan.md`. Committen.
9. **NIEMALS** im md die Struktur manuell verändern (Spalten, Reihenfolge der
   Tabellen). Die App-seitigen Edits sind der einzige Pfad.

---

## MANUAL · Represent Inspection

1. **Rechter Bildschirmrand:** der Pipeline-Monitor ist standardmäßig
   ausgefahren. Mit dem `▸ / ◂`-Toggle ein- bzw. ausklappen.
2. **Im Header** des Monitors siehst du in einer Zeile, was gerade gerendert
   wird (z.B. `Boundary · 11 POIs · 3 Routen`).
3. **„Layer ▾"** öffnet das Dropdown mit Checkboxen für Boundary, POIs,
   Routen+Edges. An-/Abklicken ändert sofort die Darstellung.
4. **Zoom + Pan** wie gewohnt mit Mausrad bzw. Drag.
5. **NICHT in der Inspection produzieren.** Der Monitor zeigt nur, was die
   Pipeline berechnet — er erlaubt keine Änderungen an Geometrie oder Katalog.
   Wenn etwas falsch aussieht, wechselt der Operator zur entsprechenden
   Produktions-Seite und korrigiert dort.

---

## MANUAL · Represent Organisation

1. **Im SCIM-Navigator** den Tab `⌂ Workspace` öffnen — das ist die
   Empfangshalle der Represent-Build-Werkbank.
2. **Drei Listen** sind sichtbar: Boundary-Geometrien, Kataloge,
   Representations. Jede zeigt Anzahl, Namen, ID, Anzahl der enthaltenen
   Punkte.
3. **„+ neue Geometry"** springt direkt in den Geometry-Editor.
4. **„+ neue Representation"** öffnet den Wizard:
   - Name (Pflicht, Display-Name)
   - Boundary-Geometry-Picker (Pflicht)
   - Katalog-Picker (optional)
   - Notiz (optional)
5. **„JSON in Zwischenablage"** im Wizard. Datei anlegen unter
   `data/representations/<id>.json`. Committen.
6. **NICHT ausserhalb des Wizard** eine Representation-Datei manuell
   zusammenbasteln. Der Wizard prüft Pflichtfelder, schlägt einen kollisions-
   freien Dateinamen vor und garantiert ein syntaktisch valides Schema.

---

## Wo wir heute stehen

- Geometry Draw: funktional, vollbildig, mit POI-Overlay.
- Catalog Magazination: funktional, Editor mit Cluster-Sort und Änderungs-
  Popover.
- Represent Inspection: funktional, Layer-Toggle und Einklapp-Möglichkeit.
- Represent Organisation: funktional, Wizard zur Komposition, Listen mit
  Counts.

Was fehlt: Versionsverwaltung (`-v2`-Suffix automatisch), Workspace-Filter
nach Author/Region, Konflikt-Warnungen wenn Geometry-IDs kollidieren,
aktive-Representation-Kontext (Pipeline-Monitor zeigt automatisch die
gewählte Representation). Diese Punkte werden in Phase 3+ ergänzt.
