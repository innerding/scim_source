# Handover — 2026-05-29 (Session-Ende)

> **Vorgaenger-HANDOVERs werden mit dieser Fassung abgeloest.** Die
> Aenderungen seit 2026-05-27 (Stand des alten HANDOVER) sind umfassend
> genug, dass ein Wiedereinstieg nur ueber diese Datei + drei Querverweise
> sauber moeglich ist:
>
> - `ann_067` (Master-Index Lichtenberg-MVP-Bauplan)
> - `ann_072` (Wanderwegnetz-Filter + Drawer-Panel, naechster Bauplan)
> - `docs/runtime_mvp.md` (autoritative UX-Spec der Ziel-App)

---

## TL;DR fuer den naechsten Claude

Sehr produktive Session. Drei grosse Bloecke abgeschlossen, einer als
Soll-Spec hinterlegt fuer den naechsten Bau:

1. **Runtime-MVP-Kern (Schritt 1 aus ann_067)** komplett — URL-Routing,
   Representation-Context, ScimMap-Bindung, Pipeline-Sicht-Unterdrueckung.
2. **Operator-Inspector-Bruecke** — inspectorView als zweite Context-
   Schicht, Compare-Dropdown im rechten Header, Editor-Toggle fuer
   violetten Tracing-Outline.
3. **Commit-Bridge** — Worker `/api/commit` + GitHub-Token; Editor /
   Wizard / Katalog committen direkt aus dem Browser nach `main`,
   ohne Terminal-Hop.
4. **Edge-Filter-Atemzug** — P02 ColourMesh-Kantentypen-Sektion wirkt
   auf Overpass, Mesh schiebt sich je nach Auswahl.
5. **Catalog-POIs im Inspector** — sichtbar, sobald `rep.catalog_id`
   gesetzt ist (Lichtenberg + Gruenberg sind sauber verkabelt).
6. **Soll-Spec ann_072** fuer Drawer-Panel + Wanderwegnetz-Filter
   geschrieben (Vorgaenger ann_070/ann_071 sind geloescht).

**Alle Commits gepusht.** Letzter Commit: `f176ca7` (Aufraeumen ann_070/071).
Deploy laeuft ueber GitHub Actions (`.github/workflows/deploy.yml`), der
Push triggert + nach ~60 s live unter `scim3.diesenpark.com`.

---

## Was real funktioniert (live)

### Runtime-URL-Schicht

- `_redirects` in `public/` fuer Cloudflare SPA-Fallback
- `src/runtime/router.ts` — pure Funktionen: `slugify`, `parseRuntimeUrl`,
  `matchRepresentation`, `resolveRuntimeUrl`. 12 Tests, gruen.
- `src/runtime/repContext.ts` — RepresentationContext mit zwei Achsen:
  - `active` (URL-getrieben, fuer die Runtime-App)
  - `inspectorView` (Operator-lokal, kippt URL nicht; Default = follow active)
  - Hooks: `useRepresentationContext`, `useActiveRepresentation`, `useInspectorView`
- Provider eingehaengt in `src/App.tsx`

URL-Tests:
- `scim3.diesenpark.com/boehmerwald/lichtenberg` → ScimMap fittet auf
  Lichtenberg-Polygon, holt Lichtenberg-OSM, zeichnet Catalog-POIs
- `scim3.diesenpark.com/gmunden/gruenberg` → analog Gruenberg
- Browser-Back/Forward via popstate-Listener synchron

### ScimMap (rechter Inspector)

- Bei aktiver R: Polygon-Outline (blau, durchgezogen), Pipeline-Rechteck
  unterdrueckt, Pipeline-POIs/Edges unterdrueckt
- Bei keiner R: Pipeline-Default wie frueher
- Compare-Dropdown im Header (kleines `<select>`): „folgt URL" + alle
  committeten R's mit Region in Klammern
- Layer-Toggle „Dark Map" entkoppelt vom Colour-Mesh (4 Kombis frei)
- Catalog-POIs der aktiven R als helle Kreis-Marker mit Tooltip
  (Tagline + Subkategorie + ggf. Cluster)

### Geometry-Editor

- Toggle „Inspector-R einblenden" in der Toolbar — zeichnet das Polygon
  der Inspector-R als violetten gestrichelten Outline (`pmIgnore`,
  read-only). Ermoeglicht „darueber neu zeichnen" ohne Kopieren.
- Im Export-Modal jetzt drei Knoepfe: **Commit zu main** (gruen),
  In Zwischenablage, Schliessen
- Nach erfolgreichem Commit: `scim3_geometry_draft` localStorage geraeumt,
  oranger DRAFT-Marker im Workspace verschwindet

### Representation-Wizard

- DRAFT-Persistenz (`scim3_wizard_draft`) ueber alle vier Felder
- Geometry-Pick nur committete (DRAFT-Geometrien sind raus — Wizard
  akzeptiert nur sequenziell-committete Deps)
- **Commit zu main**-Knopf neben „In Zwischenablage"
- Nach Erfolg: DRAFT geraeumt

### Katalog (CatalogTab)

- ExportModal um **Commit zu main**-Knopf erweitert (neben „Plan-md
  herunterladen")
- Nach Commit: `editState` geraeumt, DRAFT-Marker verschwindet

### Workspace

- Status-Pills G/C/R pro Representation
  - G (Geometry): gruen wenn vorhanden, orange wenn referenziert aber
    fehlt
  - C (Catalog): gruen wenn vorhanden, orange wenn fehlt, grau wenn
    nicht referenziert
  - R: immer gruen (da committed)
- Klick auf Pill springt ins entsprechende Panel

### Commit-Bridge (Backend)

- Worker: `POST /api/commit` mit `{path, content, message}`
- Auth: `X-Scim-Key` gegen `UPLOAD_API_KEY` (Worker-Secret)
- Pfad-Whitelist (im Worker hartcodiert):
  - `data/geometries/[a-z0-9_-]+\\.json`
  - `data/representations/[a-z0-9_-]+\\.json`
  - `data/[a-z0-9_-]+_pois_plan\\.md`
- GitHub Contents API mit `GITHUB_TOKEN` (Worker-Secret), schreibt direkt
  auf `main`
- Browser-Client: `src/runtime/commitBridge.ts`

### Edge-Filter (Atem-Andeutung)

- `src/scim/regio-content/edgeTypeConfig.ts` — 16 OSM-highway-Typen mit
  Label/Group/Hint, Wander-Default (alles ausser motorway/trunk),
  localStorage-Persistenz pro Region-Slug
- P02 RegioContent hat Sektion „ColourMesh-Kantentypen" — Checkbox-Liste
  pro Region (aus Inspector-View abgeleitet)
- `fetchOsmEdges` baut Overpass-Query dynamisch aus Filter-Liste,
  Cache-Key enthaelt Typenliste
- `'scim:edge-types:changed'` als Event triggert Re-Fetch im ScimMap
- Wirkung sichtbar: am Lichtenberg-Wandernetz schiebt sich das Mesh, wenn
  Forstwege oder Pfade weggeklickt werden

### Daten im Repo (neu seit altem HANDOVER)

- `data/geometries/gruenberg.json`, `lichtenberg.json` — beide schon da
- `data/geometries/paris.json` — vom Operator via Bridge committed (Test)
- `data/representations/rep-lichtenberg.json` — jetzt MIT `catalog_id`
- `data/representations/rep-gruenberg.json` — neu, MIT `catalog_id`
- `data/representations/rep-paris-by-night.json` — vom Operator via
  Wizard-Bridge committed (Test)

### Deploy-Pipeline

- `.github/workflows/deploy.yml` triggert auf jedem Push auf `main`
- Build via GitHub Actions mit Secrets:
  `VITE_CODE_OPERATOR`, `VITE_CODE_ANALYST`, `VITE_WORKER_URL`,
  `VITE_UPLOAD_API_KEY`
- Deploy via `cloudflare/wrangler-action` an Project `scim3-operator`
  branch `main`
- Live unter `scim3.diesenpark.com` nach ~60 s
- CF Pages Git-Integration produziert paralleles Build, das frueher
  white screen ausloeste (vor dem GH-Secret-Fix mit dem falschen
  Worker-Namen). Heute laeuft GH Actions ueber, danach ist es das
  juengste Deployment — sauberer Pfad. **Nicht mit lokalem wrangler-
  Deploy mischen** (Race-Risiko).

### UI-Polish

- Panel-Header zeigt Pxx/Rxx/Vxx als kleines Mono-Chip vor dem Titel
  (`src/scim/ui/PanelWorkspace.tsx` -> `PanelHeader`)

---

## Was offen ist (priorisierte Roadmap)

### 🔴 NAECHSTER GROSSER BAU: Drawer-Panel (ann_072)

Wanderwegnetz aus OSM filtern, konfigurierbar pro Region. Geometry-Editor
wird zu „Drawer" mit Tabs Boundary + Path, gemeinsamer Leaflet-Canvas.

Bauplan in 10 Phasen (siehe ann_072 ausfuehrlich):

  Phase  1  Drawer-Panel-Shell (Tabs, shared Leaflet)
  Phase  2  Path-Tab Filter-Menue (UI + State, keine Wirkung)
  Phase  3  Filter-Engine (Primaer + Ausschluss)
  Phase  4  Konnektor-Filter (Klassen + Laengen-Schwelle + Topologie-Gate)
  Phase  5  Graph-Composer + Boundary-Crop
  Phase  6  Gap-Detection + Luecken-Marker
  Phase  7  Dead-end-Filter + POI-Ausnahme + Keep-List
  Phase  8  Heatmap-Ready Output (nodes/edges)
  Phase  9  Commit-Bridge fuer data/regio_paths/<region>.json
            (Worker-Whitelist erweitern)
  Phase 10  P02-Migration (Filter raus aus P02 in den Drawer)
  Phase 11  POI-Anker (Bonus — faellt trivial nach Phase 8)

Geschaetzt 10-12 h, 3-4 Sessions. Vor Phase 1 lohnt sich Aufraeumen
(siehe naechster Block).

### 🟡 Aufraeumen vor Drawer

- `src/scim/ui/panelRegistry.ts` — `GEOMETRY_EDITOR_DESCRIPTOR` zu
  „Drawer" umbenennen, ID anpassen wo noetig
- `ann_067` Master-Index ergaenzen: Drawer + Wegnetz als Stufe-1-relevante
  Operator-Werkzeuge aufnehmen
- `DEPLOY.md` ehrlich machen: aktuell behauptet sie „CF Pages Git-
  Integration deployt", in Wahrheit ist es GH Actions
  (`.github/workflows/deploy.yml`). CF Pages Git-Build laeuft parallel
  und ist heute leise kaputt (Bundle crasht). Sollte erwaehnt sein
  damit man's nicht wieder als „real" annimmt
- Werkzeug-Entscheid fuer Phase 5 von ann_072:
  - Haversine inline (klein, kein Dep)
  - Turf.js Sub-Modul `@turf/line-split` fuer Boundary-Crop (1 npm dep)
  - kdbush fuer Nearest-Neighbor in Gap-Detection (optional)
  Vorschlag: Turf-Sub-Modul nur fuer line-split, Rest selbst

### 🟢 Aus ann_067 noch nicht angefasst (nicht im Drawer-Pfad)

- **R07 Karte & Guidance „Preview"-Tab** — Reviewer-Stand inside SCIM
- **V01 Pakete / V02 Region-Detail / V03 Aktiv-Monitor** — Operator-
  Workflow Workspace → Publish → V03 mit QR
- **Runtime-Flow-Module** (das eigentliche Endnutzer-MVP):
  `routeSolver.ts`, `wishlist.ts`, `guidance.ts`, `positionMarker.tsx`,
  Wishlist-Bottom-Sheet, Next-Stop-Card, Tour-Ende-Sheet
  Siehe `docs/runtime_mvp.md` ausfuehrlich

### 🔵 Inspector-Patches, die nur konzipiert sind

In Diskussion vor der Bridge entstanden, nicht gebaut:

- **Workspace-Hover** zeigt R im Inspector (temporaere Preview,
  URL bleibt)
- **Katalog-bbox-Aggregat** (Inspector-Focus erweitert sich mit jeder
  POI-Selektion)
- **Wizard-Preview** im Inspector (Wizard-Zwischenstand als
  synthetische R)

Schoene Wins, keiner blockierend.

### ⚠ Hygiene / Sicherheit

- **GitHub-Token rotieren** — der PAT im GitHub-Secret `GITHUB_TOKEN` ist
  vom Operator persoenlich erzeugt worden und steht in einem alten
  Chat-Log. Sobald Drawer-Bridge stabil ist: in GitHub Token-Settings
  „Regenerate" und neu via
  `cd worker && echo -n '<token>' | npx wrangler secret put GITHUB_TOKEN`
  setzen. Funktion bleibt unveraendert.

### 🪦 Geistererscheinungen, die geklaert sind

- **White-Screen** zweimal aufgetreten. Einmal Edge-Propagations-Race
  beim Reload mitten in CF-Switchover (kein Bug, nur Timing —
  60-90 s warten). Einmal echter Bug: `useMemo` mit Side-Effect-`setState`
  in P02 (gefixt mit `useEffect`).
- **Falscher Worker-Name** im Live-Bundle (`scim3-bundle-worker` statt
  `scim3-package-worker`) — kam aus altem GH-Secret. Fix war: `gh secret
  set VITE_WORKER_URL`. Bei zukuenftigen Worker-Name-Aenderungen daran
  denken.

---

## Wichtige Files (Schnell-Orientierung)

### Doku (autoritativ)

| Datei | Inhalt |
|---|---|
| `docs/runtime_mvp.md` | UX-Spec der Ziel-App, MVP-Kern + BAK-Bonus |
| `docs/represent_build.md` | Tetraeder-Kosmologie (Kapitel *Kosmologie-Update Mai 2026* ist aktuell) |
| `ann_067` in `src/scim/ui/panels/AiInterfacePanel.tsx` | Master-Index Lichtenberg-MVP-Bauplan |
| `ann_072` ebenda | Wanderwegnetz-Filter + Drawer-Panel — Soll-Quelle naechster Bau |

### Runtime (neu in dieser Session)

| Datei | Was |
|---|---|
| `src/runtime/router.ts` | pathname → Representation (12 Tests) |
| `src/runtime/repContext.ts` | RepresentationContext: active + inspectorView |
| `src/runtime/commitBridge.ts` | Browser-Client fuer Worker /api/commit |
| `public/_redirects` | Cloudflare SPA-Fallback |

### Worker / Bridge

| Datei | Was |
|---|---|
| `worker/src/index.ts` | `POST /api/commit` Endpoint + GitHub Contents API |
| `worker/wrangler.toml` | Worker-Config (`scim3-package-worker`) |

### Panels (mit Bridge oder R-Integration)

| Datei | Was wurde aenderbar |
|---|---|
| `src/scim/ui/ScimMap.tsx` | Inspector-Compare-Dropdown, Catalog-POIs, Edge-Type-Filter-Konsum |
| `src/scim/ui/panels/GeometryEditorPanel.tsx` | Inspector-R-Toggle, Commit-Knopf |
| `src/scim/ui/panels/RepresentationWizard.tsx` | DRAFT + Commit-Knopf |
| `src/scim/ui/panels/CatalogTab.tsx` | Commit-Knopf im ExportModal |
| `src/scim/ui/panels/WorkspacePanel.tsx` | Status-Pills G/C/R |
| `src/scim/ui/panels/P02RegioContentForm.tsx` | Edge-Type-Filter-Sektion |
| `src/scim/ui/PanelWorkspace.tsx` | Panel-ID-Chip im Header |

### Helfer-Module

| Datei | Was |
|---|---|
| `src/scim/poi-catalog/catalogRegistry.ts` | Vite-Glob aller `*_pois_plan.md`, on-demand-Parse |
| `src/scim/regio-content/edgeTypeConfig.ts` | Highway-Typen + Region-localStorage-Persistenz |

### Deploy + Config

| Datei | Was |
|---|---|
| `.github/workflows/deploy.yml` | Triggert auf Push, baut + deployt |
| `DEPLOY.md` | sagt heute „Push deployt automatisch"; was nicht ganz ehrlich ist (s. o.) |
| `.env.local` | lokale VITE_*-Werte (gitignored) |
| `.env.local.example` | Vorlage, im Repo |

---

## Architektur-Konsens (NICHT VERHANDELBAR)

Unveraendert aus altem HANDOVER, mit Ergaenzungen:

- **Pipeline (P01–P14) bleibt unangetastet.** Tetraeder lebt auf anderer
  Schicht, ist nie *in* der Pipeline.
- **Click-Targets der Boegen sind Convenience-Bruecken** zu Pipeline-Panels,
  nicht der architektonische Anspruch.
- **Direktester Weg.** Umbauten gehoeren geplant. Nicht herumbasteln.
- **Git ist Review-Mechanismus** — aber Browser **kann jetzt schreiben**
  ueber die Commit-Bridge. PR-Flow fuer komplexere Reviews ist weiter
  Zukunftsmusik.
- **OSM bleibt unangetastet.** Wanderwegnetz wird *abgeleitet* per
  Gebietskonfiguration, nicht in OSM nach-getaggt. Siehe ann_072.
- **Inspector ist *unabhaengiges* Beobachtungsfenster**, kein Mirror
  der Panels. Operator-Compare-Wahl im rechten Header darf von der
  URL abweichen — die Runtime-URL bleibt davon unberuehrt.

---

## Sofort-Aktion beim naechsten Chat-Start

Reihenfolge zum Wiedereinstieg:

1. Dieses HANDOVER lesen (du bist gerade hier).
2. `ann_072` in `AiInterfacePanel.tsx` lesen — die naechste Soll-Quelle.
3. Falls relevant: `ann_067` (Master-Index) und `docs/runtime_mvp.md`
   nur ueberfliegen, sind als Rahmen schon bekannt.
4. Operator fragen: „Drawer-Panel (ann_072) bauen — vorher Aufraeum-
   Runde, oder direkt Phase 1?"

Wenn Drawer-Bau startet, Phasen 1+2 zusammen ist sinnvoller Erstein-
stieg: Drawer-Shell + Filter-Menue ohne Wirkung. Erst sehen, ob die
UX traegt, dann die Engine bauen.

**Stopp-Linien beim Drawer-Bau** (siehe ann_072 ausfuehrlich):

- Tab-Wording „Boundary" / „Path" vs. Alternativen
- Filter-Menue: kollabierbares Side-Panel vs. modaler Dialog
- Exakte Farbpalette der Wegklassen
- Begriffe „Konnektor" / „Nebenstrasse" / „Landstrasse" — operator-tauglich?
- Default-Schwellen 80 m / 20 m: am Lichtenberg pruefen
- Sackgassen-Visualisierung

Diese vor jeder Pixel/Wording-Entscheidung beim Operator nachfragen.
