# SCIM Sensus-Core Package Contract

## 0. Zweck dieses Dokuments

Dieses Dokument definiert den verbindlichen Vertrag zwischen der technischen SCIM-Pipeline und Sensus Core beziehungsweise einer Ziel-App.

Es beschreibt:

- was ein Sensus-Core-Paket ist,
- welche Inhalte in das Paket dürfen,
- welche Inhalte niemals in das Paket dürfen,
- welche Datenstrukturen für Ziel-Apps konsumierbar sind,
- welche lokalen Regler erlaubt sind,
- wie Routenoptionen, Layer und Warnungen reduziert werden,
- welche Validierungen vor lokaler Nutzung notwendig sind,
- wie Panel 9, Panel 10, Panel 11 und Panel 12 mit dem Paket umgehen müssen.

Leitsatz:

> Das Sensus-Core-Paket ist die sichere, reduzierte und versionierte Übergabe von SCIM an das Endgerät.

---

## 1. Einordnung in die SCIM-Kette

Das Sensus-Core-Paket entsteht in:

```txt
Panel 9: Sensus-Core Package Builder
```

Es wird konsumiert in:

```txt
Panel 10: Sensus Core lokal
```

Es wird visuell geprüft in:

```txt
Panel 11: Leaflet-Wirkungsprüfung
```

Es wird freigegeben und exportiert in:

```txt
Panel 12: Freigabe und Export
```

Die vorgelagerten Panels erzeugen technische SCIM-Ergebnisse:

```txt
Panel 6 → Graph und Basislayer
Panel 7 → POI, Load, Bewegung, Maskierung
Panel 8 → Routenbewertung und Routendarstellung
```

Panel 9 entscheidet nicht neu, was fachlich richtig ist. Panel 9 entscheidet, welche bereits berechneten Ergebnisse in welcher reduzierten Form an Sensus Core übergeben werden dürfen.

---

## 2. Grundregel

Ein Sensus-Core-Paket darf nur enthalten, was ausdrücklich:

1. durch System-Adjust erlaubt ist,
2. durch Regio-Content freigegeben ist,
3. durch Ziel-App UI sichtbar oder bedienbar gemacht werden darf,
4. durch Panel 8 als Sensus-Core-Kandidat vorbereitet wurde,
5. durch Panel 9 reduziert und validiert wurde,
6. keine Datenschutz-, Debug- oder Operatorgrenze verletzt.

Kurzform:

```txt
Nicht ausdrücklich erlaubt = nicht im Paket.
```

---

## 3. Nicht erlaubte Inhalte

Folgende Inhalte dürfen niemals in ein produktives Sensus-Core-Paket gelangen:

- Rohsignale,
- Einzelsignale,
- einzelne Geräte,
- Device Counts,
- exakte Signalgruppen,
- individuelle Bewegungswege,
- individuelle Aufenthaltsdauer,
- nicht aggregierte Standortpunkte,
- Debug-GeoJSON,
- Graph-Debuglayer,
- interne Score-Zwischenwerte,
- Operatornotizen,
- Operator-only Layer,
- debug-only Layer,
- abgelehnte POI-Kandidaten,
- pending POIs,
- nicht freigegebene Regio-Content-Entwürfe,
- nicht freigegebene Ziel-App-Profile,
- nicht freigegebene Routenoptionen,
- nicht freigegebene Layer,
- interne Validierungsdetails, sofern sie nicht explizit als öffentliche Warnung reduziert wurden.

---

## 4. Paket-Kernstruktur

Empfohlenes Kernmodell:

```ts
export interface SensusCorePackageState {
  package_id: string;
  representation_id: string;
  package_version: string;
  package_kind: SensusCorePackageKind;
  created_at: string;
  created_by?: string;

  source_refs: SensusCorePackageSourceRefs;
  parameter_versions: SensusCoreParameterVersions;

  public_layers: PublicLayer[];
  route_options: PublicRouteOption[];
  allowed_local_controls: LocalControlConfig[];
  public_warnings: PublicWarning[];

  display_contract: SensusCoreDisplayContract;
  reduction_summary: ReductionSummary;
  excluded_content_summary: ExcludedContentSummary;

  validation: SensusCorePackageValidationResult;
  privacy_status: SensusCorePackagePrivacyStatus;
  package_summary: SensusCorePackageSummary;
  status: SensusCorePackageStatus;
}
```

---

## 5. Paketarten

```ts
export type SensusCorePackageKind =
  | 'draft_package'
  | 'test_package'
  | 'staging_package'
  | 'production_candidate'
  | 'production_package';
```

Regeln:

```txt
draft_package              → darf Mockdaten enthalten, nicht produktiv exportieren
test_package               → darf Simulation enthalten, nicht öffentlich freigeben
staging_package            → darf reale Struktur testen, aber nur intern
production_candidate       → bereit für Panel 11 und Panel 12
production_package         → durch Panel 12 freigegeben
```

---

## 6. Paketstatus

```ts
export type SensusCorePackageStatus =
  | 'not_created'
  | 'building'
  | 'sensus_core_package_created_unvalidated'
  | 'validating'
  | 'sensus_core_package_ready'
  | 'sensus_core_package_warning'
  | 'sensus_core_package_invalid'
  | 'sensus_core_package_privacy_blocked'
  | 'sensus_core_package_error';
```

Für Panel 10 gilt:

```txt
sensus_core_package_ready   → lokale Nutzung erlaubt
sensus_core_package_warning → lokale Nutzung nur, wenn Warnungen nicht blockierend sind
invalid/error/privacy_blocked → lokale Nutzung blockiert
```

---

## 7. SourceRefs

Das Paket muss nachvollziehbar machen, aus welchen SCIM-Zuständen es erzeugt wurde.

```ts
export interface SensusCorePackageSourceRefs {
  system_adjust_version: string;
  regio_content_version: string;
  target_app_ui_version: string;
  representation_id: string;
  boundary_id?: string;
  scim_context_id?: string;
  graph_id?: string;
  basis_layer_id?: string;
  poi_model_id?: string;
  load_projection_id?: string;
  movement_model_id?: string;
  masking_model_id?: string;
  route_model_id?: string;
  route_layer_model_id?: string;
  leaflet_route_check_id?: string;
}
```

Pflicht für produktive Pakete:

```txt
system_adjust_version
regio_content_version
target_app_ui_version
representation_id
route_model_id
```

---

## 8. ParameterVersions

Das Paket muss seine Parameterstände versionieren.

```ts
export interface SensusCoreParameterVersions {
  system_adjust_version: string;
  privacy_rule_version: string;
  aggregation_rule_version?: string;
  regio_content_version: string;
  regional_parameter_version?: string;
  target_app_ui_version: string;
  reduction_profile_version: string;
  route_profile_version?: string;
  package_builder_version: string;
}
```

Regel:

> Eine Ziel-App darf ein Paket nur nutzen, wenn sie die verwendete Paket- und Reduktionsversion versteht.

---

## 9. PublicLayer

Öffentliche Layer sind reduzierte, ziel-app-taugliche Layer.

```ts
export interface PublicLayer {
  layer_id: string;
  layer_type: PublicLayerType;
  label?: string;
  geometry_format: PublicGeometryFormat;
  features: PublicLayerFeature[];
  visibility: PublicLayerVisibility;
  default_visible: boolean;
  user_toggle_allowed: boolean;
  min_zoom?: number;
  max_zoom?: number;
  reduction_level: ReductionLevel;
  data_class: PublicDataClass;
  source_layer_ref?: string;
  validation: PublicLayerValidationResult;
  status: PublicLayerStatus;
}
```

### 9.1 PublicLayerType

```ts
export type PublicLayerType =
  | 'base_paths_reduced'
  | 'approved_pois_reduced'
  | 'stay_areas_reduced'
  | 'movement_load_reduced'
  | 'route_options'
  | 'route_warnings'
  | 'regional_restrictions_reduced'
  | 'jam_indicators_reduced';
```

Nicht erlaubt:

```ts
'raw_signals'
'debug_graph'
'operator_internal'
'device_points'
'load_signal_groups_raw'
```

### 9.2 PublicGeometryFormat

```ts
export type PublicGeometryFormat =
  | 'geojson'
  | 'vector_tile'
  | 'encoded_polyline'
  | 'native_map_layer';
```

### 9.3 PublicLayerVisibility

```ts
export type PublicLayerVisibility =
  | 'sensus_core_visible'
  | 'hidden_by_default'
  | 'available_on_toggle';
```

Nicht erlaubt im Paket:

```txt
operator_preview_only
debug_only
```

Diese dürfen in Panel 8 oder Panel 11 existieren, aber nicht in `public_layers`.

### 9.4 PublicDataClass

```ts
export type PublicDataClass =
  | 'public_aggregate'
  | 'reduced_scim_result'
  | 'public_route'
  | 'public_warning'
  | 'public_regional_notice';
```

---

## 10. PublicLayerFeature

```ts
export interface PublicLayerFeature {
  feature_id: string;
  geometry: GeoJsonGeometry | EncodedGeometryRef;
  properties: PublicLayerFeatureProperties;
}
```

```ts
export interface PublicLayerFeatureProperties {
  label?: string;
  category?: string;
  display_level?: DisplayLevel;
  public_score_class?: PublicScoreClass;
  warning_level?: PublicWarningLevel;
  route_option_ids?: string[];
  poi_ref_public_id?: string;
  restriction_ref_public_id?: string;
  valid_from?: string;
  valid_until?: string;
}
```

Nicht erlaubt in `properties`:

```txt
device_count
signal_count
raw_score
debug_score
internal_edge_id
internal_node_id
operator_note
raw_signal_group_id
telco_provider_internal_id
unreduced_load_value
```

Interne IDs dürfen nur übernommen werden, wenn sie als öffentliche IDs neu erzeugt und nicht rückführbar sind.

---

## 11. DisplayLevel

```ts
export type DisplayLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'unknown';
```

`DisplayLevel` ersetzt technische Detailwerte.

Beispiel:

```txt
movement_load_score = 0.83
```

darf in Sensus Core nicht als Rohscore erscheinen, sondern zum Beispiel als:

```txt
display_level = high
public_score_class = high_load
```

---

## 12. PublicScoreClass

```ts
export type PublicScoreClass =
  | 'not_relevant'
  | 'low_load'
  | 'moderate_load'
  | 'high_load'
  | 'very_high_load'
  | 'unknown';
```

Regel:

> PublicScoreClass darf keine exakten Signalzahlen oder internen Modellwerte offenlegen.

---

## 13. PublicRouteOption

Routenoptionen sind reduzierte, nutzbare Routenvorschläge.

```ts
export interface PublicRouteOption {
  route_option_id: string;
  label?: string;
  route_mode: PublicRouteMode;
  geometry: GeoJsonLineString | EncodedPolyline;
  distance_meters?: number;
  estimated_duration_seconds?: number;

  route_status: PublicRouteStatus;
  route_quality: PublicRouteQuality;
  load_summary: PublicRouteLoadSummary;
  warning_refs: string[];

  section_summaries: PublicRouteSectionSummary[];

  allowed_local_effects: AllowedLocalRouteEffects;
  source_route_ref?: string;
  validation: PublicRouteOptionValidationResult;
  status: PublicRouteOptionStatus;
}
```

### 13.1 PublicRouteMode

```ts
export type PublicRouteMode =
  | 'fastest'
  | 'shortest'
  | 'low_load'
  | 'quiet'
  | 'fallback_allowed'
  | 'custom_profile';
```

Regel:

> Eine Route darf nur enthalten sein, wenn `route_mode` im Ziel-App-UI-Profil erlaubt ist.

### 13.2 PublicRouteStatus

```ts
export type PublicRouteStatus =
  | 'recommended'
  | 'available'
  | 'available_with_warning'
  | 'fallback_only'
  | 'not_recommended';
```

Nicht erlaubt als sichtbare Route:

```txt
debug_only
excluded
invalid
privacy_blocked
```

### 13.3 PublicRouteQuality

```ts
export interface PublicRouteQuality {
  public_quality_class: 'good' | 'acceptable' | 'limited' | 'unknown';
  explanation_code?: PublicRouteExplanationCode;
}
```

```ts
export type PublicRouteExplanationCode =
  | 'low_load_route'
  | 'short_route'
  | 'fast_route'
  | 'contains_warning'
  | 'contains_degraded_sections'
  | 'fallback_due_to_no_better_option'
  | 'data_quality_limited';
```

---

## 14. PublicRouteLoadSummary

```ts
export interface PublicRouteLoadSummary {
  overall_load_class: PublicScoreClass;
  stay_context_class?: PublicScoreClass;
  movement_context_class?: PublicScoreClass;
  has_high_load_sections: boolean;
  has_stay_area_contact: boolean;
  has_regional_warning: boolean;
  has_fallback_sections: boolean;
}
```

Nicht erlaubt:

```txt
exakte Signalgruppen
exakte Gerätezahl
exakte Load-Rohwerte
interne Gewichtungen
Debug-Konfidenzen
```

---

## 15. PublicRouteSectionSummary

```ts
export interface PublicRouteSectionSummary {
  public_section_id: string;
  geometry?: GeoJsonLineString | EncodedPolyline;
  section_status: PublicRouteSectionStatus;
  display_level: DisplayLevel;
  warning_refs: string[];
}
```

```ts
export type PublicRouteSectionStatus =
  | 'normal'
  | 'warning'
  | 'degraded'
  | 'fallback_only'
  | 'unknown';
```

Nicht erlaubt:

```txt
internal_edge_ids
internal_node_ids
raw_load_values
signal_group_refs
operator_debug_status
```

---

## 16. AllowedLocalControls

Lokale Regler definieren, was der Ziel-App-User verändern darf.

```ts
export interface LocalControlConfig {
  control_id: string;
  control_type: LocalControlType;
  label?: string;
  default_value: LocalControlValue;
  allowed_range?: NumericRange;
  allowed_values?: LocalControlValue[];
  affects: LocalControlEffect[];
  system_limited: boolean;
  regio_limited: boolean;
  validation: LocalControlValidationResult;
}
```

### 16.1 LocalControlType

```ts
export type LocalControlType =
  | 'route_mode_select'
  | 'load_tolerance'
  | 'stay_context_tolerance'
  | 'display_intensity'
  | 'layer_toggle'
  | 'warning_visibility'
  | 'fallback_route_toggle';
```

### 16.2 LocalControlEffect

```ts
export type LocalControlEffect =
  | 'filter_route_options'
  | 'sort_route_options'
  | 'toggle_public_layer'
  | 'adjust_display_intensity'
  | 'filter_public_warnings'
  | 'allow_fallback_routes';
```

Nicht erlaubt:

```txt
change_system_adjust
change_regio_content
change_route_model
change_raw_scores
change_privacy_limits
reactivate_debug_layer
```

### 16.3 Regel für lokale Regler

Lokale Regler dürfen:

- Routen filtern,
- Routen sortieren,
- erlaubte Layer ein- oder ausblenden,
- Darstellung intensivieren oder reduzieren,
- Warnungen anzeigen oder reduzieren,
- Fallback-Routen zulassen, wenn erlaubt.

Lokale Regler dürfen nicht:

- SCIM fachlich neu berechnen,
- Systemgrenzen überschreiben,
- regionale Sperren ignorieren,
- ausgeschlossene Inhalte reaktivieren,
- nicht paketierte Layer sichtbar machen.

---

## 17. PublicWarning

```ts
export interface PublicWarning {
  warning_id: string;
  warning_type: PublicWarningType;
  warning_level: PublicWarningLevel;
  message_key: string;
  fallback_message?: string;
  related_route_option_ids?: string[];
  related_layer_ids?: string[];
  related_public_section_ids?: string[];
  valid_from?: string;
  valid_until?: string;
  display_policy: PublicWarningDisplayPolicy;
}
```

### 17.1 PublicWarningType

```ts
export type PublicWarningType =
  | 'high_movement_load'
  | 'high_stay_context'
  | 'route_contains_degraded_section'
  | 'route_contains_regional_warning'
  | 'fallback_route_used'
  | 'data_quality_limited'
  | 'route_option_limited'
  | 'regional_restriction';
```

### 17.2 PublicWarningLevel

```ts
export type PublicWarningLevel =
  | 'info'
  | 'notice'
  | 'warning'
  | 'strong_warning';
```

Nicht erlaubt:

```txt
operator_internal_error
debug_trace
raw_signal_warning
device_count_warning
```

### 17.3 PublicWarningDisplayPolicy

```ts
export interface PublicWarningDisplayPolicy {
  show_in_route_list: boolean;
  show_on_map: boolean;
  show_before_navigation?: boolean;
  dismissible: boolean;
}
```

---

## 18. DisplayContract

Der DisplayContract sagt der Ziel-App, wie das Paket dargestellt werden darf.

```ts
export interface SensusCoreDisplayContract {
  map_mode: 'leaflet_view' | 'native_map_view' | 'hybrid';
  default_visible_layer_ids: string[];
  available_layer_ids: string[];
  route_mode_order: PublicRouteMode[];
  warning_display_mode: 'minimal' | 'standard' | 'detailed_public';
  score_display_mode: 'classes_only' | 'classes_with_explanation';
  geometry_detail_level: 'reduced' | 'standard_public';
  offline_supported: boolean;
  language_defaults?: LanguageDisplayConfig;
}
```

Regel:

> `detailed_public` bedeutet nicht Debug. Es bedeutet nur ausführlichere öffentliche Erklärung.

---

## 19. ReductionSummary

```ts
export interface ReductionSummary {
  reduction_profile_version: string;
  removed_raw_signals: boolean;
  removed_device_data: boolean;
  removed_debug_layers: boolean;
  removed_operator_notes: boolean;
  removed_internal_ids: boolean;
  reduced_scores_to_classes: boolean;
  reduced_geometries: boolean;
  public_ids_rewritten: boolean;
  warnings_reduced: boolean;
}
```

Alle produktiven Pakete müssen mindestens erfüllen:

```txt
removed_raw_signals = true
removed_device_data = true
removed_debug_layers = true
removed_operator_notes = true
reduced_scores_to_classes = true
```

---

## 20. ExcludedContentSummary

Das Paket muss dokumentieren, was bewusst nicht übernommen wurde.

```ts
export interface ExcludedContentSummary {
  excluded_operator_layer_count: number;
  excluded_debug_layer_count: number;
  excluded_raw_signal_group_count?: number;
  excluded_rejected_poi_count?: number;
  excluded_pending_poi_count?: number;
  excluded_route_option_count?: number;
  exclusion_reasons: ExclusionReason[];
}
```

```ts
export type ExclusionReason =
  | 'debug_only'
  | 'operator_only'
  | 'raw_data'
  | 'privacy_blocked'
  | 'not_released'
  | 'not_allowed_by_target_app_ui'
  | 'not_allowed_by_system_adjust'
  | 'invalid_status'
  | 'unsupported_by_package_contract';
```

Wichtig:

> `ExcludedContentSummary` darf zählen und klassifizieren, aber keine ausgeschlossenen Rohdetails rekonstruierbar machen.

---

## 21. PrivacyStatus

```ts
export interface SensusCorePackagePrivacyStatus {
  raw_signals_absent: boolean;
  device_level_data_absent: boolean;
  debug_data_absent: boolean;
  operator_notes_absent: boolean;
  only_released_regio_content: boolean;
  only_allowed_target_app_layers: boolean;
  scores_reduced: boolean;
  public_ids_non_reversible: boolean;
  privacy_blockers: SensusCorePrivacyIssue[];
  status: 'valid' | 'warning' | 'blocked';
}
```

Produktionsregel:

```txt
privacy_status.status must be valid
privacy_blockers must be empty
```

---

## 22. ValidationResult

```ts
export interface SensusCorePackageValidationResult {
  checked_at: string;
  valid: boolean;
  warnings: SensusCorePackageIssue[];
  errors: SensusCorePackageIssue[];
  blockers: SensusCorePackageIssue[];
}
```

```ts
export interface SensusCorePackageIssue {
  issue_id: string;
  severity: 'info' | 'warning' | 'error' | 'blocker';
  code: SensusCorePackageIssueCode;
  message: string;
  affected_object_ref?: string;
}
```

### 22.1 Issue Codes

```ts
export type SensusCorePackageIssueCode =
  | 'missing_system_adjust'
  | 'missing_regio_content'
  | 'missing_target_app_ui'
  | 'missing_route_model'
  | 'invalid_route_option'
  | 'invalid_public_layer'
  | 'raw_signal_data_detected'
  | 'device_level_data_detected'
  | 'debug_data_detected'
  | 'operator_note_detected'
  | 'unreleased_poi_detected'
  | 'target_app_layer_not_allowed'
  | 'route_mode_not_allowed'
  | 'local_control_out_of_range'
  | 'reduction_profile_missing'
  | 'public_id_not_rewritten'
  | 'privacy_status_blocked'
  | 'unsupported_package_version';
```

---

## 23. Paketvalidierung

Panel 9 muss mindestens prüfen:

### 23.1 Input-Prüfung

```txt
system_adjust vorhanden und gültig
regio_content vorhanden und gültig
target_app_ui vorhanden und gültig
route_model vorhanden und gültig
route_layer_model vorhanden oder bewusst nicht erforderlich
```

### 23.2 Layer-Prüfung

```txt
nur erlaubte Layerklassen
keine debug-only Layer
keine operator-only Layer
keine Rohsignal-Layer
alle Features reduziert
alle Properties erlaubt
```

### 23.3 Routen-Prüfung

```txt
nur erlaubte Routentypen
keine invaliden Routen
keine debug-only Routen
keine ausgeschlossenen Routen als sichtbar
Warnungen reduziert
Abschnitte öffentlich abstrahiert
```

### 23.4 Regler-Prüfung

```txt
nur allowed_local_controls aus Ziel-App UI
Wertebereiche innerhalb System-Adjust
keine Regler mit Zugriff auf System- oder Regio-Parameter
keine Regler zur Reaktivierung von Debugdaten
```

### 23.5 Datenschutz-Prüfung

```txt
keine Rohsignale
keine Geräteinformationen
keine exakten Signalgruppen
keine Operatornotizen
keine internen Debugwerte
keine nicht freigegebenen Inhalte
```

---

## 24. Panel-9-Verantwortung

Panel 9 darf:

- Paket aus zulässigen Kandidaten bauen,
- öffentliche Layer filtern,
- Routenoptionen reduzieren,
- lokale Regler vorbereiten,
- öffentliche Warnungen reduzieren,
- Debug- und Rohdaten entfernen,
- Paket validieren,
- Paket in `context.sensus_core_package` schreiben.

Panel 9 darf nicht:

- neue Aufenthalte berechnen,
- Bewegung neu bewerten,
- Routen fachlich neu berechnen,
- Ziel-App UI ändern,
- Regio-Content ändern,
- System-Adjust ändern,
- lokale User-Auswahl anwenden,
- finale Freigabe durchführen.

---

## 25. Panel-10-Konsumregeln

Panel 10 darf ein Paket nur konsumieren, wenn:

```txt
status = sensus_core_package_ready
oder status = sensus_core_package_warning mit nicht blockierenden Warnungen
```

Panel 10 darf:

- lokale Routenauswahl anwenden,
- lokale Toleranzen innerhalb Paketgrenzen anwenden,
- Routen filtern und sortieren,
- Layer ein- und ausblenden,
- Warnungen filtern,
- View State erzeugen.

Panel 10 darf nicht:

- Paket verändern,
- neue Route Options erzeugen,
- neue Layer aus Engine-Daten ergänzen,
- Debugdaten reaktivieren,
- Rohdaten anzeigen,
- System-Adjust oder Regio-Content überschreiben,
- SCIM-Wahrheit neu berechnen.

Kurzregel:

```txt
Was nicht im Paket ist, existiert für Panel 10 nicht.
```

---

## 26. Panel-11-Prüfregeln

Panel 11 muss prüfen:

- Sensus-Core-Vorschau zeigt nur Paket- und View-State-Inhalte,
- Operator-Vorschau und Sensus-Core-Vorschau sind getrennt,
- keine Debugdaten in Sensus-Core-Vorschau,
- keine Rohdaten in Sensus-Core-Vorschau,
- sichtbare Route Options entsprechen dem Paket,
- sichtbare Warnungen entsprechen dem Paket oder View State,
- POI- und Radiusdarstellung ist reduziert und freigegeben,
- Originalwege-Vergleich ist räumlich plausibel.

Panel 11 darf nicht:

- Paket verändern,
- lokale Auswahl verändern,
- Routen neu berechnen,
- Fehler stillschweigend reparieren.

---

## 27. Panel-12-Freigaberegeln

Panel 12 darf ein Paket nur freigeben, wenn:

```txt
sensus_core_package.status = sensus_core_package_ready
leaflet_effect_check.ready_for_release_panel = true
blocking_issue_count = 0
sensus_core_reduction_valid = true
privacy_status.status = valid
```

Panel 12 muss exportieren können:

- Sensus-Core-Paket,
- öffentliche Layer,
- reduzierte Routenoptionen,
- öffentliche Warnungen,
- Release-Manifest,
- optional Operator-Archiv, strikt getrennt.

Öffentliche Exporte dürfen keine internen oder ausgeschlossenen Inhalte enthalten.

---

## 28. Ziel-App-Konsum

Eine Ziel-App konsumiert nicht die SCIM-Engine direkt, sondern nur das Sensus-Core-Paket.

Empfohlene Ziel-App-Ladefunktionen:

```ts
loadSensusCorePackage(packageId: string): Promise<SensusCorePackageState>;

validatePackageForTargetApp(
  packageState: SensusCorePackageState,
  appCapabilities: TargetAppCapabilities
): TargetAppPackageValidationResult;

createLocalSensusCoreState(
  packageState: SensusCorePackageState,
  userSelection: LocalUserSelection
): SensusCoreLocalState;

buildSensusCoreView(
  packageState: SensusCorePackageState,
  localState: SensusCoreLocalState
): SensusCoreViewState;
```

### 28.1 TargetAppCapabilities

```ts
export interface TargetAppCapabilities {
  supported_package_versions: string[];
  supported_geometry_formats: PublicGeometryFormat[];
  supported_layer_types: PublicLayerType[];
  supported_route_modes: PublicRouteMode[];
  supports_offline: boolean;
  supports_warning_display: boolean;
  supports_layer_toggles: boolean;
  supports_route_sorting: boolean;
}
```

Die Ziel-App muss Pakete ablehnen, wenn:

- Paketversion nicht unterstützt wird,
- Geometrieformat nicht unterstützt wird,
- Pflichtlayer nicht darstellbar sind,
- Routentypen nicht verstanden werden,
- Datenschutzstatus nicht gültig ist.

---

## 29. Minimalbeispiel Paket

```json
{
  "package_id": "scp_001",
  "representation_id": "rep_001",
  "package_version": "1.0.0",
  "package_kind": "production_candidate",
  "created_at": "2026-05-21T08:00:00Z",
  "source_refs": {
    "system_adjust_version": "sys_v1",
    "regio_content_version": "regio_v1",
    "target_app_ui_version": "ui_v1",
    "representation_id": "rep_001",
    "route_model_id": "route_model_001"
  },
  "parameter_versions": {
    "system_adjust_version": "sys_v1",
    "privacy_rule_version": "privacy_v1",
    "regio_content_version": "regio_v1",
    "target_app_ui_version": "ui_v1",
    "reduction_profile_version": "reduce_v1",
    "package_builder_version": "package_builder_v1"
  },
  "public_layers": [],
  "route_options": [],
  "allowed_local_controls": [],
  "public_warnings": [],
  "reduction_summary": {
    "reduction_profile_version": "reduce_v1",
    "removed_raw_signals": true,
    "removed_device_data": true,
    "removed_debug_layers": true,
    "removed_operator_notes": true,
    "removed_internal_ids": true,
    "reduced_scores_to_classes": true,
    "reduced_geometries": true,
    "public_ids_rewritten": true,
    "warnings_reduced": true
  },
  "privacy_status": {
    "raw_signals_absent": true,
    "device_level_data_absent": true,
    "debug_data_absent": true,
    "operator_notes_absent": true,
    "only_released_regio_content": true,
    "only_allowed_target_app_layers": true,
    "scores_reduced": true,
    "public_ids_non_reversible": true,
    "privacy_blockers": [],
    "status": "valid"
  },
  "status": "sensus_core_package_ready"
}
```

---

## 30. Tests für den Package Contract

## 30.1 Pflicht-Tests

```txt
builds package from valid route model
rejects missing target_app_ui
rejects debug layer in public_layers
rejects raw signal properties
rejects device_count property
rejects unreleased POIs
rejects route mode not allowed by target_app_ui
rejects local control outside allowed system range
rewrites internal ids to public ids
reduces scores to public classes
creates excluded_content_summary
blocks package when privacy_status is blocked
Panel 10 can consume ready package
Panel 10 cannot consume invalid package
Panel 11 preview shows only package/view content
Panel 12 releases only checked package
```

## 30.2 Negativtests

```txt
debug_geojson in layer properties → blocker
operator_note in warning → blocker
raw_score in route section → blocker
signal_group_id in public feature → blocker
device_count in route load summary → blocker
pending_poi in approved POI layer → blocker
route_option debug_only = true → blocker
package without reduction_profile_version → blocker
```

---

## 31. Empfohlene Dateistruktur

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

Zusätzlich für Ziel-App-Konsum:

```txt
src/scim/sensus-core-local/
  sensusCoreLocal.packageGuard.ts
  sensusCoreLocal.userSelection.ts
  sensusCoreLocal.routeFilter.ts
  sensusCoreLocal.layerComposer.ts
  sensusCoreLocal.warningFilter.ts
  sensusCoreLocal.viewState.ts
```

---

## 32. Kurzfazit

Der Sensus-Core Package Contract ist die wichtigste Grenze zwischen SCIM-Engine und Ziel-App.

Er stellt sicher:

- Ziel-App konsumiert nur reduzierte Ergebnisse,
- lokale User-Auswahl bleibt innerhalb erlaubter Grenzen,
- Debug-, Roh- und Operator-Daten bleiben ausgeschlossen,
- Routen und Layer sind öffentlich abstrahiert,
- Datenschutz wird nicht erst im Export, sondern bereits beim Paketbau gesichert,
- Panel 10 kann ohne Zugriff auf Engine-Interna arbeiten,
- Panel 11 und Panel 12 können klar prüfen, was sichtbar und exportfähig ist.

Leitsatz:

> Sensus Core bekommt kein internes SCIM. Sensus Core bekommt ein geprüftes, reduziertes und zweckgebundenes SCIM-Paket.
