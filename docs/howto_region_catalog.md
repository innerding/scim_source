# Wie lege ich einen Katalog für eine neue Region an?

**Playbook am Beispiel Grünberg, anwendbar z.B. für Lichtenberg.**

---

## MVP-Version für schnelle Demo

Die MVP-Variante deckt das Mindeste ab, damit eine neue Region in der Ziel-App vorzeigbar wird. Sie kennzeichnet sich durch klare Beschränkungen — bewusst weniger Aufwand, bewusst weniger Tiefe.

**Beschränkungen:**

- **Der Schreibtisch wird nicht verlassen.** Keine Vor-Ort-Begehung, keine GPS-Aufzeichnung. Alle POI-Daten stammen aus digital recherchierbaren Quellen.
- **Nur cross-referenzierte POIs werden verwendet.** Ein POI kommt nur dann in den MVP-Katalog, wenn er in **mindestens zwei unabhängigen Quellen** auftaucht (z.B. OSM + Tourismus-Webseite). Die Hauptarbeit besteht im Erkennen, welche Quell-Einträge sich tatsächlich auf dasselbe Objekt beziehen — Halbduplikate wie „Gasthof X" vs „X-Wirt" zusammenführen.
- **Icons ausschließlich aus dem bestehenden SCIM-System**, bezogen von [Tabler Icons](https://tabler.io/icons). Keine neuen handgezeichneten Icons für MVP. SCIM hat einen Tabler-Adapter im `svgCleaner`, der die 24×24-Tabler-SVGs automatisch in unser 48×48-Format wrappt — drop-and-go.
- **Mindestens 15 POIs**, gerne bis ca. 25 für eine angemessene Demo. Mehr braucht es nicht — Grünberg hat zwar 48, das ist für MVP-Demo aber nicht nötig.
- **Nur Tagline + Description short pflegen.** Keine `description_long`, kein `image_url`, kein `external_link`. Diese Felder bleiben für die Voll-Version.
- **Cluster optional.** Wenn aus den Quellen keine offensichtlichen POI-Häufungen erkennbar sind, lass Cluster komplett weg. Geclustert wird erst in der Voll-Version oder bei klarer Häufung (3+ POIs an einem Ort).
- **Existierende Subkategorien nutzen.** Keine neuen Buckets/Subkats erfinden. Wenn ein POI nicht perfekt in die 12 vorhandenen Subkategorien passt, lieber „Verwandtschafts-Subkat" wählen oder weglassen.
- **Coord-Status ≈ ist OK.** Keine Anforderung an 100 % `✓`. Für MVP-Demo reicht „ungefähr richtig". Coord-Genauigkeit wird in der Voll-Version nachgezogen.
- **Source-of-Truth für POI-Identität:** OSM-Name wenn vorhanden, sonst der häufigste Name unter den Quellen.

**Aufwand-Schätzung MVP:** halber Tag bis Tag konzentrierter Recherche- und Eintrag-Arbeit. Plus 1 Dev-Session zum Einbauen ins System.

**Nicht im MVP enthalten:**

- Voll-Konzeption (siehe Voll-Version unten)
- Ghost-Cluster-POIs (kommt mit Phase 1 der Ziel-App-Roadmap, ann_050)
- Promotion-Pipeline (Phase 4 der Gesamt-Roadmap)
- Cross-Region-Touren

---

## Voll-Version (für reife Region-Erstellung)

Wenn nach der MVP-Demo eine vollständige Region aufgesetzt werden soll — z.B. mit Vor-Ort-Recherche, kuratierten Icons, ausführlichen Beschreibungen und Tour-Vorschlägen — folgt die Voll-Version nachstehende Phasen.

### Phase 1 · Region definieren

Bevor irgendwelche POIs gesammelt werden:

- **Geografische Grenze:** Wo fängt die Region an, wo hört sie auf? Bei Grünberg ist es ein klar abgegrenztes Berggebiet (Plateau + Umgebung des Traunsees). Lichtenberg braucht eine vergleichbar klare Grenze (z.B. Bounding-Box in Coord oder eine geografische Linie).
- **Schwerpunkt:** Was steht thematisch im Zentrum? Bei Grünberg: Wandern + Bergbahn-Erschließung. Bei Lichtenberg: bitte selbst formulieren.
- **Region-ID festlegen:** kebab-case lowercase, ASCII (`gruenberg`, `lichtenberg`).

### Phase 2 · POI-Quellen sammeln

Mehrere parallele Quellen, je breiter desto besser:

- **OpenStreetMap (OSM):** mit Overpass-Turbo eine Query wie `node["tourism"]["name"](around:5000, 47.9, 13.81)` → liefert touristische POIs in einem Radius. Filter nach Tags wie `tourism=viewpoint`, `amenity=restaurant`, `cable_car=station`, `historic=castle`, etc.
- **Wanderkarten / regionale Tourismus-Seiten** → strukturierte POI-Listen mit Beschreibungen
- **Vor-Ort-Wissen** → POIs, die in OSM fehlen oder anders heißen
- **Eigene Begehung / Fotos** → letzte Lücken schließen
- **Wander- oder Reiseführer** → Pflichtpunkte + Spezialitäten der Region

### Phase 3 · Roh-POI-Liste

Strukturiere das gesammelte Material in einer Tabelle:

| Name | Typ-Stichwort | Coord (lon, lat) | Quelle | Notizen |
|---|---|---|---|---|
| Katzenstein | Aussichtspunkt, Gipfel 1349 m | 13.85929, 47.87454 | OSM viewpoint | "spektakuläre Sicht" |
| Hois'n | Restaurant am Seeufer | 13.81153, 47.88083 | OSM amenity | Saisonal? |

Markiere unklare Coords mit `≈` (geschätzt) oder `❓` (fehlt) — das wird später der **Coord-Status** in der Plan-md.

### Phase 4 · Operator-Kategorisierung

Hier wandelst du die rohen Typen in **Operator-Buckets + Subkategorien** um (nicht OSM-Kategorien):

- **Points** (Kreis) — `historical` (Burg/Schloss/Denkmal) · `others` (Sendemast/Botanik/Brunnen)
- **Squares** (Quadrat) — `Rest` (Aussicht/Rast passiv) · `Move` (Spielplatz/Sport/Attraktion aktiv)
- **Regenerate** (Tropfen) — `Substanze` (Gasthaus/Bar) · `Water` (Trinkwasser/Bade)
- **Transport** (Rechteck hoch) — `Vehicle` (Bahn/Schiff) · `Parking` (Parkplatz)
- **Service** (Rechteck quer) — `Sleep` (Hotel) · `Others` (Mechaniker/Apotheke)
- **Help** (Dreieck) — `order` (Sperre/Governance) · `emergency` (Notruf)

(Vollständig in `data/grunberg_pois_plan.md` Tabelle 3 + im SCIM-Katalog-Tab.)

**Pro POI festlegen:** Bucket + Subkategorie + Icon-Referenz.

### Phase 5 · Coords vervollständigen

Für `≈` und `❓`:

- **In OSM nachschauen:** oft sind POIs vorhanden, nur unter anderem Namen
- **Manuell in OSM-Editor (iD/JOSM):** Position auf der Karte ablesen
- **Mit dem Handy vor Ort:** GPS-Koordinate aufzeichnen
- **Schätzen:** wenn nur ungefähre Lage bekannt, ehrlich als `≈` lassen

→ Ziel: möglichst viele `✓`, wenige `≈`, **keine `❓`** in der finalen Plan-md.

### Phase 6 · Cluster identifizieren

Schau dir die POI-Liste auf der Karte an (in OSM/Maps eintragen) und such nach **räumlichen Häufungen**:

- Mehrere POIs sehr nah beieinander? → Cluster-Kandidat
- Wo ist das thematische Zentrum (das Bauwerk oder Wahrzeichen, das alle „gehören" zu)?

Bei Grünberg z.B.:
- **Sender-Cluster:** 9 POIs am Berggipfel — Sendemast als Identity
- **Talstation-Cluster:** 7 POIs an der Bergbahn-Talstation — Talstation-Gebäude als Identity (bzw. später Bergbahn-Ghost)
- **Badewiese Weyer:** 5 POIs am See-Ufer — Badehose als Identity

Pro Cluster: **Name + Hover-Text + Identity-POI** festlegen.

Optional: **Lockere Cluster** (in Klammern, kein Identity-Icon) für thematisch zusammenhängende POIs ohne klares Zentrum.

### Phase 7 · Plan-md aufsetzen

Verwende die existierende `grunberg_pois_plan.md` als **Template**:

1. Datei kopieren als `data/<region>_pois_plan.md`
2. Header anpassen (Titel, Region-Name, Stand-Datum, POI-Anzahl)
3. Tabelle 1 leeren, dann Subkategorie-für-Subkategorie deine POIs eintragen
4. Tabelle 2 (Kategorien-Übersicht) aus deinen tatsächlich verwendeten Icons befüllen
5. Tabelle 3 (Container-System) **unverändert übernehmen** — das ist regionsübergreifend
6. Cluster-Sektion mit deinen Clustern + Hover-Texten + Mitgliederlisten
7. Optional: Notiz mit regionsspezifischen Anmerkungen

→ Format-Hilfe: jede POI-Zeile ist `| icon | tagline | description | coord | cluster | status |` (6 Spalten seit MVP-Abschluss).

### Phase 8 · Iteration im Katalog-Tab

- Datei pushen, Auto-Deploy abwarten
- Im SCIM den Region-Switcher auf die neue Region stellen (siehe Phase 9 für Code-Side)
- Visual prüfen: zeigt jedes POI sein Composite richtig? Passen die Cluster-Zuordnungen? Sind alle Coords plausibel?
- Editor verwenden um schnell zu korrigieren, "Plan exportieren" für den Export der bereinigten Datei
- POIs gegen Plan-Map abgleichen — wo sitzt was?

### Phase 9 · Einbindung als zweite Region im System

Sobald die Plan-md steht:

1. **Region-Eintrag im Katalog-Tab:** in `CatalogTab.tsx` REGIONS-Array um den neuen Eintrag erweitern (`{id: 'lichtenberg', name: 'Lichtenberg', md: lichtenbergMd}`)
2. **Vite-Import:** `import lichtenbergMd from '../../../../data/lichtenberg_pois_plan.md?raw';`
3. **Build + Push** → Region erscheint im Region-Switcher
4. Optional: **Ziel-App** integriert die neue Region automatisch (sobald Phase 3 des Umbauplans steht, ann_050)

### Phase 10 (später) · Promotion zur Ziel-App

Sobald die Promotion-Pipeline (Phase 4 der Gesamt-Roadmap) gebaut ist:
- Plan-md → ScimRepresentation
- ScimRepresentation → ScimBundle → R2/Worker
- Ziel-App lädt Bundle → rendert deine Region

Bis dahin: direkter Vite-Import wie Grünberg.

---

## Daumenregeln für die Effizienz

- **OSM-First:** wenn ein POI in OSM existiert, nimm Coords + Name direkt von dort. Konsistent mit der Welt.
- **Pareto:** 80 % der POIs sind in 20 % der Zeit erfasst. Die letzten 20 % (versteckte Lokale, neue Bauten) brauchen Vor-Ort-Wissen.
- **Lieber zu viele als zu wenige:** sammle erst breit, kuratiere dann. Im Katalog-Editor kannst du POIs jederzeit löschen.
- **Iteriere in Etappen:** erst grob (alle POIs ohne Cluster), dann verfeinern (Cluster definieren, Icons zuweisen, Decorations setzen).
- **Status ❓ ist OK als Zwischenstand:** lieber eine erkannte Lücke als ein vergessener POI.

---

## Icons aus Tabler verwenden

1. Auf [tabler.io/icons](https://tabler.io/icons) das passende Icon suchen
2. **Stroke-Width auf 1 stellen** (rechts oben am Vorschau-Modal) — Tabler-Default ist 2, SCIM-Konvention ist 1
3. SVG herunterladen
4. In `data/icons/` ablegen — der `svgCleaner` mit Tabler-Adapter wrappt automatisch in SCIM-Format (24×24 → 48×48 mit translate(12,12), `currentColor` → `#000`, Hintergrund-Platzhalter entfernt, drawing-id aus Tabler-Klasse übernommen)
5. Push → Icon erscheint in der Bibliothek
6. Im Katalog-Editor per Picker bei beliebigem POI zuweisen

Damit kannst du in 5 Minuten ein neues Icon ins System bringen, ohne Illustrator anwerfen zu müssen.

---

## Verweise

- **ann_040** — Icon Intake Convention (Format-Spec)
- **ann_042** — Container, Geometrien & Palette (Bucket → Geometrie → Farbe)
- **ann_043** — Cluster-Hexagon & Merging-Verhalten
- **ann_045** — Status-Snapshot der Icon-Pipeline
- **ann_046** — Was der Katalog noch braucht (Per-POI-Felder, Ghost)
- **ann_048** — Ghost-Cluster-POI mit Coord-Vererbung
- **ann_049/050** — Ziel-App-MVP-Definition + Umbauplan
