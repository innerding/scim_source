# SCIM Panel 3 – Ziel-App UI Input

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor jeden konkreten Panel-Auftrag. Sie stellt sicher, dass Panel 3 nicht als isolierte App-Konfiguration gebaut wird, sondern als verbindlicher Ausspiel- und Reduktionsbaustein der gesamten SCIM-Kette.

### 0.1 SCIM-Gesamtsystem

SCIM ist ein Gesamtsystem aus:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokaler Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 3 liegt in der Input- und Steuerungsschicht. Es erzeugt keine Routen, keine Bewegungsauslastung, keine Aufenthaltsbereiche und keine Layer. Es definiert, welche berechneten SCIM-Ergebnisse später in Sensus Core bzw. in der Ziel-App sichtbar, bedienbar, reduzierbar oder verborgen sein dürfen.

### 0.2 Rollenklärung

**SCIM-Engine**  
Der rechnerische Kern. Sie verarbeitet später Boundary, Regio-Content, Telco-Load, Graph, POIs, Aufenthalte, Bewegung, Maskierung und Routenbewertung.

**Leaflet**  
Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug. Leaflet ist nicht die Engine. Für Panel 3 ist Leaflet vor allem relevant, weil spätere Operator- und Ziel-App-Vorschauen prüfen müssen, welche Layer gemäß Ziel-App UI Input sichtbar oder verborgen sind.

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät bzw. in der laufzeitnahen App-Representation. Sensus Core darf nur freigegebene, reduzierte und datenschutzkonforme SCIM-Ergebnisse erhalten.

**Ziel-App UI Input**  
Panel 3 definiert das Ausspielprofil für Sensus Core und die Ziel-App. Es legt fest:

- welche Layer sichtbar sein dürfen,
- welche Routentypen angeboten werden,
- welche lokalen User-Regler erlaubt sind,
- welche Hinweise und Warnungen angezeigt werden,
- welche technischen Werte reduziert oder verborgen werden,
- welche Debug-, Roh- und Operator-Daten ausgeschlossen bleiben.

### 0.3 Gemeinsamer SCIM-Kontext

Alle Panels arbeiten auf einem gemeinsamen SCIM-Kontext. Jedes Panel darf nur seinen eigenen Bereich verändern.

Grundstruktur:

```ts
export interface ScimContext {
  representation_id?: string;
  system_adjust?: SystemAdjustState;
  regio_content?: RegioContentState;
  target_app_ui?: TargetAppUiState;
  telco_load?: unknown;
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

Panel 3 darf nur schreiben in:

```ts
context.target_app_ui
```

Panel 3 darf lesen aus:

```ts
context.system_adjust
context.regio_content
```

Panel 3 darf nicht schreiben in:

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

Panel 3 ist besonders wichtig, weil es später bestimmt, welche Engine-Ergebnisse überhaupt endgerätetauglich werden dürfen. Ohne Panel 3 kann zwar gerechnet werden, aber es ist unklar, welche Layer, Routenoptionen, Warnungen und lokalen Regler in Sensus Core zulässig sind.

### 0.5 Datenschutzgrenze

Panel 3 darf keine Datenschutzgrenzen aufweichen. Es muss explizit verhindern, dass Rohdaten, Einzelsignale, Debug-Daten oder Operator-interne Werte in Sensus Core sichtbar werden.

Nicht erlaubt in Sensus Core:

- Rohsignale
- Einzelsignale
- einzelne Geräte
- individuelle Bewegungswege
- individuelle Aufenthaltsdauer
- Debug-Rohwerte
- Operator-interne Prüfwerte
- nicht freigegebene Regio-Content-Entwürfe
- abgelehnte POI-Kandidaten als User-Ausgabe
- ungeprüfte technische Layer

Panel 3 verarbeitet selbst keine Load-Signale. Es definiert aber das Ausspiel- und Reduktionsprofil, mit dem spätere Pakete gefiltert werden.

### 0.6 System-Adjust-Vorrang

Panel 3 ist abhängig von `context.system_adjust`.

Ohne gültigen System-Adjust-Stand darf kein Ziel-App UI Profil als runtime-gültig übernommen werden.

System-Adjust begrenzt für Panel 3 insbesondere:

- Datenschutzgrenzen
- erlaubte Feature Flags
- zulässige User-Toleranzbereiche
- zulässige Routenschwellen
- Ausschluss von Rohdaten in Sensus Core
- Ausschluss von Debug-Daten in Sensus Core
- Mindestaggregation für sichtbare Auslastungsinformationen
- erlaubte Bewertungs- und Abwertungsmodi

### 0.7 Regio-Content-Abhängigkeit

Panel 3 kann Regio-Content berücksichtigen, muss ihn aber nicht zwingend vollständig voraussetzen.

Wenn `context.regio_content` vorhanden ist, muss Panel 3 prüfen:

- ob sichtbare POI-Layer nur freigegebene POIs enthalten dürfen,
- ob regionale Hinweise nur gemäß Sichtbarkeit angezeigt werden dürfen,
- ob regionale Routentypen mit dem Ziel-App-Profil kompatibel sind,
- ob regionale Sperren und Warnungen korrekt auf Ziel-App-Hinweise abgebildet werden können.

Wenn Regio-Content fehlt, darf Panel 3 als generisches Profil geladen und validiert werden. Runtime-Wirkung kann später aber erst nach vollständiger Kontextprüfung entstehen.

### 0.8 Trennung von Darstellung und Bewertung

Panel 3 muss Darstellung und Bewertung strikt trennen.

Beispiele:

- Ein Layer kann sichtbar sein, ohne eine Route zu verändern.
- Eine Warnung kann angezeigt werden, ohne einen Abschnitt auszuschließen.
- Ein Abschnitt kann für einen Routentyp ausgeschlossen werden, aber in der Karte weiterhin als ausgelastet sichtbar bleiben.
- Ein User-Regler darf lokale Darstellung oder Sortierung beeinflussen, aber keine System- oder Regio-Grenzen überschreiben.

Leitsatz:

> Panel 3 definiert, was die Ziel-App sehen und bedienen darf. Es berechnet nicht selbst, was fachlich richtig ist.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**Ziel-App UI Input**

Technischer Modulname:

```ts
TargetAppUiInputPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
loadTargetAppUiProfile()
normalizeTargetAppUi()
validateTargetAppUi()
applyTargetAppUiToContext()
validateVisibleLayersAgainstSystemAdjust()
validateUserControlsAgainstSystemAdjust()
validateRouteModesAgainstSystemAdjust()
validateReductionProfile()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/target-app-ui/
  TargetAppUiInputPanel.tsx
  targetAppUi.types.ts
  targetAppUi.schema.ts
  targetAppUi.defaults.ts
  targetAppUi.mock.ts
  targetAppUi.validation.ts
  targetAppUi.service.ts
  targetAppUi.context.ts
  targetAppUi.test.ts
```

---

# 2. Zweck des Panels

Panel 3 lädt, zeigt, normalisiert und validiert ein Ziel-App- bzw. Sensus-Core-Ausspielprofil.

Es beantwortet für spätere Panels:

- Welches Ziel-App-Profil ist aktiv?
- Welche Layer dürfen in Sensus Core sichtbar sein?
- Welche Layer bleiben operator-only oder debug-only?
- Welche Routentypen dürfen angeboten werden?
- Welche lokalen User-Regler sind erlaubt?
- In welchen Grenzen dürfen lokale Toleranzen wirken?
- Welche Hinweise und Warnungen dürfen ausgespielt werden?
- Welche technischen SCIM-Werte müssen reduziert, gerundet, abstrahiert oder verborgen werden?
- Darf das Profil für einen Sensus-Core Package Builder verwendet werden?

Leitsatz:

> Panel 3 erzeugt den Ausspielvertrag zwischen technischer SCIM-Pipeline und nutzergeeigneter Sensus-Core-Darstellung.

---

# 3. Nicht-Ziele

Panel 3 darf nicht:

- System-Adjust-Grenzen ändern
- regionale POIs freigeben
- POI-Radien setzen
- Telco-Load-Daten laden
- Runtime-Signale verarbeiten
- Aufenthalte klassifizieren
- Bewegungsauslastung berechnen
- Routenabschnitte bewerten
- Leaflet-Layer erzeugen
- Sensus-Core-Pakete final exportieren
- lokale User-Auswahl anwenden

Panel 3 definiert nur, was später sichtbar, bedienbar und exportfähig sein darf.

---

# 4. Fachliche Verantwortung

Panel 3 hat sechs fachliche Kernaufgaben:

## 4.1 Ziel-App-Profil laden

Das Panel lädt ein Ziel-App- oder Sensus-Core-Profil aus einer Quelle, zum Beispiel:

- Sensus-Core-Konfiguration
- Ziel-App-Konfigurationsservice
- lokaler Mock-Service
- statische JSON-Konfiguration
- späterer Backend-Endpunkt

## 4.2 Sichtbare Layer definieren

Das Panel legt fest, welche SCIM-Layer später in Sensus Core sichtbar sein dürfen.

Layer können sein:

- Bewegungsauslastung
- Aufenthaltsdichte
- freigegebene POIs
- reduzierte POI-Radien
- Staustellenhinweise
- Routenvorschläge
- Warnungen
- Sperren oder Hinweise

Nicht sichtbar sein dürfen:

- Rohsignale
- Einzelsignale
- Debug-Layer
- Operator-interne Layer
- abgelehnte POI-Kandidaten
- nicht freigegebene Inhalte

## 4.3 Routentypen definieren

Das Panel definiert, welche Routentypen die Ziel-App anbieten darf.

Beispiele:

- schnellste Route
- kürzeste Route
- auslastungsarme Route
- ruhige Route
- fallback-erlaubte Route
- barrierearme oder profilabhängige Route, falls später unterstützt

Panel 3 definiert nur die verfügbaren Modi und deren UI-Regeln. Die eigentliche Bewertung erfolgt später in der Routenbewertung.

## 4.4 Erlaubte User-Regler definieren

Das Panel legt fest, welche lokalen Regler der Ziel-App-User verändern darf.

Beispiele:

- Auslastungstoleranz
- Aufenthaltsdichte-Toleranz
- Routentyp-Auswahl
- Darstellungsintensität
- Warnhinweise einblenden oder reduzieren
- Layer ein-/ausblenden, sofern erlaubt

User-Regler dürfen nie System-Adjust- oder Regio-Content-Grenzen überschreiben.

## 4.5 Hinweis- und Warnlogik definieren

Das Panel definiert, welche Hinweise und Warnungen in welcher Form ausgespielt werden dürfen.

Beispiele:

- hohe Bewegungsauslastung
- hoher Aufenthaltsdruck bei POI
- Route enthält abgewertete Abschnitte
- Route enthält regionale Sperre oder Warnung
- keine auslastungsarme Alternative verfügbar
- Datenlage unsicher oder veraltet

## 4.6 Reduktionsprofil definieren

Das Panel definiert, wie technische SCIM-Ergebnisse für Sensus Core reduziert werden.

Beispiele:

- keine Rohwerte anzeigen
- Scores in Stufen übersetzen
- nur aggregierte Werte anzeigen
- Debug-Attribute entfernen
- Operator-Notizen entfernen
- interne IDs aus User-Ausgabe entfernen, soweit nicht benötigt
- Layer auf erlaubte Sichtbarkeit filtern

---

# 5. Datenmodell

## 5.1 Kernoutput

```ts
export interface TargetAppUiState {
  target_app_ui_version: string;
  source: TargetAppUiSource;
  loaded_at: string;
  app_profile: TargetAppProfile;
  visible_layers: VisibleLayerConfig[];
  available_route_modes: RouteModeConfig[];
  allowed_user_controls: UserControlConfig[];
  warning_rules: WarningRuleConfig[];
  reduction_profile: ReductionProfile;
  release: TargetAppUiReleaseState;
  validation: TargetAppUiValidationResult;
  status: TargetAppUiStatus;
}
```

## 5.2 Quelle

```ts
export type TargetAppUiSource =
  | 'sensus_core_config'
  | 'target_app_config'
  | 'mock'
  | 'local_json'
  | 'api';
```

## 5.3 Statuswerte

```ts
export type TargetAppUiStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'target_app_ui_valid'
  | 'target_app_ui_invalid'
  | 'target_app_ui_warning'
  | 'target_app_ui_draft'
  | 'target_app_ui_error';
```

---

# 6. Ziel-App-Profil

## 6.1 TargetAppProfile

```ts
export interface TargetAppProfile {
  profile_id: string;
  profile_name: string;
  app_family: 'sensus_core' | 'sensus_core_child' | 'custom_target_app';
  audience: 'public_user' | 'guided_user' | 'operator_preview' | 'restricted_test_user';
  default_language?: string;
  supported_languages?: string[];
  map_mode: 'leaflet_view' | 'native_map_view' | 'hybrid';
  offline_supported: boolean;
  requires_released_regio_content: boolean;
  requires_released_system_adjust: boolean;
}
```

## 6.2 Profilregeln

Pflichtfelder:

```txt
profile_id
profile_name
app_family
audience
map_mode
requires_released_regio_content
requires_released_system_adjust
```

Regeln:

- `public_user` darf keine Debug- oder Operator-Layer sehen.
- `operator_preview` darf technische Vorschauen sehen, aber nicht als Sensus-Core-Endausgabe exportiert werden.
- `requires_released_system_adjust` soll für produktive Profile `true` sein.
- `requires_released_regio_content` soll für produktive Profile `true` sein.

---

# 7. Sichtbare Layer

## 7.1 VisibleLayerConfig

```ts
export interface VisibleLayerConfig {
  layer_id: string;
  layer_type: TargetAppLayerType;
  label: string;
  enabled_by_default: boolean;
  user_toggle_allowed: boolean;
  min_zoom?: number;
  max_zoom?: number;
  visibility: LayerVisibility;
  data_class: LayerDataClass;
  reduction_required: boolean;
  depends_on_feature_flag?: keyof SystemFeatureFlags;
  requires_regio_release?: boolean;
}

export type TargetAppLayerType =
  | 'movement_load'
  | 'stay_density'
  | 'approved_pois'
  | 'stay_areas_reduced'
  | 'route_options'
  | 'route_warnings'
  | 'regional_restrictions'
  | 'jam_indicators'
  | 'base_paths'
  | 'debug_graph'
  | 'raw_signals';

export type LayerVisibility =
  | 'sensus_core_visible'
  | 'operator_preview_only'
  | 'debug_only'
  | 'hidden';

export type LayerDataClass =
  | 'public_aggregate'
  | 'reduced_scim_result'
  | 'operator_internal'
  | 'debug'
  | 'raw_signal'
  | 'forbidden_for_sensus_core';
```

## 7.2 Layer-Regeln

Blockierende Regeln:

```ts
raw_signals must not be sensus_core_visible
debug_graph must not be sensus_core_visible
LayerDataClass raw_signal must not be sensus_core_visible
LayerDataClass debug must not be sensus_core_visible
LayerDataClass operator_internal must not be sensus_core_visible for public_user
forbidden_for_sensus_core must always be hidden or operator_preview_only
```

Weitere Regeln:

- `movement_load` darf nur als aggregierter oder reduzierter Layer sichtbar sein.
- `stay_density` darf nur nach Mindestaggregation sichtbar sein.
- `approved_pois` darf nur freigegebene POIs enthalten.
- `route_options` darf nur freigegebene und reduzierte Routeninformationen enthalten.
- `regional_restrictions` dürfen nur gemäß ihrer Darstellungswirkung sichtbar werden.

---

# 8. Routentypen

## 8.1 RouteModeConfig

```ts
export interface RouteModeConfig {
  route_mode_id: string;
  label: string;
  description?: string;
  enabled: boolean;
  default_selected: boolean;
  route_priority: RoutePriority;
  allowed_exceedance_behavior: RouteExceedanceBehavior[];
  user_selectable: boolean;
  depends_on_regional_profile_id?: string;
}

export type RoutePriority =
  | 'fastest'
  | 'shortest'
  | 'low_load'
  | 'quiet'
  | 'balanced'
  | 'fallback';

export type RouteExceedanceBehavior =
  | 'warn'
  | 'degrade'
  | 'exclude'
  | 'profile_dependent';
```

## 8.2 Routentyp-Regeln

Pflichtregeln:

- Mindestens ein Routentyp muss aktiviert sein.
- Höchstens ein Routentyp darf `default_selected = true` haben.
- `exclude` darf nur angeboten werden, wenn System-Adjust und Regio-Content dies zulassen.
- `fallback` muss klar kennzeichnen, ob abgewertete Abschnitte erlaubt sind.
- Ein Routentyp darf keine niedrigeren Grenzwerte erzwingen, als System-Adjust erlaubt.

---

# 9. Erlaubte User-Regler

## 9.1 UserControlConfig

```ts
export interface UserControlConfig {
  control_id: string;
  control_type: UserControlType;
  label: string;
  enabled: boolean;
  default_value: number | string | boolean;
  min_value?: number;
  max_value?: number;
  step?: number;
  unit?: string;
  system_range_key?: keyof AllowedRanges;
  affects: UserControlEffect[];
  local_only: boolean;
}

export type UserControlType =
  | 'route_mode_select'
  | 'movement_tolerance_slider'
  | 'stay_tolerance_slider'
  | 'display_intensity_slider'
  | 'warnings_toggle'
  | 'layer_toggle'
  | 'fallback_routes_toggle';

export type UserControlEffect =
  | 'route_filtering'
  | 'route_sorting'
  | 'map_visibility'
  | 'warning_visibility'
  | 'display_intensity'
  | 'none';
```

## 9.2 User-Regler-Regeln

Blockierende Regeln:

```ts
control min_value must not be below System-Adjust allowed range
control max_value must not exceed System-Adjust allowed range
local user controls must not write system_adjust
local user controls must not write regio_content
local user controls must not expose raw/debug layers
```

Weitere Regeln:

- User-Regler wirken lokal auf Sensus Core.
- User-Regler dürfen Routenvorschläge filtern, sortieren oder hervorheben.
- User-Regler dürfen keine Systemgrenzen überschreiben.
- User-Regler dürfen keine nicht freigegebenen Layer aktivieren.

---

# 10. Hinweise und Warnungen

## 10.1 WarningRuleConfig

```ts
export interface WarningRuleConfig {
  warning_rule_id: string;
  warning_type: TargetAppWarningType;
  enabled: boolean;
  severity: 'info' | 'warning' | 'critical';
  trigger: WarningTrigger;
  user_dismissible: boolean;
  display_mode: WarningDisplayMode;
  message_key: string;
}

export type TargetAppWarningType =
  | 'high_movement_load'
  | 'high_stay_density'
  | 'degraded_route_section'
  | 'excluded_route_section'
  | 'regional_restriction'
  | 'no_low_load_alternative'
  | 'data_quality_low'
  | 'stale_data'
  | 'privacy_reduction_active';

export interface WarningTrigger {
  source: 'route_model' | 'load_model' | 'regio_content' | 'system_status' | 'package_builder';
  field: string;
  operator: 'equals' | 'not_equals' | 'gte' | 'lte' | 'exists';
  value?: string | number | boolean;
}

export type WarningDisplayMode =
  | 'inline_route_hint'
  | 'map_badge'
  | 'modal'
  | 'toast'
  | 'hidden';
```

## 10.2 Warnlogik-Regeln

- Warnungen dürfen keine Rohwerte offenlegen, wenn das Reduktionsprofil dies verbietet.
- Datenqualitätswarnungen müssen möglich sein, ohne Signalgruppen sichtbar zu machen.
- Datenschutzreduktion darf als Hinweis sichtbar sein, aber nicht mit internen Grenzwerten überfrachtet werden.
- Regionale Restriktionen dürfen nur in der von Regio-Content erlaubten Darstellungswirkung erscheinen.

---

# 11. Reduktionsprofil

## 11.1 ReductionProfile

```ts
export interface ReductionProfile {
  profile_id: string;
  remove_raw_signals: true;
  remove_debug_data: true;
  remove_operator_notes: boolean;
  remove_internal_ids: boolean;
  aggregate_scores_to_classes: boolean;
  score_class_count?: number;
  hide_exact_signal_counts: boolean;
  hide_device_counts: true;
  round_coordinates: boolean;
  coordinate_precision?: number;
  simplify_geometries: boolean;
  max_geometry_detail?: 'low' | 'medium' | 'high';
  allowed_output_data_classes: LayerDataClass[];
}
```

## 11.2 Reduktionsregeln

Blockierende Regeln:

```ts
remove_raw_signals must be true
remove_debug_data must be true
hide_device_counts must be true
allowed_output_data_classes must not include raw_signal
allowed_output_data_classes must not include debug
allowed_output_data_classes must not include forbidden_for_sensus_core
```

Empfohlene Regeln:

- `aggregate_scores_to_classes = true` für öffentliche Ziel-App-Profile.
- `hide_exact_signal_counts = true` für öffentliche Ziel-App-Profile.
- `remove_operator_notes = true` für öffentliche Ziel-App-Profile.
- `round_coordinates = true` oder Geometrievereinfachung, sofern Datenschutz oder Produktlogik es erfordert.

---

# 12. Freigabe

## 12.1 TargetAppUiReleaseState

```ts
export interface TargetAppUiReleaseState {
  release_status: TargetAppUiReleaseStatus;
  release_id?: string;
  released_by?: string;
  released_at?: string;
  draft_id?: string;
  previous_release_id?: string;
  changelog?: string;
  blocks_runtime_use: boolean;
}

export type TargetAppUiReleaseStatus =
  | 'draft'
  | 'in_review'
  | 'released'
  | 'rejected'
  | 'archived';
```

## 12.2 Freigaberegeln

Für gültigen Runtime-Ziel-App-UI-Input gilt:

```ts
release.release_status === 'released'
release.blocks_runtime_use === false
validation.is_valid === true
status === 'target_app_ui_valid' || status === 'target_app_ui_warning'
```

Entwürfe dürfen angezeigt, geprüft und gespeichert werden, aber nicht als gültiger Runtime-Input an Sensus-Core Package Builder oder Endgeräte-View übergeben werden.

---

# 13. Validierung

## 13.1 ValidationResult

```ts
export interface TargetAppUiValidationResult {
  is_valid: boolean;
  errors: TargetAppUiIssue[];
  warnings: TargetAppUiIssue[];
  checked_at: string;
  checked_against_system_adjust_version: string;
  checked_against_regio_content_version?: string;
}

export interface TargetAppUiIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}
```

## 13.2 Pflichtvalidierungen

### System-Adjust vorhanden

```ts
context.system_adjust must exist
context.system_adjust.status must be system_adjust_valid or system_adjust_warning
```

Ohne gültigen System-Adjust-Stand darf kein Ziel-App UI Input als gültig übernommen werden.

### Version und Profil

```ts
target_app_ui_version must exist
app_profile.profile_id must exist
app_profile.profile_name must exist
app_profile.app_family must exist
app_profile.audience must exist
app_profile.map_mode must exist
```

### Sichtbare Layer

```ts
visible_layers must exist
raw_signals must not be sensus_core_visible
debug_graph must not be sensus_core_visible
operator_internal must not be sensus_core_visible for public_user
all sensus_core_visible layers must have allowed data_class
```

### Routentypen

```ts
available_route_modes must exist
at least one route mode enabled
at most one default_selected route mode
route mode behaviors must be allowed
```

### User-Regler

```ts
allowed_user_controls must exist
all numeric controls with system_range_key must fit within System-Adjust allowed_ranges
controls must not enable raw/debug visibility
controls must be local_only unless explicitly system-controlled
```

### Warnregeln

```ts
warning_rules must exist
warning message_key must exist
warning display_mode must be valid
warning triggers must reference allowed source
```

### Reduktionsprofil

```ts
remove_raw_signals must be true
remove_debug_data must be true
hide_device_counts must be true
allowed_output_data_classes must not include raw_signal/debug/forbidden_for_sensus_core
```

### Freigabe

```ts
release.release_status must be released for runtime-valid content
blocks_runtime_use must be false for runtime-valid content
released_at must exist if release_status is released
```

---

# 14. Fehlercodes

```ts
TAPP_SYSTEM_ADJUST_MISSING
TAPP_SYSTEM_ADJUST_INVALID
TAPP_VERSION_MISSING
TAPP_PROFILE_ID_MISSING
TAPP_PROFILE_NAME_MISSING
TAPP_PROFILE_APP_FAMILY_MISSING
TAPP_PROFILE_AUDIENCE_MISSING
TAPP_PROFILE_MAP_MODE_MISSING
TAPP_VISIBLE_LAYERS_MISSING
TAPP_RAW_LAYER_VISIBLE_FORBIDDEN
TAPP_DEBUG_LAYER_VISIBLE_FORBIDDEN
TAPP_OPERATOR_INTERNAL_VISIBLE_FORBIDDEN
TAPP_FORBIDDEN_DATA_CLASS_VISIBLE
TAPP_ROUTE_MODES_MISSING
TAPP_NO_ROUTE_MODE_ENABLED
TAPP_MULTIPLE_DEFAULT_ROUTE_MODES
TAPP_ROUTE_BEHAVIOR_NOT_ALLOWED
TAPP_USER_CONTROLS_MISSING
TAPP_CONTROL_OUT_OF_SYSTEM_RANGE
TAPP_CONTROL_EXPOSES_FORBIDDEN_LAYER
TAPP_CONTROL_NOT_LOCAL
TAPP_WARNING_RULE_MESSAGE_MISSING
TAPP_WARNING_TRIGGER_INVALID
TAPP_REDUCTION_PROFILE_MISSING
TAPP_RAW_SIGNALS_NOT_REMOVED
TAPP_DEBUG_DATA_NOT_REMOVED
TAPP_DEVICE_COUNTS_NOT_HIDDEN
TAPP_FORBIDDEN_OUTPUT_DATA_CLASS
TAPP_RELEASE_NOT_RELEASED
TAPP_RELEASE_BLOCKS_RUNTIME
TAPP_RELEASE_TIMESTAMP_MISSING
```

---

# 15. Warncodes

```ts
TAPP_REGIO_CONTENT_MISSING
TAPP_OPERATOR_PREVIEW_PROFILE
TAPP_PUBLIC_PROFILE_WITH_EXACT_SCORES
TAPP_PUBLIC_PROFILE_WITH_EXACT_COUNTS
TAPP_TOO_MANY_VISIBLE_LAYERS
TAPP_ROUTE_EXCLUDE_AVAILABLE
TAPP_WARNINGS_DISABLED
TAPP_LAYER_TOGGLE_BROAD
TAPP_REDUCTION_LOW
TAPP_OFFLINE_WITH_MANY_LAYERS
TAPP_RELEASE_HAS_WARNINGS
TAPP_SYSTEM_ADJUST_VERSION_MISMATCH
TAPP_REGIO_CONTENT_VERSION_MISMATCH
```

---

# 16. UI-Anforderungen

Panel 3 soll als eigenständiges Input-Panel sichtbar bleiben.

## 16.1 Layout

Empfohlenes Layout:

```txt
┌────────────────────────────────────────────────────────────┐
│ Panel 3: Ziel-App UI Input                                │
├────────────────────────────────────────────────────────────┤
│ Ziel-App-Profil auswählen / laden                          │
│ Quelle: Sensus Core Config | Mock | JSON | API              │
├────────────────────────────────────────────────────────────┤
│ Statuskarten                                                │
│ - Ziel-App-Profil                                           │
│ - Sichtbare Layer                                           │
│ - Routentypen                                               │
│ - Erlaubte User-Regler                                      │
│ - Hinweise und Warnungen                                    │
│ - Reduktionsprofil                                          │
├────────────────────────────────────────────────────────────┤
│ Tabs                                                        │
│ 1. Ziel-App-Profil                                          │
│ 2. Sichtbare Layer                                          │
│ 3. Routentypen                                              │
│ 4. Erlaubte User-Regler                                     │
│ 5. Hinweise und Warnungen                                   │
│ 6. Reduktionsprofil                                         │
├────────────────────────────────────────────────────────────┤
│ Footer                                                      │
│ [Laden] [Validieren] [In Kontext übernehmen]                │
└────────────────────────────────────────────────────────────┘
```

## 16.2 Tab 1: Ziel-App-Profil

Zweck:

- aktives Ziel-App-Profil anzeigen
- App-Familie und Zielgruppe klären
- Runtime-Anforderungen prüfen

Felder:

```txt
Profil-ID
Profilname
App-Familie
Zielgruppe
Default-Sprache
Unterstützte Sprachen
Kartenmodus
Offline unterstützt ja/nein
Benötigt freigegebenen Regio-Content ja/nein
Benötigt freigegebenen System-Adjust ja/nein
Target-App-UI-Version
Quelle
Geladen am
```

Aktionen:

```txt
Profil laden
Mock-Profil laden
JSON importieren
```

## 16.3 Tab 2: Sichtbare Layer

Zweck:

- definieren, welche Layer in Sensus Core sichtbar sein dürfen
- technische Layer von User-Layern trennen

Felder je Layer:

```txt
Layer-ID
Layer-Typ
Label
Standardmäßig aktiv
User darf schalten ja/nein
Min-/Max-Zoom
Sichtbarkeit
Datenklasse
Reduktion erforderlich ja/nein
Feature-Flag-Abhängigkeit
Regio-Release erforderlich ja/nein
```

Validierungsanzeige:

```txt
Sensus-Core-tauglich
Nur Operator-Vorschau
Debug-only
Verboten für Sensus Core
```

## 16.4 Tab 3: Routentypen

Zweck:

- verfügbare Routentypen der Ziel-App definieren
- Default-Routentyp prüfen
- Verhalten bei Grenzwertüberschreitung begrenzen

Felder je Routentyp:

```txt
Routentyp-ID
Label
Beschreibung
Aktiviert
Standardauswahl
Routenpriorität
Erlaubtes Grenzwertverhalten
User-wählbar
Regionaler Profilbezug, falls vorhanden
```

## 16.5 Tab 4: Erlaubte User-Regler

Zweck:

- lokale User-Einstellungen definieren
- Systemgrenzen schützen

Felder je Regler:

```txt
Regler-ID
Regler-Typ
Label
Aktiviert
Default-Wert
Minimum
Maximum
Schrittweite
Einheit
System-Range-Bezug
Wirkung
Nur lokal ja/nein
```

Validierungsanzeige:

```txt
Innerhalb System-Adjust
Überschreitet Systemgrenze
Unterschreitet Systemgrenze
Verbotene Layer-Wirkung
Nicht lokal
```

## 16.6 Tab 5: Hinweise und Warnungen

Zweck:

- Ziel-App-Hinweise und Warnungen konfigurieren
- technische Trigger in nutzergeeignete Meldungen übersetzen

Felder je Warnregel:

```txt
Warnregel-ID
Warnungstyp
Aktiviert
Schweregrad
Trigger-Quelle
Trigger-Feld
Operator
Wert
User darf ausblenden ja/nein
Darstellungsmodus
Message-Key
```

## 16.7 Tab 6: Reduktionsprofil

Zweck:

- Datenschutz- und Produktreduktion vor Sensus-Core-Ausspielung definieren

Felder:

```txt
Reduktionsprofil-ID
Rohsignale entfernen
Debug-Daten entfernen
Operator-Notizen entfernen
Interne IDs entfernen
Scores in Klassen übersetzen
Anzahl Score-Klassen
Exakte Signalzahlen verbergen
Geräteanzahlen verbergen
Koordinaten runden
Koordinatenpräzision
Geometrien vereinfachen
Maximales Geometrie-Detail
Erlaubte Output-Datenklassen
Release-Status
Fehlerliste
Warnliste
```

---

# 17. UI-Zustände

## 17.1 Initial

```ts
status: 'not_loaded'
```

Anzeige:

```txt
Noch kein Ziel-App UI Profil geladen.
```

Aktionen:

```txt
Profil laden
Mock laden
JSON importieren
```

## 17.2 Loading

```ts
status: 'loading'
```

Anzeige:

```txt
Ziel-App UI Profil wird geladen.
```

Aktionen gesperrt:

```txt
Validieren
In Kontext übernehmen
```

## 17.3 Loaded unvalidated

```ts
status: 'loaded_unvalidated'
```

Anzeige:

```txt
Ziel-App UI Profil geladen, aber noch nicht validiert.
```

Aktionen erlaubt:

```txt
Validieren
```

## 17.4 Draft

```ts
status: 'target_app_ui_draft'
```

Anzeige:

```txt
Ziel-App UI Profil ist ein Entwurf und darf nicht runtime-wirksam übernommen werden.
```

Aktionen erlaubt:

```txt
Validieren
```

Aktionen gesperrt:

```txt
In Runtime-Kontext übernehmen
```

## 17.5 Valid

```ts
status: 'target_app_ui_valid'
```

Anzeige:

```txt
Ziel-App UI Profil ist gültig und freigegeben.
```

Aktionen erlaubt:

```txt
In Kontext übernehmen
Weiter zu Telco-Load Input oder Boundary/Extraktion
```

## 17.6 Warning

```ts
status: 'target_app_ui_warning'
```

Anzeige:

```txt
Ziel-App UI Profil ist verwendbar, enthält aber Warnungen.
```

Aktionen erlaubt:

```txt
In Kontext übernehmen, sofern keine blockierenden Fehler vorliegen und Release freigegeben ist
```

## 17.7 Invalid

```ts
status: 'target_app_ui_invalid'
```

Anzeige:

```txt
Ziel-App UI Profil ist ungültig. Folgepanels dürfen diesen Stand nicht verwenden.
```

Aktionen gesperrt:

```txt
In Kontext übernehmen
Weiter
```

---

# 18. Service-Logik

## 18.1 loadTargetAppUiProfile

```ts
export async function loadTargetAppUiProfile(
  source: TargetAppUiSource,
  profileId?: string,
  version?: string
): Promise<unknown> {
  // Quelle laden: Sensus-Core-Konfiguration, Ziel-App-Konfiguration, Mock, JSON oder API.
  // Ergebnis ist unknown, weil es erst normalisiert werden muss.
}
```

## 18.2 normalizeTargetAppUi

```ts
export function normalizeTargetAppUi(raw: unknown): TargetAppUiState {
  // Rohdaten in stabiles internes Schema überführen.
  // Optionale Felder mit sicheren Defaults ergänzen.
  // Pflichtfelder nicht stillschweigend erfinden.
}
```

## 18.3 validateTargetAppUi

```ts
export function validateTargetAppUi(
  state: TargetAppUiState,
  systemAdjust: SystemAdjustState | undefined,
  regioContent?: RegioContentState
): TargetAppUiValidationResult {
  const errors: TargetAppUiIssue[] = [];
  const warnings: TargetAppUiIssue[] = [];

  // System-Adjust prüfen
  // Profil prüfen
  // Layer prüfen
  // Routentypen prüfen
  // User-Regler prüfen
  // Warnlogik prüfen
  // Reduktionsprofil prüfen
  // Freigabe prüfen
  // Warnungen ableiten

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing',
    checked_against_regio_content_version: regioContent?.regio_content_version
  };
}
```

## 18.4 applyTargetAppUiToContext

```ts
export function applyTargetAppUiToContext(
  context: ScimContext,
  targetAppUi: TargetAppUiState
): ScimContext {
  if (targetAppUi.status !== 'target_app_ui_valid' && targetAppUi.status !== 'target_app_ui_warning') {
    throw new Error('Cannot apply invalid or draft Target-App UI state to SCIM context.');
  }

  if (targetAppUi.release.release_status !== 'released' || targetAppUi.release.blocks_runtime_use) {
    throw new Error('Cannot apply unreleased Target-App UI state to runtime SCIM context.');
  }

  return {
    ...context,
    target_app_ui: targetAppUi
  };
}
```

Wichtig:

Diese Funktion darf keine anderen Kontextbereiche verändern.

## 18.5 validateVisibleLayersAgainstSystemAdjust

```ts
export function validateVisibleLayersAgainstSystemAdjust(
  layers: VisibleLayerConfig[],
  systemAdjust: SystemAdjustState,
  issues: TargetAppUiIssue[],
  appProfile: TargetAppProfile
): void {
  // Rohsignal-Layer blockieren.
  // Debug-Layer für Sensus Core blockieren.
  // Operator-interne Layer für public_user blockieren.
  // Feature Flags prüfen.
  // Datenschutzgrenzen prüfen.
}
```

## 18.6 validateUserControlsAgainstSystemAdjust

```ts
export function validateUserControlsAgainstSystemAdjust(
  controls: UserControlConfig[],
  systemAdjust: SystemAdjustState,
  issues: TargetAppUiIssue[]
): void {
  // Numeric Controls gegen AllowedRanges prüfen.
  // Lokale Wirkung prüfen.
  // Verbotene Layer-Wirkung blockieren.
}
```

## 18.7 validateReductionProfile

```ts
export function validateReductionProfile(
  profile: ReductionProfile,
  issues: TargetAppUiIssue[]
): void {
  // Rohsignale müssen entfernt werden.
  // Debug-Daten müssen entfernt werden.
  // Geräteanzahlen müssen verborgen werden.
  // Verbotene Output-Datenklassen blockieren.
}
```

---

# 19. Mock-Daten

```ts
export const mockTargetAppUiState: TargetAppUiState = {
  target_app_ui_version: 'target_ui_v1.0.0',
  source: 'mock',
  loaded_at: '2026-05-21T00:00:00.000Z',
  app_profile: {
    profile_id: 'sensus_core_child_public_v1',
    profile_name: 'Sensus Core Child Public Profile',
    app_family: 'sensus_core_child',
    audience: 'public_user',
    default_language: 'de',
    supported_languages: ['de', 'en'],
    map_mode: 'leaflet_view',
    offline_supported: false,
    requires_released_regio_content: true,
    requires_released_system_adjust: true
  },
  visible_layers: [
    {
      layer_id: 'layer_movement_load_reduced',
      layer_type: 'movement_load',
      label: 'Bewegungsauslastung',
      enabled_by_default: true,
      user_toggle_allowed: true,
      min_zoom: 10,
      max_zoom: 18,
      visibility: 'sensus_core_visible',
      data_class: 'reduced_scim_result',
      reduction_required: true,
      depends_on_feature_flag: 'enable_movement_load',
      requires_regio_release: true
    },
    {
      layer_id: 'layer_stay_density_reduced',
      layer_type: 'stay_density',
      label: 'Aufenthaltsdichte',
      enabled_by_default: true,
      user_toggle_allowed: true,
      min_zoom: 12,
      max_zoom: 18,
      visibility: 'sensus_core_visible',
      data_class: 'reduced_scim_result',
      reduction_required: true,
      depends_on_feature_flag: 'enable_stay_classification',
      requires_regio_release: true
    },
    {
      layer_id: 'layer_route_options',
      layer_type: 'route_options',
      label: 'Routenvorschläge',
      enabled_by_default: true,
      user_toggle_allowed: false,
      visibility: 'sensus_core_visible',
      data_class: 'reduced_scim_result',
      reduction_required: true,
      depends_on_feature_flag: 'enable_route_evaluation',
      requires_regio_release: true
    },
    {
      layer_id: 'layer_debug_graph',
      layer_type: 'debug_graph',
      label: 'Debug Graph',
      enabled_by_default: false,
      user_toggle_allowed: false,
      visibility: 'debug_only',
      data_class: 'debug',
      reduction_required: false,
      depends_on_feature_flag: 'enable_leaflet_debug_layers',
      requires_regio_release: false
    }
  ],
  available_route_modes: [
    {
      route_mode_id: 'balanced_route',
      label: 'Ausgewogene Route',
      description: 'Kombiniert klassische Routenmetriken mit SCIM-Auslastung.',
      enabled: true,
      default_selected: true,
      route_priority: 'balanced',
      allowed_exceedance_behavior: ['warn', 'degrade'],
      user_selectable: true
    },
    {
      route_mode_id: 'low_load_route',
      label: 'Auslastungsarme Route',
      description: 'Bevorzugt Abschnitte mit geringerer Bewegungsauslastung und niedriger Aufenthaltsbelastung.',
      enabled: true,
      default_selected: false,
      route_priority: 'low_load',
      allowed_exceedance_behavior: ['degrade', 'profile_dependent'],
      user_selectable: true,
      depends_on_regional_profile_id: 'low_load_route'
    }
  ],
  allowed_user_controls: [
    {
      control_id: 'control_route_mode',
      control_type: 'route_mode_select',
      label: 'Routentyp',
      enabled: true,
      default_value: 'balanced_route',
      affects: ['route_filtering', 'route_sorting'],
      local_only: true
    },
    {
      control_id: 'control_movement_tolerance',
      control_type: 'movement_tolerance_slider',
      label: 'Auslastungstoleranz',
      enabled: true,
      default_value: 0.7,
      min_value: 0,
      max_value: 1,
      step: 0.05,
      unit: 'score',
      system_range_key: 'movement_load_threshold',
      affects: ['route_filtering', 'route_sorting'],
      local_only: true
    },
    {
      control_id: 'control_display_intensity',
      control_type: 'display_intensity_slider',
      label: 'Darstellungsintensität',
      enabled: true,
      default_value: 0.6,
      min_value: 0,
      max_value: 1,
      step: 0.05,
      unit: 'score',
      system_range_key: 'smoothing_strength',
      affects: ['display_intensity'],
      local_only: true
    }
  ],
  warning_rules: [
    {
      warning_rule_id: 'warn_degraded_route_section',
      warning_type: 'degraded_route_section',
      enabled: true,
      severity: 'warning',
      trigger: {
        source: 'route_model',
        field: 'route_status',
        operator: 'equals',
        value: 'degraded'
      },
      user_dismissible: true,
      display_mode: 'inline_route_hint',
      message_key: 'route.contains_degraded_sections'
    },
    {
      warning_rule_id: 'warn_no_low_load_alternative',
      warning_type: 'no_low_load_alternative',
      enabled: true,
      severity: 'info',
      trigger: {
        source: 'route_model',
        field: 'low_load_alternative_available',
        operator: 'equals',
        value: false
      },
      user_dismissible: true,
      display_mode: 'map_badge',
      message_key: 'route.no_low_load_alternative'
    }
  ],
  reduction_profile: {
    profile_id: 'public_reduced_v1',
    remove_raw_signals: true,
    remove_debug_data: true,
    remove_operator_notes: true,
    remove_internal_ids: true,
    aggregate_scores_to_classes: true,
    score_class_count: 5,
    hide_exact_signal_counts: true,
    hide_device_counts: true,
    round_coordinates: true,
    coordinate_precision: 5,
    simplify_geometries: true,
    max_geometry_detail: 'medium',
    allowed_output_data_classes: ['public_aggregate', 'reduced_scim_result']
  },
  release: {
    release_status: 'released',
    release_id: 'target_ui_release_001',
    released_by: 'operator_mock',
    released_at: '2026-05-21T00:00:00.000Z',
    previous_release_id: undefined,
    changelog: 'Initiales Mock-Profil für Sensus Core Child.',
    blocks_runtime_use: false
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_system_adjust_version: 'sys_v1.0.0',
    checked_against_regio_content_version: 'regio_v1.0.0'
  },
  status: 'target_app_ui_valid'
};
```

---

# 20. Übergabe an Folgepanels

Panel 3 gibt folgendes Kontextsegment weiter:

```json
{
  "target_app_ui": {
    "target_app_ui_version": "target_ui_v1.0.0",
    "app_profile": {},
    "visible_layers": [],
    "available_route_modes": [],
    "allowed_user_controls": [],
    "warning_rules": [],
    "reduction_profile": {},
    "release": {},
    "status": "target_app_ui_valid"
  }
}
```

## 20.1 Übergabe an Panel 4: Telco-Load Input

Panel 4 nutzt Ziel-App UI Input nicht zwingend fachlich, kann aber prüfen:

- ob spätere sichtbare Load-Layer nur aggregierte Werte erhalten dürfen,
- ob Datenqualitätshinweise für Ziel-App-Ausgabe vorbereitet werden müssen,
- ob stale-data-Warnungen konfiguriert sind.

## 20.2 Übergabe an Panel 5: Boundary und Extraktion

Boundary und Extraktion können Ziel-App UI Input nutzen für:

- spätere Zoom- oder Darstellungsrelevanz,
- benötigte Layerarten,
- Reduktionsanforderungen,
- Ziel-App-Profilabhängigkeiten.

## 20.3 Übergabe an Panel 8: Routenbewertung und Routendarstellung

Routenbewertung nutzt Ziel-App UI Input für:

- verfügbare Routentypen,
- erlaubte Grenzwertverhalten,
- lokale User-Regler-Vorbereitung,
- Warnlogik bei abgewerteten oder ausgeschlossenen Abschnitten.

## 20.4 Übergabe an Sensus-Core Package Builder

Sensus-Core Package Builder nutzt Ziel-App UI Input als direkten Ausspielvertrag:

- nur sichtbare Layer übernehmen,
- Roh- und Debug-Daten entfernen,
- erlaubte lokale Regler in Paket übernehmen,
- Routenvorschläge gemäß Profil reduzieren,
- Warnungen und Hinweise gemäß Ziel-App-Logik vorbereiten.

## 20.5 Übergabe an Lokaler User Input in Sensus Core

Lokaler User Input darf nur die Regler verwenden, die Panel 3 erlaubt:

- keine zusätzlichen Toleranzen,
- keine Debug-Schalter,
- keine Rohdatenansicht,
- keine System- oder Regio-Parameteränderung.



# 21. Akzeptanzkriterien

## 21.1 Laden

- Ein Mock-Ziel-App-UI-Profil kann geladen werden.
- Ein Ziel-App-UI-Objekt kann aus JSON geladen werden.
- Der Ladezustand wird korrekt angezeigt.
- Fehler beim Laden werden im Panel sichtbar.

## 21.2 System-Adjust-Abhängigkeit

- Ohne gültiges `context.system_adjust` kann kein Ziel-App UI Profil als runtime-gültig übernommen werden.
- Ziel-App UI Input wird gegen die aktive System-Adjust-Version geprüft.
- System-Adjust-Grenzen werden nicht unterschritten.

## 21.3 Profil

- Profil-ID, Profilname, App-Familie, Zielgruppe und Kartenmodus sind Pflichtfelder.
- Public-User-Profile dürfen keine Debug- oder Operator-Layer als sichtbar markieren.
- Produktive Profile verlangen freigegebenen System-Adjust.

## 21.4 Sichtbare Layer

- Rohsignal-Layer können nicht `sensus_core_visible` sein.
- Debug-Layer können nicht `sensus_core_visible` sein.
- Operator-interne Layer können für `public_user` nicht sichtbar sein.
- Sichtbare Layer besitzen eine zulässige Datenklasse.
- Sichtbare Layer mit Feature-Flag-Abhängigkeit werden gegen System-Adjust geprüft.

## 21.5 Routentypen

- Mindestens ein Routentyp ist aktiv.
- Höchstens ein Routentyp ist Standardauswahl.
- Routentypen verwenden nur erlaubtes Grenzwertverhalten.
- Regionale Profilbezüge werden als optionaler Bezug geführt und nicht hart vorausgesetzt, solange kein Regio-Content vorhanden ist.

## 21.6 User-Regler

- Alle numerischen Regler liegen innerhalb der System-Adjust-Ranges.
- User-Regler wirken lokal.
- User-Regler können keine Rohdaten-, Debug- oder Operator-Layer aktivieren.
- User-Regler verändern nicht `system_adjust` oder `regio_content`.

## 21.7 Hinweise und Warnungen

- Warnregeln haben Message-Key, Trigger und Darstellungsmodus.
- Warnungen legen keine Rohwerte offen.
- Datenqualitäts- und Datenschutzreduktionshinweise sind möglich.
- Regionale Warnungen werden nur gemäß erlaubter Darstellungswirkung ausgespielt.

## 21.8 Reduktionsprofil

- Rohsignale werden immer entfernt.
- Debug-Daten werden immer entfernt.
- Geräteanzahlen werden verborgen.
- Verbotene Datenklassen sind nicht in `allowed_output_data_classes` enthalten.
- Public-User-Profile reduzieren exakte Werte zu Klassen oder abstrahierten Darstellungen.

## 21.9 Freigabe

- Nur `release_status = released` und `blocks_runtime_use = false` erlaubt Runtime-Übernahme.
- Entwürfe können validiert, aber nicht als Runtime-Kontext übernommen werden.
- Fehler blockieren die Übergabe.
- Warnungen erlauben die Übergabe nur, wenn keine blockierenden Fehler und ein gültiger Release vorliegen.

## 21.10 Kontextübergabe

- Die Übergabe verändert ausschließlich `context.target_app_ui`.
- Kein anderer Kontextbereich wird überschrieben.
- Ungültige oder nicht freigegebene Profile blockieren die Übergabe.

## 21.11 UI

- Das Panel zeigt Ziel-App-Profil, sichtbare Layer, Routentypen, erlaubte User-Regler, Hinweise/Warnungen und Reduktionsprofil getrennt an.
- Blockierende Fehler sind klar erkennbar.
- Warnungen sind klar erkennbar.
- Folgeaktionen sind gesperrt, solange Ziel-App UI Input ungültig oder nicht freigegeben ist.

## 21.12 Tests

- Unit-Tests für Validator vorhanden.
- Unit-Tests für Layer-Sichtbarkeit vorhanden.
- Unit-Tests für Reduktionsprofil vorhanden.
- Unit-Tests für User-Regler gegen System-Adjust vorhanden.
- Unit-Tests für Freigabestatus vorhanden.
- Unit-Tests für Kontextübergabe vorhanden.
- Mock-Daten-Test vorhanden.

---

# 22. Testfälle

## 22.1 Gültiger Mock

Input:

```ts
mockTargetAppUiState
validSystemAdjust
validRegioContent
```

Erwartung:

```ts
validation.is_valid === true
errors.length === 0
status === 'target_app_ui_valid'
```

## 22.2 System-Adjust fehlt

Input:

```ts
mockTargetAppUiState
systemAdjust = undefined
```

Erwartung:

```ts
errors includes TAPP_SYSTEM_ADJUST_MISSING
validation.is_valid === false
```

## 22.3 Rohsignale sichtbar

Mutation:

```ts
visible_layers.push({
  layer_id: 'raw_001',
  layer_type: 'raw_signals',
  visibility: 'sensus_core_visible',
  data_class: 'raw_signal'
})
```

Erwartung:

```ts
errors includes TAPP_RAW_LAYER_VISIBLE_FORBIDDEN
validation.is_valid === false
```

## 22.4 Debug-Layer sichtbar

Mutation:

```ts
visible_layers.find(l => l.layer_type === 'debug_graph').visibility = 'sensus_core_visible'
```

Erwartung:

```ts
errors includes TAPP_DEBUG_LAYER_VISIBLE_FORBIDDEN
validation.is_valid === false
```

## 22.5 Mehrere Default-Routentypen

Mutation:

```ts
available_route_modes[0].default_selected = true
available_route_modes[1].default_selected = true
```

Erwartung:

```ts
errors includes TAPP_MULTIPLE_DEFAULT_ROUTE_MODES
validation.is_valid === false
```

## 22.6 Kein aktiver Routentyp

Mutation:

```ts
available_route_modes.forEach(mode => mode.enabled = false)
```

Erwartung:

```ts
errors includes TAPP_NO_ROUTE_MODE_ENABLED
validation.is_valid === false
```

## 22.7 User-Regler außerhalb Systemrange

Mutation:

```ts
allowed_user_controls.find(c => c.control_id === 'control_movement_tolerance').max_value = 99
```

Erwartung:

```ts
errors includes TAPP_CONTROL_OUT_OF_SYSTEM_RANGE
validation.is_valid === false
```

## 22.8 Reduktionsprofil entfernt Rohsignale nicht

Mutation:

```ts
reduction_profile.remove_raw_signals = false
```

Erwartung:

```ts
errors includes TAPP_RAW_SIGNALS_NOT_REMOVED
validation.is_valid === false
```

## 22.9 Reduktionsprofil erlaubt Debug-Datenklasse

Mutation:

```ts
reduction_profile.allowed_output_data_classes.push('debug')
```

Erwartung:

```ts
errors includes TAPP_FORBIDDEN_OUTPUT_DATA_CLASS
validation.is_valid === false
```

## 22.10 Draft blockiert Runtime

Mutation:

```ts
release.release_status = 'draft'
```

Erwartung:

```ts
errors includes TAPP_RELEASE_NOT_RELEASED
applyTargetAppUiToContext throws
```

## 22.11 Kontextschutz

Input:

```ts
const contextBefore = {
  system_adjust: validSystemAdjust,
  regio_content: validRegioContent,
  target_app_ui: undefined,
  graph: { existing: true },
  route_model: { existing: true }
};
```

Aktion:

```ts
const contextAfter = applyTargetAppUiToContext(contextBefore, validTargetAppUi);
```

Erwartung:

```ts
contextAfter.target_app_ui exists
contextAfter.system_adjust === contextBefore.system_adjust
contextAfter.regio_content === contextBefore.regio_content
contextAfter.graph === contextBefore.graph
contextAfter.route_model === contextBefore.route_model
```

---

# 23. Umsetzungshinweise für Codex/Claude

## 23.1 Erst headless bauen

Zuerst sollen Typen, Schema, Mock-Daten und Validierungslogik gebaut werden. Die UI kommt danach.

Reihenfolge:

```txt
1. targetAppUi.types.ts
2. targetAppUi.mock.ts
3. targetAppUi.validation.ts
4. targetAppUi.context.ts
5. targetAppUi.test.ts
6. TargetAppUiInputPanel.tsx
```

## 23.2 Keine Fachlogik im UI-Container

Die React-Komponente darf nur anzeigen und Aktionen auslösen. Die Validierungslogik gehört in `targetAppUi.validation.ts`.

## 23.3 System-Adjust als Pflichtinput behandeln

Panel 3 muss technisch so gebaut sein, dass der Validator immer den System-Adjust-Stand erhält.

Kein Ziel-App UI Input darf ohne System-Adjust als runtime-gültig gelten.

## 23.4 Regio-Content optional, aber referenzierbar

Panel 3 soll auch ohne Regio-Content als generisches Profil validierbar sein, aber mit Warnung.

Sobald Regio-Content vorhanden ist, sollen regionale Routentypen, Hinweise und Sichtbarkeiten geprüft werden können.

## 23.5 Keine Engine-Logik vorwegnehmen

Panel 3 darf Layer, Routentypen und Regler definieren, aber keine Layer erzeugen, keine Routen berechnen und keine User-Auswahl anwenden.

## 23.6 Strikte Output-Stabilität

Der Output von Panel 3 ist ein Vertrag. Spätere Panels müssen sich darauf verlassen können.

Deshalb:

- keine wechselnden Feldnamen
- keine UI-spezifischen Feldnamen im Output
- keine sichtbaren Rohdaten-Layer
- keine Debug-Daten in Sensus Core
- keine User-Regler außerhalb von System-Adjust
- keine Draft-Profile als Runtime-Input
- keine lokalen Regler, die System- oder Regio-Kontext überschreiben

---

# 24. Kompakter Codex-Auftrag für Panel 3

```text
Baue Panel 3: Ziel-App UI Input für die SCIM.

Kontext:
SCIM ist ein Gesamtsystem aus Input-Schicht, SCIM-Engine, Layer-Erzeugung, Sensus-Core-Paketierung, lokaler User-Anwendung und Freigabe. Sensus Core ist die SCIM am Endgerät. Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug, nicht der Engine-Kern. Alle Panels arbeiten auf einem gemeinsamen SCIM-Kontext. Panel 3 darf nur `context.target_app_ui` schreiben und muss `context.system_adjust` als nicht unterschreitbaren Rahmen lesen. `context.regio_content` kann optional zur Profilprüfung berücksichtigt werden.

Aufgabe:
Baue nur Panel 3. Das Panel lädt, normalisiert, validiert und speichert ein Ziel-App- bzw. Sensus-Core-Ausspielprofil. Verändere keine anderen Kontextbereiche außer `context.target_app_ui`.

Zweck:
Ziel-App-Profil, sichtbare Layer, Routentypen, erlaubte User-Regler, Warnlogik und Reduktionsprofil bereitstellen.

Nicht-Ziele:
Keine Änderung von System-Adjust, keine Regio-Content-Freigabe, keine Telco-Load-Verarbeitung, kein Graph, keine Aufenthaltsberechnung, keine Bewegungsauslastung, keine Routenbewertung, kein finaler Sensus-Core-Export und keine lokale User-Auswahl.

Erzeuge:
- TypeScript-Typen
- Mock-Daten
- Validierungsfunktionen
- Kontext-Apply-Funktion
- React-Panel mit Tabs
- Unit-Tests

Tabs:
1. Ziel-App-Profil
2. Sichtbare Layer
3. Routentypen
4. Erlaubte User-Regler
5. Hinweise und Warnungen
6. Reduktionsprofil

Output:
`TargetAppUiState` mit `target_app_ui_version`, `app_profile`, `visible_layers`, `available_route_modes`, `allowed_user_controls`, `warning_rules`, `reduction_profile`, `release`, `validation`, `status`.

Validierung:
Blockiere fehlenden oder ungültigen System-Adjust, fehlende Profilfelder, Rohsignal- oder Debug-Layer in Sensus Core, Operator-interne Layer in Public-Profilen, mehrere Default-Routentypen, fehlende aktive Routentypen, User-Regler außerhalb System-Adjust, Warnregeln ohne Message-Key, Reduktionsprofile ohne Rohdaten-/Debug-Ausschluss und nicht freigegebene Releases.

Akzeptanzkriterien:
Ein gültiger Mock kann geladen, gegen System-Adjust validiert und in `context.target_app_ui` übernommen werden. Ein ungültiger, nicht freigegebener oder System-Adjust-widriger Stand blockiert die Übergabe. Die Übergabe verändert keine anderen Kontextbereiche.
```

---

# 25. Kernaussage für Panel 3

Panel 3 ist kein kosmetisches UI-Konfigurationsformular. Es ist der Ausspiel- und Reduktionsvertrag zwischen der technischen SCIM-Pipeline und der nutzergeeigneten Sensus-Core-Darstellung.

Wenn Panel 3 zu weich gebaut wird, entstehen später gefährliche oder fachlich falsche Ausgaben: Rohsignale in der Ziel-App, Debug-Layer am Endgerät, lokale User-Regler außerhalb der Systemgrenzen, Routentypen ohne klare Bewertungslogik oder Warnungen mit zu technischen bzw. datenschutzsensiblen Details.

Deshalb muss Panel 3 als eigenständiges, testbares und gegen System-Adjust hart validierendes Input-Modul gebaut werden.
