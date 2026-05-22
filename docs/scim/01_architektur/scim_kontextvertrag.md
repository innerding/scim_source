# SCIM Kontextvertrag

## 0. Zweck dieses Dokuments

Der SCIM Kontextvertrag definiert die gemeinsame Daten- und Zustandsgrundlage der gesamten SCIM-Pipeline.

Er beschreibt:

- den globalen `ScimContext`,
- welche Panels welche Kontextbereiche lesen und schreiben dürfen,
- welche Statuskonventionen gelten,
- welche Basistypen jedes Panel verwenden muss,
- wie Validierung, Fehler, Warnungen und Blocker geführt werden,
- wie Versionen, Quellen und Zeitstempel referenziert werden,
- welche Datenschutz- und Sensus-Core-Grenzen im Kontext abgesichert werden müssen.

Leitsatz:

> Der SCIM-Kontext ist das verbindende Datenrückgrat aller Panels. Jedes Panel darf nur seinen eigenen Bereich verändern.

---

## 1. Grundprinzip

Alle Panels arbeiten auf einem gemeinsamen Kontextobjekt:

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
  audit?: ScimContextAudit;
}
```

Der Kontext ist kein beliebiger Speicher. Er ist ein streng begrenzter Pipeline-Zustand.

---

## 2. Kontextregeln

## 2.1 Schreibregel

Ein Panel darf nur die Kontextbereiche schreiben, die seinem Panelvertrag zugeordnet sind.

Beispiel:

```txt
Panel 7 darf schreiben:
context.poi_model
context.load_model
context.movement_model
context.masking_model
```

Panel 7 darf nicht schreiben:

```txt
context.route_model
context.sensus_core_package
context.release
```

## 2.2 Leseregel

Ein Panel darf nur die Kontextbereiche lesen, die fachlich notwendig und im Panelvertrag erlaubt sind.

## 2.3 Keine stillen Reparaturen

Ein Panel darf ungültige vorgelagerte Zustände nicht stillschweigend reparieren.

Erlaubt:

```txt
Warnung erzeugen
Fehler erzeugen
Blocker erzeugen
Folgeverarbeitung stoppen
```

Nicht erlaubt:

```txt
fremden Kontext korrigieren
fehlende Freigabe ersetzen
Systemgrenze überschreiben
Debugdaten entfernen und so tun, als wäre der Ursprung gültig
```

## 2.4 Immutable Upstream Principle

Sobald ein Panel einen gültigen Output erzeugt hat, darf ein späteres Panel diesen nicht verändern.

Spätere Panels dürfen:

- referenzieren,
- validieren,
- reduzieren,
- in eigenen Output übernehmen,
- bei Fehlern blockieren.

Spätere Panels dürfen nicht:

- vorgelagerte Daten mutieren,
- IDs ändern,
- Status fremder States ändern,
- Fehlerlisten fremder Panels überschreiben.

## 2.5 Derived State Principle

Wenn ein Panel aus fremden Daten etwas ableitet, muss es diese Ableitung in seinem eigenen State speichern.

Beispiel:

```txt
Panel 9 reduziert route_model und route_layer_model.
Das Ergebnis wird nicht in route_model zurückgeschrieben,
sondern in sensus_core_package gespeichert.
```

---

## 3. Panel-Schreibrechte

| Panel | Name | Darf schreiben in |
|---:|---|---|
| 1 | System-Adjust Input | `context.system_adjust` |
| 2 | Regio-Content Input | `context.regio_content` |
| 3 | Ziel-App UI Input | `context.target_app_ui` |
| 4 | Telco-Load Input | `context.telco_load` |
| 5 | Boundary und Extraktion | `context.representation_id`, `context.boundary`, `context.extracted_data` |
| 6 | Graph und Basislayer | `context.scim_context`, `context.graph`, `context.basis_layer`, `context.leaflet_check` |
| 7 | POI, Load und Bewegung | `context.poi_model`, `context.load_model`, `context.movement_model`, `context.masking_model` |
| 8 | Routenbewertung und Routendarstellung | `context.route_model`, `context.route_layer_model`, `context.leaflet_route_check` |
| 9 | Sensus-Core Package Builder | `context.sensus_core_package` |
| 10 | Sensus Core lokal | `context.local_user_context`, `context.view_state` |
| 11 | Leaflet-Wirkungsprüfung | `context.leaflet_effect_check` |
| 12 | Freigabe und Export | `context.release`, optional abgeleitet `context.status` |

---

## 4. Panel-Leserechte

## 4.1 Panel 1

```ts
reads: []
writes: ['system_adjust']
```

Panel 1 ist Startpunkt des systemweiten Rahmens.

## 4.2 Panel 2

```ts
reads: ['system_adjust']
writes: ['regio_content']
```

## 4.3 Panel 3

```ts
reads: ['system_adjust', 'regio_content']
writes: ['target_app_ui']
```

## 4.4 Panel 4

```ts
reads: ['system_adjust', 'regio_content', 'target_app_ui']
writes: ['telco_load']
```

## 4.5 Panel 5

```ts
reads: [
  'system_adjust',
  'regio_content',
  'target_app_ui',
  'telco_load'
]
writes: [
  'representation_id',
  'boundary',
  'extracted_data'
]
```

## 4.6 Panel 6

```ts
reads: [
  'system_adjust',
  'regio_content',
  'target_app_ui',
  'telco_load',
  'boundary',
  'extracted_data'
]
writes: [
  'scim_context',
  'graph',
  'basis_layer',
  'leaflet_check'
]
```

## 4.7 Panel 7

```ts
reads: [
  'system_adjust',
  'regio_content',
  'target_app_ui',
  'telco_load',
  'boundary',
  'extracted_data',
  'scim_context',
  'graph',
  'basis_layer',
  'leaflet_check'
]
writes: [
  'poi_model',
  'load_model',
  'movement_model',
  'masking_model'
]
```

## 4.8 Panel 8

```ts
reads: [
  'system_adjust',
  'regio_content',
  'target_app_ui',
  'telco_load',
  'boundary',
  'extracted_data',
  'scim_context',
  'graph',
  'basis_layer',
  'leaflet_check',
  'poi_model',
  'load_model',
  'movement_model',
  'masking_model'
]
writes: [
  'route_model',
  'route_layer_model',
  'leaflet_route_check'
]
```

## 4.9 Panel 9

```ts
reads: [
  'system_adjust',
  'regio_content',
  'target_app_ui',
  'boundary',
  'scim_context',
  'graph',
  'basis_layer',
  'poi_model',
  'load_model',
  'movement_model',
  'masking_model',
  'route_model',
  'route_layer_model',
  'layer_model',
  'leaflet_route_check'
]
writes: [
  'sensus_core_package'
]
```

## 4.10 Panel 10

```ts
reads: [
  'sensus_core_package',
  'target_app_ui',
  'system_adjust'
]
writes: [
  'local_user_context',
  'view_state'
]
```

## 4.11 Panel 11

```ts
reads: [
  'system_adjust',
  'regio_content',
  'target_app_ui',
  'boundary',
  'extracted_data',
  'scim_context',
  'graph',
  'basis_layer',
  'leaflet_check',
  'poi_model',
  'load_model',
  'movement_model',
  'masking_model',
  'route_model',
  'route_layer_model',
  'leaflet_route_check',
  'layer_model',
  'sensus_core_package',
  'local_user_context',
  'view_state'
]
writes: [
  'leaflet_effect_check'
]
```

## 4.12 Panel 12

```ts
reads: [
  'system_adjust',
  'regio_content',
  'target_app_ui',
  'boundary',
  'extracted_data',
  'scim_context',
  'graph',
  'basis_layer',
  'leaflet_check',
  'poi_model',
  'load_model',
  'movement_model',
  'masking_model',
  'route_model',
  'route_layer_model',
  'layer_model',
  'sensus_core_package',
  'local_user_context',
  'view_state',
  'leaflet_effect_check'
]
writes: [
  'release',
  'status'
]
```

---

## 5. Globaler Status

```ts
export type ScimGlobalStatus =
  | 'not_started'
  | 'draft'
  | 'input_ready'
  | 'spatial_context_ready'
  | 'graph_ready'
  | 'load_models_ready'
  | 'routes_ready'
  | 'package_ready'
  | 'local_view_ready'
  | 'effect_checked'
  | 'release_ready'
  | 'released'
  | 'warning'
  | 'blocked'
  | 'error';
```

Der globale Status ist abgeleitet. Er darf nicht einzelne Panelstatus ersetzen.

Regel:

> Der globale Status fasst zusammen, aber die Wahrheit liegt in den einzelnen Panel-States.

---

## 6. Einheitliches State-Grundmuster

Jeder Panel-State sollte dieses Grundmuster erfüllen:

```ts
export interface ScimStateBase {
  id: string;
  representation_id?: string;
  created_at: string;
  updated_at?: string;
  source?: ScimSourceRef;
  version?: string;
  validation: ScimValidationResult;
  issue_list: ScimIssue[];
  status: string;
}
```

Panel-spezifische States können dieses Muster erweitern.

---

## 7. SourceRef

```ts
export interface ScimSourceRef {
  source_type: ScimSourceType;
  source_id?: string;
  source_name?: string;
  source_version?: string;
  loaded_at?: string;
  generated_at?: string;
}
```

```ts
export type ScimSourceType =
  | 'scim3_atlas_console'
  | 'path_works_regio_dashboard'
  | 'sensus_core_config'
  | 'target_app_config'
  | 'telco_load_api'
  | 'runtime_load_service'
  | 'aggregated_load_backend'
  | 'simulation'
  | 'mock'
  | 'local_json'
  | 'geojson_import'
  | 'api'
  | 'derived'
  | 'manual';
```

---

## 8. VersionRef

```ts
export interface ScimVersionRef {
  version_id: string;
  version_type: ScimVersionType;
  semantic_version?: string;
  created_at?: string;
  source_ref?: ScimSourceRef;
}
```

```ts
export type ScimVersionType =
  | 'system_adjust'
  | 'privacy_rule'
  | 'aggregation_rule'
  | 'regio_content'
  | 'regional_parameter'
  | 'target_app_ui'
  | 'telco_load_batch'
  | 'boundary'
  | 'extraction'
  | 'graph'
  | 'poi_model'
  | 'load_projection'
  | 'movement_model'
  | 'masking_model'
  | 'route_model'
  | 'route_layer_model'
  | 'sensus_core_package'
  | 'local_user_context'
  | 'view_state'
  | 'leaflet_effect_check'
  | 'release';
```

---

## 9. ValidationResult

```ts
export interface ScimValidationResult {
  checked_at: string;
  valid: boolean;
  severity: ScimValidationSeverity;
  errors: ScimIssue[];
  warnings: ScimIssue[];
  blockers: ScimIssue[];
}
```

```ts
export type ScimValidationSeverity =
  | 'valid'
  | 'info'
  | 'warning'
  | 'error'
  | 'blocker';
```

Regel:

```txt
blockers.length > 0 → valid = false
errors.length > 0   → valid = false, außer explizit als draft erlaubt
warnings.length > 0 → valid kann true bleiben
```

---

## 10. Issue

```ts
export interface ScimIssue {
  issue_id: string;
  severity: ScimIssueSeverity;
  code: string;
  message: string;
  panel: ScimPanelId;
  affected_context_path?: ScimContextPath;
  affected_object_id?: string;
  created_at: string;
  blocking: boolean;
  public_safe: boolean;
}
```

```ts
export type ScimIssueSeverity =
  | 'info'
  | 'warning'
  | 'error'
  | 'blocker';
```

### 10.1 public_safe

`public_safe` definiert, ob ein Issue in reduzierter Form in Sensus Core oder Exportberichte übernommen werden darf.

Beispiele:

```txt
public_safe = true:
"Datenlage eingeschränkt"
"Route enthält Warnabschnitt"

public_safe = false:
"Signalgruppe sg_123 unterschreitet Device Count"
"Operatornotiz enthält interne Quelle"
"Debuglayer enthält Rohscore"
```

---

## 11. Panel IDs

```ts
export type ScimPanelId =
  | 'panel_1_system_adjust_input'
  | 'panel_2_regio_content_input'
  | 'panel_3_target_app_ui_input'
  | 'panel_4_telco_load_input'
  | 'panel_5_boundary_extraction'
  | 'panel_6_graph_basislayer'
  | 'panel_7_poi_load_movement'
  | 'panel_8_route_evaluation_display'
  | 'panel_9_sensus_core_package_builder'
  | 'panel_10_sensus_core_local'
  | 'panel_11_leaflet_effect_check'
  | 'panel_12_release_export';
```

---

## 12. ContextPath

```ts
export type ScimContextPath =
  | 'context.system_adjust'
  | 'context.regio_content'
  | 'context.target_app_ui'
  | 'context.telco_load'
  | 'context.boundary'
  | 'context.extracted_data'
  | 'context.scim_context'
  | 'context.graph'
  | 'context.basis_layer'
  | 'context.leaflet_check'
  | 'context.poi_model'
  | 'context.load_model'
  | 'context.movement_model'
  | 'context.masking_model'
  | 'context.route_model'
  | 'context.route_layer_model'
  | 'context.layer_model'
  | 'context.sensus_core_package'
  | 'context.local_user_context'
  | 'context.view_state'
  | 'context.leaflet_effect_check'
  | 'context.release'
  | 'context.status';
```

---

## 13. Statuskonvention je Panelbereich

## 13.1 Allgemeine Statuslogik

Jeder Panelbereich sollte Statuswerte nach diesem Muster verwenden:

```txt
not_created / not_loaded / not_checked
loading / building / validating / checking
created_unvalidated / loaded_unvalidated
valid
warning
invalid
blocked
error
```

Panel-spezifische Statuswerte dürfen konkreter sein.

---

## 13.2 Input-States

### SystemAdjustStatus

```ts
export type SystemAdjustStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'system_adjust_valid'
  | 'system_adjust_invalid'
  | 'system_adjust_warning'
  | 'system_adjust_error';
```

### RegioContentStatus

```ts
export type RegioContentStatus =
  | 'not_loaded'
  | 'loading'
  | 'loaded_unvalidated'
  | 'validating'
  | 'regio_content_valid'
  | 'regio_content_invalid'
  | 'regio_content_warning'
  | 'regio_content_draft'
  | 'regio_content_error';
```

### TargetAppUiStatus

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

### TelcoLoadStatus

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

---

## 13.3 Raum- und Graph-States

### BoundaryStatus

```ts
export type BoundaryStatus =
  | 'not_created'
  | 'drawing'
  | 'created_unvalidated'
  | 'validating'
  | 'boundary_valid'
  | 'boundary_invalid'
  | 'boundary_warning'
  | 'boundary_error';
```

### ExtractionStatus

```ts
export type ExtractionStatus =
  | 'not_extracted'
  | 'extracting'
  | 'extracted_unvalidated'
  | 'validating'
  | 'extraction_valid'
  | 'extraction_warning'
  | 'extraction_invalid'
  | 'extraction_error';
```

### ScimRuntimeContextStatus

```ts
export type ScimRuntimeContextStatus =
  | 'not_checked'
  | 'checking'
  | 'scim_context_valid'
  | 'scim_context_warning'
  | 'scim_context_invalid'
  | 'scim_context_error';
```

### GraphStatus

```ts
export type GraphStatus =
  | 'not_created'
  | 'building'
  | 'graph_created_unvalidated'
  | 'validating'
  | 'graph_valid'
  | 'graph_warning'
  | 'graph_invalid'
  | 'graph_error';
```

### BasisLayerStatus

```ts
export type BasisLayerStatus =
  | 'not_created'
  | 'building'
  | 'basis_layer_created_unvalidated'
  | 'validating'
  | 'basis_layer_valid'
  | 'basis_layer_warning'
  | 'basis_layer_invalid'
  | 'basis_layer_error';
```

---

## 13.4 Engine-States

### PoiModelStatus

```ts
export type PoiModelStatus =
  | 'not_created'
  | 'building'
  | 'poi_model_created_unvalidated'
  | 'validating'
  | 'poi_model_valid'
  | 'poi_model_warning'
  | 'poi_model_invalid'
  | 'poi_model_error';
```

### LoadProjectionStatus

```ts
export type LoadProjectionStatus =
  | 'not_projected'
  | 'projecting'
  | 'loads_projected_unvalidated'
  | 'validating'
  | 'loads_projected'
  | 'load_projection_warning'
  | 'load_projection_invalid'
  | 'load_projection_error';
```

### MovementModelStatus

```ts
export type MovementModelStatus =
  | 'not_created'
  | 'building'
  | 'movement_model_created_unvalidated'
  | 'validating'
  | 'movement_model_valid'
  | 'movement_model_warning'
  | 'movement_model_invalid'
  | 'movement_model_error';
```

### MaskingModelStatus

```ts
export type MaskingModelStatus =
  | 'not_created'
  | 'building'
  | 'masking_model_created_unvalidated'
  | 'validating'
  | 'masking_model_valid'
  | 'masking_model_warning'
  | 'masking_model_invalid'
  | 'masking_model_error';
```

---

## 13.5 Routen-States

```ts
export type RouteModelStatus =
  | 'not_created'
  | 'building'
  | 'route_model_created_unvalidated'
  | 'validating'
  | 'route_model_valid'
  | 'route_model_warning'
  | 'route_model_invalid'
  | 'route_model_error';
```

```ts
export type RouteLayerModelStatus =
  | 'not_created'
  | 'building'
  | 'route_layer_created_unvalidated'
  | 'validating'
  | 'route_layer_valid'
  | 'route_layer_warning'
  | 'route_layer_invalid'
  | 'route_layer_error';
```

```ts
export type LeafletRouteCheckStatus =
  | 'not_checked'
  | 'checking'
  | 'leaflet_route_check_valid'
  | 'leaflet_route_check_warning'
  | 'leaflet_route_check_invalid'
  | 'leaflet_route_check_error';
```

---

## 13.6 Sensus-Core-States

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

```ts
export type SensusCoreLocalStatus =
  | 'not_created'
  | 'building'
  | 'sensus_core_local_valid'
  | 'sensus_core_local_warning'
  | 'sensus_core_local_invalid'
  | 'sensus_core_local_error';
```

```ts
export type SensusCoreViewStatus =
  | 'not_created'
  | 'building'
  | 'sensus_core_view_valid'
  | 'sensus_core_view_warning'
  | 'sensus_core_view_invalid'
  | 'sensus_core_view_error';
```

---

## 13.7 Prüf- und Release-States

```ts
export type LeafletEffectCheckStatus =
  | 'not_checked'
  | 'checking'
  | 'leaflet_effect_valid'
  | 'leaflet_effect_warning'
  | 'leaflet_effect_invalid'
  | 'leaflet_effect_error';
```

```ts
export type ReleaseExportStatus =
  | 'not_created'
  | 'checking'
  | 'release_ready'
  | 'release_warning'
  | 'release_blocked'
  | 'exporting'
  | 'export_successful'
  | 'export_failed'
  | 'archived';
```

---

## 14. Gemeinsame Datenschutztypen

## 14.1 PrivacyStatus

```ts
export interface ScimPrivacyStatus {
  status: 'valid' | 'warning' | 'blocked';
  checked_at: string;
  raw_signals_absent: boolean;
  device_level_data_absent: boolean;
  single_device_visibility_absent: boolean;
  debug_data_absent_from_public_outputs: boolean;
  operator_data_absent_from_public_outputs: boolean;
  minimum_aggregation_met: boolean;
  blockers: ScimIssue[];
  warnings: ScimIssue[];
}
```

## 14.2 PrivacyLevel

```ts
export type ScimDataPrivacyLevel =
  | 'public_safe'
  | 'reduced_public'
  | 'operator_internal'
  | 'debug_only'
  | 'raw_forbidden'
  | 'privacy_blocked';
```

Regel:

```txt
public_safe und reduced_public dürfen in Sensus Core vorkommen.
operator_internal, debug_only, raw_forbidden und privacy_blocked dürfen nicht in Sensus Core vorkommen.
```

---

## 15. Gemeinsame Sichtbarkeitsklassen

```ts
export type ScimVisibility =
  | 'sensus_core_visible'
  | 'operator_preview_only'
  | 'debug_only'
  | 'hidden'
  | 'export_public'
  | 'archive_internal';
```

Regeln:

```txt
sensus_core_visible → darf in Paket, wenn reduziert und validiert
export_public       → darf öffentlich exportiert werden
operator_preview_only → nur Operator-Vorschau
debug_only          → nie Sensus Core
archive_internal    → nur internes Archiv
hidden              → keine direkte Darstellung
```

---

## 16. Representation-ID-Regel

Alle räumlichen, graphischen, routenbezogenen, paketbezogenen und releasebezogenen States müssen dieselbe `representation_id` tragen.

Betroffene States:

```txt
boundary
extracted_data
scim_context
graph
basis_layer
poi_model
load_model
movement_model
masking_model
route_model
route_layer_model
sensus_core_package
local_user_context
view_state
leaflet_effect_check
release
```

Regel:

```txt
Mismatch der representation_id = blockierender Fehler
```

---

## 17. Versionskonsistenz

Jeder abgeleitete State muss referenzieren, auf welchen vorgelagerten Versionen er beruht.

Beispiel `RouteModelState`:

```ts
export interface RouteModelSourceRefs {
  system_adjust_version: string;
  regio_content_version?: string;
  target_app_ui_version?: string;
  graph_id: string;
  poi_model_id: string;
  load_projection_id?: string;
  movement_model_id: string;
  masking_model_id: string;
}
```

Regel:

> Wenn ein vorgelagerter State ersetzt wird, müssen alle daraus abgeleiteten States als veraltet oder neu berechnungsbedürftig markiert werden.

---

## 18. Invalidierungslogik

Wenn ein früherer Kontextbereich geändert wird, müssen spätere Bereiche invalidiert werden.

## 18.1 Änderung System-Adjust

Änderung an `system_adjust` invalidiert:

```txt
regio_content validation
target_app_ui validation
telco_load validation
boundary/extraction validation
scim_context
graph validation
poi/load/movement/masking
route_model
sensus_core_package
local_user_context
view_state
leaflet_effect_check
release
```

## 18.2 Änderung Regio-Content

Änderung an `regio_content` invalidiert:

```txt
extracted_data
scim_context
poi_model
load_model
movement_model
masking_model
route_model
sensus_core_package
local_user_context
view_state
leaflet_effect_check
release
```

## 18.3 Änderung Ziel-App UI

Änderung an `target_app_ui` invalidiert:

```txt
sensus_core_package
local_user_context
view_state
leaflet_effect_check
release
```

Kann zusätzlich `route_model` betreffen, wenn Routentypen oder Warnlogik Teil der Bewertung sind.

## 18.4 Änderung Telco-Load

Änderung an `telco_load` invalidiert:

```txt
load_model
movement_model
masking_model
route_model
sensus_core_package
local_user_context
view_state
leaflet_effect_check
release
```

## 18.5 Änderung Boundary oder Extraktion

Änderung an `boundary` oder `extracted_data` invalidiert:

```txt
scim_context
graph
basis_layer
leaflet_check
poi_model
load_model
movement_model
masking_model
route_model
route_layer_model
sensus_core_package
local_user_context
view_state
leaflet_effect_check
release
```

## 18.6 Änderung Graph

Änderung an `graph` invalidiert:

```txt
poi_model
load_model
movement_model
masking_model
route_model
route_layer_model
sensus_core_package
local_user_context
view_state
leaflet_effect_check
release
```

## 18.7 Änderung Sensus-Core Package

Änderung an `sensus_core_package` invalidiert:

```txt
local_user_context
view_state
leaflet_effect_check
release
```

---

## 19. Kontext-Audit

Der Kontext sollte optional ein Audit führen.

```ts
export interface ScimContextAudit {
  entries: ScimContextAuditEntry[];
}
```

```ts
export interface ScimContextAuditEntry {
  audit_id: string;
  timestamp: string;
  panel: ScimPanelId;
  action: ScimContextAuditAction;
  context_path: ScimContextPath;
  previous_status?: string;
  next_status?: string;
  source_ref?: ScimSourceRef;
  issue_ids?: string[];
}
```

```ts
export type ScimContextAuditAction =
  | 'created'
  | 'updated'
  | 'validated'
  | 'invalidated'
  | 'blocked'
  | 'warning_added'
  | 'error_added'
  | 'exported'
  | 'released';
```

Audit-Regel:

> Release und Export müssen aus dem Audit nachvollziehbar sein.

---

## 20. Guard-Funktionen

Für jedes Panel sollte es eine Guard-Funktion geben.

```ts
export type ScimPanelGuardResult = {
  can_run: boolean;
  severity: ScimValidationSeverity;
  blockers: ScimIssue[];
  warnings: ScimIssue[];
};
```

Beispiele:

```ts
canRunSystemAdjustInput(context: ScimContext): ScimPanelGuardResult;
canRunRegioContentInput(context: ScimContext): ScimPanelGuardResult;
canRunTargetAppUiInput(context: ScimContext): ScimPanelGuardResult;
canRunTelcoLoadInput(context: ScimContext): ScimPanelGuardResult;
canRunBoundaryExtraction(context: ScimContext): ScimPanelGuardResult;
canRunGraphBasisLayer(context: ScimContext): ScimPanelGuardResult;
canRunPoiLoadMovement(context: ScimContext): ScimPanelGuardResult;
canRunRouteEvaluationDisplay(context: ScimContext): ScimPanelGuardResult;
canRunSensusCorePackageBuilder(context: ScimContext): ScimPanelGuardResult;
canRunSensusCoreLocal(context: ScimContext): ScimPanelGuardResult;
canRunLeafletEffectCheck(context: ScimContext): ScimPanelGuardResult;
canRunReleaseExport(context: ScimContext): ScimPanelGuardResult;
```

---

## 21. Kontext-Schreibschutz

Empfohlen ist ein technischer Schreibschutz pro Panel.

```ts
export interface ScimContextWritePolicy {
  panel: ScimPanelId;
  allowed_write_paths: ScimContextPath[];
}
```

Beispiel:

```ts
export const PANEL_7_WRITE_POLICY: ScimContextWritePolicy = {
  panel: 'panel_7_poi_load_movement',
  allowed_write_paths: [
    'context.poi_model',
    'context.load_model',
    'context.movement_model',
    'context.masking_model'
  ]
};
```

Jeder Kontext-Update sollte gegen die WritePolicy geprüft werden.

---

## 22. Kontext-Update-Funktion

Empfohlene Signatur:

```ts
export function applyPanelContextUpdate<T>(
  context: ScimContext,
  panel: ScimPanelId,
  update: Partial<ScimContext>,
  writePolicy: ScimContextWritePolicy
): ScimContextUpdateResult<T>;
```

```ts
export interface ScimContextUpdateResult<T = unknown> {
  context: ScimContext;
  updated_paths: ScimContextPath[];
  rejected_paths: ScimContextPath[];
  issues: ScimIssue[];
  success: boolean;
  payload?: T;
}
```

Regel:

> Wenn `rejected_paths` nicht leer ist, ist der Update fehlgeschlagen oder muss mindestens als blockierender Architekturfehler markiert werden.

---

## 23. Sensus-Core-Grenze im Kontext

Ab `context.sensus_core_package` gelten strengere Regeln.

In folgenden Kontextbereichen dürfen keine Roh-, Debug- oder Operator-Daten mehr auftreten:

```txt
context.sensus_core_package
context.local_user_context
context.view_state
context.leaflet_effect_check.sensus_core_preview
context.release.public_exports
```

Erlaubt sind nur:

```txt
public_safe
reduced_public
sensus_core_visible
export_public
```

Nicht erlaubt:

```txt
operator_internal
debug_only
raw_forbidden
privacy_blocked
```

---

## 24. Layer-Datenklassen

```ts
export type ScimLayerDataClass =
  | 'public_aggregate'
  | 'reduced_scim_result'
  | 'public_route'
  | 'public_warning'
  | 'operator_internal'
  | 'debug'
  | 'raw_signal'
  | 'privacy_blocked';
```

Mapping:

| DataClass | Sensus Core erlaubt? |
|---|---:|
| public_aggregate | ja |
| reduced_scim_result | ja |
| public_route | ja |
| public_warning | ja |
| operator_internal | nein |
| debug | nein |
| raw_signal | nein |
| privacy_blocked | nein |

---

## 25. Gemeinsame Geo-Typen

```ts
export type BBox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
```

```ts
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lon, lat]
}
```

```ts
export interface CoordinateReferenceSystem {
  crs_id: 'EPSG:4326' | 'EPSG:3857' | 'custom';
  axis_order: 'lon_lat' | 'lat_lon' | 'xy';
  source?: string;
}
```

```ts
export type GeoJsonGeometry =
  | GeoJsonPoint
  | GeoJsonLineString
  | GeoJsonPolygon
  | GeoJsonMultiPolygon;
```

Regel:

> Für SCIM-Kontextübergaben muss CRS eindeutig sein. Unklares CRS blockiert räumliche Folgepanels.

---

## 26. Gemeinsame NumericRange

```ts
export interface NumericRange {
  min: number;
  max: number;
  default?: number;
  unit?: string;
}
```

Validierung:

```txt
min <= default <= max
min < max
unit vorhanden, wenn fachlich notwendig
```

---

## 27. Pflichtfelder je State

Jeder produktive State muss enthalten:

```txt
ID
Status
ValidationResult
IssueList
created_at
Version oder SourceRef
representation_id, sofern räumlich oder abgeleitet
```

Fehlt eines dieser Felder, ist der State nicht produktionsfähig.

---

## 28. Draft-, Test- und Production-Modi

```ts
export type ScimRunMode =
  | 'draft'
  | 'test'
  | 'staging'
  | 'production';
```

Regeln:

| Modus | Erlaubt |
|---|---|
| draft | Mockdaten, unvollständige Inputs, keine öffentliche Freigabe |
| test | Simulation, Testpakete, keine produktive Ausspielung |
| staging | reale Struktur, kontrollierte Prüfung, kein Public Release ohne Freigabe |
| production | nur freigegebene, validierte, reduzierte Daten |

Kontext sollte optional führen:

```ts
run_mode?: ScimRunMode;
```

Production-Regel:

```txt
run_mode = production blockiert Simulation-Load als produktive Lastbasis.
```

---

## 29. Kontext-Mindesttests

## 29.1 Schreibgrenzen

```txt
Panel 1 kann nur system_adjust schreiben
Panel 2 kann nur regio_content schreiben
Panel 3 kann nur target_app_ui schreiben
Panel 4 kann nur telco_load schreiben
Panel 5 kann nur representation_id, boundary, extracted_data schreiben
Panel 6 kann nur scim_context, graph, basis_layer, leaflet_check schreiben
Panel 7 kann nur poi_model, load_model, movement_model, masking_model schreiben
Panel 8 kann nur route_model, route_layer_model, leaflet_route_check schreiben
Panel 9 kann nur sensus_core_package schreiben
Panel 10 kann nur local_user_context, view_state schreiben
Panel 11 kann nur leaflet_effect_check schreiben
Panel 12 kann nur release und optional status schreiben
```

## 29.2 Representation-ID

```txt
Mismatch zwischen boundary und graph → blockiert
Mismatch zwischen graph und route_model → blockiert
Mismatch zwischen sensus_core_package und view_state → blockiert
Mismatch zwischen view_state und release → blockiert
```

## 29.3 Datenschutz

```txt
raw_signal in sensus_core_package → blockiert
debug layer in view_state → blockiert
operator note in public warning → blockiert
device_count in public layer → blockiert
privacy_blocked group in route_model public candidate → blockiert
```

## 29.4 Invalidierung

```txt
Änderung System-Adjust invalidiert Paket und Release
Änderung Regio-Content invalidiert POI, Route, Paket und Release
Änderung Telco-Load invalidiert Load, Movement, Route, Paket und Release
Änderung Boundary invalidiert Graph und alle Folgeprodukte
Änderung Paket invalidiert Local View, Effect Check und Release
```

---

## 30. Empfohlene Dateistruktur

```txt
src/scim/context/
  scimContext.types.ts
  scimContext.paths.ts
  scimContext.status.ts
  scimContext.validation.ts
  scimContext.issues.ts
  scimContext.sourceRefs.ts
  scimContext.versionRefs.ts
  scimContext.privacy.ts
  scimContext.visibility.ts
  scimContext.writePolicies.ts
  scimContext.guards.ts
  scimContext.update.ts
  scimContext.invalidate.ts
  scimContext.audit.ts
  scimContext.test.ts
```

Panelbereiche importieren daraus gemeinsame Typen.

---

## 31. Umsetzungsempfehlung

Der Kontextvertrag sollte vor weiterer UI-Entwicklung implementiert werden.

Empfohlene Reihenfolge:

```txt
1. scimContext.types.ts
2. scimContext.paths.ts
3. scimContext.status.ts
4. scimContext.issues.ts
5. scimContext.validation.ts
6. scimContext.writePolicies.ts
7. scimContext.update.ts
8. scimContext.guards.ts
9. scimContext.invalidate.ts
10. scimContext.audit.ts
11. Tests
```

Danach können die Panelmodule stabil gegen denselben Vertrag gebaut werden.

---

## 32. Kurzfazit

Der SCIM Kontextvertrag ist das technische Rückgrat der gesamten SCIM-Architektur.

Er stellt sicher:

- jedes Panel schreibt nur seinen eigenen Bereich,
- alle Statuswerte prüfbar bleiben,
- abgeleitete States versioniert sind,
- Änderungen vorgelagerter Daten Folgeprodukte invalidieren,
- Sensus-Core- und Exportgrenzen hart geschützt werden,
- Mock-, Simulation- und Produktionsläufe unterscheidbar sind,
- Release und Export nachvollziehbar bleiben.

Leitsatz:

> Ohne Kontextvertrag sind Panels nur einzelne Dokumente. Mit Kontextvertrag werden sie zu einer kontrollierbaren Pipeline.
