# SCIM Panel 10 – Sensus Core lokal

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor den konkreten Panel-Auftrag. Sie stellt sicher, dass Panel 10 nicht als freie App-UI, isolierte Kartenansicht oder nachträgliche Routensortierung gebaut wird, sondern als lokaler, endgeräteseitiger Anwendungsblock auf Basis eines bereits freigegebenen Sensus-Core-Pakets.

### 0.1 SCIM-Gesamtsystem

SCIM ist ein Gesamtsystem aus:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokaler Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 10 liegt nach der Sensus-Core-Paketierung und vor der abschließenden Wirkungsprüfung und Freigabe. Es nimmt ein freigegebenes, reduziertes und datenschutzkonformes Sensus-Core-Paket aus Panel 9 auf und wendet darauf lokale User-Auswahl, lokale Toleranzen, lokale Darstellungspräferenzen und die Endgeräte-View an.

Panel 10 berechnet keine neuen Aufenthalte, keine neue Bewegungsauslastung, keine neuen Routenabschnitte und keine neue fachliche Routenbewertung. Es filtert, sortiert, reduziert und rendert nur innerhalb der Grenzen des Sensus-Core-Pakets.

Leitsatz:

> Panel 10 verändert nicht die SCIM-Wahrheit. Es wendet nur erlaubte lokale Auswahl auf ein freigegebenes Sensus-Core-Paket an.

---

### 0.2 Rollenklärung

**SCIM-Engine**  
Der rechnerische Kern. Die Engine hat vor Panel 10 bereits Graph, POIs, Load-Projektionen, Aufenthalte, Bewegung, Maskierung, Routenabschnitte, Routenoptionen und Layer-Kandidaten berechnet.

**Leaflet**  
Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug. In Panel 10 kann Leaflet oder eine native Kartenansicht als Endgerätekarte genutzt werden. Leaflet berechnet keine SCIM-Logik und darf keine ausgeblendeten Debug- oder Rohdaten wieder sichtbar machen.

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät beziehungsweise in der laufzeitnahen App-Representation. In Panel 10 konsumiert Sensus Core das freigegebene Paket und erzeugt daraus eine lokale, nutzergeeignete Ansicht.

**Sensus-Core Package Builder**  
Panel 9 hat das Paket vorbereitet. Panel 10 darf ausschließlich mit dessen `public_layers`, `route_options`, `allowed_local_controls`, `public_warnings`, `parameter_versions` und `reduction_summary` arbeiten.

---

### 0.3 Aktuelle Panel-Zählung

In der aktuellen finalen 12-Panel-Struktur ist dieses Panel:

```txt
Panel 10: Sensus Core lokal
```

Fachlich fasst es zwei frühere Bauplan-Bausteine zusammen:

```txt
Lokaler User Input in Sensus Core
Endgeräte-Darstellung / Sensus-Core View
```

Für das Coding gilt:

```txt
Panel 10 = lokale User-Anwendung + lokale Sensus-Core-View
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
  local_user_context?: SensusCoreLocalState;
  view_state?: SensusCoreViewState;
  release?: unknown;
  status?: ScimGlobalStatus;
}
```

Panel 10 darf schreiben in:

```ts
context.local_user_context
context.view_state
```

Panel 10 darf lesen aus:

```ts
context.sensus_core_package
context.target_app_ui
context.system_adjust
```

Panel 10 darf nicht schreiben in:

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

Panel 10 ist besonders wichtig, weil hier die nutzerseitige Bedienung entsteht. Wenn dieses Panel zu weich gebaut wird, könnten lokale User-Regler Systemgrenzen überschreiben, ausgeblendete Layer wieder sichtbar machen oder Routen anbieten, die im Paket nicht freigegeben sind.

---

### 0.6 Datenschutzgrenze

Panel 10 darf keine Datenschutzgrenzen aufweichen.

Nicht erlaubt in lokaler Sensus-Core-Ansicht:

- Rohsignale,
- Einzelsignale,
- einzelne Geräte,
- Device Counts,
- Signal Counts, sofern nicht explizit reduziert freigegeben,
- individuelle Bewegungswege,
- individuelle Aufenthaltsdauer,
- exakte Signalgruppen,
- Debug-GeoJSON,
- Operator-Layer,
- Operatornotizen,
- interne Score-Zwischenwerte,
- nicht freigegebene Routenoptionen,
- nicht freigegebene Layer,
- lokale Regler außerhalb des Pakets.

Panel 10 darf keine ausgeschlossenen Inhalte aus `excluded_content_summary` wiederherstellen.

Leitsatz:

> Was Panel 9 nicht ins Paket gegeben hat, existiert für Panel 10 nicht.

---

### 0.7 System-Adjust-Vorrang

Panel 10 ist indirekt und teilweise direkt abhängig von `context.system_adjust`.

Das Sensus-Core-Paket muss bereits gegen System-Adjust validiert sein. Panel 10 muss zusätzlich lokale User-Werte gegen die Paketgrenzen und, sofern vorhanden, gegen die System-Adjust-Bereiche prüfen.

System-Adjust begrenzt für Panel 10 insbesondere:

- erlaubte lokale Toleranzbereiche,
- zulässige Routenschwellen,
- zulässige Layerklassen,
- Rohdaten- und Debug-Ausschluss,
- Mindestaggregation für sichtbare Auslastungsinformationen,
- zulässige Warn- und Reduktionsmodi.

Panel 10 darf lokale User-Auswahl normalisieren, begrenzen oder blockieren, aber nie System-Adjust oder Regio-Content verändern.

---

### 0.8 Ziel-App-UI-Abhängigkeit

Panel 10 nutzt die Ziel-App-UI-Regeln nur mittelbar über das Paket und optional direkt aus `context.target_app_ui` zur Plausibilitätsprüfung.

Der Ziel-App UI Input definiert:

- welche Layer sichtbar sein dürfen,
- welche Routentypen angeboten werden dürfen,
- welche lokalen Regler erlaubt sind,
- welche Warnungen angezeigt werden dürfen,
- wie Darstellung und Reduktion erfolgen müssen.

Panel 10 darf keine neuen lokalen Regler erfinden. Es darf nur `sensus_core_package.allowed_local_controls` verwenden.

---

### 0.9 Abhängigkeit von Panel 9

Panel 10 ist direkter Abnehmer von Panel 9.

Erforderlich ist:

```ts
context.sensus_core_package.status === 'sensus_core_package_ready'
// oder für Test-/Vorschaukontexte bewusst erlaubt:
context.sensus_core_package.status === 'sensus_core_package_warning'
```

Panel 10 nutzt aus dem Paket:

```ts
public_layers
route_options
allowed_local_controls
public_warnings
parameter_versions
reduction_summary
package_summary
```

Panel 10 darf nicht:

- `sensus_core_package` verändern,
- neue public layers hinzufügen,
- neue route options aus Engine-Daten erzeugen,
- Debug- oder Rohdaten reaktivieren,
- lokale Regler außerhalb des Pakets ergänzen.

---

### 0.10 Trennung von lokaler Auswahl und fachlicher Bewertung

Panel 10 muss drei Ebenen strikt trennen:

1. **Paketinhalt**  
   Freigegebene Layer, Routen, Warnungen und lokale Regler aus Panel 9.

2. **Lokale User-Auswahl**  
   Routentyp, Toleranzen, Darstellungsintensität, Layer-Toggles, Warnhinweise.

3. **Lokale View**  
   Tatsächlich sichtbare Karte, Routenvorschläge, Hinweise und UI-Zustände.

Lokale Auswahl darf Darstellung, Sortierung und Filterung beeinflussen. Sie darf keine technische SCIM-Bewertung neu berechnen.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**Sensus Core lokal**

Technischer Modulname:

```ts
SensusCoreLocalPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
validateSensusCorePackageForLocalUse()
loadLocalUserPreferences()
normalizeLocalUserSelection()
validateLocalUserSelection()
applyLocalRouteSelection()
applyLocalTolerances()
filterLocalRouteOptions()
sortLocalRouteOptions()
composeLocalDisplayLayers()
filterLocalWarnings()
buildSensusCoreViewState()
validateSensusCoreLocalState()
validateSensusCoreViewState()
applySensusCoreLocalStateToContext()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/sensus-core-local/
  SensusCoreLocalPanel.tsx
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

---

# 2. Zweck des Panels

Panel 10 erzeugt aus einem freigegebenen Sensus-Core-Paket und einer lokalen User-Auswahl eine lokale Sensus-Core-Ansicht.

Es beantwortet für spätere Panels:

- Welches Paket wird lokal angewendet?
- Welche lokalen Regler sind verfügbar?
- Welche User-Auswahl ist aktiv?
- Welche lokalen Toleranzen sind wirksam?
- Welche Routenvorschläge bleiben nach lokaler Filterung übrig?
- Welche Route ist ausgewählt oder empfohlen?
- Welche Layer werden lokal sichtbar?
- Welche Warnungen werden angezeigt, reduziert oder ausgeblendet?
- Ist die View datenschutzkonform und frei von Debug-/Rohdaten?

Leitsatz:

> Panel 10 macht das freigegebene Sensus-Core-Paket lokal bedienbar und sichtbar, ohne die vorgelagerten SCIM-Ergebnisse zu verändern.

---

# 3. Nicht-Ziele

Panel 10 darf nicht:

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
- Sensus-Core-Pakete verändern,
- Debugdaten reaktivieren,
- Rohdaten anzeigen,
- finale Freigabe oder Export durchführen.

Panel 10 ist ein lokales Anwendungs- und View-Panel, kein Engine-Panel und kein Package-Builder.

---

# 4. Fachliche Verantwortung

Panel 10 hat sechs fachliche Kernaufgaben.

## 4.1 Paket für lokale Nutzung prüfen

Panel 10 prüft, ob ein Sensus-Core-Paket lokal verwendet werden darf.

Geprüft werden mindestens:

- Paket vorhanden,
- Paketstatus `sensus_core_package_ready` oder zulässiger Warnstatus,
- Paket enthält `representation_id`,
- Paket enthält `public_layers` oder `route_options`,
- Paket enthält erlaubte lokale Regler,
- Paket enthält keine verbotenen Datenklassen,
- Paketversion und Parameterstände vorhanden,
- Paket ist nicht leer, außer ein expliziter Layerless-/Route-less-Modus ist erlaubt.

## 4.2 Lokale Routenauswahl anwenden

Panel 10 erlaubt lokale Auswahl aus den im Paket enthaltenen Routentypen und Routenoptionen.

Möglich sind:

- Routentyp wählen,
- konkrete Route wählen,
- empfohlene Route übernehmen,
- Fallback-Route zulassen, falls erlaubt,
- Warnrouten anzeigen, falls erlaubt,
- nicht verfügbare Routen ausblenden.

Die Auswahl darf nur auf `package.route_options` wirken.

## 4.3 Lokale Toleranzen anwenden

Panel 10 wendet lokale Toleranzen nur an, wenn sie im Paket als lokale Regler freigegeben sind.

Beispiele:

- Bewegungsauslastungs-Toleranz,
- Aufenthaltsdichte-Toleranz,
- Warnempfindlichkeit,
- Fallback-Erlaubnis,
- Routensortierung nach ruhiger oder schneller Route.

Toleranzen dürfen:

- Routen lokal filtern,
- Routen lokal sortieren,
- Warnhinweise sichtbarer oder weniger prominent machen,
- Darstellungsklassen hervorheben oder abschwächen.

Toleranzen dürfen nicht:

- Systemgrenzen ändern,
- regionale Parameter ändern,
- SCIM-Scores neu berechnen,
- ausgeschlossene Routen als normale Route verfügbar machen,
- Debug- oder Rohdaten aktivieren.

## 4.4 Darstellungsintensität anwenden

Panel 10 kann lokale Darstellungsintensität anwenden.

Beispiele:

- reduzierte Kartenansicht,
- normale Kartenansicht,
- intensive Warnhervorhebung,
- Layer ein-/ausblenden,
- Warnbadges anzeigen,
- Hinweise kompakt oder ausführlich anzeigen.

Darstellungsintensität verändert nur die UI-View, nicht die fachliche Routebewertung.

## 4.5 Gefilterte Routenvorschläge erzeugen

Panel 10 filtert und sortiert `package.route_options` zu `filtered_route_options`.

Filterkriterien können sein:

- Routentyp,
- lokale Bewegungstoleranz,
- lokale Aufenthaltstoleranz,
- Warnungsstatus,
- Fallback-Erlaubnis,
- Verfügbarkeit,
- Datenqualität,
- User Layer Preferences.

Ausgeschlossene Routen dürfen nicht als normale verfügbare Route erscheinen. `fallback_only` darf nur angezeigt werden, wenn der lokale Regler und das Paket Fallback erlauben.

## 4.6 Kartenansicht und Warnungen erzeugen

Panel 10 erzeugt den lokalen `view_state`.

Dieser enthält:

- sichtbare Layer,
- sichtbare Routenvorschläge,
- ausgewählte Route,
- Kartenviewport,
- sichtbare Warnungen,
- UI-Status,
- keine Rohdaten,
- keine Debugdaten.

Die Kartenansicht darf nur aus `public_layers`, `route_options` und `public_warnings` des Pakets erzeugt werden.

---

# 5. Datenmodell

## 5.1 SensusCoreLocalState

```ts
export interface SensusCoreLocalState {
  local_sensus_core_context_id: string;
  representation_id: string;
  sensus_core_package_id: string;
  package_version: string;
  created_at: string;
  updated_at?: string;
  source_refs: SensusCoreLocalSourceRefs;
  selected_route_mode_id?: string;
  selected_route_option_id?: string;
  local_user_selection: LocalUserSelection;
  effective_tolerances: LocalEffectiveTolerances;
  display_preferences: LocalDisplayPreferences;
  filtered_route_options: LocalRouteOption[];
  local_display_layers: LocalDisplayLayer[];
  visible_warnings: LocalWarning[];
  local_summary: SensusCoreLocalSummary;
  validation: SensusCoreLocalValidationResult;
  status: SensusCoreLocalStatus;
}
```

## 5.2 Status

```ts
export type SensusCoreLocalStatus =
  | 'not_initialized'
  | 'initializing'
  | 'package_loaded'
  | 'local_selection_unvalidated'
  | 'validating_local_selection'
  | 'local_user_context_applied'
  | 'local_user_context_warning'
  | 'local_user_context_invalid'
  | 'local_user_context_blocked'
  | 'local_user_context_error';
```

## 5.3 SourceRefs

```ts
export interface SensusCoreLocalSourceRefs {
  sensus_core_package_id: string;
  package_version: string;
  representation_id: string;
  system_adjust_version?: string;
  target_app_ui_version?: string;
  regional_parameter_version?: string;
}
```

Regeln:

```txt
sensus_core_package_id must exist
package_version must exist
representation_id must match package.representation_id
system_adjust_version should match package.parameter_versions.system_rules if present
target_app_ui_version should match package.parameter_versions.target_app_profile_version if present
```

---

# 6. Lokale User-Auswahl

## 6.1 LocalUserSelection

```ts
export interface LocalUserSelection {
  selected_route_mode_id?: string;
  selected_route_option_id?: string;
  movement_tolerance?: number;
  stay_tolerance?: number;
  display_intensity?: LocalDisplayIntensity;
  warnings_enabled?: boolean;
  fallback_routes_enabled?: boolean;
  enabled_layer_ids: string[];
  hidden_layer_ids: string[];
  dismissed_warning_ids: string[];
}
```

## 6.2 DisplayIntensity

```ts
export type LocalDisplayIntensity =
  | 'minimal'
  | 'normal'
  | 'enhanced'
  | 'alert_focused';
```

## 6.3 Auswahlregeln

```txt
selected_route_mode_id must exist in package.route_options or allowed controls
selected_route_option_id must exist in package.route_options if set
movement_tolerance must be allowed by a local control
stay_tolerance must be allowed by a local control
display_intensity must be allowed by a local control or default profile
warnings_enabled must respect package warning display rules
fallback_routes_enabled must be allowed by package controls
layer toggles must only reference package.public_layers
```

---

# 7. Lokale Toleranzen

## 7.1 LocalEffectiveTolerances

```ts
export interface LocalEffectiveTolerances {
  movement_tolerance?: LocalToleranceValue;
  stay_tolerance?: LocalToleranceValue;
  warning_sensitivity?: LocalToleranceValue;
  fallback_allowed: boolean;
  derived_from_control_ids: string[];
}

export interface LocalToleranceValue {
  value: number;
  min_value: number;
  max_value: number;
  step?: number;
  unit?: string;
  source_control_id: string;
  normalized: boolean;
  normalization_reason?: string;
}
```

## 7.2 Toleranzregeln

```txt
tolerance must originate from package.allowed_local_controls
tolerance value must be within local control min/max
tolerance value must be within system range if system_range_key exists
out-of-range tolerance is normalized or blocked
local tolerance must not change package data
local tolerance must not change system_adjust
local tolerance must not change regio_content
```

Empfehlung:

- Leicht außerhalb liegende Werte können auf die erlaubte Grenze normalisiert werden.
- Stark oder strukturell ungültige Werte sollen blockiert werden.
- Jede Normalisierung wird in der Validation dokumentiert.

---

# 8. Lokale Darstellungspräferenzen

## 8.1 LocalDisplayPreferences

```ts
export interface LocalDisplayPreferences {
  display_intensity: LocalDisplayIntensity;
  show_warnings: boolean;
  show_route_badges: boolean;
  show_layer_legend: boolean;
  auto_focus_selected_route: boolean;
  enabled_layer_ids: string[];
  hidden_layer_ids: string[];
}
```

## 8.2 Darstellungsregeln

```txt
enabled_layer_ids must exist in package.public_layers
hidden_layer_ids must exist in package.public_layers
layer must be user_toggle_allowed to be hidden or shown by user
hidden_by_default layers may be shown only if user_toggle_allowed is true
forbidden/debug/raw layers cannot exist in local display layers
warning visibility must respect package public_warnings display_mode
```

---

# 9. Lokale Routenvorschläge

## 9.1 LocalRouteOption

```ts
export interface LocalRouteOption {
  route_option_id: string;
  source_route_option_id: string;
  route_mode_id: string;
  label: string;
  geometry: GeoJsonLineStringOrMultiLineString;
  total_length_meters: number;
  estimated_duration_seconds?: number;
  public_metrics?: PublicClassicRouteMetrics;
  scim_summary: PublicScimRouteSummary;
  local_rank: number;
  local_visibility: LocalRouteVisibility;
  local_status: LocalRouteStatus;
  warnings: LocalWarning[];
  selected: boolean;
  recommendation_reason?: LocalRecommendationReason;
}
```

## 9.2 LocalRouteStatus

```ts
export type LocalRouteStatus =
  | 'recommended'
  | 'available'
  | 'available_with_warnings'
  | 'degraded'
  | 'fallback_only'
  | 'hidden_by_filter'
  | 'not_available';
```

## 9.3 LocalRouteVisibility

```ts
export type LocalRouteVisibility =
  | 'visible_primary'
  | 'visible_secondary'
  | 'visible_warning'
  | 'visible_fallback'
  | 'hidden';
```

## 9.4 RecommendationReason

```ts
export type LocalRecommendationReason =
  | 'matches_selected_route_mode'
  | 'lowest_load_class'
  | 'fewest_warnings'
  | 'shortest_available'
  | 'fallback_due_no_low_load_alternative'
  | 'user_selected'
  | 'package_default';
```

## 9.5 Routenfilter-Regeln

```txt
only package.route_options may become LocalRouteOption
route option route_mode_id must be allowed locally
not_available routes must not be recommended
fallback_only routes require fallback_routes_enabled
warnings may lower local rank but do not necessarily hide route
movement_tolerance can hide or demote high load routes only if control affects route_filtering or route_sorting
stay_tolerance can hide or demote high stay context routes only if control affects route_filtering or route_sorting
selected route must be visible or explicitly selected with warning
```

---

# 10. Lokale Layer

## 10.1 LocalDisplayLayer

```ts
export interface LocalDisplayLayer {
  layer_id: string;
  source_layer_id: string;
  layer_type: SensusCoreLayerType;
  label: string;
  visible: boolean;
  user_toggle_allowed: boolean;
  display_intensity: LocalDisplayIntensity;
  feature_collection: GeoJSONFeatureCollection;
  legend_class?: LocalLayerLegendClass;
  status: LocalDisplayLayerStatus;
}
```

## 10.2 Status

```ts
export type LocalDisplayLayerStatus =
  | 'visible'
  | 'hidden_by_default'
  | 'hidden_by_user'
  | 'hidden_by_filter'
  | 'layer_warning'
  | 'layer_invalid';
```

## 10.3 LegendClass

```ts
export type LocalLayerLegendClass =
  | 'base'
  | 'load'
  | 'stay'
  | 'route'
  | 'warning'
  | 'restriction'
  | 'poi';
```

## 10.4 Layerregeln

```txt
local layer must originate from package.public_layers
local layer must not contain forbidden properties
local layer must not expose device counts
local layer must not expose raw signals
local layer must not expose debug properties
local layer visibility must respect user_toggle_allowed
local layer feature_collection must remain reduced
```

---

# 11. Lokale Warnungen und Hinweise

## 11.1 LocalWarning

```ts
export interface LocalWarning {
  warning_id: string;
  source_warning_id?: string;
  warning_type: SensusCoreWarningType;
  severity: 'info' | 'warning' | 'critical';
  message_key: string;
  display_text?: string;
  related_route_option_ids?: string[];
  related_layer_ids?: string[];
  display_mode: 'inline_route_hint' | 'map_badge' | 'modal' | 'toast' | 'hidden';
  user_dismissible: boolean;
  dismissed: boolean;
  visible: boolean;
}
```

## 11.2 Warnregeln

```txt
warning must originate from package.public_warnings or route option warnings
warning must not expose raw values
warning must not expose device counts
warning must not expose operator notes
warning may be hidden only if user_dismissible or warnings toggle allows it
critical warnings should not be silently hidden
privacy reduction warnings may explain reduction but not internal thresholds
```

---

# 12. View State

## 12.1 SensusCoreViewState

```ts
export interface SensusCoreViewState {
  view_state_id: string;
  local_sensus_core_context_id: string;
  representation_id: string;
  sensus_core_package_id: string;
  created_at: string;
  map_state: LocalMapState;
  visible_layers: LocalDisplayLayer[];
  visible_route_options: LocalRouteOption[];
  selected_route_option?: LocalRouteOption;
  visible_warnings: LocalWarning[];
  view_summary: SensusCoreViewSummary;
  validation: SensusCoreViewValidationResult;
  status: SensusCoreViewStatus;
}
```

## 12.2 ViewStatus

```ts
export type SensusCoreViewStatus =
  | 'not_rendered'
  | 'rendering'
  | 'sensus_core_view_rendered'
  | 'sensus_core_view_warning'
  | 'sensus_core_view_invalid'
  | 'sensus_core_view_error';
```

## 12.3 LocalMapState

```ts
export interface LocalMapState {
  center?: GeoPoint;
  zoom?: number;
  bounds?: BBox;
  selected_route_option_id?: string;
  highlighted_layer_ids: string[];
  map_mode: 'leaflet_view' | 'native_map_view' | 'hybrid';
}
```

## 12.4 ViewSummary

```ts
export interface SensusCoreViewSummary {
  visible_layer_count: number;
  visible_route_option_count: number;
  visible_warning_count: number;
  has_selected_route: boolean;
  has_recommended_route: boolean;
  fallback_visible: boolean;
  critical_warning_visible: boolean;
  error_count: number;
  warning_count: number;
}
```

---

# 13. Validierung

## 13.1 LocalValidationResult

```ts
export interface SensusCoreLocalValidationResult {
  is_valid: boolean;
  checked_at: string;
  errors: SensusCoreLocalIssue[];
  warnings: SensusCoreLocalIssue[];
}
```

## 13.2 ViewValidationResult

```ts
export interface SensusCoreViewValidationResult {
  is_valid: boolean;
  checked_at: string;
  errors: SensusCoreLocalIssue[];
  warnings: SensusCoreLocalIssue[];
}
```

## 13.3 Issue

```ts
export interface SensusCoreLocalIssue {
  code: SensusCoreLocalIssueCode;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}
```

## 13.4 IssueCode

```ts
export type SensusCoreLocalIssueCode =
  | 'MISSING_SENSUS_CORE_PACKAGE'
  | 'PACKAGE_NOT_READY'
  | 'PACKAGE_EMPTY'
  | 'LOCAL_CONTROL_NOT_ALLOWED'
  | 'LOCAL_CONTROL_OUT_OF_RANGE'
  | 'LOCAL_CONTROL_NORMALIZED'
  | 'ROUTE_MODE_NOT_ALLOWED'
  | 'ROUTE_OPTION_NOT_FOUND'
  | 'ROUTE_OPTION_NOT_AVAILABLE'
  | 'FALLBACK_NOT_ALLOWED'
  | 'LAYER_NOT_FOUND'
  | 'LAYER_TOGGLE_NOT_ALLOWED'
  | 'WARNING_NOT_DISMISSIBLE'
  | 'FORBIDDEN_RAW_DATA_FOUND'
  | 'FORBIDDEN_DEBUG_DATA_FOUND'
  | 'FORBIDDEN_OPERATOR_DATA_FOUND'
  | 'DEVICE_COUNT_FOUND'
  | 'VIEW_STATE_INVALID'
  | 'NO_VISIBLE_ROUTE_OPTIONS'
  | 'NO_VISIBLE_LAYERS';
```

## 13.5 Blockierende Validierungsregeln

```txt
missing sensus_core_package blocks local context
package status invalid blocks local context
route option not in package blocks selection
route mode not allowed blocks selection
local control outside range blocks or normalizes according to policy
raw data in local layer blocks view
Debug data in local layer blocks view
operator data in local layer blocks view
device count in local output blocks view
fallback route selected while fallback not allowed blocks selection
```

## 13.6 Warnende Validierungsregeln

```txt
no visible route options creates warning
no visible layers creates warning if map view expected
selected route has warnings creates warning
all low-load routes hidden creates warning
local tolerance normalized creates warning
critical warning dismissed attempt creates warning or block depending policy
```

---

# 14. UI-Struktur

Panel 10 besteht aus sechs Tabs:

1. **Lokale Routenauswahl**
2. **Lokale Toleranzen**
3. **Darstellungsintensität**
4. **Gefilterte Routenvorschläge**
5. **Kartenansicht**
6. **Hinweise und Warnungen**

---

## 14.1 Tab 1 – Lokale Routenauswahl

Zweck:

- Paket-Routentypen anzeigen,
- lokale Routenauswahl treffen,
- empfohlene Route anzeigen,
- Fallback-Logik sichtbar machen.

Anzeigen:

- verfügbare Route Modes,
- empfohlene Route,
- verfügbare Routen,
- Routen mit Warnung,
- Fallback-Routen,
- nicht verfügbare Routen nur optional als Erklärung.

Aktionen:

- Routentyp wählen,
- Route auswählen,
- Empfehlung übernehmen,
- Fallback ein-/ausschalten, falls erlaubt.

Validierung:

- gewählter Routentyp existiert,
- gewählte Route existiert,
- Route ist lokal sichtbar oder bewusst mit Warnung auswählbar,
- Fallback nur wenn erlaubt.

---

## 14.2 Tab 2 – Lokale Toleranzen

Zweck:

- erlaubte lokale Toleranzregler anzeigen,
- lokale Werte prüfen,
- effektive Toleranzen berechnen.

Anzeigen:

- Bewegungstoleranz,
- Aufenthaltstoleranz,
- Warnempfindlichkeit,
- erlaubter Bereich,
- Defaultwert,
- aktueller Wert,
- Normalisierungsstatus.

Aktionen:

- Toleranz setzen,
- auf Paketdefault zurücksetzen,
- Toleranzen validieren.

Validierung:

- Regler ist im Paket erlaubt,
- Wert liegt im erlaubten Bereich,
- System-Range wird nicht überschritten,
- keine System- oder Regio-Grenze wird verändert.

---

## 14.3 Tab 3 – Darstellungsintensität

Zweck:

- lokale Sichtbarkeit und Darstellungsstärke steuern,
- nur erlaubte Layer ein-/ausblenden,
- Warnintensität einstellen.

Anzeigen:

- Display-Modus,
- verfügbare Layer,
- sichtbare Layer,
- hidden-by-default Layer,
- Toggle-Erlaubnis,
- Legende.

Aktionen:

- Darstellungsintensität wählen,
- Layer ein-/ausblenden,
- Legende anzeigen,
- Warnhervorhebung ändern.

Validierung:

- Layer existiert im Paket,
- Layer ist user-toggleable,
- keine verbotene Datenklasse wird sichtbar,
- Darstellungsintensität verändert nur View, nicht Bewertung.

---

## 14.4 Tab 4 – Gefilterte Routenvorschläge

Zweck:

- lokale Filterwirkung sichtbar machen,
- sortierte Routenvorschläge anzeigen,
- Warn- und Fallback-Status erklären.

Anzeigen:

- lokale Rangfolge,
- Route Mode,
- Länge,
- Dauer,
- Load-Klasse,
- Stay-Kontext-Klasse,
- Warnungen,
- Fallback-Status,
- Empfehlungserklärung.

Aktionen:

- Route auswählen,
- Route hervorheben,
- Filterbericht anzeigen,
- ausgeblendete Routen erklären.

Validierung:

- nur Paket-Routen sichtbar,
- `not_available` nicht als normale Route,
- `fallback_only` nur wenn erlaubt,
- interne Scores nicht sichtbar.

---

## 14.5 Tab 5 – Kartenansicht

Zweck:

- lokale Sensus-Core-View darstellen,
- sichtbare Layer und Route anzeigen,
- Kartenstatus prüfen.

Anzeigen:

- Karte,
- sichtbare Layer,
- ausgewählte Route,
- Routenvorschläge,
- POIs reduziert,
- Warnbadges,
- Legende.

Aktionen:

- Route auf Karte fokussieren,
- Layer toggeln,
- Warnbadges öffnen,
- Kartenbounds anpassen.

Validierung:

- View nur aus Paketdaten,
- keine Debug-Layer,
- keine Rohdaten,
- keine Device Counts,
- sichtbare Features sind reduziert.

---

## 14.6 Tab 6 – Hinweise und Warnungen

Zweck:

- öffentliche Warnungen anzeigen,
- nutzergeeignete Erklärungen liefern,
- dismissible Warnungen lokal ausblenden.

Anzeigen:

- Warnungstyp,
- Schweregrad,
- Route-/Layer-Bezug,
- message_key oder lokalisierter Text,
- Anzeigeform,
- dismissible Status.

Aktionen:

- Warnung anzeigen,
- Warnung ausblenden, falls erlaubt,
- zu betroffener Route springen,
- zu betroffenem Layer springen.

Validierung:

- kritische Warnungen nicht still ausblenden,
- keine Rohwerte anzeigen,
- keine internen Schwellen offenlegen,
- Operatornotizen nicht anzeigen.

---

# 15. Mock-Daten

## 15.1 Mock Package-Ausschnitt

```ts
export const mockSensusCorePackageForLocalUse = {
  sensus_core_package_id: 'scp_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  package_version: 'scp_v1.0.0',
  public_layers: [],
  route_options: [
    {
      route_option_id: 'route_low_load_001',
      source_route_option_id: 'route_eval_001',
      route_mode_id: 'low_load',
      label: 'Auslastungsarme Route',
      total_length_meters: 8200,
      estimated_duration_seconds: 10800,
      scim_summary: {
        load_class: 'low',
        stay_context_class: 'medium',
        restriction_class: 'none',
        confidence_class: 'high'
      },
      status: 'recommended',
      warnings: [],
      local_filter_eligible: true,
      local_sort_eligible: true
    }
  ],
  allowed_local_controls: [
    {
      control_id: 'movement_tolerance',
      control_type: 'movement_tolerance_slider',
      enabled: true,
      default_value: 0.6,
      min_value: 0,
      max_value: 1,
      step: 0.05,
      local_only: true,
      affects: ['route_filtering', 'route_sorting']
    }
  ],
  public_warnings: [],
  status: 'sensus_core_package_ready'
};
```

## 15.2 Mock Local Selection

```ts
export const mockLocalUserSelection: LocalUserSelection = {
  selected_route_mode_id: 'low_load',
  selected_route_option_id: 'route_low_load_001',
  movement_tolerance: 0.6,
  stay_tolerance: 0.7,
  display_intensity: 'normal',
  warnings_enabled: true,
  fallback_routes_enabled: false,
  enabled_layer_ids: [],
  hidden_layer_ids: [],
  dismissed_warning_ids: []
};
```

---

# 16. Kontext-Apply-Funktion

```ts
export function applySensusCoreLocalStateToContext(
  context: ScimContext,
  localState: SensusCoreLocalState,
  viewState: SensusCoreViewState
): ScimContext {
  if (
    localState.status !== 'local_user_context_applied' &&
    localState.status !== 'local_user_context_warning'
  ) {
    throw new Error(`Cannot apply local state with status ${localState.status}.`);
  }

  if (
    viewState.status !== 'sensus_core_view_rendered' &&
    viewState.status !== 'sensus_core_view_warning'
  ) {
    throw new Error(`Cannot apply view state with status ${viewState.status}.`);
  }

  return {
    ...context,
    local_user_context: localState,
    view_state: viewState
  };
}
```

Regeln:

- Die Funktion darf nur `context.local_user_context` und `context.view_state` verändern.
- Alle anderen Kontextbereiche müssen unverändert bleiben.
- Ungültige lokale Auswahl darf nicht übernommen werden.
- Ungültige View darf nicht übernommen werden.

---

# 17. Übergabe an Folgepanel

Panel 10 gibt folgende Kontextsegmente weiter:

```json
{
  "local_user_context": {
    "local_sensus_core_context_id": "lsc_001",
    "representation_id": "rep_hochwab_nord_001",
    "sensus_core_package_id": "scp_hochwab_nord_001",
    "selected_route_mode_id": "low_load",
    "selected_route_option_id": "route_low_load_001",
    "effective_tolerances": {},
    "filtered_route_options": [],
    "local_display_layers": [],
    "visible_warnings": [],
    "status": "local_user_context_applied"
  },
  "view_state": {
    "view_state_id": "view_001",
    "local_sensus_core_context_id": "lsc_001",
    "visible_layers": [],
    "visible_route_options": [],
    "visible_warnings": [],
    "status": "sensus_core_view_rendered"
  }
}
```

## 17.1 Übergabe an Panel 11: Leaflet-Wirkungsprüfung

Panel 11 kann prüfen:

- ob die Sensus-Core-Vorschau dem Paket entspricht,
- ob sichtbare Layer korrekt reduziert sind,
- ob Originalwege-Vergleich und Sensus-Core-View plausibel sind,
- ob POI- und Radiusdarstellung reduziert bleibt,
- ob Routenvorschläge korrekt sichtbar sind,
- ob Warnungen korrekt erscheinen.

Panel 11 darf lokale View prüfen, aber nicht die lokale Auswahl fachlich neu bewerten.

---

# 18. Akzeptanzkriterien

## 18.1 Paketnutzung

- Panel 10 akzeptiert nur ein gültiges oder zulässig warnendes Sensus-Core-Paket.
- Fehlendes Paket blockiert lokale Anwendung.
- Ungültiger Paketstatus blockiert lokale Anwendung.
- Paketdaten werden nicht verändert.

## 18.2 Lokale Routenauswahl

- Nur Route Options aus dem Paket können lokal ausgewählt werden.
- Nur erlaubte Route Modes können ausgewählt werden.
- Nicht verfügbare Routen werden nicht als normale Route angeboten.
- Fallback-Routen erscheinen nur, wenn Fallback lokal und paketweit erlaubt ist.
- Eine ausgewählte Route wird im View State eindeutig referenziert.

## 18.3 Lokale Toleranzen

- Lokale Toleranzen stammen aus `package.allowed_local_controls`.
- Toleranzen bleiben innerhalb ihrer erlaubten Bereiche.
- Ungültige Werte werden normalisiert oder blockiert.
- Toleranzen verändern keine System- oder Regio-Kontexte.
- Toleranzen verändern keine Paketdaten.

## 18.4 Darstellungsintensität

- Darstellungsintensität wirkt nur auf lokale Sichtbarkeit und Hervorhebung.
- Layer-Toggles sind nur für erlaubte Layer möglich.
- Hidden-by-default Layer werden nur sichtbar, wenn Toggle erlaubt ist.
- Keine verbotenen Datenklassen werden sichtbar.

## 18.5 Gefilterte Routenvorschläge

- `filtered_route_options` enthält nur Paket-Routen.
- Lokale Rangfolge ist reproduzierbar.
- Warnstatus bleibt erhalten.
- Fallback-Status bleibt erhalten.
- Interne Scores werden nicht rekonstruiert.

## 18.6 Kartenansicht

- View State enthält nur reduzierte Layer.
- View State enthält keine Rohdaten.
- View State enthält keine Debugdaten.
- View State enthält keine Device Counts.
- Ausgewählte Route und sichtbare Layer sind konsistent.

## 18.7 Hinweise und Warnungen

- Warnungen stammen aus Paket oder Paket-Routen.
- Warnungen zeigen keine Rohwerte.
- Kritische Warnungen werden nicht still entfernt.
- Dismissible Warnungen können lokal ausgeblendet werden.
- Privacy-/Reduction-Hinweise erklären nur nutzergeeignet, nicht intern-technisch.

## 18.8 Kontextintegrität

- Panel 10 schreibt nur `context.local_user_context` und `context.view_state`.
- Alle anderen Kontextbereiche bleiben unverändert.
- Keine lokalen Aktionen verändern `context.sensus_core_package`.

---

# 19. Testfälle

## 19.1 Gültiges Paket und Default-Auswahl

**Given** ein `sensus_core_package_ready` Paket mit Route Options und lokalen Reglern.  
**When** Panel 10 initialisiert.  
**Then** entsteht ein gültiger `local_user_context` mit Default-Auswahl und ein gerenderter `view_state`.

## 19.2 Fehlendes Paket

**Given** `context.sensus_core_package` fehlt.  
**When** Panel 10 startet.  
**Then** blockiert `MISSING_SENSUS_CORE_PACKAGE`.

## 19.3 Paket nicht bereit

**Given** `sensus_core_package.status = 'sensus_core_package_invalid'`.  
**When** Panel 10 validiert.  
**Then** blockiert `PACKAGE_NOT_READY`.

## 19.4 Nicht erlaubter Routentyp

**Given** User wählt `route_mode_id = 'debug_route'`.  
**When** lokale Auswahl validiert wird.  
**Then** blockiert `ROUTE_MODE_NOT_ALLOWED`.

## 19.5 Nicht vorhandene Route

**Given** User wählt eine Route, die nicht in `package.route_options` existiert.  
**When** lokale Auswahl validiert wird.  
**Then** blockiert `ROUTE_OPTION_NOT_FOUND`.

## 19.6 Toleranz außerhalb Bereich

**Given** `movement_tolerance = 2.5`, erlaubt ist `0..1`.  
**When** lokale Toleranzen normalisiert werden.  
**Then** wird der Wert auf die erlaubte Grenze gesetzt oder mit `LOCAL_CONTROL_OUT_OF_RANGE` blockiert.

## 19.7 Fallback nicht erlaubt

**Given** User aktiviert Fallback, aber Paket erlaubt keinen Fallback-Regler.  
**When** lokale Auswahl validiert wird.  
**Then** blockiert `FALLBACK_NOT_ALLOWED`.

## 19.8 Layer Toggle nicht erlaubt

**Given** User blendet einen Layer aus, dessen `user_toggle_allowed = false` ist.  
**When** Layer Preferences validiert werden.  
**Then** wird `LAYER_TOGGLE_NOT_ALLOWED` erzeugt.

## 19.9 Debugdaten im lokalen Layer

**Given** ein lokaler Layer enthält `debug_data`.  
**When** View State validiert wird.  
**Then** blockiert `FORBIDDEN_DEBUG_DATA_FOUND`.

## 19.10 Device Count im lokalen Output

**Given** ein Feature enthält `device_count`.  
**When** View State validiert wird.  
**Then** blockiert `DEVICE_COUNT_FOUND`.

## 19.11 Keine sichtbaren Routen

**Given** alle Routen werden durch lokale Filter ausgeblendet.  
**When** Route Filter läuft.  
**Then** entsteht eine Warnung `NO_VISIBLE_ROUTE_OPTIONS` und, falls erlaubt, eine Fallback- oder Erklärungskarte.

## 19.12 Kritische Warnung ausblenden

**Given** eine kritische Warnung ist nicht dismissible.  
**When** User versucht sie auszublenden.  
**Then** wird die Ausblendung blockiert oder die Warnung bleibt sichtbar.

---

# 20. Codex-/Claude-Auftrag

```txt
Aufgabe:
Baue nur Panel 10: Sensus Core lokal. Das Panel nimmt ein freigegebenes Sensus-Core-Paket aus context.sensus_core_package, wendet erlaubte lokale User-Auswahl an und erzeugt context.local_user_context sowie context.view_state.

Zweck:
Lokale Routenauswahl, lokale Toleranzen, Darstellungsintensität, gefilterte Routenvorschläge, Kartenansicht sowie Hinweise und Warnungen für Sensus Core erzeugen.

Nicht-Ziele:
Keine Änderung von System-Adjust, Regio-Content, Ziel-App UI, Telco-Load, Boundary, Graph, POI-Modell, Load-Modell, Movement-Modell, Masking-Modell, Route Model, Layer Model oder Sensus-Core-Paket. Keine neue fachliche Routenbewertung. Keine Rohdaten, Debugdaten oder Operator-Daten anzeigen.

Erzeuge:
- TypeScript-Typen
- Mock-Daten
- Validierungsfunktionen
- lokale Auswahl-/Normalisierungsfunktionen
- lokale Routenfilterung
- lokale Layer-Komposition aus public_layers
- lokale Warnungsfilterung
- View-State Builder
- Kontext-Apply-Funktion
- React-Panel mit Tabs
- Unit-Tests

Tabs:
1. Lokale Routenauswahl
2. Lokale Toleranzen
3. Darstellungsintensität
4. Gefilterte Routenvorschläge
5. Kartenansicht
6. Hinweise und Warnungen

Output:
context.local_user_context mit local_sensus_core_context_id, representation_id, sensus_core_package_id, selected_route_mode_id, selected_route_option_id, local_user_selection, effective_tolerances, display_preferences, filtered_route_options, local_display_layers, visible_warnings, validation und status.

context.view_state mit view_state_id, local_sensus_core_context_id, representation_id, sensus_core_package_id, map_state, visible_layers, visible_route_options, selected_route_option, visible_warnings, validation und status.

Validierung:
Blockiere fehlendes oder ungültiges Sensus-Core-Paket, nicht erlaubte Route Modes, nicht vorhandene Route Options, lokale Regler außerhalb erlaubter Bereiche, nicht erlaubte Fallback-Nutzung, nicht erlaubte Layer-Toggles, Rohdaten, Debugdaten, Operator-Daten und Device Counts im lokalen Output.

Akzeptanzkriterien:
Ein gültiger Mock kann geladen, lokal gefiltert, dargestellt und in context.local_user_context sowie context.view_state übernommen werden. Ungültige lokale Auswahl wird blockiert oder normalisiert. Die Übergabe verändert keine anderen Kontextbereiche.
```

---

# 21. Kernaussage für Panel 10

Panel 10 ist kein zweiter Package Builder und keine neue Engine-Stufe. Es ist die lokale Anwendungsschicht von Sensus Core.

Wenn Panel 10 zu viel darf, kann es die harte Ausspielgrenze aus Panel 9 unterlaufen. Deshalb darf es nur innerhalb des Pakets arbeiten: erlaubte Routen, erlaubte Layer, erlaubte lokale Regler und erlaubte Warnungen.

Die fachliche SCIM-Bewertung bleibt unverändert. Lokal verändert werden nur Auswahl, Filterung, Sortierung, Sichtbarkeit und View State.
