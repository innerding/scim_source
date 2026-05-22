# SCIM Panel-Zusammenbauplan

## 0. Zweck dieses Dokuments

Dieser Panel-Zusammenbauplan beschreibt, wie die 12 SCIM-Panels technisch und fachlich zu einer lauffähigen Gesamtkette verbunden werden.

Er wiederholt nicht die vollständigen Panel-Spezifikationen. Stattdessen legt er fest:

- in welcher Reihenfolge die Panels integriert werden,
- welche Kontextbereiche je Panel als Input und Output gelten,
- welche Statuswerte die Übergabe an das nächste Panel erlauben,
- welche Bedingungen blockieren,
- welche Mock- und Simulationspfade zulässig sind,
- welche Integrations- und End-to-End-Tests notwendig sind,
- welche Grenzen zwischen SCIM-Engine, Leaflet, Sensus Core und Ziel-App einzuhalten sind.

Leitsatz:

> Der Zusammenbauplan verbindet die einzelnen Panel-Spezifikationen zu einer prüfbaren SCIM-Pipeline.

---

## 1. Grundprinzip der SCIM-Pipeline

Die SCIM wird nicht als einzelnes Monolith-Modul gebaut, sondern als Pipeline aus fachlich getrennten Panels.

Grundkette:

```txt
Inputs laden und validieren
→ Boundary erzeugen
→ Daten extrahieren
→ Graph bauen
→ POI, Load und Bewegung berechnen
→ Routen bewerten
→ Sensus-Core-Paket erzeugen
→ lokal anwenden
→ Wirkung prüfen
→ freigeben und exportieren
```

Die Panels arbeiten auf einem gemeinsamen `ScimContext`. Jedes Panel darf nur seinen eigenen Kontextbereich schreiben und muss alle fremden Kontextbereiche unverändert lassen.

---

## 2. Globale Integrationsregeln

### 2.1 Gemeinsamer Kontext

Alle Panels verwenden einen gemeinsamen Kontext:

```ts
export interface ScimContext {
  representation_id?: string;
  system_adjust?: SystemAdjustState;
  regio_content?: RegioContentState;
  target_app_ui?: TargetAppUiState;
  telco_load?: TelcoLoadState;
  boundary?: BoundaryState;
  extracted_data?: ExtractionState;
  scim_context?: ScimRuntimeContextState;
  graph?: GraphState;
  basis_layer?: BasisLayerState;
  leaflet_check?: LeafletBasisCheckState;
  poi_model?: PoiModelState;
  load_model?: LoadProjectionState;
  movement_model?: MovementModelState;
  masking_model?: MaskingModelState;
  route_model?: RouteModelState;
  route_layer_model?: RouteLayerModelState;
  layer_model?: LayerModelState;
  sensus_core_package?: SensusCorePackageState;
  local_user_context?: SensusCoreLocalState;
  view_state?: SensusCoreViewState;
  leaflet_effect_check?: LeafletEffectCheckState;
  release?: ReleaseExportState;
  status?: ScimGlobalStatus;
}
```

### 2.2 Schreibgrenzen

Jedes Panel muss harte Schreibgrenzen haben.

Ein Panel darf:

- seine eigenen Kontextbereiche erzeugen oder aktualisieren,
- Validierungsstatus, Warnungen und Fehler für seinen Bereich führen,
- technische Diagnosewerte in seinem Bereich speichern, sofern sie nicht in Sensus Core gelangen.

Ein Panel darf nicht:

- vorgelagerte Inputs heimlich korrigieren,
- fremde Kontextbereiche überschreiben,
- Debug- oder Rohdaten in Sensus-Core-taugliche Outputs verschieben,
- fehlende Freigaben implizit ersetzen,
- Datenschutzgrenzen abschwächen.

### 2.3 Statuspflicht

Jeder Panel-Output muss mindestens enthalten:

- eindeutige ID,
- `representation_id`, sofern räumlich oder paketbezogen,
- Quelle oder Build-Version,
- Zeitstempel,
- Status,
- Validierungsergebnis,
- Fehlerliste,
- Warnliste.

### 2.4 Übergabefähige Statuswerte

Für die Übergabe an ein Folgepanel gelten grundsätzlich:

```txt
valid       → Folgepanel darf produktiv weiterarbeiten
warning     → Folgepanel darf weiterarbeiten, wenn Warnungen nicht blockierend sind
draft       → nur Entwurf, Mock, Preview oder Test
invalid     → blockiert produktive Folgepanels
error       → blockiert
privacy_blocked → blockiert immer
expired     → blockiert oder nur historisch, je nach Panelregel
```

### 2.5 Datenschutzvorrang

Kein Panel darf Datenschutzregeln unterschreiten.

Nicht erlaubt in Sensus-Core-Ausgaben oder öffentlichen Exporten:

- Rohsignale,
- Einzelsignale,
- einzelne Geräte,
- Device Counts,
- individuelle Bewegungswege,
- individuelle Aufenthaltsdauer,
- exakte Signalgruppen,
- Debug-GeoJSON,
- Operatornotizen,
- abgelehnte oder pending POIs,
- nicht freigegebene Layer,
- nicht freigegebene Routenoptionen.

---

## 3. Panel-Reihenfolge und Integrationslogik

## Panel 1: System-Adjust Input

### Rolle im Zusammenbau

Panel 1 ist der systemweite Rahmen der gesamten SCIM-Kette. Ohne gültiges System-Adjust darf kein nachgelagerter produktiver Zustand entstehen.

### Muss schreiben in

```ts
context.system_adjust
```

### Übergabe an

Alle Folgepanels.

### Weitergabebedingung

```txt
context.system_adjust.status = system_adjust_valid
```

Warnstatus ist nur zulässig, wenn die Warnungen nicht Datenschutz, Mindestaggregation oder harte Systemgrenzen betreffen.

### Blockiert, wenn

- System-Adjust fehlt,
- Datenschutzgrenzen fehlen,
- Mindestaggregation fehlt,
- erlaubte Parameterbereiche fehlen,
- Regelversionen fehlen,
- kritische Privacy-Flags falsch gesetzt sind,
- Defaultwerte außerhalb erlaubter Bereiche liegen.

### Mock-Pfad

Zulässig für Entwicklung:

```txt
mock SystemAdjustState
local_json SystemAdjustState
```

Aber: Auch Mockwerte müssen Datenschutzgrenzen enthalten und dürfen keine unrealistisch offenen Defaults setzen.

---

## Panel 2: Regio-Content Input

### Rolle im Zusammenbau

Panel 2 liefert freigegebene regionale Inhalte: POIs, Radien, regionale Parameter, Sperren, Hinweise und Freigabestände.

### Muss lesen aus

```ts
context.system_adjust
```

### Muss schreiben in

```ts
context.regio_content
```

### Übergabe an

Panel 5, Panel 6, Panel 7, Panel 8, Panel 9.

### Weitergabebedingung

```txt
context.regio_content.status = regio_content_valid
```

Ein Draft ist nur für Mock, Vorschau oder Test zulässig.

### Blockiert, wenn

- System-Adjust fehlt oder ungültig ist,
- POI-Radien außerhalb System-Adjust-Grenzen liegen,
- regionale Parameter Systemgrenzen verletzen,
- Freigabestatus fehlt,
- nicht freigegebene POIs als aktiv markiert werden,
- abgelehnte POIs als Sensus-Core-sichtbar markiert werden.

### Mock-Pfad

Zulässig:

```txt
mock RegioContentState
local_json RegioContentState
regional_import
```

Mockdaten müssen mindestens enthalten:

- Region,
- freigegebene Beispiel-POIs,
- bestätigte Radien,
- regionale Parameter,
- Freigabestatus.

---

## Panel 3: Ziel-App UI Input

### Rolle im Zusammenbau

Panel 3 definiert den Ausspielvertrag für Sensus Core und Ziel-App. Es legt fest, welche Layer, Routen, Regler und Warnungen später sichtbar oder bedienbar sein dürfen.

### Muss lesen aus

```ts
context.system_adjust
context.regio_content
```

### Muss schreiben in

```ts
context.target_app_ui
```

### Übergabe an

Panel 5, Panel 6, Panel 8, Panel 9, Panel 10.

### Weitergabebedingung

```txt
context.target_app_ui.status = target_app_ui_valid
```

### Blockiert, wenn

- System-Adjust fehlt,
- Ziel-App-Profil Rohdaten zulässt,
- Debug-Layer als Sensus-Core-sichtbar markiert sind,
- erlaubte User-Regler außerhalb Systemgrenzen liegen,
- Routentypen oder Warnlogik nicht validierbar sind,
- Reduktionsprofil fehlt.

### Mock-Pfad

Zulässig:

```txt
mock TargetAppUiState
local_json app profile
operator_preview profile
```

Für produktive Paketierung muss ein freigegebenes Profil verwendet werden.

---

## Panel 4: Telco-Load Input

### Rolle im Zusammenbau

Panel 4 liefert den validierten, aggregierten Load-Eingang. Es interpretiert Load fachlich noch nicht.

### Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
```

### Muss schreiben in

```ts
context.telco_load
```

### Übergabe an

Panel 5, Panel 6, Panel 7.

### Weitergabebedingung

```txt
context.telco_load.status = telco_load_valid
```

Zulässige Warnung:

```txt
telco_load_warning
```

nur wenn Datenschutz, Aggregation und Zeitfenster nicht blockierend verletzt sind.

### Blockiert, wenn

- Rohsignalzugriff aktiv ist,
- Device-Level-Zugriff aktiv ist,
- Mindestaggregation unterschritten wird,
- Zeitfenster ungültig oder veraltet ist,
- räumliche Auflösung unzulässig genau ist,
- Signalgruppen privacy-blocked sind,
- Signalqualität keine fachliche Nutzung erlaubt.

### Simulationspfad

Zulässig und empfohlen:

```txt
simulation TelcoLoadState
mock TelcoLoadState
local_json load batch
```

Bedingungen:

- Simulation muss als Simulation markiert sein,
- keine Rohsignale,
- aggregierte Signalgruppen,
- realistische Zeitfenster,
- Datenschutzstatus vorhanden,
- Folgepanels dürfen Simulation nicht mit produktiver Telco-Quelle verwechseln.

---

## Panel 5: Boundary und Extraktion

### Rolle im Zusammenbau

Panel 5 erzeugt den räumlichen Arbeitsraum und das erste Extraktionspaket.

### Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
```

### Muss schreiben in

```ts
context.representation_id
context.boundary
context.extracted_data
```

### Übergabe an

Panel 6.

### Weitergabebedingung

```txt
context.boundary.status = boundary_valid
context.extracted_data.status = extraction_valid
```

### Blockiert, wenn

- System-Adjust fehlt,
- Boundary geometrisch ungültig ist,
- CRS unklar ist,
- Boundary zu groß oder zu klein ist,
- Puffer außerhalb Systemgrenzen liegt,
- keine wanderrelevanten Wege gefunden werden,
- Extraktion nicht zur `representation_id` passt,
- Rohsignale in Extraktionsdaten übernommen werden.

### Mock-Pfad

Zulässig:

```txt
mock boundary
geojson_import
mock extraction package
```

Für Panel 6 muss mindestens ein plausibles Wegenetz im Extraktionspaket vorhanden sein.

---

## Panel 6: Graph und Basislayer

### Rolle im Zusammenbau

Panel 6 macht aus dem Extraktionspaket eine baubare SCIM-Struktur: validierter Runtime-Kontext, Graph, Basislayer und Leaflet-Basisprüfung.

### Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
context.boundary
context.extracted_data
```

### Muss schreiben in

```ts
context.scim_context
context.graph
context.basis_layer
context.leaflet_check
```

### Übergabe an

Panel 7.

### Weitergabebedingung

```txt
context.scim_context.status = scim_context_valid
context.graph.status = graph_valid
context.basis_layer.status = basis_layer_valid
```

Warnstatus ist zulässig, wenn Graph und Basislayer fachlich nutzbar bleiben.

### Blockiert, wenn

- Boundary fehlt,
- Extraktionspaket fehlt,
- keine Knoten oder Kanten erzeugbar sind,
- Kanten keine gültige Geometrie besitzen,
- Randanschlüsse verloren gehen,
- Shape-Punkte fälschlich topologisch aufgewertet werden,
- Rohsignale in Graph oder Basislayer gelangen,
- Graph nicht zur `representation_id` passt.

### Mock-Pfad

Zulässig:

```txt
mock graph
mock basis layer
```

Aber: Für Panel 7 müssen Graphkanten, Knoten, Shape-Punkte und Abschnittskandidaten konsistent sein.

---

## Panel 7: POI, Load und Bewegung

### Rolle im Zusammenbau

Panel 7 berechnet POI-Modell, Load-Projektion, Aufenthaltslogik, Bewegungsauslastung, Maskierung und Staustellenindikatoren.

### Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
context.boundary
context.extracted_data
context.scim_context
context.graph
context.basis_layer
context.leaflet_check
```

### Muss schreiben in

```ts
context.poi_model
context.load_model
context.movement_model
context.masking_model
```

### Übergabe an

Panel 8.

### Weitergabebedingung

```txt
context.poi_model.status = poi_model_valid
context.load_model.status = loads_projected
context.movement_model.status = movement_model_valid
context.masking_model.status = masking_model_valid
```

### Blockiert, wenn

- Graph fehlt oder ungültig ist,
- Regio-Content fehlt, obwohl Aufenthalt aktiv sein soll,
- Telco-Load fehlt, obwohl Load-Berechnung aktiv ist,
- POIs nicht freigegeben sind,
- POI-Radien nicht bestätigt sind,
- Load-Gruppen Mindestaggregation unterschreiten,
- Aufenthalt und Bewegung dieselben Signale doppelt verwenden,
- maskierte Kanten trotzdem als Bewegungslast gezählt werden,
- privacy-blocked Gruppen verarbeitet werden.

### Mock-Pfad

Zulässig:

```txt
mock POI model
mock load projection
mock movement model
mock masking model
```

Für Panel 8 müssen Bewegungslasten, Maskierungen und POI-Kontext konsistent und nachvollziehbar sein.

---

## Panel 8: Routenbewertung und Routendarstellung

### Rolle im Zusammenbau

Panel 8 übersetzt Graph, Bewegung, Aufenthalt, Maskierung, regionale Sperren und Ziel-App-Profile in routenwirksame Abschnittsbewertung und Routendarstellung.

### Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
context.boundary
context.extracted_data
context.scim_context
context.graph
context.basis_layer
context.leaflet_check
context.poi_model
context.load_model
context.movement_model
context.masking_model
```

### Muss schreiben in

```ts
context.route_model
context.route_layer_model
context.leaflet_route_check
```

### Übergabe an

Panel 9.

### Weitergabebedingung

```txt
context.route_model.status = route_model_valid
context.route_layer_model.status = route_layer_valid
context.leaflet_route_check.status = leaflet_route_check_valid
```

Warnstatus ist zulässig, wenn Routenoptionen weiterhin paketierbar sind und keine Datenschutzblocker vorliegen.

### Blockiert, wenn

- Graph fehlt,
- Movement Model fehlt,
- Masking Model fehlt,
- Routenabschnitte nicht bildbar sind,
- Panel 8 Aufenthalt oder Bewegung neu klassifiziert,
- Load-Gruppen erneut verbraucht werden,
- regionale Sperren ignoriert werden,
- Routentypen aus Ziel-App UI nicht eingehalten werden,
- Debugdetails in Sensus-Core-Kandidaten gelangen.

### Mock-Pfad

Zulässig:

```txt
mock route sections
mock route options
mock route layer model
```

Für Panel 9 müssen Sensus-Core-Kandidaten klar von Operator- und Debug-Layern getrennt sein.

---

## Panel 9: Sensus-Core Package Builder

### Rolle im Zusammenbau

Panel 9 ist die harte Ausspielgrenze zwischen technischer SCIM-Pipeline und endgerätetauglicher Sensus-Core-Nutzung.

### Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.boundary
context.scim_context
context.graph
context.basis_layer
context.poi_model
context.load_model
context.movement_model
context.masking_model
context.route_model
context.route_layer_model
context.layer_model
context.leaflet_route_check
```

### Muss schreiben in

```ts
context.sensus_core_package
```

### Übergabe an

Panel 10.

### Weitergabebedingung

```txt
context.sensus_core_package.status = sensus_core_package_ready
```

Warnstatus ist nur zulässig, wenn er ausdrücklich als nicht blockierend markiert ist.

### Blockiert, wenn

- Ziel-App UI fehlt,
- Route Model fehlt,
- Paket enthält Rohdaten,
- Paket enthält Debugdaten,
- Paket enthält Operatornotizen,
- Paket enthält Device Counts,
- Paket enthält nicht freigegebene POIs,
- Paket enthält nicht erlaubte Layer,
- Route Options passen nicht zu erlaubten Routentypen,
- Reduktionsprofil nicht angewendet wurde.

### Mock-Pfad

Zulässig:

```txt
mock sensus core package
draft package
```

Aber produktive Panel-10-Nutzung darf nur auf einem validierten Paket erfolgen.

---

## Panel 10: Sensus Core lokal

### Rolle im Zusammenbau

Panel 10 konsumiert das Sensus-Core-Paket lokal und erzeugt lokale User-Auswahl sowie lokale View.

### Muss lesen aus

```ts
context.sensus_core_package
context.target_app_ui
context.system_adjust
```

### Muss schreiben in

```ts
context.local_user_context
context.view_state
```

### Übergabe an

Panel 11.

### Weitergabebedingung

```txt
context.local_user_context.status = sensus_core_local_valid
context.view_state.status = sensus_core_view_valid
```

### Blockiert, wenn

- Paket fehlt,
- Paket nicht ready oder zulässig warning ist,
- lokale Regler außerhalb erlaubter Paketgrenzen liegen,
- nicht im Paket enthaltene Layer angezeigt werden sollen,
- nicht freigegebene Routenoptionen sichtbar werden,
- Debug- oder Rohdaten wiederhergestellt werden,
- lokale Auswahl die SCIM-Bewertung neu berechnet.

### Mock-Pfad

Zulässig:

```txt
mock local user selection
mock view state
```

Nur auf Basis eines vorhandenen Paketvertrags.

---

## Panel 11: Leaflet-Wirkungsprüfung

### Rolle im Zusammenbau

Panel 11 prüft die sichtbare Wirkung der SCIM-Ergebnisse, des Pakets und der lokalen View in Leaflet.

### Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.boundary
context.extracted_data
context.scim_context
context.graph
context.basis_layer
context.leaflet_check
context.poi_model
context.load_model
context.movement_model
context.masking_model
context.route_model
context.route_layer_model
context.leaflet_route_check
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
```

### Muss schreiben in

```ts
context.leaflet_effect_check
```

### Übergabe an

Panel 12.

### Weitergabebedingung

```txt
context.leaflet_effect_check.status = leaflet_effect_valid
```

Zulässig:

```txt
leaflet_effect_warning
```

nur wenn Warnungen nicht blockierend sind.

### Blockiert, wenn

- Sensus-Core-Vorschau nicht dem Paket entspricht,
- sichtbare Layer nicht aus Paket oder View State stammen,
- Operator- und Sensus-Core-Vorschau vermischt werden,
- Debugdaten in Sensus-Core-Vorschau erscheinen,
- POI-Radien oder Routen räumlich unplausibel sind,
- Originalwege-Vergleich schwere Abweichungen zeigt,
- blockierende Fehler in der Fehlerliste stehen.

### Mock-Pfad

Zulässig:

```txt
mock leaflet effect check
operator preview mock
sensus core preview mock
```

Für Panel 12 muss aber ein prüfbarer `ready_for_release_panel`-Status existieren.

---

## Panel 12: Freigabe und Export

### Rolle im Zusammenbau

Panel 12 ist der formale Abschluss der SCIM-Pipeline. Es gibt geprüfte Zustände frei, versioniert, exportiert und archiviert sie.

### Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.boundary
context.extracted_data
context.scim_context
context.graph
context.basis_layer
context.leaflet_check
context.poi_model
context.load_model
context.movement_model
context.masking_model
context.route_model
context.route_layer_model
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.leaflet_effect_check
```

### Muss schreiben in

```ts
context.release
context.status // optional abgeleitet
```

### Finale Bedingung

Produktive Freigabe ist nur erlaubt, wenn:

```txt
ready_for_release_panel = true
blocking_issue_count = 0
sensus_core_reduction_valid = true
leaflet_effect_check.status = leaflet_effect_valid oder leaflet_effect_warning
```

### Blockiert, wenn

- Panel 11 nicht bestanden ist,
- blockierende Fehler vorhanden sind,
- Datenschutzstatus ungültig ist,
- Sensus-Core-Paket nicht ready ist,
- lokale View nicht zum Paket passt,
- Versionsstände fehlen,
- Exportmanifest unvollständig ist,
- öffentliche Exporte Debug- oder Rohdaten enthalten,
- nicht freigegebene Inhalte exportiert würden.

### Mock-Pfad

Zulässig:

```txt
draft release
test release
staging release
mock export manifest
```

Produktionsrelease nur mit vollständiger Prüfung.

---

# 4. Integrationsphasen für das Coding

## Phase 1: Kontext und Basistypen

Zuerst bauen:

```txt
ScimContext
globale Status-Typen
ValidationResult
IssueList
SourceRef
VersionRef
PrivacyStatus
```

Ziel:

- alle Panels können denselben Kontext importieren,
- Schreibgrenzen können getestet werden,
- Mockdaten können konsistent erzeugt werden.

---

## Phase 2: Input- und Steuerpanels

Bauen:

```txt
Panel 1 System-Adjust Input
Panel 2 Regio-Content Input
Panel 3 Ziel-App UI Input
Panel 4 Telco-Load Input
```

Ziel:

- gültiger Input-Kontext,
- Mock- und Simulationsquellen,
- erste Datenschutz- und Wertebereichstests.

Mindest-Endzustand:

```txt
system_adjust_valid
regio_content_valid
target_app_ui_valid
telco_load_valid oder telco_load_warning
```

---

## Phase 3: Raum- und Extraktionspanels

Bauen:

```txt
Panel 5 Boundary und Extraktion
```

Ziel:

- gültige `representation_id`,
- gültige Boundary,
- gültiges Extraktionspaket,
- testbarer GeoJSON-Import,
- erster Leaflet-Zeichen- oder Importpfad.

Mindest-Endzustand:

```txt
boundary_valid
extraction_valid
```

---

## Phase 4: Graph und Basislayer

Bauen:

```txt
Panel 6 Graph und Basislayer
```

Ziel:

- SCIM Runtime Context,
- GraphState,
- BasisLayerState,
- Leaflet-Basisprüfung.

Mindest-Endzustand:

```txt
scim_context_valid
graph_valid
basis_layer_valid
```

---

## Phase 5: POI, Load und Bewegung

Bauen:

```txt
Panel 7 POI, Load und Bewegung
```

Ziel:

- aktive POIs,
- Aufenthaltsbereiche,
- Load-Projektion,
- Bewegungslasten,
- Maskierungen,
- keine Doppelverwertung von Load-Gruppen.

Mindest-Endzustand:

```txt
poi_model_valid
loads_projected
movement_model_valid
masking_model_valid
```

---

## Phase 6: Routenbewertung

Bauen:

```txt
Panel 8 Routenbewertung und Routendarstellung
```

Ziel:

- routenrelevante Abschnitte,
- Abschnittsbewertung,
- Routenoptionen,
- Route Layer Model,
- Leaflet-Routenprüfung.

Mindest-Endzustand:

```txt
route_model_valid
route_layer_valid
leaflet_route_check_valid
```

---

## Phase 7: Sensus-Core-Paketierung

Bauen:

```txt
Panel 9 Sensus-Core Package Builder
```

Ziel:

- reduziertes Paket,
- öffentliche Layer,
- erlaubte Routenvorschläge,
- erlaubte lokale Regler,
- öffentliche Warnungen,
- Debug- und Rohdatenausschluss.

Mindest-Endzustand:

```txt
sensus_core_package_ready
```

---

## Phase 8: Lokale Sensus-Core-Anwendung

Bauen:

```txt
Panel 10 Sensus Core lokal
```

Ziel:

- lokale Routenauswahl,
- lokale Toleranzen,
- sichtbare Layer,
- sichtbare Warnungen,
- lokale View.

Mindest-Endzustand:

```txt
sensus_core_local_valid
sensus_core_view_valid
```

---

## Phase 9: Wirkungsprüfung

Bauen:

```txt
Panel 11 Leaflet-Wirkungsprüfung
```

Ziel:

- Operator-Vorschau,
- Sensus-Core-Vorschau,
- Originalwege-Vergleich,
- POI- und Radiusprüfung,
- Routenprüfung,
- Fehlerliste.

Mindest-Endzustand:

```txt
leaflet_effect_valid
ready_for_release_panel = true
```

---

## Phase 10: Freigabe und Export

Bauen:

```txt
Panel 12 Freigabe und Export
```

Ziel:

- Release Summary,
- Validierungsstatus,
- Datenschutzstatus,
- Versionsblock,
- Sensus-Core-Freigabe,
- Exportmanifest,
- Operator-Archiv.

Mindest-Endzustand:

```txt
release_ready
export_successful
```

---

# 5. Mock- und Simulationsstrategie

## 5.1 Erlaubte Mock-Ebenen

| Ebene | Mock erlaubt? | Zweck |
|---|---:|---|
| System-Adjust | ja | frühe Parameter- und Datenschutztests |
| Regio-Content | ja | POI-, Radius- und regionale Parametertests |
| Ziel-App UI | ja | Sensus-Core-Sichtbarkeit und Reduktion |
| Telco-Load | ja | Simulation von Aggregatlasten |
| Boundary | ja | GeoJSON- und Graph-Tests |
| Extraktion | ja | Graphbuilder ohne Live-Daten |
| Graph | ja, eingeschränkt | Panel-7- und Panel-8-Tests |
| Load/Movement | ja, eingeschränkt | Routenbewertungstests |
| Route Model | ja, eingeschränkt | Paketbuildertests |
| Sensus-Core-Paket | ja, eingeschränkt | lokale View-Tests |
| Release | ja, nur Draft/Test | Exportlogik testen |

## 5.2 Simulation-Telco

Simulation-Telco ist kein neues Hauptpanel, sondern eine zulässige Quelle für Panel 4.

Erforderlich:

```txt
source = simulation
provider.raw_signal_access = false
provider.device_level_access = false
aggregation valid
privacy_check valid
load_signals are grouped
no raw traces
```

## 5.3 Mock darf nicht

Mockdaten dürfen nicht:

- Datenschutzregeln umgehen,
- Rohdaten enthalten,
- fehlende Statuswerte überspringen,
- Folgepanels mit unrealistisch vollständigen Outputs täuschen,
- Debugdaten als Sensus-Core-sichtbar markieren.

---

# 6. Übergabetests zwischen Panels

## 6.1 Mindest-Übergabetests

Für jede direkte Panelkante muss ein Test existieren:

| Übergabe | Testziel |
|---|---|
| Panel 1 → 2 | Regio-Content wird gegen System-Adjust validiert |
| Panel 1 → 3 | Ziel-App-Regler und Sichtbarkeit halten Systemgrenzen ein |
| Panel 1 → 4 | Load-Zeitfenster und Mindestaggregation werden korrekt begrenzt |
| Panel 1-4 → 5 | Boundary/Extraktion startet nur mit gültigem Inputrahmen |
| Panel 5 → 6 | Graph entsteht nur aus gültiger Boundary und Extraktion |
| Panel 6 → 7 | POI/Load/Bewegung nutzt nur gültigen Graphen |
| Panel 7 → 8 | Routenbewertung nutzt fertige Bewegung und Maskierung |
| Panel 8 → 9 | Paketbuilder übernimmt nur Sensus-Core-Kandidaten |
| Panel 9 → 10 | lokale View nutzt nur Paketinhalt |
| Panel 10 → 11 | Sensus-Core-Vorschau entspricht lokaler View |
| Panel 11 → 12 | Release nur bei bestandener Wirkungsprüfung |

## 6.2 Negativtests

Jede Panelkante braucht mindestens einen Negativtest:

- fehlender Input,
- falsche `representation_id`,
- invalid Status,
- privacy-blocked Status,
- nicht erlaubter Kontextschreibzugriff,
- Debugdaten im Sensus-Core-Kandidaten,
- nicht freigegebener Content,
- veraltete Load-Daten,
- inkonsistente Versionen.

---

# 7. End-to-End-Minimaldurchlauf

## 7.1 Minimaler lauffähiger Testfall

Ein minimaler End-to-End-Test braucht:

```txt
1 System-Adjust Mock
1 Regio-Content Mock mit 2-3 freigegebenen POIs
1 Ziel-App UI Mock mit erlaubten Layern und Routentypen
1 Simulation-Telco-Batch mit aggregierten Load-Gruppen
1 kleine Boundary als GeoJSON
1 Extraktionspaket mit wenigen Wegen
1 Graph mit Knoten, Kanten und Abschnittskandidaten
1 POI-Aufenthaltsbereich
1 Bewegungskante
1 maskierter Abschnitt
1 bewerteter Routenabschnitt
1 Sensus-Core-Paket
1 lokale View
1 Leaflet-Wirkungsprüfung
1 Draft-Release
```

## 7.2 Erfolgskriterien

Der End-to-End-Test gilt als bestanden, wenn:

- alle Panels ihre Kontextbereiche korrekt schreiben,
- keine fremden Kontextbereiche verändert werden,
- Statusübergänge plausibel sind,
- Datenschutzblocker nicht auftreten,
- Roh- und Debugdaten nicht ins Paket gelangen,
- lokale View nur Paketinhalt zeigt,
- Panel 11 keine blockierenden Fehler findet,
- Panel 12 ein Draft-Release erzeugen kann.

---

# 8. Blocker-Matrix

| Blocker | Wirkung |
|---|---|
| Kein gültiger System-Adjust | blockiert alle produktiven Folgepanels |
| Ungültiger Regio-Content | blockiert POI-, Aufenthalts-, Routen- und Paketlogik |
| Ungültiges Ziel-App UI Profil | blockiert Sensus-Core-Paketierung |
| Privacy-blocked Telco-Load | blockiert Load-, Bewegungs- und Routenlastlogik |
| Ungültige Boundary | blockiert Extraktion, Graph, Engine |
| Ungültige Extraktion | blockiert Graph |
| Ungültiger Graph | blockiert POI/Load/Bewegung und Routenbewertung |
| Ungültiges Movement/Masking Model | blockiert Routenbewertung |
| Ungültiges Route Model | blockiert Paketbuilder |
| Ungültiges Sensus-Core-Paket | blockiert lokale Anwendung und Freigabe |
| Ungültige lokale View | blockiert Wirkungsprüfung |
| Blockierende Leaflet-Wirkungsfehler | blockieren Release |
| Datenschutzfehler im Export | blockiert Export immer |

---

# 9. Technische Paketierung der Panels

Empfohlene Top-Level-Struktur:

```txt
src/scim/
  context/
    scimContext.types.ts
    scimStatus.types.ts
    scimValidation.types.ts
    scimIssues.types.ts

  system-adjust/
  regio-content/
  target-app-ui/
  telco-load/
  boundary-extraction/
  graph-basislayer/
  poi-load-movement/
  route-evaluation-display/
  sensus-core-package/
  sensus-core-local/
  leaflet-effect-check/
  release-export/

  integration/
    scimPipeline.orchestrator.ts
    scimPipeline.guards.ts
    scimPipeline.transitions.ts
    scimPipeline.mockScenario.ts
    scimPipeline.e2e.test.ts
```

## 9.1 Orchestrator

Der Orchestrator darf Panels aufrufen und Status prüfen, aber keine Fachlogik berechnen.

Aufgaben:

- Panel-Reihenfolge steuern,
- Kontext weiterreichen,
- Guard-Funktionen anwenden,
- Blocker sammeln,
- Pipeline-Status ableiten.

## 9.2 Guards

Für jedes Panel sollte es Guard-Funktionen geben:

```ts
canRunPanel1(context)
canRunPanel2(context)
...
canRunPanel12(context)
```

Diese Guards prüfen nur Voraussetzungen und Status, nicht die fachliche Verarbeitung.

## 9.3 Transitions

Übergänge sollten explizit modelliert werden:

```ts
transitionFromSystemAdjustToRegioContent()
transitionFromInputsToBoundary()
transitionFromExtractionToGraph()
transitionFromGraphToPoiLoadMovement()
transitionFromMovementToRouteEvaluation()
transitionFromRouteEvaluationToPackage()
transitionFromPackageToLocalView()
transitionFromLocalViewToEffectCheck()
transitionFromEffectCheckToRelease()
```

---

# 10. Umsetzungsempfehlung

Die SCIM sollte zunächst nicht als vollständige UI gebaut werden, sondern als lauffähige Pipeline mit Mockdaten.

Empfohlene Reihenfolge:

```txt
1. ScimContext und globale Typen
2. Mockdaten für Panels 1-5
3. Orchestrator und Guards
4. Panel 1-4 als Inputmodule
5. Panel 5 mit GeoJSON-Import
6. Panel 6 mit einfachem Graphbuilder
7. Panel 7 mit Simulation-Load
8. Panel 8 mit einfacher Abschnittsbewertung
9. Panel 9 mit hartem Reduktionsfilter
10. Panel 10 lokale View aus Paket
11. Panel 11 visuelle Prüfstruktur
12. Panel 12 Draft-Release
```

Ziel des ersten Builds ist nicht vollständige Produktreife, sondern ein sauberer End-to-End-Durchlauf ohne Regelbruch.

---

# 11. Kurzfazit

Der Panel-Zusammenbauplan macht die SCIM-Architektur integrierbar.

Die wichtigsten Regeln sind:

- Panel 1 setzt den nicht unterschreitbaren Systemrahmen.
- Panels 2-4 liefern validierte Inputs.
- Panel 5 erzeugt den räumlichen Arbeitsraum.
- Panel 6 erzeugt Graph und Basislayer.
- Panel 7 berechnet POI, Load, Aufenthalt, Bewegung und Maskierung.
- Panel 8 übersetzt diese Ergebnisse in Routenwirkung.
- Panel 9 erzeugt das reduzierte Sensus-Core-Paket.
- Panel 10 konsumiert das Paket lokal.
- Panel 11 prüft die sichtbare Wirkung.
- Panel 12 gibt nur geprüfte, reduzierte und versionierte Zustände frei.

Leitsatz:

> Erst wenn die Kontextgrenzen, Statusübergänge und Datenschutzsperren zwischen den Panels sauber funktionieren, sollte die UI vollständig ausgebaut werden.
