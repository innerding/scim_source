# SCIM Panel 11 – Leaflet-Wirkungsprüfung

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor den konkreten Panel-Auftrag. Sie stellt sicher, dass Panel 11 nicht als isolierte Leaflet-Karte, Debug-Ansicht oder Freigabedialog gebaut wird, sondern als abschließendes Wirkungsprüfpanel zwischen lokaler Sensus-Core-Anwendung und Freigabe/Export.

### 0.1 SCIM-Gesamtsystem

SCIM ist ein Gesamtsystem aus:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokaler Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 11 liegt nach Panel 10 und vor Panel 12. Es nimmt die berechneten Engine-Ergebnisse, das Sensus-Core-Paket, die lokale Sensus-Core-View und die bestehenden Leaflet-Prüfzustände auf und prüft visuell, ob die SCIM-Wirkung korrekt, plausibel, reduziert und freigabefähig ist.

Panel 11 berechnet keine neue SCIM-Fachlogik. Es baut keine neuen Aufenthalte, keine neuen Bewegungslasten, keine neuen Routenabschnitte, keine neuen Sensus-Core-Pakete und keine neue lokale User-Auswahl. Es prüft, ob die vorhandenen Ergebnisse in Leaflet konsistent, nachvollziehbar und datenschutzkonform dargestellt werden.

Leitsatz:

> Panel 11 verändert nicht die SCIM-Ergebnisse. Es prüft ihre sichtbare Wirkung vor Freigabe und Export.

---

### 0.2 Rollenklärung

**SCIM-Engine**  
Die Engine hat vor Panel 11 bereits Graph, POIs, Load-Projektionen, Aufenthalte, Bewegung, Maskierung, Routenabschnitte, Routenoptionen und Layer-Kandidaten berechnet.

**Leaflet**  
Leaflet ist in Panel 11 das zentrale Prüf- und Vergleichswerkzeug. Leaflet zeigt Operator-Vorschau, Sensus-Core-Vorschau, Originalwege, POI-Radien, Routenabschnitte, Warnungen und Fehlerlagen nebeneinander oder überlagert an. Leaflet berechnet keine SCIM-Logik und darf keine verdeckten Daten in die Sensus-Core-Vorschau durchreichen.

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät beziehungsweise in der laufzeitnahen App-Representation. Panel 11 prüft, ob die in Panel 9 paketierte und in Panel 10 lokal angewendete Sensus-Core-Sicht korrekt, reduziert und konsistent dargestellt wird.

**Freigabe und Export**  
Panel 12 darf nur auf einer bestandenen oder bewusst mit Warnung bestätigten Wirkungsprüfung aufbauen. Panel 11 erzeugt dafür den visuellen Prüfstatus, die Prüfergebnisse und die Fehlerliste.

---

### 0.3 Aktuelle Panel-Zählung

In der aktuellen finalen 12-Panel-Struktur ist dieses Panel:

```txt
Panel 11: Leaflet-Wirkungsprüfung
```

Tabs:

1. Operator-Vorschau
2. Sensus-Core-Vorschau
3. Originalwege-Vergleich
4. POI- und Radiusprüfung
5. Routenprüfung
6. Fehlerliste

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
  leaflet_effect_check?: LeafletEffectCheckState;
  release?: unknown;
  status?: ScimGlobalStatus;
}
```

Panel 11 darf schreiben in:

```ts
context.leaflet_effect_check
```

Panel 11 darf lesen aus:

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

Panel 11 darf nicht schreiben in:

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

Panel 11 ist besonders wichtig, weil hier die letzte sichtbare Prüfung vor Freigabe und Export erfolgt. Wenn dieses Panel zu weich gebaut wird, können unplausible Layer, falsch reduzierte Sensus-Core-Ansichten, fehlende Originalwege-Vergleiche oder Datenschutzverletzungen in eine Freigabe rutschen.

---

### 0.6 Datenschutzgrenze

Panel 11 darf keine Datenschutzgrenzen aufweichen. Gerade weil es Operator- und Sensus-Core-Vorschau nebeneinander zeigt, muss die Trennung strikt bleiben.

Nicht erlaubt in der Sensus-Core-Vorschau:

- Rohsignale,
- Einzelsignale,
- einzelne Geräte,
- Device Counts,
- Signal Counts, sofern nicht ausdrücklich reduziert freigegeben,
- individuelle Bewegungswege,
- individuelle Aufenthaltsdauer,
- exakte Signalgruppen,
- Debug-GeoJSON,
- Operator-Layer,
- Operatornotizen,
- interne Score-Zwischenwerte,
- nicht freigegebene POI-Kandidaten,
- nicht freigegebene Routenoptionen,
- nicht freigegebene Layer.

Operator-Ansichten dürfen technische Prüfinformationen enthalten, müssen aber eindeutig als Operator- oder Debug-Ansicht getrennt sein und dürfen nicht in die Sensus-Core-Vorschau überlaufen.

Leitsatz:

> Panel 11 darf Debug sichtbar prüfen, aber niemals Debug als Sensus-Core-Wirkung bestätigen.

---

### 0.7 System-Adjust-Vorrang

Panel 11 ist abhängig von `context.system_adjust`, ohne System-Adjust aber kein neues Berechnungspanel.

System-Adjust begrenzt Panel 11 insbesondere bei:

- Sensus-Core-Sichtbarkeit,
- Debug- und Rohdaten-Ausschluss,
- Mindestaggregation für sichtbare Auslastungsinformationen,
- erlaubten Layerklassen,
- erlaubter Reduktion,
- Exportfähigkeit,
- Prüfschärfe für Datenschutzfehler.

Panel 11 darf System-Adjust nicht verändern. Es darf nur prüfen, ob die sichtbaren Ergebnisse System-Adjust einhalten.

---

### 0.8 Abhängigkeit von Panel 10

Panel 11 ist direkter Abnehmer von Panel 10.

Panel 10 gibt `local_user_context` und `view_state` weiter. Panel 11 prüft:

- ob die Sensus-Core-Vorschau dem Paket entspricht,
- ob sichtbare Layer korrekt reduziert sind,
- ob Originalwege-Vergleich und Sensus-Core-View plausibel sind,
- ob POI- und Radiusdarstellung reduziert bleibt,
- ob Routenvorschläge korrekt sichtbar sind,
- ob Warnungen korrekt erscheinen.

Panel 11 darf lokale View prüfen, aber nicht die lokale Auswahl fachlich neu bewerten.

---

### 0.9 Trennung von Operator-Vorschau und Sensus-Core-Vorschau

Panel 11 muss zwei Sichtwelten strikt trennen.

1. **Operator-Vorschau**  
   Darf technische Prüfdaten, Debug-Layer, interne IDs und detaillierte Statuswerte enthalten, sofern sie klar als nicht exportfähig markiert sind.

2. **Sensus-Core-Vorschau**  
   Darf nur reduzierte öffentliche Layer, erlaubte Routenvorschläge, erlaubte Warnungen und lokale UI-Wirkung enthalten.

Eine Umschaltung zwischen beiden Vorschauen darf niemals Layerobjekte vermischen. Jede Vorschau muss aus ihrer zulässigen Quelle gebaut werden.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**Leaflet-Wirkungsprüfung**

Technischer Modulname:

```ts
LeafletEffectCheckPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
validateLeafletEffectInputs()
buildOperatorPreview()
buildSensusCorePreview()
compareOriginalWaysWithScimLayers()
checkPoiAndRadiusEffect()
checkRouteEffect()
collectLeafletEffectIssues()
validateLeafletEffectCheck()
applyLeafletEffectCheckToContext()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/leaflet-effect-check/
  LeafletEffectCheckPanel.tsx
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

---

# 2. Zweck des Panels

Panel 11 erzeugt eine visuelle und technische Wirkungsprüfung der zuvor erzeugten SCIM-Ergebnisse in Leaflet.

Es beantwortet für Panel 12:

- Ist die Operator-Vorschau vollständig und nachvollziehbar?
- Entspricht die Sensus-Core-Vorschau dem Paket und der lokalen View?
- Wurden Originalwege korrekt ersetzt, überlagert oder abgeschwächt?
- Stimmen POI-Radien, Aufenthaltsbereiche und reduzierte POI-Darstellung räumlich?
- Stimmen bewertete Routenabschnitte, Routenvorschläge und Warnungen überein?
- Sind Debug-, Roh- und Operator-Daten sauber von Sensus-Core-Daten getrennt?
- Gibt es blockierende Fehler vor Freigabe und Export?

Leitsatz:

> Panel 11 ist die visuelle Endkontrolle der SCIM-Wirkung vor Freigabe und Export.

---

# 3. Nicht-Ziele

Panel 11 darf nicht:

- System-Adjust-Grenzen ändern,
- Regio-Content ändern,
- Ziel-App-UI-Profile ändern,
- Telco-Load-Batches ändern,
- Boundary oder Extraktion ändern,
- Graphen bauen,
- POIs freigeben,
- Aufenthalte klassifizieren,
- Bewegungsauslastung berechnen,
- Maskierungen neu berechnen,
- Routenabschnitte neu bewerten,
- Sensus-Core-Pakete erzeugen oder verändern,
- lokale User-Auswahl verändern,
- finale Freigabe oder Export durchführen.

Panel 11 ist ein Prüfpanel. Freigabe und Export folgen in Panel 12.

---

# 4. Fachliche Verantwortung

Panel 11 hat sechs fachliche Kernaufgaben.

## 4.1 Operator-Vorschau prüfen

Die Operator-Vorschau zeigt die technische SCIM-Wirkung mit ausreichender Prüftiefe.

Sie darf enthalten:

- Boundary und Buffer,
- Basisgraph und Basislayer,
- POIs und bestätigte Radien,
- Aufenthaltsbereiche,
- Bewegungsauslastung,
- Maskierungen,
- Routenabschnitte,
- Abwertungen und Ausschlüsse,
- regionale Sperren und Hinweise,
- Debug-Overlays, sofern klar getrennt.

Die Operator-Vorschau ist nicht automatisch exportfähig.

## 4.2 Sensus-Core-Vorschau prüfen

Die Sensus-Core-Vorschau zeigt nur das, was aus Paket und lokaler View erlaubt ist.

Geprüft wird:

- sichtbare Layer stammen aus `sensus_core_package.public_layers` oder `view_state.visible_layers`,
- sichtbare Routen stammen aus `view_state.visible_route_options`,
- sichtbare Warnungen stammen aus `view_state.visible_warnings`,
- reduzierte Darstellung bleibt reduziert,
- keine Operator-, Debug- oder Rohdaten erscheinen.

## 4.3 Originalwege vergleichen

Panel 11 prüft, ob Originalwege, Basiswege und SCIM-Ergebnis plausibel zueinander liegen.

Mögliche Prüfungen:

- Originalwege abschwächen oder ein-/ausblenden,
- SCIM-Basislayer darüberlegen,
- Route Sections gegen Originalwege prüfen,
- fehlende, versetzte oder doppelte Wege markieren,
- Boundary- und Buffer-Schnitte kontrollieren,
- Randanschlüsse prüfen.

## 4.4 POI- und Radiusprüfung durchführen

Panel 11 prüft die visuelle Wirkung von POIs und Radien.

Geprüft wird:

- freigegebene POIs erscheinen korrekt,
- abgelehnte POIs erscheinen nicht in Sensus-Core,
- bestätigte Radien stimmen mit Regio-Content und POI-Modell überein,
- Aufenthaltsbereiche liegen räumlich plausibel,
- Vergleichssäume erscheinen nur in Operator-/Prüfansicht,
- reduzierte Sensus-Core-Radien verletzen keine Datenschutz- oder Reduktionsregel.

## 4.5 Routenprüfung durchführen

Panel 11 prüft die Wirkung der Routenbewertung und lokalen Sensus-Core-Filterung.

Geprüft wird:

- Route Sections liegen auf Graph/Basislayer,
- Routenvorschläge bestehen aus bewerteten Abschnitten,
- abgewertete und ausgeschlossene Abschnitte sind in Operator-Ansicht unterscheidbar,
- lokale Route Options entsprechen `view_state.visible_route_options`,
- Warnungen passen zu Routenstatus,
- Sensus-Core-Vorschau zeigt keine debug-only Route.

## 4.6 Fehlerliste erzeugen

Panel 11 sammelt alle visuellen, technischen, fachlichen und datenschutzbezogenen Befunde in einer einheitlichen Fehlerliste.

Fehler können sein:

- blockierend,
- nicht blockierend,
- Warnung,
- Hinweis,
- operator-only,
- sensus-core-relevant.

Nur ein gültiger oder bewusst warnender Wirkungsprüfstatus darf an Panel 12 übergeben werden.

---

# 5. Datenmodell

## 5.1 LeafletEffectCheckState

```ts
export interface LeafletEffectCheckState {
  leaflet_effect_check_id: string;
  representation_id: string;
  checked_at: string;
  source_refs: LeafletEffectSourceRefs;
  operator_preview: OperatorPreviewState;
  sensus_core_preview: SensusCorePreviewState;
  original_way_comparison: OriginalWayComparisonState;
  poi_radius_check: PoiRadiusEffectCheckState;
  route_effect_check: RouteEffectCheckState;
  issue_list: LeafletEffectIssue[];
  check_summary: LeafletEffectCheckSummary;
  validation: LeafletEffectValidationResult;
  status: LeafletEffectCheckStatus;
}
```

## 5.2 LeafletEffectCheckStatus

```ts
export type LeafletEffectCheckStatus =
  | 'not_checked'
  | 'checking'
  | 'leaflet_effect_valid'
  | 'leaflet_effect_warning'
  | 'leaflet_effect_invalid'
  | 'leaflet_effect_blocked'
  | 'leaflet_effect_error';
```

## 5.3 LeafletEffectSourceRefs

```ts
export interface LeafletEffectSourceRefs {
  system_adjust_version?: string;
  regio_content_version?: string;
  target_app_ui_version?: string;
  representation_id: string;
  boundary_id?: string;
  graph_id?: string;
  basis_layer_id?: string;
  route_model_id?: string;
  route_layer_model_id?: string;
  sensus_core_package_id?: string;
  local_sensus_core_context_id?: string;
  view_state_id?: string;
}
```

Regeln:

```txt
representation_id must exist
source_refs must match context representation_id
sensus_core_package_id should exist for Sensus-Core preview
view_state_id should exist for local preview
route_model_id should exist for route check
basis_layer_id should exist for original-way comparison
```

---

# 6. OperatorPreviewState

## 6.1 Typ

```ts
export interface OperatorPreviewState {
  preview_id: string;
  map_mode: 'leaflet';
  visible_overlays: OperatorPreviewOverlay[];
  selected_overlay_ids: string[];
  inspected_object_id?: string;
  object_inspection?: OperatorObjectInspection;
  status: OperatorPreviewStatus;
}
```

## 6.2 Overlay-Typen

```ts
export type OperatorPreviewOverlay =
  | 'boundary'
  | 'buffer'
  | 'original_ways'
  | 'extracted_ways'
  | 'basis_layer'
  | 'graph_edges'
  | 'graph_nodes'
  | 'approved_pois'
  | 'poi_radii'
  | 'comparison_margins'
  | 'stay_areas'
  | 'movement_load'
  | 'masked_edges'
  | 'route_sections'
  | 'route_options'
  | 'degraded_sections'
  | 'excluded_sections'
  | 'regional_restrictions'
  | 'jam_indicators'
  | 'debug_graph'
  | 'debug_route';
```

## 6.3 Status

```ts
export type OperatorPreviewStatus =
  | 'not_rendered'
  | 'rendering'
  | 'operator_preview_rendered'
  | 'operator_preview_warning'
  | 'operator_preview_invalid';
```

## 6.4 OperatorObjectInspection

```ts
export interface OperatorObjectInspection {
  object_id: string;
  object_type:
    | 'node'
    | 'edge'
    | 'route_section'
    | 'route_option'
    | 'poi'
    | 'stay_area'
    | 'mask'
    | 'restriction'
    | 'warning'
    | 'layer_feature';
  source_panel:
    | 'panel_5'
    | 'panel_6'
    | 'panel_7'
    | 'panel_8'
    | 'panel_9'
    | 'panel_10';
  display_properties: Record<string, unknown>;
  export_eligible: boolean;
  sensus_core_eligible: boolean;
}
```

Regeln:

```txt
operator preview may show debug overlays
debug overlays must be marked non-exportable
operator-only objects must not appear in Sensus-Core preview
object inspection must never expose raw signal payloads
```

---

# 7. SensusCorePreviewState

## 7.1 Typ

```ts
export interface SensusCorePreviewState {
  preview_id: string;
  source_package_id: string;
  source_view_state_id: string;
  map_mode: 'leaflet_view' | 'native_map_view' | 'hybrid';
  visible_layers: SensusCorePreviewLayer[];
  visible_route_options: SensusCorePreviewRouteOption[];
  visible_warnings: SensusCorePreviewWarning[];
  selected_route_option_id?: string;
  reduction_check: SensusCoreReductionCheck;
  status: SensusCorePreviewStatus;
}
```

## 7.2 Status

```ts
export type SensusCorePreviewStatus =
  | 'not_rendered'
  | 'rendering'
  | 'sensus_core_preview_rendered'
  | 'sensus_core_preview_warning'
  | 'sensus_core_preview_invalid'
  | 'sensus_core_preview_blocked';
```

## 7.3 SensusCorePreviewLayer

```ts
export interface SensusCorePreviewLayer {
  layer_id: string;
  source_layer_id: string;
  layer_type: string;
  label: string;
  visible: boolean;
  feature_count: number;
  reduced: boolean;
  contains_forbidden_properties: boolean;
  status: 'visible' | 'hidden' | 'warning' | 'invalid';
}
```

## 7.4 SensusCorePreviewRouteOption

```ts
export interface SensusCorePreviewRouteOption {
  route_option_id: string;
  source_route_option_id: string;
  route_mode_id: string;
  label: string;
  visible: boolean;
  selected: boolean;
  local_status: string;
  warning_count: number;
  contains_forbidden_properties: boolean;
}
```

## 7.5 SensusCorePreviewWarning

```ts
export interface SensusCorePreviewWarning {
  warning_id: string;
  warning_type: string;
  severity: 'info' | 'warning' | 'critical';
  visible: boolean;
  source_warning_id?: string;
  contains_raw_values: boolean;
}
```

## 7.6 SensusCoreReductionCheck

```ts
export interface SensusCoreReductionCheck {
  raw_signals_found: boolean;
  debug_data_found: boolean;
  operator_data_found: boolean;
  device_counts_found: boolean;
  signal_counts_found: boolean;
  internal_scores_found: boolean;
  not_released_content_found: boolean;
  reduction_valid: boolean;
}
```

Regeln:

```txt
raw_signals_found blocks preview
debug_data_found blocks Sensus-Core preview
operator_data_found blocks Sensus-Core preview
device_counts_found blocks Sensus-Core preview
not_released_content_found blocks preview
signal_counts_found warning or blocker depending on reduction profile
internal_scores_found warning or blocker depending on reduction profile
```

---

# 8. OriginalWayComparisonState

## 8.1 Typ

```ts
export interface OriginalWayComparisonState {
  comparison_id: string;
  original_way_layer_available: boolean;
  extracted_way_layer_available: boolean;
  basis_layer_available: boolean;
  route_layer_available: boolean;
  comparison_items: OriginalWayComparisonItem[];
  status: OriginalWayComparisonStatus;
}
```

## 8.2 Status

```ts
export type OriginalWayComparisonStatus =
  | 'not_checked'
  | 'comparison_valid'
  | 'comparison_warning'
  | 'comparison_invalid'
  | 'comparison_blocked';
```

## 8.3 OriginalWayComparisonItem

```ts
export interface OriginalWayComparisonItem {
  item_id: string;
  comparison_type:
    | 'original_to_extracted'
    | 'extracted_to_graph'
    | 'graph_to_basis_layer'
    | 'basis_to_route_layer'
    | 'boundary_cut'
    | 'buffer_connection';
  related_source_id?: string;
  related_target_id?: string;
  spatial_relation:
    | 'aligned'
    | 'slightly_shifted'
    | 'missing_in_target'
    | 'extra_in_target'
    | 'duplicated'
    | 'outside_boundary_expected'
    | 'outside_boundary_unexpected';
  severity: 'info' | 'warning' | 'error';
  blocking: boolean;
  message: string;
}
```

Regeln:

```txt
missing original ways may warn if source unavailable
missing extracted ways block if expected ways exist
basis layer must align with graph edges
route layer must align with evaluated route sections
buffer-only objects may exist but must be marked as buffer-only
boundary cuts must be intentional and documented
```

---

# 9. PoiRadiusEffectCheckState

## 9.1 Typ

```ts
export interface PoiRadiusEffectCheckState {
  check_id: string;
  checked_pois: PoiRadiusCheckItem[];
  checked_stay_areas: StayAreaCheckItem[];
  status: PoiRadiusEffectCheckStatus;
}
```

## 9.2 Status

```ts
export type PoiRadiusEffectCheckStatus =
  | 'not_checked'
  | 'poi_radius_valid'
  | 'poi_radius_warning'
  | 'poi_radius_invalid'
  | 'poi_radius_blocked';
```

## 9.3 PoiRadiusCheckItem

```ts
export interface PoiRadiusCheckItem {
  active_poi_id: string;
  regio_poi_id: string;
  appears_in_operator_preview: boolean;
  appears_in_sensus_core_preview: boolean;
  radius_matches_regio_content: boolean;
  radius_matches_poi_model: boolean;
  reduced_display_valid: boolean;
  rejected_or_pending_visible_in_sensus_core: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
}
```

## 9.4 StayAreaCheckItem

```ts
export interface StayAreaCheckItem {
  stay_area_id: string;
  active_poi_id: string;
  appears_in_operator_preview: boolean;
  appears_in_sensus_core_preview: boolean;
  geometry_matches_radius: boolean;
  comparison_margin_operator_only: boolean;
  related_masked_edge_ids: string[];
  route_context_visible: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
}
```

Regeln:

```txt
approved POIs may appear in Sensus-Core if target app profile allows it
rejected POIs must not appear in Sensus-Core
pending POIs must not appear in Sensus-Core
comparison margins should be operator-only unless explicitly reduced
stay areas must align with confirmed POI radius
masking related to stay areas must be traceable in operator preview
```

---

# 10. RouteEffectCheckState

## 10.1 Typ

```ts
export interface RouteEffectCheckState {
  check_id: string;
  checked_sections: RouteSectionEffectCheckItem[];
  checked_route_options: RouteOptionEffectCheckItem[];
  checked_warnings: RouteWarningEffectCheckItem[];
  status: RouteEffectCheckStatus;
}
```

## 10.2 Status

```ts
export type RouteEffectCheckStatus =
  | 'not_checked'
  | 'route_effect_valid'
  | 'route_effect_warning'
  | 'route_effect_invalid'
  | 'route_effect_blocked';
```

## 10.3 RouteSectionEffectCheckItem

```ts
export interface RouteSectionEffectCheckItem {
  route_section_id: string;
  appears_in_operator_preview: boolean;
  appears_in_sensus_core_preview: boolean;
  aligns_with_graph_edges: boolean;
  status_matches_route_model: boolean;
  degraded_visible_as_degraded: boolean;
  excluded_visible_as_excluded_or_hidden: boolean;
  stay_context_visible_or_reduced: boolean;
  masking_traceable_operator: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
}
```

## 10.4 RouteOptionEffectCheckItem

```ts
export interface RouteOptionEffectCheckItem {
  route_option_id: string;
  appears_in_operator_preview: boolean;
  appears_in_sensus_core_preview: boolean;
  exists_in_route_model: boolean;
  exists_in_package_or_view_state: boolean;
  selected_if_expected: boolean;
  warning_count_matches: boolean;
  contains_debug_or_raw_data: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
}
```

## 10.5 RouteWarningEffectCheckItem

```ts
export interface RouteWarningEffectCheckItem {
  warning_id: string;
  related_route_option_id?: string;
  related_route_section_id?: string;
  appears_in_operator_preview: boolean;
  appears_in_sensus_core_preview: boolean;
  sensus_core_eligible: boolean;
  message_reduced: boolean;
  severity_matches_source: boolean;
  contains_operator_note: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
}
```

Regeln:

```txt
route sections must align with graph edges
route options must exist in route_model before appearing in package or view
local selected route must exist in view_state.visible_route_options
debug-only routes must not appear in Sensus-Core preview
excluded sections may appear in operator view; Sensus-Core behavior depends on package and target_app_ui
warnings in Sensus-Core must be reduced and eligible
```

---

# 11. Fehler- und Validierungsmodell

## 11.1 LeafletEffectIssue

```ts
export interface LeafletEffectIssue {
  issue_id: string;
  code: LeafletEffectIssueCode;
  severity: 'info' | 'warning' | 'error';
  tab:
    | 'operator_preview'
    | 'sensus_core_preview'
    | 'original_way_comparison'
    | 'poi_radius_check'
    | 'route_check'
    | 'global';
  field?: string;
  related_id?: string;
  message: string;
  suggested_fix?: string;
  blocking: boolean;
  sensus_core_relevant: boolean;
  operator_only: boolean;
}
```

## 11.2 IssueCodes

```ts
export type LeafletEffectIssueCode =
  | 'MISSING_REQUIRED_INPUT'
  | 'REPRESENTATION_ID_MISMATCH'
  | 'OPERATOR_PREVIEW_NOT_RENDERED'
  | 'SENSUS_CORE_PREVIEW_NOT_RENDERED'
  | 'SENSUS_CORE_PACKAGE_MISSING'
  | 'VIEW_STATE_MISSING'
  | 'ORIGINAL_WAY_LAYER_MISSING'
  | 'EXTRACTED_WAY_MISSING'
  | 'BASIS_LAYER_MISMATCH'
  | 'ROUTE_LAYER_MISMATCH'
  | 'POI_RADIUS_MISMATCH'
  | 'REJECTED_POI_VISIBLE_IN_SENSUS_CORE'
  | 'PENDING_POI_VISIBLE_IN_SENSUS_CORE'
  | 'COMPARISON_MARGIN_VISIBLE_IN_SENSUS_CORE'
  | 'STAY_AREA_GEOMETRY_MISMATCH'
  | 'MASKING_NOT_TRACEABLE'
  | 'ROUTE_OPTION_NOT_IN_ROUTE_MODEL'
  | 'ROUTE_OPTION_NOT_IN_PACKAGE'
  | 'LOCAL_ROUTE_NOT_IN_VIEW_STATE'
  | 'ROUTE_WARNING_NOT_REDUCED'
  | 'DEBUG_LAYER_VISIBLE_IN_SENSUS_CORE'
  | 'RAW_SIGNAL_VISIBLE_IN_SENSUS_CORE'
  | 'DEVICE_COUNT_VISIBLE_IN_SENSUS_CORE'
  | 'OPERATOR_NOTE_VISIBLE_IN_SENSUS_CORE'
  | 'UNRELEASED_CONTENT_VISIBLE'
  | 'LEAFLET_RENDER_ERROR'
  | 'NO_BLOCKING_ERRORS_BUT_WARNINGS';
```

## 11.3 LeafletEffectValidationResult

```ts
export interface LeafletEffectValidationResult {
  is_valid: boolean;
  checked_at: string;
  errors: LeafletEffectIssue[];
  warnings: LeafletEffectIssue[];
  info: LeafletEffectIssue[];
  blocking_issue_count: number;
  sensus_core_blocker_count: number;
  operator_warning_count: number;
}
```

## 11.4 LeafletEffectCheckSummary

```ts
export interface LeafletEffectCheckSummary {
  operator_preview_ready: boolean;
  sensus_core_preview_ready: boolean;
  original_way_comparison_ready: boolean;
  poi_radius_check_ready: boolean;
  route_check_ready: boolean;
  blocking_issue_count: number;
  warning_count: number;
  info_count: number;
  sensus_core_reduction_valid: boolean;
  ready_for_release_panel: boolean;
}
```

---

# 12. UI-Struktur

Panel 11 besteht aus sechs Tabs.

## 12.1 Tab 1 – Operator-Vorschau

Zweck:

- technische SCIM-Wirkung vollständig prüfen.

Anzeigen:

- Boundary,
- Buffer,
- Basisgraph,
- POIs und Radien,
- Aufenthaltsbereiche,
- Bewegungslast,
- Maskierungen,
- Routenabschnitte,
- regionale Hinweise,
- Debug-Overlays.

Aktionen:

- Operator-Overlays ein-/ausblenden,
- Layerreihenfolge ändern,
- Objekt anklicken und Prüfdaten anzeigen,
- Operator-Prüfstatus erzeugen.

## 12.2 Tab 2 – Sensus-Core-Vorschau

Zweck:

- Endgerätewirkung prüfen.

Anzeigen:

- reduzierte public layers,
- sichtbare Routenvorschläge,
- sichtbare Warnungen,
- lokale Darstellungsintensität,
- ausgewählte Route,
- keine Debug- oder Rohdaten.

Aktionen:

- Sensus-Core-Ansicht rendern,
- Paket-/View-Abgleich ausführen,
- Reduktionsverletzungen markieren.

## 12.3 Tab 3 – Originalwege-Vergleich

Zweck:

- Originalwege, Basislayer und SCIM-Layer räumlich vergleichen.

Anzeigen:

- Originalwege,
- extrahierte Wege,
- Graphkanten,
- Basislayer,
- Route-Layer,
- Boundary- und Buffer-Schnitt.

Aktionen:

- Originalwege ein-/ausblenden,
- SCIM-Layer überlagern,
- Abweichungen markieren,
- Randanschlüsse prüfen.

## 12.4 Tab 4 – POI- und Radiusprüfung

Zweck:

- POI-, Radius-, Aufenthalts- und Reduktionswirkung prüfen.

Anzeigen:

- freigegebene POIs,
- bestätigte Radien,
- Aufenthaltsbereiche,
- Vergleichssäume in Operator-Ansicht,
- reduzierte POI-Darstellung in Sensus-Core,
- POI-bezogene Fehler.

Aktionen:

- POI-Overlay prüfen,
- Radiusabgleich ausführen,
- Sensus-Core-Reduktion prüfen,
- Konflikte in Fehlerliste übernehmen.

## 12.5 Tab 5 – Routenprüfung

Zweck:

- Routenwirkung visuell und technisch prüfen.

Anzeigen:

- Routenabschnitte,
- Route Options,
- ausgewählte lokale Route,
- abgewertete Abschnitte,
- ausgeschlossene Abschnitte,
- Warnungen,
- Aufenthalts- und Maskierungskontext.

Aktionen:

- Routenprüfung ausführen,
- Route gegen Abschnitte validieren,
- Warnungen gegen Routenstatus prüfen,
- Sensus-Core-Kandidaten prüfen.

## 12.6 Tab 6 – Fehlerliste

Zweck:

- alle Prüfprobleme zentral anzeigen und Übergabe an Panel 12 steuern.

Anzeigen:

- Fehlercode,
- Schweregrad,
- betroffener Tab,
- betroffene Objekt-ID,
- Meldung,
- blockierend ja/nein,
- vorgeschlagene Korrektur.

Aktionen:

- Fehler nach Schweregrad filtern,
- betroffene Objekte auf Karte fokussieren,
- Prüfbericht erzeugen,
- Status für Panel 12 setzen.

---

# 13. Validierungsregeln

## 13.1 Eingangsvalidierung

Blockierend:

```txt
context.representation_id missing
context.boundary missing
context.sensus_core_package missing
context.view_state missing
representation_id mismatch between package, view_state and context
route_model missing when route check is enabled
route_layer_model missing when route check is enabled
basis_layer missing when original-way comparison is enabled
```

Warnend:

```txt
original way layer unavailable
operator debug layer unavailable
leaflet_route_check missing but route_model exists
poi_model missing but POI check enabled
local_user_context missing but view_state exists
```

## 13.2 Operator-Vorschau-Regeln

```txt
operator preview must render boundary
operator preview should render basis layer
operator preview should render route layer if available
debug overlays must be marked debug-only
operator-only overlays must be non-exportable
operator object inspection must not expose raw signal payloads
```

## 13.3 Sensus-Core-Vorschau-Regeln

```txt
Sensus-Core preview must derive from package and view_state
Sensus-Core preview must not derive directly from debug layers
Sensus-Core preview must not show raw signals
Sensus-Core preview must not show device counts
Sensus-Core preview must not show operator notes
Sensus-Core preview must not show rejected or pending POIs
Sensus-Core preview route options must exist in view_state.visible_route_options
```

## 13.4 Originalwege-Vergleichsregeln

```txt
basis layer must align with graph edges
route layer must align with route sections
extracted ways should align with original ways unless intentionally transformed
buffer-only elements must be marked buffer-only
boundary cuts must be visible and documented
missing original source may warn but not necessarily block
missing SCIM layer blocks if expected from prior context
```

## 13.5 POI- und Radiusregeln

```txt
approved POIs may appear in Sensus-Core only if package allows it
rejected POIs must not appear in Sensus-Core
pending POIs must not appear in Sensus-Core
confirmed radii must match Regio-Content and POI model
comparison margins should remain operator-only
stay areas must align with confirmed radius or documented reduction
masking triggered by stay area must be traceable in operator view
```

## 13.6 Routenregeln

```txt
route sections must align with graph edges
route options must align with route sections
local visible route options must exist in view_state
selected route must exist in visible route options unless explicitly hidden with warning
degraded sections must be visually distinguishable in operator view
excluded sections must be visually distinguishable or intentionally hidden in Sensus-Core
route warnings in Sensus-Core must be reduced and eligible
debug-only routes must not appear in Sensus-Core
```

---

# 14. Mock-Daten

## 14.1 Mock LeafletEffectCheckState

```ts
export const mockLeafletEffectCheckState: LeafletEffectCheckState = {
  leaflet_effect_check_id: 'leaflet_effect_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  checked_at: '2026-05-21T00:00:00.000Z',
  source_refs: {
    system_adjust_version: 'sys_v1.0.0',
    regio_content_version: 'regio_v1.0.0',
    target_app_ui_version: 'ui_v1.0.0',
    representation_id: 'rep_hochwab_nord_001',
    boundary_id: 'boundary_hochwab_nord_001',
    graph_id: 'graph_hochwab_nord_001',
    basis_layer_id: 'basis_hochwab_nord_001',
    route_model_id: 'route_model_hochwab_nord_001',
    route_layer_model_id: 'route_layer_hochwab_nord_001',
    sensus_core_package_id: 'scp_hochwab_nord_001',
    local_sensus_core_context_id: 'lsc_hochwab_nord_001',
    view_state_id: 'view_hochwab_nord_001'
  },
  operator_preview: {
    preview_id: 'operator_preview_001',
    map_mode: 'leaflet',
    visible_overlays: [
      'boundary',
      'buffer',
      'basis_layer',
      'approved_pois',
      'poi_radii',
      'stay_areas',
      'route_sections',
      'route_options'
    ],
    selected_overlay_ids: ['route_sections', 'poi_radii'],
    status: 'operator_preview_rendered'
  },
  sensus_core_preview: {
    preview_id: 'sensus_core_preview_001',
    source_package_id: 'scp_hochwab_nord_001',
    source_view_state_id: 'view_hochwab_nord_001',
    map_mode: 'leaflet_view',
    visible_layers: [],
    visible_route_options: [],
    visible_warnings: [],
    reduction_check: {
      raw_signals_found: false,
      debug_data_found: false,
      operator_data_found: false,
      device_counts_found: false,
      signal_counts_found: false,
      internal_scores_found: false,
      not_released_content_found: false,
      reduction_valid: true
    },
    status: 'sensus_core_preview_rendered'
  },
  original_way_comparison: {
    comparison_id: 'original_compare_001',
    original_way_layer_available: true,
    extracted_way_layer_available: true,
    basis_layer_available: true,
    route_layer_available: true,
    comparison_items: [],
    status: 'comparison_valid'
  },
  poi_radius_check: {
    check_id: 'poi_radius_check_001',
    checked_pois: [],
    checked_stay_areas: [],
    status: 'poi_radius_valid'
  },
  route_effect_check: {
    check_id: 'route_effect_check_001',
    checked_sections: [],
    checked_route_options: [],
    checked_warnings: [],
    status: 'route_effect_valid'
  },
  issue_list: [],
  check_summary: {
    operator_preview_ready: true,
    sensus_core_preview_ready: true,
    original_way_comparison_ready: true,
    poi_radius_check_ready: true,
    route_check_ready: true,
    blocking_issue_count: 0,
    warning_count: 0,
    info_count: 0,
    sensus_core_reduction_valid: true,
    ready_for_release_panel: true
  },
  validation: {
    is_valid: true,
    checked_at: '2026-05-21T00:00:00.000Z',
    errors: [],
    warnings: [],
    info: [],
    blocking_issue_count: 0,
    sensus_core_blocker_count: 0,
    operator_warning_count: 0
  },
  status: 'leaflet_effect_valid'
};
```

---

# 15. Kontext-Apply-Funktion

```ts
export function applyLeafletEffectCheckToContext(
  context: ScimContext,
  leafletEffectCheck: LeafletEffectCheckState
): ScimContext {
  if (
    leafletEffectCheck.status !== 'leaflet_effect_valid' &&
    leafletEffectCheck.status !== 'leaflet_effect_warning'
  ) {
    throw new Error(
      `Cannot apply Leaflet effect check with status ${leafletEffectCheck.status}.`
    );
  }

  if (leafletEffectCheck.representation_id !== context.representation_id) {
    throw new Error('Leaflet effect check representation_id does not match context.');
  }

  return {
    ...context,
    leaflet_effect_check: leafletEffectCheck
  };
}
```

Regeln:

- Die Funktion darf nur `context.leaflet_effect_check` verändern.
- Alle anderen Kontextbereiche müssen unverändert bleiben.
- Ungültige oder blockierte Wirkungsprüfungen dürfen nicht übernommen werden.
- Ein Warnstatus darf übernommen werden, wenn `ready_for_release_panel = true` und keine blockierenden Fehler vorliegen.

---

# 16. Übergabe an Folgepanel

Panel 11 gibt folgende Kontextsegmente weiter:

```json
{
  "leaflet_effect_check": {
    "leaflet_effect_check_id": "leaflet_effect_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "operator_preview": {
      "status": "operator_preview_rendered"
    },
    "sensus_core_preview": {
      "status": "sensus_core_preview_rendered"
    },
    "original_way_comparison": {
      "status": "comparison_valid"
    },
    "poi_radius_check": {
      "status": "poi_radius_valid"
    },
    "route_effect_check": {
      "status": "route_effect_valid"
    },
    "issue_list": [],
    "check_summary": {
      "blocking_issue_count": 0,
      "sensus_core_reduction_valid": true,
      "ready_for_release_panel": true
    },
    "status": "leaflet_effect_valid"
  }
}
```

## 16.1 Übergabe an Panel 12: Freigabe und Export

Panel 12 kann prüfen:

- ob `leaflet_effect_check.status` gültig oder zulässig warnend ist,
- ob `ready_for_release_panel = true`,
- ob keine blockierenden Fehler vorhanden sind,
- ob Sensus-Core-Reduktion gültig ist,
- ob alle freigaberelevanten Vorschauen gerendert wurden,
- ob Fehlerliste archiviert und exportrelevant bewertet wurde.

Panel 12 darf die Ergebnisse freigeben oder exportieren, aber nicht stillschweigend blockierende Panel-11-Fehler ignorieren.

---

# 17. Akzeptanzkriterien

## 17.1 Allgemein

- Panel 11 kann nur mit passender `representation_id` arbeiten.
- Fehlende Pflichtinputs erzeugen blockierende Fehler.
- Panel 11 schreibt ausschließlich `context.leaflet_effect_check`.
- Panel 11 verändert keine vorgelagerten Modelle.
- Panel 11 kann Warnstatus an Panel 12 übergeben, aber nur ohne Blocker.

## 17.2 Operator-Vorschau

- Boundary wird angezeigt.
- Basislayer wird angezeigt, sofern vorhanden.
- Route-Layer wird angezeigt, sofern vorhanden.
- POI- und Radiuslayer werden angezeigt, sofern POI-Modell vorhanden ist.
- Debug-Layer sind klar getrennt.
- Operator-only Layer sind nicht exportfähig markiert.
- Objektinspektion zeigt keine Rohsignal-Payloads.

## 17.3 Sensus-Core-Vorschau

- Vorschau basiert auf Sensus-Core-Paket und View State.
- Keine Rohsignale sichtbar.
- Keine Device Counts sichtbar.
- Keine Debugdaten sichtbar.
- Keine Operatornotizen sichtbar.
- Keine abgelehnten oder pending POIs sichtbar.
- Sichtbare Routen existieren in `view_state.visible_route_options`.
- Sichtbare Layer existieren in `view_state.visible_layers` oder Paket-Public-Layern.

## 17.4 Originalwege-Vergleich

- Originalwege können mit SCIM-Layern verglichen werden, sofern Quelle vorhanden.
- Basislayer liegt plausibel auf Graphkanten.
- Route-Layer liegt plausibel auf Routenabschnitten.
- Boundary- und Buffer-Schnitte sind nachvollziehbar.
- Fehlende erwartete SCIM-Layer werden als Fehler markiert.
- Fehlende Originalwegequelle erzeugt Warnung, sofern die SCIM-Layer selbst valide sind.

## 17.5 POI- und Radiusprüfung

- Freigegebene POIs stimmen mit Regio-Content und POI-Modell überein.
- Bestätigte Radien stimmen räumlich.
- Aufenthaltsbereiche sind plausibel.
- Vergleichssäume bleiben operator-only, sofern keine Reduktion freigegeben ist.
- Abgelehnte POIs erscheinen nicht in Sensus-Core.
- Pending POIs erscheinen nicht in Sensus-Core.
- Maskierungen sind über Operator-Vorschau nachvollziehbar.

## 17.6 Routenprüfung

- Route Sections liegen auf Graph/Basislayer.
- Route Options bestehen aus vorhandenen Route Sections.
- Lokale sichtbare Route Options kommen aus View State.
- Gewählte Route ist sichtbar oder mit Warnung erklärbar.
- Abgewertete Abschnitte sind in Operator-Ansicht unterscheidbar.
- Ausgeschlossene Abschnitte sind in Operator-Ansicht unterscheidbar.
- Sensus-Core-Routen enthalten keine Debug- oder Rohdaten.
- Sensus-Core-Warnungen sind reduziert und eligibility-konform.

## 17.7 Fehlerliste

- Jeder Fehler hat Code, Schweregrad, Tab, Meldung und Blocker-Status.
- Blockierende Fehler verhindern `leaflet_effect_valid`.
- Sensus-Core-relevante Datenschutzfehler blockieren die Übergabe an Panel 12.
- Warnungen können an Panel 12 übergeben werden, wenn sie nicht blockierend sind.
- Fehler können auf betroffene Kartenobjekte fokussieren.

---

# 18. Testfälle

## 18.1 Happy Path

Gegeben:

- gültiges Sensus-Core-Paket,
- gültiger View State,
- gültiger Route Layer,
- gültiger Basislayer,
- keine Reduktionsverletzung.

Erwartung:

```txt
status = leaflet_effect_valid
ready_for_release_panel = true
blocking_issue_count = 0
```

## 18.2 Fehlendes Sensus-Core-Paket

Gegeben:

- `context.sensus_core_package` fehlt.

Erwartung:

```txt
issue code = SENSUS_CORE_PACKAGE_MISSING
blocking = true
status = leaflet_effect_blocked
```

## 18.3 Fehlender View State

Gegeben:

- `context.view_state` fehlt.

Erwartung:

```txt
issue code = VIEW_STATE_MISSING
blocking = true
status = leaflet_effect_blocked
```

## 18.4 Debug-Layer in Sensus-Core-Vorschau

Gegeben:

- Sensus-Core-Vorschau enthält Feature mit `debug_*` Property.

Erwartung:

```txt
issue code = DEBUG_LAYER_VISIBLE_IN_SENSUS_CORE
blocking = true
sensus_core_relevant = true
status = leaflet_effect_blocked
```

## 18.5 Rejected POI in Sensus-Core

Gegeben:

- abgelehnter POI erscheint in Sensus-Core-Vorschau.

Erwartung:

```txt
issue code = REJECTED_POI_VISIBLE_IN_SENSUS_CORE
blocking = true
status = leaflet_effect_blocked
```

## 18.6 Originalwegequelle fehlt

Gegeben:

- Originalwege-Layer ist nicht verfügbar, Basislayer und Route-Layer sind aber valide.

Erwartung:

```txt
issue code = ORIGINAL_WAY_LAYER_MISSING
blocking = false
status = leaflet_effect_warning
```

## 18.7 Route Option nicht im Route Model

Gegeben:

- Sensus-Core-Vorschau zeigt Route Option, die nicht im Route Model existiert.

Erwartung:

```txt
issue code = ROUTE_OPTION_NOT_IN_ROUTE_MODEL
blocking = true
status = leaflet_effect_invalid
```

## 18.8 Lokale Route nicht im View State

Gegeben:

- Vorschau zeigt Route, die nicht in `view_state.visible_route_options` enthalten ist.

Erwartung:

```txt
issue code = LOCAL_ROUTE_NOT_IN_VIEW_STATE
blocking = true
status = leaflet_effect_invalid
```

---

# 19. Umsetzungshinweise für Codex/Claude

## 19.1 Baupriorität

Zuerst bauen:

1. Typen und Statusmodell,
2. Input Guard,
3. Operator Preview Builder,
4. Sensus-Core Preview Builder,
5. Issue Collector,
6. einfache Leaflet-Renderintegration,
7. Fehlerliste,
8. Kontext-Apply-Funktion.

Danach ergänzen:

1. Originalwege-Vergleich,
2. POI- und Radiusprüfung,
3. Routenprüfung,
4. Objektinspektion,
5. Kartenfokus aus Fehlerliste,
6. Prüfbericht.

## 19.2 Strikte Modultrennung

Der Panel-Container darf nur orchestrieren.

Fachlogik gehört in:

```txt
leafletEffectCheck.operatorPreview.ts
leafletEffectCheck.sensusCorePreview.ts
leafletEffectCheck.originalWaysCompare.ts
leafletEffectCheck.poiRadiusCheck.ts
leafletEffectCheck.routeCheck.ts
leafletEffectCheck.issueCollector.ts
leafletEffectCheck.validation.ts
```

## 19.3 Leaflet-Regel

Leaflet darf nur rendern, vergleichen und Objektklicks weitergeben.

Leaflet darf nicht:

- Routen bewerten,
- POI-Radien neu berechnen,
- Aufenthalte klassifizieren,
- Maskierungen erzeugen,
- Sensus-Core-Paketdaten verändern,
- lokale User-Auswahl verändern.

## 19.4 Datenschutzregel im Code

Eine zentrale Sanitization- und Scan-Funktion sollte für Sensus-Core-Preview-Features verwendet werden.

Beispiel:

```ts
const forbiddenSensusCoreKeys = [
  'raw_signal',
  'raw_signals',
  'signal_group_id',
  'device_count',
  'distinct_device_count',
  'debug',
  'debug_score',
  'operator_note',
  'operator_internal',
  'unreleased',
  'pending_poi',
  'rejected_poi'
];
```

Jedes gefundene verbotene Feld erzeugt ein `LeafletEffectIssue`.

---

# 20. Kompakter Codex-Auftrag für Panel 11

```txt
Baue Panel 11: Leaflet-Wirkungsprüfung.

Erstelle ein React/TypeScript-Modul `LeafletEffectCheckPanel` unter
`src/scim/leaflet-effect-check/`.

Das Panel ist ein Prüfpanel nach `SensusCoreLocalPanel` und vor Freigabe/Export.
Es darf nur `context.leaflet_effect_check` schreiben und keine vorgelagerten
SCIM-Modelle verändern.

Tabs:
1. Operator-Vorschau
2. Sensus-Core-Vorschau
3. Originalwege-Vergleich
4. POI- und Radiusprüfung
5. Routenprüfung
6. Fehlerliste

Implementiere:
- Typen für `LeafletEffectCheckState`, Preview States, Vergleichszustände und Issues.
- Input Guard gegen fehlende Pflichtsegmente.
- Operator Preview Builder mit Boundary, Basislayer, POI, Route und Debug-Overlays.
- Sensus-Core Preview Builder ausschließlich aus `sensus_core_package` und `view_state`.
- Reduktionsprüfung gegen Rohdaten, Debugdaten, Operatornotizen und Device Counts.
- Originalwege-Vergleich gegen Basislayer und Route-Layer.
- POI- und Radiusprüfung gegen Regio-Content/POI-Modell/Sensus-Core-Reduktion.
- Routenprüfung gegen Route Model, Route Layer und View State.
- zentrale Fehlerliste mit Blocker-Status.
- Kontext-Apply-Funktion `applyLeafletEffectCheckToContext()`.

Nicht bauen:
- keine neue Routenbewertung,
- keine neue Aufenthaltslogik,
- keine neue Bewegungsauslastung,
- keine Veränderung des Sensus-Core-Pakets,
- keine Freigabe und kein Export.

Akzeptanz:
- gültige Prüfung erzeugt `leaflet_effect_valid`.
- Prüfung mit nicht blockierenden Warnungen erzeugt `leaflet_effect_warning`.
- Datenschutzverletzungen in der Sensus-Core-Vorschau blockieren.
- fehlendes Paket oder fehlender View State blockiert.
- Panel 12 kann anhand von `ready_for_release_panel` weiterarbeiten.
```

---

# 21. Kernaussage für Panel 11

Panel 11 ist die visuelle Endkontrolle der gesamten SCIM-Wirkung in Leaflet.

Es verbindet Operator-Vorschau, Sensus-Core-Vorschau, Originalwege-Vergleich, POI-/Radiusprüfung, Routenprüfung und Fehlerliste.

Es verändert keine SCIM-Ergebnisse, sondern bestätigt oder blockiert deren Freigabefähigkeit.

---

# 22. Minimale Übergabe an Panel 12

Panel 12 benötigt mindestens:

```ts
context.leaflet_effect_check.status
context.leaflet_effect_check.check_summary.ready_for_release_panel
context.leaflet_effect_check.check_summary.blocking_issue_count
context.leaflet_effect_check.check_summary.sensus_core_reduction_valid
context.leaflet_effect_check.issue_list
```

Panel 12 darf nur dann produktiv freigeben, wenn:

```txt
ready_for_release_panel = true
blocking_issue_count = 0
sensus_core_reduction_valid = true
status is leaflet_effect_valid or leaflet_effect_warning
```

---

# 23. Abschluss

Panel 11 ist kein kreativer Karteneditor und kein nachgelagerter Debug-Screen. Es ist ein formalisiertes Prüfpanel.

Es bestätigt, dass:

- die Operator-Wirkung nachvollziehbar ist,
- die Sensus-Core-Wirkung reduziert und zulässig ist,
- Originalwege und SCIM-Layer plausibel übereinanderliegen,
- POIs, Radien, Aufenthaltsbereiche und Routen korrekt dargestellt werden,
- Fehler sichtbar und blockierende Probleme vor Freigabe gestoppt werden.

Erst danach darf Panel 12 Freigabe und Export übernehmen.
