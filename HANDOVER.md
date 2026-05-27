# Handover — 2026-05-27 (Session-Ende)

## TL;DR für den nächsten Claude

Sehr produktive Session. Drei große Themenblöcke abgeschlossen, ein vierter
benannt und für die nächste Session vorbereitet:

1. **Tetraeder-Kosmologie** komplett umgebaut und mit dem User auf einen
   gemeinsamen Begriff gebracht. Siehe ausführlich `docs/represent_build.md`,
   Abschnitt *„Kosmologie-Update — Mai 2026"*.
2. **Colour-Mesh** in drei Phasen gebaut: erst Schwefelgas (raus), dann
   Heat-entlang-der-Wege (besser), dann echte OSM via Overpass (richtig).
3. **DRAFT-Workflow** für Geometrien sauber durchgespielt: localStorage →
   sichtbar im Workspace → Wizard mit Geometry-Copy-Knopf → Git → live.
4. **Offen für nächste Session:** R-Konsument bauen — siehe unten.

**Alle Commits gepusht.** Letzter Commit: `df0bb45` (Lichtenberg Geometry).

---

## Was real funktioniert (Ende dieser Session)

### Visuelles / Navigator
- **Naked Logo** im Navigator (`logo-base-naked.svg` + `logo-hex-naked.svg`),
  88 % zentriert, 28 px nach unten gerückt, Hex pulsiert (Dim 0.625 → 1.0)
- **Inspector-Trapez** aus Pergament (`#e8d4a8` × 12 % opacity) über dem
  Mond, perspektivisch verjüngt, kein Stroke, Klick toggelt Karte
- **Manual + Reader** als 📄 (stumm) + 📖 (klickbar, öffnet Modal)
- **Tetraeder** 171 px, scb (top), org (center), cat (bottom-left),
  geo (bottom-right), Spheres sys/rou/loa
- **Click-Targets**: scb→P11, sys→P01, rou→P02, loa→P09, geo→geometry_editor,
  cat→catalog, org→workspace

### Workspace
- **DRAFT-Box** (oranger gestrichelter Rahmen) ganz oben in
  Boundary-Geometrien, wenn `localStorage:scim3_geometry_draft` ein gültiges
  Polygon enthält
- **Wizard "+ neue Representation"** mit DRAFT-selektierbar; bei DRAFT-Auswahl
  Warnung + extra **"Geometry kopieren"**-Knopf direkt im Warnkasten
- Katalog ist eigenständiges Erstklass-Panel (nicht mehr Tab in P02)

### Colour-Mesh (ScimMap rechts)
- Default **Layer "Colour-Mesh" an**, alte Routen-Edges default aus
- **Overpass-API** holt echte highway-Wege innerhalb der Boundary-bbox
  (`fetchOsmEdges` mit 24h-Cache pro bbox-Key)
- **Per-Edge-Gradient**: jede Edge in 6 Segmente, jedes mit eigener Heat-Farbe
- **Heat-Palette** ohne Gelb: navy → electric blue → cyan-teal → lavender →
  magenta
- **Synthetisches Fallback-Netz** wenn OSM lädt / fehlschlägt (deterministisch,
  seed=7)
- **Base-Tile** im Mesh-Modus: `dark_nolabels` von CartoDB
- POI-Routen (k-NN + Bezier + Glow) sind drin, aktiv erst ab ≥ 2 POIs
  (Mock hat nur 1)

### Daten im Repo
- `data/geometries/lichtenberg.json` — vom User in dieser Session committed
- `data/representations/rep-lichtenberg.json` — committed, ohne `catalog_id`
  (User entschied: belassen, weil R heute eh manifest-only ist)

---

## Was offen ist (priorisierte Roadmap)

### 1. R-Konsument bauen (NÄCHSTER SCHRITT)
Die `rep-lichtenberg.json` ist heute Manifest ohne Wirkung. Vier Stücke
machen sie funktional:

| Stück | Effekt |
|---|---|
| `_redirects` für SPA-Fallback | Cloudflare leitet `/<region>/<r-name>` an die SPA |
| URL-Parser | liest pathname → matcht Representation in der Registry |
| RepresentationContext | hält aktive R, Komponenten abonnieren |
| ScimMap-Verdrahtung | fittet Bounds auf `rep.geometry`, holt OSM dafür, lädt POIs aus `rep.catalog_id` |

Ergebnis: `scim3.diesenpark.com/böhmerwald/lichtenberg` öffnet die App
fokussiert auf Lichtenberg. **Klar abgegrenzt, kein Architektur-Risiko.**

### 2. Sicheln als Prozess-Fenster
Konzept steht (siehe represent_build.md). Implementation noch offen.

### 3. Strahl-Animation Apex → Mond
Bei scb-Klick visueller Effekt. Aufwand mittel.

### 4. Drehende Sphären beim Feuern
Mechanik-Idee dokumentiert, kein Code.

### 5. BCK/BAK-Routing auf generierten Routen
Vom User als finales "haben gewonnen"-Kriterium benannt.

### 6. Backend für echte Reviews
Cloudflare Worker + GitHub API → echte PRs aus dem Browser. Großes
Bauvorhaben, nicht akut.

---

## Architektur-Konsens (NICHT VERHANDELBAR)

- **Pipeline (P01–P14) bleibt unangetastet.** Tetraeder lebt auf anderer
  Schicht, ist nie *in* der Pipeline.
- **Click-Targets der Bögen sind Convenience-Brücken** zu Pipeline-Panels,
  nicht der architektonische Anspruch. Sind heute: sys→P01, rou→P02,
  loa→P09. Werden langfristig zu echten Threshold-Editoren ersetzt.
- **Direktester Weg.** Umbauten gehören geplant. Nicht herumbasteln.
- **Git ist Review-Mechanismus.** Browser schreibt nichts ins Repo. PR-Flow
  ist Zukunftsmusik, kein Heute.

---

## Wichtige Files (für schnelle Orientierung)

| Datei | Inhalt |
|---|---|
| `docs/represent_build.md` | **Autoritative Doku** der Tetraeder-Kosmologie. Lange Doku, *Kosmologie-Update Mai 2026* am Ende ist der aktuelle Stand. |
| `src/scim/ui/RepresentBuildTetrahedron.tsx` | SVG-Tetraeder mit 4 Faces + 3 Spheres |
| `src/scim/ui/Navigator.tsx` | Navigator mit Logo + Trapez + Manual/Reader + Tetraeder + Listen |
| `src/scim/ui/ScimMap.tsx` | Inspector-Karte (rechts) mit Colour-Mesh |
| `src/scim/ui/colourMeshOverlay.ts` | Heat-Pipe-Rendering + Overpass-Fetch |
| `src/scim/ui/panels/GeometryEditorPanel.tsx` | Geometry-Editor mit Polygon-Zeichnen + Export |
| `src/scim/ui/panels/RepresentationWizard.tsx` | Wizard mit DRAFT-Support + Geometry-Copy-Knopf |
| `src/scim/ui/panels/WorkspacePanel.tsx` | Represent-Organisation mit DRAFT-Box |
| `src/assets/logo-base-naked.svg` | Mond ohne Wordmark (Iconset only) |
| `src/assets/logo-hex-naked.svg` | Hex separat zum Pulsieren |

---

## Sofort-Aktion beim nächsten Chat-Start

Nichts CI-mäßiges hängt. Einfach `docs/represent_build.md` (besonders das
Kapitel *Kosmologie-Update Mai 2026*) und diese HANDOVER lesen, dann mit dem
User abstimmen ob R-Konsument (Punkt 1 oben) gebaut werden soll.

Wenn ja: vier Schritte, ein Commit pro Schritt:
1. `_redirects` in `public/` für Cloudflare-SPA-Fallback
2. URL-Parser + RepresentationContext
3. ScimMap reagiert auf active R (Bounds, OSM, POIs)
4. Workspace-Liste macht jede R anklickbar → setzt sie aktiv
