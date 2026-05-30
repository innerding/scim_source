# F7-Bauplan — Drawer-Lifecycle & gemeinsamer Verbund-Commit

*Stand 2026-05-30 · Ergebnis der Brüt-Session zu Boundary/Maske/Wegnetz · Annotation `ann_077`*

## Tragendes Prinzip

> **Die finale Boundary entsteht aus dem Netz, nicht umgekehrt.**
> Der Draft hält den Rohzustand (editierbar bis zuletzt). Der Commit leitet das
> Endprodukt ab (Crop, Gates) und friert es ein — der einzige Punkt ohne Rückweg.

**Symmetrie der zwei Netz-Herkünfte:** **B1 entsteht aus dem OSM-Netz** (roh, das
Einzugsgebiet — worauf wir das Netz holen). **B2 entsteht aus unserem Netz** (dem
künftigen **Colour-Mesh**) — feiner und von anderer Herkunft, SCIM-getrieben statt
OSM-getrieben. Heute reicht die Kette bis zum gefilterten/gecroppten Wegnetz
(Vorstufe); im Zielbild entsteht B2 aus dem Colour-Mesh. Dieselbe Stelle im
Lebenszyklus, nur das Netz darunter wird reicher.

## Zwei Boundaries

| | Rolle | Farbe | Schicksal |
|---|---|---|---|
| **B1 — Referenz** | grobe Arbeitsfläche + Namensträger; auf ihr wird das Netz geholt; Orientierung für den exakten Bau | **gelb** (Draft) → **orange** (mit Katalog) | läuft bis zum Commit mit, **wird beim Commit gelöscht** |
| **B2 — finale Boundary = Maske** | die präzise, netz-informierte Linie; identisch mit der Crop-Maske | **rot** → (maskiert) blau-gestrichelt / rot+Schraffur | wird die **committete** Boundary; erbt B1s Namen; benennt das Wegnetz |

B2 wird **über** B1 gezeichnet (der „2. Slot"). Erst durch das erstellte Wegnetz
weiß man, wo B2 exakt schneiden muss — B2 ist feingliedriger als B1.

## Lebenszyklus

1. **B1 zeichnen** (Umriss-Tab) → gelb. Katalog im Workspace binden → orange, POIs scharf.
2. **Wegnetz holen** (Wegnetz-Tab, „Anwenden") auf Basis von B1.
3. **B2 zeichnen** (2. Slot, rot) über B1 — netz-informiert, exakt.
4. **Maskierungs-Button** → B1 wird ausgeblendet · Boundary gesperrt ·
   - Umriss-Tab: B2 erscheint **blau-gestrichelt**.
   - Wegnetz-Tab: B2 bekommt **rote Schraffur außen** (verdeckt die Umgebung, hebt die Representation hervor).
   - „Speichern" wird zu **„Ready for Commit"**.
5. **Commit (im Workspace, aus der Draft-Zeile)** → Boundary (B2) + Wegnetz
   **gemeinsam, untrennbar** committet; Crop läuft jetzt mit B2; Gates abgeleitet;
   B1 gelöscht; alles benannt nach B1.

## Speichern & Rückgängig

- Ungespeichert → Zustand wird gehalten, über **Rückgängig-Dropdown** Schritt für Schritt reversibel.
- **Speichern** leert den Rückgängig-Cache (neue Basis).
- Ohne Speichern: Datei bleibt im Drawer (bei jedem Öffnen da).
- Mit Speichern: bleibt nur, solange der Drawer offen ist; danach lebt sie als Draft im Workspace, der Drawer öffnet leer.

## Invarianten

- **Boundary + Wegnetz = eine untrennbare Einheit.** Gemeinsam committet, gemeinsam eingefroren; nie getrennt. Die Representation klammert beide per id.
- **Crop am Commit, nicht im Drawer.** Bis dahin bleibt das Netz voll und editierbar.
- **Committete Representation im Drawer = nur Ansicht** (keine Werkzeuge, keine Bearbeitung).
- **committet = blau-solid**, **committbar = blau-gestrichelt** (gleiche Farbe, Strich unterscheidet).

## Zukunfts-bereit (nicht jetzt bauen, aber nicht verbauen)

- **Löcher / Inseln:** eine Boundary mit innerer Aussparung → **Ausschlusszone fürs Netz**,
  vereinfacht die Netzbildung. Heute schon darstellbar (GeoJSON-Polygon innere Ringe;
  `BoundaryGeometryFile.geometry.coordinates` trägt es).
- **Mehrere getrennte Boundaries** (MultiPolygon) → kleine Typ-Erweiterung später.
- **Crop mit Löchern:** `cropNetToMask` schneidet heute gegen *einen* Ring; Löcher-
  Berücksichtigung ist eine spätere Verfeinerung.

## Bau-Schritte (gestaffelt, je deploybar)

- **F7.1 — Draft hält Rohzustand.** Draft-Typ erweitern: `reference` (B1), `boundary`
  (B2), volles `net`. Explizites Speichern + (später) Undo-Historie.
- **F7.2 — Zwei-Boundary-Zeichnen.** B1 (gelb/orange Referenz) + B2 (2. Slot, rot, drüber).
- **F7.3 — Maskierungs-Button.** Sperre B1; Farben je Tab (blau-gestrichelt / rot+Schraffur);
  „Speichern" → „Ready for Commit"; `finalized`-Flag.
- **F7.4 — Verbund-Commit aus der Draft-Zeile.** B2 + gecropptes Wegnetz + Representation
  gemeinsam; B1 löschen; alte Übergabekarte + Handoff (`scim3:represent_handoff`) entfernen;
  alte F1/F2/F3-Buttons ablösen.
- **F7.5 — committet = nur Ansicht** im Drawer.

## Offene Kleinigkeiten

- Erlaubt „Ready for Commit" noch Masken-/B2-Anpassung, oder ist ab da Schluss mit Ändern?
- Schraffur-Visual: schräge durchgezogene Linien außen (invert), genaue Dichte offen.
- Maskierungs-Button trägt zwei Rollen (Lebenszyklus-Tor + Ansichts-Modus) — bewusst
  gebündelt lassen oder später trennen.

## Korrektur-Notiz

Frühere Annahme „Maske = Boundary, also nur *ein* Polygon, Slot 2 fällt weg" war **falsch**.
Richtig: **Maske = B2** (die zweite, finale Boundary), verschieden von B1 (Referenz).
Der „2. Slot" bleibt — er trägt B2.
