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

---

## Kosmologie-Update — Mai 2026 (Session-Konsens)

In der Session vom 27. Mai 2026 hat sich das Modell deutlich weiterentwickelt.
Die ursprünglichen vier Faces und drei Bögen wurden umbenannt und in eine
größere kosmologische Schichtung eingebettet. Was nun folgt **ersetzt** an
einigen Stellen die obigen Texte; was hier nicht erwähnt wird, gilt unverändert.

### Renaming

**4. Triangle** (Top-Position, Apex zeigt nach oben):
- vorher: *Represent Inspection* (`ins`)
- jetzt: **Sensus Core Build** (`scb`)
- Begründung: Inspection ist eine *Sicht* (siehe Inspector unten), kein
  Baustein. Was an dieser Position wirklich passiert: der Apex feuert das
  fertige Bündel als **Sensus Core Package** zum Mond. Click → P11.

**3. Sphere** (unten, zwischen `cat` und `geo`):
- vorher: *Manual* (`man`)
- jetzt: **Load Thresholds** (`loa`)
- Begründung: Sym­metrie der Schwellen-Trilogie. Sys (P01) · Rou (P02 heute,
  P10 später) · Loa (P09). Manual war ein Service-Fremdkörper im
  Architektur-Anker.

Das alte Manual lebt jetzt als **kleines `📄`-Icon links** zwischen Mond
und Tetraeder, daneben rechts ein **`📖` Reader-Icon**. Klick auf den Reader
öffnet das Manual-Modal. Diese Asymmetrie ist gewollt: das Manual ist tot
ohne Leser; der Leser bringt es zur Sprache.

### Die drei Schichten

```
           ☾   Mond — App-Shell + Engine + R-Bibliothek
                Auswüchse im Logo = die R's (manche eckig=Tetraeder, manche
                rund=Sphere)
                Hex im Zentrum = die *eine* Engine, die alle R's teilen

       ─ ─ ─ ─ ─ ─ ─ ─ ─

           ▲   Tetraeder — eine R im Bau
         ╱ │ ╲   4 Faces = Bausteine: scb(top), geo, org, cat
        ╱  │  ╲  3 Spheres = Schwellen: sys, rou, loa
       ╱   │   ╲  3 Sicheln zwischen Bögen und Triangles = Prozess-Fenster
      ╱────┴────╲
       (Inspector-Trapez aus Pergament über dem Mond,
        88% transluzent, Klick toggelt die Karten-Sicht)

   ≡≡≡≡≡≡≡≡≡≡≡≡≡≡  Empty-Sea-Oberfläche

   ░░░ Pipeline (P03–P14) ░░░  unter Wasser, gespeist aus ...

   ≋≋≋≋≋≋≋  Operator-Dimension (tiefer als Funk; rein menschliche Intention)
```

**Mond = App-Shell mit Engine.** Im SVG sichtbar als das nackte SCIM3-Logo
(siehe `src/assets/logo-base-naked.svg`). Die organischen Auswüchse darin
**sind** die R's: manche noch eckig (frisch deployed Tetraeder-Form), manche
schon rund (gereift, vom Colourmesh umhüllt). Im Zentrum sitzt der **Hex**
(`src/assets/logo-hex-naked.svg`) — die **eine geteilte Engine**, die alle
R's bedient. Der Hex **pulsiert** im 3.2-s-Takt: das ist der **Atem der
Engine**. Atem = Load durchströmt die Engine.

**Tetraeder = lokale Composition einer R.** Sitzt im Navigator unter dem
Mond. Apex zeigt nach oben Richtung Mond — von dort feuert `scb` das fertige
Bündel zur Bibliothek.

**Sicheln** = die drei sichelförmigen Räume *zwischen* den äußeren Triangles
und ihren überstehenden Bögen. Heute leer, kosmologisch reserviert als
**Beobachtungs-Fenster in den Prozess**: durch sie hindurch sieht man, was
unter der Orga gerade verarbeitet wird. Vorbereitet, noch nicht implementiert.

**Inspector** = das **Pergament-Trapez** über dem Mond. Perspektivisch
verjüngt nach unten, kein Stroke, fill `#e8d4a8` zu 12 % Opazität.
Konzeptionell ist er das **Firmament**, das sich über die ganze Werkbank
spannt — die alles-sehende Sicht. Funktional: Klick toggelt die ScimMap.
Inspector ist **keine Komponente** mehr (war früher die 4. Face), sondern
eine *Sicht*. Der ausgeklappte Mond-Monitor rechts (ScimMap) ist seine
sichtbare Manifestation.

### Lifecycle einer Representation

Eine R hat zwei visuelle **Aggregatzustände**:

| Form | Bedeutung | Wann |
|---|---|---|
| **Tetraeder** | roh komponiert, deployed aber noch nicht gelebt | direkt nach erstmaligem Deploy |
| **Sphere** | mit Colourmesh umhüllt, die Engine hat sie geatmet, sie ist live | nach Engine-Lauf |

Der **Strahl vom Apex zum Mond** ist der **Akt der Kausalität** zwischen
lokaler Composition und globaler Bibliothek. Zweimodig:

- **(a) Erstmaliger Deploy**: Strahl trägt ein neues Tetraeder hoch → ein
  neuer Auswuchs am Mond entsteht (Tetraeder-Form).
- **(b) Re-Deploy / Engine-Atmung**: Strahl feuert **Colourmesh-Pulse** →
  Mond-Tetraeder werden umhüllt, reifen zur Sphere.

Die Sphären-Bögen am Tetraeder können sich in der Spätversion **drehen** und
geben den Spalt frei, wenn gefeuert wird (Mechanik für die Zukunft).

### Was heute wirkt vs. Vision

| Element | Status |
|---|---|
| Tetraeder mit 4 Faces + 3 Spheres | ✓ implementiert |
| scb als Top, Apex sichtbar | ✓ implementiert |
| Inspector-Trapez Pergament-Look | ✓ implementiert |
| Manual + Reader Asymmetrie | ✓ implementiert |
| Mond als nacktes Logo + Hex-Pulse | ✓ implementiert |
| Colour-Mesh entlang OSM-Wegen (Overpass) | ✓ implementiert |
| Per-Edge-Gradient für Heat-Pipes | ✓ implementiert |
| Workspace zeigt localStorage-Draft als DRAFT | ✓ implementiert |
| Wizard bietet Geometry- + Representation-Copy | ✓ implementiert |
| Sicheln als Prozess-Fenster | nur reserviert, nicht aktiv |
| Strahl-Animation Tetraeder → Mond | Vision |
| Drehende Sphären beim Feuern | Vision |
| Mond-Auswüchse als anklickbare R-Bibliothek | Vision |
| Inspector als Firmament (visueller Schein) | nur als Trapez angedeutet |
| Pipeline-Visualisierung als Unterwasser-Schicht | Vision |
| Operator-Dimension darunter | Vision |

### Architekturregeln (Session-Konsens)

1. **Pipeline bleibt unangetastet.** Tetraeder ist eine *Schicht darüber*,
   nicht *in* der Pipeline. Code-seitig hat keine kosmologische Änderung je
   `useScimPipeline.ts` oder die Pipeline-Panels berührt.
2. **Click-Targets der Bögen sind Convenience-Brücken** zu existierenden
   Pipeline-Panels (sys→P01, rou→P02, loa→P09, scb→P11). Sie sind nicht der
   architektonische Anspruch — sie sind Übergangsverdrahtung, bis echte
   Threshold-Editoren existieren.
3. **Kompromisslosigkeit:** kein Hack im Pipeline-Pfad. Wenn etwas in der UI
   nicht klar ausdrückbar ist, eher Labels schärfen als Pfade krümmen.
4. **Direktester Weg:** Umbauten gehören sorgfältig geplant. Nicht
   herumbasteln.
5. **Git als Review-Mechanismus:** Geometrien, Kataloge und Representations
   leben im Repo. Browser kann nicht ins Repo schreiben. Pull-Requests sind
   der Mehr-Personen-Approval (für später, wenn Backend kommt).

### Representation: heute manifest, morgen Wirkung

Ehrlicher Status (Stand 27. Mai 2026):
Eine `data/representations/*.json`-Datei ist heute **ein Manifest ohne
Konsumenten**. Sie wird in der Workspace-Liste angezeigt. Sie wird **nicht**
gelesen vom Map-Renderer, **nicht** von der Pipeline, **nicht** vom
Colour-Mesh. Sie ist eine Versprechungs-Datei.

**Sobald sie Wirkung bekommen soll, braucht es vier kleine Stücke:**

| Stück | Beschreibung |
|---|---|
| **URL-Parser** | `location.pathname` wie `/<region>/<r-name>` → matched Representation in der Registry → setzt `activeRepresentationId` |
| **RepresentationContext** | React-Context für aktive R; alle Komponenten abonnieren |
| **Map-Verdrahtung** | ScimMap fittet auf `activeRep.geometry`, holt OSM für diese bbox, lädt POIs aus `activeRep.catalog_id` |
| **Cloudflare SPA-Fallback** | `_redirects`-File damit `/böhmerwald/lichtenberg` zum SPA geht statt 404 |

Erst nach diesen vier Stücken hätte `scim3.diesenpark.com/böhmerwald/lichtenberg`
tatsächlich Lichtenberg-fokussierte Wirkung. Das ist der nächste **klar
abgegrenzte** Schritt — kein Architektur-Risiko, kein Pipeline-Bruch.

### Color-Mesh Designentscheidungen (festgehalten)

- **Echte OSM-Wege** via Overpass-API (`fetchOsmEdges` in `colourMeshOverlay.ts`).
  24h-Cache pro bbox in localStorage.
- **Fallback** wenn Overpass langsam/down: synthetisches Netz aus 32 Knoten
  mit k-NN-Verbindungen (deterministisch, seed=7). Auto-Switch, sobald OSM da.
- **Per-Edge-Gradient**: jede Edge in 6 Segmente, jedes mit eigener Heat-Farbe
  nach Last am Segment-Mittelpunkt.
- **Heat-Pipe-Palette** (kein Gelb mehr): navy → electric blue → cyan-teal →
  lavender → magenta. Vermeidet "Schwefelgas"-Look.
- **Base-Tile im Mesh-Modus**: `dark_nolabels` von CartoDB — Heat-Farben
  poppen auf dunklem Grund.
- **Fake-Load** = max-Gauss von 4 synthetischen Hotspots + POI-Positionen
  (deterministisch, seed=42). Echter Load (P04 Telco) ist Phase 2.

### Was offen bleibt (priorisiert)

1. **R-Konsument bauen** (URL-Routing + Context + Map-Verdrahtung +
   `_redirects`) → erste *funktionale* R.
2. **Sicheln** als Prozess-Fenster sichtbar machen.
3. **Inspector als Firmament** visuell ausbauen (Wellenwurf-Spiegel, später).
4. **Strahl-Animation** vom Apex zum Mond beim scb-Click.
5. **Drehende Sphären** beim Feuern.
6. **BCK/BAK-Routing** auf den generierten Routen.
7. **Backend für echte Reviews** (Cloudflare Worker + GitHub API), wenn
   Mehr-Personen-Workflow nötig.

