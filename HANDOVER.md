# Handover — 2026-05-26 12:25

## TL;DR für den nächsten Claude

Alle Code-Arbeit ist committed und gepusht. Ein einziger offener Punkt:
**GitHub Actions Run `26447653098` für SHA `ec6c879` rerun**, weil der
erste Versuch an `codeload.github.com` (GitHub-CDN-Outage-Schwanz)
gescheitert ist — *nicht* an unserem Code.

Sobald *irgendein* Run für `ec6c879` (oder neuer) auf grün geht, sind
**alle** seit cc6d9c4 aufgestauten Pushes auf einen Schlag live (Pages
baut immer `main`-HEAD).

---

## Sofort-Aktion beim Chat-Start

```bash
cd /Users/dietmarbroda/SCIM3ClaudeMax/scim_source
gh run rerun 26447653098
# warten, dann:
gh run view 26447653098 --json conclusion,headSha
```

Wenn `conclusion=success` und `headSha=ec6c879…` → User kurz Bescheid geben:
„Alles live, inklusive Magnum, Lichtenberg, Ghost-POIs, Deco-Position,
Bildstock-Auto-Tag."

Wenn weiterhin `failure` mit `codeload.github.com`-Fehler → weitere
20 min vertagen. **Nicht** den Code anfassen, das ist GitHub-Infra.

---

## Was wurde in dieser Session gemacht

In Reihenfolge (Commits aufsteigend):

1. `404ab91` — Tabler-Adapter im svgCleaner (24×24 → 48×48 Wrap),
   Howto-Doc `docs/howto_region_catalog.md` mit MVP-Vorab-Sektion,
   Link aus Flow-Info-Modal im CatalogTab.
2. `58bd86e` — Lichtenberg als zweite Region (10 POIs, Cluster
   „Lichtenberg" mit Giselawarte-Identity, 2 neue Icons:
   `aussichtswarte.svg`, `bildstock.svg`).
3. `c2455b8` — Lichtenberg-Plan-md Notiz präzisiert: Ghost-Tagline „Gis".
4. `cc6d9c4` — Lichtenberg-Icon-Refs auf Dateinamen korrigiert
   (sender/gasthaus/aussichtspunkt statt sendemast/besteck/fernglas);
   `summitIconShift 6→4`, `summitDigitsShift 4→-1`.
5. `770e18d` — `svgCleaner.tagUnnamedStrokeLayer()`: unbenannte
   Stroke-Pfade nach `id="fill"`-Pfad bekommen automatisch `id="stroke"`.
   Wird im Cleaning-Log angezeigt („nicht stillschweigend").
6. `9727b87` — `summitDigitsShift -1 → 0` (Sichtprüfung).
7. `7b30060` — **Phase 1 Ghost-Cluster-POI Editor (ann_048)**:
   `coord_status` Union um `'cluster_ghost'` erweitert,
   Parser/Serializer für Cluster-Subkategorie, UI: StatusChip magenta ↑,
   `handleAdd` legt Ghosts mit `'cluster_ghost'` an, Cluster-Section
   immer sichtbar in `editMode`.
8. `8af1e49` — `summitDigitsShift 0 → 1.5` (finale Sichtprüfung).
9. `444478d` — CI-Trigger-Commit nach Outage.
10. `e73dba3` — `imbiss.svg → strand-buffet.svg` (Eis-am-Stiel V1,
    schlicht). Plan-md aktualisiert in Tabelle 1, Tabelle 2 Pool,
    Cluster-Section „Badewiese Weyer".
11. `ec6c879` — `strand-buffet.svg` auf Magnum-Variante upgraded
    (weiße Schoki, Bissecke, Funkel-Striche). Dual-Naming: drawing-id
    `eis-am-stiel`, file-id `strand-buffet`.

---

## GitHub-Actions-Outage-Chronik (26.05.2026)

- **cc6d9c4** war der letzte normal deployte Commit (10:36 UTC).
- **770e18d, 7b30060, 9727b87, 8af1e49, 444478d, e73dba3** haben
  *keinen* Workflow-Run erzeugt — push-Events gingen verloren
  (nicht in Warteschlange, GitHub spielt sie nicht nachträglich).
- **ec6c879** hat wieder einen Run erzeugt (26447653098), scheitert
  aber am Action-Asset-Download. Rerun nötig.
- Lehre `ann_039`-Erweiterung: Deploy-Bestätigung muss `headSha`
  vergleichen, nicht nur `status=success` (sonst false-positive
  durch stale Run aus der Liste).

---

## Aktiver Arbeitsstand

### Code-seitig fertig
- Phase 1 Ghost-Cluster-POI komplett (Parser, Serializer, UI, Renderer).
- Lichtenberg als zweite Region.
- Magnum-Icon für Strand-Buffet.
- Tabler-Adapter, Howto-Doc, Auto-Stroke-Tag.
- Deco-Position für Summit-Container final (`summitIconShift=4`,
  `summitDigitsShift=1.5`).

### Offen / Nächste Phasen (siehe ann_050 im AiInterfacePanel)
- **Phase 2:** Echte App-Routes statt Tab-System (Ziel: MVP-Routing).
- **Phase 3:** Repräsentations-Editor in Karten-Tab.
- **Phase 4:** Multi-Region Storage-Trennung.
- **Phase 5+6:** siehe ann_050.

### User-side TODOs (sind beim User, nicht bei uns)
- Eventuell weitere Icon-Variationen zeichnen (Cornetto etc.) —
  Dual-Naming-Architektur ist bereit.

---

## Wichtige Konventionen (für den nächsten Claude)

1. **Commit-Messages: ASCII-only** (Cloudflare-API lehnt em-dash etc. ab).
2. **Pre-commit-Hooks nicht skippen.** Bei Fehler: fixen, neu committen
   (NIE `--amend` zum Umgehen).
3. **Deploy-Bestätigung:** Immer `headSha` gegen aktuellen HEAD prüfen,
   nicht nur `status=success` (ann_039-Lehre).
4. **`git add -A` vermeiden** — `.wrangler/` und `worker/.wrangler/`
   schleppen sich sonst ein. Explizit Dateien adden.
5. **macOS Case-insensitive:** Bei Rename mit nur Case-Änderung
   Temp-Filename-Pattern nutzen (`mv foo.svg tmp_foo.svg && mv tmp_foo.svg Foo.svg`).
6. **Plan-md ist Soll-Quelle.** Editor schreibt Patches in
   localStorage; Export regeneriert Tabelle 1 + Cluster-Section
   im Original-md (Serializer).
7. **SVG-Imports:** User legt SVGs in
   `POI-Assets aus Illustrator/POI-Icons-Grünberg/` ab, wir kopieren
   nach `data/icons/<filename>.svg`. svgCleaner läuft beim Vite-Import
   automatisch.
8. **User-Sprache: Deutsch.** Direktiv, kurz, ohne Boilerplate.

---

## Relevante Memory-Einträge (im User-Profil)

- `project_grunberg_poi_system.md` — Container-System
- `project_grunberg_clusters.md` — Cluster-Definitionen
- `project_grunberg_poi_plan_vs_code.md` — Plan-md vs Code-Stand
- `project_grunberg_catalog_tab.md` — Tab-Implementierungsstand
- `project_scim3_deploystand.md` — URLs, Login, Deploy

---

## Wenn der User „weiter mit Phase 2" sagt

Im AiInterfacePanel die Annotation `ann_050` lesen — dort steht der
6-Phasen-Plan für den MVP-Umbau zur Ziel-App-Struktur.
