# Drawer-Werkzeugleiste — Spec (Umriss + Wegnetz)

*Stand 2026-05-30 · Annotation `ann_079` · ergänzt ann_078 (Zeichentools-Theorie)*

## Konzept

**Eine** Werkzeugleiste **unter der EBENEN-Leiste**, tab-gefiltert: im Umriss-Tab
sind die Wegnetz-Werkzeuge ausgeblendet und umgekehrt. Geteilte Werkzeuge
erscheinen in beiden.

Leitbild der Anordnung (v. a. Wegnetz): **Maschine → Mensch → Maschine**
(links automatisch herstellen · Mitte manuell korrigieren · rechts automatisch
festziehen). Der Workflow steckt in der Reihenfolge der Zonen.

## Interaktionsmodell — Direktmanipulation statt Modus-Buttons

- **Vertex-Drag:** Punkt direkt ziehen — **kein Knopf**.
- **Punkt/Element löschen:** **sehr Long-Press**, visuelles Feedback **grün → rot**
  je näher am Löschen — **kein Knopf**.
- **Snap-an-Startpunkt:** **immer an** (Verhalten, kein Knopf) → Schließen = Snappen
  des letzten auf den ersten Punkt.
- **Snap (an Vorlage/Nachbarpunkte):** **Toggle**, in **beiden** Tabs.
- **Undo:** Umriss **nein**, Wegnetz **ja** (weil dort Hand-Editieren am OSM-Netz).

## Umriss-Tab

Boundaries = Handarbeit, keine Maschinen-Zonen.
- Leiste: **nur der Snap-Toggle**.
- Verhalten: Punkt setzen = Klick · Vertex-Drag = direkt · Löschen = Long-Press ·
  Schließen = Auto-Snap an Startpunkt.
- **Kein Rechteck-Button.**
- **B1/B2-Sperre** lebt in der **EBENEN-Leiste**: Zustand „nicht bearbeitbar, aber
  Punkte als Snap-Quelle nutzbar" (Tracen über fixe Referenz).
- Farb-/Lebenszyklus wie F7: B1 gelb/orange · B2 rot/maskiert · committet blau.

## Wegnetz-Tab — drei Zonen

| Zone | Knöpfe |
|---|---|
| **Links · Maschine** | **Anwenden** (OSM holen) · **Lückenschließ-Automat** (EINE Toleranz-Schwelle) · *(Verschweißen-Anfang = auto/unsichtbar = graphCompose)* |
| **Mitte · Mensch** | **Snap-Toggle** · **Linien-setzen-Modus** (sperrt Overpass, gibt OSM-Netz frei) · **Sackgassen-Tools** · **Coord → Katalog-POI** (Komfort, später) · **Koord-Reduktion 0,3 m** · **Undo** · *(Linienlöschen = Long-Press / Doppelklick, kein Knopf)* |
| **Rechts · Maschine** | **Verschweiß-Automat** (finales Re-Verschweißen) |

## Prinzipien (die Technik hinter den Knöpfen)

1. **Verschweißen am Anfang UND am Schluss.**
   - **Anfang (unsichtbar = `graphCompose`):** fast aufeinanderliegende Koordinaten
     → gemeinsamer Knoten; Grad pro Knoten; Komponenten via Union-Find. Macht aus
     Kanten-Suppe erst einen Graphen. Fundament.
   - **Schluss (Automat):** finales Re-Verschweißen nach den manuellen Korrekturen.
2. **Lückenschließen braucht den verschweißten Graphen** (um Komponenten/Lücken zu
   sehen) → überbrückt echte Lücken zwischen Komponenten mit **einer** Toleranz.
   (Per-Klasse-Schieber Nebenstraße/Landstraße sind Überbau — nur An/Aus als
   Quelle, falls überhaupt.)
3. **Manuelles Editieren friert die Maschinen-Quelle ein:** „Linien-setzen-Modus"
   sperrt Overpass — sonst überschreibt ein erneutes „Anwenden" die Handarbeit.
   Deshalb braucht der Wegnetz-Tab **Undo**.
4. **Engine-Regel Sackgassen:** jeder **degree-1-Knoten ist entweder ein POI oder
   wird vom Routing ausgeschlossen.** Sackgassen-Tools = pro Stummel **ausschließen**
   (Auto-Default) oder **zum Start-/End-POI befördern** (manuell). Gate/Translate-
   Stummel werden ebenso nicht angeboten.
5. **Koordinaten-Reduktion distanzbasiert:** Punkte näher als **0,3 m**
   zusammenfassen/verwerfen. KEINE %-Dezimierung (vorhersehbarer, sicherer).
6. **Coord → Katalog-POI:** Koordinate vom Netzknoten getrennt entnehmen und in den
   gebundenen Katalog einfügen (Round-Trip, mehrfach). **Heikel:** Verträglichkeit
   mit der Katalog-Bindung/Aktualisierung im Draft — Sorgfalt nötig, daher später.

## Reihenfolge (Stabilität = oberste Regel)

`Anwenden` → (auto) **Verschweißen/Komposition** → (auto) **Lückenschließen** →
[**Mensch** korrigiert: Segmente abwählen/löschen, Lücken schließen, Sackgassen-POIs] →
(auto) **Re-Verschweißen** → Ergebnis: zusammengeschweißt, sackgassenfrei, nur POIs
als Endknoten.

**Erster, sicherer Schritt:** `graphCompose` (reine Funktion, kein UI) — auf
`src/scim/graph/` aufsetzend.

## Offen / geparkt

- **Linienlöschen-Detail:** Long-Press verlängert Segment-für-Segment · Doppelklick =
  ganze Linie bis zur nächsten Gabelung. *(noch nicht sicher)*
- **„Hochstellen"** — vom Operator erwähnte Option, vorerst geparkt (Bedeutung noch
  zu klären).
- **Coord→Katalog** Round-Trip + Draft/Katalog-Konsistenz.
- **Punktreduktion (%-Dezimierung aus dem v0.3-Prototyp)** verworfen zugunsten der
  distanzbasierten 0,3-m-Reduktion.
