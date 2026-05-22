# SCIM Panel 5 – Boundary und Extraktion

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor den konkreten Panel-Auftrag. Sie stellt sicher, dass Panel 5 nicht als isolierte Leaflet-Zeichenfläche gebaut wird, sondern als räumlicher Startpunkt der konkreten SCIM-Representation.

### 0.1 SCIM-Gesamtsystem

SCIM ist ein Gesamtsystem aus:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokaler Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 5 liegt zwischen der Input-/Steuerungsschicht und dem rechnerischen SCIM-Kern. Es erzeugt noch keinen Graphen, keine Aufenthaltsbereiche, keine Bewegungsauslastung, keine Routenbewertung und keine Sensus-Core-Ausgabe. Es definiert den räumlichen Arbeitsraum und erzeugt daraus ein erstes Extraktionspaket, auf dem die folgenden Engine-Panels arbeiten.

### 0.2 Rollenklärung

**SCIM-Engine**  
Der rechnerische Kern. Sie verarbeitet später Boundary, extrahierte Wege, POIs, Telco-Load, Graph, Aufenthaltsbereiche, Bewegung, Maskierung und Routenbewertung.

**Leaflet**  
Leaflet ist in Panel 5 primär Zeichen-, Import-, Prüf- und Vorschauwerkzeug. Leaflet ist nicht die Engine. Leaflet erzeugt oder zeigt die Boundary, hilft bei der Plausibilitätsprüfung und kann Extraktionsergebnisse sichtbar machen.

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät bzw. in der laufzeitnahen App-Representation. Panel 5 erzeugt noch kein Sensus-Core-Paket. Die Boundary und das Extraktionspaket bilden aber die spätere räumliche Grundlage für Sensus-Core-Layer und Routenvorschläge.

**Boundary und Extraktion**  
Panel 5 verbindet zwei fachlich eng gekoppelte Schritte:

- eine konkrete Representation-Boundary zeichnen, importieren, benennen und validieren,
- innerhalb dieser Boundary plus technischem Puffer relevante Ausgangsdaten extrahieren.

Leitsatz:

> Ohne gültige Boundary gibt es keinen gültigen räumlichen SCIM-Kontext. Ohne Extraktion gibt es keinen baubaren Graphen.

### 0.3 Gemeinsamer SCIM-Kontext

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

Panel 5 darf schreiben in:

```ts
context.representation_id
context.boundary
context.extracted_data
```

Panel 5 darf lesen aus:

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
```

Panel 5 darf nicht schreiben in:

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

Panel 5 ist besonders wichtig, weil alle späteren räumlichen Berechnungen von seiner Boundary, seinem Puffer und seinem Extraktionspaket abhängen.

### 0.5 Datenschutzgrenze

Panel 5 darf keine Datenschutzgrenzen aufweichen. Es verarbeitet zwar primär Geometrien, POIs, Wege und bereits aggregierte Load-Bezüge, muss aber verhindern, dass Rohsignale oder zu genaue personenbezogene Signalpunkte in das Extraktionspaket gelangen.

Nicht erlaubt:

- Rohsignale in `extracted_data` übernehmen
- einzelne Geräte oder Einzeltraces extrahieren
- Telco-Load als punktgenaue Bewegungsdaten in Leaflet darstellen
- technische Debug-Geometrien als Sensus-Core-tauglich markieren
- Boundary- oder Pufferlogik nutzen, um Mindestaggregation zu umgehen

Falls Telco-Load aus Panel 4 vorhanden ist, darf Panel 5 ihn höchstens räumlich vorfiltern oder referenzieren. Die Projektion auf Graphsegmente, Aufenthaltsbereiche oder Bewegungskanten erfolgt später.

### 0.6 System-Adjust-Vorrang

Panel 5 ist abhängig von `context.system_adjust`.

Ohne gültigen System-Adjust-Stand darf eine Boundary zwar als Entwurf gezeichnet werden, aber kein runtime-gültiges Extraktionspaket entstehen.

System-Adjust begrenzt für Panel 5 insbesondere:

- zulässige Boundary-Größen, sofern definiert
- Mindest- und Höchstwerte für Puffer
- POI-Radius-Minimum und -Maximum
- Vergleichssaum-Minimum und -Maximum
- räumliche Mindestauflösung
- Mindestlänge sichtbarer oder extrahierter Wegobjekte
- Datenschutz- und Aggregationsgrenzen für vorgefilterte Load-Bezüge

### 0.7 Regio-Content-Abhängigkeit

Panel 5 liest `context.regio_content`, sofern vorhanden und gültig.

Regio-Content liefert für Panel 5:

- freigegebene regionale POIs,
- bestätigte POI-Radien,
- regionale Vergleichssaumbreiten,
- lokale Sperren und Hinweise,
- regionale Parameterstände,
- regionale Freigaben.

Panel 5 darf diese Inhalte räumlich der Boundary zuordnen und in das Extraktionspaket aufnehmen. Es darf sie nicht ändern, nicht freigeben und nicht neu bewerten.

### 0.8 Ziel-App-UI-Abhängigkeit

Panel 5 kann `context.target_app_ui` berücksichtigen, um zu prüfen, ob die spätere Ziel-App für die gewählte Boundary grundsätzlich passende Layer- oder Routentypen vorsieht. Panel 5 erzeugt daraus aber keine Darstellungspakete und keine Sensus-Core-Ausgabe.

### 0.9 Telco-Load-Abhängigkeit

Panel 5 kann `context.telco_load` berücksichtigen, sofern ein gültiger oder warnungsfreier Load-Batch vorhanden ist.

Panel 5 darf:

- Load-Gruppen räumlich grob gegen Boundary und Puffer vorfiltern,
- Load-Gruppen als Referenzen in `filtered_load_signal_refs` aufnehmen,
- räumliche Abdeckung und Aktualität grob ausweisen.

Panel 5 darf nicht:

- Load auf Kanten projizieren,
- Aufenthalt berechnen,
- Bewegungsauslastung berechnen,
- Staustellen klassifizieren,
- Routensegmente bewerten.

### 0.10 Trennung von Extraktion und Graphbau

Panel 5 extrahiert Daten, baut aber keinen SCIM-Arbeitsgraphen.

Es liefert:

- Boundary,
- Puffergeometrie,
- Roh-Wege oder normalisierte Wegsegmente,
- POI-Kandidaten,
- freigegebene POIs innerhalb des räumlichen Kontexts,
- Randanschlüsse,
- optional vorgefilterte Load-Referenzen,
- Extraktionsdiagnose.

Der Graph Builder im nächsten Panel entscheidet erst später, wie Linien in Knoten, Kanten, Shape-Punkte und routenrelevante Abschnitte zerlegt werden.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**Boundary und Extraktion**

Technischer Modulname:

```ts
BoundaryExtractionPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
createRepresentationBoundary()
importRepresentationBoundary()
validateBoundary()
calculateBoundaryBuffer()
extractScimSourceData()
validateExtractionResult()
applyBoundaryAndExtractionToContext()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/boundary-extraction/
  BoundaryExtractionPanel.tsx
  boundaryExtraction.types.ts
  boundaryExtraction.schema.ts
  boundaryExtraction.defaults.ts
  boundaryExtraction.mock.ts
  boundaryExtraction.validation.ts
  boundaryExtraction.service.ts
  boundaryExtraction.context.ts
  boundaryExtraction.leaflet.ts
  boundaryExtraction.test.ts
```

---

# 2. Zweck des Panels

Panel 5 erzeugt eine konkrete räumliche Arbeitsgrundlage für eine SCIM-Representation.

Es beantwortet für spätere Panels:

- Welche Representation wird gerade gebaut?
- Welche Boundary beschreibt den räumlichen Arbeitsbereich?
- Ist die Boundary geometrisch gültig?
- Welcher technische Puffer wird verwendet?
- Welche POIs, Wege, Randanschlüsse und optionalen Load-Referenzen liegen innerhalb von Boundary und Puffer?
- Ist das Extraktionsergebnis vollständig genug, um daraus einen SCIM-Arbeitsgraphen zu bauen?

Leitsatz:

> Panel 5 erzeugt den räumlichen Arbeitsraum und das erste Datenpaket für den SCIM-Graphbau.

---

# 3. Nicht-Ziele

Panel 5 darf nicht:

- System-Adjust-Grenzen ändern
- Regio-Content ändern oder POIs freigeben
- Ziel-App-UI-Profile ändern
- Telco-Load-Daten fachlich interpretieren
- Graphen bauen
- topologische Knoten final bestimmen
- Aufenthaltsbereiche berechnen
- Bewegungsauslastung berechnen
- Maskierungen berechnen
- Routenabschnitte bewerten
- Layer final komponieren
- Sensus-Core-Pakete erzeugen
- lokale User-Einstellungen anwenden
- Freigaben oder Exporte erzeugen

Panel 5 ist ein Raum- und Datenpanel, kein Engine-Berechnungspanel.

---

# 4. Fachliche Verantwortung

Panel 5 hat sechs fachliche Kernaufgaben.

## 4.1 Boundary erstellen oder importieren

Das Panel erlaubt:

- Polygon in Leaflet zeichnen,
- Rechteck in Leaflet zeichnen,
- GeoJSON-Geometrie importieren,
- vorhandene Boundary laden,
- Representation benennen,
- Boundary als Entwurf speichern.

## 4.2 Boundary validieren

Das Panel prüft:

- Geometrie vorhanden,
- Geometrietyp zulässig,
- Polygon geschlossen,
- keine Selbstüberschneidung,
- Fläche größer als Mindestfläche,
- Fläche kleiner als Maximalfläche, sofern System-Adjust dies vorgibt,
- Bounding Box berechenbar,
- Koordinaten plausibel,
- CRS beziehungsweise Koordinatensystem eindeutig.

## 4.3 Puffer festlegen

Das Panel berechnet oder übernimmt einen technischen Puffer um die Boundary.

Der Puffer verhindert, dass Randknoten, Randkanten, angrenzende POIs, kurze Alternativrouten oder relevante Load-Bezüge abgeschnitten werden.

Der Puffer kann entstehen aus:

- System-Adjust-Minimum,
- größtem relevantem POI-Aufenthaltsradius,
- regionalem Vergleichssaum,
- erwarteter Segmentlänge,
- räumlicher Signalungenauigkeit,
- manuell gesetztem Operatorwert innerhalb Systemgrenzen.

## 4.4 Daten extrahieren

Das Panel extrahiert innerhalb von Boundary plus Puffer:

- wanderrelevante Wegsegmente,
- POI-Kandidaten,
- freigegebene Regio-POIs,
- bestätigte POI-Radien,
- lokale Sperren und Hinweise,
- Randanschlüsse,
- optionale Load-Gruppen-Referenzen.

## 4.5 Extraktionsergebnis prüfen

Das Panel prüft:

- wurden Wege gefunden?
- wurden relevante POIs gefunden oder plausibel keine gefunden?
- wurden Boundary-Randanschlüsse erkannt?
- liegen freigegebene POIs außerhalb der Boundary, aber innerhalb des Puffers?
- fehlen Datenquellen?
- ist die Extraktion reproduzierbar?
- ist das Ergebnis ausreichend für den Graph Builder?

## 4.6 Boundary und Extraktion in Kontext schreiben

Nur wenn Boundary und Extraktion gültig sind, werden sie in den gemeinsamen SCIM-Kontext geschrieben.

---

# 5. Datenmodell

## 5.1 BoundaryState

```ts
export interface BoundaryState {
  representation_id: string;
  representation_name: string;
  source: BoundarySource;
  created_at: string;
  updated_at?: string;
  boundary_geometry: GeoJsonPolygonOrMultiPolygon;
  bbox: BBox;
  area_square_meters?: number;
  centroid?: GeoPoint;
  crs: CoordinateReferenceSystem;
  buffer_policy: BoundaryBufferPolicy;
  buffer_geometry?: GeoJsonPolygonOrMultiPolygon;
  validation: BoundaryValidationResult;
  status: BoundaryStatus;
}
```

## 5.2 BoundarySource

```ts
export type BoundarySource =
  | 'leaflet_draw_polygon'
  | 'leaflet_draw_rectangle'
  | 'geojson_import'
  | 'saved_boundary'
  | 'api'
  | 'mock';
```

## 5.3 BoundaryStatus

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

## 5.4 Geometrietypen

```ts
export type BBox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]

export interface CoordinateReferenceSystem {
  crs_id: 'EPSG:4326' | 'EPSG:3857' | 'custom';
  axis_order: 'lon_lat' | 'lat_lon' | 'xy';
  source?: string;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}
```

---

# 6. BufferPolicy

## 6.1 Typ

```ts
export interface BoundaryBufferPolicy {
  mode: BufferMode;
  buffer_meters: number;
  min_buffer_meters: number;
  max_buffer_meters: number;
  derived_from: BufferDerivationSource[];
  largest_relevant_poi_radius_meters?: number;
  comparison_margin_meters?: number;
  expected_segment_length_meters?: number;
  signal_spatial_uncertainty_meters?: number;
  manual_override_reason?: string;
  system_adjust_version: string;
}

export type BufferMode =
  | 'system_default'
  | 'dynamic'
  | 'regional_default'
  | 'manual_within_limits';

export type BufferDerivationSource =
  | 'system_adjust_minimum'
  | 'system_adjust_maximum'
  | 'largest_poi_radius'
  | 'comparison_margin'
  | 'expected_segment_length'
  | 'signal_uncertainty'
  | 'operator_override';
```

## 6.2 Pufferregeln

Pflichtregeln:

```ts
buffer_meters >= min_buffer_meters
buffer_meters <= max_buffer_meters
buffer_meters > 0
system_adjust_version must exist
```

Empfohlene dynamische Berechnung:

```ts
buffer_meters = clamp(
  max(
    system_min_buffer,
    largest_relevant_poi_radius_meters + comparison_margin_meters,
    expected_segment_length_meters,
    signal_spatial_uncertainty_meters
  ),
  min_buffer_meters,
  max_buffer_meters
);
```

Arbeitsannahme:

```txt
Der Puffer wird dynamisch berechnet. Er orientiert sich mindestens am größten relevanten POI-Aufenthaltsradius, am Vergleichssaum, an der erwarteten Segmentlänge und an der räumlichen Signalungenauigkeit. System-Adjust setzt Mindest- und Höchstwerte; Regio-Content kann regionale Hinweise liefern.
```

---

# 7. ExtractionState

## 7.1 Kernoutput

```ts
export interface ExtractionState {
  extraction_id: string;
  representation_id: string;
  source: ExtractionSource;
  extracted_at: string;
  boundary_ref: string;
  extraction_scope: ExtractionScope;
  data_sources: ExtractionDataSources;
  ways: ExtractedWay[];
  poi_candidates: ExtractedPoiCandidate[];
  approved_pois: ExtractedApprovedPoi[];
  regional_restrictions: ExtractedRegionalRestriction[];
  boundary_connections: BoundaryConnection[];
  filtered_load_signal_refs: FilteredLoadSignalRef[];
  extraction_summary: ExtractionSummary;
  validation: ExtractionValidationResult;
  status: ExtractionStatus;
}
```

## 7.2 Quelle

```ts
export type ExtractionSource =
  | 'mock'
  | 'osm_overpass'
  | 'local_geojson'
  | 'path_works_regio_dashboard'
  | 'aggregated_backend'
  | 'api';
```

## 7.3 Statuswerte

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

---

# 8. ExtractionScope

```ts
export interface ExtractionScope {
  boundary_bbox: BBox;
  buffered_bbox: BBox;
  boundary_geometry: GeoJsonPolygonOrMultiPolygon;
  buffer_geometry: GeoJsonPolygonOrMultiPolygon;
  include_boundary_intersections: boolean;
  include_buffer_objects: boolean;
  include_poi_candidates: boolean;
  include_approved_regio_pois: boolean;
  include_regional_restrictions: boolean;
  include_load_signal_refs: boolean;
}
```

Regeln:

- Die Boundary-Geometrie bleibt der fachliche Arbeitsbereich.
- Die Buffer-Geometrie ist technischer Such- und Stabilitätsraum.
- Objekte innerhalb des Puffers müssen kenntlich machen, ob sie innerhalb der Boundary oder nur im Puffer liegen.
- Randanschlüsse müssen bewusst erhalten bleiben, damit der Graph Builder später keine abgeschnittenen Wege erzeugt.

---

# 9. DataSources

```ts
export interface ExtractionDataSources {
  osm_ways?: DataSourceState;
  osm_pois?: DataSourceState;
  regio_content?: DataSourceState;
  telco_load?: DataSourceState;
  restrictions?: DataSourceState;
}

export interface DataSourceState {
  enabled: boolean;
  source_name: string;
  source_version?: string;
  loaded_at?: string;
  status: 'available' | 'missing' | 'disabled' | 'error' | 'partial';
  warning?: string;
}
```

---

# 10. ExtractedWay

```ts
export interface ExtractedWay {
  way_id: string;
  source_way_id?: string;
  source: 'osm' | 'regional_dataset' | 'manual' | 'mock';
  geometry: GeoJsonLineStringOrMultiLineString;
  tags?: Record<string, string>;
  way_class: WayClass;
  route_relevance: WayRouteRelevance;
  inside_boundary: boolean;
  inside_buffer_only: boolean;
  intersects_boundary: boolean;
  length_meters?: number;
  extraction_notes?: string[];
}

export type WayClass =
  | 'trail'
  | 'path'
  | 'footway'
  | 'track'
  | 'service'
  | 'road_crossing'
  | 'unknown';

export type WayRouteRelevance =
  | 'walking_relevant'
  | 'hiking_relevant'
  | 'connection_relevant'
  | 'boundary_connector'
  | 'not_relevant'
  | 'unknown';
```

## 10.1 Wanderrelevante Wege

Mindestens zu unterstützen:

```txt
highway=path
highway=footway
highway=track
highway=steps
route=hiking
route=foot
sac_scale=*
trail_visibility=*
foot=designated|yes|permissive
```

Nicht automatisch routenrelevant:

```txt
motorway
primary road ohne Fuß-/Wanderbezug
private Wege ohne Freigabe
rein technische Linien ohne Bewegungsfunktion
```

---

# 11. POI-Extraktion

## 11.1 ExtractedPoiCandidate

```ts
export interface ExtractedPoiCandidate {
  poi_id: string;
  source_poi_id?: string;
  source: 'osm' | 'regional_dataset' | 'manual' | 'mock';
  name?: string;
  category: RegioPoiCategory | 'unknown';
  candidate_class: 'safe_relevant' | 'possibly_relevant' | 'unknown';
  center: GeoPoint;
  tags?: Record<string, string>;
  suggested_radius_meters?: number;
  inside_boundary: boolean;
  inside_buffer_only: boolean;
  matched_regio_poi_id?: string;
}
```

## 11.2 ExtractedApprovedPoi

```ts
export interface ExtractedApprovedPoi {
  poi_id: string;
  regio_poi_ref: string;
  name?: string;
  category: RegioPoiCategory;
  center: GeoPoint;
  radius_meters: number;
  comparison_margin_meters?: number;
  effective_comparison_radius_meters?: number;
  inside_boundary: boolean;
  inside_buffer_only: boolean;
  intersects_boundary_buffer: boolean;
  system_adjust_version: string;
  regio_content_version: string;
}
```

Regeln:

- POI-Kandidaten erzeugen noch keine aktiven Aufenthaltsbereiche.
- Nur freigegebene Regio-POIs mit bestätigtem Radius werden als `approved_pois` in das Extraktionspaket aufgenommen.
- POIs im Puffer, deren Aufenthaltsradius oder Vergleichssaum in die Boundary hineinwirkt, müssen erhalten bleiben.
- Abgelehnte POIs dürfen höchstens als Diagnose erscheinen, nicht als aktive Extraktions-POIs.

---

# 12. Regionale Sperren und Hinweise

```ts
export interface ExtractedRegionalRestriction {
  restriction_id: string;
  source_ref: string;
  type: string;
  geometry: GeoJsonGeometry;
  route_effect: 'none' | 'warn' | 'degrade' | 'exclude';
  display_effect: 'operator_only' | 'sensus_core_hint' | 'sensus_core_warning' | 'hidden';
  status: 'approved' | 'draft' | 'expired' | 'disabled' | 'needs_review';
  inside_boundary: boolean;
  inside_buffer_only: boolean;
  intersects_boundary: boolean;
}
```

Regeln:

- Panel 5 übernimmt regionale Sperren und Hinweise nur räumlich.
- Panel 5 entscheidet nicht final über Routenwirkung.
- Abgelaufene oder nicht freigegebene Sperren können als Diagnose erhalten bleiben, dürfen aber nicht als aktive Route-Excludes interpretiert werden.

---

# 13. BoundaryConnection

```ts
export interface BoundaryConnection {
  connection_id: string;
  way_ref: string;
  connection_type: BoundaryConnectionType;
  location: GeoPoint;
  boundary_side?: 'north' | 'south' | 'east' | 'west' | 'unknown';
  inside_to_outside: boolean;
  requires_graph_continuation: boolean;
}

export type BoundaryConnectionType =
  | 'way_crosses_boundary'
  | 'way_ends_near_boundary'
  | 'connector_in_buffer'
  | 'poi_access_connector'
  | 'unknown';
```

Zweck:

Randanschlüsse sichern, dass der Graph Builder später erkennen kann, wo Wege nicht vollständig innerhalb der Boundary liegen und ob Pufferdaten für stabile Topologie nötig sind.

---

# 14. FilteredLoadSignalRef

```ts
export interface FilteredLoadSignalRef {
  signal_group_id: string;
  telco_load_batch_id: string;
  spatial_relation: 'inside_boundary' | 'inside_buffer' | 'intersects_boundary' | 'outside';
  intended_use: LoadIntendedUse[];
  usable_for_runtime: boolean;
  privacy_status: 'valid' | 'warning' | 'blocked';
}
```

Regeln:

- Panel 5 speichert nur Referenzen, keine Rohsignale.
- `privacy_status = blocked` darf nicht in spätere Runtime-Berechnung eingehen.
- Die fachliche Interpretation erfolgt erst im Load Processor.

---

# 15. ExtractionSummary

```ts
export interface ExtractionSummary {
  way_count: number;
  walking_relevant_way_count: number;
  poi_candidate_count: number;
  approved_poi_count: number;
  restriction_count: number;
  boundary_connection_count: number;
  filtered_load_signal_ref_count: number;
  inside_boundary_object_count: number;
  buffer_only_object_count: number;
  missing_source_count: number;
  warnings_count: number;
}
```

---

# 16. Validierung

## 16.1 BoundaryValidationResult

```ts
export interface BoundaryValidationResult {
  is_valid: boolean;
  errors: BoundaryExtractionIssue[];
  warnings: BoundaryExtractionIssue[];
  checked_at: string;
  checked_against_system_adjust_version?: string;
}
```

## 16.2 ExtractionValidationResult

```ts
export interface ExtractionValidationResult {
  is_valid: boolean;
  errors: BoundaryExtractionIssue[];
  warnings: BoundaryExtractionIssue[];
  checked_at: string;
  checked_against_boundary_id: string;
  checked_against_system_adjust_version?: string;
  checked_against_regio_content_version?: string;
  checked_against_telco_load_batch_id?: string;
}
```

## 16.3 Issue-Typ

```ts
export interface BoundaryExtractionIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}
```

## 16.4 Pflichtvalidierungen Boundary

```ts
context.system_adjust must exist
representation_id must exist
representation_name must exist
boundary_geometry must exist
boundary geometry type must be Polygon or MultiPolygon
boundary geometry must be valid
bbox must be computable
buffer_policy must exist
buffer_meters must be within allowed min/max
crs must be known
```

## 16.5 Pflichtvalidierungen Extraktion

```ts
boundary must be valid
extraction_id must exist
extraction_scope must exist
at least one data source must be available
ways must be an array
approved_pois must be an array
boundary_connections must be an array
no raw load payloads in extracted_data
all approved_pois must reference valid Regio-Content POIs
all approved_pois must have confirmed radius information
buffer-only objects must be flagged
```

---

# 17. Fehlercodes

```ts
BEXT_SYSTEM_ADJUST_MISSING
BEXT_SYSTEM_ADJUST_INVALID
BEXT_REPRESENTATION_ID_MISSING
BEXT_REPRESENTATION_NAME_MISSING
BEXT_BOUNDARY_GEOMETRY_MISSING
BEXT_BOUNDARY_GEOMETRY_INVALID
BEXT_BOUNDARY_TYPE_UNSUPPORTED
BEXT_BOUNDARY_SELF_INTERSECTION
BEXT_BOUNDARY_AREA_TOO_SMALL
BEXT_BOUNDARY_AREA_TOO_LARGE
BEXT_BBOX_INVALID
BEXT_CRS_UNKNOWN
BEXT_BUFFER_POLICY_MISSING
BEXT_BUFFER_OUT_OF_RANGE
BEXT_EXTRACTION_SCOPE_MISSING
BEXT_NO_DATA_SOURCE_AVAILABLE
BEXT_WAYS_MISSING
BEXT_NO_RELEVANT_WAYS_FOUND
BEXT_APPROVED_POI_WITHOUT_REGIO_REF
BEXT_APPROVED_POI_RADIUS_MISSING
BEXT_RAW_LOAD_PAYLOAD_FORBIDDEN
BEXT_PRIVACY_BLOCKED_LOAD_REF_INCLUDED
BEXT_CONTEXT_WRITE_FORBIDDEN
BEXT_EXTRACTION_RESULT_INVALID
```

---

# 18. Warncodes

```ts
BEXT_REGIO_CONTENT_MISSING
BEXT_TARGET_APP_UI_MISSING
BEXT_TELCO_LOAD_MISSING
BEXT_BOUNDARY_SMALL
BEXT_BOUNDARY_LARGE
BEXT_BUFFER_USING_SYSTEM_DEFAULT
BEXT_BUFFER_CLAMPED_TO_MAX
BEXT_BUFFER_CLAMPED_TO_MIN
BEXT_NO_POI_CANDIDATES_FOUND
BEXT_NO_APPROVED_POIS_FOUND
BEXT_POIS_ONLY_IN_BUFFER
BEXT_FEW_RELEVANT_WAYS_FOUND
BEXT_MANY_BUFFER_ONLY_OBJECTS
BEXT_BOUNDARY_CONNECTIONS_EXIST
BEXT_DATA_SOURCE_PARTIAL
BEXT_LOAD_REFS_ONLY_PARTIAL_COVERAGE
BEXT_EXTRACTION_HAS_WARNINGS
```

---

# 19. UI-Anforderungen

Panel 5 soll als eigenständiges Raum- und Datenpanel sichtbar bleiben.

## 19.1 Layout

Empfohlenes Layout:

```txt
┌────────────────────────────────────────────────────────────┐
│ Panel 5: Boundary und Extraktion                           │
├────────────────────────────────────────────────────────────┤
│ Representation auswählen / benennen                         │
│ Quelle: Leaflet Draw | GeoJSON Import | Mock | API          │
├────────────────────────────────────────────────────────────┤
│ Statuskarten                                                │
│ - Boundary                                                  │
│ - Puffer                                                    │
│ - Datenquellen                                              │
│ - Wege                                                      │
│ - POIs                                                      │
│ - Randanschlüsse                                            │
│ - Extraktionsvalidierung                                    │
├────────────────────────────────────────────────────────────┤
│ Tabs                                                        │
│ 1. Boundary zeichnen                                        │
│ 2. Boundary prüfen                                          │
│ 3. Puffer festlegen                                         │
│ 4. Daten extrahieren                                        │
│ 5. Extraktionsergebnis prüfen                               │
├────────────────────────────────────────────────────────────┤
│ Footer                                                      │
│ [Boundary speichern] [Boundary validieren]                  │
│ [Puffer berechnen] [Daten extrahieren] [In Kontext übernehmen]
└────────────────────────────────────────────────────────────┘
```

## 19.2 Tab 1: Boundary zeichnen

Zweck:

- Representation benennen
- Boundary zeichnen oder importieren
- Geometrie als Entwurf speichern

Felder:

```txt
Representation-ID
Representation-Name
Quelle
Zeichenmodus
GeoJSON-Import
Boundary-Geometrie
CRS
```

Aktionen:

```txt
Polygon zeichnen
Rechteck zeichnen
GeoJSON importieren
Boundary löschen
Boundary speichern
```

## 19.3 Tab 2: Boundary prüfen

Zweck:

- Geometrische und fachliche Gültigkeit prüfen

Felder:

```txt
Geometrietyp
Bounding Box
Fläche
Schwerpunkt
Selbstüberschneidung ja/nein
Koordinaten plausibel ja/nein
Boundary-Status
Fehler
Warnungen
```

Aktionen:

```txt
Boundary validieren
Fehler anzeigen
Auf Boundary zoomen
```

## 19.4 Tab 3: Puffer festlegen

Zweck:

- technischen Extraktionspuffer berechnen oder innerhalb Systemgrenzen manuell setzen

Felder:

```txt
Puffer-Modus
System-Minimum
System-Maximum
größter relevanter POI-Radius
Vergleichssaum
erwartete Segmentlänge
räumliche Signalungenauigkeit
berechneter Puffer
manuelle Begründung bei Override
```

Aktionen:

```txt
Puffer berechnen
Puffer manuell setzen
Puffer auf Karte anzeigen
Puffer validieren
```

## 19.5 Tab 4: Daten extrahieren

Zweck:

- Quellen auswählen und Extraktion ausführen

Felder:

```txt
OSM-Wege aktiv
OSM-POIs aktiv
Regio-Content aktiv
Sperren/Hinweise aktiv
Telco-Load-Referenzen aktiv
Boundary plus Puffer
Extraktionsstatus
```

Aktionen:

```txt
Datenquellen prüfen
Daten extrahieren
Extraktion abbrechen
Extraktion erneut ausführen
```

## 19.6 Tab 5: Extraktionsergebnis prüfen

Zweck:

- Ergebnisqualität prüfen und Übergabe an das nächste Panel ermöglichen

Felder:

```txt
Anzahl Wege
Anzahl wanderrelevante Wege
Anzahl POI-Kandidaten
Anzahl freigegebene POIs
Anzahl regionale Sperren/Hinweise
Anzahl Randanschlüsse
Anzahl Load-Referenzen
Boundary-only Objekte
Buffer-only Objekte
Fehlerliste
Warnliste
```

Aktionen:

```txt
Ergebnis validieren
Objekte auf Karte hervorheben
Fehlerliste öffnen
In Kontext übernehmen
Weiter zu Graph und Basislayer
```

## 19.7 UI-Zustände

```ts
export type BoundaryExtractionUiStatus =
  | 'idle'
  | 'boundary_draft'
  | 'boundary_validating'
  | 'boundary_ready'
  | 'buffer_ready'
  | 'extracting'
  | 'extraction_ready'
  | 'ready_for_context_apply'
  | 'blocked_by_errors';
```

## 19.8 Kontextübergabe

Die Übergabe darf nur erfolgen, wenn gilt:

```ts
boundary.validation.is_valid === true
extracted_data.validation.is_valid === true
boundary.status === 'boundary_valid' || boundary.status === 'boundary_warning'
extracted_data.status === 'extraction_valid' || extracted_data.status === 'extraction_warning'
```

Kontextänderung:

```ts
context.representation_id = boundary.representation_id;
context.boundary = boundary;
context.extracted_data = extractedData;
```

Alle anderen Kontextbereiche müssen unverändert bleiben.



# 20. Mock-Daten

```ts
export const mockBoundaryState: BoundaryState = {
  representation_id: 'rep_hochwab_nord_001',
  representation_name: 'Hochschwab Nord',
  source: 'mock',
  created_at: '2026-05-21T00:00:00.000Z',
  boundary_geometry: {
    type: 'Polygon',
    coordinates: [[
      [15.10, 47.60],
      [15.32, 47.60],
      [15.32, 47.74],
      [15.10, 47.74],
      [15.10, 47.60]
    ]]
  },
  bbox: [15.10, 47.60, 15.32, 47.74],
  area_square_meters: 231000000,
  centroid: {
    type: 'Point',
    coordinates: [15.21, 47.67]
  },
  crs: {
    crs_id: 'EPSG:4326',
    axis_order: 'lon_lat',
    source: 'leaflet_geojson'
  },
  buffer_policy: {
    mode: 'dynamic',
    buffer_meters: 575,
    min_buffer_meters: 100,
    max_buffer_meters: 1000,
    derived_from: [
      'system_adjust_minimum',
      'largest_poi_radius',
      'comparison_margin',
      'expected_segment_length',
      'signal_uncertainty'
    ],
    largest_relevant_poi_radius_meters: 500,
    comparison_margin_meters: 25,
    expected_segment_length_meters: 300,
    signal_spatial_uncertainty_meters: 25,
    system_adjust_version: 'sys_v1.0.0'
  },
  buffer_geometry: {
    type: 'Polygon',
    coordinates: [[
      [15.092, 47.595],
      [15.328, 47.595],
      [15.328, 47.745],
      [15.092, 47.745],
      [15.092, 47.595]
    ]]
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_system_adjust_version: 'sys_v1.0.0'
  },
  status: 'boundary_valid'
};

export const mockExtractionState: ExtractionState = {
  extraction_id: 'ext_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  source: 'mock',
  extracted_at: '2026-05-21T00:00:00.000Z',
  boundary_ref: 'rep_hochwab_nord_001',
  extraction_scope: {
    boundary_bbox: [15.10, 47.60, 15.32, 47.74],
    buffered_bbox: [15.092, 47.595, 15.328, 47.745],
    boundary_geometry: mockBoundaryState.boundary_geometry,
    buffer_geometry: mockBoundaryState.buffer_geometry!,
    include_boundary_intersections: true,
    include_buffer_objects: true,
    include_poi_candidates: true,
    include_approved_regio_pois: true,
    include_regional_restrictions: true,
    include_load_signal_refs: true
  },
  data_sources: {
    osm_ways: {
      enabled: true,
      source_name: 'mock_osm_ways',
      source_version: 'mock_1.0.0',
      loaded_at: '2026-05-21T00:00:00.000Z',
      status: 'available'
    },
    osm_pois: {
      enabled: true,
      source_name: 'mock_osm_pois',
      source_version: 'mock_1.0.0',
      loaded_at: '2026-05-21T00:00:00.000Z',
      status: 'available'
    },
    regio_content: {
      enabled: true,
      source_name: 'mock_regio_content',
      source_version: 'regio_v1.0.0',
      loaded_at: '2026-05-21T00:00:00.000Z',
      status: 'available'
    },
    telco_load: {
      enabled: true,
      source_name: 'mock_telco_load',
      source_version: 'load_001',
      loaded_at: '2026-05-21T00:00:00.000Z',
      status: 'available'
    }
  },
  ways: [
    {
      way_id: 'way_001',
      source_way_id: 'osm_way_001',
      source: 'osm',
      geometry: {
        type: 'LineString',
        coordinates: [
          [15.13, 47.62],
          [15.18, 47.65],
          [15.24, 47.69]
        ]
      },
      tags: {
        highway: 'path',
        sac_scale: 'mountain_hiking'
      },
      way_class: 'trail',
      route_relevance: 'hiking_relevant',
      inside_boundary: true,
      inside_buffer_only: false,
      intersects_boundary: false,
      length_meters: 7200
    },
    {
      way_id: 'way_002',
      source_way_id: 'osm_way_002',
      source: 'osm',
      geometry: {
        type: 'LineString',
        coordinates: [
          [15.09, 47.66],
          [15.11, 47.66],
          [15.16, 47.66]
        ]
      },
      tags: {
        highway: 'track',
        foot: 'yes'
      },
      way_class: 'track',
      route_relevance: 'boundary_connector',
      inside_boundary: false,
      inside_buffer_only: false,
      intersects_boundary: true,
      length_meters: 4100
    }
  ],
  poi_candidates: [
    {
      poi_id: 'poi_candidate_001',
      source_poi_id: 'osm_poi_001',
      source: 'osm',
      name: 'Mock Aussichtspunkt',
      category: 'viewpoint',
      candidate_class: 'safe_relevant',
      center: {
        type: 'Point',
        coordinates: [15.22, 47.65]
      },
      tags: {
        tourism: 'viewpoint'
      },
      suggested_radius_meters: 50,
      inside_boundary: true,
      inside_buffer_only: false,
      matched_regio_poi_id: 'regio_poi_001'
    }
  ],
  approved_pois: [
    {
      poi_id: 'poi_approved_001',
      regio_poi_ref: 'regio_poi_001',
      name: 'Mock Aussichtspunkt',
      category: 'viewpoint',
      center: {
        type: 'Point',
        coordinates: [15.22, 47.65]
      },
      radius_meters: 50,
      comparison_margin_meters: 25,
      effective_comparison_radius_meters: 75,
      inside_boundary: true,
      inside_buffer_only: false,
      intersects_boundary_buffer: true,
      system_adjust_version: 'sys_v1.0.0',
      regio_content_version: 'regio_v1.0.0'
    }
  ],
  regional_restrictions: [
    {
      restriction_id: 'restriction_001',
      source_ref: 'regio_restriction_001',
      type: 'warning',
      geometry: {
        type: 'LineString',
        coordinates: [
          [15.17, 47.64],
          [15.19, 47.65]
        ]
      },
      route_effect: 'warn',
      display_effect: 'sensus_core_warning',
      status: 'approved',
      inside_boundary: true,
      inside_buffer_only: false,
      intersects_boundary: false
    }
  ],
  boundary_connections: [
    {
      connection_id: 'bc_001',
      way_ref: 'way_002',
      connection_type: 'way_crosses_boundary',
      location: {
        type: 'Point',
        coordinates: [15.10, 47.66]
      },
      boundary_side: 'west',
      inside_to_outside: true,
      requires_graph_continuation: true
    }
  ],
  filtered_load_signal_refs: [
    {
      signal_group_id: 'sg_001',
      telco_load_batch_id: 'load_001',
      spatial_relation: 'inside_boundary',
      intended_use: ['movement_load_input', 'route_relevance_input'],
      usable_for_runtime: true,
      privacy_status: 'valid'
    }
  ],
  extraction_summary: {
    way_count: 2,
    walking_relevant_way_count: 2,
    poi_candidate_count: 1,
    approved_poi_count: 1,
    restriction_count: 1,
    boundary_connection_count: 1,
    filtered_load_signal_ref_count: 1,
    inside_boundary_object_count: 4,
    buffer_only_object_count: 0,
    missing_source_count: 0,
    warnings_count: 0
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_boundary_id: 'rep_hochwab_nord_001',
    checked_against_system_adjust_version: 'sys_v1.0.0',
    checked_against_regio_content_version: 'regio_v1.0.0',
    checked_against_telco_load_batch_id: 'load_001'
  },
  status: 'extraction_valid'
};
```

---

# 21. Übergabe an spätere Panels

Panel 5 schreibt folgende Kontextsegmente:

```json
{
  "representation_id": "rep_hochwab_nord_001",
  "boundary": {
    "representation_id": "rep_hochwab_nord_001",
    "representation_name": "Hochschwab Nord",
    "boundary_geometry": {},
    "bbox": [15.10, 47.60, 15.32, 47.74],
    "buffer_policy": {},
    "buffer_geometry": {},
    "status": "boundary_valid"
  },
  "extracted_data": {
    "extraction_id": "ext_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "ways": [],
    "poi_candidates": [],
    "approved_pois": [],
    "regional_restrictions": [],
    "boundary_connections": [],
    "filtered_load_signal_refs": [],
    "status": "extraction_valid"
  }
}
```

Direkte Abnehmer:

- Panel 6: Graph und Basislayer
- SCIM-Kontext-Validator
- Graph Builder
- Basis-Layer Composer
- Leaflet-Prüfung
- spätere POI-, Load- und Bewegungslogik
- spätere Routenbewertung

Wichtig:

Panel 5 übergibt noch keine Graphknoten, keine Graphkanten, keine Shape-Punkte, keine Aufenthaltsbereiche, keine Maskierung, keine Bewegungsauslastung und keine Routenabschnittsbewertung. Diese entstehen erst in späteren Panels.

---

# 22. Akzeptanzkriterien

## 22.1 Boundary-Erstellung

- Eine Boundary kann in Leaflet als Polygon gezeichnet werden.
- Eine Boundary kann in Leaflet als Rechteck gezeichnet werden.
- Eine Boundary kann aus gültigem GeoJSON importiert werden.
- Eine Representation-ID und ein Representation-Name werden erzeugt oder übernommen.
- Die Boundary wird als Entwurf gespeichert, bevor sie validiert wird.

## 22.2 Boundary-Validierung

- Fehlende Boundary-Geometrie erzeugt einen blockierenden Fehler.
- Nicht unterstützte Geometrietypen erzeugen einen blockierenden Fehler.
- Selbstüberschneidende Polygone erzeugen einen blockierenden Fehler.
- Eine Bounding Box wird korrekt berechnet.
- Fläche und Schwerpunkt werden berechnet, sofern Geometrie gültig ist.
- Unbekanntes CRS erzeugt einen blockierenden Fehler oder mindestens eine blockierende Warnung nach Projektstandard.

## 22.3 System-Adjust-Abhängigkeit

- Ohne gültiges `context.system_adjust` kann keine runtime-gültige Boundary-Extraktion übernommen werden.
- Boundary- und Pufferwerte werden gegen System-Adjust geprüft.
- System-Adjust-Grenzen werden nicht unterschritten.

## 22.4 Pufferlogik

- Ein dynamischer Puffer kann berechnet werden.
- Der Puffer berücksichtigt mindestens System-Minimum, POI-Radius, Vergleichssaum, Segmentlänge und Signalungenauigkeit, soweit vorhanden.
- Der Puffer wird auf System-Minimum und System-Maximum begrenzt.
- Manuelle Pufferwerte außerhalb der Systemgrenzen werden blockiert.
- Buffer-only-Objekte werden als solche markiert.

## 22.5 Datenextraktion

- Wanderrelevante Wege innerhalb Boundary plus Puffer werden extrahiert.
- POI-Kandidaten innerhalb Boundary plus Puffer werden extrahiert.
- Freigegebene Regio-POIs werden räumlich zugeordnet.
- POIs im Puffer, deren Radius oder Vergleichssaum in die Boundary hineinwirkt, bleiben erhalten.
- Randanschlüsse werden erkannt und als `boundary_connections` gespeichert.
- Regionale Sperren und Hinweise werden räumlich zugeordnet, aber nicht final routenbewertet.

## 22.6 Telco-Load-Referenzen

- Wenn `context.telco_load` vorhanden ist, werden nur Signalgruppen-Referenzen übernommen.
- Es werden keine Rohsignale, Geräte-IDs oder Einzeltraces in `extracted_data` gespeichert.
- Privacy-blocked Gruppen werden nicht als runtime-verwendbar markiert.
- Die fachliche Load-Projektion bleibt späteren Panels vorbehalten.

## 22.7 Extraktionsergebnis

- Das Extraktionsergebnis enthält `ways`, `poi_candidates`, `approved_pois`, `regional_restrictions`, `boundary_connections` und `extraction_summary`.
- Fehlende Datenquellen werden sichtbar als Warnung oder Fehler geführt.
- Ein Ergebnis ohne relevante Wege blockiert die Übergabe an den Graph Builder.
- Ein Ergebnis ohne POIs kann gültig sein, erzeugt aber eine Warnung.

## 22.8 Kontextübergabe

- Die Übergabe verändert ausschließlich `context.representation_id`, `context.boundary` und `context.extracted_data`.
- Kein anderer Kontextbereich wird überschrieben.
- Ungültige Boundary oder ungültige Extraktion blockiert die Übergabe.
- Warnungen erlauben die Übergabe nur, wenn keine blockierenden Fehler vorhanden sind.

## 22.9 UI

- Das Panel zeigt Boundary, Puffer, Datenquellen, Wege, POIs, Randanschlüsse und Extraktionsvalidierung getrennt an.
- Blockierende Fehler sind klar erkennbar.
- Warnungen sind klar erkennbar.
- Folgeaktionen sind gesperrt, solange Boundary oder Extraktion ungültig sind.
- Leaflet zeigt Boundary und Puffer visuell unterscheidbar an.

## 22.10 Tests

- Unit-Tests für Boundary-Validator vorhanden.
- Unit-Tests für Pufferberechnung vorhanden.
- Unit-Tests für Extraktionsvalidierung vorhanden.
- Unit-Tests für Kontextübergabe vorhanden.
- Unit-Tests für Verbot von Rohsignalübernahme vorhanden.
- Mock-Daten-Test vorhanden.

---

# 23. Testfälle

## 23.1 Gültiger Mock

Input:

```ts
mockBoundaryState
mockExtractionState
validSystemAdjust
validRegioContent
validTargetAppUi
validTelcoLoad
```

Erwartung:

```ts
boundary.validation.is_valid === true
extracted_data.validation.is_valid === true
boundary.status === 'boundary_valid'
extracted_data.status === 'extraction_valid'
```

## 23.2 System-Adjust fehlt

Input:

```ts
mockBoundaryState
mockExtractionState
systemAdjust = undefined
```

Erwartung:

```ts
errors includes BEXT_SYSTEM_ADJUST_MISSING
boundary.validation.is_valid === false OR extracted_data.validation.is_valid === false
applyBoundaryAndExtractionToContext throws
```

## 23.3 Boundary-Geometrie fehlt

Mutation:

```ts
boundary.boundary_geometry = undefined
```

Erwartung:

```ts
errors includes BEXT_BOUNDARY_GEOMETRY_MISSING
boundary.validation.is_valid === false
```

## 23.4 Nicht unterstützter Geometrietyp

Mutation:

```ts
boundary.boundary_geometry = { type: 'LineString', coordinates: [[15.1, 47.6], [15.2, 47.7]] }
```

Erwartung:

```ts
errors includes BEXT_BOUNDARY_TYPE_UNSUPPORTED
boundary.validation.is_valid === false
```

## 23.5 Puffer außerhalb Range

Mutation:

```ts
boundary.buffer_policy.buffer_meters = 99999
```

Erwartung:

```ts
errors includes BEXT_BUFFER_OUT_OF_RANGE
boundary.validation.is_valid === false
```

## 23.6 Keine relevante Wege gefunden

Mutation:

```ts
extracted_data.ways = []
extracted_data.extraction_summary.walking_relevant_way_count = 0
```

Erwartung:

```ts
errors includes BEXT_NO_RELEVANT_WAYS_FOUND
extracted_data.validation.is_valid === false
```

## 23.7 Freigegebener POI ohne Regio-Referenz

Mutation:

```ts
extracted_data.approved_pois[0].regio_poi_ref = ''
```

Erwartung:

```ts
errors includes BEXT_APPROVED_POI_WITHOUT_REGIO_REF
extracted_data.validation.is_valid === false
```

## 23.8 Freigegebener POI ohne Radius

Mutation:

```ts
extracted_data.approved_pois[0].radius_meters = undefined
```

Erwartung:

```ts
errors includes BEXT_APPROVED_POI_RADIUS_MISSING
extracted_data.validation.is_valid === false
```

## 23.9 Rohsignal im Extraktionspaket

Mutation:

```ts
extracted_data.raw_load_payload = [{ device_id: 'forbidden' }]
```

Erwartung:

```ts
errors includes BEXT_RAW_LOAD_PAYLOAD_FORBIDDEN
extracted_data.validation.is_valid === false
```

## 23.10 Privacy-blocked Load-Ref runtime-verwendbar

Mutation:

```ts
extracted_data.filtered_load_signal_refs[0].privacy_status = 'blocked'
extracted_data.filtered_load_signal_refs[0].usable_for_runtime = true
```

Erwartung:

```ts
errors includes BEXT_PRIVACY_BLOCKED_LOAD_REF_INCLUDED
extracted_data.validation.is_valid === false
```

## 23.11 Kontextschutz

Input:

```ts
const contextBefore = {
  system_adjust: validSystemAdjust,
  regio_content: validRegioContent,
  target_app_ui: validTargetAppUi,
  telco_load: validTelcoLoad,
  boundary: undefined,
  extracted_data: undefined,
  graph: { existing: true },
  route_model: { existing: true }
};
```

Aktion:

```ts
const contextAfter = applyBoundaryAndExtractionToContext(
  contextBefore,
  validBoundary,
  validExtraction
);
```

Erwartung:

```ts
contextAfter.representation_id === validBoundary.representation_id
contextAfter.boundary exists
contextAfter.extracted_data exists
contextAfter.system_adjust === contextBefore.system_adjust
contextAfter.regio_content === contextBefore.regio_content
contextAfter.target_app_ui === contextBefore.target_app_ui
contextAfter.telco_load === contextBefore.telco_load
contextAfter.graph === contextBefore.graph
contextAfter.route_model === contextBefore.route_model
```

---

# 24. Umsetzungshinweise für Codex/Claude

## 24.1 Erst headless bauen

Zuerst sollen Typen, Schema, Mock-Daten und Validierungslogik gebaut werden. Die UI kommt danach.

Reihenfolge:

```txt
1. boundaryExtraction.types.ts
2. boundaryExtraction.mock.ts
3. boundaryExtraction.validation.ts
4. boundaryExtraction.context.ts
5. boundaryExtraction.service.ts
6. boundaryExtraction.leaflet.ts
7. boundaryExtraction.test.ts
8. BoundaryExtractionPanel.tsx
```

## 24.2 Keine Fachlogik im UI-Container

Die React-Komponente darf nur anzeigen und Aktionen auslösen. Die Validierungs-, Puffer- und Extraktionslogik gehört in eigene Module.

Empfohlen:

```txt
boundaryExtraction.validation.ts  -> Validierung
boundaryExtraction.service.ts     -> Laden/Extrahieren/Normalisieren
boundaryExtraction.context.ts     -> Kontext-Apply
boundaryExtraction.leaflet.ts     -> Leaflet-spezifische Adapter
BoundaryExtractionPanel.tsx       -> UI
```

## 24.3 Leaflet entkoppeln

Leaflet darf nicht direkt das interne Datenmodell diktieren.

Stattdessen:

- Leaflet-Geometrie in stabiles GeoJSON normalisieren.
- CRS und Axis-Order eindeutig setzen.
- Zeichenzustand von validiertem Boundary-State trennen.
- Leaflet-Layer nur als UI-Ansicht behandeln.

## 24.4 Boundary und Extraktion trennen, aber gemeinsam ausspielen

Panel 5 enthält beide Schritte, aber intern sollten zwei Zustände existieren:

```ts
BoundaryState
ExtractionState
```

Grund:

- Boundary kann bereits gültig sein, während Extraktion noch fehlt.
- Extraktion darf nur mit gültiger Boundary laufen.
- Fehler müssen klar zuordenbar bleiben.

## 24.5 Puffer deterministisch bauen

Die Pufferberechnung muss reproduzierbar sein.

Empfehlung:

```ts
calculateBoundaryBuffer(boundary, systemAdjust, regioContent?, telcoLoad?): BoundaryBufferPolicy
```

Die Funktion darf keine UI-Zustände lesen und keine Kontextbereiche schreiben.

## 24.6 Extraktion mockbar halten

Die erste Umsetzung soll mit Mock-Daten funktionieren, bevor echte OSM-, API- oder Backend-Quellen angebunden werden.

Empfehlung:

```ts
extractScimSourceData(boundary, options, context): Promise<ExtractionState>
```

Dabei sollen Datenquellen austauschbar bleiben.

## 24.7 Keine Graphlogik vorwegnehmen

Panel 5 darf Linien extrahieren, aber nicht final in Knoten und Kanten zerlegen.

Erlaubt:

- Wege erfassen
- Randanschlüsse markieren
- Wegklassen grob normalisieren
- Route-Relevance als Vorfilter markieren

Nicht erlaubt:

- Graphknoten final bilden
- Shape-Knoten semantisch aufwerten
- routenrelevante Abschnitte berechnen
- Bewegungskanten bestimmen

## 24.8 Datenschutz bei Load-Referenzen

Wenn Telco-Load einbezogen wird, nur Referenzen speichern.

Nicht speichern:

- Geräte-IDs
- Rohsignal-Payloads
- exakte Traces
- nicht aggregierte Standortpunkte

## 24.9 Strikte Output-Stabilität

Der Output von Panel 5 ist ein Vertrag. Spätere Panels müssen sich darauf verlassen können.

Deshalb:

- stabile Feldnamen,
- `BoundaryState` und `ExtractionState` getrennt halten,
- Buffer-only-Objekte eindeutig markieren,
- Randanschlüsse immer explizit führen,
- keine Rohdaten einschleusen,
- keine Graphdaten vorwegnehmen.

---

# 25. Kompakter Codex-Auftrag für Panel 5

```text
Baue Panel 5: Boundary und Extraktion für die SCIM.

Kontext:
SCIM ist ein Gesamtsystem aus Input-Schicht, Validierung, SCIM-Engine, Graph- und Layer-Erzeugung, Sensus-Core-Paketierung, lokaler Anwendung und Freigabe. Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug, nicht die Engine. Sensus Core ist die SCIM am Endgerät. Alle Panels arbeiten auf einem gemeinsamen SCIM-Kontext.

Aufgabe:
Baue nur Panel 5. Das Panel erstellt oder importiert eine Representation-Boundary, validiert sie, berechnet einen technischen Puffer und extrahiert relevante Ausgangsdaten innerhalb Boundary plus Puffer. Verändere nur `context.representation_id`, `context.boundary` und `context.extracted_data`.

Das Panel darf lesen aus:
- `context.system_adjust`
- `context.regio_content`
- `context.target_app_ui`
- `context.telco_load`

Das Panel darf nicht schreiben in:
- `context.system_adjust`
- `context.regio_content`
- `context.target_app_ui`
- `context.telco_load`
- `context.graph`
- `context.poi_model`
- `context.load_model`
- `context.route_model`
- `context.layer_model`
- `context.sensus_core_package`
- `context.local_user_context`
- `context.view_state`
- `context.release`

Zweck:
Eine konkrete räumliche Arbeitsgrundlage für eine SCIM-Representation erzeugen und daraus ein erstes Extraktionspaket für den Graph Builder bereitstellen.

Nicht-Ziele:
Keine Änderung von System-Adjust, keine Regio-Content-Freigabe, keine Ziel-App-UI-Konfiguration, keine Telco-Load-Interpretation, kein Graphbau, keine Aufenthaltsberechnung, keine Bewegungsauslastung, keine Routenbewertung, kein Layer Composer, kein Sensus-Core-Export.

Erzeuge:
- TypeScript-Typen
- Mock-Daten
- Boundary-Validierung
- Pufferberechnung
- Extraktionsservice
- Kontext-Apply-Funktion
- Leaflet-Adapter
- React-Panel mit Tabs
- Unit-Tests

Tabs:
1. Boundary zeichnen
2. Boundary prüfen
3. Puffer festlegen
4. Daten extrahieren
5. Extraktionsergebnis prüfen

Output:
`BoundaryState` mit `representation_id`, `representation_name`, `boundary_geometry`, `bbox`, `crs`, `buffer_policy`, `buffer_geometry`, `validation`, `status`.

`ExtractionState` mit `extraction_id`, `representation_id`, `extraction_scope`, `data_sources`, `ways`, `poi_candidates`, `approved_pois`, `regional_restrictions`, `boundary_connections`, `filtered_load_signal_refs`, `extraction_summary`, `validation`, `status`.

Validierung:
Blockiere fehlenden oder ungültigen System-Adjust, fehlende Boundary-Geometrie, ungültige Geometrie, nicht unterstützte Geometrietypen, unbekanntes CRS, Puffer außerhalb Systemgrenzen, fehlende Datenquellen, fehlende relevante Wege, freigegebene POIs ohne Regio-Referenz oder Radius, Rohsignal-Payloads und privacy-blocked Load-Referenzen mit Runtime-Verwendung.

Akzeptanz:
Aus einer gültigen Boundary entsteht reproduzierbar ein Extraktionspaket mit Wegen, POI-Kandidaten, freigegebenen POIs, regionalen Sperren/Hinweisen, Randanschlüssen und optionalen Load-Referenzen. Die Übergabe verändert ausschließlich `representation_id`, `boundary` und `extracted_data`.
```

---

# 26. Kernaussage für Panel 5

> Panel 5 ist der räumliche Startpunkt der konkreten SCIM-Representation. Es zeichnet oder importiert eine Boundary, prüft sie, berechnet einen systemkonformen Puffer und extrahiert die relevanten Ausgangsdaten. Es baut noch keinen Graphen und bewertet noch keine Auslastung, sondern liefert das stabile Datenpaket, aus dem Panel 6 den Graph und den ersten Basislayer erzeugen kann.
