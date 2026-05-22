# SCIM Panel 4 – Telco-Load Input

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor jeden konkreten Panel-Auftrag. Sie stellt sicher, dass Panel 4 nicht als isolierter Datenimport gebaut wird, sondern als verbindlicher Load-Input- und Datenschutzbaustein der gesamten SCIM-Kette.

### 0.1 SCIM-Gesamtsystem

SCIM ist ein Gesamtsystem aus:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokaler Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 4 liegt in der Input- und Steuerungsschicht. Es erzeugt keine Routen, keine Aufenthaltsbereiche, keine Bewegungskanten, keine Layer und keine Sensus-Core-Ausgabe. Es lädt, normalisiert und validiert aggregierte Telco-Load- beziehungsweise Runtime-Load-Daten, bevor diese in spätere Engine-Panels einfließen dürfen.

### 0.2 Rollenklärung

**SCIM-Engine**  
Der rechnerische Kern. Sie verarbeitet später Boundary, Regio-Content, Telco-Load, Graph, POIs, Aufenthalte, Bewegung, Maskierung und Routenbewertung.

**Leaflet**  
Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug. Leaflet ist nicht die Engine. Für Panel 4 ist Leaflet nur indirekt relevant, weil spätere Prüfpanels Load-Projektionen, Aufenthaltsbereiche, Bewegungsauslastungen und Routenwirkungen visuell kontrollieren können.

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät beziehungsweise in der laufzeitnahen App-Representation. Sensus Core darf keine Rohsignale, Einzelsignale, einzelnen Geräte, Debug-Rohwerte oder nicht ausreichend aggregierte Load-Informationen erhalten.

**Telco-Load Input**  
Panel 4 definiert den validierten Load-Eingang für die SCIM. Es legt fest:

- welcher Load-Batch verwendet wird,
- welches Zeitfenster gilt,
- welche Signalqualität vorliegt,
- welches Aggregationsniveau erreicht wurde,
- welche Gültigkeits- und Verfallsregeln gelten,
- ob Datenschutz- und Mindestaggregationsgrenzen erfüllt sind,
- welche Signalgruppen später überhaupt in Aufenthalts-, Bewegungs- oder Staustellenlogik eingehen dürfen.

### 0.3 Gemeinsamer SCIM-Kontext

Alle Panels arbeiten auf einem gemeinsamen SCIM-Kontext. Jedes Panel darf nur seinen eigenen Bereich verändern.

Grundstruktur:

```ts
export interface ScimContext {
  representation_id?: string;
  system_adjust?: SystemAdjustState;
  regio_content?: RegioContentState;
  target_app_ui?: TargetAppUiState;
  telco_load?: TelcoLoadState;
  boundary?: unknown;
  extracted_data?: unknown;
  scim_context?: unknown;
  graph?: unknown;
  poi_model?: unknown;
  load_model?: unknown;
  route_model?: unknown;
  layer_model?: unknown;
  sensus_core_package?: unknown;
  local_user_context?: unknown;
  view_state?: unknown;
  release?: unknown;
  status?: ScimGlobalStatus;
}
```

Panel 4 darf nur schreiben in:

```ts
context.telco_load
```

Panel 4 darf lesen aus:

```ts
context.system_adjust
context.regio_content
context.target_app_ui
```

Panel 4 darf nicht schreiben in:

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

### 0.4 Input-/Output-Prinzip

Jedes Panel braucht:

- klares Input-Schema
- klares Output-Schema
- Statusfeld
- Fehlerliste
- Warnliste
- Validierungsfunktion
- Mock-Daten
- Tests
- Übergabe an das nächste Panel

Panel 4 ist besonders wichtig, weil es die Brücke zwischen externen Last-/Signaldaten und der SCIM-Engine bildet. Wenn dieser Input zu weich gebaut wird, entstehen später Datenschutzverletzungen, falsche Aufenthaltsklassifizierungen, falsche Bewegungsauslastungen oder nicht reproduzierbare Routenvorschläge.

### 0.5 Datenschutzgrenze

Panel 4 darf Datenschutzgrenzen nicht aufweichen. Es muss verhindern, dass zu kleine Signalgruppen, einzelne Geräte, Rohsignale oder nicht ausreichend aggregierte Load-Daten in die SCIM-Runtime oder Sensus-Core-Ausgabe gelangen.

Nicht erlaubt:

- einzelne Geräte sichtbar machen
- einzelne Standortpunkte als Load-Ergebnis übernehmen
- Rohsignale als Sensus-Core-taugliche Daten markieren
- Load-Gruppen unter Mindestaggregation freigeben
- veraltete Signale ohne Verfallsprüfung verwenden
- unklare Signalqualität als belastbare Auslastung behandeln
- Debug- oder Rohdaten in `sensus_core_visible`-Outputs vorbereiten

Panel 4 verarbeitet selbst noch keine Aufenthalts- oder Bewegungslogik. Es stellt aber sicher, dass spätere Engine-Panels nur mit zulässigen, gültigen und klassifizierbaren Load-Gruppen arbeiten.

### 0.6 System-Adjust-Vorrang

Panel 4 ist abhängig von `context.system_adjust`.

Ohne gültigen System-Adjust-Stand darf kein Telco-Load-Batch als runtime-gültig übernommen werden.

System-Adjust begrenzt für Panel 4 insbesondere:

- Mindestanzahl unterschiedlicher Geräte pro sichtbarer Kumulation
- Mindestanzahl Signale pro sichtbarem Aggregat
- Mindestanzahl Signale für Routeneinfluss
- Mindestanzahl Signale für Aufenthaltsklassifizierung
- Mindestanzahl Signale für Bewegungsauslastung
- Mindest-Aggregationszeitfenster
- maximale Rohsignal-Gültigkeit
- maximale Rohsignal-Speicherung
- räumliche Mindestauflösung
- zulässige Signal-Gültigkeitsdauer
- Datenschutz- und Speichergrenzen

### 0.7 Regio-Content-Abhängigkeit

Panel 4 kann Regio-Content berücksichtigen, muss ihn aber nicht vollständig voraussetzen.

Wenn `context.regio_content` vorhanden ist, kann Panel 4 prüfen:

- ob Load-Gruppen einer aktiven Region zugeordnet werden können,
- ob räumliche Bezüge zur Region passen,
- ob lokale Sperren oder Hinweise eine Load-Interpretation beeinflussen könnten,
- ob regionale Parameter für Gültigkeit, Zeitfenster oder Vergleichswerte existieren.

Panel 4 darf aber keine POIs freigeben, keine Radien setzen und keine regionalen Parameter verändern.

### 0.8 Ziel-App-UI-Abhängigkeit

Panel 4 kann `context.target_app_ui` berücksichtigen, um früh zu erkennen, ob spätere Ziel-App-Ausgabe besonders stark reduziert werden muss.

Panel 4 darf daraus aber keine Darstellung ableiten und keine Sensus-Core-Layer erzeugen. Die Ziel-App-UI-Konfiguration bleibt ein späterer Filter- und Reduktionsvertrag.

### 0.9 Trennung von Load-Eingang und Load-Berechnung

Panel 4 lädt und validiert Load-Daten. Es berechnet noch nicht:

- Aufenthaltsdichte,
- Bewegungsauslastung,
- Maskierung,
- Staustellenklassifikation,
- Routenabwertung,
- Layer-Farbwerte.

Leitsatz:

> Panel 4 definiert, welche Load-Daten in die SCIM dürfen. Es entscheidet noch nicht, was diese Load-Daten fachlich bedeuten.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**Telco-Load Input**

Technischer Modulname:

```ts
TelcoLoadInputPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
loadTelcoLoadBatch()
normalizeTelcoLoad()
validateTelcoLoad()
applyTelcoLoadToContext()
validateLoadBatchAgainstSystemAdjust()
validateSignalGroupsAgainstPrivacyLimits()
validateLoadTimeWindow()
validateLoadExpiry()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/telco-load/
  TelcoLoadInputPanel.tsx
  telcoLoad.types.ts
  telcoLoad.schema.ts
  telcoLoad.defaults.ts
  telcoLoad.mock.ts
  telcoLoad.validation.ts
  telcoLoad.service.ts
  telcoLoad.context.ts
  telcoLoad.test.ts
```

---

# 2. Zweck des Panels

Panel 4 lädt, zeigt, normalisiert und validiert einen Telco-Load- beziehungsweise Runtime-Load-Batch.

Es beantwortet für spätere Panels:

- Welcher Load-Batch ist aktiv?
- Aus welcher Quelle stammt der Batch?
- Welches Zeitfenster deckt der Batch ab?
- Welche Signalgruppen sind enthalten?
- Welche räumliche Auflösung liegt vor?
- Welche Signalqualität ist gegeben?
- Welche Gruppen erfüllen Mindestaggregation?
- Welche Gruppen sind veraltet, unsicher oder widersprüchlich?
- Welche Verfallslogik gilt?
- Darf der Batch in die Aufenthalts-, Bewegungs- und Staustellenlogik eingehen?

Leitsatz:

> Panel 4 erzeugt den validierten, datenschutzkonformen Load-Eingang für POI-, Aufenthalts-, Bewegungs- und Routenlogik.

---

# 3. Nicht-Ziele

Panel 4 darf nicht:

- System-Adjust-Grenzen ändern
- Regio-Content ändern
- Ziel-App-UI-Profile ändern
- Boundary zeichnen
- Wege extrahieren
- Graphen bauen
- POIs freigeben
- Aufenthaltsbereiche berechnen
- Bewegungsauslastung berechnen
- Staustellen final klassifizieren
- Routenabschnitte bewerten
- Leaflet-Layer erzeugen
- Sensus-Core-Pakete erzeugen
- lokale User-Einstellungen anwenden

Panel 4 ist ein Input- und Validierungspanel, kein Engine-Panel.

---

# 4. Fachliche Verantwortung

Panel 4 hat sieben fachliche Kernaufgaben.

## 4.1 Load-Batch laden

Das Panel lädt einen Load-Batch aus einer Quelle, zum Beispiel:

- Telco-Load-Schnittstelle
- Runtime-Load-Service
- aggregierter Load-Datenservice
- lokaler Mock-Service
- statische JSON-Konfiguration
- späterer Backend-Endpunkt

## 4.2 Load-Batch normalisieren

Unterschiedliche Quellen können Load-Gruppen, Zeitfenster, räumliche Bezüge und Qualitätswerte unterschiedlich liefern. Panel 4 muss diese Rohstruktur in ein stabiles internes Output-Schema überführen.

## 4.3 Zeitfenster prüfen

Panel 4 prüft:

- Startzeit vorhanden
- Endzeit vorhanden
- Endzeit nach Startzeit
- Dauer innerhalb System-Adjust-Grenzen
- Batch nicht zu alt
- Batch nicht in der Zukunft
- Zeitfenster kompatibel mit Aggregations- und Verfallsregeln

## 4.4 Signalqualität prüfen

Panel 4 prüft:

- Vollständigkeit der Signalgruppen
- räumliche Genauigkeit
- zeitliche Genauigkeit
- Aggregationsqualität
- Quelle und Vertrauensniveau
- widersprüchliche Gruppen
- Gruppen mit zu niedriger Qualität

## 4.5 Mindestaggregation prüfen

Panel 4 prüft jede Signalgruppe gegen System-Adjust:

- Mindestanzahl unterschiedlicher Geräte
- Mindestanzahl Signale
- Mindestzeitfenster
- Mindestdauer stabiler Aggregate
- räumliche Mindestauflösung
- Verbot von Einzelgeräte-Sichtbarkeit

Signalgruppen, die diese Grenzen nicht erfüllen, dürfen nicht als gültige Load-Gruppen an spätere Engine-Panels übergeben werden.

## 4.6 Gültigkeit und Verfall prüfen

Panel 4 prüft:

- ob Signale noch innerhalb der gültigen Zeit liegen,
- ob Verfallslogik vorhanden ist,
- ob veraltete Gruppen abgeschwächt oder ausgeschlossen werden müssen,
- ob Rohsignale gespeichert oder bereits aggregiert sind,
- ob Speicherfristen eingehalten werden.

## 4.7 Telco-Load in Kontext schreiben

Nur wenn die Validierung erfolgreich ist, wird der Load-Batch in den gemeinsamen SCIM-Kontext geschrieben.

---

# 5. Datenmodell

## 5.1 Kernoutput

```ts
export interface TelcoLoadState {
  telco_load_batch_id: string;
  source: TelcoLoadSource;
  loaded_at: string;
  provider?: TelcoProviderInfo;
  time_window: LoadTimeWindow;
  spatial_scope: LoadSpatialScope;
  load_signals: LoadSignalGroup[];
  aggregation_level: LoadAggregationLevel;
  signal_quality: LoadSignalQualitySummary;
  expiry_rules: LoadExpiryRules;
  privacy_check: LoadPrivacyCheck;
  validation: TelcoLoadValidationResult;
  status: TelcoLoadStatus;
}
```

## 5.2 Quelle

```ts
export type TelcoLoadSource =
  | 'telco_load_api'
  | 'runtime_load_service'
  | 'aggregated_load_backend'
  | 'mock'
  | 'local_json'
  | 'api';
```

## 5.3 Statuswerte

```ts
export type TelcoLoadStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'telco_load_valid'
  | 'telco_load_invalid'
  | 'telco_load_warning'
  | 'telco_load_expired'
  | 'telco_load_privacy_blocked'
  | 'telco_load_error';
```

## 5.4 ProviderInfo

```ts
export interface TelcoProviderInfo {
  provider_id: string;
  provider_name?: string;
  data_contract_version?: string;
  anonymization_method?: AnonymizationMethod;
  raw_signal_access: false;
  device_level_access: false;
}

export type AnonymizationMethod =
  | 'pre_aggregated'
  | 'spatial_bucketed'
  | 'graph_projected'
  | 'cell_area_aggregated'
  | 'unknown';
```

Regel:

```ts
raw_signal_access must be false
device_level_access must be false
```

Panel 4 darf nur mit bereits aggregierten oder ausreichend anonymisierten Load-Daten arbeiten.

---

# 6. LoadTimeWindow

## 6.1 Typ

```ts
export interface LoadTimeWindow {
  start_at: string;
  end_at: string;
  duration_seconds: number;
  aggregation_window_seconds: number;
  generated_at: string;
  timezone?: string;
}
```

## 6.2 Zeitfenster-Regeln

Pflichtregeln:

```ts
start_at must exist
end_at must exist
end_at > start_at
duration_seconds > 0
aggregation_window_seconds >= system_adjust.aggregation_limits.min_time_window_seconds
aggregation_window_seconds <= system_adjust.aggregation_limits.max_time_window_seconds
generated_at must exist
```

Verfallsprüfung:

```ts
now - end_at <= system_adjust.privacy_limits.max_raw_signal_validity_seconds
```

Falls diese Bedingung nicht erfüllt ist, muss der Batch als veraltet markiert werden. Je nach Verfallslogik kann er blockiert, abgeschwächt oder nur noch als historischer Aggregatwert behandelt werden.

---

# 7. SpatialScope

## 7.1 Typ

```ts
export interface LoadSpatialScope {
  scope_id: string;
  scope_type: 'region' | 'representation_boundary' | 'bbox' | 'tile_set' | 'graph_segment_set' | 'unknown';
  bbox?: [number, number, number, number];
  geometry?: GeoJsonGeometry;
  spatial_resolution_meters: number;
  projection_method: LoadProjectionMethod;
  related_region_id?: string;
  related_representation_id?: string;
}

export type LoadProjectionMethod =
  | 'not_projected'
  | 'cell_to_area'
  | 'point_to_grid'
  | 'point_to_graph_segment'
  | 'aggregate_to_graph_segment'
  | 'aggregate_to_poi_radius'
  | 'unknown';
```

## 7.2 Räumliche Regeln

```ts
spatial_resolution_meters >= system_adjust.privacy_limits.spatial_min_resolution_meters
scope_type must not be unknown for runtime-valid batch
bbox or geometry should exist unless scope_type is graph_segment_set
```

Panel 4 darf noch keine finale Graphprojektion verlangen, weil Graph und POI-Modell später entstehen. Es muss aber sicherstellen, dass der räumliche Bezug hinreichend klar und datenschutzkonform ist.

---

# 8. LoadSignalGroup

## 8.1 Typ

```ts
export interface LoadSignalGroup {
  signal_group_id: string;
  signal_type: LoadSignalType;
  aggregation_unit: LoadAggregationUnit;
  geometry_ref?: string;
  geometry?: GeoJsonGeometry;
  approximate_center?: GeoPoint;
  time_window: LoadTimeWindow;
  metrics: LoadSignalMetrics;
  quality: LoadSignalQuality;
  privacy: LoadSignalPrivacyState;
  validity: LoadSignalValidityState;
  intended_use: LoadIntendedUse[];
}

export type LoadSignalType =
  | 'runtime_load'
  | 'telco_density'
  | 'movement_indicator'
  | 'stillness_indicator'
  | 'stay_candidate_indicator'
  | 'jam_candidate_indicator'
  | 'mixed_load'
  | 'unknown';

export type LoadAggregationUnit =
  | 'area_bucket'
  | 'grid_cell'
  | 'cell_area'
  | 'graph_segment_candidate'
  | 'poi_radius_candidate'
  | 'route_corridor_candidate'
  | 'unknown';

export type LoadIntendedUse =
  | 'stay_classification_input'
  | 'movement_load_input'
  | 'jam_indicator_input'
  | 'route_relevance_input'
  | 'quality_reference_only'
  | 'excluded';
```

## 8.2 LoadSignalMetrics

```ts
export interface LoadSignalMetrics {
  signal_count: number;
  distinct_device_count?: number;
  density_score?: number;
  normalized_load_score?: number;
  movement_ratio?: number;
  stillness_ratio?: number;
  confidence_score?: number;
  sample_duration_seconds?: number;
}
```

Regeln:

```ts
signal_count >= system_adjust.privacy_limits.min_signals_per_visible_aggregate
distinct_device_count must be absent or >= system_adjust.privacy_limits.min_distinct_devices_per_visible_aggregate
normalized_load_score must be within 0..1 if present
movement_ratio must be within 0..1 if present
stillness_ratio must be within 0..1 if present
confidence_score must be within 0..1 if present
```

Wenn `distinct_device_count` aus Datenschutzgründen nicht geliefert wird, muss die Quelle bestätigen, dass die Mindestaggregation bereits vorgelagert eingehalten wurde.

---

# 9. Signalqualität

## 9.1 LoadSignalQuality

```ts
export interface LoadSignalQuality {
  quality_level: LoadQualityLevel;
  confidence_score: number;
  spatial_accuracy_level: AccuracyLevel;
  temporal_accuracy_level: AccuracyLevel;
  aggregation_completeness: CompletenessLevel;
  has_conflicts: boolean;
  conflict_reason?: string;
}

export type LoadQualityLevel =
  | 'high'
  | 'medium'
  | 'low'
  | 'unusable'
  | 'unknown';

export type AccuracyLevel =
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown';

export type CompletenessLevel =
  | 'complete'
  | 'partial'
  | 'sparse'
  | 'unknown';
```

## 9.2 LoadSignalQualitySummary

```ts
export interface LoadSignalQualitySummary {
  overall_quality: LoadQualityLevel;
  valid_group_count: number;
  warning_group_count: number;
  invalid_group_count: number;
  expired_group_count: number;
  privacy_blocked_group_count: number;
  conflict_group_count: number;
}
```

## 9.3 Qualitätsregeln

Blockierende Regeln:

```ts
quality_level must not be unusable for runtime-valid groups
confidence_score must be >= configured minimum if a minimum exists
has_conflicts must be false for direct runtime use
```

Warnungen:

```ts
quality_level is low
spatial_accuracy_level is low
temporal_accuracy_level is low
aggregation_completeness is partial or sparse
has_conflicts is true but group is marked quality_reference_only
```

---

# 10. Datenschutzstatus je Signalgruppe

## 10.1 LoadSignalPrivacyState

```ts
export interface LoadSignalPrivacyState {
  aggregation_verified: boolean;
  meets_min_distinct_devices: boolean;
  meets_min_signal_count: boolean;
  single_device_visibility_possible: false;
  raw_signal_payload_present: false;
  device_ids_present: false;
  exact_trace_present: false;
  sensus_core_safe: boolean;
  privacy_block_reason?: string;
}
```

## 10.2 Datenschutzregeln

Blockierende Regeln:

```ts
aggregation_verified must be true
meets_min_distinct_devices must be true
meets_min_signal_count must be true
single_device_visibility_possible must be false
raw_signal_payload_present must be false
device_ids_present must be false
exact_trace_present must be false
```

Wenn eine dieser Regeln verletzt ist, wird die Signalgruppe blockiert und darf nicht in Engine-Inputs für Aufenthalt, Bewegung oder Routenrelevanz eingehen.

---

# 11. Gültigkeit und Verfall

## 11.1 LoadSignalValidityState

```ts
export interface LoadSignalValidityState {
  validity_status: LoadValidityStatus;
  valid_until?: string;
  age_seconds?: number;
  decay_factor?: number;
  expired: boolean;
  stale: boolean;
  usable_for_runtime: boolean;
}

export type LoadValidityStatus =
  | 'fresh'
  | 'valid'
  | 'stale'
  | 'expired'
  | 'historical_only'
  | 'invalid';
```

## 11.2 LoadExpiryRules

```ts
export interface LoadExpiryRules {
  max_validity_seconds: number;
  decay_supported: boolean;
  decay_half_life_seconds?: number;
  expired_group_behavior: ExpiredGroupBehavior;
  stale_group_behavior: StaleGroupBehavior;
}

export type ExpiredGroupBehavior =
  | 'exclude'
  | 'historical_only'
  | 'warn_and_exclude';

export type StaleGroupBehavior =
  | 'allow_with_warning'
  | 'apply_decay'
  | 'exclude'
  | 'quality_reference_only';
```

## 11.3 Verfallsregeln

```ts
max_validity_seconds <= system_adjust.privacy_limits.max_raw_signal_validity_seconds
valid_until must be computed or provided for runtime-valid groups
expired groups must not be usable_for_runtime
stale groups must follow stale_group_behavior
```

---

# 12. Aggregationsniveau

## 12.1 LoadAggregationLevel

```ts
export interface LoadAggregationLevel {
  aggregation_level_id: string;
  aggregation_type: LoadAggregationType;
  min_distinct_devices_observed?: number;
  min_signal_count_observed: number;
  aggregation_window_seconds: number;
  spatial_resolution_meters: number;
  stable_aggregate_duration_seconds?: number;
  pre_aggregated_by_provider: boolean;
}

export type LoadAggregationType =
  | 'provider_pre_aggregated'
  | 'backend_aggregated'
  | 'runtime_aggregated'
  | 'mixed'
  | 'unknown';
```

## 12.2 Aggregationsregeln

```ts
aggregation_type must not be unknown for runtime-valid batch
min_signal_count_observed >= system_adjust.aggregation_limits.min_signal_count
min_distinct_devices_observed absent or >= system_adjust.aggregation_limits.min_distinct_devices
aggregation_window_seconds within system_adjust.aggregation_limits min/max
spatial_resolution_meters >= system_adjust.privacy_limits.spatial_min_resolution_meters
```

---

# 13. Batch-Datenschutzprüfung

## 13.1 LoadPrivacyCheck

```ts
export interface LoadPrivacyCheck {
  is_privacy_valid: boolean;
  checked_against_system_adjust_version: string;
  blocked_group_ids: string[];
  warning_group_ids: string[];
  raw_payload_detected: boolean;
  device_level_data_detected: boolean;
  exact_trace_detected: boolean;
  notes?: string[];
}
```

## 13.2 Batch-Regeln

```ts
raw_payload_detected must be false
device_level_data_detected must be false
exact_trace_detected must be false
is_privacy_valid must be true for runtime-valid batch
```

---

# 14. Validierung

## 14.1 ValidationResult

```ts
export interface TelcoLoadValidationResult {
  is_valid: boolean;
  errors: TelcoLoadIssue[];
  warnings: TelcoLoadIssue[];
  checked_at: string;
  checked_against_system_adjust_version: string;
  checked_against_regio_content_version?: string;
  checked_against_target_app_ui_version?: string;
}

export interface TelcoLoadIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}
```

## 14.2 Pflichtvalidierungen

### System-Adjust vorhanden

```ts
context.system_adjust must exist
context.system_adjust.status must be system_adjust_valid or system_adjust_warning
```

Ohne gültigen System-Adjust-Stand darf kein Telco-Load-Batch als gültig übernommen werden.

### Batch

```ts
telco_load_batch_id must exist
source must exist
loaded_at must exist
time_window must exist
spatial_scope must exist
load_signals must exist
aggregation_level must exist
expiry_rules must exist
privacy_check must exist
```

### Zeitfenster

```ts
start_at exists
end_at exists
end_at > start_at
duration_seconds > 0
aggregation_window_seconds within System-Adjust aggregation range
generated_at exists
batch must not exceed validity window for runtime use
```

### Räumlicher Bezug

```ts
scope_type must not be unknown
spatial_resolution_meters >= System-Adjust spatial minimum
bbox or geometry should exist unless graph_segment_set
```

### Signalgruppen

```ts
each signal_group_id exists
signal_type must not be unknown for runtime-valid group
aggregation_unit must not be unknown for runtime-valid group
signal_count >= System-Adjust minimum
if distinct_device_count exists, it must meet System-Adjust minimum
quality_level must not be unusable
privacy flags must be safe
expired groups must not be usable_for_runtime
```

### Datenschutz

```ts
raw_signal_payload_present must be false
device_ids_present must be false
exact_trace_present must be false
single_device_visibility_possible must be false
aggregation_verified must be true
sensus_core_safe must be true for groups that may enter public outputs later
```

### Aggregation

```ts
aggregation_type must not be unknown
min_signal_count_observed >= System-Adjust aggregation minimum
min_distinct_devices_observed absent or >= System-Adjust aggregation minimum
aggregation_window_seconds within System-Adjust min/max
```

---

# 15. Fehlercodes

```ts
TELCO_SYSTEM_ADJUST_MISSING
TELCO_SYSTEM_ADJUST_INVALID
TELCO_BATCH_ID_MISSING
TELCO_SOURCE_MISSING
TELCO_LOADED_AT_MISSING
TELCO_TIME_WINDOW_MISSING
TELCO_TIME_START_MISSING
TELCO_TIME_END_MISSING
TELCO_TIME_END_BEFORE_START
TELCO_DURATION_INVALID
TELCO_AGG_WINDOW_OUT_OF_RANGE
TELCO_BATCH_EXPIRED
TELCO_SPATIAL_SCOPE_MISSING
TELCO_SPATIAL_SCOPE_UNKNOWN
TELCO_SPATIAL_RESOLUTION_TOO_FINE
TELCO_LOAD_SIGNALS_MISSING
TELCO_SIGNAL_GROUP_ID_MISSING
TELCO_SIGNAL_TYPE_UNKNOWN
TELCO_AGGREGATION_UNIT_UNKNOWN
TELCO_SIGNAL_COUNT_TOO_LOW
TELCO_DISTINCT_DEVICE_COUNT_TOO_LOW
TELCO_SIGNAL_QUALITY_UNUSABLE
TELCO_SIGNAL_CONFLICT_BLOCKING
TELCO_PRIVACY_NOT_VERIFIED
TELCO_SINGLE_DEVICE_VISIBILITY_FORBIDDEN
TELCO_RAW_SIGNAL_PAYLOAD_FORBIDDEN
TELCO_DEVICE_IDS_FORBIDDEN
TELCO_EXACT_TRACE_FORBIDDEN
TELCO_GROUP_EXPIRED_RUNTIME_FORBIDDEN
TELCO_AGGREGATION_LEVEL_MISSING
TELCO_AGGREGATION_TYPE_UNKNOWN
TELCO_AGGREGATION_UNDER_SYSTEM_LIMIT
TELCO_EXPIRY_RULES_MISSING
TELCO_PRIVACY_CHECK_MISSING
TELCO_BATCH_PRIVACY_INVALID
```

---

# 16. Warncodes

```ts
TELCO_REGIO_CONTENT_MISSING
TELCO_TARGET_APP_UI_MISSING
TELCO_LOW_SIGNAL_QUALITY
TELCO_LOW_SPATIAL_ACCURACY
TELCO_LOW_TEMPORAL_ACCURACY
TELCO_PARTIAL_AGGREGATION
TELCO_SPARSE_SIGNAL_GROUP
TELCO_STALE_SIGNAL_GROUP
TELCO_CONFLICT_GROUP_REFERENCE_ONLY
TELCO_UNKNOWN_PROVIDER_ANONYMIZATION
TELCO_MIXED_SIGNAL_TYPES
TELCO_MANY_GROUPS_BLOCKED
TELCO_LOAD_BATCH_NEAR_EXPIRY
TELCO_SPATIAL_SCOPE_WITHOUT_REGION_MATCH
TELCO_SYSTEM_ADJUST_VERSION_MISMATCH
```

---

# 17. UI-Anforderungen

Panel 4 soll als eigenständiges Input-Panel sichtbar bleiben.

## 17.1 Layout

Empfohlenes Layout:

```txt
┌────────────────────────────────────────────────────────────┐
│ Panel 4: Telco-Load Input                                 │
├────────────────────────────────────────────────────────────┤
│ Load-Batch auswählen / laden                               │
│ Quelle: Telco API | Runtime Load Service | Mock | JSON      │
├────────────────────────────────────────────────────────────┤
│ Statuskarten                                                │
│ - Load-Batch                                                │
│ - Zeitfenster                                               │
│ - Signalqualität                                            │
│ - Aggregationsniveau                                        │
│ - Gültigkeit und Verfall                                    │
│ - Datenschutzprüfung                                        │
├────────────────────────────────────────────────────────────┤
│ Tabs                                                        │
│ 1. Load-Batch                                               │
│ 2. Zeitfenster                                              │
│ 3. Signalqualität                                           │
│ 4. Aggregationsniveau                                       │
│ 5. Gültigkeit und Verfall                                   │
│ 6. Datenschutzprüfung                                       │
├────────────────────────────────────────────────────────────┤
│ Footer                                                      │
│ [Laden] [Validieren] [In Kontext übernehmen]                │
└────────────────────────────────────────────────────────────┘
```

## 17.2 Tab 1: Load-Batch

Zweck:

- aktiven Load-Batch anzeigen
- Quelle und Provider klären
- räumlichen Scope sichtbar machen
- Batch-Status prüfen

Felder:

```txt
Load-Batch-ID
Quelle
Provider-ID
Provider-Name
Datenvertragsversion
Anonymisierungsmethode
Rohsignalzugriff erlaubt? Muss nein sein.
Gerätelevel-Zugriff erlaubt? Muss nein sein.
Geladen am
Räumlicher Scope-Typ
BBOX / Geometrie vorhanden
Bezogene Region
Bezogene Representation
Status
```

Aktionen:

```txt
Load-Batch laden
Mock-Batch laden
JSON importieren
```

## 17.3 Tab 2: Zeitfenster

Zweck:

- zeitliche Gültigkeit prüfen
- Aggregationszeitfenster gegen System-Adjust prüfen
- Verfallsnähe sichtbar machen

Felder:

```txt
Startzeit
Endzeit
Dauer
Aggregationsfenster
Generiert am
Zeitzone
Maximal erlaubte Gültigkeit
Alter des Batch
Verfallsstatus
```

Validierungsanzeige:

```txt
Zeitfenster gültig
Zeitfenster zu kurz
Zeitfenster zu lang
Batch veraltet
Batch nahe Verfall
Endzeit vor Startzeit
```

## 17.4 Tab 3: Signalqualität

Zweck:

- Qualität der Signalgruppen sichtbar machen
- unbrauchbare oder widersprüchliche Gruppen blockieren
- Qualitätswarnungen erfassen

Felder je Signalgruppe:

```txt
Signalgruppen-ID
Signaltyp
Aggregationseinheit
Signalanzahl
Geräteanzahl, falls geliefert
Dichtewert, falls geliefert
Normalisierter Load-Score
Bewegungsanteil
Stillstandsanteil
Konfidenz
Qualitätsstufe
Räumliche Genauigkeit
Zeitliche Genauigkeit
Aggregationsvollständigkeit
Konflikte vorhanden
Konfliktgrund
Intended Use
```

Zusammenfassung:

```txt
Gesamtqualität
Gültige Gruppen
Warn-Gruppen
Ungültige Gruppen
Veraltete Gruppen
Datenschutz-blockierte Gruppen
Konflikt-Gruppen
```

## 17.5 Tab 4: Aggregationsniveau

Zweck:

- prüfen, ob die Daten ausreichend aggregiert sind
- Mindestaggregation sichtbar gegen System-Adjust stellen

Felder:

```txt
Aggregations-Level-ID
Aggregationstyp
Beobachtete Mindest-Signalanzahl
Beobachtete Mindest-Geräteanzahl, falls vorhanden
Aggregationszeitfenster
Räumliche Auflösung
Stabile Aggregatdauer
Provider-voraggregiert ja/nein
System-Mindestgerätezahl
System-Mindestsignalzahl
System-Mindestzeitfenster
System-Mindestauflösung
```

Validierungsanzeige:

```txt
Aggregation gültig
Signalanzahl zu niedrig
Geräteanzahl zu niedrig
Zeitfenster zu kurz
Räumliche Auflösung zu fein
Aggregationstyp unbekannt
```

## 17.6 Tab 5: Gültigkeit und Verfall

Zweck:

- Verfallslogik kontrollieren
- alte Gruppen aussortieren oder abschwächen
- Runtime-Verwendbarkeit prüfen

Felder:

```txt
Maximale Gültigkeit
Verfall unterstützt
Halbwertszeit
Verhalten bei veralteten Gruppen
Verhalten bei abgelaufenen Gruppen
Frische Gruppen
Gültige Gruppen
Stale-Gruppen
Abgelaufene Gruppen
Historische Gruppen
Für Runtime verwendbare Gruppen
```

Validierungsanzeige:

```txt
Frisch
Gültig
Stale
Abgelaufen
Nur historisch
Runtime-gesperrt
```

## 17.7 Tab 6: Datenschutzprüfung

Zweck:

- Datenschutzstatus sichtbar machen
- blockierte Gruppen erklären
- Übergabe an Engine absichern

Felder:

```txt
Privacy gültig ja/nein
Geprüft gegen System-Adjust-Version
Blockierte Gruppen
Warn-Gruppen
Rohdaten-Payload erkannt
Gerätelevel-Daten erkannt
Exakte Traces erkannt
Aggregation verifiziert
Sensus-Core-sicher
Fehlerliste
Warnliste
```

Aktionen:

```txt
Validieren
In Kontext übernehmen
```

---

# 18. UI-Zustände

## 18.1 Initial

```ts
status: 'not_loaded'
```

Anzeige:

```txt
Noch kein Telco-Load-Batch geladen.
```

Aktionen:

```txt
Load-Batch laden
Mock laden
JSON importieren
```

## 18.2 Loading

```ts
status: 'loading'
```

Anzeige:

```txt
Telco-Load-Batch wird geladen.
```

Aktionen gesperrt:

```txt
Validieren
In Kontext übernehmen
```

## 18.3 Loaded unvalidated

```ts
status: 'loaded_unvalidated'
```

Anzeige:

```txt
Telco-Load-Batch geladen, aber noch nicht validiert.
```

Aktionen erlaubt:

```txt
Validieren
```

## 18.4 Valid

```ts
status: 'telco_load_valid'
```

Anzeige:

```txt
Telco-Load-Batch ist gültig und kann als Load-Input verwendet werden.
```

Aktionen erlaubt:

```txt
In Kontext übernehmen
Weiter zu Boundary/Extraktion oder Load Processor
```

## 18.5 Warning

```ts
status: 'telco_load_warning'
```

Anzeige:

```txt
Telco-Load-Batch ist verwendbar, enthält aber Warnungen.
```

Aktionen erlaubt:

```txt
In Kontext übernehmen, sofern keine blockierenden Fehler und keine Privacy-Blocker vorliegen
```

## 18.6 Expired

```ts
status: 'telco_load_expired'
```

Anzeige:

```txt
Telco-Load-Batch ist veraltet und darf nicht als Runtime-Input verwendet werden.
```

Aktionen gesperrt:

```txt
In Runtime-Kontext übernehmen
```

## 18.7 Privacy blocked

```ts
status: 'telco_load_privacy_blocked'
```

Anzeige:

```txt
Telco-Load-Batch verletzt Datenschutz- oder Mindestaggregationsgrenzen.
```

Aktionen gesperrt:

```txt
In Kontext übernehmen
Weiter
```

## 18.8 Invalid

```ts
status: 'telco_load_invalid'
```

Anzeige:

```txt
Telco-Load-Batch ist ungültig. Folgepanels dürfen diesen Stand nicht verwenden.
```

Aktionen gesperrt:

```txt
In Kontext übernehmen
Weiter
```

---

# 19. Service-Logik

## 19.1 loadTelcoLoadBatch

```ts
export async function loadTelcoLoadBatch(
  source: TelcoLoadSource,
  batchId?: string
): Promise<unknown> {
  // Quelle laden: Telco API, Runtime-Load-Service, Mock, JSON oder API.
  // Ergebnis ist unknown, weil es erst normalisiert werden muss.
}
```

## 19.2 normalizeTelcoLoad

```ts
export function normalizeTelcoLoad(raw: unknown): TelcoLoadState {
  // Rohdaten in stabiles internes Schema überführen.
  // Optionale Felder mit sicheren Defaults ergänzen.
  // Pflichtfelder nicht stillschweigend erfinden.
}
```

## 19.3 validateTelcoLoad

```ts
export function validateTelcoLoad(
  state: TelcoLoadState,
  systemAdjust: SystemAdjustState | undefined,
  regioContent?: RegioContentState,
  targetAppUi?: TargetAppUiState
): TelcoLoadValidationResult {
  const errors: TelcoLoadIssue[] = [];
  const warnings: TelcoLoadIssue[] = [];

  // System-Adjust prüfen
  // Batch-Pflichtfelder prüfen
  // Zeitfenster prüfen
  // räumlichen Scope prüfen
  // Signalgruppen prüfen
  // Mindestaggregation prüfen
  // Datenschutzflags prüfen
  // Verfall prüfen
  // Qualität prüfen
  // optionale Regio- und Ziel-App-Warnungen ableiten

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
    checked_against_regio_content_version: regioContent?.regio_content_version,
    checked_against_target_app_ui_version: targetAppUi?.target_app_ui_version
  };
}
```

## 19.4 applyTelcoLoadToContext

```ts
export function applyTelcoLoadToContext(
  context: ScimContext,
  telcoLoad: TelcoLoadState
): ScimContext {
  if (telcoLoad.status !== 'telco_load_valid' && telcoLoad.status !== 'telco_load_warning') {
    throw new Error('Cannot apply invalid, expired or privacy-blocked Telco-Load state to SCIM context.');
  }

  if (!telcoLoad.validation.is_valid) {
    throw new Error('Cannot apply Telco-Load state with blocking validation errors.');
  }

  if (!telcoLoad.privacy_check.is_privacy_valid) {
    throw new Error('Cannot apply Telco-Load state with invalid privacy check.');
  }

  return {
    ...context,
    telco_load: telcoLoad
  };
}
```

Wichtig:

Diese Funktion darf keine anderen Kontextbereiche verändern.



# 20. Mock-Daten

```ts
export const mockTelcoLoadState: TelcoLoadState = {
  telco_load_batch_id: 'load_001',
  source: 'mock',
  loaded_at: '2026-05-21T00:00:00.000Z',
  provider: {
    provider_id: 'mock_telco',
    provider_name: 'Mock Telco Provider',
    data_contract_version: '1.0.0',
    anonymization_method: 'pre_aggregated',
    raw_signal_access: false,
    device_level_access: false
  },
  time_window: {
    start_at: '2026-05-21T09:00:00.000Z',
    end_at: '2026-05-21T09:05:00.000Z',
    duration_seconds: 300,
    aggregation_window_seconds: 300,
    generated_at: '2026-05-21T09:05:30.000Z',
    timezone: 'Europe/Vienna'
  },
  spatial_scope: {
    scope_id: 'scope_hochwab_nord',
    scope_type: 'region',
    bbox: [15.0, 47.5, 15.4, 47.8],
    spatial_resolution_meters: 25,
    projection_method: 'cell_to_area',
    related_region_id: 'reg_hochwab_nord'
  },
  load_signals: [
    {
      signal_group_id: 'sg_001',
      signal_type: 'runtime_load',
      aggregation_unit: 'area_bucket',
      approximate_center: {
        type: 'Point',
        coordinates: [15.214, 47.642]
      },
      time_window: {
        start_at: '2026-05-21T09:00:00.000Z',
        end_at: '2026-05-21T09:05:00.000Z',
        duration_seconds: 300,
        aggregation_window_seconds: 300,
        generated_at: '2026-05-21T09:05:30.000Z',
        timezone: 'Europe/Vienna'
      },
      metrics: {
        signal_count: 18,
        distinct_device_count: 7,
        density_score: 0.62,
        normalized_load_score: 0.58,
        movement_ratio: 0.74,
        stillness_ratio: 0.26,
        confidence_score: 0.82,
        sample_duration_seconds: 300
      },
      quality: {
        quality_level: 'high',
        confidence_score: 0.82,
        spatial_accuracy_level: 'medium',
        temporal_accuracy_level: 'high',
        aggregation_completeness: 'complete',
        has_conflicts: false
      },
      privacy: {
        aggregation_verified: true,
        meets_min_distinct_devices: true,
        meets_min_signal_count: true,
        single_device_visibility_possible: false,
        raw_signal_payload_present: false,
        device_ids_present: false,
        exact_trace_present: false,
        sensus_core_safe: true
      },
      validity: {
        validity_status: 'valid',
        valid_until: '2026-05-21T09:10:00.000Z',
        age_seconds: 30,
        decay_factor: 1,
        expired: false,
        stale: false,
        usable_for_runtime: true
      },
      intended_use: ['movement_load_input', 'route_relevance_input']
    },
    {
      signal_group_id: 'sg_002',
      signal_type: 'stillness_indicator',
      aggregation_unit: 'poi_radius_candidate',
      approximate_center: {
        type: 'Point',
        coordinates: [15.225, 47.651]
      },
      time_window: {
        start_at: '2026-05-21T09:00:00.000Z',
        end_at: '2026-05-21T09:05:00.000Z',
        duration_seconds: 300,
        aggregation_window_seconds: 300,
        generated_at: '2026-05-21T09:05:30.000Z',
        timezone: 'Europe/Vienna'
      },
      metrics: {
        signal_count: 24,
        distinct_device_count: 9,
        density_score: 0.77,
        normalized_load_score: 0.71,
        movement_ratio: 0.18,
        stillness_ratio: 0.82,
        confidence_score: 0.86,
        sample_duration_seconds: 300
      },
      quality: {
        quality_level: 'high',
        confidence_score: 0.86,
        spatial_accuracy_level: 'medium',
        temporal_accuracy_level: 'high',
        aggregation_completeness: 'complete',
        has_conflicts: false
      },
      privacy: {
        aggregation_verified: true,
        meets_min_distinct_devices: true,
        meets_min_signal_count: true,
        single_device_visibility_possible: false,
        raw_signal_payload_present: false,
        device_ids_present: false,
        exact_trace_present: false,
        sensus_core_safe: true
      },
      validity: {
        validity_status: 'valid',
        valid_until: '2026-05-21T09:10:00.000Z',
        age_seconds: 30,
        decay_factor: 1,
        expired: false,
        stale: false,
        usable_for_runtime: true
      },
      intended_use: ['stay_classification_input']
    }
  ],
  aggregation_level: {
    aggregation_level_id: 'agg_001',
    aggregation_type: 'provider_pre_aggregated',
    min_distinct_devices_observed: 7,
    min_signal_count_observed: 18,
    aggregation_window_seconds: 300,
    spatial_resolution_meters: 25,
    stable_aggregate_duration_seconds: 300,
    pre_aggregated_by_provider: true
  },
  signal_quality: {
    overall_quality: 'high',
    valid_group_count: 2,
    warning_group_count: 0,
    invalid_group_count: 0,
    expired_group_count: 0,
    privacy_blocked_group_count: 0,
    conflict_group_count: 0
  },
  expiry_rules: {
    max_validity_seconds: 300,
    decay_supported: true,
    decay_half_life_seconds: 300,
    expired_group_behavior: 'exclude',
    stale_group_behavior: 'apply_decay'
  },
  privacy_check: {
    is_privacy_valid: true,
    checked_against_system_adjust_version: 'sys_v1.0.0',
    blocked_group_ids: [],
    warning_group_ids: [],
    raw_payload_detected: false,
    device_level_data_detected: false,
    exact_trace_detected: false,
    notes: []
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_system_adjust_version: 'sys_v1.0.0',
    checked_against_regio_content_version: 'regio_v1.0.0',
    checked_against_target_app_ui_version: 'ui_v1.0.0'
  },
  status: 'telco_load_valid'
};
```

---

# 21. Übergabe an spätere Panels

Panel 4 gibt folgendes Kontextsegment weiter:

```json
{
  "telco_load": {
    "telco_load_batch_id": "load_001",
    "time_window": {},
    "load_signals": [],
    "aggregation_level": {},
    "signal_quality": {},
    "expiry_rules": {},
    "privacy_check": {},
    "status": "telco_load_valid"
  }
}
```

Direkte Abnehmer:

- Panel 6: Graph und Basislayer, sofern Load-Daten bereits als Kontextreferenz sichtbar sein sollen
- Panel 7: POI, Load und Bewegung
- späterer Load Processor
- spätere Aufenthalts- und Bewegungslogik
- spätere Staustellenindikatoren
- spätere Routenbewertung

Wichtig:

Panel 4 übergibt noch keine `projected_loads`, keine `stay_loads`, keine `movement_loads`, keine `masked_edges` und keine `route_sections`. Diese entstehen erst in späteren Engine-Panels.

---

# 22. Akzeptanzkriterien

## 22.1 Laden

- Ein Mock-Telco-Load-Batch kann geladen werden.
- Ein Telco-Load-Objekt kann aus JSON geladen werden.
- Der Ladezustand wird korrekt angezeigt.
- Fehler beim Laden werden im Panel sichtbar.

## 22.2 System-Adjust-Abhängigkeit

- Ohne gültiges `context.system_adjust` kann kein Telco-Load-Batch als runtime-gültig übernommen werden.
- Telco-Load wird gegen die aktive System-Adjust-Version geprüft.
- System-Adjust-Grenzen werden nicht unterschritten.

## 22.3 Load-Batch

- Batch-ID, Quelle, Ladezeitpunkt, Zeitfenster, Spatial Scope, Signalgruppen, Aggregationsniveau, Verfallsregeln und Datenschutzprüfung sind Pflichtbereiche.
- Rohsignalzugriff und Gerätelevel-Zugriff sind für runtime-gültige Batches ausgeschlossen.
- Unbekannte Quellen oder unbekannte Anonymisierung erzeugen mindestens Warnungen.

## 22.4 Zeitfenster

- Start- und Endzeit sind vorhanden.
- Endzeit liegt nach Startzeit.
- Dauer ist positiv.
- Aggregationsfenster liegt innerhalb System-Adjust-Grenzen.
- Veraltete Batches werden nicht als runtime-gültig übernommen.

## 22.5 Signalqualität

- Signalgruppen mit `quality_level = unusable` werden blockiert.
- Konfliktgruppen werden blockiert, sofern sie nicht ausdrücklich nur als `quality_reference_only` markiert sind.
- Niedrige räumliche oder zeitliche Genauigkeit erzeugt Warnungen.
- Sparse oder partial aggregation erzeugt Warnungen oder Blocker je nach System-Adjust.

## 22.6 Aggregationsniveau

- Signalgruppen erfüllen Mindestanzahl Signale.
- Signalgruppen erfüllen Mindestanzahl unterschiedlicher Geräte, sofern geliefert oder durch Provider bestätigt.
- Aggregationszeitfenster unterschreitet nicht die Systemgrenze.
- Räumliche Auflösung ist nicht feiner als erlaubt.

## 22.7 Datenschutz

- Einzelgeräte-Sichtbarkeit ist ausgeschlossen.
- Rohsignal-Payloads sind ausgeschlossen.
- Geräte-IDs sind ausgeschlossen.
- Exakte Traces sind ausgeschlossen.
- Nicht datenschutzkonforme Gruppen werden blockiert.
- Ein privacy-blocked Batch kann nicht in den Kontext übernommen werden.

## 22.8 Gültigkeit und Verfall

- Abgelaufene Signalgruppen sind nicht runtime-verwendbar.
- Stale-Gruppen werden gemäß Verfallsregel behandelt.
- Verfallsregeln überschreiten nicht die System-Adjust-Gültigkeitsgrenzen.
- Runtime-Verwendbarkeit wird je Gruppe ausgewiesen.

## 22.9 Kontextübergabe

- Die Übergabe verändert ausschließlich `context.telco_load`.
- Kein anderer Kontextbereich wird überschrieben.
- Ungültige, veraltete oder privacy-blocked Batches blockieren die Übergabe.

## 22.10 UI

- Das Panel zeigt Load-Batch, Zeitfenster, Signalqualität, Aggregationsniveau, Gültigkeit/Verfall und Datenschutzprüfung getrennt an.
- Blockierende Fehler sind klar erkennbar.
- Warnungen sind klar erkennbar.
- Folgeaktionen sind gesperrt, solange der Telco-Load-Batch ungültig, veraltet oder datenschutzblockiert ist.

## 22.11 Tests

- Unit-Tests für Validator vorhanden.
- Unit-Tests für Zeitfensterprüfung vorhanden.
- Unit-Tests für Mindestaggregation gegen System-Adjust vorhanden.
- Unit-Tests für Datenschutzflags vorhanden.
- Unit-Tests für Verfallslogik vorhanden.
- Unit-Tests für Kontextübergabe vorhanden.
- Mock-Daten-Test vorhanden.

---

# 23. Testfälle

## 23.1 Gültiger Mock

Input:

```ts
mockTelcoLoadState
validSystemAdjust
validRegioContent
validTargetAppUi
```

Erwartung:

```ts
validation.is_valid === true
errors.length === 0
status === 'telco_load_valid'
```

## 23.2 System-Adjust fehlt

Input:

```ts
mockTelcoLoadState
systemAdjust = undefined
```

Erwartung:

```ts
errors includes TELCO_SYSTEM_ADJUST_MISSING
validation.is_valid === false
```

## 23.3 Endzeit vor Startzeit

Mutation:

```ts
time_window.end_at = '2026-05-21T08:55:00.000Z'
time_window.start_at = '2026-05-21T09:00:00.000Z'
```

Erwartung:

```ts
errors includes TELCO_TIME_END_BEFORE_START
validation.is_valid === false
```

## 23.4 Aggregationsfenster zu kurz

Mutation:

```ts
time_window.aggregation_window_seconds = 10
```

Erwartung:

```ts
errors includes TELCO_AGG_WINDOW_OUT_OF_RANGE
validation.is_valid === false
```

## 23.5 Signalanzahl zu niedrig

Mutation:

```ts
load_signals[0].metrics.signal_count = 1
```

Erwartung:

```ts
errors includes TELCO_SIGNAL_COUNT_TOO_LOW
validation.is_valid === false
```

## 23.6 Geräteanzahl zu niedrig

Mutation:

```ts
load_signals[0].metrics.distinct_device_count = 1
```

Erwartung:

```ts
errors includes TELCO_DISTINCT_DEVICE_COUNT_TOO_LOW
validation.is_valid === false
```

## 23.7 Rohsignal-Payload vorhanden

Mutation:

```ts
load_signals[0].privacy.raw_signal_payload_present = true
```

Erwartung:

```ts
errors includes TELCO_RAW_SIGNAL_PAYLOAD_FORBIDDEN
validation.is_valid === false
```

## 23.8 Geräte-IDs vorhanden

Mutation:

```ts
load_signals[0].privacy.device_ids_present = true
```

Erwartung:

```ts
errors includes TELCO_DEVICE_IDS_FORBIDDEN
validation.is_valid === false
```

## 23.9 Exakter Trace vorhanden

Mutation:

```ts
load_signals[0].privacy.exact_trace_present = true
```

Erwartung:

```ts
errors includes TELCO_EXACT_TRACE_FORBIDDEN
validation.is_valid === false
```

## 23.10 Abgelaufene Runtime-Gruppe

Mutation:

```ts
load_signals[0].validity.expired = true
load_signals[0].validity.usable_for_runtime = true
```

Erwartung:

```ts
errors includes TELCO_GROUP_EXPIRED_RUNTIME_FORBIDDEN
validation.is_valid === false
```

## 23.11 Unbrauchbare Qualität

Mutation:

```ts
load_signals[0].quality.quality_level = 'unusable'
```

Erwartung:

```ts
errors includes TELCO_SIGNAL_QUALITY_UNUSABLE
validation.is_valid === false
```

## 23.12 Kontextschutz

Input:

```ts
const contextBefore = {
  system_adjust: validSystemAdjust,
  regio_content: validRegioContent,
  target_app_ui: validTargetAppUi,
  telco_load: undefined,
  graph: { existing: true },
  route_model: { existing: true }
};
```

Aktion:

```ts
const contextAfter = applyTelcoLoadToContext(contextBefore, validTelcoLoad);
```

Erwartung:

```ts
contextAfter.telco_load exists
contextAfter.system_adjust === contextBefore.system_adjust
contextAfter.regio_content === contextBefore.regio_content
contextAfter.target_app_ui === contextBefore.target_app_ui
contextAfter.graph === contextBefore.graph
contextAfter.route_model === contextBefore.route_model
```

---

# 24. Umsetzungshinweise für Codex/Claude

## 24.1 Erst headless bauen

Zuerst sollen Typen, Schema, Mock-Daten und Validierungslogik gebaut werden. Die UI kommt danach.

Reihenfolge:

```txt
1. telcoLoad.types.ts
2. telcoLoad.mock.ts
3. telcoLoad.validation.ts
4. telcoLoad.context.ts
5. telcoLoad.test.ts
6. TelcoLoadInputPanel.tsx
```

## 24.2 Keine Fachlogik im UI-Container

Die React-Komponente darf nur anzeigen und Aktionen auslösen. Die Validierungslogik gehört in `telcoLoad.validation.ts`.

## 24.3 System-Adjust als Pflichtinput behandeln

Panel 4 muss technisch so gebaut sein, dass der Validator immer den System-Adjust-Stand erhält.

Kein Telco-Load-Batch darf ohne System-Adjust als runtime-gültig gelten.

## 24.4 Regio-Content und Ziel-App UI optional referenzieren

Panel 4 soll auch ohne Regio-Content und Ziel-App UI als generischer Load-Input validierbar sein, aber mit Warnungen.

Sobald Regio-Content vorhanden ist, können regionale Scope- und Parameterbezüge geprüft werden.

Sobald Ziel-App UI vorhanden ist, kann geprüft werden, ob spätere Sensus-Core-Reduktion besonders strikt sein muss.

## 24.5 Keine Engine-Logik vorwegnehmen

Panel 4 darf Load-Daten prüfen, aber nicht auf Graphkanten projizieren, keine Aufenthalte klassifizieren, keine Bewegungsauslastung berechnen und keine Staustellen final bewerten.

## 24.6 Strikte Output-Stabilität

Der Output von Panel 4 ist ein Vertrag. Spätere Panels müssen sich darauf verlassen können.

Deshalb:

- keine wechselnden Feldnamen
- keine UI-spezifischen Feldnamen im Output
- keine Rohsignale im Output
- keine Geräte-IDs im Output
- keine exakten Traces im Output
- keine Signalgruppen unter Mindestaggregation als runtime-verwendbar
- keine abgelaufenen Gruppen als runtime-verwendbar
- keine Datenschutzverletzung als Warnung behandeln, wenn sie blockierend sein muss

---

# 25. Kompakter Codex-Auftrag für Panel 4

```text
Baue Panel 4: Telco-Load Input für die SCIM.

Kontext:
SCIM ist ein Gesamtsystem aus Input-Schicht, SCIM-Engine, Layer-Erzeugung, Sensus-Core-Paketierung, lokaler User-Anwendung und Freigabe. Sensus Core ist die SCIM am Endgerät. Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug, nicht der Engine-Kern. Alle Panels arbeiten auf einem gemeinsamen SCIM-Kontext. Panel 4 darf nur `context.telco_load` schreiben und muss `context.system_adjust` als nicht unterschreitbaren Rahmen lesen. `context.regio_content` und `context.target_app_ui` können optional zur Kontextprüfung berücksichtigt werden.

Aufgabe:
Baue nur Panel 4. Das Panel lädt, normalisiert, validiert und speichert einen aggregierten Telco-Load- beziehungsweise Runtime-Load-Batch. Verändere keine anderen Kontextbereiche außer `context.telco_load`.

Zweck:
Load-Batch, Zeitfenster, räumlichen Scope, Signalgruppen, Signalqualität, Aggregationsniveau, Gültigkeit, Verfall und Datenschutzprüfung bereitstellen.

Nicht-Ziele:
Keine Änderung von System-Adjust, keine Regio-Content-Freigabe, keine Ziel-App-UI-Konfiguration, keine Boundary-Erzeugung, kein Graph, keine Aufenthaltsberechnung, keine Bewegungsauslastung, keine Routenbewertung, kein Layer Composer, kein Sensus-Core-Export und keine lokale User-Auswahl.

Erzeuge:
- TypeScript-Typen
- Mock-Daten
- Validierungsfunktionen
- Kontext-Apply-Funktion
- React-Panel mit Tabs
- Unit-Tests

Tabs:
1. Load-Batch
2. Zeitfenster
3. Signalqualität
4. Aggregationsniveau
5. Gültigkeit und Verfall
6. Datenschutzprüfung

Output:
`TelcoLoadState` mit `telco_load_batch_id`, `source`, `loaded_at`, `provider`, `time_window`, `spatial_scope`, `load_signals`, `aggregation_level`, `signal_quality`, `expiry_rules`, `privacy_check`, `validation`, `status`.

Validierung:
Blockiere fehlenden oder ungültigen System-Adjust, fehlende Batch-Pflichtfelder, ungültige Zeitfenster, Aggregationsfenster außerhalb System-Adjust, zu feine räumliche Auflösung, Signalgruppen unter Mindestaggregation, Einzelgeräte-Sichtbarkeit, Rohsignal-Payloads, Geräte-IDs, exakte Traces, unbrauchbare Signalqualität, abgelaufene Runtime-Gruppen und privacy-blocked Batches.

Akzeptanzkriterien:
Ein gültiger Mock kann geladen, gegen System-Adjust validiert und in `context.telco_load` übernommen werden. Ein ungültiger, veralteter oder datenschutzwidriger Batch blockiert die Übergabe. Die Übergabe verändert keine anderen Kontextbereiche.
```

---

# 26. Kernaussage für Panel 4

Panel 4 ist kein einfacher Datenimport. Es ist der Datenschutz-, Qualitäts- und Gültigkeitsfilter für alle Load-Daten, bevor sie die SCIM-Engine erreichen.

Wenn Panel 4 zu weich gebaut wird, entstehen später fachlich und rechtlich problematische Zustände: einzelne Geräte könnten indirekt sichtbar werden, zu kleine Signalgruppen könnten Aufenthalte erzeugen, veraltete Lastdaten könnten Routen beeinflussen, widersprüchliche Signale könnten Bewegungsauslastung verfälschen oder Debug-/Rohdaten könnten in Sensus Core gelangen.

Deshalb muss Panel 4 als eigenständiges, testbares und gegen System-Adjust hart validierendes Input-Modul gebaut werden. Erst nach erfolgreicher Validierung darf Telco-Load in Aufenthalts-, Bewegungs-, Staustellen- oder Routenlogik einfließen.
