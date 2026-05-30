# Um-/Ausbauplan — Drawer-Werkzeug + Netz-Engine

*Stand 2026-05-30 · Annotation `ann_080` · baut auf ann_078 (Zeichentools-Theorie) + ann_079 (Werkzeugleiste-Spec)*

## Entscheidung Geoman: (A) zähmen + Custom-Gesten aufsatteln

Für Stabilität (oberste SCIM-Regel): **Geoman behalten** (Drag/Vertex-Edit/Schließen/
Snapping funktionieren), **Rechteck aus, Toolbar verstecken**, **Snap-Toggle** treibt
Geomans Snapping, **Long-Press-Löschen grün→rot** ist custom (ersetzt removalMode).
**(B) Geoman ersetzen** bleibt offen, falls die UX später quer liegt.

## Reihenfolge: erst Engine-Rückgrat, dann Werkzeuge

Ohne zusammengeschweißtes, sackgassenfreies Netz macht alles Weitere keinen Sinn →
das Rückgrat zuerst. Jede Stufe einzeln deploybar.

### Engine-Rückgrat (Ausbau) — zuerst
- **E1 · `graphCompose` (rein, kein UI):** Kanten → Knoten (verschweißt per Koord-ε) +
  Kanten mit `from`/`to` + **Grad** pro Knoten + **Komponenten (Union-Find)**. Mit Tests.
  *Fundament, unsichtbar, sicher (wie F7.1).* **← erster Schritt.**
- **E2 · Sackgassen echt + Verschweiß-Anzeige:** degree-1-Knoten erkennen; Ausnahme =
  POI in Reichweite (`anchorPois`); **gelb** visualisieren. Ersetzt den Stub-„Sackgassen
  ausblenden".
- **E3 · Lückenschließ-Automat:** Komponenten (aus E1) per **einer** Toleranz verbinden.
- **E4 · Sackgassen-Tools (Mensch):** pro Stummel **ausschließen** / **zu Start-End-POI**
  befördern.
- **E5 · Verschweiß-Automat (final):** Re-Verschweißen nach Hand-Korrektur.

### Werkzeugleiste + Gesten (Um- & Ausbau) — danach
- **U1 · Umriss-Interaktion:** Geoman zähmen (Rechteck aus, Toolbar verstecken),
  **Snap-Toggle**, **Long-Press-Löschen grün→rot**, Klick-Setzen, Vertex-Drag.
- **U2 · Wegnetz-Leiste in 3 Zonen:** Filtermenü → Leiste; Neben-/Landstraße + m-Schieber
  nach **links** (**temporär, nur Test** — bis sicher, dann raus); Anschluss-Toleranz behalten.
- **T1 · Koord-Reduktion 0,3 m** (distanzbasiert, geteilter Button).
- **T2 · Linien-setzen-Modus** (sperrt Overpass) + **Undo** (Wegnetz) + Linienlöschen-Geste.
- **T3 · Coord→Katalog** (Komfort, zuletzt — Draft/Katalog-Konsistenz).

## Engine-Ziel (Wiederholung)

`Anwenden` → (auto) **Verschweißen/Komposition** → (auto) **Lückenschließen** →
[**Mensch**: Segmente abwählen/löschen, Lücken schließen, Sackgassen-POIs] →
(auto) **Re-Verschweißen** → **zusammengeschweißt, sackgassenfrei, nur POIs als Endknoten.**

Engine-Regel: jeder **degree-1-Knoten ist POI oder vom Routing ausgeschlossen.**
