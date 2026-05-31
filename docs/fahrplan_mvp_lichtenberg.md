# Fahrplan zur testbaren MVP-Lichtenberg

*Stand 2026-05-31 · konkrete Panel-/Modul-Reihenfolge vom Umriss bis zur bedienbaren MVP*

Ziel: von „Umriss zeichnen" bis „MVP-Lichtenberg im Browser bedienbar & testbar".
Jede Phase nennt **konkret die Panels/Module**, die wir umbauen/ausbauen, und ihr
Ergebnis. Reihenfolge ist linear (P0 → P5); jede Phase deploybar.

---

## P0 — Umriss (Drawer)
**Umbau:** `DrawerPanel.tsx` (Umriss-Tab) + `addBoundaryControls` — siehe umriss_todo
(UÖ1–UÖ7: Geoman zähmen, Punkt setzen/löschen, Auto-Snap-Schließen, Vertex-Drag,
Snap, B1/B2-Sperre).
**Ergebnis:** Lichtenberg-Boundary B1 (+ optional B2) per Hand gezeichnet.

## P1 — Backen + Commit  *(= M1 gültige Representation)*
**Ausbau:** `DrawerPanel.onSave/buildNet` (transientes Netz **baken**: Brücken +
manuelle Stücke real, blau/ausgeschlossen raus, POIs re-anchoren, Sackgassen prunen,
DP+Stellen final) → `WorkspacePanel.onCommitDraft` schreibt **`data/wegnetze/…json`**
und setzt **`Representation.wegnetz_id`**.
**Module:** `draftStore.ts`, `workspace.registry.ts`, `workspace.types.ts`,
`worker/src/index.ts` (Commit-Whitelist).
**Ergebnis:** `data/representations/rep-lichtenberg.json` + Wegnetz committet.

## P2 — Resampler  *(Represent-Build, regio-content)*
**Ausbau:** neue reine Funktion in `regio-content` (z. B. `netGraph.resampleMesh`):
committetes Netz → **regelmäßige Segmente** (per-Strecke gleiche Teilung) + **stabile,
geometrie-verankerte Segment-ids** → Mesh-Artefakt. Ausgelöst aus einem
**Represent-Build-Schritt** (nach dem Workspace).
**Ergebnis:** Mesh-Geometrie (Segmente + ids) der Lichtenberg-Representation.

## P3 — Telco-Sim → Load-Array  *(P06)*
**Ausbau:** `P06SimulationForm` / `telco-load` liefert schon `TelcoLoadState`
(`normalized_load_score`). Neues **Mapping**: Sim-Werte auf die **Segment-ids** legen
→ Load-Array (id → Wert), **volatil**, getrennt von der Geometrie.
**Ergebnis:** simuliertes Telco-Load-Array für das Lichtenberg-Mesh.

## P4 — Inspector auf echt umstellen  *(= M2 validiert)*
**Umbau:** `ScimMap.tsx` + `colourMeshOverlay.ts` färben das **resampelte Mesh nach dem
Load-Array** statt `generateHotspots` + Overpass-Fetch. **`edgeTypeConfig`-Pfad retire**
(P02-Kantentypen), P01-SVG-Overlay-Frage entscheiden.
**Ergebnis:** Inspector zeigt das **echte** Lichtenberg-Netz + sim-Telco farbig.

## P5 — Runtime-App-Shell  *(= testbare MVP-Lichtenberg)*
**Ausbau (neu):** schlanke User-App unter `src/runtime/*`, die die Lichtenberg-
Representation + Mesh + Load **lokal** konsumiert (noch **ohne R2**) →
- Karte + POIs,
- **Routen-UI/UX** (Wishlist → Route → Guidance; nutzt `route-layer-model`/`graph`),
- **BCK / BAK** (Komfort-Korridor vs. „out of your comfort"),
- **Telco-Sim-Button** (schaltet das simulierte Load an/um).
**Ergebnis:** **MVP-Lichtenberg im Browser bedienbar & testbar.**

---

## Bewusst NACH dem MVP (nicht nötig zum Testen)
- **M3 — Paket + R2-Publish:** Sensus-Core-Paket → R2, „verschiedene Pakete/Laufzeiten
  konsumierbar". Für EINE testbare MVP-Lichtenberg reicht lokales Konsumieren; R2 ist
  die Generalisierung danach.

## Abhängigkeiten
P0 → P1 → P2 → P3/P4 (P4 braucht P2+P3) → P5. P5 konsumiert das Ergebnis von P1–P4.
