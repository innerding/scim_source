# Shell & Katalog — zwei Takte, zwei Schienen (Konsens 2026-06-04)

Maßgeblich für die Trennung von **Render-Mechanik** (Shell) und **Katalog** (Daten).
Kurzfassung als System-Manifest in-app: `src/scim/sensus/shellKatalogManifest.ts`
(System-Tab „Manifest"). Ergänzt den Umbauplan (`docs/ziel_app_umbauplan.md`).

## Das Bild in einem Satz

**Eine Maschine (Shell-Mechanik, langsam/versioniert) — gespeist aus einer lebenden
Quelle (Katalog → Origin-Daten, live).** Die Werkbank baut beides; die Dashboards
drehen an der Quelle; die Ziel-App fährt die fertige Maschine.

## Drei Dinge, die getrennt sind

1. **Container-/Cluster-/POI-Kategorie-Visualisierung** = die *Mechanik* (Code).
2. **Katalog-Anwendung** = *wo* der Katalog läuft (Operator, Dashboards).
3. **Katalog-Zweck** = *wofür* (POI-Befüllung), Output sind **Origin-POI-Daten**.

## Zwei Takte

| | Container-Mechanik (Render-Kern) | Katalog |
|---|---|---|
| Was | Code/Funktion (Shell-Engine) | Daten (POIs, Icons, Klassifikation) |
| Takt | **langsam**, ~monatlich, stabil | **live**, immer aktuell |
| Wer ändert | nur der Operator, gezielt | Dashboards (laufend) |
| Output der Dashboards | — (fassen die Mechanik nie an) | **Origin-POI-Daten**, nie Shell |

Die Mechanik *erscheint* an drei Orten (Operator-Vorschau, Dashboards, Ziel-App),
ist aber **immer dieselbe eine** — referenziert, nicht dreimal kopiert.

## Daher wird so gebaut

Die Container-Mechanik existiert **einmal** als eigenständige, **versionsfixierte
Bibliothek** (das long-term-Shell-Paket), die Operator, Dashboards und Ziel-App alle
**referenzieren — nie kopieren**. Der Katalog läuft davon **getrennt** auf der
Live-Schiene: Operator und Dashboards arbeiten immer auf dem **aktuellen** Katalog,
ihr Output sind ausschließlich **Origin-POI-Daten**; die Ziel-App bekommt daraus
aufgelöste Origin-Daten und füllt sie in die generischen Container des Shell-Pakets.

## Herkunft — die Mechanik kam aus dem Katalog

Im Code-Verlauf belegt:

- **Anfangs** lag die Render-Logik *inline im* `CatalogTab` (führte zu Divergenz).
- **Dann** herausgezogen nach `poiCatalog.composite.ts` — weiter im Katalog-Ordner.
- **Jetzt** der generische Kern gehoben nach `src/scim/sensus/shellRenderCore.ts`
  (Shell-Bereich), editor-frei, Assets via `RenderAssets` hereingereicht.

Damit dreht sich die Beziehung: Der Katalog war erst **Eigentümer**, jetzt ist er
der **erste Referenzierer** (`poiCatalog.composite.ts` = erster Adapter um den Kern).
Runtime und Dashboards werden weitere, gleichberechtigte Referenzierer.

## Die Git-Frage: Wie überquert eine Funktion Repo-Grenzen ohne Duplikat?

Ein und derselbe Kern muss in mehreren Repos leben (`scim_source`,
`sensus-core-runtime`, künftige Dashboards) — als **eine Quelle, referenziert, nie
von Hand doppelt gepflegt**. Wege:

| Weg | Wie | Passt für | Haken |
|---|---|---|---|
| A — Kopie pro Auslieferung | Build friert Schnappschuss in jedes Bundle | nur wenn *auto-generiert* | keine geteilte Typprüfung; Drift-Gefahr |
| B — Monorepo / npm-Workspace | alle Repos unter ein Dach, Kern lokales Package | Code der **schnell gemeinsam** wächst | großer Umbau; koppelt Deploy-Takte unnötig |
| C — git-Submodule | Kern eigenes Repo, an fixiertem Commit eingebettet | versionsfix ohne Registry | Submodule-Bedienung berüchtigt fummelig |
| **D — git-getaggte npm-Dependency** ⭐ | `"shell-render-core": "github:innerding/shell-render-core#v1.2.0"` | **stabiler Kern, mehrere unabhängige Konsumenten** | — |
| E — publiziertes Registry-Package | wie D, über npm/GitHub-Packages | viele/externe Konsumenten | braucht Publish-Pipeline + Auth |

**Empfehlung: D.** Begründung aus den zwei Takten:

- **Versionsfix per Tag = Vorteil, kein Aufwand.** Bei monatlichem Takt willst du
  *bewusst* steuern, wann eine App eine neue Kern-Version bekommt — der Tag ist der Schalter.
- **Normales `npm install`, keine Registry-Infrastruktur.** npm zieht git-Tags direkt;
  passt 1:1 zum jetzigen git-+-GitHub-Actions-Workflow.
- **Entkoppelt die Deploy-Takte** (anders als Monorepo): jeder Konsument adoptiert
  neue Kern-Versionen je für sich.
- **Weniger fehleranfällig als Submodule** im Solo-Betrieb: nur eine Versionszeile.

Später nahtlos zu **E** ausbaubar (= der „transfer"-Schritt aus dem shell-run:
Shell wird versioniert ausgespielt), falls Dashboards extern/zahlreich werden.

## Stand der Vorbereitung (2026-06-04)

`shellRenderCore.ts` ist bereits **editor-frei** herausgeschält (Container-SVG,
Composite inkl. Summit/Deco, Glyph-Reihe, Cluster-Math). Er hängt an keiner
Registry mehr — Assets kommen über `RenderAssets` herein. Damit ist „Kern in eigenes
Repo + als `#v1.0.0` einbinden" nur noch ein mechanischer Schritt; die harte
Entkopplung steht. `poiCatalog.composite.ts` und `clusterOverlay.ts` sind bereits
dünne Adapter/Konsumenten des Kerns.

**Offen:** eigenes Repo `shell-render-core` herauslösen, Editor + Runtime als
git-Tag-Dependency darauf umstellen (Runtime-Adapter über Origin-Daten).
