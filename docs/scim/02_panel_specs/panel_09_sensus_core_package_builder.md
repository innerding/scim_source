# SCIM Panel 9 – Sensus-Core Package Builder

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor den konkreten Panel-Auftrag. Sie stellt sicher, dass Panel 9 nicht als einfacher Export-Button, Download-Dialog oder Layer-Kopie gebaut wird, sondern als verbindlicher Paketierungs- und Reduktionsbaustein zwischen SCIM-Engine und Sensus Core.

### 0.1 SCIM-Gesamtsystem

SCIM ist ein Gesamtsystem aus:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokaler Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 9 liegt nach der Routenbewertung und vor der lokalen Sensus-Core-Anwendung. Es nimmt bewertete, geprüfte und reduzierte Engine-Ergebnisse auf und erzeugt daraus ein endgerätetaugliches Sensus-Core-Paket.

Panel 9 berechnet keine neuen Aufenthalte, keine neue Bewegungsauslastung, keine neuen Routenabschnitte und keine lokale User-Auswahl. Es entscheidet, welche vorhandenen Ergebnisse in welcher reduzierten, datenschutzkonformen und ziel-app-gerechten Form an Sensus Core übergeben werden dürfen.

Leitsatz:

> Panel 9 ist die harte Ausspielgrenze zwischen technischer SCIM-Pipeline und endgerätetauglicher Sensus-Core-Nutzung.

---

### 0.2 Rollenklärung

**SCIM-Engine**  
Der rechnerische Kern. Die Engine hat bis Panel 8 Graph, POIs, Load-Projektionen, Aufenthalte, Bewegung, Maskierung, Routenabschnitte, Routenoptionen und Routenlayer berechnet.

**Leaflet**  
Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug. In Panel 9 kann Leaflet höchstens als Vorschau genutzt werden, um zu prüfen, ob die paketierten öffentlichen Layer mit den zuvor berechneten Kandidaten übereinstimmen. Leaflet erzeugt nicht das Paket und entscheidet nicht über Datenschutz.

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät beziehungsweise in der laufzeitnahen App-Representation. Sensus Core darf nur ein freigegebenes, reduziertes, datenschutzkonformes und ziel-app-gerechtes Paket erhalten.

**Sensus-Core Package Builder**  
Panel 9 baut genau dieses Paket. Es übernimmt keine Operator-, Debug- oder Rohdaten und gibt nur solche Layer, Routenvorschläge, Warnungen, Parameterstände und lokalen Regler weiter, die durch System-Adjust, Regio-Content und Ziel-App UI freigegeben sind.

---

### 0.3 Aktuelle Panel-Zählung

In der aktuellen finalen 12-Panel-Struktur ist dieses Panel:

```txt
Panel 9: Sensus-Core Package Builder
```

In älteren Bauplan-Notizen wurde derselbe fachliche Baustein noch als:

```txt
Panel 14: Sensus-Core Package Builder
```

geführt. Für das Coding gilt ab jetzt die aktuelle Nummerierung:

```txt
Panel 9 = Sensus-Core Package Builder
```

---

### 0.4 Gemeinsamer SCIM-Kontext

Alle Panels arbeiten auf einem gemeinsamen SCIM-Kontext. Jedes Panel darf nur seine eigenen Kontextbereiche verändern.

Grundstruktur:

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
  leaflet_route_check?: LeafletRouteCheckState;
  layer_model?: LayerModelState;
  sensus_core_package?: SensusCorePackageState;
  local_user_context?: unknown;
  view_state?: unknown;
  release?: unknown;
  status?: ScimGlobalStatus;
}
```

Panel 9 darf schreiben in:

```ts
context.sensus_core_package
```

Optional darf Panel 9 einen eigenen Paketprüfstatus ergänzen, falls dieser nicht direkt im Package-State geführt wird:

```ts
context.package_validation
```

Empfohlen ist aber, die Paketvalidierung innerhalb von `SensusCorePackageState.validation` zu halten.

Panel 9 darf lesen aus:

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

Panel 9 darf nicht schreiben in:

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

---

### 0.5 Input-/Output-Prinzip

Jedes Panel braucht:

- klares Input-Schema,
- klares Output-Schema,
- Statusfeld,
- Fehlerliste,
- Warnliste,
- Validierungsfunktion,
- Mock-Daten,
- Tests,
- Übergabe an das nächste Panel.

Panel 9 ist besonders wichtig, weil es entscheidet, was das Endgerät überhaupt sehen und lokal bedienen darf. Wenn dieses Panel zu weich gebaut wird, können Rohdaten, Debugwerte, Operatornotizen, nicht freigegebene Layer oder zu technische Bewertungsdetails in Sensus Core landen.

---

### 0.6 Datenschutzgrenze

Panel 9 darf keine Datenschutzgrenzen aufweichen. Es ist die letzte technische Sperre vor Sensus Core.

Nicht erlaubt in `sensus_core_package`:

- Rohsignale,
- Einzelsignale,
- einzelne Geräte,
- Device Counts,
- individuelle Bewegungswege,
- individuelle Aufenthaltsdauer,
- exakte Signalgruppen,
- exakte interne Debugscores, wenn das Reduktionsprofil dies verbietet,
- Operatornotizen,
- Debug-GeoJSON,
- operator-only Layer,
- abgelehnte POI-Kandidaten,
- nicht freigegebene Regio-Content-Entwürfe,
- nicht freigegebene Ziel-App-Profile,
- nicht freigegebene Routenoptionen,
- Roh- oder Debug-Attribute in GeoJSON-Properties.

Panel 9 muss alle Daten, die aus Panel 8, Layer Composer oder Debug-Kontexten kommen, aktiv filtern. Es darf nicht darauf vertrauen, dass vorgelagerte Panels bereits alles entfernt haben.

Leitsatz:

> Alles, was nicht ausdrücklich Sensus-Core-geeignet ist, bleibt außerhalb des Pakets.

---

### 0.7 System-Adjust-Vorrang

Panel 9 ist abhängig von `context.system_adjust`.

Ohne gültigen System-Adjust-Stand darf kein runtime-gültiges Sensus-Core-Paket entstehen.

System-Adjust begrenzt für Panel 9 insbesondere:

- Datenschutzgrenzen,
- Mindestaggregation,
- Rohdaten- und Debug-Ausschluss,
- zulässige Layerklassen,
- erlaubte User-Toleranzbereiche,
- erlaubte Routenschwellen,
- zulässige lokale Regler,
- zulässige Reduktionsmodi,
- Speicher- und Exportgrenzen,
- Feature Flags für Sensus-Core-Ausgabe.

Panel 9 darf keine lokalen Regler, Route Options oder Layer übernehmen, die System-Adjust-Grenzen unterschreiten oder überschreiten.

---

### 0.8 Ziel-App-UI-Abhängigkeit

Panel 9 ist direkt abhängig von `context.target_app_ui`.

Der Ziel-App UI Input ist der Ausspielvertrag für Panel 9. Er legt fest:

- welche Layer sichtbar sein dürfen,
- welche Routentypen angeboten werden dürfen,
- welche lokalen User-Regler erlaubt sind,
- welche Warnungen und Hinweise ausgespielt werden dürfen,
- welche Datenklassen verboten sind,
- wie Scores, Geometrien, IDs und technische Attribute reduziert werden müssen.

Ohne gültigen und freigegebenen Ziel-App UI Input darf Panel 9 kein produktives Paket bauen. Ein Mock-Paket ist nur als Test- oder Draft-Paket zulässig.

---

### 0.9 Regio-Content-Abhängigkeit

Panel 9 nutzt `context.regio_content` für:

- freigegebene POIs,
- freigegebene regionale Parameterstände,
- regionale Sperren und Hinweise,
- regionale Routenprofile,
- regionale Freigabestatus,
- Parameter- und Versionsbindung.

Panel 9 darf keine Regio-Content-Entwürfe in Sensus Core übernehmen. Es darf auch keine abgelehnten oder pending POIs als sichtbare User-Information ausspielen, außer es gibt später einen expliziten, freigegebenen Hinweis-Layer dafür.

---

### 0.10 Abhängigkeit von Panel 8

Panel 9 ist direkter Abnehmer von Panel 8.

Erforderlich sind:

- gültiges `route_model`,
- gültige oder warnungsfreie `route_options`,
- Sensus-Core-geeignete Route-Kandidaten,
- getrennte Operator-, Debug- und Sensus-Core-Kandidatenlayer,
- nachvollziehbare Warnungen und Statuswerte,
- keine privacy-blocked Bewertungsgrundlagen,
- keine Debug-only Route Options.

Panel 8 liefert noch kein finales Paket. Panel 9 entscheidet erst, welche dieser Ergebnisse tatsächlich in ein Sensus-Core-Paket gelangen.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**Sensus-Core Package Builder**

Technischer Modulname:

```ts
SensusCorePackageBuilderPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
buildSensusCorePackage()
validateSensusCorePackageInputs()
filterPublicLayers()
filterPublicRouteOptions()
prepareAllowedLocalControls()
reducePackageWarnings()
stripRawAndDebugData()
validateSensusCorePackage()
applySensusCorePackageToContext()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/sensus-core-package/
  SensusCorePackageBuilderPanel.tsx
  sensusCorePackage.types.ts
  sensusCorePackage.schema.ts
  sensusCorePackage.defaults.ts
  sensusCorePackage.mock.ts
  sensusCorePackage.validation.ts
  sensusCorePackage.builder.ts
  sensusCorePackage.layerFilter.ts
  sensusCorePackage.routeFilter.ts
  sensusCorePackage.controlMapper.ts
  sensusCorePackage.reduction.ts
  sensusCorePackage.context.ts
  sensusCorePackage.test.ts
```

---

# 2. Zweck des Panels

Panel 9 erzeugt aus bewerteten Routen, reduzierten Layern, Ziel-App UI Profil, Datenschutzgrenzen und freigegebenen Parameterständen ein Sensus-Core-Paket.

Es beantwortet für spätere Panels:

- Welche öffentlichen Layer darf Sensus Core erhalten?
- Welche Routenvorschläge sind für Sensus Core geeignet?
- Welche Warnungen dürfen nutzergeeignet angezeigt werden?
- Welche lokalen Regler darf der Endnutzer bedienen?
- Welche Parameterstände gelten für das Paket?
- Welche Debug-, Roh- und Operator-Daten wurden ausgeschlossen?
- Ist das Paket gültig, versioniert und bereit für lokale Anwendung?

Leitsatz:

> Panel 9 erzeugt nicht mehr fachliche SCIM-Erkenntnis, sondern eine sichere, reduzierte und nutzbare Sensus-Core-Übergabe.

---

# 3. Nicht-Ziele

Panel 9 darf nicht:

- System-Adjust-Grenzen ändern,
- Regio-Content ändern,
- Ziel-App-UI-Profile ändern,
- Telco-Load-Batches ändern,
- Boundary oder Extraktion ändern,
- Graphen bauen,
- POIs freigeben,
- Aufenthalte klassifizieren,
- Bewegungsauslastung berechnen,
- Maskierungen berechnen,
- Routenabschnitte neu bewerten,
- neue Routenvorschläge fachlich berechnen,
- lokale User-Auswahl anwenden,
- finale Freigabe oder Export durchführen.

Panel 9 ist ein Paketierungs-, Reduktions- und Validierungspanel. Lokale Anwendung folgt in Panel 10. Freigabe und Export folgen später.

---

# 4. Fachliche Verantwortung

Panel 9 hat sechs fachliche Kernaufgaben.

## 4.1 Paketinhalt bestimmen

Panel 9 sammelt die paketfähigen Ergebnisse aus vorgelagerten Panels:

- Representation-ID,
- gültiger System-Adjust-Stand,
- gültiger Ziel-App UI Stand,
- gültiger Regio-Content-Stand,
- reduzierte Basislayer,
- Sensus-Core-Kandidaten aus Route Layer Model,
- route options aus Route Model,
- erlaubte Warnungen,
- erlaubte lokale User-Regler,
- gültige Parameter- und Regelversionen.

Alles wird in einen neuen Paketstand überführt.

## 4.2 Öffentliche Layer filtern

Panel 9 filtert alle Layer nach Ziel-App-UI, Datenschutz und Layerklasse.

Übernommen werden dürfen nur Layer mit einer zulässigen Datenklasse, zum Beispiel:

- reduzierte Bewegungslast,
- freigegebene POIs,
- reduzierte Aufenthaltsbereiche,
- Routenvorschläge,
- reduzierte Warnhinweise,
- regionale Hinweise, falls freigegeben,
- reduzierte Staustellenhinweise, falls freigegeben.

Nicht übernommen werden dürfen:

- operator-only Layer,
- debug-only Layer,
- raw signal Layer,
- graph debug Layer,
- interne Prüf-Layer,
- abgelehnte POI-Kandidaten,
- Layer mit Device Counts,
- Layer mit exakten Signalgruppen,
- Layer mit internen Bewertungsdetails, wenn das Reduktionsprofil dies verbietet.

## 4.3 Routenvorschläge reduzieren

Panel 9 übernimmt nur Routenvorschläge, die:

- in `route_model.route_options` enthalten sind,
- `sensus_core_candidate = true` besitzen,
- nicht `debug_only = true` sind,
- nicht blockierend invalidiert wurden,
- zu einem erlaubten Routentyp aus `target_app_ui.available_route_modes` passen,
- keine verbotenen Detailwerte enthalten,
- Warnungen nur in Sensus-Core-geeigneter Form enthalten.

Routenoptionen dürfen klassische Metriken wie Länge, Dauer oder Höhenprofil enthalten, sofern diese freigegeben sind. SCIM-interne Detailmetriken müssen reduziert werden, zum Beispiel von exakten Scores auf Klassen.

## 4.4 Erlaubte lokale Regler vorbereiten

Panel 9 übernimmt lokale Regler aus `target_app_ui.allowed_user_controls` und bildet daraus `package.allowed_local_controls`.

Dabei gilt:

- lokale Regler dürfen nur lokal wirken,
- lokale Regler dürfen keine System- oder Regio-Parameter ändern,
- lokale Regler dürfen keine Debug- oder Rohdaten aktivieren,
- lokale Regler dürfen keine nicht freigegebenen Routentypen aktivieren,
- lokale Toleranzen müssen innerhalb System-Adjust liegen,
- lokale Toleranzen dürfen regionale Grenzen nicht unterschreiten.

## 4.5 Debug- und Rohdaten entfernen

Panel 9 führt eine harte Sanitization aus.

Entfernt werden mindestens:

- `raw_signals`,
- `signal_group_id`, falls nicht ausdrücklich als abstrakte technische Referenz erlaubt,
- `device_count`,
- `distinct_device_count`,
- `debug_*`,
- `operator_note`,
- interne Prüffelder,
- interne Score-Zwischenwerte,
- private IDs,
- nicht freigegebene Quellenangaben,
- exakte Koordinaten, falls Rundung oder Vereinfachung aktiv ist.

Die Sanitization muss rekursiv auf Layer-Features, Route Options, Warnungen und Paket-Metadaten angewendet werden.

## 4.6 Paket validieren

Panel 9 validiert das fertige Paket:

- alle Pflichtfelder vorhanden,
- Paketversion vorhanden,
- Representation-ID passt,
- System-Adjust gültig,
- Ziel-App UI gültig und freigegeben,
- Regio-Content gültig oder zulässig absent,
- öffentliche Layer enthalten keine verbotenen Datenklassen,
- Route Options sind erlaubt und reduziert,
- lokale Regler sind erlaubt und innerhalb Grenzen,
- Warnungen sind Sensus-Core-geeignet,
- Debug- und Rohdaten wurden entfernt,
- Paketstatus ist konsistent.

Nur wenn diese Prüfung erfolgreich ist, darf `status = 'sensus_core_package_ready'` gesetzt werden.

---

# 5. Datenmodell

## 5.1 SensusCorePackageState

```ts
export interface SensusCorePackageState {
  sensus_core_package_id: string;
  representation_id: string;
  package_version: string;
  package_kind: SensusCorePackageKind;
  created_at: string;
  source_refs: SensusCorePackageSourceRefs;
  parameter_versions: SensusCoreParameterVersions;
  public_layers: SensusCorePublicLayer[];
  route_options: SensusCoreRouteOption[];
  allowed_local_controls: SensusCoreLocalControl[];
  public_warnings: SensusCoreWarning[];
  reduction_summary: SensusCoreReductionSummary;
  excluded_content_summary: ExcludedContentSummary;
  package_summary: SensusCorePackageSummary;
  validation: SensusCorePackageValidationResult;
  status: SensusCorePackageStatus;
}
```

## 5.2 PackageKind

```ts
export type SensusCorePackageKind =
  | 'runtime_package'
  | 'preview_package'
  | 'draft_package'
  | 'test_mock_package';
```

Regeln:

```txt
runtime_package requires released target_app_ui
runtime_package requires valid system_adjust
runtime_package must not include debug data
runtime_package must not include raw data
preview_package may include operator preview references only if not exported to public Sensus Core
```

## 5.3 PackageStatus

```ts
export type SensusCorePackageStatus =
  | 'not_created'
  | 'building'
  | 'package_created_unvalidated'
  | 'validating'
  | 'sensus_core_package_ready'
  | 'sensus_core_package_warning'
  | 'sensus_core_package_invalid'
  | 'sensus_core_package_blocked'
  | 'sensus_core_package_error';
```

---

# 6. SourceRefs

## 6.1 Typ

```ts
export interface SensusCorePackageSourceRefs {
  system_adjust_version: string;
  regio_content_version?: string;
  target_app_ui_version: string;
  representation_id: string;
  boundary_id?: string;
  graph_id?: string;
  route_model_id?: string;
  route_layer_model_id?: string;
  layer_model_id?: string;
  leaflet_route_check_id?: string;
}
```

## 6.2 Regeln

```txt
system_adjust_version must exist
target_app_ui_version must exist
representation_id must exist
route_model_id should exist for route_options
route_layer_model_id should exist for route layers
source refs must match active context objects
```

Wenn `route_model_id` fehlt, darf Panel 9 nur ein Layer-only-Paket oder ein blockiertes Draft-Paket erzeugen.

---

# 7. ParameterVersions

## 7.1 Typ

```ts
export interface SensusCoreParameterVersions {
  parameter_version: string;
  system_rules: string;
  privacy_rules: string;
  aggregation_rules: string;
  route_evaluation_rules?: string;
  layer_reduction_rules: string;
  sensus_core_export_rules: string;
  target_app_profile_version: string;
  regional_parameter_version?: string;
}
```

## 7.2 Regeln

- Alle exportrelevanten Regelstände müssen versioniert sein.
- Die Paketversion muss reproduzierbar auf Regel- und Parameterstände zurückführbar sein.
- Lokale User-Auswahl darf später nur innerhalb dieser Paketversion wirken.

---

# 8. Öffentliche Layer

## 8.1 SensusCorePublicLayer

```ts
export interface SensusCorePublicLayer {
  layer_id: string;
  source_layer_id?: string;
  layer_type: SensusCoreLayerType;
  label: string;
  visibility: 'sensus_core_visible' | 'hidden_by_default';
  user_toggle_allowed: boolean;
  data_class: SensusCoreDataClass;
  geometry_format: 'geojson' | 'vector_tile_candidate' | 'internal_feature_collection';
  feature_collection: GeoJSONFeatureCollection;
  min_zoom?: number;
  max_zoom?: number;
  reduction_applied: boolean;
  reduction_profile_id: string;
  validation: SensusCoreLayerValidationResult;
  status: SensusCoreLayerStatus;
}
```

## 8.2 LayerType

```ts
export type SensusCoreLayerType =
  | 'base_paths_reduced'
  | 'movement_load_reduced'
  | 'stay_areas_reduced'
  | 'approved_pois_reduced'
  | 'route_options_reduced'
  | 'route_warnings_reduced'
  | 'regional_restrictions_reduced'
  | 'jam_indicators_reduced';
```

## 8.3 DataClass

```ts
export type SensusCoreDataClass =
  | 'public_aggregate'
  | 'reduced_scim_result'
  | 'public_route_result'
  | 'public_warning_result';
```

Nicht zulässig in Sensus-Core-Paket:

```ts
export type ForbiddenSensusCoreDataClass =
  | 'raw_signal'
  | 'debug'
  | 'operator_internal'
  | 'forbidden_for_sensus_core';
```

## 8.4 LayerStatus

```ts
export type SensusCoreLayerStatus =
  | 'layer_ready'
  | 'layer_warning'
  | 'layer_hidden'
  | 'layer_invalid'
  | 'layer_blocked';
```

## 8.5 Layer-Regeln

```txt
public layer must not contain raw signal properties
public layer must not contain debug properties
public layer must not contain operator notes
public layer must not contain device counts
public layer must not contain exact internal scores if reduction forbids exact scores
public layer features must use allowed data_class only
public layer must match target_app_ui.visible_layers
public layer must use reduction_profile
```

---

# 9. Feature-Sanitization

## 9.1 Verbotene Property Keys

```ts
export const forbiddenSensusCorePropertyKeys = [
  'raw_signal',
  'raw_signals',
  'signal_group_id',
  'signal_group_ids',
  'device_id',
  'device_ids',
  'device_count',
  'distinct_device_count',
  'exact_trace',
  'operator_note',
  'operator_notes',
  'debug',
  'debug_data',
  'debug_score',
  'internal_score',
  'internal_weight',
  'privacy_block_reason_internal'
] as const;
```

## 9.2 Erlaubte Feature Properties

```ts
export interface SensusCoreFeatureProperties {
  id?: string;
  label?: string;
  layer_type: SensusCoreLayerType;
  status?: string;
  class?: 'none' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  warning_type?: string;
  severity?: 'info' | 'warning' | 'critical';
  route_option_id?: string;
  route_mode_id?: string;
  message_key?: string;
  user_toggle_allowed?: boolean;
  source_reduced: true;
}
```

Regel:

> Öffentliche Feature Properties sollen nutzbar, aber nicht analytisch rückführbar sein. Interne Berechnungsdetails bleiben außerhalb des Pakets.

---

# 10. Routenvorschläge im Paket

## 10.1 SensusCoreRouteOption

```ts
export interface SensusCoreRouteOption {
  route_option_id: string;
  source_route_option_id: string;
  route_mode_id: string;
  label: string;
  geometry: GeoJsonLineStringOrMultiLineString;
  total_length_meters: number;
  estimated_duration_seconds?: number;
  classic_route_metrics?: PublicClassicRouteMetrics;
  scim_summary: PublicScimRouteSummary;
  status: SensusCoreRouteOptionStatus;
  warnings: SensusCoreWarning[];
  local_filter_eligible: boolean;
  local_sort_eligible: boolean;
}
```

## 10.2 PublicClassicRouteMetrics

```ts
export interface PublicClassicRouteMetrics {
  distance_meters?: number;
  duration_seconds?: number;
  elevation_gain_meters?: number;
  elevation_loss_meters?: number;
  difficulty_class?: string;
}
```

## 10.3 PublicScimRouteSummary

```ts
export interface PublicScimRouteSummary {
  load_class: 'none' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  stay_context_class: 'none' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  restriction_class: 'none' | 'warning' | 'degraded' | 'excluded' | 'unknown';
  jam_class?: 'none' | 'possible' | 'probable' | 'critical' | 'unknown';
  confidence_class: 'low' | 'medium' | 'high' | 'unknown';
  degraded_section_count?: number;
  warning_section_count?: number;
  excluded_section_count?: number;
}
```

## 10.4 Status

```ts
export type SensusCoreRouteOptionStatus =
  | 'recommended'
  | 'available'
  | 'available_with_warnings'
  | 'degraded'
  | 'fallback_only'
  | 'not_available'
  | 'not_enough_data';
```

## 10.5 Routenregeln

```txt
route option must match an enabled target_app_ui route mode
route option must not be debug_only
route option must be sensus_core_candidate
excluded route options must not be offered as normal available route
fallback_only route options may be offered only if target_app_ui allows fallback
exact internal route scores must be reduced to classes unless allowed
route warnings must be sensus_core_eligible
```

---

# 11. Erlaubte lokale Regler

## 11.1 SensusCoreLocalControl

```ts
export interface SensusCoreLocalControl {
  control_id: string;
  source_control_id: string;
  control_type: SensusCoreLocalControlType;
  label: string;
  enabled: boolean;
  default_value: number | string | boolean;
  min_value?: number;
  max_value?: number;
  step?: number;
  unit?: string;
  affects: SensusCoreLocalControlEffect[];
  local_only: true;
  system_range_key?: string;
  validation: SensusCoreLocalControlValidationResult;
}
```

## 11.2 ControlType

```ts
export type SensusCoreLocalControlType =
  | 'route_mode_select'
  | 'movement_tolerance_slider'
  | 'stay_tolerance_slider'
  | 'display_intensity_slider'
  | 'warnings_toggle'
  | 'layer_toggle'
  | 'fallback_routes_toggle';
```

## 11.3 ControlEffect

```ts
export type SensusCoreLocalControlEffect =
  | 'route_filtering'
  | 'route_sorting'
  | 'map_visibility'
  | 'warning_visibility'
  | 'display_intensity'
  | 'none';
```

## 11.4 Regler-Regeln

```txt
local control must originate from target_app_ui.allowed_user_controls
local control must be local_only true
local control must not write system_adjust
local control must not write regio_content
local control must not enable debug layers
local control must not enable raw layers
local control range must be inside System-Adjust allowed range
local control default value must be inside its min/max range
```

---

# 12. Warnungen und Hinweise

## 12.1 SensusCoreWarning

```ts
export interface SensusCoreWarning {
  warning_id: string;
  source_warning_id?: string;
  warning_type: SensusCoreWarningType;
  severity: 'info' | 'warning' | 'critical';
  message_key: string;
  related_route_option_ids?: string[];
  related_layer_ids?: string[];
  display_mode: 'inline_route_hint' | 'map_badge' | 'modal' | 'toast' | 'hidden';
  user_dismissible: boolean;
  reduced: true;
}
```

## 12.2 WarningType

```ts
export type SensusCoreWarningType =
  | 'high_movement_load'
  | 'high_stay_density'
  | 'degraded_route_section'
  | 'excluded_route_section'
  | 'regional_restriction'
  | 'no_low_load_alternative'
  | 'data_quality_low'
  | 'stale_data'
  | 'privacy_reduction_active'
  | 'package_reduction_active';
```

## 12.3 Warnregeln

```txt
warning must have message_key
warning must not expose raw values
warning must not expose device counts
warning must not expose operator notes
warning source must be eligible for Sensus Core
operator_only warning must be excluded or mapped to a public warning
privacy reduction may be visible as explanation but not as internal threshold disclosure
```

---

# 13. ReductionSummary

## 13.1 Typ

```ts
export interface SensusCoreReductionSummary {
  reduction_profile_id: string;
  raw_signals_removed: true;
  debug_data_removed: true;
  operator_notes_removed: boolean;
  internal_ids_removed: boolean;
  exact_scores_reduced: boolean;
  score_classes_used: boolean;
  coordinates_rounded: boolean;
  geometries_simplified: boolean;
  hidden_device_counts: true;
  hidden_signal_counts: boolean;
  public_data_classes: SensusCoreDataClass[];
}
```

## 13.2 Regeln

```txt
raw_signals_removed must be true
debug_data_removed must be true
hidden_device_counts must be true
public_data_classes must not include forbidden classes
```

---

# 14. ExcludedContentSummary

## 14.1 Typ

```ts
export interface ExcludedContentSummary {
  excluded_layer_count: number;
  excluded_route_option_count: number;
  excluded_warning_count: number;
  excluded_control_count: number;
  excluded_debug_feature_count: number;
  excluded_raw_feature_count: number;
  excluded_operator_internal_count: number;
  reasons: ExcludedContentReason[];
}
```

## 14.2 Reason

```ts
export interface ExcludedContentReason {
  code: ExcludedContentReasonCode;
  count: number;
  blocking: boolean;
  message: string;
}

export type ExcludedContentReasonCode =
  | 'RAW_DATA_REMOVED'
  | 'DEBUG_DATA_REMOVED'
  | 'OPERATOR_INTERNAL_REMOVED'
  | 'TARGET_APP_VISIBILITY_BLOCKED'
  | 'ROUTE_OPTION_NOT_ALLOWED'
  | 'LOCAL_CONTROL_OUT_OF_RANGE'
  | 'WARNING_NOT_PUBLIC_ELIGIBLE'
  | 'REGIO_CONTENT_NOT_RELEASED'
  | 'SYSTEM_ADJUST_INVALID'
  | 'TARGET_APP_UI_NOT_RELEASED';
```

---

# 15. PackageSummary

```ts
export interface SensusCorePackageSummary {
  public_layer_count: number;
  route_option_count: number;
  allowed_local_control_count: number;
  public_warning_count: number;
  has_recommended_route: boolean;
  has_low_load_route: boolean;
  has_fallback_route: boolean;
  package_ready_for_local_use: boolean;
  warning_count: number;
  error_count: number;
}
```

---

# 16. Validierung

## 16.1 ValidationResult

```ts
export interface SensusCorePackageValidationResult {
  is_valid: boolean;
  checked_at: string;
  checked_against_system_adjust_version: string;
  checked_against_target_app_ui_version: string;
  checked_against_regio_content_version?: string;
  errors: SensusCorePackageIssue[];
  warnings: SensusCorePackageIssue[];
}
```

## 16.2 Issue

```ts
export interface SensusCorePackageIssue {
  code: SensusCorePackageIssueCode;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}
```

## 16.3 IssueCode

```ts
export type SensusCorePackageIssueCode =
  | 'MISSING_SYSTEM_ADJUST'
  | 'INVALID_SYSTEM_ADJUST'
  | 'MISSING_TARGET_APP_UI'
  | 'TARGET_APP_UI_NOT_RELEASED'
  | 'MISSING_ROUTE_MODEL'
  | 'MISSING_LAYER_INPUT'
  | 'FORBIDDEN_RAW_DATA_FOUND'
  | 'FORBIDDEN_DEBUG_DATA_FOUND'
  | 'FORBIDDEN_OPERATOR_DATA_FOUND'
  | 'DEVICE_COUNT_FOUND'
  | 'SIGNAL_COUNT_NOT_REDUCED'
  | 'INTERNAL_SCORE_FOUND'
  | 'LOCAL_CONTROL_OUT_OF_RANGE'
  | 'ROUTE_OPTION_NOT_ALLOWED'
  | 'WARNING_NOT_SENSUS_CORE_ELIGIBLE'
  | 'PUBLIC_LAYER_INVALID'
  | 'PACKAGE_EMPTY'
  | 'PACKAGE_VERSION_MISSING'
  | 'SOURCE_REF_MISMATCH';
```

## 16.4 Blockierende Validierungsregeln

```txt
missing system_adjust blocks package
invalid system_adjust blocks package
missing target_app_ui blocks package
target_app_ui not released blocks runtime_package
forbidden raw data blocks package
forbidden debug data blocks package
forbidden operator data blocks package
device count in public output blocks package
local control outside system range blocks package
route option with disallowed route mode blocks package
package without public layers and route options blocks runtime_package unless explicitly layerless mode is allowed
```

## 16.5 Warnende Validierungsregeln

```txt
no recommended route creates warning
no low-load route creates warning if low_load mode enabled
route options partially degraded creates warning
warnings reduced due privacy creates warning
layer hidden by default creates info warning
regio_content absent creates warning if target_app_ui requires regio release
leaflet route check absent creates warning, unless package kind is test_mock_package
```

---

# 17. UI-Struktur

Panel 9 besteht aus sechs Tabs:

1. **Paketinhalt**
2. **Öffentliche Layer**
3. **Routenvorschläge**
4. **Erlaubte lokale Regler**
5. **Debug- und Rohdaten-Ausschluss**
6. **Paketvalidierung**

---

## 17.1 Tab 1 – Paketinhalt

Zweck:

- Paketversion und Quellen prüfen,
- aktive Representation anzeigen,
- System-, Regio- und Ziel-App-Versionen anzeigen,
- Pakettyp wählen oder anzeigen,
- Paketinhalt zusammenfassen.

Anzeigen:

- `sensus_core_package_id`,
- `representation_id`,
- `package_version`,
- Pakettyp,
- System-Adjust-Version,
- Target-App-UI-Version,
- Regio-Content-Version,
- Route-Model-ID,
- Layer-Model-ID,
- Anzahl öffentlicher Layer,
- Anzahl Routenvorschläge,
- Anzahl lokaler Regler,
- Anzahl öffentlicher Warnungen.

Aktionen:

- Paket bauen,
- Paketinhalt neu laden,
- Source-Refs prüfen,
- Paketentwurf verwerfen.

---

## 17.2 Tab 2 – Öffentliche Layer

Zweck:

- öffentliche Layer aus Layer- und Route-Layer-Kandidaten filtern,
- Layer gegen Ziel-App UI prüfen,
- verbotene Datenklassen entfernen,
- Reduktionsprofil anwenden.

Anzeigen:

- Layer-ID,
- Layer-Typ,
- Sichtbarkeit,
- Toggle erlaubt,
- Feature Count,
- Reduktionsstatus,
- Datenklasse,
- Validierungsstatus,
- Ausschlussgrund bei nicht übernommenen Layern.

Aktionen:

- öffentliche Layer filtern,
- Layer validieren,
- Sanitization-Bericht anzeigen,
- Sensus-Core-Vorschau anzeigen.

---

## 17.3 Tab 3 – Routenvorschläge

Zweck:

- Route Options aus Panel 8 übernehmen,
- nur Sensus-Core-Kandidaten weitergeben,
- Routenvorschläge auf erlaubte Routentypen reduzieren,
- Warnungen und Scores nutzergeeignet reduzieren.

Anzeigen:

- Route Option ID,
- Routentyp,
- Label,
- Länge,
- Dauer,
- Load-Klasse,
- Stay-Kontext-Klasse,
- Restriktionsklasse,
- Status,
- Warnungen,
- local filter/sort eligibility,
- Ausschlussgrund.

Aktionen:

- Routenvorschläge filtern,
- Routenvorschläge validieren,
- reduzierte Route Options anzeigen,
- Route-Option-Vorschau öffnen.

---

## 17.4 Tab 4 – Erlaubte lokale Regler

Zweck:

- erlaubte lokale User-Regler aus Ziel-App UI übernehmen,
- Wertebereiche gegen System-Adjust prüfen,
- lokale Wirkung dokumentieren,
- Debug-/Rohdaten-Schalter ausschließen.

Anzeigen:

- Control ID,
- Control Type,
- Label,
- Default Value,
- Min/Max/Step,
- Einheit,
- Wirkung,
- System Range Key,
- Validierungsstatus.

Aktionen:

- lokale Regler vorbereiten,
- Regler gegen System-Adjust prüfen,
- ungültige Regler blockieren,
- lokale Vorschauwerte simulieren, ohne Kontext zu verändern.

Wichtig:

> Panel 9 bereitet lokale Regler nur vor. Es wendet keine lokale User-Auswahl an. Das erfolgt in Panel 10.

---

## 17.5 Tab 5 – Debug- und Rohdaten-Ausschluss

Zweck:

- harte Datenschutz- und Reduktionsprüfung durchführen,
- verbotene Datenklassen erkennen,
- ausgeschlossene Inhalte dokumentieren,
- Sanitization-Ergebnis sichtbar machen.

Anzeigen:

- entfernte Rohdatenfelder,
- entfernte Debugfelder,
- entfernte Operatorfelder,
- ausgeschlossene Layer,
- ausgeschlossene Route Options,
- ausgeschlossene Warnungen,
- gefundene blockierende Datenschutzverletzungen,
- Reduktionsprofil.

Aktionen:

- Sanitization ausführen,
- verbotene Properties suchen,
- Ausschlussbericht erzeugen,
- Paket bei Verstoß blockieren.

---

## 17.6 Tab 6 – Paketvalidierung

Zweck:

- finales Paket validieren,
- blockierende Fehler und Warnungen anzeigen,
- Paketstatus setzen,
- Übergabe an Panel 10 vorbereiten.

Anzeigen:

- Validierungsstatus,
- Fehlerliste,
- Warnliste,
- Paketbereitschaft,
- Package Summary,
- Source Ref Check,
- Datenschutzstatus,
- Ziel-App-UI-Kompatibilität.

Aktionen:

- Paket validieren,
- Paket in Kontext schreiben,
- Paket als ready markieren,
- Validierungsbericht exportieren.

---

# 18. Mock-Daten

## 18.1 Mock Package

```ts
export const mockSensusCorePackage: SensusCorePackageState = {
  sensus_core_package_id: 'scp_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  package_version: 'scp_v1.0.0',
  package_kind: 'runtime_package',
  created_at: '2026-05-21T00:00:00.000Z',
  source_refs: {
    system_adjust_version: 'sys_v1.0.0',
    regio_content_version: 'regio_v1.0.0',
    target_app_ui_version: 'target_ui_v1.0.0',
    representation_id: 'rep_hochwab_nord_001',
    route_model_id: 'route_model_hochwab_nord_001',
    route_layer_model_id: 'route_layer_hochwab_nord_001'
  },
  parameter_versions: {
    parameter_version: 'param_v1.0.0',
    system_rules: 'system_rules_v1.0.0',
    privacy_rules: 'privacy_rules_v1.0.0',
    aggregation_rules: 'aggregation_rules_v1.0.0',
    route_evaluation_rules: 'route_eval_v1.0.0',
    layer_reduction_rules: 'layer_reduce_v1.0.0',
    sensus_core_export_rules: 'sensus_export_v1.0.0',
    target_app_profile_version: 'target_ui_v1.0.0',
    regional_parameter_version: 'regional_params_v1.0.0'
  },
  public_layers: [],
  route_options: [],
  allowed_local_controls: [],
  public_warnings: [],
  reduction_summary: {
    reduction_profile_id: 'reduction_public_default',
    raw_signals_removed: true,
    debug_data_removed: true,
    operator_notes_removed: true,
    internal_ids_removed: true,
    exact_scores_reduced: true,
    score_classes_used: true,
    coordinates_rounded: false,
    geometries_simplified: true,
    hidden_device_counts: true,
    hidden_signal_counts: true,
    public_data_classes: ['public_aggregate', 'reduced_scim_result', 'public_route_result']
  },
  excluded_content_summary: {
    excluded_layer_count: 0,
    excluded_route_option_count: 0,
    excluded_warning_count: 0,
    excluded_control_count: 0,
    excluded_debug_feature_count: 0,
    excluded_raw_feature_count: 0,
    excluded_operator_internal_count: 0,
    reasons: []
  },
  package_summary: {
    public_layer_count: 0,
    route_option_count: 0,
    allowed_local_control_count: 0,
    public_warning_count: 0,
    has_recommended_route: false,
    has_low_load_route: false,
    has_fallback_route: false,
    package_ready_for_local_use: false,
    warning_count: 0,
    error_count: 0
  },
  validation: {
    is_valid: true,
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_system_adjust_version: 'sys_v1.0.0',
    checked_against_target_app_ui_version: 'target_ui_v1.0.0',
    checked_against_regio_content_version: 'regio_v1.0.0',
    errors: [],
    warnings: []
  },
  status: 'sensus_core_package_ready'
};
```

---

# 19. Kontext-Apply-Funktion

## 19.1 applySensusCorePackageToContext

```ts
export function applySensusCorePackageToContext(
  context: ScimContext,
  packageState: SensusCorePackageState
): ScimContext {
  if (!packageState.validation.is_valid) {
    throw new Error('Cannot apply invalid Sensus-Core package to context.');
  }

  if (
    packageState.status !== 'sensus_core_package_ready' &&
    packageState.status !== 'sensus_core_package_warning'
  ) {
    throw new Error(`Cannot apply package with status ${packageState.status}.`);
  }

  return {
    ...context,
    sensus_core_package: packageState
  };
}
```

Regeln:

- Die Funktion darf nur `context.sensus_core_package` verändern.
- Alle anderen Kontextbereiche müssen unverändert bleiben.
- Ungültige Pakete dürfen nicht übernommen werden.
- Blockierte Pakete dürfen nicht übernommen werden.

---

# 20. Übergabe an Folgepanel

Panel 9 gibt folgendes Kontextsegment weiter:

```json
{
  "sensus_core_package": {
    "sensus_core_package_id": "scp_001",
    "representation_id": "rep_001",
    "package_version": "scp_v1.0.0",
    "public_layers": [],
    "route_options": [],
    "allowed_local_controls": [],
    "public_warnings": [],
    "parameter_versions": {},
    "reduction_summary": {},
    "status": "sensus_core_package_ready"
  }
}
```

## 20.1 Übergabe an Panel 10: Sensus Core lokal

Panel 10 darf nur mit dem freigegebenen Paket arbeiten.

Panel 10 nutzt:

- `public_layers`,
- `route_options`,
- `allowed_local_controls`,
- `public_warnings`,
- `parameter_versions`,
- `reduction_summary`.

Panel 10 darf nicht:

- neue Systemgrenzen setzen,
- neue regionale Parameter setzen,
- Debugdaten reaktivieren,
- Rohdaten anzeigen,
- lokale Regler außerhalb des Pakets hinzufügen.

---

# 21. Akzeptanzkriterien

## 21.1 Paketinhalt

- Panel 9 kann aus gültigen vorgelagerten Inputs ein `SensusCorePackageState` erzeugen.
- Das Paket enthält eine eindeutige `sensus_core_package_id`.
- Das Paket referenziert die aktive `representation_id`.
- Das Paket enthält nachvollziehbare SourceRefs.
- Das Paket enthält Parameter- und Regelversionen.
- Das Paket ist reproduzierbar aus seinen SourceRefs ableitbar.

## 21.2 Öffentliche Layer

- Nur Sensus-Core-geeignete Layer werden übernommen.
- Debug-Layer werden nicht übernommen.
- Operator-Layer werden nicht übernommen.
- Rohdaten-Layer werden nicht übernommen.
- Verbotene Datenklassen blockieren das Paket.
- Öffentliche Layer enthalten keine verbotenen Properties.
- Öffentliche Layer entsprechen `target_app_ui.visible_layers`.

## 21.3 Routenvorschläge

- Nur `sensus_core_candidate` Route Options werden übernommen.
- `debug_only` Route Options werden ausgeschlossen.
- Routenvorschläge passen zu erlaubten Route Modes.
- Interne Scores werden gemäß Reduktionsprofil reduziert.
- Warnungen sind Sensus-Core-geeignet.
- Excluded Routes werden nicht als normale verfügbare Route angeboten.
- Fallback Routes werden nur übernommen, wenn erlaubt.

## 21.4 Lokale Regler

- Lokale Regler stammen aus `target_app_ui.allowed_user_controls`.
- Lokale Regler sind `local_only`.
- Lokale Regler liegen innerhalb System-Adjust-Grenzen.
- Lokale Regler verändern keine System- oder Regio-Kontexte.
- Lokale Regler aktivieren keine Debug- oder Rohdatenansichten.

## 21.5 Debug- und Rohdaten-Ausschluss

- Rohsignale werden entfernt.
- Device Counts werden entfernt.
- Debugdaten werden entfernt.
- Operatornotizen werden entfernt, sofern nicht ausdrücklich als public-safe erlaubt.
- Interne Scores werden reduziert oder entfernt.
- Verbotene Properties werden rekursiv erkannt.
- Gefundene verbotene Daten blockieren das Paket.

## 21.6 Paketvalidierung

- Fehlender System-Adjust blockiert das Paket.
- Ungültiger System-Adjust blockiert das Paket.
- Fehlendes Ziel-App UI Profil blockiert das Paket.
- Nicht freigegebenes Ziel-App UI Profil blockiert ein Runtime-Paket.
- Ungültige lokale Regler blockieren das Paket.
- Verbotene Datenklassen blockieren das Paket.
- Ein gültiges Paket erhält `status = 'sensus_core_package_ready'`.

---

# 22. Testfälle

## 22.1 Gültiges Paket

**Given** gültiger System-Adjust, freigegebenes Ziel-App UI Profil, gültiges Route Model und reduzierte Sensus-Core-Kandidatenlayer.  
**When** Panel 9 das Paket baut.  
**Then** entsteht ein `sensus_core_package_ready` Paket ohne Roh-, Debug- oder Operator-Daten.

## 22.2 Fehlender System-Adjust

**Given** `context.system_adjust` fehlt.  
**When** Panel 9 validiert.  
**Then** entsteht ein blockierender Fehler `MISSING_SYSTEM_ADJUST`.

## 22.3 Ziel-App UI nicht freigegeben

**Given** `target_app_ui.release.release_status = 'draft'`.  
**When** ein Runtime-Paket gebaut wird.  
**Then** blockiert `TARGET_APP_UI_NOT_RELEASED`.

## 22.4 Debug Layer im Input

**Given** ein Layer enthält `data_class = 'debug'`.  
**When** öffentliche Layer gefiltert werden.  
**Then** wird der Layer ausgeschlossen; falls er trotzdem im Paket erscheint, blockiert `FORBIDDEN_DEBUG_DATA_FOUND`.

## 22.5 Rohsignal-Property in Feature

**Given** ein GeoJSON Feature enthält `device_count` oder `raw_signals`.  
**When** Sanitization läuft.  
**Then** wird das Feld entfernt oder das Paket blockiert, wenn Entfernung nicht sicher möglich ist.

## 22.6 Ungültiger lokaler Regler

**Given** ein lokaler Toleranzregler überschreitet System-Adjust `allowed_ranges`.  
**When** lokale Regler vorbereitet werden.  
**Then** wird der Regler ausgeschlossen oder blockiert mit `LOCAL_CONTROL_OUT_OF_RANGE`.

## 22.7 Route Mode nicht erlaubt

**Given** eine Route Option nutzt einen Routentyp, der in `target_app_ui.available_route_modes` nicht aktiv ist.  
**When** Routenvorschläge gefiltert werden.  
**Then** wird die Route Option ausgeschlossen.

## 22.8 Kein Routenvorschlag

**Given** keine Route Option ist Sensus-Core-geeignet.  
**When** Paketvalidierung läuft.  
**Then** entsteht mindestens eine Warnung; bei routenpflichtigem Ziel-App-Profil blockiert das Paket.

---

# 23. Umsetzungshinweise für Codex/Claude

- Baue Panel 9 als reines Paketierungs- und Validierungsmodul.
- Verwende keine neuen Berechnungen für Aufenthalt, Bewegung oder Routenbewertung.
- Implementiere Sanitization rekursiv für Layer, Feature Properties, Route Options und Warnungen.
- Behandle das Ziel-App UI Profil als Ausspielvertrag.
- Behandle System-Adjust als nicht unterschreitbare Grenze.
- Trenne `runtime_package`, `preview_package`, `draft_package` und `test_mock_package` sauber.
- Schreibe nur in `context.sensus_core_package`.
- Gib klare Fehlercodes zurück, statt UI-Text hart in Validatoren zu verdrahten.
- Verwende `message_key` für nutzerseitige Warnungen.
- Halte Debug- und Operatorinformationen vollständig außerhalb des Runtime-Pakets.

---

# 24. Kompakter Codex-Auftrag für Panel 9

```text
Baue Panel 9: Sensus-Core Package Builder für die SCIM.

Kontext:
SCIM ist ein Gesamtsystem aus Input-Schicht, SCIM-Engine, Layer-Erzeugung, Sensus-Core-Paketierung, lokaler User-Anwendung und Freigabe. Sensus Core ist die SCIM am Endgerät. Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug, nicht der Engine-Kern. Alle Panels arbeiten auf einem gemeinsamen SCIM-Kontext. Panel 9 darf nur `context.sensus_core_package` schreiben.

Aufgabe:
Baue nur Panel 9. Das Panel erzeugt aus Route Model, Route Layer Model, optional Layer Model, Ziel-App UI Input, System-Adjust und freigegebenen Parameterständen ein reduziertes, datenschutzkonformes Sensus-Core-Paket.

Zweck:
Öffentliche Layer filtern, Routenvorschläge reduzieren, erlaubte lokale Regler vorbereiten, Debug- und Rohdaten entfernen und Paketvalidierung durchführen.

Nicht-Ziele:
Keine Änderung von System-Adjust, Regio-Content, Ziel-App UI, Telco-Load, Boundary, Graph, POI-Modell, Load-Modell, Movement-Modell, Masking-Modell oder Route Model. Keine lokale User-Auswahl und keine finale Freigabe/Export.

Erzeuge:
- TypeScript-Typen
- Mock-Daten
- Validierungsfunktionen
- Sanitization-Funktionen
- Kontext-Apply-Funktion
- React-Panel mit Tabs
- Unit-Tests

Tabs:
1. Paketinhalt
2. Öffentliche Layer
3. Routenvorschläge
4. Erlaubte lokale Regler
5. Debug- und Rohdaten-Ausschluss
6. Paketvalidierung

Output:
`SensusCorePackageState` mit `sensus_core_package_id`, `representation_id`, `package_version`, `source_refs`, `parameter_versions`, `public_layers`, `route_options`, `allowed_local_controls`, `public_warnings`, `reduction_summary`, `excluded_content_summary`, `package_summary`, `validation`, `status`.

Validierung:
Blockiere fehlenden oder ungültigen System-Adjust, fehlendes oder nicht freigegebenes Ziel-App UI Profil, Rohdaten, Debugdaten, Operator-Daten, Device Counts, nicht reduzierte Signalwerte, lokale Regler außerhalb System-Adjust, unerlaubte Route Modes und nicht Sensus-Core-geeignete Warnungen.

Akzeptanzkriterien:
Ein gültiger Mock kann geladen, gefiltert, reduziert, validiert und in `context.sensus_core_package` übernommen werden. Ein ungültiges Paket wird blockiert. Die Übergabe verändert keine anderen Kontextbereiche.
```

---

# 25. Kernaussage für Panel 9

Panel 9 ist kein Exportformular. Es ist die verbindliche Datenschutz-, Reduktions- und Paketierungsgrenze vor Sensus Core.

Wenn Panel 9 zu weich gebaut wird, können technische SCIM-Details am Endgerät sichtbar werden: Rohsignale, Debugdaten, interne Scores, Operatornotizen, nicht freigegebene Layer oder lokale Regler außerhalb der Systemgrenzen.

Deshalb muss Panel 9 hart validieren, rekursiv bereinigen und nur explizit Sensus-Core-geeignete Inhalte in `context.sensus_core_package` schreiben.
