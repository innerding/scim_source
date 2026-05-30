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
  *Fundament, unsichtbar, sicher (wie F7.1).* **✓ gebaut (netGraph.ts, 3 Tests grün).**
- **E2 · 3-Klassen-Konnektivitätsfärbung (revidiert, siehe unten):** Komponenten nach
  **Länge** klassifizieren → **schwarz (Netz) / grün (Rest)** (Längenschieber-Schwelle);
  Sackgassen = degree-1, **Toggle → rot**. Ersetzt den Stub-„Sackgassen ausblenden"
  (und das alte „gelb").
- **E3 · Lückenfüller-Automat:** Komponenten (aus E1) per **einer** Toleranz verbinden →
  neu klassifizieren (rot→grün, Rest verschmilzt ins Netz).
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

## E2/E3-Revision (2026-05-30): 3-Klassen-Konnektivitätsfärbung

Statt „Sackgassen gelb" geht es ums **Gesamtbild durch Konnektivität** — drei Klassen,
Grundfarbe = Klasse der Komponente:

- **Schwarz = Netz** — große zusammenhängende Komponente(n), identifiziert über **Länge**
  (Summe der Kantenlängen ≥ **Längenschieber**-Schwelle). In der Praxis mehrere Netze.
- **Grün = Rest** — kleinere Komponenten / Äste, noch nicht Teil des Netzes.
- **Rot = Sackgassen** — degree-1-Knoten, **per Toggle**. Default tragen Sackgassen die
  **Grundfarbe ihrer Komponente** (schwarz am Netz, grün am Rest); der Toggle legt **rot**
  über **alle** degree-1, egal welche Grundfarbe.

**Sortier-Workflow (Mensch):**
1. Netze identifizieren (Länge ≥ Schwelle) → schwarz.
2. Mehrere Netze **manuell verbinden** → „Was ist *das* Netz?" abgehakt.
3. Grünen **Rest** manuell anschließen → **Gesamtbild**.
4. **Sackgassen-Toggle** (Grundfarbe → rot) zum Sehen.
5. **Lückenfüller-Automat** → schließt Lücken → rot/grün wird Teil des schwarzen Netzes,
   Komponenten verschmelzen.

`graphCompose` (E1) liefert das Rohmaterial: **Komponenten + Grad**. E2 ergänzt:
**Komponenten-Länge** + Schwelle (schwarz/grün) und den Sackgassen-Toggle (rot).
