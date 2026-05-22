# SCIM Minimaler Entwicklungsfahrplan

## 0. Zweck dieses Dokuments

Dieses Dokument beschreibt einen minimalen, realistischen Entwicklungsfahrplan für die SCIM-Pipeline.

Es beantwortet:

- was zuerst gebaut werden sollte,
- welche Artefakte zwingend vor Codebeginn stehen müssen,
- welche Aufgaben von ChatGPT, Codex und Claude sinnvoll übernommen werden können,
- welche Aufgaben weiterhin menschliche Produkt- oder Architekturentscheidungen brauchen,
- welche Meilensteine zu einem ersten End-to-End-Durchlauf führen,
- welche Reihenfolge für Coding, Tests, Review und Integration empfohlen wird.

Leitsatz:

> Zuerst die Pipeline stabil machen, dann die UI ausbauen.

---

## 1. Grundannahme

SCIM soll nicht zuerst als vollständige Oberfläche gebaut werden. Die erste Entwicklungsstufe sollte eine lauffähige, testbare Pipeline mit Mock- und Simulationsdaten sein.

Minimalziel:

```txt
System-Adjust Mock
→ Regio-Content Mock
→ Ziel-App UI Mock
→ Simulation-Load
→ Boundary/Extraction Mock
→ Graph
→ POI/Load/Movement
→ Route Model
→ Sensus-Core Package
→ lokale View
→ Wirkungsprüfung
→ Draft Release
```

Das erste Ziel ist nicht Produktreife, sondern:

- konsistente Kontextübergaben,
- valide Statuslogik,
- harte Datenschutzsperren,
- funktionierende Schreibgrenzen,
- testbare Engine-Abschnitte,
- ein End-to-End-Durchlauf ohne Regelbruch.

---

## 2. Rollenklärung: ChatGPT, Codex, Claude, Mensch

## 2.1 ChatGPT

ChatGPT eignet sich besonders für:

- Architekturklärung,
- Spezifikationen,
- Datenmodell-Entwürfe,
- Panel-Verträge,
- Review-Checklisten,
- Testfallplanung,
- Akzeptanzkriterien,
- Refactoring-Konzepte,
- Dokumentationspflege,
- Prompt- und Aufgabenpakete für Codex oder Claude.

ChatGPT sollte nicht primär als ausführender Code-Agent behandelt werden, sondern als Architektur-, Spezifikations- und Review-Instanz.

## 2.2 Codex

Codex eignet sich besonders für:

- konkrete Code-Implementierung,
- TypeScript-Dateien anlegen,
- Tests schreiben,
- bestehende Codebase verstehen,
- Pull-Request-fähige Änderungen,
- Refactoring innerhalb einer Codebase,
- Mockdaten und Fixtures erzeugen,
- Guard-Funktionen und Validation-Code implementieren,
- Orchestrator und Pipeline-Tests bauen,
- CI-nahe Aufgaben.

Codex sollte die Hauptrolle für die tatsächliche Implementierung übernehmen.

## 2.3 Claude

Claude eignet sich besonders für:

- alternative Architektur-Reviews,
- große Code- und Dokumentationsdurchsicht,
- Refactoring-Vorschläge,
- Konsistenzprüfung längerer Spezifikationen,
- Edge-Case-Analyse,
- Zweitmeinung zu Datenmodellen,
- Sicherheits- und Privacy-Review,
- Testabdeckung gegen Spezifikation prüfen,
- Entwickler-Assistenz in Terminal/IDE-Workflows.

Claude sollte vor allem als zweite Review- und Refactoring-Instanz eingesetzt werden, nicht zwingend als primärer Implementierer.

## 2.4 Mensch / Produktentscheidung

Folgende Aufgaben bleiben beim Menschen:

- fachliche Entscheidung, welche Annahmen produktiv gelten,
- Datenschutz- und Rechtsfreigabe,
- Telco-Datenvertrag,
- finale UX-/Produktpriorisierung,
- Freigabe echter Ziel-App-Sichtbarkeit,
- Entscheidung über reale Grenzwerte,
- Entscheidung über Releasefähigkeit,
- Abnahme von System-Adjust-Regeln,
- Abnahme von Regio-Content-Prozessen.

---

## 3. Aufgabenverteilung nach Artefakttyp

| Artefakt / Aufgabe | ChatGPT | Codex | Claude | Mensch |
|---|---:|---:|---:|---:|
| Panel-Spezifikation | primär | unterstützend | Review | Abnahme |
| Kontextvertrag | primär | implementiert | Review | Abnahme |
| TypeScript-Typen | Entwurf | primär | Review | optional |
| Validierungsschemas | Entwurf | primär | Review | Abnahme bei kritischen Regeln |
| Mockdaten | Entwurf | primär | Review | optional |
| Simulation-Load Adapter | Spezifikation | primär | Review | Abnahme der Szenarien |
| Pipeline-Orchestrator | Entwurf | primär | Review | optional |
| UI-Komponenten | Spezifikation | primär | Review | Produktabnahme |
| Tests | Testplan | primär | Review | Akzeptanz |
| Datenschutzprüfung | Regelentwurf | technische Tests | Review | finale Freigabe |
| Release-Logik | Spezifikation | primär | Review | finale Freigabe |
| Dokumentation | primär | technische Ergänzung | Review | optional |
| Pull Requests | Review-Anleitung | primär | Review | Merge-Entscheidung |

---

## 4. Entwicklungsphasen

# Phase 0: Projektgrundlage fixieren

## Ziel

Alle bisher erstellten Architekturartefakte in die Projektquelle übernehmen und als verbindliche Grundlage markieren.

## Eingaben

- Finale Panel- und Tab-Liste
- Panel-Bauplan
- Panel-Spezifikationen 1-12
- Austauschpanel-Checkliste
- Panel-Zusammenbauplan
- Sensus-Core Package Contract
- Simulation-Load Adapter Spec
- SCIM Kontextvertrag

## Aufgaben

### ChatGPT

- Konsistenz der Dokumente prüfen.
- Reihenfolge und Begriffe normalisieren.
- Offene Punkte markieren.
- Codex-Aufgabenpakete daraus ableiten.

### Codex

- Dokumente in Repo-Struktur einordnen.
- README oder `/docs/scim/`-Index anlegen.
- Links zwischen Dokumenten ergänzen.
- Erste Dateistruktur vorbereiten.

### Claude

- Gegenlesen auf Widersprüche.
- Begriffe und Statuswerte auf Inkonsistenzen prüfen.
- Risiko-Review der Datenschutzgrenzen.

### Mensch

- Entscheiden, welche Dokumente verbindlich sind.
- Offene Produktannahmen bestätigen oder als Draft markieren.

## Ergebnis

```txt
/docs/scim/
  panel-list.md
  panel-build-plan.md
  panel-replacement-contract.md
  panel-integration-plan.md
  sensus-core-package-contract.md
  simulation-load-adapter-spec.md
  scim-context-contract.md
```

---

# Phase 1: ScimContext und globale Typen

## Ziel

Das technische Rückgrat bauen.

## Aufgaben

### ChatGPT

- finale TypeScript-Typstruktur aus Kontextvertrag ableiten.
- Schreibrechte je Panel als Tabelle oder Policy beschreiben.
- Mindesttests definieren.

### Codex

Implementieren:

```txt
src/scim/context/
  scimContext.types.ts
  scimContext.paths.ts
  scimContext.status.ts
  scimContext.issues.ts
  scimContext.validation.ts
  scimContext.sourceRefs.ts
  scimContext.versionRefs.ts
  scimContext.privacy.ts
  scimContext.visibility.ts
  scimContext.writePolicies.ts
  scimContext.update.ts
  scimContext.invalidate.ts
  scimContext.audit.ts
  scimContext.test.ts
```

### Claude

- TypeScript-Typen gegen Spezifikation prüfen.
- Schreibschutz- und Invalidierungslogik reviewen.
- Edge Cases suchen: fremder Kontextbereich, falsche Representation-ID, privacy leak.

### Mensch

- entscheiden, ob die Typen als verbindlich gelten.

## Abnahmekriterien

```txt
Alle Panel-Kontextpfade sind typisiert.
Alle Write Policies existieren.
applyPanelContextUpdate blockiert unzulässige Schreibpfade.
Invalidierungslogik ist testbar.
Basis-Tests laufen.
```

---

# Phase 2: Input-Panels 1-4 als Mock-fähige Module

## Ziel

Die Input-Schicht der Pipeline lauffähig machen.

## Aufgaben

### ChatGPT

- konkrete Codex-Aufgabenpakete für Panels 1-4 formulieren.
- Mockdatenstruktur definieren.
- Negativtests pro Panel ausarbeiten.

### Codex

Implementieren:

```txt
src/scim/system-adjust/
src/scim/regio-content/
src/scim/target-app-ui/
src/scim/telco-load/
```

Jeweils:

```txt
*.types.ts
*.schema.ts
*.defaults.ts
*.mock.ts
*.validation.ts
*.service.ts
*.context.ts
*.test.ts
```

### Claude

- Validierungslogik gegen Spezifikation prüfen.
- Datenschutz- und Mindestaggregationsgrenzen prüfen.
- Statuswerte auf Konsistenz prüfen.

### Mensch

- echte Default-Annahmen prüfen.
- klären, welche Werte nur Mock und welche Produktannahmen sind.

## Abnahmekriterien

```txt
Panel 1 erzeugt system_adjust_valid.
Panel 2 erzeugt regio_content_valid gegen System-Adjust.
Panel 3 erzeugt target_app_ui_valid.
Panel 4 erzeugt telco_load_valid oder telco_load_warning.
Privacy-blocked Load wird blockiert.
```

---

# Phase 3: Simulation-Load Adapter

## Ziel

Panel 4 testfähig machen, ohne echte Telco-Daten.

## Aufgaben

### ChatGPT

- Szenario-Prompts und Testmatrix finalisieren.
- Edge Cases definieren: expired, privacy-blocked, boundary, POI cluster, movement corridor.

### Codex

Implementieren:

```txt
src/scim/telco-load/simulation/
  simulationLoad.types.ts
  simulationLoad.defaults.ts
  simulationLoad.scenarios.ts
  simulationLoad.generator.ts
  simulationLoad.geometry.ts
  simulationLoad.quality.ts
  simulationLoad.privacy.ts
  simulationLoad.normalize.ts
  simulationLoad.validation.ts
  simulationLoad.expected.ts
  simulationLoad.test.ts
```

### Claude

- Testdaten auf fachliche Plausibilität prüfen.
- Prüfen, ob Simulation versehentlich echte Produktionspfade imitiert.
- Review der Regel: keine Simulation in Production Release.

### Mensch

- entscheiden, welche Simulationsszenarien für Demo und Entwicklung relevant sind.

## Abnahmekriterien

```txt
Simulation erzeugt deterministische Ergebnisse mit Seed.
Simulation enthält keine Rohdaten.
Panel 4 validiert Simulation wie echten Load.
Privacy-blocked Szenarien werden blockiert.
Panel 7 kann mit Simulation weiterarbeiten.
```

---

# Phase 4: Boundary und Extraktion

## Ziel

Einen räumlichen Arbeitskontext erzeugen.

## Aufgaben

### ChatGPT

- minimale Boundary-/Extraction-Fixtures beschreiben.
- Testfälle für CRS, Puffer, leere Extraktion und Randanschlüsse definieren.

### Codex

Implementieren:

```txt
src/scim/boundary-extraction/
  boundaryExtraction.types.ts
  boundaryExtraction.schema.ts
  boundaryExtraction.defaults.ts
  boundaryExtraction.mock.ts
  boundaryExtraction.validation.ts
  boundaryExtraction.service.ts
  boundaryExtraction.context.ts
  boundaryExtraction.test.ts
```

Optional später:

```txt
boundaryExtraction.leaflet.ts
```

### Claude

- GeoJSON-Validierung reviewen.
- Pufferlogik prüfen.
- Boundary-/Extraction-Abhängigkeit gegen Kontextvertrag prüfen.

### Mensch

- entscheiden, ob zuerst Leaflet-Zeichnen oder GeoJSON-Import gebaut wird.

## Abnahmekriterien

```txt
GeoJSON-Boundary kann importiert werden.
Boundary wird validiert.
Puffer wird innerhalb System-Adjust-Grenzen berechnet.
ExtractionState enthält Wege, POIs, Randanschlüsse und optional Load-Refs.
Ungültige Boundary blockiert Panel 6.
```

---

# Phase 5: Graph und Basislayer

## Ziel

Aus Extraktion einen SCIM-Arbeitsgraphen bauen.

## Aufgaben

### ChatGPT

- Graph-Minimalregeln präzisieren.
- Akzeptanztests für Knoten, Kanten, Shape-Punkte und Randanschlüsse formulieren.

### Codex

Implementieren:

```txt
src/scim/graph-basislayer/
  graphBasis.types.ts
  graphBasis.schema.ts
  graphBasis.defaults.ts
  graphBasis.mock.ts
  graphBasis.validation.ts
  graphBasis.graphBuilder.ts
  graphBasis.layerComposer.ts
  graphBasis.context.ts
  graphBasis.test.ts
```

Optional später:

```txt
graphBasis.leaflet.ts
```

### Claude

- Graphlogik reviewen.
- Sonderfälle prüfen: isolierte Kanten, Shape-Punkt-Aufwertung, Boundary-Connector.
- Layerproperties auf Privacy-Leaks prüfen.

### Mensch

- entscheiden, wie tief der erste Graphbuilder sein muss.

## Abnahmekriterien

```txt
Graph enthält Knoten, Kanten, Shape-Punkte.
Kanten haben Start- und Endknoten.
RouteSectionCandidates werden erzeugt.
Basislayer enthält keine Roh- oder Debugdaten.
Panel 7 kann Graph konsumieren.
```

---

# Phase 6: POI, Load und Bewegung

## Ziel

Die erste fachliche SCIM-Engine-Stufe bauen.

## Aufgaben

### ChatGPT

- präzise Testfälle für Aufenthalt maskiert Bewegung formulieren.
- Cases für freigegebene/nicht freigegebene POIs definieren.
- Akzeptanzkriterien für Maskierung und keine Doppelverwertung formulieren.

### Codex

Implementieren:

```txt
src/scim/poi-load-movement/
  poiLoadMovement.types.ts
  poiLoadMovement.schema.ts
  poiLoadMovement.defaults.ts
  poiLoadMovement.mock.ts
  poiLoadMovement.validation.ts
  poiLoadMovement.poiModel.ts
  poiLoadMovement.loadProjection.ts
  poiLoadMovement.stayLogic.ts
  poiLoadMovement.movementLogic.ts
  poiLoadMovement.masking.ts
  poiLoadMovement.jamIndicators.ts
  poiLoadMovement.context.ts
  poiLoadMovement.test.ts
```

### Claude

- fachliche Logik reviewen.
- Doppelverwertung suchen.
- Datenschutz- und Aggregationsprüfungen reviewen.
- Edge Cases: POI im Buffer, rejected POI, expired load, privacy blocked group.

### Mensch

- fachliche Schwellenwerte bestätigen oder als Mock/Draft markieren.

## Abnahmekriterien

```txt
Nur freigegebene POIs werden aktiv.
Nur bestätigte POI-Radien erzeugen Aufenthaltskandidaten.
Gültige Load-Gruppen werden projiziert.
Privacy-blocked Gruppen werden nicht verarbeitet.
Aufenthalt maskiert Bewegung.
Keine Load-Gruppe wird doppelt verbraucht.
MovementModel und MaskingModel sind Panel-8-fähig.
```

---

# Phase 7: Routenbewertung und Routendarstellung

## Ziel

SCIM-Auslastung in Routenwirkung übersetzen.

## Aufgaben

### ChatGPT

- Entscheidungslogik Abwertung/Warnung/Fallback/Ausschluss ausformulieren.
- Testfälle für route_degrade_case und fallback_route_case definieren.
- Sensus-Core-Kandidatenkriterien formulieren.

### Codex

Implementieren:

```txt
src/scim/route-evaluation-display/
  routeEvaluation.types.ts
  routeEvaluation.schema.ts
  routeEvaluation.defaults.ts
  routeEvaluation.mock.ts
  routeEvaluation.validation.ts
  routeEvaluation.sections.ts
  routeEvaluation.movement.ts
  routeEvaluation.stayContext.ts
  routeEvaluation.restrictions.ts
  routeEvaluation.profiles.ts
  routeEvaluation.options.ts
  routeEvaluation.layerComposer.ts
  routeEvaluation.context.ts
  routeEvaluation.test.ts
```

Optional später:

```txt
routeEvaluation.leaflet.ts
```

### Claude

- Review: Panel 8 darf Aufenthalt/Bewegung nicht neu klassifizieren.
- Review: Route Options enthalten keine Debugdetails.
- Review: regionale Sperren und Ziel-App-Routentypen werden eingehalten.

### Mensch

- entscheiden, wann harte Ausschlüsse statt Abwertung gelten.

## Abnahmekriterien

```txt
Route Sections entstehen aus Graph-Kandidaten.
Movement und Stay Context werden verdichtet.
Regionale Sperren werden berücksichtigt.
Routentypen aus Ziel-App UI werden eingehalten.
Sensus-Core-Kandidaten sind klar getrennt von Debug-/Operator-Layern.
Panel 9 kann route_model und route_layer_model konsumieren.
```

---

# Phase 8: Sensus-Core Package Builder

## Ziel

Eine harte, reduzierte Ausspielgrenze bauen.

## Aufgaben

### ChatGPT

- Paket-Review-Checkliste ableiten.
- Negativtests für Raw/Debug/Operator-Leaks formulieren.
- Ziel-App-Konsumtests beschreiben.

### Codex

Implementieren:

```txt
src/scim/sensus-core-package/
  sensusCorePackage.types.ts
  sensusCorePackage.schema.ts
  sensusCorePackage.defaults.ts
  sensusCorePackage.mock.ts
  sensusCorePackage.builder.ts
  sensusCorePackage.layerFilter.ts
  sensusCorePackage.routeFilter.ts
  sensusCorePackage.controlMapper.ts
  sensusCorePackage.warningReducer.ts
  sensusCorePackage.reduction.ts
  sensusCorePackage.privacy.ts
  sensusCorePackage.validation.ts
  sensusCorePackage.context.ts
  sensusCorePackage.test.ts
```

### Claude

- Privacy-Review.
- Test, ob Debug- oder Rohdaten durchrutschen.
- Review der PublicLayer und PublicRouteOption Properties.

### Mensch

- Ziel-App-Produktregeln abnehmen.
- entscheiden, welche Warnungen öffentlich sein dürfen.

## Abnahmekriterien

```txt
Paket enthält nur public_layers, route_options, allowed_local_controls, public_warnings.
Keine Rohdaten.
Keine Device Counts.
Keine Operatornotizen.
Keine Debuglayer.
Scores sind reduziert.
Interne IDs sind nicht rückführbar.
Panel 10 kann Paket konsumieren.
```

---

# Phase 9: Sensus Core lokal

## Ziel

Das Paket lokal bedienbar und sichtbar machen.

## Aufgaben

### ChatGPT

- lokale User-Flows beschreiben.
- Tests für lokale Regler formulieren.
- klären, was lokale Toleranzen dürfen und nicht dürfen.

### Codex

Implementieren:

```txt
src/scim/sensus-core-local/
  sensusCoreLocal.types.ts
  sensusCoreLocal.schema.ts
  sensusCoreLocal.defaults.ts
  sensusCoreLocal.mock.ts
  sensusCoreLocal.validation.ts
  sensusCoreLocal.packageGuard.ts
  sensusCoreLocal.userSelection.ts
  sensusCoreLocal.routeFilter.ts
  sensusCoreLocal.layerComposer.ts
  sensusCoreLocal.warningFilter.ts
  sensusCoreLocal.viewState.ts
  sensusCoreLocal.context.ts
  sensusCoreLocal.test.ts
```

### Claude

- Review: lokale Regler überschreiben keine Systemgrenzen.
- Review: keine nicht paketierten Daten werden sichtbar.
- UX-/Logik-Review der Route-Filterung.

### Mensch

- gewünschte lokale UI-Optionen priorisieren.

## Abnahmekriterien

```txt
Panel 10 nutzt nur sensus_core_package.
Lokale Auswahl verändert nicht route_model.
Lokale Toleranzen bleiben innerhalb Paketgrenzen.
ViewState enthält keine Debug- oder Rohdaten.
Panel 11 kann ViewState prüfen.
```

---

# Phase 10: Leaflet-Wirkungsprüfung

## Ziel

Operator- und Sensus-Core-Wirkung visuell und technisch prüfen.

## Aufgaben

### ChatGPT

- Prüfkatalog für Operator- und Sensus-Core-Vorschau formulieren.
- Fehlerklassen definieren.
- Release-Readiness-Kriterien ableiten.

### Codex

Implementieren:

```txt
src/scim/leaflet-effect-check/
  leafletEffectCheck.types.ts
  leafletEffectCheck.schema.ts
  leafletEffectCheck.defaults.ts
  leafletEffectCheck.mock.ts
  leafletEffectCheck.validation.ts
  leafletEffectCheck.operatorPreview.ts
  leafletEffectCheck.sensusCorePreview.ts
  leafletEffectCheck.originalWaysCompare.ts
  leafletEffectCheck.poiRadiusCheck.ts
  leafletEffectCheck.routeCheck.ts
  leafletEffectCheck.issueCollector.ts
  leafletEffectCheck.context.ts
  leafletEffectCheck.test.ts
```

Optional UI/Leaflet:

```txt
leafletEffectCheck.map.tsx
```

### Claude

- Review: Vorschauen sind getrennt.
- Review: Sensus-Core-Vorschau enthält nur Paket/ViewState.
- Review: Fehlerliste ist releasefähig.

### Mensch

- visuelle Prüflogik und Freigabeschwellen abnehmen.

## Abnahmekriterien

```txt
Operator-Vorschau darf technische Details zeigen.
Sensus-Core-Vorschau zeigt nur reduzierte Inhalte.
Originalwege-Vergleich funktioniert.
POI- und Routenprüfung erzeugt Fehlerliste.
ready_for_release_panel wird korrekt gesetzt.
```

---

# Phase 11: Freigabe und Export

## Ziel

Draft-, Test-, Staging- und später Production-Release erzeugen.

## Aufgaben

### ChatGPT

- Release-Checkliste formulieren.
- Exportmanifest-Struktur prüfen.
- Akzeptanzkriterien für Produktion vs. Test definieren.

### Codex

Implementieren:

```txt
src/scim/release-export/
  releaseExport.types.ts
  releaseExport.schema.ts
  releaseExport.defaults.ts
  releaseExport.mock.ts
  releaseExport.validation.ts
  releaseExport.summary.ts
  releaseExport.privacy.ts
  releaseExport.versioning.ts
  releaseExport.sensusCoreRelease.ts
  releaseExport.exportManifest.ts
  releaseExport.exporter.ts
  releaseExport.archive.ts
  releaseExport.context.ts
  releaseExport.test.ts
```

### Claude

- Review der Release-Blocker.
- Review: Simulation kann kein Production Release werden.
- Review des Exportmanifests.

### Mensch

- finale Releaseentscheidung treffen.
- Datenschutz- und Produktfreigabe bestätigen.

## Abnahmekriterien

```txt
Draft Release kann erstellt werden.
Production Release blockiert bei Simulation-Load.
Production Release blockiert bei Privacy Issues.
Exportmanifest enthält Versionen und Artefakte.
Operator-Archiv und öffentlicher Export sind getrennt.
```

---

# Phase 12: Minimaler End-to-End-Durchlauf

## Ziel

Ein vollständiger Testlauf durch alle 12 Panels.

## Minimaler Testfall

```txt
System-Adjust Mock
Regio-Content Mock mit 2-3 freigegebenen POIs
Ziel-App UI Mock mit erlaubten Layern und Routentypen
Simulation-Load: mixed_stay_and_movement
Boundary: kleine GeoJSON-Fläche
Extraction: wenige Wege + POIs + Randanschlüsse
Graph: Knoten, Kanten, Shape-Punkte
Panel 7: ein Aufenthalt, eine Bewegungskante, eine Maskierung
Panel 8: ein normaler und ein abgewerteter Routenabschnitt
Panel 9: ein Sensus-Core-Paket
Panel 10: lokale View
Panel 11: bestandene Wirkungsprüfung
Panel 12: Draft Release
```

## Zuständig

### ChatGPT

- End-to-End-Testfall beschreiben.
- erwartete Ergebnisse definieren.
- Testabnahme formulieren.

### Codex

- E2E-Test implementieren.
- Fixtures erzeugen.
- CI-fähige Testausführung vorbereiten.

### Claude

- E2E-Test gegen Spezifikation reviewen.
- Lücken und ungetestete Edge Cases finden.

### Mensch

- bestätigen, dass der Durchlauf dem Zielbild entspricht.

## Erfolgskriterien

```txt
Alle Panels laufen in Reihenfolge.
Alle Schreibgrenzen werden eingehalten.
Alle Statusübergänge sind gültig.
Keine Rohdaten im Paket.
Keine Debugdaten in der lokalen View.
Panel 11 findet keine Blocker.
Panel 12 erzeugt Draft Release.
```

---

## 5. Was ChatGPT konkret weiter liefern sollte

ChatGPT kann als nächstes liefern:

1. **Codex-Aufgabenpaket Phase 1**
   - genaue Arbeitsanweisung für `src/scim/context/`
   - Dateien
   - Typen
   - Tests
   - Akzeptanzkriterien

2. **Codex-Aufgabenpaket Phase 2**
   - Panels 1-4 als Inputmodule
   - Mockdaten
   - Validierung
   - Statuswerte

3. **Testfallkatalog**
   - Positivtests
   - Negativtests
   - Datenschutztests
   - End-to-End-Test

4. **Review-Prompt für Claude**
   - Was soll Claude prüfen?
   - Welche Dateien?
   - Welche Risiken?
   - Welche Ausgabeform?

5. **Issue-Liste für Repository**
   - GitHub-Issues oder Linear-Tickets je Entwicklungsphase

---

## 6. Was Codex konkret machen sollte

Codex sollte bevorzugt konkrete, abgegrenzte Aufgaben erhalten.

Beispiel-Aufgabe:

```txt
Implementiere Phase 1: SCIM Context Core.

Nutze /docs/scim/scim-context-contract.md als Quelle.
Erzeuge die Dateien unter src/scim/context/.
Implementiere TypeScript-Typen, WritePolicies, applyPanelContextUpdate,
Invalidierungslogik und Tests.
Verändere keine UI.
Erzeuge keine Businesslogik außerhalb des Kontextmoduls.
Alle Tests müssen laufen.
```

Codex sollte nicht mit zu großen Gesamtaufgaben starten wie:

```txt
Baue die ganze SCIM.
```

Besser:

```txt
Baue ScimContext.
Baue Panel 1.
Baue Panel 2.
Baue Simulation Adapter.
Baue E2E-Fixture.
```

---

## 7. Was Claude konkret machen sollte

Claude sollte klare Review-Aufträge bekommen.

Beispiel:

```txt
Prüfe die Implementierung von src/scim/context/ gegen den SCIM Kontextvertrag.

Achte besonders auf:
- Schreibgrenzen je Panel,
- Invalidierungslogik,
- Representation-ID-Konsistenz,
- Datenschutzpfade,
- Sensus-Core-Grenze,
- fehlende Tests,
- zu weiche Typen,
- mögliche stille Reparaturen.

Gib eine priorisierte Liste:
P0 blocker
P1 important
P2 cleanup
```

Claude kann auch für größere Dokumenten-Konsistenz gut eingesetzt werden:

```txt
Prüfe, ob scim_context_contract.md, panel_zusammenbauplan.md
und sensus_core_package_contract.md widerspruchsfrei sind.
```

---

## 8. Menschliche Entscheidungsfragen vor Umsetzung

Vor oder während der ersten Implementierungsphasen sollten geklärt werden:

1. Ist TypeScript gesetzt?
2. Ist React/Leaflet gesetzt?
3. Soll zuerst reine Pipeline oder direkt UI gebaut werden?
4. Welche Testumgebung wird genutzt?
5. Welche Paket-/Buildstruktur hat das Zielrepo?
6. Sollen Schemas mit Zod, TypeBox oder eigener Validierung gebaut werden?
7. Wo liegen Projektquellen im Repo?
8. Soll Simulation-Load immer verfügbar sein oder nur in Dev/Test?
9. Gibt es später echtes Backend oder zunächst lokale JSON-Dateien?
10. Was ist der erste reale Ziel-App-Use-Case?

---

## 9. Empfohlene erste drei Codex-Aufgaben

## Aufgabe 1: SCIM Context Core

```txt
Baue src/scim/context/ gemäß SCIM Kontextvertrag.
Keine UI.
Keine Engine-Logik.
Nur Typen, Status, Issues, WritePolicies, Update, Invalidierung und Tests.
```

## Aufgabe 2: Input Panels Mock Core

```txt
Baue Panels 1-4 als reine TypeScript-Module mit Mockdaten und Validierung.
Noch keine UI.
Alle Outputs schreiben über applyPanelContextUpdate.
```

## Aufgabe 3: Simulation-Load Adapter

```txt
Baue Simulation-Load Adapter unter src/scim/telco-load/simulation/.
Implementiere mindestens:
empty_area
low_uniform_load
poi_stay_cluster
movement_corridor
mixed_stay_and_movement
privacy_blocked_load
expired_load
```

Diese drei Aufgaben erzeugen die Grundlage für alle weiteren Entwicklungsphasen.

---

## 10. Empfohlener erster Claude-Review

Nach Codex-Aufgabe 1:

```txt
Review SCIM Context Core.
Prüfe gegen:
- scim_kontextvertrag.md
- scim_panel_zusammenbauplan.md
- scim_austauschpanel_checkliste_langversion.md

Fokus:
- Schreibgrenzen
- Statuslogik
- Invalidierung
- Datenschutzpfade
- Sensus-Core-Grenze
- Testabdeckung
```

Nach Codex-Aufgabe 2:

```txt
Review Panels 1-4.
Fokus:
- System-Adjust-Vorrang
- Regio-Content-Freigaben
- Ziel-App UI Reduktionsvertrag
- Telco-Load Datenschutz
- Mockdaten nicht zu produktiv
```

Nach Codex-Aufgabe 3:

```txt
Review Simulation-Load Adapter.
Fokus:
- keine Rohdaten
- deterministische Tests
- privacy-blocked Szenarien
- keine Production-Release-Fähigkeit bei Simulation
```

---

## 11. Minimaler Zeit- und Risiko-Fokus

Nicht zuerst bauen:

```txt
vollständige Leaflet UI
perfekte Kartendarstellung
echte Telco-Integration
vollständige Routingengine
Production Export
komplexe Ziel-App
```

Zuerst bauen:

```txt
Kontext
Status
Validierung
Mockdaten
Simulation
Graph-Minimalfall
Paket-Reduktion
E2E-Test
```

Der größte Architekturfehler wäre, zu früh in UI und Karteninteraktion zu gehen, bevor Kontext, Status, Datenschutzgrenzen und Paketvertrag stabil sind.

---

## 12. Kurzfazit

Der minimale Entwicklungsfahrplan ist:

```txt
1. Dokumente ins Repo
2. ScimContext bauen
3. Panels 1-4 mockfähig bauen
4. Simulation-Load Adapter bauen
5. Boundary/Extraction minimal bauen
6. Graph minimal bauen
7. POI/Load/Movement bauen
8. Route Evaluation bauen
9. Sensus-Core Package Builder bauen
10. Local View bauen
11. Leaflet-Wirkungsprüfung bauen
12. Draft Release bauen
```

Rollen:

```txt
ChatGPT → Spezifikation, Architektur, Testplanung, Aufgabenpakete, Review-Kriterien
Codex   → konkrete Implementierung, Tests, Refactoring, PR-fähige Änderungen
Claude  → Zweitreview, Konsistenzprüfung, Edge-Case-Analyse, Refactoring-Review
Mensch  → Produkt-, Datenschutz-, Grenzwert- und Releaseentscheidungen
```

Leitsatz:

> Codex baut. Claude prüft breit. ChatGPT hält Architektur, Spezifikation und Aufgabenführung stabil. Der Mensch entscheidet, was produktiv gilt.
