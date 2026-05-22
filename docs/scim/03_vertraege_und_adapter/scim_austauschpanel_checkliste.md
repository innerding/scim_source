# SCIM Austauschpanel-Checkliste je Panel – Langversion

## 0. Zweck des Dokuments

Dieses Dokument definiert, unter welchen Bedingungen ein SCIM-Panel durch ein Austauschpanel ersetzt werden darf.

Ein Austauschpanel ist ein alternatives UI, ein anderer Adapter, eine andere Datenquelle, ein Mock, eine Simulation, ein externer Berechnungsdienst oder ein anderer technischer Implementierungsweg, der denselben fachlichen Panelvertrag erfüllt.

Austauschbarkeit bedeutet ausdrücklich nicht:

- ein Panel darf beliebige fremde Aufgaben übernehmen,
- ein Panel darf spätere Berechnungsschritte vorziehen,
- ein Panel darf vorgelagerte Freigaben umgehen,
- ein Panel darf fremde Kontextbereiche verändern,
- ein Panel darf Datenschutzgrenzen unterschreiten,
- ein Panel darf Roh-, Debug- oder Operator-Daten in Sensus Core oder öffentliche Exporte bringen.

Die Austauschbarkeit wird daher nicht über die Oberfläche definiert, sondern über:

1. fachlichen Zweck,
2. erlaubte Kontextzugriffe,
3. Pflichtoutputs,
4. Validierungsregeln,
5. Datenschutzgrenzen,
6. Folgepanel-Kompatibilität,
7. Tests.

---

## 1. Globale Austauschregeln für alle Panels

Jedes Austauschpanel muss mindestens folgende Regeln erfüllen.

### 1.1 Fachzweck erhalten

Das Austauschpanel muss dieselbe fachliche Aufgabe erfüllen wie das Originalpanel. Es darf die Rolle des Panels nicht erweitern, verkürzen oder in andere Panels verschieben.

Beispiel: Ein Austauschpanel für Telco-Load darf Load-Daten laden, normalisieren und validieren. Es darf aber keine Aufenthaltserkennung, Bewegungsauslastung oder Routenbewertung berechnen.

### 1.2 Kontextgrenzen einhalten

Jedes Panel darf nur in die eigenen Kontextbereiche schreiben. Fremde Kontextbereiche sind unveränderlich.

Ein Austauschpanel muss daher explizit deklarieren:

- `reads_from`,
- `writes_to`,
- `must_not_write_to`.

Ein Verstoß gegen `must_not_write_to` ist immer blockierend.

### 1.3 Outputvertrag erfüllen

Jedes Austauschpanel muss denselben Outputvertrag erfüllen wie das Originalpanel.

Pflichtbestandteile:

- Output-State,
- Statusfeld,
- ValidationResult,
- Fehlerliste,
- Warnliste,
- Quelle,
- Version oder ID,
- Zeitstempel,
- Übergabefähigkeit an das Folgepanel.

### 1.4 Statusmodell liefern

Ein Austauschpanel muss mindestens folgende Statusgruppen abbilden können:

- nicht geladen / nicht erzeugt,
- lädt / erzeugt,
- geladen aber unvalidiert,
- validiert,
- Warnstatus,
- ungültig,
- Fehlerstatus,
- privacy-blocked, sofern Daten- oder Sensus-Core-relevant.

Die exakten Statusnamen richten sich nach dem jeweiligen Panelvertrag.

### 1.5 Datenschutzgrenzen einhalten

Kein Austauschpanel darf Datenschutzgrenzen aufweichen.

Verboten sind insbesondere:

- Rohsignale,
- Einzelsignale,
- einzelne Geräte,
- Device Counts in öffentlichen Ausgaben,
- individuelle Bewegungswege,
- individuelle Aufenthaltsdauer,
- exakte Signalgruppen in Sensus Core,
- Debug-GeoJSON in Sensus Core,
- Operatornotizen in Sensus Core,
- nicht freigegebene POI-Kandidaten in Sensus Core,
- nicht freigegebene Layer oder Routenoptionen in Sensus Core,
- nicht freigegebene Inhalte in öffentlichen Exporten.

### 1.6 System-Adjust-Vorrang

System-Adjust setzt nicht unterschreitbare Grenzen.

Ein Austauschpanel darf keine Werte akzeptieren, erzeugen oder weitergeben, die System-Adjust-Grenzen verletzen.

Das betrifft insbesondere:

- Mindestaggregation,
- Datenschutzgrenzen,
- erlaubte Parameterbereiche,
- POI-Radiusbereiche,
- Vergleichssaumbreiten,
- Signal-Gültigkeit,
- erlaubte Routenschwellen,
- erlaubte User-Toleranzen,
- Debug- und Rohdatenausschlüsse.

### 1.7 Freigaben respektieren

Ein Austauschpanel darf keine fachlichen Freigaben erfinden.

Insbesondere gilt:

- POIs werden erst aufenthaltsrelevant, wenn Regio-Content sie freigegeben hat.
- Ziel-App-Sichtbarkeit entsteht erst aus Ziel-App UI Input und Paketierung.
- Sensus-Core-Ausgaben entstehen erst durch den Package Builder.
- Produktive Exporte entstehen erst durch Freigabe und Export.

### 1.8 Keine Doppelverwertung

Für Load-, Aufenthalts-, Bewegungs- und Routenlogik gilt:

- dieselben Signale dürfen nicht doppelt als Aufenthalt und Bewegung verwertet werden,
- Aufenthalt maskiert Bewegung,
- Routenbewertung darf Aufenthalt und Bewegung nicht neu klassifizieren,
- lokale Sensus-Core-Ansicht darf fachliche SCIM-Bewertung nicht neu berechnen.

### 1.9 Folgepanel-Kompatibilität

Ein Austauschpanel ist erst akzeptabel, wenn das Folgepanel mit seinem Output arbeiten kann.

Daher braucht jedes Austauschpanel mindestens einen Übergabetest:

```txt
Panel X Austauschoutput -> Panel X+1 Inputvalidierung
```

### 1.10 Betriebsmodus kennzeichnen

Ein Austauschpanel muss seinen Betriebsmodus eindeutig kennzeichnen.

Zulässige Modi:

- `production`,
- `staging`,
- `draft`,
- `mock`,
- `simulation`,
- `operator_preview`,
- `test_only`.

Simulation und Mock dürfen produktive Freigabe nur erreichen, wenn dies explizit im Release-Modus erlaubt und dokumentiert ist.

---

## 2. Austauschklassen

| Klasse | Bedeutung | Typische Panels |
|---|---|---|
| A | Frei austauschbar bei identischem Outputvertrag | einfache Quellen- oder Adapterpanels |
| B | Austauschbar als Quelle, Adapter oder UI; Fachrolle bleibt fix | Input-, Konfigurations- und Prüfpanels |
| C | Austauschbar nur bei vollständiger Regel-, Schema- und Testgleichheit | Engine- und Bewertungslogik |
| D | Nur UI oder technische Hülle austauschbar; fachlicher Kern sehr streng gebunden | Package, Release, Datenschutzgrenze |
| E | Nicht austauschbar, nur konfigurierbar | harte Systemkerne, falls später definiert |

### 2.1 Leitregel

Je näher ein Panel an Engine-Semantik, Datenschutz, Sensus-Core-Ausspielung oder Release liegt, desto strenger wird die Austauschklasse.

---

## 3. Kurzmatrix aller Panels

| Panel | Name | Austauschklasse | Erlaubte Austauschformen | Hauptblocker |
|---:|---|---|---|---|
| 1 | System-Adjust Input | B | UI, API-Adapter, Mock, lokale JSON-Quelle | fehlende oder ungültige Systemgrenzen |
| 2 | Regio-Content Input | B | UI, API-Adapter, Import, Mock | nicht freigegebener oder systemwidriger Regio-Content |
| 3 | Ziel-App UI Input | B | UI, Konfigurationsquelle, Profiladapter, Mock | fehlender Ausspiel- und Reduktionsvertrag |
| 4 | Telco-Load Input | A/B | echter Telco, Runtime-Service, Simulation, Mock, Import | Rohdaten, fehlende Aggregation, Datenschutzverstoß |
| 5 | Boundary und Extraktion | B/C | Leaflet-Ersatz, GeoJSON-Import, Extraktionsadapter | ungültige Boundary, Graphbau im falschen Panel |
| 6 | Graph und Basislayer | C | Graphbuilder-Ersatz, Layeradapter | falsche Graphsemantik, Load-/Routenlogik zu früh |
| 7 | POI, Load und Bewegung | C | Engine-Modul, Berechnungsdienst | Doppelverwertung, Aufenthalt/Bewegung falsch getrennt |
| 8 | Routenbewertung und Routendarstellung | C | Bewertungsdienst, Routingadapter, Layercomposer | Neuklassifikation von Aufenthalt/Bewegung, Debug in Route |
| 9 | Sensus-Core Package Builder | C/D | Paketbuilder, Reduktionsdienst | Roh-, Debug-, Operator-Daten im Paket |
| 10 | Sensus Core lokal | B/C | App-Adapter, lokale View, UI-Ersatz | lokale User-Regler überschreiben Paket- oder Systemgrenzen |
| 11 | Leaflet-Wirkungsprüfung | B/C | Prüf-UI, Kartenadapter, Vergleichsdienst | Prüfung verändert Ergebnisse oder vermischt Vorschauen |
| 12 | Freigabe und Export | C/D | Exportadapter, Manifest-Builder, Archivadapter | blockierende Fehler ignoriert, unzulässiger Export |

---

# 4. Panelverträge im Detail

---

## Panel 1: System-Adjust Input

### 4.1.1 Austauschklasse

**B – Austauschbar als Quelle, Adapter oder UI; Fachrolle bleibt fix.**

### 4.1.2 Erlaubte Austauschformen

- anderes UI,
- SCIM3-Atlas-Console-Adapter,
- API-Adapter,
- lokale JSON-Konfiguration,
- Mock-Service,
- Testkonfiguration.

### 4.1.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 1 lädt, normalisiert und validiert den systemweiten System-Adjust-Stand. Es erzeugt den nicht unterschreitbaren Rahmen für alle späteren Panels.

Ein Austauschpanel muss daher weiterhin definieren:

- Systemversion,
- Datenschutzgrenzen,
- Mindestaggregation,
- erlaubte Parameterbereiche,
- Defaultwerte,
- Regelversionen,
- Feature Flags,
- Validierungsstatus.

### 4.1.4 Muss lesen aus

Panel 1 kann ohne Vorpanel arbeiten. Optional darf es aus einer externen System-Adjust-Quelle lesen.

### 4.1.5 Muss schreiben in

```ts
context.system_adjust
```

### 4.1.6 Darf nicht schreiben in

```ts
context.regio_content
context.target_app_ui
context.telco_load
context.boundary
context.extracted_data
context.scim_context
context.graph
context.poi_model
context.load_model
context.route_model
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.release
```

### 4.1.7 Pflicht-Output

```ts
SystemAdjustState
```

Pflichtfelder:

- `system_adjust_version`,
- `source`,
- `loaded_at`,
- `privacy_limits`,
- `aggregation_limits`,
- `allowed_ranges`,
- `default_parameters`,
- `rule_versions`,
- `feature_flags`,
- `validation`,
- `status`.

### 4.1.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- Datenschutzgrenzen fehlen,
- Mindestaggregation fehlt,
- erlaubte Parameterbereiche fehlen,
- Defaultwerte außerhalb erlaubter Bereiche liegen,
- Rohsignal- oder Debugsichtbarkeit für Sensus Core erlaubt würde,
- Einzelgeräte-Sichtbarkeit erlaubt würde,
- Regelversionen fehlen.

### 4.1.9 Mindesttests

- Pflichtfelder-Test,
- Datenschutzgrenzen-Test,
- Wertebereich-Test,
- Default-innerhalb-Range-Test,
- Kontext-Schreibgrenzen-Test,
- Folgepanel-Test mit Panel 2, 3 und 4.

---

## Panel 2: Regio-Content Input

### 4.2.1 Austauschklasse

**B – Austauschbar als Quelle, Adapter oder UI; Fachrolle bleibt fix.**

### 4.2.2 Erlaubte Austauschformen

- anderes Regio-Dashboard,
- Path-Works-Adapter,
- API-Adapter,
- Importmodul,
- Mock-Region,
- lokale JSON-Datei.

### 4.2.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 2 liefert den freigegebenen regionalen Inhalts- und Parameterstand. Es darf regionale Inhalte laden und validieren, aber keine Engine-Berechnungen ausführen.

Ein Austauschpanel muss liefern:

- Region,
- freigegebene POIs,
- abgelehnte POIs,
- offene POIs,
- bestätigte POI-Radien,
- regionale Parameter,
- Sperren und Hinweise,
- Freigabestatus.

### 4.2.4 Muss lesen aus

```ts
context.system_adjust
```

### 4.2.5 Muss schreiben in

```ts
context.regio_content
```

### 4.2.6 Darf nicht schreiben in

```ts
context.system_adjust
context.target_app_ui
context.telco_load
context.boundary
context.extracted_data
context.graph
context.poi_model
context.load_model
context.route_model
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.release
```

### 4.2.7 Pflicht-Output

```ts
RegioContentState
```

Pflichtfelder:

- `regio_content_version`,
- `source`,
- `loaded_at`,
- `region`,
- `approved_pois`,
- `rejected_pois`,
- `pending_pois`,
- `poi_radii`,
- `regional_parameters`,
- `regional_restrictions`,
- `regional_warnings`,
- `release`,
- `validation`,
- `status`.

### 4.2.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- kein gültiger System-Adjust vorhanden ist,
- POI-Radien außerhalb System-Adjust-Grenzen liegen,
- nicht freigegebene POIs als aktiv markiert werden,
- abgelehnte POIs in Sensus-Core-Sichtbarkeit gelangen,
- regionale Parameter System-Adjust unterschreiten,
- Entwurfsstände als produktiv markiert werden.

### 4.2.9 Mindesttests

- POI-Freigabetest,
- Radiusbereich-Test,
- regionale Parameter gegen System-Adjust,
- Draft-vs-Release-Test,
- Kontext-Schreibgrenzen-Test,
- Übergabetest an Panel 5 und Panel 7.

---

## Panel 3: Ziel-App UI Input

### 4.3.1 Austauschklasse

**B – Austauschbar als Profilquelle, Adapter oder UI; Fachrolle bleibt fix.**

### 4.3.2 Erlaubte Austauschformen

- Ziel-App-Konfigurationsdienst,
- Sensus-Core-Konfigurationsadapter,
- App-Child-Profilquelle,
- Mock-Profil,
- lokale JSON-Konfiguration,
- anderes UI zur Profilpflege.

### 4.3.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 3 erzeugt den Ausspiel- und Reduktionsvertrag zwischen SCIM-Pipeline und Ziel-App/Sensus Core.

Es definiert:

- sichtbare Layer,
- erlaubte Routentypen,
- erlaubte lokale User-Regler,
- Warn- und Hinweislogik,
- Reduktionsprofil,
- Ausschluss von Roh-, Debug- und Operator-Daten.

### 4.3.4 Muss lesen aus

```ts
context.system_adjust
context.regio_content
```

Regio-Content kann optional fehlen, wenn ein generisches Profil validiert wird. Produktive Wirkung entsteht aber erst mit vollständigem Kontext.

### 4.3.5 Muss schreiben in

```ts
context.target_app_ui
```

### 4.3.6 Darf nicht schreiben in

```ts
context.system_adjust
context.regio_content
context.telco_load
context.boundary
context.extracted_data
context.graph
context.poi_model
context.load_model
context.route_model
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.release
```

### 4.3.7 Pflicht-Output

```ts
TargetAppUiState
```

Pflichtfelder:

- `target_app_ui_version`,
- `source`,
- `loaded_at`,
- `app_profile`,
- `visible_layers`,
- `available_route_modes`,
- `allowed_user_controls`,
- `warning_rules`,
- `reduction_profile`,
- `release`,
- `validation`,
- `status`.

### 4.3.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- public-user-Profile Debuglayer erlauben,
- raw-signals als sichtbar markiert werden,
- lokale User-Regler System-Adjust überschreiten,
- nicht freigegebene POIs oder Entwürfe sichtbar würden,
- Reduktionsprofil fehlt,
- Sensus-Core-Ausschlussregeln fehlen.

### 4.3.9 Mindesttests

- sichtbare Layer gegen Datenklassen,
- User-Control-Grenztest,
- Debug-/Raw-Ausschlusstest,
- Routentyp-Kompatibilitätstest,
- Reduktionsprofil-Test,
- Übergabetest an Panel 8, 9 und 10.

---

## Panel 4: Telco-Load Input

### 4.4.1 Austauschklasse

**A/B – Frei austauschbar bei identischem Outputvertrag; Fachrolle bleibt fix.**

Panel 4 ist das am besten geeignete Panel für Simulation, Mock und alternative Datenquellen.

### 4.4.2 Erlaubte Austauschformen

- echter Telco-Load-Adapter,
- Runtime-Load-Service,
- aggregierter Backend-Service,
- Simulation-Telco-Panel,
- synthetischer Load-Generator,
- Mock-Service,
- lokale JSON-Datei,
- Importmodul.

### 4.4.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 4 lädt, normalisiert und validiert aggregierte Load-Daten. Es entscheidet noch nicht, was die Load-Daten fachlich bedeuten.

Ein Austauschpanel darf daher:

- Load-Batches laden,
- Zeitfenster prüfen,
- Signalqualität prüfen,
- Mindestaggregation prüfen,
- Verfallslogik prüfen,
- Privacy Check durchführen,
- gültige und ungültige Gruppen markieren.

Es darf nicht:

- Aufenthalt berechnen,
- Bewegungsauslastung berechnen,
- Staustellen final klassifizieren,
- Routenabschnitte bewerten,
- Layer erzeugen,
- Sensus-Core-Pakete erzeugen.

### 4.4.4 Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
```

### 4.4.5 Muss schreiben in

```ts
context.telco_load
```

### 4.4.6 Darf nicht schreiben in

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.boundary
context.extracted_data
context.scim_context
context.graph
context.poi_model
context.load_model
context.route_model
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.release
```

### 4.4.7 Pflicht-Output

```ts
TelcoLoadState
```

Pflichtfelder:

- `telco_load_batch_id`,
- `source`,
- `loaded_at`,
- `provider`,
- `time_window`,
- `spatial_scope`,
- `load_signals`,
- `aggregation_level`,
- `signal_quality`,
- `expiry_rules`,
- `privacy_check`,
- `validation`,
- `status`.

### 4.4.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- Rohsignalzugriff aktiv ist,
- Device-Level-Zugriff aktiv ist,
- Mindestaggregation unterschritten wird,
- Zeitfenster ungültig ist,
- Batch veraltet ist und nicht als historisch markiert wird,
- Signalqualität unklar ist,
- räumliche Mindestauflösung unterschritten wird,
- Simulation als reale Quelle verschleiert wird.

### 4.4.9 Simulation-Telco-Sonderregeln

Ein Simulation-Telco-Panel ist zulässig, wenn:

- `source` klar als `mock`, `simulation` oder vergleichbar markiert ist,
- keine echten Rohsignale enthalten sind,
- simulierte Gruppen dieselbe Mindestaggregation erfüllen,
- Zeitfenster und räumlicher Scope plausibel sind,
- Folgepanels denselben `TelcoLoadState` erhalten wie bei echtem Load,
- produktive Freigabe Simulation nur erlaubt, wenn Release-Modus dies ausdrücklich zulässt.

### 4.4.10 Mindesttests

- Zeitfenster-Test,
- Mindestaggregation-Test,
- Privacy-Block-Test,
- Verfallslogik-Test,
- Simulationskennzeichnung-Test,
- Kontext-Schreibgrenzen-Test,
- Übergabetest an Panel 5 und Panel 7.

---

## Panel 5: Boundary und Extraktion

### 4.5.1 Austauschklasse

**B/C – Austauschbar als UI, Import- oder Extraktionsadapter; streng bei Extraktionslogik.**

### 4.5.2 Erlaubte Austauschformen

- Leaflet-Zeichenersatz,
- GeoJSON-Import,
- gespeicherte Boundary,
- API-Boundary,
- anderer Kartenadapter,
- anderer Extraktionsdienst,
- Mock-Boundary,
- Test-Extraktionspaket.

### 4.5.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 5 erzeugt den räumlichen Arbeitsraum und das erste Extraktionspaket.

Es darf:

- Boundary zeichnen oder importieren,
- Boundary validieren,
- Puffer berechnen,
- relevante Rohwege extrahieren,
- POI-Kandidaten und freigegebene POIs räumlich zuordnen,
- Randanschlüsse erkennen,
- Load-Referenzen grob räumlich vorfiltern.

Es darf nicht:

- Graphen bauen,
- topologische Knoten final bestimmen,
- Aufenthalte berechnen,
- Bewegungsauslastung berechnen,
- Routen bewerten,
- Sensus-Core-Pakete erzeugen.

### 4.5.4 Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
```

### 4.5.5 Muss schreiben in

```ts
context.representation_id
context.boundary
context.extracted_data
```

### 4.5.6 Darf nicht schreiben in

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
context.scim_context
context.graph
context.poi_model
context.load_model
context.route_model
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.release
```

### 4.5.7 Pflicht-Output

```ts
BoundaryState
ExtractionState
```

Pflichtinhalte:

- Representation-ID,
- Boundary-Geometrie,
- Bounding Box,
- CRS,
- Buffer Policy,
- Buffer-Geometrie,
- extrahierte Wege,
- POI-Kandidaten,
- freigegebene POIs im Raumkontext,
- Randanschlüsse,
- optionale Load-Referenzen,
- Validierung,
- Status.

### 4.5.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- System-Adjust fehlt und runtime-gültige Extraktion erzeugt werden soll,
- Boundary ungültig ist,
- CRS unklar ist,
- Puffer außerhalb erlaubter Grenzen liegt,
- Rohsignale in `extracted_data` übernommen werden,
- Graphobjekte erzeugt werden,
- POIs freigegeben oder verändert werden,
- Load fachlich interpretiert wird.

### 4.5.9 Mindesttests

- Boundary-Geometrie-Test,
- CRS-Test,
- Buffer-Clamp-Test,
- Extraktionsvollständigkeit-Test,
- Rohsignal-Ausschlusstest,
- Kein-Graphbau-Test,
- Übergabetest an Panel 6.

---

## Panel 6: Graph und Basislayer

### 4.6.1 Austauschklasse

**C – Austauschbar nur bei vollständiger Regel-, Schema- und Testgleichheit.**

### 4.6.2 Erlaubte Austauschformen

- alternativer Graphbuilder,
- externer Topologie-Service,
- Basislayer-Composer,
- anderer Leaflet-Prüfadapter,
- Mock-Graph für Tests.

### 4.6.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 6 macht aus dem Extraktionspaket einen baubaren SCIM-Arbeitsgraphen und einen prüfbaren Basislayer.

Es darf:

- SCIM-Kontext prüfen,
- Wege in Knoten, Kanten und Shape-Punkte überführen,
- topologische Knoten bestimmen,
- Shape-Punkte erhalten,
- semantische Zwischenknoten vorbereiten,
- Randanschlüsse erhalten,
- route section candidates vorbereiten,
- Basislayer erzeugen,
- Leaflet-Basisprüfung durchführen.

Es darf nicht:

- Aufenthaltsbereiche berechnen,
- Load auf Kanten projizieren,
- Bewegungsauslastung berechnen,
- Maskierung berechnen,
- Routen bewerten,
- Sensus-Core-Paket erzeugen.

### 4.6.4 Muss lesen aus

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
context.boundary
context.extracted_data
```

### 4.6.5 Muss schreiben in

```ts
context.scim_context
context.graph
context.basis_layer
context.leaflet_check
```

### 4.6.6 Darf nicht schreiben in

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
context.boundary
context.extracted_data
context.poi_model
context.load_model
context.route_model
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.release
```

### 4.6.7 Pflicht-Output

```ts
ScimRuntimeContextState
GraphState
BasisLayerState
LeafletBasisCheckState
```

Pflichtinhalte:

- Graph-ID,
- Nodes,
- Edges,
- Shape Points,
- Boundary Connections,
- Route Section Candidates,
- Graph Summary,
- Basislayer Features,
- Validierung,
- Status.

### 4.6.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- Boundary oder Extraction ungültig ist,
- Kanten ohne Start- oder Endknoten entstehen,
- Shape-Punkte automatisch falsch zu topologischen Knoten werden,
- Randanschlüsse verloren gehen,
- Roh- oder Device-Daten in Graph oder Basislayer gelangen,
- Load fachlich interpretiert wird,
- Aufenthalts- oder Routenlogik vorgezogen wird.

### 4.6.9 Mindesttests

- Kontextvalidierung-Test,
- Node-/Edge-Konsistenztest,
- Shape-Point-Regeltest,
- Boundary-Connector-Test,
- Basislayer-Sanitization-Test,
- Kein-Load-/Kein-Route-Test,
- Übergabetest an Panel 7 und Panel 8.

---

## Panel 7: POI, Load und Bewegung

### 4.7.1 Austauschklasse

**C – Austauschbar nur bei vollständiger fachlicher Regel-, Schema- und Testgleichheit.**

### 4.7.2 Erlaubte Austauschformen

- alternativer Engine-Berechnungsdienst,
- POI-Modell-Service,
- Load-Projection-Service,
- Movement-Engine,
- Masking-Engine,
- Simulation für Tests mit identischem Outputvertrag.

### 4.7.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 7 erzeugt das berechnete Modell für POIs, Aufenthalt, Load-Projektion, Bewegung, Maskierung und Staustellenindikatoren.

Zentrale Regel:

```txt
Aufenthalt maskiert Bewegung.
```

Ein Austauschpanel muss sicherstellen:

- nur freigegebene POIs werden aktiv,
- nur bestätigte POI-Radien erzeugen Aufenthaltsbereiche,
- nur gültige und aggregierte Load-Gruppen werden verarbeitet,
- Aufenthaltssignale werden nicht zusätzlich als Bewegung verwertet,
- Bewegung wird nur auf nicht maskierten Kanten berechnet,
- Maskierung ist nachvollziehbar dokumentiert.

### 4.7.4 Muss lesen aus

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

### 4.7.5 Muss schreiben in

```ts
context.poi_model
context.load_model
context.movement_model
context.masking_model
```

### 4.7.6 Darf nicht schreiben in

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
context.route_model
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.release
```

### 4.7.7 Pflicht-Output

```ts
PoiModelState
LoadProjectionState
MovementModelState
MaskingModelState
```

Pflichtinhalte:

- aktive POIs,
- Aufenthaltsbereichskandidaten,
- POI-Edge-Links,
- projizierte Load-Gruppen,
- ungültige Projektionen,
- Aufenthaltsklassifizierung,
- Bewegungslasten,
- Maskierungen,
- verbrauchte Load-Gruppen,
- Staustellenindikatoren, sofern aktiviert,
- Validierung,
- Status.

### 4.7.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- Graph ungültig ist,
- Telco-Load fehlt oder ungültig ist und kein loadless Testmodus erlaubt ist,
- nicht freigegebene POIs aktiv würden,
- POI-Radien nicht bestätigt sind,
- Mindestaggregation unterschritten wird,
- Signale doppelt verwertet werden,
- Aufenthalt und Bewegung nicht sauber getrennt sind,
- Rohsignale oder Device-Daten übernommen werden,
- Routenbewertung bereits erzeugt wird.

### 4.7.9 Mindesttests

- POI-Freigabe-Test,
- Radius-Test,
- Load-Projektion-Test,
- Mindestaggregation-Test,
- Aufenthalt-maskiert-Bewegung-Test,
- Keine-Doppelverwertung-Test,
- Masking-Trace-Test,
- Datenschutztest,
- Übergabetest an Panel 8.

---

## Panel 8: Routenbewertung und Routendarstellung

### 4.8.1 Austauschklasse

**C – Austauschbar nur bei vollständiger Bewertungs-, Schema- und Testgleichheit.**

### 4.8.2 Erlaubte Austauschformen

- Routenbewertungsdienst,
- Routingadapter,
- Layercomposer,
- externer Route-Options-Service,
- Mock-Route-Model für Tests.

### 4.8.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 8 übersetzt die bereits berechnete SCIM-Auslastung in routenwirksame Abschnittsbewertung und Routendarstellung.

Es darf:

- Routenabschnitte bilden,
- Bewegungslasten auf Abschnitte verdichten,
- Aufenthaltskontext je Abschnitt prüfen,
- regionale Sperren, Hinweise und Staustellen einbeziehen,
- je Routentyp warnen, abwerten oder ausschließen,
- Routenoptionen vorbereiten,
- Routenlayer erzeugen,
- Leaflet-Routenprüfung durchführen.

Es darf nicht:

- Aufenthalt neu klassifizieren,
- Bewegung neu berechnen,
- Load-Gruppen neu verbrauchen,
- Maskierungen fachlich neu erzeugen,
- Sensus-Core-Pakete erzeugen,
- lokale User-Auswahl anwenden.

### 4.8.4 Muss lesen aus

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

### 4.8.5 Muss schreiben in

```ts
context.route_model
context.route_layer_model
context.leaflet_route_check
```

### 4.8.6 Darf nicht schreiben in

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
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.release
```

### 4.8.7 Pflicht-Output

```ts
RouteModelState
RouteLayerModelState
LeafletRouteCheckState
```

Pflichtinhalte:

- bewertete Routenabschnitte,
- Bewegungsbewertung je Abschnitt,
- Aufenthaltskontext je Abschnitt,
- regionale Restriktionswirkung,
- Staustellenwirkung,
- Status je Routentyp,
- Route Options,
- Operator-, Debug- und Sensus-Core-Kandidatenlayer getrennt,
- Leaflet-Routenprüfung,
- Validierung,
- Status.

### 4.8.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- Panel-7-Modelle ungültig sind,
- Load-Gruppen neu klassifiziert werden,
- Maskierung ignoriert wird,
- regionale Sperren nicht berücksichtigt werden,
- Debug- oder Operatorwerte in Sensus-Core-Kandidaten gelangen,
- Abwertung oder Ausschluss System-Adjust-Grenzen verletzt,
- Routentypen außerhalb Ziel-App UI entstehen.

### 4.8.9 Mindesttests

- Route-Section-Build-Test,
- Movement-Aggregation-Test,
- Stay-Context-Test,
- Restriction-Test,
- Degrade-vs-Exclude-Test,
- Route-Type-Kompatibilitätstest,
- Debug-Trennungstest,
- Übergabetest an Panel 9.

---

## Panel 9: Sensus-Core Package Builder

### 4.9.1 Austauschklasse

**C/D – Fachlich extrem streng; technische Hülle austauschbar, Ausspielgrenze nicht aufweichbar.**

### 4.9.2 Erlaubte Austauschformen

- alternativer Package Builder,
- Reduktionsdienst,
- Layerfilter,
- Routefilter,
- Exportvorbereitungsdienst,
- Testpaket-Builder.

### 4.9.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 9 ist die harte Ausspielgrenze zwischen technischer SCIM-Pipeline und endgerätetauglicher Sensus-Core-Nutzung.

Es erzeugt ein reduziertes, freigegebenes und datenschutzkonformes Sensus-Core-Paket.

Es darf:

- öffentliche Layer filtern,
- Routenvorschläge reduzieren,
- erlaubte lokale Regler vorbereiten,
- Warnungen reduzieren,
- Roh- und Debugdaten entfernen,
- Paket validieren.

Es darf nicht:

- neue Aufenthalte berechnen,
- neue Bewegungslasten berechnen,
- Routen neu bewerten,
- lokale User-Auswahl anwenden,
- Debug-, Roh- oder Operator-Daten in das Paket übernehmen.

### 4.9.4 Muss lesen aus

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

### 4.9.5 Muss schreiben in

```ts
context.sensus_core_package
```

### 4.9.6 Darf nicht schreiben in

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
context.route_model
context.route_layer_model
context.layer_model
context.local_user_context
context.view_state
context.release
```

### 4.9.7 Pflicht-Output

```ts
SensusCorePackageState
```

Pflichtinhalte:

- Package-ID,
- Representation-ID,
- Paketversion,
- öffentliche Layer,
- öffentliche Route Options,
- erlaubte lokale Regler,
- öffentliche Warnungen,
- Parameter- und Regelversionen,
- Reduktionssummary,
- ausgeschlossene Inhalte,
- Validierung,
- Status.

### 4.9.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn das Paket enthält:

- Rohsignale,
- Einzelsignale,
- Geräteinformationen,
- Device Counts,
- Debug-GeoJSON,
- Operatornotizen,
- operator-only Layer,
- abgelehnte POIs,
- pending POIs,
- nicht freigegebene Layer,
- nicht freigegebene Route Options,
- interne Score-Zwischenwerte, falls Reduktionsprofil sie verbietet,
- lokale Regler außerhalb Ziel-App UI oder System-Adjust.

### 4.9.9 Mindesttests

- Public-Layer-Filtertest,
- Route-Option-Filtertest,
- Debug-/Raw-Strip-Test,
- Operatordaten-Ausschlusstest,
- Allowed-Controls-Test,
- Reduktionsprofil-Test,
- Paketvalidierung-Test,
- Übergabetest an Panel 10.

---

## Panel 10: Sensus Core lokal

### 4.10.1 Austauschklasse

**B/C – UI und App-Adapter gut austauschbar; lokale Logik muss Paketgrenzen strikt einhalten.**

### 4.10.2 Erlaubte Austauschformen

- Ziel-App-Adapter,
- lokale Sensus-Core-View,
- Leaflet- oder native Kartenansicht,
- lokaler UI-Ersatz,
- Offline-Renderer,
- Mock-View für Tests.

### 4.10.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 10 konsumiert ein Sensus-Core-Paket und erzeugt daraus lokale User-Auswahl und lokale Ansicht.

Es darf:

- Paket für lokale Nutzung prüfen,
- lokale Präferenzen laden,
- lokale Auswahl normalisieren,
- lokale Toleranzen innerhalb erlaubter Grenzen anwenden,
- Route Options lokal filtern und sortieren,
- lokale Layeransicht komponieren,
- Warnungen filtern,
- View State erzeugen.

Es darf nicht:

- das Sensus-Core-Paket verändern,
- neue Layer hinzufügen,
- neue Route Options aus Engine-Daten erzeugen,
- Debug- oder Rohdaten reaktivieren,
- SCIM-Bewertung neu berechnen,
- System- oder Regio-Grenzen überschreiben.

### 4.10.4 Muss lesen aus

```ts
context.sensus_core_package
context.target_app_ui
context.system_adjust
```

### 4.10.5 Muss schreiben in

```ts
context.local_user_context
context.view_state
```

### 4.10.6 Darf nicht schreiben in

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
context.route_model
context.route_layer_model
context.layer_model
context.sensus_core_package
context.release
```

### 4.10.7 Pflicht-Output

```ts
SensusCoreLocalState
SensusCoreViewState
```

Pflichtinhalte:

- Paketreferenz,
- aktive lokale Routenauswahl,
- lokale Toleranzen,
- aktive Layer-Toggles,
- sichtbare Route Options,
- sichtbare Layer,
- sichtbare Warnungen,
- View-Zustand,
- Validierung,
- Status.

### 4.10.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- Paket fehlt,
- Paket ungültig ist,
- lokale Auswahl außerhalb erlaubter Regler liegt,
- lokale Toleranzen Paket- oder Systemgrenzen überschreiten,
- nicht freigegebene Routen sichtbar werden,
- nicht freigegebene Layer sichtbar werden,
- Debug- oder Rohdaten reaktiviert werden,
- lokale View SCIM-Ergebnisse fachlich neu berechnet.

### 4.10.9 Mindesttests

- Package-Guard-Test,
- Local-Control-Grenztest,
- Route-Filter-Test,
- Layer-Visibility-Test,
- Warning-Filter-Test,
- Kein-Debug-Reaktivierung-Test,
- View-State-Test,
- Übergabetest an Panel 11.

---

## Panel 11: Leaflet-Wirkungsprüfung

### 4.11.1 Austauschklasse

**B/C – Prüf-UI austauschbar; Trennung und Prüflogik müssen strikt erhalten bleiben.**

### 4.11.2 Erlaubte Austauschformen

- Leaflet-Prüfoberfläche,
- anderer Kartenadapter,
- Vergleichsdienst,
- Operator-Vorschau-Service,
- Sensus-Core-Vorschau-Service,
- automatisierter Wirkungsprüfer,
- Mock-Prüfung für Tests.

### 4.11.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 11 prüft die sichtbare Wirkung der vorhandenen SCIM-Ergebnisse. Es verändert die Ergebnisse nicht.

Es darf:

- Operator-Vorschau bauen,
- Sensus-Core-Vorschau bauen,
- Originalwege vergleichen,
- POIs und Radien prüfen,
- Routenwirkung prüfen,
- Fehlerliste erzeugen,
- Freigabebereitschaft für Panel 12 vorbereiten.

Es darf nicht:

- System-Adjust ändern,
- Regio-Content ändern,
- Paket verändern,
- lokale User-Auswahl verändern,
- Routen neu bewerten,
- Maskierung neu berechnen,
- Debugdaten in Sensus-Core-Vorschau übernehmen.

### 4.11.4 Muss lesen aus

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

### 4.11.5 Muss schreiben in

```ts
context.leaflet_effect_check
```

### 4.11.6 Darf nicht schreiben in

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
context.route_model
context.route_layer_model
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.release
```

### 4.11.7 Pflicht-Output

```ts
LeafletEffectCheckState
```

Pflichtinhalte:

- Operator Preview Status,
- Sensus-Core Preview Status,
- Originalwege-Vergleich,
- POI- und Radiusprüfung,
- Routenprüfung,
- Sensus-Core-Reduktionsprüfung,
- Issue List,
- Blocking Issue Count,
- Ready-for-Release-Flag,
- Validierung,
- Status.

### 4.11.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- Sensus-Core-Vorschau Debug- oder Operator-Daten enthält,
- Operator- und Sensus-Core-Vorschau Layer vermischen,
- sichtbare Layer nicht aus Paket oder View State stammen,
- sichtbare Routen nicht aus View State stammen,
- Originalwege-Vergleich blockierende Abweichungen zeigt,
- Fehlerliste blockierende Probleme verschweigt,
- Prüfung Ergebnisse verändert.

### 4.11.9 Mindesttests

- Operator-vs-Sensus-Trennungstest,
- Preview-Source-Test,
- Originalwege-Vergleichstest,
- POI-Radius-Test,
- Routenprüfung-Test,
- Issue-Collector-Test,
- Ready-for-Release-Test,
- Übergabetest an Panel 12.

---

## Panel 12: Freigabe und Export

### 4.12.1 Austauschklasse

**C/D – Exportadapter austauschbar; Freigabe- und Datenschutzlogik streng gebunden.**

### 4.12.2 Erlaubte Austauschformen

- Exportadapter,
- Manifest-Builder,
- Archivdienst,
- Sensus-Core-Release-Service,
- Prüfbericht-Generator,
- interner Debug-Archiv-Adapter,
- Testrelease-Builder.

### 4.12.3 Fachlicher Zweck, der erhalten bleiben muss

Panel 12 entscheidet, ob ein geprüfter SCIM-Zustand freigegeben, versioniert, exportiert und archiviert werden darf.

Es darf:

- Release Summary erzeugen,
- Validierungsstatus prüfen,
- Datenschutzstatus prüfen,
- Parameter- und Versionsstand sammeln,
- Sensus-Core-Freigabe erzeugen,
- Exportmanifest vorbereiten,
- öffentliche Exporte erzeugen,
- Operator-Archive getrennt erzeugen,
- Release Record sperren.

Es darf nicht:

- fachliche SCIM-Logik reparieren,
- Panel-11-Prüfung überschreiben,
- blockierende Fehler ignorieren,
- Paket fachlich verändern,
- lokale User-Auswahl verändern,
- Debug- oder Rohdaten in öffentliche Exporte übernehmen.

### 4.12.4 Muss lesen aus

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

### 4.12.5 Muss schreiben in

```ts
context.release
```

Optional:

```ts
context.status
```

### 4.12.6 Darf nicht schreiben in

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
context.route_model
context.route_layer_model
context.layer_model
context.sensus_core_package
context.local_user_context
context.view_state
context.leaflet_effect_check
```

### 4.12.7 Pflicht-Output

```ts
ReleaseExportState
```

Pflichtinhalte:

- Release-ID,
- Representation-ID,
- Release Mode,
- Source Refs,
- Release Summary,
- Validation Status,
- Privacy Status,
- Version State,
- Sensus-Core Release State,
- Export Manifest,
- Export Results,
- Issue List,
- Audit Log,
- Status.

### 4.12.8 Harte Austauschbedingungen

Ein Austauschpanel muss blockieren, wenn:

- Panel 11 nicht release-ready ist,
- blockierende Issues vorhanden sind,
- Sensus-Core-Reduktion ungültig ist,
- Pflichtsegmente fehlen,
- Paket ungültig ist,
- lokale View nicht zum Paket passt,
- öffentliche Exporte Roh-, Debug- oder Operator-Daten enthalten,
- Exportmanifest nicht freigegebene Inhalte enthält,
- Release Record nach Sperrung mutiert würde.

### 4.12.9 Mindesttests

- Release-Readiness-Test,
- Pflichtsegment-Test,
- Datenschutz-Sanitization-Test,
- Version-State-Test,
- Manifest-Test,
- Public-vs-Operator-Export-Trennungstest,
- Lock-Test,
- Audit-Log-Test.

---

# 5. Mindesttestpaket für jedes Austauschpanel

Jedes Austauschpanel muss mindestens folgende Testgruppen besitzen.

## 5.1 Schema-Tests

- Inputschema gültig,
- Outputschema gültig,
- Pflichtfelder vorhanden,
- Statuswerte gültig,
- Validierungsergebnis vollständig.

## 5.2 Kontextgrenzen-Tests

- liest nur erlaubte Kontextbereiche,
- schreibt nur erlaubte Kontextbereiche,
- verändert keine fremden Kontextbereiche,
- löscht keine bestehenden gültigen Fremdoutputs.

## 5.3 Datenschutztests

- keine Rohsignale,
- keine Device-IDs,
- keine Einzeltraces,
- keine Debugdaten in Sensus-Core-Kandidaten,
- keine Operatornotizen in öffentlichen Ausgaben,
- Mindestaggregation eingehalten.

## 5.4 Negativtests

- fehlender Pflichtinput,
- ungültige Version,
- ungültiger Status,
- Datenschutzverletzung,
- Freigabe fehlt,
- Werte außerhalb System-Adjust,
- falsche Representation-ID.

## 5.5 Übergabetests

- Paneloutput wird vom Folgepanel akzeptiert,
- Warnstatus wird korrekt weitergegeben,
- Invalidstatus blockiert korrekt,
- Fehlerliste bleibt nachvollziehbar,
- Versionsreferenzen bleiben erhalten.

---

# 6. Review-Fragen für ein geplantes Austauschpanel

Vor Zulassung eines Austauschpanels sollten folgende Fragen beantwortet werden.

1. Welche Austauschklasse hat das Panel?
2. Welche Originalaufgabe ersetzt es?
3. Welche Datenquelle oder Logik ändert sich?
4. Bleibt das Outputschema identisch?
5. Bleiben Statuswerte und ValidationResult identisch?
6. Welche Kontextbereiche werden gelesen?
7. Welche Kontextbereiche werden geschrieben?
8. Welche Kontextbereiche sind ausdrücklich gesperrt?
9. Welche Datenschutzgrenzen werden geprüft?
10. Welche System-Adjust-Grenzen werden geprüft?
11. Welche Freigaben sind Voraussetzung?
12. Welche Debug- oder Operator-Daten werden ausgeschlossen?
13. Welche Negativfälle blockieren?
14. Welche Tests beweisen Folgepanel-Kompatibilität?
15. Darf das Austauschpanel produktiv laufen oder nur als Mock/Simulation?

---

# 7. Empfehlung für die SCIM-Projektstruktur

Die Austauschpanel-Checkliste sollte als eigenes Architekturartefakt neben folgenden Dokumenten geführt werden:

1. Finale Panel- und Tab-Liste,
2. Panel-Zusammenbauplan,
3. Austauschpanel-Checkliste je Panel,
4. Sensus-Core Package Contract,
5. Simulation-Load Adapter Spec.

Damit entsteht eine klare Trennung:

- Die Panel- und Tab-Liste sagt, welche Panels existieren.
- Der Zusammenbauplan sagt, wie sie verbunden werden.
- Die Austauschpanel-Checkliste sagt, wann ein Panel ersetzt werden darf.
- Der Sensus-Core Package Contract sagt, was Ziel-Apps konsumieren dürfen.
- Die Simulation-Load Adapter Spec sagt, wie Load ohne echten Telco-Eingang getestet werden kann.

---

# 8. Kurzfazit

Die SCIM-Panels sind modular austauschbar, aber nicht beliebig ersetzbar.

Austauschbarkeit entsteht erst durch stabile Verträge:

- gleicher Zweck,
- gleiche Kontextgrenzen,
- gleicher Output,
- gleiche Datenschutzgrenzen,
- gleiche Validierungslogik,
- gleiche Übergabefähigkeit.

Besonders streng sind:

- Panel 6 bis 8 wegen Engine-Semantik,
- Panel 9 wegen Sensus-Core-Ausspielgrenze,
- Panel 12 wegen Freigabe und Export.

Besonders gut geeignet für Austausch, Mock und Simulation sind:

- Panel 1 bis 4 als Input- und Steuerpanels,
- insbesondere Panel 4 als Simulation-Telco-Einstieg.

Leitsatz:

> Ein Austauschpanel ist zulässig, wenn es die SCIM-Kette stabiler, testbarer oder integrierbarer macht, ohne fachliche Zuständigkeiten, Datenschutzgrenzen oder Sensus-Core-Ausspielregeln zu verschieben.
