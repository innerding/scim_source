# Um-/Ausbauplan — committetes Netz → resampeltes Mesh → simuliertes Telco im Inspector

*Stand 2026-05-31 · gegründet auf Code-Recherche (ScimMap/edgeTypeConfig/colourMeshOverlay live) + Memories project_colour_mesh, project_netz_normalisierung, project_datengroesse_hebel*

## Ziel
Ein **regulärer Weg**, um zu sehen: ein **simuliertes Telco-Signal über ein resampeltes
Netz aus einer committeten Representation**, farbig im Inspector. Der heutige
synthetische Inspector-Mesh wird dabei **abgelöst**, nicht vorher gelöscht.

## Bestand (was LIVE ist)
- **Drawer:** baut/bereinigt das Netz (pathConfig/pathEngine/netGraph). ✓
- **Inspector (ScimMap):** zeigt Boundary (violett) + **live-Overpass-OSM-Kanten** +
  **synthetische Heat** (`colourMeshOverlay.generateHotspots`, Fake-Last) + POIs.
  Platzhalter, **entkoppelt** vom committeten Netz.
- **P06 Simulation** (`P06SimulationForm`): szenariobasierter Synthetik-Telco-Generator
  (`TelcoLoadState`, `normalized_load_score`) → **die Telco-Quelle**. P04 = Real-Eingang.
- **data/representations/** ist leer; `RepresentationFile.wegnetz_id` existiert, wird
  **nie gesetzt**; kein Load-Feld.

## Zwei Kantentyp-Konfigurationen — Klärung
- **P02 Colour-Mesh-Kantentypen (`edgeTypeConfig`):** welche OSM-Typen ins Inspector-Mesh.
  **Inhaltlich abgelöst** durch Drawer-`pathConfig` (Primäre Wegklassen + Konnektoren).
  Test-Relikt — aber **live** (ScimMap nutzt es für den Overpass-Fetch). → **retire mit S4**
  (wenn der Inspector aufs committete Netz umgestellt ist), nicht vorher.
- **P01 SVG-Overlay-Kantentypen (`svg_overlay.excluded_edge_types`):** Anzeige-Ausschluss
  für ein SVG-Overlay. → **zu prüfen:** Wird dieses Overlay überhaupt noch gerendert?
  Dient es der User-Begehbarkeits-Entscheidung (behalten) oder ist es Altbestand (retire)?

## Die Kette (Schritte, je deploybar)
- **S1 · Backen + Commit** (Drawer/Workspace): transientes Netz baken (Brücken/Stücke real,
  blau/ausgeschlossen raus, POIs re-anchoren, Sackgassen prunen, DP+Stellen final) →
  nach `data/wegnetze/…` schreiben + `Representation.wegnetz_id` setzen. *(E5 Teil 1)*
- **S2 · Resampler** (`regio-content`, Represent-Build): committetes Netz → **regelmäßige
  Segmente** (per-Strecke gleiche Teilung) + **stabile, geometrie-verankerte Segment-ids**
  → Mesh-Artefakt der Representation. *(E5 Teil 2)*
- **S3 · Sim-Telco-Anbindung:** P06-Simulation (`TelcoLoadState`) → **Load-Array**
  (segment-id → `normalized_load_score`) auf das resampelte Mesh legen. Mapping = eigenes
  Thema, **Quelle ist P06** (kein neues Sim-Modul nötig). Load ist volatil, getrennt von
  der Geometrie.
- **S4 · Inspector umstellen:** `ScimMap` färbt das **resampelte Mesh nach dem Load-Array**;
  der synthetische Pfad (Overpass-Fetch + `generateHotspots`) fliegt raus; **P02
  `edgeTypeConfig` retire**; P01-SVG-Overlay-Frage entscheiden.

## Abhängigkeiten
S1 → Voraussetzung für S2; S2 → für S3/S4. Telco-Quelle (P06) existiert bereits.

## Gesamt-Roadmap (M1–M4) bis zur konsumierbaren User-App

- **M1 — gültige Representation** (Operator, bald nach Umriss): Boundary + Netz +
  Katalog committet.
- **M2 — ColourMesh-Simulation** (dieser Plan, S1–S4): resampeltes Mesh + sim. Telco
  (aus P06), im Inspector validiert. Operator-/Validierungs-Ansicht.
- **M3 — Verpacken + Publizieren** (Auslieferungs-Schicht): Representation → **Sensus-
  Core-Paket (P11)** = statische Mesh-Geometrie + stabile Segment-ids + volatiler
  Load-Kanal → **nach R2 publizieren, versioniert**. Erst das macht „verschiedene
  Pakete/Laufzeiten konsumierbar".
- **M4 — Runtime-App-Shell**: lädt Paket über **R2** → Karte + POIs → **Routen-UI/UX**
  (Wishlist → Route → Guidance, project_runtime_mvp) → **BCK/BAK** (Komfort-Korridor
  vs. „out of your comfort"-Bonus) → **Telco-Sim-Button** (solange echtes Telco fehlt).

Reihenfolge: M1 → M2 → M3 → M4. M2 ist die Vorschau dessen, was M3 paketiert und M4
konsumiert.

## Offen / zu entscheiden
- **Segment-id-Schema:** deterministisch + stabil über Re-Commits (sonst driftet das
  Telco-Mapping) — Prinzip wie project_poi_stable_id_token.
- **Wo lebt das Load-Array** (volatiles Artefakt, getrennt von der Mesh-Geometrie;
  5-Min-Zyklus).
- **P01 SVG-Overlay:** Render-Status + Zweck klären (behalten/retire).
- **Auslieferungs-Form:** Mesh (regelmäßig) wird ausgeliefert; Größen-Hebel = Schrittweite
  (project_colour_mesh), DP/Stellen halten die Quelle klein.
