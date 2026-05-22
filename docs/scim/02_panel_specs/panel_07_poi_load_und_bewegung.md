# SCIM Panel 7 – POI, Load und Bewegung

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor den konkreten Panel-Auftrag. Sie stellt sicher, dass Panel 7 nicht als isolierte POI-Ansicht, Load-Karte oder Bewegungsberechnung gebaut wird, sondern als zweiter baubarer Engine-Block nach Graph und Basislayer.

### 0.1 SCIM-Gesamtsystem

SCIM ist ein Gesamtsystem aus:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokaler Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 7 liegt im rechnerischen SCIM-Kern. Es nimmt den validierten SCIM-Kontext, den Graphen und die vorgelagerten Inputs auf und berechnet daraus das POI-Modell, die Load-Projektion, die Aufenthaltslogik, die Bewegungsauslastung, Maskierungen und Staustellenindikatoren.

Panel 7 erzeugt noch keine finale Routenbewertung und kein Sensus-Core-Paket. Es liefert aber die entscheidende fachliche Grundlage für Panel 8: Routenbewertung und Routendarstellung.

### 0.2 Rollenklärung

**SCIM-Engine**  
Der rechnerische Kern. In Panel 7 findet die erste echte fachliche Auslastungsberechnung statt: POI-Bezug, Aufenthalt, Bewegung, Maskierung und optionale Staustellenindikatoren.

**Leaflet**  
Leaflet ist Prüf- und Darstellungswerkzeug. In Panel 7 kann Leaflet genutzt werden, um POI-Radien, Aufenthaltsbereiche, projizierte Load-Gruppen, maskierte Kanten, Bewegungskanten und Staustellenindikatoren visuell zu prüfen. Leaflet berechnet diese Objekte nicht.

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät beziehungsweise in der laufzeitnahen App-Representation. Panel 7 erzeugt noch kein Sensus-Core-Paket. Alle Ergebnisse müssen aber so klassifiziert sein, dass spätere Layer- und Paket-Composer sie datenschutzkonform reduzieren können.

**POI, Load und Bewegung**  
Panel 7 verbindet sechs fachlich eng gekoppelte Schritte:

- freigegebene POIs und Radien in den Graphen einhängen,
- Telco-/Runtime-Load auf Graph, POI-Radien und Kanten projizieren,
- Aufenthalt innerhalb bestätigter POI-Radien berechnen,
- Bewegung auf nicht maskierten Kanten berechnen,
- Aufenthalt gegen Bewegung maskieren,
- Staustellenindikatoren vorbereiten.

Leitsatz:

> Panel 7 entscheidet, welche Signale Aufenthalt sind, welche Signale Bewegung sind und welche Graphkanten deshalb für spätere Routenbewertung belastet, maskiert oder als Staustellenkandidat markiert werden.

---

## 0.3 Gemeinsamer SCIM-Kontext

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
  route_model?: unknown;
  layer_model?: unknown;
  sensus_core_package?: unknown;
  local_user_context?: unknown;
  view_state?: unknown;
  release?: unknown;
  status?: ScimGlobalStatus;
}
```

Panel 7 darf schreiben in:

```ts
context.poi_model
context.load_model
context.movement_model
context.masking_model
```

Panel 7 darf lesen aus:

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

Panel 7 darf nicht schreiben in:

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

---

## 0.4 Input-/Output-Prinzip

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

Panel 7 ist besonders wichtig, weil hier die Trennung zwischen Aufenthalt und Bewegung verbindlich umgesetzt wird. Wenn diese Trennung unsauber ist, werden Signale doppelt verwertet, Aufenthaltsbereiche falsch als Bewegung gezählt oder Routenabschnitte später falsch bewertet.

---

## 0.5 Datenschutzgrenze

Panel 7 darf keine Datenschutzgrenzen aufweichen. Es verarbeitet nur bereits aggregierte und validierte Load-Gruppen aus Panel 4 beziehungsweise vorgefilterte Load-Referenzen aus Panel 5.

Nicht erlaubt:

- Rohsignale übernehmen,
- Geräte-IDs speichern,
- Einzeltraces rekonstruieren,
- einzelne Standortpunkte als Nutzerbewegung interpretieren,
- zu kleine Signalgruppen als Aufenthalt oder Bewegung klassifizieren,
- Roh- oder Debugwerte als Sensus-Core-tauglich markieren,
- Load-Werte ohne Mindestaggregation in sichtbare Layer vorbereiten.

Panel 7 darf intern technische Operator- und Debugdiagnosen erzeugen, aber diese müssen strikt von späteren Sensus-Core-Kandidaten getrennt bleiben.

---

## 0.6 System-Adjust-Vorrang

Panel 7 ist abhängig von `context.system_adjust`.

Ohne gültigen System-Adjust-Stand dürfen keine runtime-gültigen POI-, Load-, Bewegungs- oder Maskierungsmodelle entstehen.

System-Adjust begrenzt für Panel 7 insbesondere:

- Mindestaggregation,
- Mindestanzahl unterschiedlicher Geräte,
- Mindestanzahl Signale,
- Aufenthaltsklassifizierungsgrenzen,
- Bewegungslast-Grenzwerte,
- räumliche Mindestauflösung,
- maximale Signalgültigkeit,
- Vergleichssaum,
- POI-Radiusbereiche,
- Feature Flags für Aufenthalt, Bewegung, Staustellen und Debug-Layer.

---

## 0.7 Regio-Content-Abhängigkeit

Panel 7 ist fachlich stark abhängig von `context.regio_content`.

Regio-Content liefert:

- freigegebene POIs,
- bestätigte POI-Radien,
- Vergleichssäume,
- regionale Aufenthaltsparameter,
- regionale Bewegungslast-Grenzwerte,
- regionale Sperren und Hinweise,
- optionale regionale Staustellenprüfungen.

Panel 7 darf Regio-Content nicht verändern. Es darf freigegebene POIs und Radien in den Graphen einhängen und daraus Aufenthaltsbereiche ableiten.

Grundregel:

> Ein Aufenthalt darf nur entstehen, wenn eine aggregierte Load-Kumulation einem regional freigegebenen POI innerhalb eines bestätigten POI-Radius zugeordnet werden kann.

---

## 0.8 Telco-Load-Abhängigkeit

Panel 7 ist direkt abhängig von `context.telco_load`, sofern Load-Berechnung aktiv sein soll.

Panel 7 darf:

- gültige Load-Gruppen auf POI-Radien, Aufenthaltsbereiche und Graphkanten projizieren,
- ungültige, veraltete oder privacy-blocked Gruppen ausschließen,
- Signale nach intendierter Nutzung unterscheiden,
- Signale als Aufenthaltsinput, Bewegungsinput oder Staustellenkandidat vorbereiten.

Panel 7 darf nicht:

- ungültige Load-Gruppen reaktivieren,
- Datenschutzprüfungen aus Panel 4 überschreiben,
- Rohsignale verwenden,
- Einzelsignale rekonstruieren,
- Signale doppelt als Aufenthalt und Bewegung verwerten.

---

## 0.9 Graph-Abhängigkeit

Panel 7 ist direkt abhängig von `context.graph`.

Erforderlich sind:

- gültiger Graph,
- Knoten,
- Kanten,
- Shape-Punkte,
- vorbereitete Abschnittskandidaten,
- Kandidaten für Bewegungslast,
- Kandidaten für Aufenthaltsmaskierung,
- Boundary-Relationen,
- POI- oder Segmentreferenzen, soweit vorhanden.

Ohne gültigen Graph kann Panel 7 keine gültige Load-Projektion, keine Bewegungskanten und keine Maskierung erzeugen.

---

## 0.10 Trennung von Aufenthalt und Bewegung

Zentrales Prinzip:

> Aufenthalt maskiert Bewegung.

Das bedeutet:

- Signale innerhalb bestätigter POI-Radien können Aufenthalt werden.
- Aufenthaltssignale dürfen nicht zusätzlich als Bewegung gewertet werden.
- Kanten oder Kantenabschnitte innerhalb aktiver Aufenthaltsbereiche werden maskiert.
- Bewegungsauslastung wird nur auf nicht maskierten Kanten berechnet.
- Maskierung ist fachlich wirksam, aber geometrisch nachvollziehbar zu dokumentieren.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**POI, Load und Bewegung**

Technischer Modulname:

```ts
PoiLoadMovementPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
buildPoiModel()
validatePoiModel()
projectLoadToGraph()
validateLoadProjection()
calculateStayLoads()
calculateMovementLoads()
buildMaskingModel()
calculateJamIndicators()
validatePoiLoadMovementResult()
applyPoiLoadMovementToContext()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/poi-load-movement/
  PoiLoadMovementPanel.tsx
  poiLoadMovement.types.ts
  poiLoadMovement.schema.ts
  poiLoadMovement.defaults.ts
  poiLoadMovement.mock.ts
  poiLoadMovement.validation.ts
  poiLoadMovement.poiModel.ts
  poiLoadMovement.loadProjection.ts
  poiLoadMovement.stayLogic.ts
  poiLoadMovement.movementLogic.ts
  poiLoadMovement.masking.ts
  poiLoadMovement.jamIndicators.ts
  poiLoadMovement.context.ts
  poiLoadMovement.leaflet.ts
  poiLoadMovement.test.ts
```

---

# 2. Zweck des Panels

Panel 7 erzeugt aus Graph, freigegebenen POIs und validierten Load-Daten ein berechnetes Modell für Aufenthalt, Bewegung, Maskierung und Staustellenindikatoren.

Es beantwortet für spätere Panels:

- Welche POIs sind im Graph aktiv?
- Welche bestätigten POI-Radien erzeugen potenzielle Aufenthaltsbereiche?
- Welche Load-Gruppen können auf POIs, Radien oder Kanten projiziert werden?
- Welche Load-Gruppen sind Aufenthalt?
- Welche Load-Gruppen sind Bewegung?
- Welche Kanten werden durch Aufenthalt maskiert?
- Welche Kanten bleiben als Bewegungskanten verwendbar?
- Welche Bewegungsauslastung liegt je Kante vor?
- Welche Staustellenindikatoren entstehen aus Stillstand, Dichte oder Bewegungsabbruch?
- Welche Ergebnisse können später in Routenabschnitte verdichtet werden?

Leitsatz:

> Panel 7 erzeugt die berechnete Auslastungsgrundlage für spätere Routenbewertung, Layer-Komposition und Sensus-Core-Ausgabe.

---

# 3. Nicht-Ziele

Panel 7 darf nicht:

- System-Adjust-Grenzen ändern,
- Regio-Content ändern oder POIs freigeben,
- Ziel-App-UI-Profile ändern,
- Telco-Load-Batches ändern,
- Boundary oder Extraktion ändern,
- Graphknoten oder Graphkanten strukturell neu erzeugen,
- Routenabschnitte final bewerten,
- Routenvorschläge erzeugen,
- finale Leaflet-Routenlayer erzeugen,
- Sensus-Core-Pakete erzeugen,
- lokale User-Einstellungen anwenden,
- Freigaben oder Exporte erzeugen.

Panel 7 ist ein Berechnungspanel für POI-, Load-, Aufenthalts-, Bewegungs- und Maskierungslogik. Die Routenbewertung folgt in Panel 8.

---

# 4. Fachliche Verantwortung

Panel 7 hat sechs fachliche Kernaufgaben.

## 4.1 POI-Modell erzeugen

Panel 7 hängt freigegebene POIs und bestätigte Radien an den Graphen.

Dabei werden:

- nur freigegebene POIs berücksichtigt,
- nur bestätigte Radien verwendet,
- POIs räumlich Graphknoten, Kanten oder Segmenten zugeordnet,
- potenzielle Aufenthaltsbereiche erzeugt,
- Vergleichssäume dokumentiert,
- nicht freigegebene oder abgelehnte POIs ausgeschlossen.

## 4.2 Load auf Graph und POI-Modell projizieren

Panel 7 projiziert gültige Load-Gruppen auf:

- POI-Radien,
- Vergleichssäume,
- Kanten,
- Kantenabschnitte,
- Aufenthaltsbereichskandidaten,
- Bewegungskantenkandidaten,
- Staustellenkandidaten.

Ungültige, veraltete oder privacy-blocked Signalgruppen werden nicht verarbeitet.

## 4.3 Aufenthalt berechnen

Panel 7 klassifiziert Aufenthalt nur dann, wenn:

- der POI freigegeben ist,
- der POI-Radius bestätigt ist,
- die Load-Gruppe gültig ist,
- die Load-Gruppe innerhalb des POI-Radius oder innerhalb zulässiger Toleranz liegt,
- Mindestaggregation erfüllt ist,
- Stillstands- oder Aufenthaltsindikatoren plausibel sind,
- regionale und systemweite Schwellen eingehalten werden.

## 4.4 Bewegung berechnen

Panel 7 berechnet Bewegungsauslastung nur auf Kanten, die:

- nicht durch Aufenthalt maskiert sind,
- als Bewegungskandidaten im Graph markiert sind,
- gültige Load-Projektionen besitzen,
- Mindestaggregation erfüllen,
- nicht durch Datenschutz oder Verfall blockiert sind.

## 4.5 Maskierung erzeugen

Panel 7 erzeugt ein Maskierungsmodell.

Das Maskierungsmodell dokumentiert:

- welche Kanten oder Kantenabschnitte durch Aufenthalt betroffen sind,
- welcher POI die Maskierung auslöst,
- welche Load-Gruppen durch Aufenthalt verbraucht wurden,
- welche Kanten für Bewegung ausgeschlossen oder reduziert werden,
- ob eine Teilsegment-Maskierung oder Vollkanten-Maskierung angewendet wurde.

## 4.6 Staustellenindikatoren vorbereiten

Panel 7 kann Staustellenindikatoren erzeugen, wenn Feature Flags und Datenqualität dies erlauben.

Staustellenindikatoren sind keine finalen Routensperren. Sie sind vorbereitete Hinweise für spätere Routenbewertung und Layer-Komposition.

---

# 5. Datenmodell

## 5.1 PoiModelState

```ts
export interface PoiModelState {
  poi_model_id: string;
  representation_id: string;
  graph_id: string;
  regio_content_version: string;
  created_at: string;
  active_pois: ActivePoi[];
  stay_area_candidates: StayAreaCandidate[];
  poi_edge_links: PoiEdgeLink[];
  poi_model_summary: PoiModelSummary;
  validation: PoiModelValidationResult;
  status: PoiModelStatus;
}
```

## 5.2 PoiModelStatus

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

## 5.3 ActivePoi

```ts
export interface ActivePoi {
  active_poi_id: string;
  regio_poi_id: string;
  name?: string;
  category: RegioPoiCategory;
  center: GeoPoint;
  radius_meters: number;
  comparison_margin_meters: number;
  effective_comparison_radius_meters: number;
  linked_node_ids: string[];
  linked_edge_ids: string[];
  inside_boundary: boolean;
  inside_buffer_only: boolean;
  activation_status: 'active_for_stay_logic' | 'active_reference_only' | 'blocked';
  block_reason?: string;
  system_adjust_version: string;
  regio_content_version: string;
}
```

## 5.4 StayAreaCandidate

```ts
export interface StayAreaCandidate {
  stay_area_candidate_id: string;
  active_poi_id: string;
  geometry: GeoJsonPolygonOrMultiPolygon;
  radius_meters: number;
  comparison_geometry?: GeoJsonPolygonOrMultiPolygon;
  comparison_margin_meters: number;
  candidate_edge_ids: string[];
  candidate_node_ids: string[];
  candidate_for_masking: boolean;
  status: 'candidate' | 'ready_for_load_projection' | 'blocked';
}
```

## 5.5 PoiEdgeLink

```ts
export interface PoiEdgeLink {
  poi_edge_link_id: string;
  active_poi_id: string;
  edge_id: string;
  relation:
    | 'edge_inside_radius'
    | 'edge_intersects_radius'
    | 'edge_touches_radius'
    | 'edge_inside_comparison_margin'
    | 'edge_nearby_reference_only';
  distance_meters?: number;
  affected_length_meters?: number;
  candidate_for_stay_masking: boolean;
}
```

---

# 6. LoadProjectionState

## 6.1 Kernoutput

```ts
export interface LoadProjectionState {
  load_projection_id: string;
  representation_id: string;
  graph_id: string;
  poi_model_id: string;
  telco_load_batch_id: string;
  created_at: string;
  projected_loads: ProjectedLoadGroup[];
  invalid_projection_groups: InvalidLoadProjectionGroup[];
  load_projection_summary: LoadProjectionSummary;
  validation: LoadProjectionValidationResult;
  status: LoadProjectionStatus;
}
```

## 6.2 LoadProjectionStatus

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

## 6.3 ProjectedLoadGroup

```ts
export interface ProjectedLoadGroup {
  projected_load_id: string;
  signal_group_id: string;
  telco_load_batch_id: string;
  projection_target_type:
    | 'poi_radius'
    | 'stay_area_candidate'
    | 'graph_edge'
    | 'edge_segment'
    | 'route_section_candidate'
    | 'jam_candidate_area';
  target_id: string;
  projection_relation:
    | 'inside'
    | 'intersects'
    | 'nearest_within_tolerance'
    | 'overlaps_comparison_margin'
    | 'outside_rejected';
  projected_geometry?: GeoJsonGeometry;
  approximate_center?: GeoPoint;
  metrics: LoadSignalMetrics;
  quality: LoadSignalQuality;
  privacy: LoadSignalPrivacyState;
  validity: LoadSignalValidityState;
  intended_use: LoadIntendedUse[];
  consumed_by?: 'stay_logic' | 'movement_logic' | 'jam_logic';
  consumption_status: 'available' | 'consumed' | 'excluded';
}
```

## 6.4 InvalidLoadProjectionGroup

```ts
export interface InvalidLoadProjectionGroup {
  signal_group_id: string;
  reason:
    | 'privacy_blocked'
    | 'expired'
    | 'quality_unusable'
    | 'outside_graph_scope'
    | 'below_min_aggregation'
    | 'no_projection_target'
    | 'unknown_signal_type';
  blocking: boolean;
  message: string;
}
```

---

# 7. StayLoadState

## 7.1 StayLoadResult

```ts
export interface StayLoadResult {
  stay_load_id: string;
  active_poi_id: string;
  stay_area_candidate_id: string;
  consumed_projected_load_ids: string[];
  stay_score: number;
  density_score: number;
  stillness_ratio?: number;
  comparison_density_score?: number;
  stay_density_ratio?: number;
  classification: StayClassification;
  affected_edge_ids: string[];
  affected_node_ids: string[];
  confidence_score: number;
  status: StayLoadStatus;
}
```

## 7.2 StayClassification

```ts
export type StayClassification =
  | 'confirmed_stay'
  | 'probable_stay'
  | 'stay_candidate'
  | 'not_stay'
  | 'blocked_by_privacy'
  | 'blocked_by_quality'
  | 'blocked_by_missing_poi_release';
```

## 7.3 StayLoadStatus

```ts
export type StayLoadStatus =
  | 'stay_valid'
  | 'stay_warning'
  | 'stay_invalid'
  | 'stay_blocked';
```

---

# 8. MovementModelState

## 8.1 Kernoutput

```ts
export interface MovementModelState {
  movement_model_id: string;
  representation_id: string;
  graph_id: string;
  load_projection_id: string;
  created_at: string;
  stay_loads: StayLoadResult[];
  movement_loads: MovementLoadResult[];
  jam_indicators: JamIndicator[];
  movement_summary: MovementModelSummary;
  validation: MovementModelValidationResult;
  status: MovementModelStatus;
}
```

## 8.2 MovementModelStatus

```ts
export type MovementModelStatus =
  | 'not_calculated'
  | 'calculating'
  | 'movement_model_created_unvalidated'
  | 'validating'
  | 'movement_model_valid'
  | 'movement_model_warning'
  | 'movement_model_invalid'
  | 'movement_model_error';
```

## 8.3 MovementLoadResult

```ts
export interface MovementLoadResult {
  movement_load_id: string;
  edge_id: string;
  consumed_projected_load_ids: string[];
  movement_score: number;
  density_score: number;
  normalized_load_score: number;
  movement_ratio?: number;
  confidence_score: number;
  masked_by_stay: boolean;
  partially_masked: boolean;
  usable_for_route_evaluation: boolean;
  load_class: MovementLoadClass;
  status: MovementLoadStatus;
}
```

## 8.4 MovementLoadClass

```ts
export type MovementLoadClass =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'unknown';
```

## 8.5 MovementLoadStatus

```ts
export type MovementLoadStatus =
  | 'movement_load_valid'
  | 'movement_load_warning'
  | 'movement_load_invalid'
  | 'movement_load_blocked';
```

---

# 9. MaskingModelState

## 9.1 Kernoutput

```ts
export interface MaskingModelState {
  masking_model_id: string;
  representation_id: string;
  graph_id: string;
  poi_model_id: string;
  movement_model_id: string;
  created_at: string;
  masked_edges: MaskedEdge[];
  signal_consumption: SignalConsumptionRecord[];
  masking_summary: MaskingSummary;
  validation: MaskingValidationResult;
  status: MaskingModelStatus;
}
```

## 9.2 MaskingModelStatus

```ts
export type MaskingModelStatus =
  | 'not_created'
  | 'masking'
  | 'masking_created_unvalidated'
  | 'validating'
  | 'masking_valid'
  | 'masking_warning'
  | 'masking_invalid'
  | 'masking_error';
```

## 9.3 MaskedEdge

```ts
export interface MaskedEdge {
  masked_edge_id: string;
  edge_id: string;
  active_poi_id: string;
  stay_load_id: string;
  mask_type: 'full_edge' | 'partial_edge_segment' | 'node_to_shape_point' | 'shape_point_to_shape_point';
  affected_length_meters?: number;
  geometry?: GeoJsonGeometry;
  movement_excluded: boolean;
  route_evaluation_note: 'exclude_from_movement_load' | 'reduce_weight' | 'stay_context_only';
  status: 'masked' | 'partially_masked' | 'mask_warning' | 'mask_invalid';
}
```

## 9.4 SignalConsumptionRecord

```ts
export interface SignalConsumptionRecord {
  signal_group_id: string;
  projected_load_id: string;
  consumed_by: 'stay_logic' | 'movement_logic' | 'jam_logic' | 'excluded';
  target_id?: string;
  duplicate_use_prevented: boolean;
  note?: string;
}
```

---

# 10. JamIndicator

## 10.1 Typ

```ts
export interface JamIndicator {
  jam_indicator_id: string;
  source_projected_load_ids: string[];
  related_edge_ids: string[];
  related_poi_ids?: string[];
  indicator_type:
    | 'slow_movement_cluster'
    | 'stillness_on_path'
    | 'high_density_low_movement'
    | 'mixed_stay_movement_unclear';
  jam_score: number;
  confidence_score: number;
  status:
    | 'jam_candidate'
    | 'probable_jam'
    | 'confirmed_jam_indicator'
    | 'blocked_by_privacy'
    | 'blocked_by_quality';
  route_relevance: 'none' | 'warning_only' | 'degrade_candidate' | 'exclude_candidate';
}
```

Staustellenindikatoren dürfen in Panel 7 nur vorbereitet werden. Die eigentliche Routenwirkung wird in Panel 8 entschieden.

---

# 11. UI-Struktur

Panel 7 besteht aus sechs Tabs:

1. **POIs und Radien**
2. **Load-Projektion**
3. **Aufenthalt berechnen**
4. **Bewegung berechnen**
5. **Maskierung prüfen**
6. **Staustellenindikatoren**

## 11.1 Tab 1 – POIs und Radien

Zweck:

- freigegebene POIs anzeigen,
- bestätigte Radien anzeigen,
- Graphbezug prüfen,
- Aufenthaltsbereichskandidaten vorbereiten.

Anzeigen:

- POI-ID,
- Name,
- Kategorie,
- Radius,
- Vergleichssaum,
- verlinkte Knoten,
- verlinkte Kanten,
- Status.

Aktionen:

- POI-Modell bauen,
- POI-Modell validieren,
- POI-Radius-Overlay in Leaflet anzeigen.

## 11.2 Tab 2 – Load-Projektion

Zweck:

- gültige Load-Gruppen auf POI-Radien, Kanten und Kandidatenbereiche projizieren,
- ungültige Gruppen sichtbar ausschließen.

Anzeigen:

- Signalgruppen,
- Zielobjekt,
- Projektionsrelation,
- Qualität,
- Datenschutzstatus,
- Gültigkeit,
- Verwendungszweck.

Aktionen:

- Load-Projektion ausführen,
- Projektion validieren,
- ungültige Gruppen anzeigen.

## 11.3 Tab 3 – Aufenthalt berechnen

Zweck:

- Aufenthalt aus gültigen POI-bezogenen Load-Projektionen berechnen.

Anzeigen:

- Aufenthaltsbereich,
- POI,
- Stay-Score,
- Dichte,
- Stillstandsanteil,
- Klassifikation,
- betroffene Kanten.

Aktionen:

- Aufenthalt berechnen,
- Aufenthalt validieren,
- Aufenthaltsbereiche in Leaflet anzeigen.

## 11.4 Tab 4 – Bewegung berechnen

Zweck:

- Bewegungsauslastung auf nicht maskierten Kanten berechnen.

Anzeigen:

- Kante,
- Bewegungsscore,
- Dichte,
- Load-Klasse,
- Maskierungsstatus,
- Route-Evaluation-Verwendbarkeit.

Aktionen:

- Bewegung berechnen,
- Bewegung validieren,
- Bewegungskanten in Leaflet anzeigen.

## 11.5 Tab 5 – Maskierung prüfen

Zweck:

- sicherstellen, dass Aufenthalt Bewegung korrekt maskiert.

Anzeigen:

- maskierte Kanten,
- Maskentyp,
- auslösender POI,
- auslösende Stay-Load,
- betroffene Länge,
- Signalverbrauch.

Aktionen:

- Maskierungsmodell erzeugen,
- Doppelverwertung prüfen,
- Masken-Overlay anzeigen.

## 11.6 Tab 6 – Staustellenindikatoren

Zweck:

- mögliche Staustellen oder Bewegungskonflikte sichtbar machen.

Anzeigen:

- Indikatortyp,
- Score,
- betroffene Kanten,
- betroffene POIs,
- Routenkontext,
- Status.

Aktionen:

- Staustellenindikatoren berechnen,
- Kandidaten validieren,
- Übergabe an Routenbewertung vorbereiten.

---

# 12. Validierung

## 12.1 Pflichtvalidierungen POI-Modell

```ts
system_adjust must exist and be valid
regio_content must exist and be valid or explicit no_poi_mode must be active
graph must exist and be valid
active_pois must only include approved regio POIs
active POIs must have confirmed radius
radius must be inside System-Adjust allowed range
comparison margin must be inside System-Adjust allowed range
active POIs must have geometry center
stay_area_candidates must reference active_pois
poi_edge_links must reference existing graph edges
```

## 12.2 Pflichtvalidierungen Load-Projektion

```ts
telco_load must exist and be valid unless loadless_mode is explicitly enabled
projected_loads must reference valid signal groups
projected_loads must reference existing graph edges or active POIs
privacy_blocked groups must not be projected as valid
expired groups must not be projected as runtime-valid
below_min_aggregation groups must be invalid
projection_target_type must match intended_use
```

## 12.3 Pflichtvalidierungen Aufenthalt

```ts
stay_loads must reference active POIs
stay_loads must reference stay_area_candidates
stay_loads must consume valid projected loads only
confirmed_stay requires min signals for stay classification
confirmed_stay requires approved POI and confirmed radius
stay_score must be between 0 and 1
confidence_score must be between 0 and 1
blocked_by_privacy cannot produce mask
blocked_by_quality cannot produce mask
```

## 12.4 Pflichtvalidierungen Bewegung

```ts
movement_loads must reference existing graph edges
movement_loads must consume valid projected loads only
movement_score must be between 0 and 1
normalized_load_score must be between 0 and 1
masked edges must not be fully used for movement load
partially masked edges must document affected segment
usable_for_route_evaluation false if movement load invalid or blocked
```

## 12.5 Pflichtvalidierungen Maskierung

```ts
masked_edges must reference existing graph edges
masked_edges must reference valid stay_loads
masked_edges must reference active POIs
full_edge mask excludes movement on that edge
partial mask must include geometry or affected length
signal consumption must prevent duplicate use
same projected load must not be consumed by both stay and movement
```

## 12.6 Pflichtvalidierungen Staustellenindikatoren

```ts
jam_indicators must only use valid projected loads
jam_score must be between 0 and 1
confidence_score must be between 0 and 1
blocked indicators must not influence route relevance
route_relevance is advisory only in Panel 7
final route effect must be decided in Panel 8
```

---

# 13. Fehlercodes

```ts
export type PoiLoadMovementErrorCode =
  | 'PLM_SYSTEM_ADJUST_MISSING'
  | 'PLM_SYSTEM_ADJUST_INVALID'
  | 'PLM_GRAPH_MISSING'
  | 'PLM_GRAPH_INVALID'
  | 'PLM_REGIO_CONTENT_MISSING'
  | 'PLM_NO_APPROVED_POIS'
  | 'PLM_POI_RADIUS_NOT_CONFIRMED'
  | 'PLM_POI_RADIUS_OUT_OF_RANGE'
  | 'PLM_COMPARISON_MARGIN_OUT_OF_RANGE'
  | 'PLM_POI_EDGE_REF_MISSING'
  | 'PLM_TELCO_LOAD_MISSING'
  | 'PLM_TELCO_LOAD_INVALID'
  | 'PLM_SIGNAL_PRIVACY_BLOCKED'
  | 'PLM_SIGNAL_EXPIRED'
  | 'PLM_SIGNAL_BELOW_MIN_AGGREGATION'
  | 'PLM_LOAD_PROJECTION_TARGET_MISSING'
  | 'PLM_STAY_WITHOUT_APPROVED_POI'
  | 'PLM_STAY_SIGNAL_NOT_IN_RADIUS'
  | 'PLM_STAY_SCORE_OUT_OF_RANGE'
  | 'PLM_MOVEMENT_EDGE_MISSING'
  | 'PLM_MOVEMENT_ON_FULLY_MASKED_EDGE'
  | 'PLM_DUPLICATE_SIGNAL_CONSUMPTION'
  | 'PLM_MASK_EDGE_REF_MISSING'
  | 'PLM_MASK_WITHOUT_VALID_STAY'
  | 'PLM_JAM_INDICATOR_INVALID_SCORE';
```

---

# 14. Statuslogik

Panel 7 ist nur dann vollständig gültig, wenn alle vier Kontextsegmente gültig sind:

```ts
context.poi_model.status === 'poi_model_valid'
context.load_model.status === 'loads_projected'
context.movement_model.status === 'movement_model_valid'
context.masking_model.status === 'masking_valid'
```

Warnungsmodus ist zulässig, wenn:

- keine blockierenden Fehler vorliegen,
- einzelne POIs fehlen, aber Graph und Load weiter verwendbar sind,
- einzelne Signalgruppen ausgeschlossen wurden,
- Staustellenindikatoren unsicher sind,
- Teilmaskierungen nicht exakt geometrisch berechnet werden konnten, aber sicher konservativ dokumentiert sind.

Ungültig ist Panel 7, wenn:

- System-Adjust fehlt oder ungültig ist,
- Graph fehlt oder ungültig ist,
- Load-Daten privacy-blocked sind,
- bestätigte POI-Radien fehlen,
- dieselbe Load-Gruppe doppelt als Aufenthalt und Bewegung verbraucht wird,
- vollständig maskierte Kanten weiter als Bewegungskanten bewertet werden.

---

# 15. Kontextübergabe

Panel 7 schreibt folgende Kontextsegmente:

```json
{
  "poi_model": {
    "poi_model_id": "poi_model_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "active_pois": [],
    "stay_area_candidates": [],
    "poi_edge_links": [],
    "status": "poi_model_valid"
  },
  "load_model": {
    "load_projection_id": "load_proj_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "projected_loads": [],
    "invalid_projection_groups": [],
    "status": "loads_projected"
  },
  "movement_model": {
    "movement_model_id": "movement_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "stay_loads": [],
    "movement_loads": [],
    "jam_indicators": [],
    "status": "movement_model_valid"
  },
  "masking_model": {
    "masking_model_id": "masking_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "masked_edges": [],
    "signal_consumption": [],
    "status": "masking_valid"
  }
}
```

Direkte Abnehmer:

- Panel 8: Routenbewertung und Routendarstellung,
- Routenabschnitts-Bewertung,
- Routen-Layer Composer,
- Leaflet-Routenprüfung,
- spätere Sensus-Core-Paketierung.

Wichtig:

Panel 7 übergibt noch keine final bewerteten `route_sections`, keine finalen Routenvorschläge und kein Sensus-Core-Paket. Diese entstehen erst in Panel 8 und späteren Panels.

---

# 16. Leaflet-Prüfung

Panel 7 kann folgende Overlays für die Operatorprüfung erzeugen:

```txt
active_pois_overlay
poi_radius_overlay
comparison_margin_overlay
projected_load_overlay
stay_area_overlay
movement_edge_overlay
masked_edge_overlay
jam_indicator_overlay
```

Regeln:

- Operator-Overlays dürfen technische IDs enthalten.
- Sensus-Core-Kandidaten dürfen keine Rohsignale, Geräteinformationen oder Debugdaten enthalten.
- Load-Gruppen dürfen nur aggregiert und reduziert dargestellt werden.
- Vollmaskierte Kanten müssen visuell klar von Bewegungskanten unterscheidbar sein.
- Teilmaskierungen müssen zumindest als betroffener Kantenabschnitt oder konservative Maskenzone prüfbar sein.

---

# 17. Umsetzungshinweise für Codex/Claude

## 17.1 Erst headless bauen

Zuerst sollen Typen, Schema, Mock-Daten und Validierungslogik gebaut werden. Die UI kommt danach.

Reihenfolge:

```txt
1. poiLoadMovement.types.ts
2. poiLoadMovement.mock.ts
3. poiLoadMovement.validation.ts
4. poiLoadMovement.poiModel.ts
5. poiLoadMovement.loadProjection.ts
6. poiLoadMovement.stayLogic.ts
7. poiLoadMovement.movementLogic.ts
8. poiLoadMovement.masking.ts
9. poiLoadMovement.jamIndicators.ts
10. poiLoadMovement.context.ts
11. poiLoadMovement.test.ts
12. PoiLoadMovementPanel.tsx
```

## 17.2 Keine Fachlogik im UI-Container

Die React-Komponente darf nur anzeigen und Aktionen auslösen. Die Fachlogik gehört in reine Funktionen und Services.

## 17.3 Signalverbrauch strikt modellieren

Jede verwendete Load-Gruppe muss exakt einen Verbrauchspfad haben:

```txt
stay_logic
movement_logic
jam_logic
excluded
```

Doppelverwertung ist ein blockierender Fehler.

## 17.4 Aufenthalt vor Bewegung berechnen

Die technische Reihenfolge ist verbindlich:

```txt
POI-Modell bauen
Load projizieren
Aufenthalt berechnen
Maskierung erzeugen
Bewegung auf nicht maskierten Kanten berechnen
Staustellenindikatoren vorbereiten
Kontext schreiben
```

Bewegung darf nicht vor Aufenthaltsmaskierung final bewertet werden.

## 17.5 Maskierung konservativ behandeln

Wenn eine Teilsegment-Maskierung geometrisch nicht exakt möglich ist, soll das System konservativ maskieren oder eine Warnung erzeugen. Es darf nicht riskieren, Aufenthaltssignale als Bewegung zu zählen.

---

# 18. Kompakter Codex-Auftrag für Panel 7

```text
Baue Panel 7: POI, Load und Bewegung für die SCIM.

Panel 7 liest context.system_adjust, context.regio_content, context.telco_load, context.boundary, context.extracted_data, context.scim_context und context.graph. Es schreibt ausschließlich context.poi_model, context.load_model, context.movement_model und context.masking_model.

Baue zuerst headless:
- poiLoadMovement.types.ts
- poiLoadMovement.mock.ts
- poiLoadMovement.validation.ts
- poiLoadMovement.poiModel.ts
- poiLoadMovement.loadProjection.ts
- poiLoadMovement.stayLogic.ts
- poiLoadMovement.movementLogic.ts
- poiLoadMovement.masking.ts
- poiLoadMovement.jamIndicators.ts
- poiLoadMovement.context.ts
- poiLoadMovement.test.ts

Danach baue PoiLoadMovementPanel.tsx mit sechs Tabs:
1. POIs und Radien
2. Load-Projektion
3. Aufenthalt berechnen
4. Bewegung berechnen
5. Maskierung prüfen
6. Staustellenindikatoren

Wichtig:
- Nur freigegebene Regio-POIs mit bestätigtem Radius dürfen aktive Aufenthaltsbereiche erzeugen.
- Nur gültige, aggregierte, nicht abgelaufene und privacy-konforme Load-Gruppen dürfen verarbeitet werden.
- Aufenthalt wird vor Bewegung berechnet.
- Aufenthalt maskiert Bewegung.
- Dieselbe Load-Gruppe darf nie doppelt als Aufenthalt und Bewegung verbraucht werden.
- Vollständig maskierte Kanten dürfen nicht als Bewegungskanten bewertet werden.
- Staustellenindikatoren sind nur vorbereitende Hinweise für Panel 8 und keine finalen Routensperren.
- Panel 7 erzeugt keine finalen Routenabschnitte, keine Routenvorschläge und kein Sensus-Core-Paket.
```

---

# 19. Kernaussage für Panel 7

> Panel 7 ist der fachliche Auslastungskern der SCIM: Es verbindet freigegebene POIs, bestätigte Radien, validierte Load-Gruppen und den SCIM-Graphen zu Aufenthalt, Bewegung, Maskierung und Staustellenindikatoren. Seine wichtigste Regel lautet: Aufenthalt maskiert Bewegung, und kein Signal darf doppelt verwertet werden.


# 20. Mock-Daten

```ts
export const mockPoiModelState: PoiModelState = {
  poi_model_id: 'poi_model_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  graph_id: 'graph_hochwab_nord_001',
  regio_content_version: 'regio_v1.0.0',
  created_at: '2026-05-21T00:00:00.000Z',
  active_pois: [
    {
      active_poi_id: 'active_poi_001',
      regio_poi_id: 'poi_approved_001',
      name: 'Mock Aussichtspunkt',
      category: 'viewpoint',
      center: {
        type: 'Point',
        coordinates: [15.22, 47.65]
      },
      radius_meters: 50,
      comparison_margin_meters: 25,
      effective_comparison_radius_meters: 75,
      linked_node_ids: ['node_way_001_mid_semantic'],
      linked_edge_ids: ['edge_way_001_002'],
      inside_boundary: true,
      inside_buffer_only: false,
      activation_status: 'active_for_stay_logic',
      system_adjust_version: 'sys_v1.0.0',
      regio_content_version: 'regio_v1.0.0'
    }
  ],
  stay_area_candidates: [
    {
      stay_area_candidate_id: 'stay_area_candidate_001',
      active_poi_id: 'active_poi_001',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.2193, 47.6496],
          [15.2207, 47.6496],
          [15.2207, 47.6504],
          [15.2193, 47.6504],
          [15.2193, 47.6496]
        ]]
      },
      radius_meters: 50,
      comparison_geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.2190, 47.6494],
          [15.2210, 47.6494],
          [15.2210, 47.6506],
          [15.2190, 47.6506],
          [15.2190, 47.6494]
        ]]
      },
      comparison_margin_meters: 25,
      candidate_edge_ids: ['edge_way_001_002'],
      candidate_node_ids: ['node_way_001_mid_semantic'],
      candidate_for_masking: true,
      status: 'ready_for_load_projection'
    }
  ],
  poi_edge_links: [
    {
      poi_edge_link_id: 'poi_edge_link_001',
      active_poi_id: 'active_poi_001',
      edge_id: 'edge_way_001_002',
      relation: 'edge_intersects_radius',
      distance_meters: 12,
      affected_length_meters: 120,
      candidate_for_stay_masking: true
    }
  ],
  poi_model_summary: {
    active_poi_count: 1,
    stay_area_candidate_count: 1,
    poi_edge_link_count: 1,
    blocked_poi_count: 0,
    warning_count: 0,
    error_count: 0
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_graph_id: 'graph_hochwab_nord_001',
    checked_against_regio_content_version: 'regio_v1.0.0',
    checked_against_system_adjust_version: 'sys_v1.0.0'
  },
  status: 'poi_model_valid'
};

export const mockLoadProjectionState: LoadProjectionState = {
  load_projection_id: 'load_proj_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  graph_id: 'graph_hochwab_nord_001',
  poi_model_id: 'poi_model_hochwab_nord_001',
  telco_load_batch_id: 'load_001',
  created_at: '2026-05-21T00:00:00.000Z',
  projected_loads: [
    {
      projected_load_id: 'pl_001',
      signal_group_id: 'sg_002',
      telco_load_batch_id: 'load_001',
      projection_target_type: 'stay_area_candidate',
      target_id: 'stay_area_candidate_001',
      projection_relation: 'inside',
      approximate_center: {
        type: 'Point',
        coordinates: [15.225, 47.651]
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
      intended_use: ['stay_classification_input'],
      consumed_by: 'stay_logic',
      consumption_status: 'consumed'
    },
    {
      projected_load_id: 'pl_002',
      signal_group_id: 'sg_001',
      telco_load_batch_id: 'load_001',
      projection_target_type: 'graph_edge',
      target_id: 'edge_way_001_001',
      projection_relation: 'nearest_within_tolerance',
      approximate_center: {
        type: 'Point',
        coordinates: [15.214, 47.642]
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
      intended_use: ['movement_load_input', 'route_relevance_input'],
      consumed_by: 'movement_logic',
      consumption_status: 'consumed'
    }
  ],
  invalid_projection_groups: [],
  load_projection_summary: {
    projected_group_count: 2,
    invalid_group_count: 0,
    stay_projection_count: 1,
    movement_projection_count: 1,
    jam_candidate_projection_count: 0,
    privacy_blocked_count: 0,
    expired_count: 0,
    warning_count: 0,
    error_count: 0
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_telco_load_batch_id: 'load_001',
    checked_against_graph_id: 'graph_hochwab_nord_001',
    checked_against_poi_model_id: 'poi_model_hochwab_nord_001'
  },
  status: 'loads_projected'
};

export const mockMovementModelState: MovementModelState = {
  movement_model_id: 'movement_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  graph_id: 'graph_hochwab_nord_001',
  load_projection_id: 'load_proj_hochwab_nord_001',
  created_at: '2026-05-21T00:00:00.000Z',
  stay_loads: [
    {
      stay_load_id: 'stay_load_001',
      active_poi_id: 'active_poi_001',
      stay_area_candidate_id: 'stay_area_candidate_001',
      consumed_projected_load_ids: ['pl_001'],
      stay_score: 0.74,
      density_score: 0.77,
      stillness_ratio: 0.82,
      comparison_density_score: 0.42,
      stay_density_ratio: 1.83,
      classification: 'confirmed_stay',
      affected_edge_ids: ['edge_way_001_002'],
      affected_node_ids: ['node_way_001_mid_semantic'],
      confidence_score: 0.86,
      status: 'stay_valid'
    }
  ],
  movement_loads: [
    {
      movement_load_id: 'movement_load_001',
      edge_id: 'edge_way_001_001',
      consumed_projected_load_ids: ['pl_002'],
      movement_score: 0.58,
      density_score: 0.62,
      normalized_load_score: 0.58,
      movement_ratio: 0.74,
      confidence_score: 0.82,
      masked_by_stay: false,
      partially_masked: false,
      usable_for_route_evaluation: true,
      load_class: 'medium',
      status: 'movement_load_valid'
    },
    {
      movement_load_id: 'movement_load_002',
      edge_id: 'edge_way_001_002',
      consumed_projected_load_ids: [],
      movement_score: 0,
      density_score: 0,
      normalized_load_score: 0,
      confidence_score: 0,
      masked_by_stay: true,
      partially_masked: true,
      usable_for_route_evaluation: false,
      load_class: 'unknown',
      status: 'movement_load_blocked'
    }
  ],
  jam_indicators: [
    {
      jam_indicator_id: 'jam_candidate_001',
      source_projected_load_ids: ['pl_001'],
      related_edge_ids: ['edge_way_001_002'],
      related_poi_ids: ['active_poi_001'],
      indicator_type: 'mixed_stay_movement_unclear',
      jam_score: 0.41,
      confidence_score: 0.55,
      status: 'jam_candidate',
      route_relevance: 'warning_only'
    }
  ],
  movement_summary: {
    stay_load_count: 1,
    confirmed_stay_count: 1,
    movement_load_count: 2,
    valid_movement_edge_count: 1,
    masked_movement_edge_count: 1,
    jam_indicator_count: 1,
    warning_count: 0,
    error_count: 0
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_load_projection_id: 'load_proj_hochwab_nord_001',
    checked_against_graph_id: 'graph_hochwab_nord_001'
  },
  status: 'movement_model_valid'
};

export const mockMaskingModelState: MaskingModelState = {
  masking_model_id: 'masking_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  graph_id: 'graph_hochwab_nord_001',
  poi_model_id: 'poi_model_hochwab_nord_001',
  movement_model_id: 'movement_hochwab_nord_001',
  created_at: '2026-05-21T00:00:00.000Z',
  masked_edges: [
    {
      masked_edge_id: 'masked_edge_001',
      edge_id: 'edge_way_001_002',
      active_poi_id: 'active_poi_001',
      stay_load_id: 'stay_load_001',
      mask_type: 'partial_edge_segment',
      affected_length_meters: 120,
      geometry: {
        type: 'LineString',
        coordinates: [
          [15.18, 47.65],
          [15.19, 47.656]
        ]
      },
      movement_excluded: true,
      route_evaluation_note: 'exclude_from_movement_load',
      status: 'partially_masked'
    }
  ],
  signal_consumption: [
    {
      signal_group_id: 'sg_002',
      projected_load_id: 'pl_001',
      consumed_by: 'stay_logic',
      target_id: 'stay_load_001',
      duplicate_use_prevented: true,
      note: 'Signal group used for confirmed stay and excluded from movement calculation.'
    },
    {
      signal_group_id: 'sg_001',
      projected_load_id: 'pl_002',
      consumed_by: 'movement_logic',
      target_id: 'movement_load_001',
      duplicate_use_prevented: true,
      note: 'Signal group used for movement load on unmasked edge.'
    }
  ],
  masking_summary: {
    masked_edge_count: 1,
    fully_masked_edge_count: 0,
    partially_masked_edge_count: 1,
    consumed_signal_count: 2,
    duplicate_consumption_blocked_count: 0,
    warning_count: 0,
    error_count: 0
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_movement_model_id: 'movement_hochwab_nord_001',
    checked_against_poi_model_id: 'poi_model_hochwab_nord_001'
  },
  status: 'masking_valid'
};
```

Zusätzliche Hilfstypen für Mock und Tests:

```ts
export interface PoiModelSummary {
  active_poi_count: number;
  stay_area_candidate_count: number;
  poi_edge_link_count: number;
  blocked_poi_count: number;
  warning_count: number;
  error_count: number;
}

export interface LoadProjectionSummary {
  projected_group_count: number;
  invalid_group_count: number;
  stay_projection_count: number;
  movement_projection_count: number;
  jam_candidate_projection_count: number;
  privacy_blocked_count: number;
  expired_count: number;
  warning_count: number;
  error_count: number;
}

export interface MovementModelSummary {
  stay_load_count: number;
  confirmed_stay_count: number;
  movement_load_count: number;
  valid_movement_edge_count: number;
  masked_movement_edge_count: number;
  jam_indicator_count: number;
  warning_count: number;
  error_count: number;
}

export interface MaskingSummary {
  masked_edge_count: number;
  fully_masked_edge_count: number;
  partially_masked_edge_count: number;
  consumed_signal_count: number;
  duplicate_consumption_blocked_count: number;
  warning_count: number;
  error_count: number;
}
```

---

# 21. Übergabe an spätere Panels

Panel 7 schreibt folgende Kontextsegmente:

```json
{
  "poi_model": {
    "poi_model_id": "poi_model_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "regio_content_version": "regio_v1.0.0",
    "active_pois": [],
    "stay_area_candidates": [],
    "poi_edge_links": [],
    "status": "poi_model_valid"
  },
  "load_model": {
    "load_projection_id": "load_proj_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "poi_model_id": "poi_model_hochwab_nord_001",
    "telco_load_batch_id": "load_001",
    "projected_loads": [],
    "invalid_projection_groups": [],
    "status": "loads_projected"
  },
  "movement_model": {
    "movement_model_id": "movement_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "load_projection_id": "load_proj_hochwab_nord_001",
    "stay_loads": [],
    "movement_loads": [],
    "jam_indicators": [],
    "status": "movement_model_valid"
  },
  "masking_model": {
    "masking_model_id": "masking_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "poi_model_id": "poi_model_hochwab_nord_001",
    "movement_model_id": "movement_hochwab_nord_001",
    "masked_edges": [],
    "signal_consumption": [],
    "status": "masking_valid"
  }
}
```

Direkte Abnehmer:

- Panel 8: Routenbewertung und Routendarstellung
- Routenabschnitts-Bewertung
- Routen-Layer Composer
- Leaflet-Routenprüfung
- spätere Layer-Komposition
- spätere Sensus-Core-Paketierung
- spätere Endgeräte-Darstellung

Wichtig:

Panel 7 übergibt noch keine finalen Routenabschnittsbewertungen, keine finalen Routenvorschläge, keinen finalen Routenlayer und kein Sensus-Core-Paket. Diese entstehen erst in Panel 8 und den nachfolgenden Panels.

Panel 7 liefert aber die fachliche Grundlage, auf der Panel 8 entscheiden kann:

- welche Kanten Bewegungsauslastung tragen,
- welche Kanten durch Aufenthalt maskiert sind,
- welche Aufenthaltsbereiche einen Routenabschnitt berühren,
- welche Staustellenindikatoren routenrelevant sein könnten,
- welche Signalgruppen bereits verbraucht oder ausgeschlossen wurden.

---

# 22. Akzeptanzkriterien

## 22.1 POI-Modell

- Das Panel kann ein POI-Modell aus gültigem Graph und gültigem Regio-Content erzeugen.
- Nur freigegebene POIs mit bestätigtem Radius werden als aktive POIs übernommen.
- Abgelehnte, deaktivierte oder pending POIs erzeugen keine aktiven Aufenthaltsbereiche.
- Jeder aktive POI besitzt Zentrum, Radius, Vergleichssaum, System-Adjust-Version und Regio-Content-Version.
- Jeder aktive POI wird Graphknoten, Graphkanten oder Segmenten zugeordnet.
- POI-Radien außerhalb der System-Adjust-Range erzeugen blockierende Fehler.
- Vergleichssäume außerhalb der System-Adjust-Range erzeugen blockierende Fehler.
- POI-Edge-Links referenzieren existierende Graphkanten.

## 22.2 Aufenthaltsbereichskandidaten

- Für jeden aktiven POI kann ein Aufenthaltsbereichskandidat erzeugt werden.
- Aufenthaltsbereichskandidaten referenzieren einen aktiven POI.
- Radiusgeometrie und Vergleichsgeometrie sind geometrisch gültig.
- Betroffene Kanten oder Knoten werden dokumentiert.
- Kandidaten ohne bestätigten POI-Radius werden blockiert.
- Kandidaten außerhalb des Graphraums werden gewarnt oder blockiert, je nach Systemgrenze.

## 22.3 Load-Projektion

- Nur gültige Load-Gruppen aus `context.telco_load` werden verarbeitet.
- Privacy-blocked Load-Gruppen werden ausgeschlossen.
- Abgelaufene Load-Gruppen werden ausgeschlossen oder gemäß Verfallsregel markiert.
- Load-Gruppen unter Mindestaggregation werden ausgeschlossen.
- Jede projizierte Load-Gruppe referenziert ein gültiges Zielobjekt.
- Projektionsrelationen werden nachvollziehbar gespeichert.
- Ungültige Projektionsgruppen werden mit Grund dokumentiert.

## 22.4 Aufenthalt

- Aufenthalt wird nur innerhalb bestätigter POI-Radien oder zulässiger Toleranz berechnet.
- Aufenthalt braucht einen freigegebenen POI.
- Aufenthalt braucht gültige, aggregierte und privacy-konforme Load-Gruppen.
- Stillstandsindikatoren und Dichtewerte werden berücksichtigt, soweit vorhanden.
- `stay_score`, `density_score` und `confidence_score` liegen zwischen 0 und 1.
- Aufenthaltsklassifizierung wird klar gesetzt: confirmed, probable, candidate, not_stay oder blocked.
- Blockierte Aufenthalte erzeugen keine Maskierung.

## 22.5 Bewegung

- Bewegung wird nur auf nicht vollständig maskierten Graphkanten berechnet.
- Bewegungskanten referenzieren existierende Graphkanten.
- Bewegung braucht gültige, aggregierte und privacy-konforme Load-Gruppen.
- `movement_score`, `density_score`, `normalized_load_score` und `confidence_score` liegen zwischen 0 und 1.
- Vollständig maskierte Kanten erhalten keine gültige Bewegungsauslastung.
- Teilmaskierte Kanten dokumentieren den betroffenen Abschnitt.
- Bewegungslast wird für spätere Routenbewertung als verwendbar oder nicht verwendbar markiert.

## 22.6 Maskierung

- Aufenthalt maskiert Bewegung.
- Maskierte Kanten referenzieren gültige Graphkanten.
- Maskierte Kanten referenzieren gültige Stay-Loads.
- Maskierte Kanten referenzieren aktive POIs.
- Vollmaskierung und Teilmaskierung werden unterschieden.
- Teilmaskierungen besitzen Geometrie oder betroffene Länge.
- Eine vollständig maskierte Kante wird nicht als Bewegungskante bewertet.
- Signalverbrauch verhindert Doppelverwertung.

## 22.7 Signalverbrauch

- Jede verarbeitete Load-Gruppe erhält genau einen Verbrauchspfad.
- Zulässige Verbrauchspfade sind `stay_logic`, `movement_logic`, `jam_logic` oder `excluded`.
- Dieselbe Load-Gruppe darf nicht gleichzeitig für Aufenthalt und Bewegung verbraucht werden.
- Doppelverwertung erzeugt einen blockierenden Fehler.
- Ausgeschlossene Load-Gruppen werden mit Grund dokumentiert.

## 22.8 Staustellenindikatoren

- Staustellenindikatoren werden nur erzeugt, wenn Feature Flag und Datenqualität dies erlauben.
- Staustellenindikatoren referenzieren gültige Projected Loads und Graphkanten.
- `jam_score` und `confidence_score` liegen zwischen 0 und 1.
- Privacy-blocked oder quality-blocked Indikatoren wirken nicht routenrelevant.
- Staustellenindikatoren sind in Panel 7 nur vorbereitende Hinweise.
- Finale Routenwirkung erfolgt erst in Panel 8.

## 22.9 Kontextübergabe

- Die Übergabe verändert ausschließlich `context.poi_model`, `context.load_model`, `context.movement_model` und `context.masking_model`.
- Kein vorgelagertes Kontextsegment wird überschrieben.
- Ungültige Teilmodelle blockieren die Übergabe oder setzen das Panel in einen Warn-/Fehlerstatus.
- Die Übergabe an Panel 8 ist nur möglich, wenn POI-Modell, Load-Projektion, Bewegungsmodell und Maskierungsmodell konsistent sind.

## 22.10 UI

- Das Panel zeigt POIs/Radien, Load-Projektion, Aufenthalt, Bewegung, Maskierung und Staustellenindikatoren getrennt an.
- Blockierende Fehler sind klar erkennbar.
- Warnungen sind klar erkennbar.
- Leaflet-Overlays können für POI-Radien, Aufenthaltsbereiche, Bewegungskanten, Maskierungen und Staustellenindikatoren angezeigt werden.
- Folgeaktionen sind gesperrt, solange blockierende Fehler bestehen.

## 22.11 Tests

- Unit-Tests für POI-Modell vorhanden.
- Unit-Tests für POI-Radius- und Vergleichssaumprüfung vorhanden.
- Unit-Tests für Load-Projektion vorhanden.
- Unit-Tests für Ausschluss privacy-blocked Load-Gruppen vorhanden.
- Unit-Tests für Aufenthaltsklassifizierung vorhanden.
- Unit-Tests für Bewegungsauslastung vorhanden.
- Unit-Tests für Maskierung vorhanden.
- Unit-Tests für Signalverbrauch und Doppelverwertung vorhanden.
- Unit-Tests für Staustellenindikatoren vorhanden.
- Unit-Tests für Kontextübergabe vorhanden.
- Mock-Daten-Test vorhanden.

---

# 23. Testfälle

## 23.1 Gültiger Mock

Input:

```ts
mockSystemAdjustState
mockRegioContentState
mockTelcoLoadState
mockGraphState
```

Erwartung:

```ts
poi_model.status === 'poi_model_valid'
load_model.status === 'loads_projected'
movement_model.status === 'movement_model_valid'
masking_model.status === 'masking_valid'
validation.is_valid === true
errors.length === 0
```

## 23.2 System-Adjust fehlt

Input:

```ts
system_adjust = undefined
mockRegioContentState
mockTelcoLoadState
mockGraphState
```

Erwartung:

```ts
errors includes PLM_SYSTEM_ADJUST_MISSING
poi_model.status === 'poi_model_invalid'
validation.is_valid === false
```

## 23.3 Graph fehlt

Input:

```ts
mockSystemAdjustState
mockRegioContentState
mockTelcoLoadState
graph = undefined
```

Erwartung:

```ts
errors includes PLM_GRAPH_MISSING
load projection is not executed
validation.is_valid === false
```

## 23.4 Regio-Content fehlt

Input:

```ts
mockSystemAdjustState
regio_content = undefined
mockTelcoLoadState
mockGraphState
```

Erwartung:

```ts
errors includes PLM_REGIO_CONTENT_MISSING
active_pois.length === 0
stay_loads.length === 0
validation.is_valid === false
```

## 23.5 POI-Radius nicht bestätigt

Mutation:

```ts
regio_content.poi_radii[0].radius_status = 'suggested'
```

Erwartung:

```ts
errors includes PLM_POI_RADIUS_NOT_CONFIRMED
active_pois[0].activation_status === 'blocked'
validation.is_valid === false
```

## 23.6 POI-Radius außerhalb Systemrange

Mutation:

```ts
regio_content.approved_pois[0].radius_meters = 9999
```

Erwartung:

```ts
errors includes PLM_POI_RADIUS_OUT_OF_RANGE
stay_area_candidates.length === 0
validation.is_valid === false
```

## 23.7 Vergleichssaum außerhalb Systemrange

Mutation:

```ts
regio_content.poi_radii[0].comparison_margin_meters = 999
```

Erwartung:

```ts
errors includes PLM_COMPARISON_MARGIN_OUT_OF_RANGE
validation.is_valid === false
```

## 23.8 Privacy-blocked Signalgruppe

Mutation:

```ts
telco_load.load_signals[0].privacy.aggregation_verified = false
telco_load.load_signals[0].privacy.single_device_visibility_possible = true
```

Erwartung:

```ts
invalid_projection_groups includes reason 'privacy_blocked'
errors includes PLM_SIGNAL_PRIVACY_BLOCKED
projected_loads excludes signal_group_id
```

## 23.9 Abgelaufene Signalgruppe

Mutation:

```ts
telco_load.load_signals[0].validity.expired = true
telco_load.load_signals[0].validity.usable_for_runtime = false
```

Erwartung:

```ts
invalid_projection_groups includes reason 'expired'
errors includes PLM_SIGNAL_EXPIRED or warnings includes stale/expired note
projected_loads excludes signal_group_id
```

## 23.10 Signalgruppe unter Mindestaggregation

Mutation:

```ts
telco_load.load_signals[0].metrics.signal_count = 1
telco_load.load_signals[0].metrics.distinct_device_count = 1
```

Erwartung:

```ts
invalid_projection_groups includes reason 'below_min_aggregation'
errors includes PLM_SIGNAL_BELOW_MIN_AGGREGATION
projected_loads excludes signal_group_id
```

## 23.11 Aufenthalt ohne freigegebenen POI

Mutation:

```ts
regio_content.approved_pois = []
telco_load.load_signals[1].intended_use = ['stay_classification_input']
```

Erwartung:

```ts
errors includes PLM_STAY_WITHOUT_APPROVED_POI
stay_loads.length === 0
masking_model.masked_edges.length === 0
```

## 23.12 Aufenthalt außerhalb Radius

Mutation:

```ts
projected_load.projection_relation = 'outside_rejected'
```

Erwartung:

```ts
errors includes PLM_STAY_SIGNAL_NOT_IN_RADIUS
stay_load.classification === 'not_stay' or no stay_load created
```

## 23.13 Bewegung auf vollständig maskierter Kante

Mutation:

```ts
masking_model.masked_edges[0].mask_type = 'full_edge'
movement_model.movement_loads[0].edge_id = masking_model.masked_edges[0].edge_id
movement_model.movement_loads[0].usable_for_route_evaluation = true
```

Erwartung:

```ts
errors includes PLM_MOVEMENT_ON_FULLY_MASKED_EDGE
validation.is_valid === false
```

## 23.14 Doppelte Signalverwertung

Mutation:

```ts
same projected_load_id appears in stay_loads[0].consumed_projected_load_ids
and movement_loads[0].consumed_projected_load_ids
```

Erwartung:

```ts
errors includes PLM_DUPLICATE_SIGNAL_CONSUMPTION
signal_consumption duplicate_use_prevented === true
validation.is_valid === false
```

## 23.15 Maskierung ohne gültigen Aufenthalt

Mutation:

```ts
masking_model.masked_edges[0].stay_load_id = 'missing_stay_load'
```

Erwartung:

```ts
errors includes PLM_MASK_WITHOUT_VALID_STAY
validation.is_valid === false
```

## 23.16 Jam-Score außerhalb Range

Mutation:

```ts
movement_model.jam_indicators[0].jam_score = 1.7
```

Erwartung:

```ts
errors includes PLM_JAM_INDICATOR_INVALID_SCORE
validation.is_valid === false
```

## 23.17 Kontextschutz

Input:

```ts
const contextBefore = {
  system_adjust: validSystemAdjust,
  regio_content: validRegioContent,
  target_app_ui: validTargetAppUi,
  telco_load: validTelcoLoad,
  graph: validGraph,
  poi_model: undefined,
  load_model: undefined,
  movement_model: undefined,
  masking_model: undefined,
  route_model: { existing: true }
};
```

Aktion:

```ts
const contextAfter = applyPoiLoadMovementToContext(
  contextBefore,
  validPoiModel,
  validLoadProjection,
  validMovementModel,
  validMaskingModel
);
```

Erwartung:

```ts
contextAfter.poi_model exists
contextAfter.load_model exists
contextAfter.movement_model exists
contextAfter.masking_model exists
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

Zuerst sollen Typen, Schema, Mock-Daten, Validierung und reine Berechnungsfunktionen gebaut werden. Die UI kommt danach.

Reihenfolge:

```txt
1. poiLoadMovement.types.ts
2. poiLoadMovement.mock.ts
3. poiLoadMovement.validation.ts
4. poiLoadMovement.poiModel.ts
5. poiLoadMovement.loadProjection.ts
6. poiLoadMovement.stayLogic.ts
7. poiLoadMovement.movementLogic.ts
8. poiLoadMovement.masking.ts
9. poiLoadMovement.jamIndicators.ts
10. poiLoadMovement.context.ts
11. poiLoadMovement.test.ts
12. PoiLoadMovementPanel.tsx
```

## 24.2 Keine Fachlogik im UI-Container

Die React-Komponente darf nur anzeigen und Aktionen auslösen.

Nicht in die Komponente:

- POI-Radiusvalidierung,
- Load-Projektion,
- Aufenthaltsklassifizierung,
- Bewegungsauslastung,
- Maskierungslogik,
- Signalverbrauch,
- Staustellenbewertung.

Diese Logik gehört in reine Funktionen und Services.

## 24.3 Verbindliche Berechnungsreihenfolge

Die Berechnungsreihenfolge ist fachlich wichtig:

```txt
1. POI-Modell bauen
2. POI-Modell validieren
3. Load auf POIs, Aufenthaltskandidaten und Graphkanten projizieren
4. Load-Projektion validieren
5. Aufenthalt berechnen
6. Maskierung aus Aufenthalt erzeugen
7. Bewegung nur auf nicht maskierten Kanten berechnen
8. Staustellenindikatoren vorbereiten
9. Gesamtresultat validieren
10. Kontext schreiben
```

Bewegung darf nicht vor Aufenthaltsmaskierung final berechnet werden.

## 24.4 Signalverbrauch als eigener Prüfpfad

Signalverbrauch muss explizit modelliert werden.

Jede Signalgruppe beziehungsweise jede Projected Load darf final nur einen Verbrauchspfad haben:

```txt
stay_logic
movement_logic
jam_logic
excluded
```

Doppelverwertung ist immer ein blockierender Fehler.

## 24.5 Aufenthalt ist POI-gebunden

Ein Aufenthalt darf nicht allein aus Stillstand entstehen. Er braucht:

- einen freigegebenen POI,
- einen bestätigten Radius,
- eine gültige räumliche Zuordnung,
- gültige Load-Gruppen,
- erfüllte Mindestaggregation.

Stillstand außerhalb eines POI-Radius kann ein Staustellen- oder Qualitätsindikator sein, aber kein bestätigter POI-Aufenthalt.

## 24.6 Maskierung konservativ behandeln

Wenn eine Geometrie nicht exakt genug ist, muss konservativ maskiert oder gewarnt werden.

Nicht erlaubt:

- Aufenthaltssignale als Bewegung zählen, nur weil Teilsegment-Maskierung ungenau ist.
- Vollständig maskierte Kanten weiter als Bewegungskanten bewerten.
- Masken ohne POI- und Stay-Load-Referenz erzeugen.

## 24.7 Staustellenindikatoren nicht mit Aufenthalt verwechseln

Staustellenindikatoren sind getrennt von POI-Aufenthalten.

Beispiele:

- Stillstand auf einem Weg ohne freigegebenen POI kann ein Staustellenkandidat sein.
- Dichte mit niedriger Bewegung auf einer Kante kann ein Jam-Indikator sein.
- Eine unklare Mischlage zwischen Aufenthalt und Bewegung kann nur als Hinweis markiert werden.

Die finale Routenwirkung erfolgt erst in Panel 8.

## 24.8 Datenschutz in jedem Zwischenschritt prüfen

Jeder Zwischenschritt muss privacy-blocked, expired, stale, below-min-aggregation und quality-unusable sauber behandeln.

Sensus-Core-sichere Ergebnisse dürfen keine Rohdaten, Einzelgeräte, Geräte-IDs, Einzelsignale oder exakten Traces enthalten.

## 24.9 Output stabil halten

Spätere Panels müssen sich auf die Feldnamen verlassen können.

Deshalb:

- keine UI-spezifischen Feldnamen im Output,
- keine impliziten Statuswerte,
- keine Bewegungslast ohne Edge-Referenz,
- keine Maskierung ohne Stay-Referenz,
- keine Aufenthaltsklassifizierung ohne POI-Referenz,
- keine Staustellenwirkung ohne expliziten Kandidatenstatus,
- keine Überschreibung vorgelagerter Kontextsegmente.

---

# 25. Kompakter Codex-Auftrag für Panel 7

```text
Baue Panel 7: POI, Load und Bewegung für die SCIM.

Panel 7 ist der zweite baubare Engine-Block nach Graph und Basislayer. Es liest:
- context.system_adjust
- context.regio_content
- context.target_app_ui
- context.telco_load
- context.boundary
- context.extracted_data
- context.scim_context
- context.graph
- context.basis_layer
- context.leaflet_check

Es schreibt ausschließlich:
- context.poi_model
- context.load_model
- context.movement_model
- context.masking_model

Baue zuerst headless:
1. poiLoadMovement.types.ts
2. poiLoadMovement.mock.ts
3. poiLoadMovement.validation.ts
4. poiLoadMovement.poiModel.ts
5. poiLoadMovement.loadProjection.ts
6. poiLoadMovement.stayLogic.ts
7. poiLoadMovement.movementLogic.ts
8. poiLoadMovement.masking.ts
9. poiLoadMovement.jamIndicators.ts
10. poiLoadMovement.context.ts
11. poiLoadMovement.test.ts

Danach baue:
12. PoiLoadMovementPanel.tsx

Die UI hat sechs Tabs:
1. POIs und Radien
2. Load-Projektion
3. Aufenthalt berechnen
4. Bewegung berechnen
5. Maskierung prüfen
6. Staustellenindikatoren

Fachregeln:
- Nur freigegebene Regio-POIs mit bestätigtem Radius dürfen aktive Aufenthaltsbereiche erzeugen.
- POI-Radien und Vergleichssäume müssen innerhalb System-Adjust liegen.
- Nur gültige, aggregierte, nicht abgelaufene und privacy-konforme Load-Gruppen dürfen verarbeitet werden.
- Aufenthalt wird vor Bewegung berechnet.
- Aufenthalt maskiert Bewegung.
- Dieselbe Load-Gruppe darf nie doppelt als Aufenthalt und Bewegung verbraucht werden.
- Vollständig maskierte Kanten dürfen nicht als Bewegungskanten bewertet werden.
- Teilmaskierungen müssen Geometrie oder betroffene Länge dokumentieren.
- Stillstand ohne freigegebenen POI ist kein bestätigter Aufenthalt, sondern höchstens ein Staustellen- oder Qualitätsindikator.
- Staustellenindikatoren sind nur vorbereitende Hinweise für Panel 8 und keine finalen Routensperren.
- Panel 7 erzeugt keine finalen Routenabschnitte, keine Routenvorschläge, keinen finalen Routenlayer und kein Sensus-Core-Paket.

Akzeptanz:
- Unit-Tests für POI-Modell, Load-Projektion, Aufenthalt, Bewegung, Maskierung, Signalverbrauch, Staustellenindikatoren und Kontextübergabe.
- Validator blockiert fehlenden System-Adjust, fehlenden Graph, ungültigen Regio-Content, privacy-blocked Load, abgelaufene Load-Gruppen, doppelte Signalverwertung und Bewegung auf vollständig maskierten Kanten.
- applyPoiLoadMovementToContext verändert ausschließlich context.poi_model, context.load_model, context.movement_model und context.masking_model.
```

---

# 26. Kernaussage für Panel 7

> Panel 7 ist der fachliche Auslastungskern der SCIM. Es verbindet freigegebene POIs, bestätigte Radien, validierte Load-Gruppen und den SCIM-Graphen zu Aufenthalt, Bewegung, Maskierung und Staustellenindikatoren. Die wichtigste Systemregel lautet: Aufenthalt maskiert Bewegung, und kein Signal darf doppelt verwertet werden.
