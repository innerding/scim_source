# SCIM Panel 12 – Freigabe und Export

## 0. Generelle SCIM-Vorinformation für das Coding

Panel 12 ist das finale Freigabe-, Versionierungs-, Export- und Archivpanel der SCIM-Kette. Es liegt nach Panel 11: Leaflet-Wirkungsprüfung und darf keine neue fachliche SCIM-Logik berechnen. Es entscheidet ausschließlich, ob ein bereits geprüfter Zustand freigegeben, versioniert, exportiert und archiviert werden darf.

SCIM besteht in der aktuellen 12-Panel-Struktur aus Inputs, Validierung, Engine, Layer-Erzeugung, Sensus-Core-Paketierung, lokaler Anwendung, Wirkungsprüfung sowie Freigabe und Export. Sensus Core ist die SCIM am Endgerät. Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug, nicht die Engine.

Leitsatz:

> Panel 12 verändert nicht die SCIM-Ergebnisse. Es entscheidet, ob ein geprüfter Zustand freigegeben, versioniert und exportiert werden darf.

---

## 0.1 Panel-Position

```txt
Panel 12: Freigabe und Export
```

Tabs:

1. Zusammenfassung
2. Validierungsstatus
3. Datenschutzstatus
4. Parameter- und Versionsstand
5. Sensus-Core-Freigabe
6. Export

Panel 12 übernimmt aus Panel 11 mindestens:

```ts
context.leaflet_effect_check.status
context.leaflet_effect_check.check_summary.ready_for_release_panel
context.leaflet_effect_check.check_summary.blocking_issue_count
context.leaflet_effect_check.check_summary.sensus_core_reduction_valid
context.leaflet_effect_check.issue_list
```

Produktive Freigabe ist nur erlaubt, wenn:

```txt
ready_for_release_panel = true
blocking_issue_count = 0
sensus_core_reduction_valid = true
status is leaflet_effect_valid or leaflet_effect_warning
```

Ein Warnstatus darf nur übernommen werden, wenn die Warnungen nicht blockierend sind und im Release dokumentiert werden.

---

## 0.2 Gemeinsamer SCIM-Kontext

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

Panel 12 darf schreiben in:

```ts
context.release
```

Optional darf Panel 12 einen abgeleiteten globalen Status setzen:

```ts
context.status
```

Panel 12 darf lesen aus:

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

Panel 12 darf nicht schreiben in:

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

---

## 0.3 Datenschutzgrenze

Panel 12 ist die letzte Sperre vor produktiver Ausspielung. Öffentliche Exporte dürfen keine Daten enthalten, die in Panel 9, Panel 10 oder Panel 11 ausgeschlossen wurden.

Nicht erlaubt in produktiven Exporten:

- Rohsignale
- Einzelsignale
- einzelne Geräte
- Device Counts
- nicht reduzierte Signal Counts
- individuelle Bewegungswege
- individuelle Aufenthaltsdauer
- exakte Signalgruppen
- Debug-GeoJSON
- Operator-Layer im Sensus-Core-Export
- Operatornotizen im Sensus-Core-Export
- interne Score-Zwischenwerte
- nicht freigegebene POI-Kandidaten
- abgelehnte oder pending POIs
- nicht freigegebene Routenoptionen
- nicht freigegebene Layer
- nicht freigegebene Regio-Content-Entwürfe
- nicht freigegebene Ziel-App-Profile

Leitsatz:

> Panel 12 exportiert nur, was vorher explizit freigegeben, reduziert und als exportfähig markiert wurde.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**Freigabe und Export**

Technischer Modulname:

```ts
ReleaseExportPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
validateReleaseInputs()
buildReleaseSummary()
validateReleaseReadiness()
validatePrivacyForRelease()
collectParameterVersions()
prepareSensusCoreRelease()
createReleaseRecord()
lockReleaseRecord()
prepareExportManifest()
exportSensusCorePackage()
exportPublicLayers()
exportOperatorArchive()
validateExportArtifacts()
applyReleaseExportToContext()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/release-export/
  ReleaseExportPanel.tsx
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

---

# 2. Zweck des Panels

Panel 12 erzeugt aus einem geprüften SCIM-Zustand einen formalen Release- und Exportzustand.

Es beantwortet:

- Welche Representation wird freigegeben?
- Sind alle Pflichtsegmente vorhanden?
- Sind alle Validierungen bestanden oder zulässig warnend?
- Ist der Datenschutzstatus gültig?
- Welche System-, Regio-, Ziel-App-, Paket- und Prüfversionen gelten?
- Welches Sensus-Core-Paket wird freigegeben?
- Welche Layer, Routenoptionen und Warnungen sind öffentlich exportfähig?
- Welche Operator- oder Debugdaten bleiben intern?
- Welche Exportformate wurden erzeugt?
- Ist der Release gesperrt, archiviert und nachvollziehbar?

Leitsatz:

> Panel 12 ist der formale Abschluss der SCIM-Pipeline: prüfen, freigeben, versionieren, exportieren, archivieren.

---

# 3. Nicht-Ziele

Panel 12 darf nicht:

- System-Adjust-Grenzen ändern
- Regio-Content ändern
- Ziel-App-UI-Profile ändern
- Telco-Load-Batches ändern
- Boundary oder Extraktion ändern
- Graphen bauen
- POIs freigeben
- Aufenthalte klassifizieren
- Bewegungsauslastung berechnen
- Maskierungen berechnen
- Routenabschnitte neu bewerten
- Sensus-Core-Pakete fachlich verändern
- lokale User-Auswahl verändern
- Leaflet-Wirkungsprüfung überschreiben
- blockierende Fehler ignorieren
- Debug- oder Rohdaten in öffentliche Exporte übernehmen

Panel 12 ist ein Freigabe-, Versionierungs-, Export- und Archivpanel. Es ist kein Engine-Panel und kein Reparaturpanel.

---

# 4. Fachliche Verantwortung

## 4.1 Zusammenfassung erzeugen

Panel 12 erzeugt eine Release-Zusammenfassung mit:

- Representation-ID
- Representation-Name, falls vorhanden
- Boundary-Referenz
- System-Adjust-Version
- Regio-Content-Version
- Ziel-App-UI-Version
- Sensus-Core-Package-ID
- View-State-ID
- Leaflet-Effect-Check-ID
- Anzahl öffentlicher Layer
- Anzahl exportfähiger Routenoptionen
- Anzahl sichtbarer Warnungen
- Anzahl blockierender Fehler
- Freigabestatus
- Exportstatus

Die Zusammenfassung darf keine Roh- oder Debugdaten enthalten.

## 4.2 Validierungsstatus prüfen

Pflichtsegmente für produktive Freigabe:

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.boundary
context.scim_context
context.graph
context.route_model
context.sensus_core_package
context.local_user_context
context.view_state
context.leaflet_effect_check
```

Fehlende Pflichtsegmente blockieren die Freigabe.

## 4.3 Datenschutzstatus prüfen

Panel 12 führt eine letzte Datenschutz- und Export-Sanitization-Prüfung durch.

Geprüft wird:

- Sensus-Core-Paket enthält keine verbotenen Datenklassen.
- Öffentliche Layer enthalten keine Rohdaten oder Debugproperties.
- Routenoptionen enthalten keine verbotenen Score-Zwischenwerte.
- Warnungen enthalten keine Operatornotizen.
- Exportmanifest enthält keine nicht freigegebenen Inhalte.
- Leaflet-Wirkungsprüfung bestätigt gültige Reduktion.
- Keine blockierenden Sensus-Core-Probleme aus Panel 11 sind vorhanden.

Panel 12 darf unzulässige Exportkandidaten nicht stillschweigend reparieren. Entfernte Inhalte müssen dokumentiert werden. Bei produktiver Freigabe ist Blockieren vorzuziehen, wenn die Entfernung die Paketwirkung verändern würde.

## 4.4 Parameter- und Versionsstand sammeln

Panel 12 erstellt einen unveränderlichen Versionsblock mit:

- System-Adjust-Version
- Datenschutzregel-Version
- Regio-Content-Version
- Ziel-App-UI-Version
- Telco-Load-Batch-ID, sofern relevant
- Boundary-ID
- Extraction-ID
- Graph-ID
- Route-Model-ID
- Sensus-Core-Package-ID
- Local-Context-ID
- View-State-ID
- Leaflet-Effect-Check-ID
- Release-ID
- Export-Manifest-ID

Dieser Versionsblock macht den exportierten Zustand reproduzierbar, prüfbar und rollbackfähig.

## 4.5 Sensus-Core-Freigabe erzeugen

Panel 12 markiert ein Sensus-Core-Paket als freigegeben, wenn:

- das Paket existiert,
- das Paket `sensus_core_package_ready` oder einen zulässigen Warnstatus besitzt,
- die lokale View auf genau diesem Paket basiert,
- Panel 11 dieses Paket und diese View geprüft hat,
- die Sensus-Core-Reduktion gültig ist,
- keine blockierenden Fehler vorhanden sind.

Die Freigabe erzeugt einen Release-Record. Nach Sperrung darf dieser Record nicht mehr mutiert werden.

## 4.6 Export vorbereiten und ausführen

Mögliche Exportarten:

- Sensus-Core-Paketexport
- öffentliche Layer
- reduzierte Routenoptionen
- öffentliche Warnungen
- Release-Manifest
- Operator-Archiv
- Prüfbericht
- optional Debug-Archiv nur intern und strikt getrennt

Öffentliche Exporte und Operator-Archive müssen getrennte Datenklassen, getrennte Pfade und getrennte Manifeste haben.

---

# 5. Datenmodell

## 5.1 ReleaseExportState

```ts
export interface ReleaseExportState {
  release_id: string;
  representation_id: string;
  created_at: string;
  created_by?: string;
  release_mode: ReleaseMode;
  source_refs: ReleaseSourceRefs;
  release_summary: ReleaseSummary;
  validation_status: ReleaseValidationStatus;
  privacy_status: ReleasePrivacyStatus;
  version_state: ReleaseVersionState;
  sensus_core_release: SensusCoreReleaseState;
  export_manifest: ExportManifest;
  export_results: ExportResult[];
  issue_list: ReleaseIssue[];
  audit_log: ReleaseAuditEntry[];
  status: ReleaseExportStatus;
}
```

## 5.2 ReleaseMode

```ts
export type ReleaseMode =
  | 'draft_release'
  | 'test_release'
  | 'staging_release'
  | 'production_release';
```

Regeln:

```txt
production_release requires all blockers resolved
staging_release may allow documented non-blocking warnings
test_release may use mock exports but must be marked non-production
draft_release must not be distributed to public Sensus Core clients
```

## 5.3 ReleaseExportStatus

```ts
export type ReleaseExportStatus =
  | 'not_started'
  | 'checking_release_readiness'
  | 'release_ready'
  | 'release_warning'
  | 'release_blocked'
  | 'release_created'
  | 'release_locked'
  | 'exporting'
  | 'exported'
  | 'export_warning'
  | 'export_failed'
  | 'archived';
```

---

# 6. SourceRefs

```ts
export interface ReleaseSourceRefs {
  system_adjust_version: string;
  regio_content_version: string;
  target_app_ui_version: string;
  telco_load_batch_id?: string;
  representation_id: string;
  boundary_id?: string;
  extraction_id?: string;
  scim_context_id?: string;
  graph_id?: string;
  route_model_id?: string;
  route_layer_model_id?: string;
  sensus_core_package_id: string;
  local_sensus_core_context_id?: string;
  view_state_id: string;
  leaflet_effect_check_id: string;
}
```

Regeln:

```txt
representation_id must match context.representation_id
sensus_core_package_id must match context.sensus_core_package
view_state_id must match context.view_state
leaflet_effect_check_id must match context.leaflet_effect_check
system_adjust_version must exist
regio_content_version must exist for production release
target_app_ui_version must exist for production release
```

---

# 7. ReleaseSummary

```ts
export interface ReleaseSummary {
  representation_name?: string;
  release_label: string;
  release_notes?: string;
  package_ready: boolean;
  leaflet_effect_ready: boolean;
  privacy_valid: boolean;
  validation_valid: boolean;
  public_layer_count: number;
  route_option_count: number;
  visible_warning_count: number;
  blocking_issue_count: number;
  warning_count: number;
  export_target_count: number;
  ready_for_release: boolean;
  ready_for_export: boolean;
}
```

Regeln:

```txt
ready_for_release = package_ready && leaflet_effect_ready && privacy_valid && validation_valid && blocking_issue_count === 0
ready_for_export requires ready_for_release and at least one enabled export target
production release requires ready_for_release === true
```

---

# 8. Validierungsstatus

```ts
export interface ReleaseValidationStatus {
  input_segments_valid: boolean;
  package_valid: boolean;
  local_view_valid: boolean;
  leaflet_effect_valid: boolean;
  no_blocking_issues: boolean;
  warnings_accepted: boolean;
  release_record_valid: boolean;
  export_manifest_valid: boolean;
  checked_at: string;
}
```

Blockierend:

```txt
missing system_adjust
missing target_app_ui
missing sensus_core_package
missing view_state
missing leaflet_effect_check
leaflet_effect_check.status not in leaflet_effect_valid / leaflet_effect_warning
ready_for_release_panel !== true
blocking_issue_count > 0
sensus_core_reduction_valid !== true
sensus_core_package not ready
view_state not based on package
representation_id mismatch
```

Warnend:

```txt
leaflet_effect_check.status === leaflet_effect_warning
non-blocking operator warnings exist
export target optional but disabled
operator archive skipped
release notes missing for staging or production
```

---

# 9. Datenschutzstatus

```ts
export interface ReleasePrivacyStatus {
  privacy_valid: boolean;
  checked_at: string;
  source_leaflet_reduction_valid: boolean;
  package_contains_raw_signals: boolean;
  package_contains_debug_data: boolean;
  package_contains_operator_data: boolean;
  package_contains_device_counts: boolean;
  package_contains_unreleased_content: boolean;
  export_contains_forbidden_properties: boolean;
  public_export_allowed: boolean;
  operator_archive_allowed: boolean;
  blockers: ReleasePrivacyBlocker[];
  warnings: ReleasePrivacyWarning[];
}
```

```ts
export interface ReleasePrivacyBlocker {
  blocker_id: string;
  code:
    | 'RAW_SIGNAL_IN_EXPORT'
    | 'DEBUG_DATA_IN_PUBLIC_EXPORT'
    | 'OPERATOR_DATA_IN_PUBLIC_EXPORT'
    | 'DEVICE_COUNT_IN_PUBLIC_EXPORT'
    | 'UNRELEASED_CONTENT_IN_EXPORT'
    | 'REJECTED_POI_IN_PUBLIC_EXPORT'
    | 'PENDING_POI_IN_PUBLIC_EXPORT'
    | 'SENSUS_CORE_REDUCTION_INVALID'
    | 'LEAFLET_EFFECT_PRIVACY_BLOCKER';
  related_id?: string;
  message: string;
}
```

```ts
export interface ReleasePrivacyWarning {
  warning_id: string;
  code:
    | 'SIGNAL_COUNT_REDUCED'
    | 'INTERNAL_SCORE_REDUCED'
    | 'OPERATOR_ARCHIVE_CONTAINS_INTERNAL_DATA'
    | 'EXPORT_SANITIZED';
  related_id?: string;
  message: string;
}
```

Regeln:

```txt
public_export_allowed requires privacy_valid === true
operator_archive_allowed may be true with internal data, but must be access-controlled and non-public
operator archive must never be used as Sensus-Core export
privacy blockers always block production release
```

---

# 10. VersionState

```ts
export interface ReleaseVersionState {
  release_version: string;
  semantic_version?: string;
  system_adjust_version: string;
  privacy_rule_version?: string;
  regio_content_version: string;
  target_app_ui_version: string;
  graph_build_version?: string;
  route_evaluation_version?: string;
  sensus_core_package_version?: string;
  leaflet_effect_check_version?: string;
  created_from_hash?: string;
  immutable_after_lock: boolean;
}
```

Regeln:

```txt
release_version must exist before export
production release should be immutable after lock
created_from_hash should change when any source ref changes
export artifact names should include release_id or release_version
rollback requires previous locked release
```

---

# 11. SensusCoreReleaseState

```ts
export interface SensusCoreReleaseState {
  sensus_core_release_id: string;
  source_package_id: string;
  release_status: SensusCoreReleaseStatus;
  released_public_layer_ids: string[];
  released_route_option_ids: string[];
  released_warning_ids: string[];
  allowed_local_control_ids: string[];
  excluded_content_summary: ExcludedReleaseContentSummary;
  release_guard: SensusCoreReleaseGuard;
}
```

```ts
export type SensusCoreReleaseStatus =
  | 'not_released'
  | 'ready_for_release'
  | 'released_to_staging'
  | 'released_to_production'
  | 'release_blocked';
```

```ts
export interface ExcludedReleaseContentSummary {
  raw_signal_count: number;
  debug_layer_count: number;
  operator_layer_count: number;
  rejected_poi_count: number;
  pending_poi_count: number;
  non_public_route_count: number;
  stripped_property_count: number;
}
```

```ts
export interface SensusCoreReleaseGuard {
  package_id_matches: boolean;
  view_state_matches: boolean;
  leaflet_effect_matches: boolean;
  reduction_valid: boolean;
  no_blocking_issues: boolean;
  release_allowed: boolean;
}
```

---

# 12. ExportManifest

```ts
export interface ExportManifest {
  export_manifest_id: string;
  release_id: string;
  created_at: string;
  targets: ExportTarget[];
  artifacts: ExportArtifact[];
  manifest_status: ExportManifestStatus;
}
```

```ts
export interface ExportTarget {
  target_id: string;
  target_type:
    | 'sensus_core_package'
    | 'public_geojson_layers'
    | 'public_vector_tiles'
    | 'route_options_json'
    | 'warnings_json'
    | 'release_report_md'
    | 'operator_archive_json'
    | 'operator_archive_zip'
    | 'debug_archive_internal';
  enabled: boolean;
  public: boolean;
  requires_release_ready: boolean;
  requires_privacy_valid: boolean;
  destination?: string;
}
```

```ts
export interface ExportArtifact {
  artifact_id: string;
  target_id: string;
  artifact_type:
    | 'json'
    | 'geojson'
    | 'mbtiles'
    | 'pmtiles'
    | 'zip'
    | 'md'
    | 'manifest';
  filename: string;
  checksum?: string;
  size_bytes?: number;
  public: boolean;
  created_at?: string;
  status: ExportArtifactStatus;
}
```

```ts
export type ExportManifestStatus =
  | 'not_prepared'
  | 'manifest_prepared'
  | 'manifest_warning'
  | 'manifest_invalid';

export type ExportArtifactStatus =
  | 'not_created'
  | 'creating'
  | 'created'
  | 'validated'
  | 'failed'
  | 'skipped';
```

```ts
export interface ExportResult {
  export_result_id: string;
  target_id: string;
  success: boolean;
  artifact_ids: string[];
  error_message?: string;
  warning_messages: string[];
  exported_at: string;
}
```

---

# 13. Fehler- und Auditmodell

```ts
export interface ReleaseIssue {
  issue_id: string;
  code: ReleaseIssueCode;
  severity: 'info' | 'warning' | 'error';
  tab:
    | 'summary'
    | 'validation_status'
    | 'privacy_status'
    | 'version_state'
    | 'sensus_core_release'
    | 'export'
    | 'global';
  related_id?: string;
  message: string;
  suggested_fix?: string;
  blocking: boolean;
}
```

```ts
export type ReleaseIssueCode =
  | 'MISSING_REQUIRED_INPUT'
  | 'REPRESENTATION_ID_MISMATCH'
  | 'SYSTEM_ADJUST_INVALID'
  | 'REGIO_CONTENT_INVALID'
  | 'TARGET_APP_UI_INVALID'
  | 'SENSUS_CORE_PACKAGE_MISSING'
  | 'SENSUS_CORE_PACKAGE_NOT_READY'
  | 'VIEW_STATE_MISSING'
  | 'VIEW_STATE_PACKAGE_MISMATCH'
  | 'LEAFLET_EFFECT_CHECK_MISSING'
  | 'LEAFLET_EFFECT_NOT_READY'
  | 'LEAFLET_EFFECT_BLOCKING_ISSUES'
  | 'SENSUS_CORE_REDUCTION_INVALID'
  | 'PRIVACY_BLOCKER_FOUND'
  | 'VERSION_STATE_INCOMPLETE'
  | 'EXPORT_MANIFEST_INVALID'
  | 'EXPORT_TARGET_DISABLED'
  | 'EXPORT_ARTIFACT_FAILED'
  | 'WARNINGS_REQUIRE_ACCEPTANCE'
  | 'RELEASE_LOCKED';
```

```ts
export interface ReleaseAuditEntry {
  audit_id: string;
  timestamp: string;
  action:
    | 'release_check_started'
    | 'release_ready_confirmed'
    | 'release_warning_confirmed'
    | 'release_blocked'
    | 'release_created'
    | 'release_locked'
    | 'export_started'
    | 'export_completed'
    | 'export_failed'
    | 'archive_created';
  actor?: string;
  message: string;
  related_issue_ids?: string[];
}
```

---

# 14. UI-Struktur

## 14.1 Tab 1 – Zusammenfassung

Zweck:

- Gesamtzustand der Freigabe auf einen Blick darstellen.

Anzeigen:

- Representation-Name
- Release-ID
- Freigabemodus
- Paketstatus
- Wirkungsprüfstatus
- Datenschutzstatus
- Validierungsstatus
- Anzahl Layer
- Anzahl Routenoptionen
- Anzahl Warnungen
- Anzahl Blocker
- Status: bereit, warnend, blockiert, exportiert

Aktionen:

- Release prüfen
- Release-Notiz ergänzen
- Warnungen bestätigen, falls zulässig
- zur Freigabe wechseln

## 14.2 Tab 2 – Validierungsstatus

Zweck:

- Pflichtsegmente und Panelkette prüfen.

Anzeigen:

- System-Adjust gültig
- Regio-Content gültig
- Ziel-App UI gültig
- Boundary gültig
- Graph gültig
- Route Model gültig
- Sensus-Core-Paket bereit
- lokale View bereit
- Leaflet-Wirkungsprüfung bereit
- Fehler und Warnungen

Aktionen:

- Validierung erneut ausführen
- Fehlerdetails öffnen
- Quellpanel referenzieren

## 14.3 Tab 3 – Datenschutzstatus

Zweck:

- letzte Export-Sanitization und Datenschutzprüfung darstellen.

Anzeigen:

- Rohdaten gefunden: ja/nein
- Debugdaten gefunden: ja/nein
- Operator-Daten im Public Export: ja/nein
- Device Counts gefunden: ja/nein
- nicht freigegebene Inhalte gefunden: ja/nein
- Sensus-Core-Reduktion gültig: ja/nein
- Public Export erlaubt: ja/nein
- Operator-Archiv erlaubt: ja/nein

Aktionen:

- Privacy Scan ausführen
- Blocker anzeigen
- Sanitization-Bericht exportieren

## 14.4 Tab 4 – Parameter- und Versionsstand

Zweck:

- alle Quell- und Regelversionen nachvollziehbar machen.

Anzeigen:

- System-Adjust-Version
- Datenschutzregel-Version
- Regio-Content-Version
- Ziel-App-UI-Version
- Boundary-ID
- Graph-ID
- Route-Model-ID
- Sensus-Core-Package-ID
- View-State-ID
- Leaflet-Effect-Check-ID
- Release-Version
- Hash / Fingerprint

Aktionen:

- Versionsblock erzeugen
- Fingerprint berechnen
- Versionsbericht kopieren

## 14.5 Tab 5 – Sensus-Core-Freigabe

Zweck:

- das konkrete Sensus-Core-Paket formell freigeben.

Anzeigen:

- Paket-ID
- Paketstatus
- freigegebene öffentliche Layer
- freigegebene Routenoptionen
- freigegebene Warnungen
- erlaubte lokale Regler
- ausgeschlossene Inhalte
- Release Guard

Aktionen:

- Sensus-Core-Freigabe vorbereiten
- Release erzeugen
- Release sperren
- Freigabe blockieren, falls Fehler vorhanden

## 14.6 Tab 6 – Export

Zweck:

- freigegebene Artefakte erzeugen und Exportstatus prüfen.

Anzeigen:

- Exportziele
- Zieltyp
- Public/Internal-Klasse
- Exportformat
- Dateiname
- Prüfsumme
- Größe
- Erstellungsstatus
- Fehler und Warnungen

Aktionen:

- Exportmanifest vorbereiten
- Export starten
- Artefakte validieren
- Release-Bericht erzeugen
- Operator-Archiv erzeugen
- Export abschließen

---

# 15. Validierungslogik

## 15.1 validateReleaseInputs()

```ts
export function validateReleaseInputs(context: ScimContext): ReleaseIssue[] {
  const issues: ReleaseIssue[] = [];

  if (!context.representation_id) {
    issues.push(blockingIssue('MISSING_REQUIRED_INPUT', 'global', 'representation_id fehlt.'));
  }

  if (!context.system_adjust || context.system_adjust.status !== 'system_adjust_valid') {
    issues.push(blockingIssue('SYSTEM_ADJUST_INVALID', 'validation_status', 'System-Adjust ist nicht gültig.'));
  }

  if (!context.target_app_ui || context.target_app_ui.status !== 'target_app_ui_valid') {
    issues.push(blockingIssue('TARGET_APP_UI_INVALID', 'validation_status', 'Ziel-App UI Input ist nicht gültig.'));
  }

  if (!context.sensus_core_package) {
    issues.push(blockingIssue('SENSUS_CORE_PACKAGE_MISSING', 'validation_status', 'Sensus-Core-Paket fehlt.'));
  }

  if (!context.view_state) {
    issues.push(blockingIssue('VIEW_STATE_MISSING', 'validation_status', 'Lokaler View State fehlt.'));
  }

  if (!context.leaflet_effect_check) {
    issues.push(blockingIssue('LEAFLET_EFFECT_CHECK_MISSING', 'validation_status', 'Leaflet-Wirkungsprüfung fehlt.'));
  }

  return issues;
}
```

## 15.2 validateReleaseReadiness()

```ts
export function validateReleaseReadiness(context: ScimContext): ReleaseIssue[] {
  const issues: ReleaseIssue[] = [];
  const effect = context.leaflet_effect_check;

  if (!effect) return issues;

  const allowedEffectStatus =
    effect.status === 'leaflet_effect_valid' ||
    effect.status === 'leaflet_effect_warning';

  if (!allowedEffectStatus) {
    issues.push(blockingIssue('LEAFLET_EFFECT_NOT_READY', 'validation_status', 'Leaflet-Wirkungsprüfung ist nicht freigabefähig.'));
  }

  if (!effect.check_summary.ready_for_release_panel) {
    issues.push(blockingIssue('LEAFLET_EFFECT_NOT_READY', 'validation_status', 'Panel 11 hat die Übergabe an Panel 12 nicht freigegeben.'));
  }

  if (effect.check_summary.blocking_issue_count > 0) {
    issues.push(blockingIssue('LEAFLET_EFFECT_BLOCKING_ISSUES', 'validation_status', 'Blockierende Fehler aus Panel 11 vorhanden.'));
  }

  if (!effect.check_summary.sensus_core_reduction_valid) {
    issues.push(blockingIssue('SENSUS_CORE_REDUCTION_INVALID', 'privacy_status', 'Sensus-Core-Reduktion ist nicht gültig.'));
  }

  return issues;
}
```

## 15.3 applyReleaseExportToContext()

```ts
export function applyReleaseExportToContext(
  context: ScimContext,
  release: ReleaseExportState
): ScimContext {
  if (release.representation_id !== context.representation_id) {
    throw new Error('Release representation_id does not match context.');
  }

  if (
    release.status !== 'release_ready' &&
    release.status !== 'release_warning' &&
    release.status !== 'release_created' &&
    release.status !== 'release_locked' &&
    release.status !== 'exported' &&
    release.status !== 'export_warning' &&
    release.status !== 'archived'
  ) {
    throw new Error(`Cannot apply release with status ${release.status}.`);
  }

  return {
    ...context,
    release,
    status:
      release.status === 'exported'
        ? 'exported'
        : release.status === 'release_ready' || release.status === 'release_created' || release.status === 'release_locked'
          ? 'release_ready'
          : context.status
  };
}
```

Regeln:

- Die Funktion darf nur `context.release` und optional den abgeleiteten globalen `context.status` verändern.
- Alle fachlichen Vorstufen bleiben unverändert.
- Blockierte Releases dürfen nicht als gültiger Release in den Kontext übernommen werden.
- Exportfehler dürfen dokumentiert werden, dürfen aber keinen erfolgreichen Exportstatus setzen.

---

# 16. Mock-Daten

```ts
export const mockReleaseExportState: ReleaseExportState = {
  release_id: 'release_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  created_at: '2026-05-21T00:00:00.000Z',
  created_by: 'operator_mock',
  release_mode: 'staging_release',
  source_refs: {
    system_adjust_version: 'sys_v1',
    regio_content_version: 'regio_v1',
    target_app_ui_version: 'ui_v1',
    representation_id: 'rep_hochwab_nord_001',
    boundary_id: 'boundary_001',
    graph_id: 'graph_001',
    route_model_id: 'route_model_001',
    sensus_core_package_id: 'scp_001',
    local_sensus_core_context_id: 'local_001',
    view_state_id: 'view_001',
    leaflet_effect_check_id: 'leaflet_effect_001'
  },
  release_summary: {
    representation_name: 'Hochschwab Nord',
    release_label: 'Hochschwab Nord SCIM Release 001',
    package_ready: true,
    leaflet_effect_ready: true,
    privacy_valid: true,
    validation_valid: true,
    public_layer_count: 4,
    route_option_count: 3,
    visible_warning_count: 2,
    blocking_issue_count: 0,
    warning_count: 0,
    export_target_count: 3,
    ready_for_release: true,
    ready_for_export: true
  },
  validation_status: {
    input_segments_valid: true,
    package_valid: true,
    local_view_valid: true,
    leaflet_effect_valid: true,
    no_blocking_issues: true,
    warnings_accepted: true,
    release_record_valid: true,
    export_manifest_valid: true,
    checked_at: '2026-05-21T00:00:00.000Z'
  },
  privacy_status: {
    privacy_valid: true,
    checked_at: '2026-05-21T00:00:00.000Z',
    source_leaflet_reduction_valid: true,
    package_contains_raw_signals: false,
    package_contains_debug_data: false,
    package_contains_operator_data: false,
    package_contains_device_counts: false,
    package_contains_unreleased_content: false,
    export_contains_forbidden_properties: false,
    public_export_allowed: true,
    operator_archive_allowed: true,
    blockers: [],
    warnings: []
  },
  version_state: {
    release_version: 'release_v1',
    semantic_version: '0.1.0',
    system_adjust_version: 'sys_v1',
    privacy_rule_version: 'privacy_v1',
    regio_content_version: 'regio_v1',
    target_app_ui_version: 'ui_v1',
    graph_build_version: 'graph_build_v1',
    route_evaluation_version: 'route_eval_v1',
    sensus_core_package_version: 'scp_v1',
    leaflet_effect_check_version: 'leaflet_effect_v1',
    created_from_hash: 'mock_hash_release_001',
    immutable_after_lock: true
  },
  sensus_core_release: {
    sensus_core_release_id: 'scr_001',
    source_package_id: 'scp_001',
    release_status: 'ready_for_release',
    released_public_layer_ids: ['layer_base_public', 'layer_routes_public'],
    released_route_option_ids: ['route_low_load', 'route_fastest', 'route_fallback'],
    released_warning_ids: ['warning_high_load_001'],
    allowed_local_control_ids: ['route_mode', 'display_intensity'],
    excluded_content_summary: {
      raw_signal_count: 0,
      debug_layer_count: 2,
      operator_layer_count: 3,
      rejected_poi_count: 0,
      pending_poi_count: 0,
      non_public_route_count: 1,
      stripped_property_count: 12
    },
    release_guard: {
      package_id_matches: true,
      view_state_matches: true,
      leaflet_effect_matches: true,
      reduction_valid: true,
      no_blocking_issues: true,
      release_allowed: true
    }
  },
  export_manifest: {
    export_manifest_id: 'export_manifest_001',
    release_id: 'release_hochwab_nord_001',
    created_at: '2026-05-21T00:00:00.000Z',
    targets: [],
    artifacts: [],
    manifest_status: 'manifest_prepared'
  },
  export_results: [],
  issue_list: [],
  audit_log: [],
  status: 'release_ready'
};
```

---

# 17. Akzeptanzkriterien

## 17.1 Allgemein

- Panel 12 kann einen vollständigen, gültigen SCIM-Kontext einlesen.
- Panel 12 schreibt nur `context.release` und optional einen abgeleiteten globalen Status.
- Panel 12 verändert keine vorgelagerten Modelle.
- Panel 12 blockiert fehlende Pflichtsegmente.
- Panel 12 blockiert nicht bestandene oder nicht vorhandene Leaflet-Wirkungsprüfung.
- Panel 12 blockiert blockierende Fehler aus Panel 11.
- Panel 12 blockiert ungültige Sensus-Core-Reduktion.

## 17.2 Datenschutz

- Öffentliche Exporte enthalten keine Rohsignale.
- Öffentliche Exporte enthalten keine Debugdaten.
- Öffentliche Exporte enthalten keine Operatornotizen.
- Öffentliche Exporte enthalten keine Device Counts.
- Öffentliche Exporte enthalten keine abgelehnten oder pending POIs.
- Operator-Archive sind getrennt von öffentlichen Exporten.
- Debug-Archive sind intern und niemals Sensus-Core-Export.

## 17.3 Freigabe

- Ein gültiger Zustand erzeugt `release_ready`.
- Ein gültiger Zustand mit nicht blockierenden Warnungen erzeugt `release_warning`.
- Ein bestätigter Release erzeugt `release_created`.
- Ein gesperrter Release erzeugt `release_locked`.
- Ein blockierter Zustand erzeugt `release_blocked`.
- Ein erfolgreich exportierter Zustand erzeugt `exported`.

## 17.4 Export

- Exportmanifest enthält nur aktivierte Exportziele.
- Public-Artefakte sind als `public: true` markiert.
- Interne Artefakte sind als `public: false` markiert.
- Artefakte besitzen Dateinamen und nach Möglichkeit Checksummen.
- Fehlgeschlagene Exporte setzen keinen Erfolgstatus.
- Release-Bericht enthält Versionen, Prüfergebnisse, Datenschutzstatus und Exportergebnisse.

## 17.5 Tests

Mindestens zu testen:

- gültiger Mock erzeugt `release_ready`
- fehlendes Sensus-Core-Paket blockiert
- fehlender View State blockiert
- fehlende Leaflet-Wirkungsprüfung blockiert
- `blocking_issue_count > 0` blockiert
- `sensus_core_reduction_valid = false` blockiert
- Representation-ID-Mismatch blockiert
- Public Export mit Debugdaten blockiert
- Warnstatus aus Panel 11 kann als `release_warning` übernommen werden
- Kontext-Apply verändert keine vorgelagerten Kontextbereiche

---

# 18. Kompakter Codex-Auftrag für Panel 12

```txt
Baue Panel 12: Freigabe und Export.

Erstelle ein React/TypeScript-Modul `ReleaseExportPanel` unter
`src/scim/release-export/`.

Das Panel ist das finale Freigabe-, Versionierungs-, Export- und Archivpanel nach
`LeafletEffectCheckPanel`. Es darf keine SCIM-Fachlogik neu berechnen und keine
vorgelagerten Kontextbereiche verändern. Es darf nur `context.release` schreiben
und optional einen abgeleiteten globalen Status setzen.

Tabs:
1. Zusammenfassung
2. Validierungsstatus
3. Datenschutzstatus
4. Parameter- und Versionsstand
5. Sensus-Core-Freigabe
6. Export

Implementiere:
- Typen für `ReleaseExportState`, `ReleaseSourceRefs`, `ReleaseSummary`,
  `ReleaseValidationStatus`, `ReleasePrivacyStatus`, `ReleaseVersionState`,
  `SensusCoreReleaseState`, `ExportManifest`, `ExportArtifact`, `ExportResult`,
  `ReleaseIssue` und `ReleaseAuditEntry`.
- Input Guard gegen fehlende Pflichtsegmente.
- Prüfung der Panel-11-Übergabe:
  `leaflet_effect_valid` oder `leaflet_effect_warning`,
  `ready_for_release_panel = true`,
  `blocking_issue_count = 0`,
  `sensus_core_reduction_valid = true`.
- Datenschutzprüfung für Sensus-Core-Paket, public layers, route options,
  warnings und Exportmanifest.
- Versionsblock aus System-Adjust, Regio-Content, Ziel-App UI, Graph,
  Route Model, Sensus-Core-Paket, View State und Leaflet Effect Check.
- Release Guard für Sensus-Core-Freigabe.
- Exportmanifest mit getrennten public/internal Exportzielen.
- Artefaktvalidierung mit Status, Dateiname, Public-Flag, optional Checksumme.
- Audit Log für Prüfung, Freigabe, Sperrung, Export und Archiv.
- Kontext-Apply-Funktion `applyReleaseExportToContext()`.

Nicht bauen:
- keine neue Routenbewertung,
- keine neue Aufenthaltslogik,
- keine neue Bewegungsauslastung,
- keine Veränderung des Sensus-Core-Pakets,
- keine Veränderung der lokalen User-Auswahl,
- keine Überschreibung der Leaflet-Wirkungsprüfung,
- kein Public Export von Roh-, Debug- oder Operator-Daten.

Akzeptanz:
- gültiger Kontext erzeugt `release_ready`.
- gültiger Kontext mit nicht blockierenden Warnungen erzeugt `release_warning`.
- blockierende Panel-11-Fehler verhindern Freigabe.
- ungültige Sensus-Core-Reduktion verhindert Freigabe.
- erfolgreicher Export erzeugt `exported`.
- Kontext-Apply verändert nur `context.release` und optional den globalen Status.
```

---

# 19. Kernaussage für Panel 12

Panel 12 ist kein Reparaturpanel und kein freier Exportdialog.

Es ist die formale Abschlussgrenze der SCIM:

- Es prüft, ob alle Vorstufen gültig sind.
- Es übernimmt nur bestandene oder zulässig warnende Wirkungsprüfungen.
- Es bestätigt Datenschutz und Reduktion.
- Es sammelt alle Parameter- und Versionsstände.
- Es gibt das Sensus-Core-Paket frei.
- Es erzeugt getrennte öffentliche und interne Exportartefakte.
- Es archiviert den Release nachvollziehbar.

Erst wenn Panel 12 erfolgreich ist, gilt ein SCIM-Zustand als freigegeben, exportiert und produktseitig ausspielbar.
