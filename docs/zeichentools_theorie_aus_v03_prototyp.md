# Zeichentools — Theorie aus dem v0.3-Prototyp (Geometry Asset Workbench)

*Stand 2026-05-30 · destilliert aus `/Users/dietmarbroda/open` (SCIM3 v0.3) · Annotation `ann_078`*

## Kontext

Der v0.3-Prototyp hat eine **canvas-basierte Geometry Asset Workbench** (eigenes
Rendering + wgs84-Projektion + pointer/keyboard-router) — NICHT Leaflet, NICHT
Geoman, plain JS. Die Zeichentools dort sind funktional. Wir übernehmen die
**Algorithmen/Erkenntnisse** (substrat-unabhängig) in den bestehenden Leaflet/React-
Drawer — Geoman bleibt, dies sind **Ergänzungen**, kein Ersatz.

Quelle der Logik: `src/scim3-v03/geometry/build-geometry-target-state.js`,
`src/interaction/pointer-router.js`, `src/scim3-v03/ui/fetch-regio-boundary-panel-renderer.js`.

## 1. Snap — zwei Arten, eine Regel

> Nächster Kandidat innerhalb Radius gewinnt, sonst Rohpunkt.

- **Snap-zum-Schließen:** gesetzter/gezogener Punkt näher als `MERGE_RADIUS` am
  Startpunkt → kein neuer Punkt, sondern **Ring schließen** (`is_closed`).
  Schließen *ist* Snappen des letzten auf den ersten (`Math.hypot`-Distanz).
- **Snap-auf-vorhandene-Punkte** (Toggle `snap_to_unlocked_layer_points`):
  Kandidaten = Vertices **anderer/unlocked Layer + der Vorlage** (eigene gerade
  gezogene ausgenommen); nächster innerhalb `SNAP_RADIUS` → exakt dessen Koordinate.
  = „Borgen/Ausrichten".
- Übernahme: in Leaflet als **Pixel-Distanz** (z. B. 12 px). Die Prototyp-Werte
  (`MERGE_RADIUS 0.035`, `SNAP_RADIUS 0.045`) sind workbench-normiert, nicht
  übertragbar — nur der Ansatz.

## 2. Punktreduktion — schlichte Dezimierung

- **Keep-%-Slider** (10–100 %, 10er-Schritte).
- Anwenden: `keepEvery = round(100/keep%)`, behalte **Index 0, letzten, jeden
  keepEvery-ten**. Endpunkte immer.
- **Kein Douglas-Peucker** — bewusst simpel + vorhersehbar. Reversibel (Undo).
- Übernahme: reine Array-Operation auf dem Ring — trivial, stabil, substrat-egal.

## 3. Punkt/Segment löschen — Knoten ODER Kante

- **Knoten löschen:** Vertex raus, Ring öffnet wenn < 3 Punkte.
- **Segment löschen** (`break_segments`, optional „stretch" = verbundene mit):
  löscht die **Kante** zwischen zwei Vertices, nicht den Knoten — bricht den Ring
  in offene Pfade.
- **Delete-Modifier aktiv** + **Hover-Ziel** hebt hervor, *was* gelöscht wird. Reversibel.
- Übernahme: Knoten-Löschen ist Standard; das **Segment/Break-Konzept** ist die
  wertvolle Erkenntnis fürs **spätere Netz** (Kanten als Erstklasse).

## 4. Fadenkreuz + Setz-Workflow

- **Fadenkreuz** beim Vertex-Ziehen: zartes Kreuz (4 Arme, Lücke in der Mitte,
  alpha ~0.5) zentriert am Punkt — Präzisions-Feedback (`renderDragCrosshair`,
  arm 22 / gap 3).
- **Workflow:** Klick hängt Punkt an · Ziehen verschiebt + **live Snap-zum-
  Schließen** · reiche Hover-Zustände (`start_hover` / `hover_vertex_index` /
  `drag_vertex_index`) zeigen *vorab, was passiert* · Schließen per Klick-nahe-Start
  **oder** explizit.

## 5. Meta-Erkenntnis (fast die wichtigste)

- **Undo-Snapshot pro Operation** (Stack; `pushDraftHistory` / `restoreDraftSnapshot`).
- **„Preview/Save" wird NUR bei echter Geometrie-Änderung ungültig**
  (Punkt hinzufügen/verschieben/reduzieren/löschen) — **nicht** bei Metadaten
  (Anker setzen). Hält „Speichern" gültig, wenn nur Beiwerk geändert wird. Saubere
  Trennung, fürs Draft-Modell zu adoptieren.

## Übernahme — stabil, kleine Schritte (Stabilität = oberste SCIM-Regel)

Die vier sind **Geoman-Ergänzungen**, kein Ersatz (Geoman macht Drag/Edit/
Polygon-Schließen schon). Reihenfolge nach Verträglichkeit:

1. **Punktreduktion** (Keep-%-Slider) — kleinster, sicherster Gewinn (reine Array-Op,
   reversibel). Idealer erster Schritt.
2. **Snap-auf-Vorlage/Nachbar-Punkte** (Toggle) — Erkenntnis: der Kandidaten-Satz
   (Vorlage + Nachbar-Vertices), Pixel-Radius.
3. **Fadenkreuz** beim Vertex-Ziehen — kleine Render-Zugabe.
4. **Segment/Break** — zurückgestellt, gehört zum **Netz-Editor** (Knoten/Kanten).

Plus **Undo-Snapshot + Preview-Invalidierungs-Regel** als Draft-Prinzip.

## Wichtige Einordnung

- Der Prototyp hat **keinen** Netz-/Graph-Editor (er ist geometrie-/boundary-
  zentriert: Vertices, Segmente, Anker). Der **Netz-Editor (Knoten/Kanten) ist so
  oder so neu** — aufzusetzen auf `src/scim/graph/` (Datenmodell, existiert).
- Substrat-Wechsel (Canvas-Workbench statt Leaflet) wurde erwogen, aber verworfen:
  zu riskant gegenüber dem funktionierenden Leaflet-Drawer + Draft/Commit/Budget-
  Apparat. Wir **portieren Konzepte**, nicht das Substrat.
