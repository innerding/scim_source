# SCIM Panel 6 – Graph und Basislayer

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor den konkreten Panel-Auftrag. Sie stellt sicher, dass Panel 6 nicht als isolierter Graph-Konverter oder Leaflet-Layer-Renderer gebaut wird, sondern als erster baubarer Engine-Block nach Boundary und Extraktion.

### 0.1 SCIM-Gesamtsystem

SCIM ist ein Gesamtsystem aus:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokaler Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 6 liegt am Beginn des rechnerischen SCIM-Kerns. Es nimmt die validierten Inputs und das Extraktionspaket aus Panel 5 auf, prüft daraus den baubaren SCIM-Kontext, erzeugt einen ersten SCIM-Arbeitsgraphen und leitet daraus einen Basislayer für Leaflet ab.

Panel 6 berechnet noch keine Aufenthaltsbereiche, keine Bewegungsauslastung, keine Maskierung und keine Routenbewertung. Es stellt aber die strukturierte Grundlage bereit, auf der diese späteren Berechnungen überhaupt erst korrekt stattfinden können.

### 0.2 Rollenklärung

**SCIM-Engine**  
Der rechnerische Kern. In Panel 6 beginnt die Engine-Arbeit mit Kontextprüfung, Graphaufbau und Basislayer-Erzeugung.

**Leaflet**  
Leaflet ist Prüf- und Darstellungswerkzeug. In Panel 6 wird Leaflet genutzt, um den erzeugten Basisgraphen beziehungsweise den daraus abgeleiteten Basislayer sichtbar gegen Boundary, Puffer, extrahierte Wege und Randanschlüsse zu prüfen. Leaflet erzeugt nicht den Graphen und entscheidet nicht über SCIM-Semantik.

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät beziehungsweise in der laufzeitnahen App-Representation. Panel 6 erzeugt noch kein Sensus-Core-Paket. Der Basisgraph und der Basislayer sind aber spätere Vorbedingungen für Sensus-Core-taugliche Layer, Routenoptionen und Reduktionen.

**Graph und Basislayer**  
Panel 6 verbindet vier fachlich eng gekoppelte Schritte:

- SCIM-Kontext prüfen,
- extrahierte Wege in einen Graphen überführen,
- Graphstruktur prüfen,
- aus dem Graphen einen technischen Basislayer erzeugen,
- diesen Basislayer in Leaflet prüfen.

Leitsatz:

> Panel 6 macht aus dem Extraktionspaket eine baubare SCIM-Struktur: erst Kontext, dann Graph, dann Basislayer, dann Leaflet-Prüfung.

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
  scim_context?: ScimRuntimeContextState;
  graph?: GraphState;
  basis_layer?: BasisLayerState;
  leaflet_check?: LeafletBasisCheckState;
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

Panel 6 darf schreiben in:

```ts
context.scim_context
context.graph
context.basis_layer
context.leaflet_check
```

Panel 6 darf lesen aus:

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
context.boundary
context.extracted_data
```

Panel 6 darf nicht schreiben in:

```ts
context.system_adjust
context.regio_content
context.target_app_ui
context.telco_load
context.boundary
context.extracted_data
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

- klares Input-Schema,
- klares Output-Schema,
- Statusfeld,
- Fehlerliste,
- Warnliste,
- Validierungsfunktion,
- Mock-Daten,
- Tests,
- Übergabe an das nächste Panel.

Panel 6 ist besonders wichtig, weil spätere POI-, Aufenthalts-, Bewegungs-, Maskierungs- und Routenlogik nur dann korrekt funktionieren, wenn der Arbeitsgraph stabil, reproduzierbar und semantisch sauber aufgebaut wurde.

### 0.5 Datenschutzgrenze

Panel 6 darf keine Datenschutzgrenzen aufweichen. Es verarbeitet primär Wege, Knoten, Kanten, Randanschlüsse, POI-Referenzen und optional Load-Referenzen. Es darf keine Rohsignale, Geräte-IDs oder Einzeltraces in Graph oder Basislayer übernehmen.

Nicht erlaubt:

- Rohsignale in `graph` oder `basis_layer` übernehmen,
- einzelne Geräte oder Einzeltraces als Knoten, Kante oder Layer-Feature modellieren,
- Load-Gruppen punktgenau als personenbezogene Bewegungsdaten darstellen,
- Debug-Attribute als Sensus-Core-tauglich markieren,
- nicht validierte Extraktionsdaten in einen runtime-gültigen Graphen übernehmen.

Falls `context.telco_load` oder `context.extracted_data.filtered_load_signal_refs` vorhanden ist, darf Panel 6 diese nur als Referenzkontext führen. Die fachliche Projektion auf Aufenthaltsbereiche, Bewegungskanten oder Staustellen erfolgt später.

### 0.6 System-Adjust-Vorrang

Panel 6 ist abhängig von `context.system_adjust`.

Ohne gültigen System-Adjust-Stand darf kein runtime-gültiger Graph und kein runtime-gültiger Basislayer entstehen.

System-Adjust begrenzt für Panel 6 insbesondere:

- Datenschutzgrenzen,
- Mindestlängen sichtbarer oder verwertbarer Kanten,
- räumliche Mindestauflösung,
- Feature Flags für Graph, Debug und Leaflet-Prüfung,
- zulässige Parameterbereiche für spätere Kanten- und Abschnittsbewertung,
- zulässige Debug-Sichtbarkeit,
- Sensus-Core-Ausschlussregeln für Roh- und Debugdaten.

### 0.7 Boundary- und Extraktionsabhängigkeit

Panel 6 ist direkt abhängig von Panel 5.

Erforderlich sind:

- gültige `context.boundary`,
- gültige `context.extracted_data`,
- mindestens ein wanderrelevanter Weg,
- bekannte Boundary- und Buffer-Geometrie,
- erkannte Randanschlüsse oder bewusst bestätigte Abwesenheit von Randanschlüssen,
- reproduzierbare Datenquellenangaben.

Ohne gültige Boundary und gültige Extraktion darf Panel 6 nur im Entwurfs- oder Fehlermodus laufen.

### 0.8 Regio-Content-Abhängigkeit

Panel 6 kann Regio-Content berücksichtigen, verändert ihn aber nicht.

Regio-Content liefert:

- freigegebene POI-Referenzen,
- bestätigte POI-Radien,
- regionale Sperren und Hinweise,
- regionale Parameterstände,
- regionale Freigabeinformationen.

Panel 6 darf diese Inhalte als Referenzen an Graphobjekte anhängen, aber noch keine Aufenthaltsbereiche berechnen und keine Routenwirkung final bewerten.

### 0.9 Ziel-App-UI-Abhängigkeit

Panel 6 kann Ziel-App-UI-Konfiguration berücksichtigen, um zu prüfen, ob Basislayer, Debuglayer oder Vorschau-Layer später überhaupt zulässig sind.

Panel 6 darf daraus aber kein Sensus-Core-Paket erzeugen. Es darf nur die Layerklassifikation so vorbereiten, dass spätere Composer sauber zwischen Operator-, Debug- und reduzierbaren Ziel-App-Layern unterscheiden können.

### 0.10 Telco-Load-Abhängigkeit

Panel 6 kann Telco-Load nur als Kontextreferenz führen.

Panel 6 darf:

- Load-Referenzen aus `filtered_load_signal_refs` an Graphnähe oder räumlichen Scope hängen,
- prüfen, ob der Graph die räumliche Grundlage für spätere Load-Projektion bietet,
- Warnungen erzeugen, falls Load-Referenzen außerhalb des Graphraums liegen.

Panel 6 darf nicht:

- Load auf Kanten projizieren,
- Aufenthalt berechnen,
- Bewegungsauslastung berechnen,
- Staustellen klassifizieren,
- Maskierung berechnen,
- Routenabschnitte abwerten.

### 0.11 Trennung von Graphbau und Fachbewertung

Panel 6 baut den strukturellen Graphen. Es bewertet noch nicht die Auslastung.

Es liefert:

- topologische Knoten,
- Shape-Punkte,
- Kanten,
- Randanschlüsse,
- vorbereitete routenrelevante Abschnittskandidaten,
- Basislayer-Features,
- Graphdiagnose,
- Leaflet-Basisprüfung.

Spätere Panels entscheiden erst, welche Kanten durch POI-Aufenthaltsbereiche maskiert werden, welche Kanten Bewegungskanten sind, welche Load-Scores entstehen und welche Routenabschnitte abgewertet werden.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**Graph und Basislayer**

Technischer Modulname:

```ts
GraphBasisLayerPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
validateScimRuntimeContext()
buildScimGraph()
validateScimGraph()
composeBasisLayer()
validateBasisLayer()
runLeafletBasisCheck()
applyGraphAndBasisLayerToContext()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/graph-basislayer/
  GraphBasisLayerPanel.tsx
  graphBasis.types.ts
  graphBasis.schema.ts
  graphBasis.defaults.ts
  graphBasis.mock.ts
  graphBasis.validation.ts
  graphBasis.graphBuilder.ts
  graphBasis.layerComposer.ts
  graphBasis.leaflet.ts
  graphBasis.context.ts
  graphBasis.test.ts
```

---

# 2. Zweck des Panels

Panel 6 erzeugt aus dem validierten SCIM-Kontext und dem Extraktionspaket einen stabilen SCIM-Arbeitsgraphen und einen technischen Basislayer.

Es beantwortet für spätere Panels:

- Sind alle notwendigen Inputs gemeinsam verwendbar?
- Ist der SCIM-Kontext für Graphbau gültig?
- Welche extrahierten Wege werden zu Graphkanten?
- Welche Punkte sind topologische Knoten?
- Welche Punkte bleiben reine Shape-Punkte?
- Welche Randanschlüsse müssen erhalten bleiben?
- Welche Kanten sind als spätere Bewegungskantenkandidaten geeignet?
- Welche Abschnittskandidaten können später zu routenrelevanten Abschnitten verdichtet werden?
- Kann der Basisgraph in Leaflet nachvollziehbar dargestellt werden?

Leitsatz:

> Panel 6 erzeugt die technische Netztopologie und den ersten prüfbaren Kartenlayer, aber noch keine Auslastungs- oder Routenentscheidung.

---

# 3. Nicht-Ziele

Panel 6 darf nicht:

- System-Adjust-Grenzen ändern,
- Regio-Content ändern oder POIs freigeben,
- Ziel-App-UI-Profile ändern,
- Telco-Load fachlich interpretieren,
- neue Boundary- oder Extraktionsdaten erzeugen,
- Aufenthaltsbereiche berechnen,
- POI-Aufenthalte klassifizieren,
- Bewegungsauslastung berechnen,
- Kanten maskieren,
- Staustellen final klassifizieren,
- Routenabschnitte fachlich bewerten,
- Sensus-Core-Pakete erzeugen,
- lokale User-Einstellungen anwenden,
- Freigaben oder Exporte erzeugen.

Panel 6 ist ein Struktur- und Basislayerpanel, kein Aufenthalts-, Load- oder Routenbewertungspanel.

---

# 4. Fachliche Verantwortung

Panel 6 hat fünf fachliche Kernaufgaben.

## 4.1 SCIM-Kontext validieren

Panel 6 prüft, ob die vorliegenden Inputs gemeinsam einen baubaren SCIM-Kontext ergeben.

Geprüft werden mindestens:

- System-Adjust vorhanden und gültig,
- Boundary vorhanden und gültig,
- Extraktion vorhanden und gültig,
- Extraktion gehört zur aktiven `representation_id`,
- Boundary-Referenz passt zur Extraktion,
- Regio-Content-Versionen sind konsistent, sofern vorhanden,
- Ziel-App-UI-Version ist konsistent, sofern vorhanden,
- Telco-Load ist gültig oder nur als Warn-/Referenzkontext vorhanden,
- keine blockierenden Datenschutzverletzungen aus vorgelagerten Panels.

## 4.2 Graph erzeugen

Panel 6 überführt extrahierte wanderrelevante Wege in einen SCIM-Arbeitsgraphen.

Dabei werden:

- Liniengeometrien gelesen,
- gemeinsame Endpunkte und Schnittpunkte erkannt,
- topologische Knoten erzeugt,
- Shape-Punkte als geometrische Stützpunkte erhalten,
- Kanten zwischen Knoten aufgebaut,
- Quellweg-Referenzen erhalten,
- Boundary-Randanschlüsse übernommen,
- Abschnittskandidaten vorbereitet.

## 4.3 Graph prüfen

Panel 6 prüft den erzeugten Graphen auf bauliche Nutzbarkeit.

Geprüft werden mindestens:

- Knoten vorhanden,
- Kanten vorhanden,
- jede Kante hat Start- und Endknoten,
- jede Kante hat gültige Geometrie,
- Kantenlängen sind plausibel,
- keine leeren Geometrien,
- keine isolierten Kanten ohne bewusste Randlogik,
- Randanschlüsse bleiben erhalten,
- Shape-Punkte werden nicht fälschlich zu topologischen Knoten, außer wenn semantisch erforderlich,
- vorbereitete Abschnittskandidaten sind nachvollziehbar.

## 4.4 Basislayer erzeugen

Panel 6 erzeugt aus dem Graphen einen technischen Basislayer.

Der Basislayer dient:

- zur Leaflet-Prüfung,
- zur Operator-Vorschau,
- als spätere Grundlage für Layer Composer,
- als visuelle Kontrolle der Graphstruktur,
- nicht als finales Sensus-Core-Paket.

Der Basislayer enthält keine Rohsignale, keine Geräteinformationen und keine personenbezogenen Bewegungsdaten.

## 4.5 Leaflet-Basisprüfung ausführen

Panel 6 prüft, ob der Basislayer in Leaflet gegen Boundary, Buffer, extrahierte Wege und Randanschlüsse plausibel dargestellt werden kann.

Die Leaflet-Prüfung ist eine visuelle und technische Plausibilitätsprüfung, keine fachliche Last- oder Routenbewertung.

---

# 5. Datenmodell

## 5.1 ScimRuntimeContextState

```ts
export interface ScimRuntimeContextState {
  scim_context_id: string;
  representation_id: string;
  created_at: string;
  checked_at: string;
  input_refs: ScimContextInputRefs;
  input_status: ScimContextInputStatus;
  validation: ScimRuntimeContextValidationResult;
  status: ScimRuntimeContextStatus;
}
```

## 5.2 ScimContextInputRefs

```ts
export interface ScimContextInputRefs {
  system_adjust_version: string;
  regio_content_version?: string;
  target_app_ui_version?: string;
  telco_load_batch_id?: string;
  boundary_id: string;
  extraction_id: string;
}
```

## 5.3 ScimContextInputStatus

```ts
export interface ScimContextInputStatus {
  system_adjust_valid: boolean;
  regio_content_valid_or_absent: boolean;
  target_app_ui_valid_or_absent: boolean;
  telco_load_valid_warning_or_absent: boolean;
  boundary_valid: boolean;
  extraction_valid: boolean;
  privacy_blockers_present: boolean;
  can_build_graph: boolean;
}
```

## 5.4 ScimRuntimeContextStatus

```ts
export type ScimRuntimeContextStatus =
  | 'not_checked'
  | 'checking'
  | 'scim_context_valid'
  | 'scim_context_warning'
  | 'scim_context_invalid'
  | 'scim_context_error';
```

---

# 6. GraphState

## 6.1 Kernoutput

```ts
export interface GraphState {
  graph_id: string;
  representation_id: string;
  source_extraction_id: string;
  created_at: string;
  graph_build_version: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  shape_points: GraphShapePoint[];
  boundary_connections: GraphBoundaryConnection[];
  route_section_candidates: RouteSectionCandidate[];
  graph_summary: GraphSummary;
  validation: GraphValidationResult;
  status: GraphStatus;
}
```

## 6.2 GraphStatus

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

---

# 7. GraphNode

## 7.1 Typ

```ts
export interface GraphNode {
  node_id: string;
  node_type: GraphNodeType;
  coordinate: GeoPoint;
  source_refs: GraphSourceRef[];
  degree: number;
  inside_boundary: boolean;
  inside_buffer_only: boolean;
  boundary_relation: BoundaryRelation;
  semantic_roles: GraphSemanticRole[];
  connected_edge_ids: string[];
  metadata?: Record<string, unknown>;
}
```

## 7.2 NodeType

```ts
export type GraphNodeType =
  | 'topological_node'
  | 'endpoint_node'
  | 'intersection_node'
  | 'boundary_connector_node'
  | 'poi_reference_node'
  | 'semantic_intermediate_node';
```

## 7.3 SemanticRole

```ts
export type GraphSemanticRole =
  | 'routing_decision_point'
  | 'boundary_connection'
  | 'poi_reference'
  | 'potential_stay_boundary'
  | 'potential_masking_boundary'
  | 'potential_jam_boundary'
  | 'shape_promoted_for_scim';
```

## 7.4 Node-Regeln

- Topologische Knoten entstehen an Kreuzungen, Abzweigungen, Endpunkten und Randanschlüssen.
- Shape-Punkte werden nicht automatisch zu topologischen Knoten.
- Shape-Punkte dürfen zu semantischen Zwischenknoten aufgewertet werden, wenn sie für spätere Aufenthaltsisolierung, Maskierung, Staustellenabgrenzung oder Abschnittsbildung benötigt werden.
- POI-Referenzen dürfen Knoten markieren, aber noch keine Aufenthaltsbereiche erzeugen.
- Boundary-Connector-Knoten müssen erhalten bleiben, damit Randwege nicht abgeschnitten werden.

---

# 8. GraphEdge

## 8.1 Typ

```ts
export interface GraphEdge {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  geometry: GeoJsonLineString;
  length_meters: number;
  source_way_refs: GraphSourceRef[];
  way_class: ExtractedWayClass;
  route_relevance: ExtractedRouteRelevance;
  inside_boundary: boolean;
  inside_buffer_only: boolean;
  intersects_boundary: boolean;
  candidate_for_movement_load: boolean;
  candidate_for_route_section: boolean;
  candidate_for_stay_masking: boolean;
  semantic_flags: GraphEdgeSemanticFlag[];
  metadata?: Record<string, unknown>;
}
```

## 8.2 SemanticFlags

```ts
export type GraphEdgeSemanticFlag =
  | 'boundary_crossing'
  | 'buffer_only'
  | 'poi_adjacent_candidate'
  | 'restriction_adjacent_candidate'
  | 'load_projection_candidate'
  | 'route_section_candidate'
  | 'requires_later_masking_check';
```

## 8.3 Edge-Regeln

- Jede Kante braucht genau einen Start- und Endknoten.
- Jede Kante braucht eine gültige LineString-Geometrie.
- Kantenlänge muss positiv sein.
- Kanten unter System-Mindestlänge werden nicht gelöscht, sondern markiert, sofern sie topologisch erforderlich sind.
- Kanten innerhalb eines zukünftigen Aufenthaltsbereichs werden in Panel 6 noch nicht maskiert.
- Kanten können als Kandidaten für Bewegungsauslastung markiert werden, solange sie nicht später durch Aufenthalt maskiert werden.

---

# 9. Shape-Punkte

## 9.1 Typ

```ts
export interface GraphShapePoint {
  shape_point_id: string;
  coordinate: GeoPoint;
  edge_id: string;
  source_way_ref: GraphSourceRef;
  sequence_index: number;
  promoted_to_node_id?: string;
  promotion_reason?: ShapePromotionReason;
}
```

## 9.2 PromotionReason

```ts
export type ShapePromotionReason =
  | 'none'
  | 'near_poi_radius'
  | 'stay_area_boundary_candidate'
  | 'masking_boundary_candidate'
  | 'jam_boundary_candidate'
  | 'route_section_split_candidate'
  | 'boundary_intersection';
```

## 9.3 Shape-Regeln

- Shape-Punkte beschreiben zunächst nur Geometrie.
- Shape-Punkte werden als eigene Liste erhalten, damit die ursprüngliche Wegform reproduzierbar bleibt.
- Eine Aufwertung zum semantischen Zwischenknoten verändert nicht die ursprüngliche Geometrie, sondern ergänzt eine SCIM-Rolle.
- Die spätere Aufenthalts- und Maskierungslogik darf auf diese Aufwertung zurückgreifen.

Verbindliche Aufwertungsbedingungen (Entscheidung 14.4):

Ein Shape-Punkt **muss** zu einem semantischen Zwischenknoten aufgewertet werden, wenn er mindestens eine dieser Bedingungen erfüllt:

1. liegt innerhalb eines bestätigten POI-Aufenthaltsradius → `near_poi_radius` / `stay_area_boundary_candidate`
2. ist Grenzpunkt zwischen einer maskierten und einer unmaskierten Kante → `masking_boundary_candidate`
3. ist Randknoten einer Staustellenabgrenzung → `jam_boundary_candidate`
4. wird als Abschnitt-Split-Punkt für Panel 8 benötigt → `route_section_split_candidate`
5. trägt wiederholt Signalkumulationen, die eine Aufenthaltsklassifizierung ermöglichen würden → `stay_area_boundary_candidate`

Die Aufwertung setzt `promotion_reason` und erzeugt eine `promoted_to_node_id`. Die neue Knoten-Rolle wird in `GraphSemanticRole` geführt.

---

# 10. Boundary Connections

## 10.1 Typ

```ts
export interface GraphBoundaryConnection {
  connection_id: string;
  source_boundary_connection_id: string;
  node_id: string;
  connected_edge_id: string;
  connection_type: BoundaryConnectionType;
  boundary_side?: BoundarySide;
  inside_to_outside: boolean;
  requires_graph_continuation: boolean;
  status: GraphBoundaryConnectionStatus;
}
```

## 10.2 Status

```ts
export type GraphBoundaryConnectionStatus =
  | 'preserved'
  | 'merged'
  | 'missing_source_edge'
  | 'invalid_geometry'
  | 'warning';
```

## 10.3 Boundary-Connection-Regeln

- Jeder Randanschluss aus Panel 5 muss im Graphen nachvollziehbar sein.
- Randanschlüsse dürfen nicht versehentlich durch Liniensegmentierung verloren gehen.
- Fehlt ein Randanschluss im Graphen, ist das mindestens eine Warnung, bei relevanten Anschlusswegen ein blockierender Fehler.
- Randanschlüsse sind wichtig für spätere Alternativrouten und dürfen nicht als irrelevanter Buffer-Ballast entfernt werden.

---

# 11. RouteSectionCandidate

## 11.1 Typ

```ts
export interface RouteSectionCandidate {
  section_candidate_id: string;
  edge_ids: string[];
  from_node_id: string;
  to_node_id: string;
  total_length_meters: number;
  section_type: RouteSectionCandidateType;
  inside_boundary: boolean;
  touches_buffer: boolean;
  ready_for_route_evaluation: boolean;
  notes?: string[];
}
```

## 11.2 SectionCandidateType

```ts
export type RouteSectionCandidateType =
  | 'between_topological_nodes'
  | 'boundary_to_topological_node'
  | 'dead_end_section'
  | 'buffer_connector_section'
  | 'requires_later_split';
```

## 11.3 Abschnittskandidaten-Regeln

- Panel 6 bereitet Abschnittskandidaten vor, bewertet sie aber nicht.
- Abschnittskandidaten laufen bevorzugt zwischen topologischen Knoten.
- Enthält ein Abschnitt spätere POI-, Maskierungs- oder Staustellenkandidaten, kann er als `requires_later_split` markiert werden.
- Die finale Routenabschnittsbewertung erfolgt erst in Panel 8.

---

# 12. BasisLayerState

## 12.1 Kernoutput

```ts
export interface BasisLayerState {
  basis_layer_id: string;
  representation_id: string;
  graph_id: string;
  created_at: string;
  layer_format: BasisLayerFormat;
  operator_geojson: GeoJSONFeatureCollection;
  graph_debug_geojson?: GeoJSONFeatureCollection;
  sensus_core_candidate_geojson?: GeoJSONFeatureCollection;
  layer_summary: BasisLayerSummary;
  validation: BasisLayerValidationResult;
  status: BasisLayerStatus;
}
```

## 12.2 LayerFormat

```ts
export type BasisLayerFormat =
  | 'geojson'
  | 'vector_tile_candidate'
  | 'internal_feature_collection';
```

## 12.3 BasisLayerStatus

```ts
export type BasisLayerStatus =
  | 'not_created'
  | 'composing'
  | 'basis_layer_created_unvalidated'
  | 'validating'
  | 'basis_layer_valid'
  | 'basis_layer_warning'
  | 'basis_layer_invalid'
  | 'basis_layer_error';
```

## 12.4 Basislayer-Regeln

- Der Operator-Basislayer darf Graphstruktur sichtbar machen.
- Debug-GeoJSON muss klar getrennt sein.
- Sensus-Core-Kandidaten dürfen keine Debug-Attribute, Rohsignale oder interne Prüfdaten enthalten.
- Der Basislayer darf Auslastung noch nicht einfärben.
- Der Basislayer darf keine Aufenthaltsbereiche darstellen, außer als spätere Kandidatenreferenz, sofern datenschutzkonform und operator-only.

---

# 13. LeafletBasisCheckState

## 13.1 Typ

```ts
export interface LeafletBasisCheckState {
  leaflet_check_id: string;
  representation_id: string;
  graph_id: string;
  basis_layer_id: string;
  checked_at: string;
  visible_overlays: LeafletBasisOverlay[];
  check_items: LeafletBasisCheckItem[];
  issues: LeafletBasisIssue[];
  status: LeafletBasisCheckStatus;
}
```

## 13.2 Overlays

```ts
export type LeafletBasisOverlay =
  | 'boundary'
  | 'buffer'
  | 'extracted_ways'
  | 'graph_edges'
  | 'graph_nodes'
  | 'shape_points'
  | 'boundary_connections'
  | 'basis_layer'
  | 'debug_graph';
```

## 13.3 CheckStatus

```ts
export type LeafletBasisCheckStatus =
  | 'not_checked'
  | 'checking'
  | 'leaflet_basis_valid'
  | 'leaflet_basis_warning'
  | 'leaflet_basis_invalid'
  | 'leaflet_basis_error';
```

## 13.4 Leaflet-Prüfregeln

- Boundary und Buffer müssen sichtbar überlagerbar sein.
- Extrahierte Wege und Graphkanten müssen räumlich plausibel übereinanderliegen.
- Randanschlüsse müssen sichtbar prüfbar sein.
- Graphknoten dürfen nicht massenhaft falsch als Entscheidungspunkte erscheinen.
- Shape-Punkte müssen optional ausblendbar sein.
- Debug-Layer dürfen nie als Sensus-Core-Ausgabe klassifiziert werden.

---

# 14. Validierung

## 14.1 Gemeinsames Issue-Modell

```ts
export interface GraphBasisIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}
```

## 14.2 Kontextvalidierung

```ts
export interface ScimRuntimeContextValidationResult {
  is_valid: boolean;
  errors: GraphBasisIssue[];
  warnings: GraphBasisIssue[];
  checked_at: string;
}
```

Pflichtvalidierungen:

```txt
context.system_adjust exists
context.system_adjust status is valid or warning
context.boundary exists
context.boundary status is boundary_valid or boundary_warning
context.extracted_data exists
context.extracted_data status is extraction_valid or extraction_warning
context.extracted_data.representation_id === context.boundary.representation_id
context.extracted_data.ways.length > 0
no privacy blockers from telco_load references
```

## 14.3 Graphvalidierung

```ts
export interface GraphValidationResult {
  is_valid: boolean;
  errors: GraphBasisIssue[];
  warnings: GraphBasisIssue[];
  checked_at: string;
  checked_against_extraction_id: string;
  checked_against_system_adjust_version: string;
}
```

Pflichtvalidierungen:

```txt
graph_id exists
nodes.length > 0
edges.length > 0
each edge has from_node_id and to_node_id
each edge nodes exist
each edge geometry is valid LineString
each edge length_meters > 0
boundary connections from extraction are represented or explicitly warning-marked
route section candidates reference existing edges
no raw signal payload in graph metadata
```

## 14.4 Basislayer-Validierung

```ts
export interface BasisLayerValidationResult {
  is_valid: boolean;
  errors: GraphBasisIssue[];
  warnings: GraphBasisIssue[];
  checked_at: string;
  checked_against_graph_id: string;
}
```

Pflichtvalidierungen:

```txt
basis_layer_id exists
graph_id exists
operator_geojson exists
operator_geojson contains edge features
no raw_signal data_class in sensus_core_candidate_geojson
no debug data in sensus_core_candidate_geojson
feature geometries are valid GeoJSON
```

## 14.5 Warnungen

Warnungen blockieren nicht automatisch, sollen aber sichtbar sein.

Beispiele:

```txt
isolated edge detected
many shape points promoted to nodes
boundary connection missing but source way low relevance
basis layer has no sensus_core_candidate output yet
regio content absent during graph build
load references absent during graph build
leaflet debug overlay enabled
```

## 14.6 Fehlercodes

```ts
export type GraphBasisErrorCode =
  | 'GB_CONTEXT_SYSTEM_ADJUST_MISSING'
  | 'GB_CONTEXT_BOUNDARY_MISSING'
  | 'GB_CONTEXT_EXTRACTION_MISSING'
  | 'GB_CONTEXT_REPRESENTATION_MISMATCH'
  | 'GB_CONTEXT_PRIVACY_BLOCKER_PRESENT'
  | 'GB_EXTRACTION_NO_WAYS'
  | 'GB_GRAPH_NO_NODES'
  | 'GB_GRAPH_NO_EDGES'
  | 'GB_GRAPH_EDGE_NODE_MISSING'
  | 'GB_GRAPH_EDGE_GEOMETRY_INVALID'
  | 'GB_GRAPH_EDGE_LENGTH_INVALID'
  | 'GB_GRAPH_BOUNDARY_CONNECTION_LOST'
  | 'GB_GRAPH_ROUTE_SECTION_INVALID'
  | 'GB_GRAPH_RAW_SIGNAL_FORBIDDEN'
  | 'GB_LAYER_OPERATOR_GEOJSON_MISSING'
  | 'GB_LAYER_FEATURE_GEOMETRY_INVALID'
  | 'GB_LAYER_DEBUG_IN_SENSUS_CORE_FORBIDDEN'
  | 'GB_LAYER_RAW_SIGNAL_IN_SENSUS_CORE_FORBIDDEN';
```

## 14.7 Warncodes

```ts
export type GraphBasisWarningCode =
  | 'GB_WARN_REGIO_CONTENT_ABSENT'
  | 'GB_WARN_TARGET_APP_UI_ABSENT'
  | 'GB_WARN_TELCO_LOAD_ABSENT'
  | 'GB_WARN_ISOLATED_EDGE'
  | 'GB_WARN_SHORT_EDGE_PRESERVED'
  | 'GB_WARN_MANY_SHAPE_PROMOTIONS'
  | 'GB_WARN_BOUNDARY_CONNECTION_LOW_RELEVANCE_MISSING'
  | 'GB_WARN_DEBUG_OVERLAY_ENABLED'
  | 'GB_WARN_NO_SENSUS_CORE_CANDIDATE_LAYER';
```

---

# 15. UI-Anforderungen

Panel 6 sollte als Engine-nahes Prüf- und Strukturpanel sichtbar bleiben. Es ist UI-ärmer als Inputpanels, aber nicht unsichtbar, weil Graphfehler visuell und tabellarisch prüfbar sein müssen.

## 15.1 Layout

Empfohlenes Layout:

```txt
┌────────────────────────────────────────────────────────────┐
│ Panel 6: Graph und Basislayer                              │
├────────────────────────────────────────────────────────────┤
│ Kontextstatus                                               │
│ - System-Adjust                                             │
│ - Regio-Content                                             │
│ - Ziel-App UI                                               │
│ - Telco-Load                                                │
│ - Boundary                                                  │
│ - Extraktion                                                │
├────────────────────────────────────────────────────────────┤
│ Graphstatus                                                 │
│ - Knoten                                                    │
│ - Kanten                                                    │
│ - Shape-Punkte                                              │
│ - Randanschlüsse                                            │
│ - Abschnittskandidaten                                      │
├────────────────────────────────────────────────────────────┤
│ Tabs                                                        │
│ 1. Kontextprüfung                                           │
│ 2. Graph erzeugen                                           │
│ 3. Graph prüfen                                             │
│ 4. Basislayer erzeugen                                      │
│ 5. Leaflet-Prüfung                                          │
├────────────────────────────────────────────────────────────┤
│ Footer                                                      │
│ [Kontext prüfen] [Graph erzeugen] [Basislayer erzeugen]     │
│ [Leaflet prüfen] [In Kontext übernehmen]                    │
└────────────────────────────────────────────────────────────┘
```

## 15.2 Tab 1: Kontextprüfung

Zweck:

- alle Vorgängerinputs prüfen,
- blockierende Fehler sichtbar machen,
- Graphbau erst erlauben, wenn Kontext baubar ist.

Anzeigen:

```txt
System-Adjust-Version
Regio-Content-Version
Ziel-App-UI-Version
Telco-Load-Batch
Boundary-ID
Extraction-ID
Representation-ID
Kontextstatus
Fehlerliste
Warnliste
```

Aktionen:

```txt
Kontext prüfen
Fehler anzeigen
Warnungen anzeigen
```

## 15.3 Tab 2: Graph erzeugen

Zweck:

- Graph Builder starten,
- Aufbaufortschritt anzeigen,
- Ergebnisstatistik anzeigen.

Anzeigen:

```txt
Anzahl Quellwege
Anzahl erzeugter Knoten
Anzahl erzeugter Kanten
Anzahl Shape-Punkte
Anzahl Randanschlüsse
Anzahl Abschnittskandidaten
Build-Version
```

Aktionen:

```txt
Graph erzeugen
Graph neu erzeugen
Build-Protokoll anzeigen
```

## 15.4 Tab 3: Graph prüfen

Zweck:

- Graphvalidierung ausführen,
- Strukturfehler sichtbar machen,
- problematische Knoten oder Kanten auffindbar machen.

Anzeigen:

```txt
Knotenliste
Kantenliste
isolierte Kanten
kurze Kanten
Randanschlüsse
Shape-Promotions
Abschnittskandidaten
Fehlerliste
Warnliste
```

Aktionen:

```txt
Graph validieren
Problemobjekt in Karte markieren
```

## 15.5 Tab 4: Basislayer erzeugen

Zweck:

- aus dem Graphen GeoJSON-/Layer-Strukturen ableiten,
- Operator-, Debug- und Sensus-Core-Kandidaten trennen,
- Basislayer validieren.

Anzeigen:

```txt
Operator-Layer-Features
Debug-Layer-Features
Sensus-Core-Kandidaten-Features
Layerformat
Layerstatus
```

Aktionen:

```txt
Basislayer erzeugen
Basislayer validieren
GeoJSON-Vorschau anzeigen
```

## 15.6 Tab 5: Leaflet-Prüfung

Zweck:

- Basislayer visuell prüfen,
- Boundary und Buffer überlagern,
- extrahierte Wege gegen Graphkanten vergleichen,
- Randanschlüsse kontrollieren.

Anzeigen:

```txt
Leaflet-Karte
Boundary Overlay
Buffer Overlay
Extrahierte Wege
Graphkanten
Graphknoten
Shape-Punkte optional
Randanschlüsse
Debug Overlay optional
```

Aktionen:

```txt
Overlay ein-/ausblenden
Problemobjekt fokussieren
Leaflet-Prüfung speichern
```

---

# 16. Verarbeitungslogik

## 16.1 Empfohlener Ablauf

```txt
1. Kontext aus bestehenden Panels lesen
2. SCIM-Kontext validieren
3. Extrahierte Wege normalisieren
4. Topologische Knoten erkennen
5. Shape-Punkte erhalten
6. Kanten erzeugen
7. Randanschlüsse einhängen
8. Abschnittskandidaten vorbereiten
9. Graph validieren
10. Operator-Basislayer erzeugen
11. Debug-Layer getrennt erzeugen
12. Sensus-Core-Kandidatenlayer reduziert vorbereiten
13. Basislayer validieren
14. Leaflet-Prüfung ausführen
15. Kontextsegmente schreiben
```

## 16.2 Headless zuerst

Die fachliche Logik muss zuerst ohne UI funktionieren.

Reihenfolge:

```txt
1. graphBasis.types.ts
2. graphBasis.mock.ts
3. graphBasis.validation.ts
4. graphBasis.graphBuilder.ts
5. graphBasis.layerComposer.ts
6. graphBasis.context.ts
7. graphBasis.test.ts
8. GraphBasisLayerPanel.tsx
9. graphBasis.leaflet.ts
```

## 16.3 Keine Fachlogik im UI-Container

Die React-Komponente darf nur anzeigen und Aktionen auslösen. Graphbau, Validierung, Layererzeugung und Kontextübergabe gehören in eigene Funktionen.

## 16.4 Reproduzierbarer Graphbau

Der Graph Builder muss deterministisch arbeiten.

Gleicher Input muss erzeugen:

- gleiche Knoten-IDs,
- gleiche Kanten-IDs,
- gleiche Shape-Punkt-IDs,
- gleiche Abschnittskandidaten,
- gleiche Layer-Features,
- gleiche Validierungsresultate.

IDs sollten aus stabilen Quellreferenzen, Sequenzpositionen und Representation-ID ableitbar sein.

## 16.5 Keine stille Datenlöschung

Panel 6 darf problematische Quellwege, kurze Kanten oder Randanschlüsse nicht still löschen.

Stattdessen:

- erhalten und markieren,
- als Warnung führen,
- bei blockierendem Fehler Übergabe verhindern,
- Quellreferenz beibehalten.

---

# 17. Kontextübergabe

Panel 6 schreibt nach erfolgreicher Validierung:

```json
{
  "scim_context": {
    "scim_context_id": "ctx_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "input_refs": {},
    "input_status": {},
    "status": "scim_context_valid"
  },
  "graph": {
    "graph_id": "graph_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "nodes": [],
    "edges": [],
    "shape_points": [],
    "boundary_connections": [],
    "route_section_candidates": [],
    "status": "graph_valid"
  },
  "basis_layer": {
    "basis_layer_id": "basis_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "operator_geojson": {},
    "status": "basis_layer_valid"
  },
  "leaflet_check": {
    "leaflet_check_id": "leaflet_basis_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "basis_layer_id": "basis_hochwab_nord_001",
    "status": "leaflet_basis_valid"
  }
}
```

Direkte Abnehmer:

- Panel 7: POI, Load und Bewegung,
- POI- und Aufenthaltsmodell,
- Load Processor,
- Aufenthaltslogik,
- Bewegungslogik,
- Maskierung,
- spätere Routenbewertung,
- spätere Layer Composer,
- spätere Leaflet-Wirkungsprüfung.

Wichtig:

Panel 6 übergibt noch keine `stay_areas`, keine `projected_loads`, keine `stay_loads`, keine `movement_loads`, keine `masked_edges`, keine final bewerteten `route_sections` und kein `sensus_core_package`.

---

# 18. Abhängigkeiten zu Panel 7

Panel 7 kann auf Panel 6 aufbauen, weil Panel 6 liefert:

- Graphknoten,
- Graphkanten,
- Shape-Punkte,
- POI-nahe Kandidatenreferenzen,
- Randanschlüsse,
- Kandidaten für Bewegungskanten,
- Kandidaten für spätere Maskierung,
- Kandidaten für Routenabschnitte,
- Basislayer zur visuellen Prüfung.

Panel 7 ergänzt darauf:

- POI- und Radiusmodell,
- Load-Projektion,
- Aufenthaltsklassifizierung,
- Bewegungsauslastung,
- Maskierung,
- Staustellenindikatoren.

---

# 19. Ausgelagerte Detailabschnitte

Die folgenden Abschnitte sind wegen Länge und besserer Handhabbarkeit in eine separate Markdown-Datei ausgelagert:



# 20. Mock-Daten

```ts
export const mockScimRuntimeContextState: ScimRuntimeContextState = {
  scim_context_id: 'ctx_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  created_at: '2026-05-21T00:00:00.000Z',
  checked_at: '2026-05-21T00:00:00.000Z',
  input_refs: {
    system_adjust_version: 'sys_v1.0.0',
    regio_content_version: 'regio_v1.0.0',
    target_app_ui_version: 'ui_v1.0.0',
    telco_load_batch_id: 'load_001',
    boundary_id: 'rep_hochwab_nord_001',
    extraction_id: 'ext_hochwab_nord_001'
  },
  input_status: {
    system_adjust_valid: true,
    regio_content_valid_or_absent: true,
    target_app_ui_valid_or_absent: true,
    telco_load_valid_warning_or_absent: true,
    boundary_valid: true,
    extraction_valid: true,
    privacy_blockers_present: false,
    can_build_graph: true
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z'
  },
  status: 'scim_context_valid'
};

export const mockGraphState: GraphState = {
  graph_id: 'graph_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  source_extraction_id: 'ext_hochwab_nord_001',
  created_at: '2026-05-21T00:00:00.000Z',
  graph_build_version: 'graph_build_v1.0.0',
  nodes: [
    {
      node_id: 'node_way_001_start',
      node_type: 'endpoint_node',
      coordinate: {
        type: 'Point',
        coordinates: [15.13, 47.62]
      },
      source_refs: [
        {
          source_type: 'extracted_way',
          source_id: 'way_001',
          source_feature_id: 'osm_way_001'
        }
      ],
      degree: 1,
      inside_boundary: true,
      inside_buffer_only: false,
      boundary_relation: 'inside_boundary',
      semantic_roles: ['routing_decision_point'],
      connected_edge_ids: ['edge_way_001_001']
    },
    {
      node_id: 'node_way_001_mid_semantic',
      node_type: 'semantic_intermediate_node',
      coordinate: {
        type: 'Point',
        coordinates: [15.18, 47.65]
      },
      source_refs: [
        {
          source_type: 'extracted_way',
          source_id: 'way_001',
          source_feature_id: 'osm_way_001'
        }
      ],
      degree: 2,
      inside_boundary: true,
      inside_buffer_only: false,
      boundary_relation: 'inside_boundary',
      semantic_roles: ['shape_promoted_for_scim', 'potential_stay_boundary'],
      connected_edge_ids: ['edge_way_001_001', 'edge_way_001_002']
    },
    {
      node_id: 'node_way_001_end',
      node_type: 'endpoint_node',
      coordinate: {
        type: 'Point',
        coordinates: [15.24, 47.69]
      },
      source_refs: [
        {
          source_type: 'extracted_way',
          source_id: 'way_001',
          source_feature_id: 'osm_way_001'
        }
      ],
      degree: 1,
      inside_boundary: true,
      inside_buffer_only: false,
      boundary_relation: 'inside_boundary',
      semantic_roles: ['routing_decision_point'],
      connected_edge_ids: ['edge_way_001_002']
    },
    {
      node_id: 'node_boundary_west_001',
      node_type: 'boundary_connector_node',
      coordinate: {
        type: 'Point',
        coordinates: [15.10, 47.66]
      },
      source_refs: [
        {
          source_type: 'boundary_connection',
          source_id: 'bc_001',
          source_feature_id: 'way_002'
        }
      ],
      degree: 1,
      inside_boundary: true,
      inside_buffer_only: false,
      boundary_relation: 'intersects_boundary',
      semantic_roles: ['boundary_connection', 'routing_decision_point'],
      connected_edge_ids: ['edge_way_002_boundary_001']
    }
  ],
  edges: [
    {
      edge_id: 'edge_way_001_001',
      from_node_id: 'node_way_001_start',
      to_node_id: 'node_way_001_mid_semantic',
      geometry: {
        type: 'LineString',
        coordinates: [
          [15.13, 47.62],
          [15.18, 47.65]
        ]
      },
      length_meters: 3600,
      source_way_refs: [
        {
          source_type: 'extracted_way',
          source_id: 'way_001',
          source_feature_id: 'osm_way_001'
        }
      ],
      way_class: 'trail',
      route_relevance: 'hiking_relevant',
      inside_boundary: true,
      inside_buffer_only: false,
      intersects_boundary: false,
      candidate_for_movement_load: true,
      candidate_for_route_section: true,
      candidate_for_stay_masking: true,
      semantic_flags: ['route_section_candidate', 'load_projection_candidate']
    },
    {
      edge_id: 'edge_way_001_002',
      from_node_id: 'node_way_001_mid_semantic',
      to_node_id: 'node_way_001_end',
      geometry: {
        type: 'LineString',
        coordinates: [
          [15.18, 47.65],
          [15.24, 47.69]
        ]
      },
      length_meters: 3600,
      source_way_refs: [
        {
          source_type: 'extracted_way',
          source_id: 'way_001',
          source_feature_id: 'osm_way_001'
        }
      ],
      way_class: 'trail',
      route_relevance: 'hiking_relevant',
      inside_boundary: true,
      inside_buffer_only: false,
      intersects_boundary: false,
      candidate_for_movement_load: true,
      candidate_for_route_section: true,
      candidate_for_stay_masking: true,
      semantic_flags: ['poi_adjacent_candidate', 'route_section_candidate', 'requires_later_masking_check']
    },
    {
      edge_id: 'edge_way_002_boundary_001',
      from_node_id: 'node_boundary_west_001',
      to_node_id: 'node_way_001_mid_semantic',
      geometry: {
        type: 'LineString',
        coordinates: [
          [15.10, 47.66],
          [15.16, 47.66],
          [15.18, 47.65]
        ]
      },
      length_meters: 4100,
      source_way_refs: [
        {
          source_type: 'extracted_way',
          source_id: 'way_002',
          source_feature_id: 'osm_way_002'
        }
      ],
      way_class: 'track',
      route_relevance: 'boundary_connector',
      inside_boundary: false,
      inside_buffer_only: false,
      intersects_boundary: true,
      candidate_for_movement_load: true,
      candidate_for_route_section: true,
      candidate_for_stay_masking: false,
      semantic_flags: ['boundary_crossing', 'route_section_candidate']
    }
  ],
  shape_points: [
    {
      shape_point_id: 'shape_way_001_001',
      coordinate: {
        type: 'Point',
        coordinates: [15.18, 47.65]
      },
      edge_id: 'edge_way_001_001',
      source_way_ref: {
        source_type: 'extracted_way',
        source_id: 'way_001',
        source_feature_id: 'osm_way_001'
      },
      sequence_index: 1,
      promoted_to_node_id: 'node_way_001_mid_semantic',
      promotion_reason: 'stay_area_boundary_candidate'
    }
  ],
  boundary_connections: [
    {
      connection_id: 'gbc_001',
      source_boundary_connection_id: 'bc_001',
      node_id: 'node_boundary_west_001',
      connected_edge_id: 'edge_way_002_boundary_001',
      connection_type: 'way_crosses_boundary',
      boundary_side: 'west',
      inside_to_outside: true,
      requires_graph_continuation: true,
      status: 'preserved'
    }
  ],
  route_section_candidates: [
    {
      section_candidate_id: 'section_candidate_001',
      edge_ids: ['edge_way_001_001', 'edge_way_001_002'],
      from_node_id: 'node_way_001_start',
      to_node_id: 'node_way_001_end',
      total_length_meters: 7200,
      section_type: 'between_topological_nodes',
      inside_boundary: true,
      touches_buffer: false,
      ready_for_route_evaluation: true,
      notes: ['Prepared only; no load or route score calculated in Panel 6.']
    },
    {
      section_candidate_id: 'section_candidate_boundary_001',
      edge_ids: ['edge_way_002_boundary_001'],
      from_node_id: 'node_boundary_west_001',
      to_node_id: 'node_way_001_mid_semantic',
      total_length_meters: 4100,
      section_type: 'boundary_to_topological_node',
      inside_boundary: false,
      touches_buffer: true,
      ready_for_route_evaluation: true,
      notes: ['Boundary connector preserved for later route continuity.']
    }
  ],
  graph_summary: {
    node_count: 4,
    edge_count: 3,
    shape_point_count: 1,
    promoted_shape_point_count: 1,
    boundary_connection_count: 1,
    route_section_candidate_count: 2,
    isolated_edge_count: 0,
    warning_count: 0,
    error_count: 0
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_extraction_id: 'ext_hochwab_nord_001',
    checked_against_system_adjust_version: 'sys_v1.0.0'
  },
  status: 'graph_valid'
};

export const mockBasisLayerState: BasisLayerState = {
  basis_layer_id: 'basis_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  graph_id: 'graph_hochwab_nord_001',
  created_at: '2026-05-21T00:00:00.000Z',
  layer_format: 'geojson',
  operator_geojson: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [15.13, 47.62],
            [15.18, 47.65]
          ]
        },
        properties: {
          feature_type: 'graph_edge',
          edge_id: 'edge_way_001_001',
          graph_id: 'graph_hochwab_nord_001',
          way_class: 'trail',
          route_relevance: 'hiking_relevant',
          data_class: 'operator_internal'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [15.10, 47.66]
        },
        properties: {
          feature_type: 'boundary_connector_node',
          node_id: 'node_boundary_west_001',
          connection_id: 'gbc_001',
          data_class: 'operator_internal'
        }
      }
    ]
  },
  graph_debug_geojson: {
    type: 'FeatureCollection',
    features: []
  },
  sensus_core_candidate_geojson: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [15.13, 47.62],
            [15.18, 47.65]
          ]
        },
        properties: {
          feature_type: 'base_path',
          public_layer_candidate: true,
          data_class: 'reduced_scim_result'
        }
      }
    ]
  },
  layer_summary: {
    operator_feature_count: 2,
    debug_feature_count: 0,
    sensus_core_candidate_feature_count: 1,
    contains_raw_signals: false,
    contains_debug_in_sensus_core_candidate: false,
    contains_device_data: false
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_graph_id: 'graph_hochwab_nord_001'
  },
  status: 'basis_layer_valid'
};

export const mockLeafletBasisCheckState: LeafletBasisCheckState = {
  leaflet_check_id: 'leaflet_basis_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  graph_id: 'graph_hochwab_nord_001',
  basis_layer_id: 'basis_hochwab_nord_001',
  checked_at: '2026-05-21T00:00:00.000Z',
  visible_overlays: [
    'boundary',
    'buffer',
    'extracted_ways',
    'graph_edges',
    'graph_nodes',
    'boundary_connections',
    'basis_layer'
  ],
  check_items: [
    {
      check_id: 'leaflet_check_001',
      label: 'Boundary and graph overlap',
      status: 'passed',
      message: 'Graph edges lie within boundary or documented buffer connectors.'
    },
    {
      check_id: 'leaflet_check_002',
      label: 'Boundary connections visible',
      status: 'passed',
      message: 'All extracted boundary connections are visible in the Leaflet check.'
    }
  ],
  issues: [],
  status: 'leaflet_basis_valid'
};
```

Zusätzliche Hilfstypen für Mock und Tests:

```ts
export interface GraphSourceRef {
  source_type:
    | 'extracted_way'
    | 'poi_candidate'
    | 'approved_poi'
    | 'regional_restriction'
    | 'boundary_connection'
    | 'load_signal_ref';
  source_id: string;
  source_feature_id?: string;
}

export type BoundaryRelation =
  | 'inside_boundary'
  | 'inside_buffer_only'
  | 'intersects_boundary'
  | 'outside_scope';

export interface GraphSummary {
  node_count: number;
  edge_count: number;
  shape_point_count: number;
  promoted_shape_point_count: number;
  boundary_connection_count: number;
  route_section_candidate_count: number;
  isolated_edge_count: number;
  warning_count: number;
  error_count: number;
}

export interface BasisLayerSummary {
  operator_feature_count: number;
  debug_feature_count: number;
  sensus_core_candidate_feature_count: number;
  contains_raw_signals: boolean;
  contains_debug_in_sensus_core_candidate: boolean;
  contains_device_data: boolean;
}

export interface LeafletBasisCheckItem {
  check_id: string;
  label: string;
  status: 'passed' | 'warning' | 'failed';
  message: string;
  related_id?: string;
}

export interface LeafletBasisIssue {
  issue_id: string;
  severity: 'warning' | 'error';
  message: string;
  related_id?: string;
}
```

---

# 21. Übergabe an spätere Panels

Panel 6 schreibt folgende Kontextsegmente:

```json
{
  "scim_context": {
    "scim_context_id": "ctx_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "input_refs": {
      "system_adjust_version": "sys_v1.0.0",
      "regio_content_version": "regio_v1.0.0",
      "target_app_ui_version": "ui_v1.0.0",
      "telco_load_batch_id": "load_001",
      "boundary_id": "rep_hochwab_nord_001",
      "extraction_id": "ext_hochwab_nord_001"
    },
    "status": "scim_context_valid"
  },
  "graph": {
    "graph_id": "graph_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "source_extraction_id": "ext_hochwab_nord_001",
    "nodes": [],
    "edges": [],
    "shape_points": [],
    "boundary_connections": [],
    "route_section_candidates": [],
    "status": "graph_valid"
  },
  "basis_layer": {
    "basis_layer_id": "basis_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "operator_geojson": {},
    "graph_debug_geojson": {},
    "sensus_core_candidate_geojson": {},
    "status": "basis_layer_valid"
  },
  "leaflet_check": {
    "leaflet_check_id": "leaflet_basis_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "basis_layer_id": "basis_hochwab_nord_001",
    "status": "leaflet_basis_valid"
  }
}
```

Direkte Abnehmer:

- Panel 7: POI, Load und Bewegung
- POI- und Aufenthaltsmodell
- Load Processor
- Aufenthaltslogik
- Bewegungslogik
- Maskierungslogik
- Staustellenindikatoren
- spätere Routenbewertung
- spätere Layer Composer
- spätere Leaflet-Wirkungsprüfung

Wichtig:

Panel 6 übergibt noch keine finalen Aufenthaltsbereiche, keine Load-Projektionen, keine Bewegungsauslastung, keine Maskierungen, keine finalen Routenabschnittsbewertungen, keine Routenvorschläge und kein Sensus-Core-Paket.

---

# 22. Akzeptanzkriterien

## 22.1 Kontextprüfung

- Ein gültiger Kontext aus System-Adjust, Boundary und Extraktion kann geprüft werden.
- Fehlendes `context.system_adjust` erzeugt einen blockierenden Fehler.
- Fehlende `context.boundary` erzeugt einen blockierenden Fehler.
- Fehlende `context.extracted_data` erzeugt einen blockierenden Fehler.
- Unterschiedliche `representation_id` zwischen Boundary und Extraktion erzeugen einen blockierenden Fehler.
- Ein Extraktionspaket ohne wanderrelevante Wege blockiert den Graphbau.
- Regio-Content, Ziel-App UI und Telco-Load dürfen fehlen, erzeugen aber je nach Projektstandard Warnungen und keine Blocker, sofern sie für den Graphbau nicht zwingend sind.

## 22.2 Graph Builder

- Aus gültigen extrahierten Wegen wird ein Graph erzeugt.
- Endpunkte werden als Knoten erzeugt.
- Kreuzungen oder geteilte Punkte werden als topologische Knoten erzeugt.
- Shape-Punkte werden erhalten und nicht automatisch zu topologischen Knoten gemacht.
- Semantisch relevante Shape-Punkte können begründet aufgewertet werden.
- Jede Kante hat Startknoten, Endknoten, Geometrie, Länge und Quellreferenz.
- Randanschlüsse aus Panel 5 bleiben erhalten.
- Abschnittskandidaten werden vorbereitet, aber nicht bewertet.

## 22.3 Graphvalidierung

- Ein Graph ohne Knoten ist ungültig.
- Ein Graph ohne Kanten ist ungültig.
- Kanten mit fehlendem Start- oder Endknoten sind ungültig.
- Kanten mit ungültiger oder leerer Geometrie sind ungültig.
- Kanten mit Länge `<= 0` sind ungültig.
- Fehlende relevante Randanschlüsse sind blockierende Fehler.
- Isolierte Kanten erzeugen mindestens Warnungen.
- Kurze, aber topologisch notwendige Kanten werden nicht still entfernt.

## 22.4 Datenschutz

- Graphobjekte enthalten keine Rohsignale.
- Graphobjekte enthalten keine Geräte-IDs.
- Basislayer enthalten keine Einzeltraces.
- Sensus-Core-Kandidatenlayer enthalten keine Debug-Daten.
- Sensus-Core-Kandidatenlayer enthalten keine Operator-internen Rohprüfwerte.
- Load-Referenzen bleiben Referenzen und werden nicht als punktgenaue Bewegungsdaten materialisiert.

## 22.5 Basislayer

- Aus einem gültigen Graphen kann ein Operator-Basislayer erzeugt werden.
- Der Operator-Basislayer enthält Kantenfeatures.
- Der Operator-Basislayer kann Knoten und Randanschlüsse enthalten.
- Debug-Layer sind getrennt vom Sensus-Core-Kandidatenlayer.
- Der Sensus-Core-Kandidatenlayer enthält nur reduzierte, unkritische Basisinformationen.
- Der Basislayer enthält noch keine Auslastungsfarben und keine Aufenthaltsmaskierung.

## 22.6 Leaflet-Prüfung

- Boundary und Buffer können gemeinsam mit Graphkanten angezeigt werden.
- Extrahierte Wege können gegen Graphkanten verglichen werden.
- Graphknoten können ein- und ausgeblendet werden.
- Shape-Punkte können optional angezeigt werden.
- Randanschlüsse sind visuell prüfbar.
- Problemobjekte können in der Karte fokussiert werden.
- Die Leaflet-Prüfung erzeugt Status, Warnungen und Fehler, aber keine fachliche Routenbewertung.

## 22.7 Kontextübergabe

- Die Übergabe verändert ausschließlich `context.scim_context`, `context.graph`, `context.basis_layer` und `context.leaflet_check`.
- Kein Input-Kontextbereich wird überschrieben.
- Ungültiger Kontext blockiert die Übergabe.
- Ungültiger Graph blockiert die Übergabe.
- Ungültiger Basislayer blockiert die Übergabe.
- Warnungen erlauben die Übergabe nur, wenn keine blockierenden Fehler vorhanden sind.

## 22.8 UI

- Das Panel zeigt Kontextprüfung, Graphaufbau, Graphprüfung, Basislayer und Leaflet-Prüfung getrennt an.
- Blockierende Fehler sind klar erkennbar.
- Warnungen sind klar erkennbar.
- Folgeaktionen sind gesperrt, solange der jeweils vorausgehende Schritt ungültig ist.
- Der Graph Builder kann headless getestet werden, ohne Leaflet rendern zu müssen.

## 22.9 Tests

- Unit-Tests für Kontextvalidator vorhanden.
- Unit-Tests für Graph Builder vorhanden.
- Unit-Tests für Graphvalidierung vorhanden.
- Unit-Tests für Shape-Punkt-Behandlung vorhanden.
- Unit-Tests für Randanschluss-Erhalt vorhanden.
- Unit-Tests für Basislayer-Composer vorhanden.
- Unit-Tests für Verbot von Rohsignal- und Debugdaten im Sensus-Core-Kandidatenlayer vorhanden.
- Unit-Tests für Kontextübergabe vorhanden.
- Mock-Daten-Test vorhanden.

---

# 23. Testfälle

## 23.1 Gültiger Mock

Input:

```ts
validSystemAdjust
validBoundary
validExtraction
validRegioContent
validTargetAppUi
validTelcoLoad
```

Erwartung:

```ts
scimContext.validation.is_valid === true
graph.validation.is_valid === true
basisLayer.validation.is_valid === true
scimContext.status === 'scim_context_valid'
graph.status === 'graph_valid'
basisLayer.status === 'basis_layer_valid'
```

## 23.2 System-Adjust fehlt

Input:

```ts
context.system_adjust = undefined
context.boundary = mockBoundaryState
context.extracted_data = mockExtractionState
```

Erwartung:

```ts
errors includes GB_CONTEXT_SYSTEM_ADJUST_MISSING
validation.is_valid === false
buildScimGraph is blocked
```

## 23.3 Boundary fehlt

Input:

```ts
context.system_adjust = validSystemAdjust
context.boundary = undefined
context.extracted_data = mockExtractionState
```

Erwartung:

```ts
errors includes GB_CONTEXT_BOUNDARY_MISSING
validation.is_valid === false
```

## 23.4 Extraktion fehlt

Input:

```ts
context.system_adjust = validSystemAdjust
context.boundary = mockBoundaryState
context.extracted_data = undefined
```

Erwartung:

```ts
errors includes GB_CONTEXT_EXTRACTION_MISSING
validation.is_valid === false
```

## 23.5 Representation-Mismatch

Mutation:

```ts
context.boundary.representation_id = 'rep_a'
context.extracted_data.representation_id = 'rep_b'
```

Erwartung:

```ts
errors includes GB_CONTEXT_REPRESENTATION_MISMATCH
validation.is_valid === false
```

## 23.6 Keine Wege in Extraktion

Mutation:

```ts
context.extracted_data.ways = []
```

Erwartung:

```ts
errors includes GB_EXTRACTION_NO_WAYS
validation.is_valid === false
buildScimGraph is blocked
```

## 23.7 Kante referenziert fehlenden Knoten

Mutation nach Graphbau:

```ts
graph.edges[0].from_node_id = 'missing_node'
```

Erwartung:

```ts
errors includes GB_GRAPH_EDGE_NODE_MISSING
graph.validation.is_valid === false
```

## 23.8 Ungültige Kantengeometrie

Mutation:

```ts
graph.edges[0].geometry.coordinates = []
```

Erwartung:

```ts
errors includes GB_GRAPH_EDGE_GEOMETRY_INVALID
graph.validation.is_valid === false
```

## 23.9 Kantenlänge ungültig

Mutation:

```ts
graph.edges[0].length_meters = 0
```

Erwartung:

```ts
errors includes GB_GRAPH_EDGE_LENGTH_INVALID
graph.validation.is_valid === false
```

## 23.10 Randanschluss geht verloren

Mutation:

```ts
graph.boundary_connections = []
```

bei vorhandener `context.extracted_data.boundary_connections.length > 0`.

Erwartung:

```ts
errors includes GB_GRAPH_BOUNDARY_CONNECTION_LOST
graph.validation.is_valid === false
```

## 23.11 Rohsignal im Graph-Metadata verboten

Mutation:

```ts
graph.edges[0].metadata = {
  raw_signal_payload: { device_id: 'forbidden' }
}
```

Erwartung:

```ts
errors includes GB_GRAPH_RAW_SIGNAL_FORBIDDEN
graph.validation.is_valid === false
```

## 23.12 Debugdaten im Sensus-Core-Kandidatenlayer verboten

Mutation:

```ts
basisLayer.sensus_core_candidate_geojson.features[0].properties = {
  data_class: 'debug',
  debug_node_degree: 3
}
```

Erwartung:

```ts
errors includes GB_LAYER_DEBUG_IN_SENSUS_CORE_FORBIDDEN
basisLayer.validation.is_valid === false
```

## 23.13 Rohsignal im Sensus-Core-Kandidatenlayer verboten

Mutation:

```ts
basisLayer.sensus_core_candidate_geojson.features[0].properties = {
  data_class: 'raw_signal',
  signal_group_id: 'sg_001'
}
```

Erwartung:

```ts
errors includes GB_LAYER_RAW_SIGNAL_IN_SENSUS_CORE_FORBIDDEN
basisLayer.validation.is_valid === false
```

## 23.14 Kontextschutz

Input:

```ts
const contextBefore = {
  system_adjust: validSystemAdjust,
  regio_content: validRegioContent,
  target_app_ui: validTargetAppUi,
  telco_load: validTelcoLoad,
  boundary: validBoundary,
  extracted_data: validExtraction,
  poi_model: { existing: true },
  route_model: { existing: true }
};
```

Aktion:

```ts
const contextAfter = applyGraphAndBasisLayerToContext(
  contextBefore,
  validScimContext,
  validGraph,
  validBasisLayer,
  validLeafletCheck
);
```

Erwartung:

```ts
contextAfter.scim_context exists
contextAfter.graph exists
contextAfter.basis_layer exists
contextAfter.leaflet_check exists
contextAfter.system_adjust === contextBefore.system_adjust
contextAfter.regio_content === contextBefore.regio_content
contextAfter.target_app_ui === contextBefore.target_app_ui
contextAfter.telco_load === contextBefore.telco_load
contextAfter.boundary === contextBefore.boundary
contextAfter.extracted_data === contextBefore.extracted_data
contextAfter.poi_model === contextBefore.poi_model
contextAfter.route_model === contextBefore.route_model
```

---

# 24. Umsetzungshinweise für Codex/Claude

## 24.1 Erst headless bauen

Zuerst sollen Typen, Mock-Daten, Kontextvalidator, Graph Builder, Graphvalidierung, Layer Composer und Kontextübergabe gebaut werden. Die UI und Leaflet-Integration kommen danach.

Reihenfolge:

```txt
1. graphBasis.types.ts
2. graphBasis.mock.ts
3. graphBasis.validation.ts
4. graphBasis.graphBuilder.ts
5. graphBasis.layerComposer.ts
6. graphBasis.context.ts
7. graphBasis.test.ts
8. GraphBasisLayerPanel.tsx
9. graphBasis.leaflet.ts
```

## 24.2 Keine Fachlogik im UI-Container

Die React-Komponente darf nur anzeigen und Aktionen auslösen.

Nicht in die Komponente gehören:

- Kontextvalidierung,
- Graphbau,
- Graphvalidierung,
- Basislayer-Erzeugung,
- Datenschutzprüfung,
- Kontextübergabe.

Diese Logik gehört in testbare, headless ausführbare Module.

## 24.3 Deterministische IDs

IDs müssen stabil bleiben, damit Tests, Debugging und spätere Paketversionierung reproduzierbar sind.

Empfehlung:

```txt
node_<sourceWayId>_<role>_<sequence>
edge_<sourceWayId>_<sequence>
shape_<sourceWayId>_<sequence>
section_candidate_<fromNodeId>_<toNodeId>_<sequence>
```

Bei echten Implementierungen können Hashes verwendet werden, solange sie deterministisch aus Representation-ID, Quellreferenz und Sequenz gebildet werden.

## 24.4 Shape-Punkte nicht falsch aufblasen

Shape-Punkte dürfen nicht automatisch zu topologischen Knoten werden. Sonst entstehen zu viele scheinbare Entscheidungspunkte und die spätere Abschnittsbildung wird falsch.

Aufwertung nur bei klarem Grund:

- Boundary-Schnitt,
- POI-Nähe,
- potenzielle Aufenthaltsgrenze,
- potenzielle Maskierungsgrenze,
- potenzielle Staustellengrenze,
- notwendiger Split für Abschnittskandidaten.

## 24.5 Randanschlüsse erhalten

Randanschlüsse sind für spätere Alternativrouten und stabile Graphberechnung wichtig.

Nicht erlaubt:

- Wege an der Boundary hart abschneiden und Anschlussinformation verlieren,
- Buffer-only-Anschlüsse still entfernen,
- Randanschlüsse ohne Warnung aus dem Graphen verlieren.

## 24.6 Datenschutz im Basislayer

Der Basislayer ist noch nicht das Sensus-Core-Paket. Trotzdem muss früh getrennt werden:

- Operator-Layer,
- Debug-Layer,
- Sensus-Core-Kandidatenlayer.

Sensus-Core-Kandidaten dürfen niemals enthalten:

- Rohsignale,
- Geräte-IDs,
- Einzeltraces,
- Debugattribute,
- Operator-interne Prüffelder.

## 24.7 Keine Load-Berechnung vorwegnehmen

Panel 6 darf Load-Referenzen höchstens räumlich und strukturell mitführen. Die eigentliche Load-Projektion gehört in Panel 7.

Nicht in Panel 6 bauen:

- `projected_loads`,
- `stay_loads`,
- `movement_loads`,
- `masked_edges`,
- `jam_indicators`,
- finale `route_sections`.

## 24.8 Leaflet nur als Prüfung

Leaflet-Komponenten sollen den Graphen nicht erzeugen und nicht verändern.

Leaflet darf:

- anzeigen,
- überlagern,
- fokussieren,
- Problemstellen markieren,
- visuelle Prüfung speichern.

Leaflet darf nicht:

- topologische Knoten berechnen,
- Kanten splitten,
- Shape-Punkte aufwerten,
- Graphdaten mutieren,
- Sensus-Core-Outputs erzeugen.

---

# 25. Kompakter Codex-Auftrag für Panel 6

```text
Baue Panel 6: Graph und Basislayer für die SCIM.

Kontext:
SCIM ist ein Gesamtsystem aus Input-Schicht, Validierung, SCIM-Engine, Graph- und Layer-Erzeugung, Sensus-Core-Paketierung, lokaler Anwendung und Freigabe. Sensus Core ist die SCIM am Endgerät. Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug, nicht der Engine-Kern.

Panel 6 folgt auf Panel 5: Boundary und Extraktion. Panel 6 darf die vorhandenen Kontextbereiche lesen, aber nur `context.scim_context`, `context.graph`, `context.basis_layer` und `context.leaflet_check` schreiben.

Aufgabe:
Baue nur Panel 6. Das Panel validiert den baubaren SCIM-Kontext, erzeugt aus extrahierten Wegen einen SCIM-Arbeitsgraphen, prüft diesen Graphen, erzeugt daraus einen technischen Basislayer und ermöglicht eine Leaflet-Basisprüfung.

Pflichtinputs:
- `context.system_adjust`
- `context.boundary`
- `context.extracted_data`

Optionale Kontextinputs:
- `context.regio_content`
- `context.target_app_ui`
- `context.telco_load`

Nicht-Ziele:
Keine Änderung von System-Adjust, Regio-Content, Ziel-App UI, Telco-Load, Boundary oder Extraktion. Keine POI-Aufenthaltsberechnung. Keine Load-Projektion. Keine Bewegungsauslastung. Keine Maskierung. Keine Routenbewertung. Kein Sensus-Core-Paket. Keine Freigabe.

Baue folgende Module:
1. `graphBasis.types.ts`
2. `graphBasis.mock.ts`
3. `graphBasis.validation.ts`
4. `graphBasis.graphBuilder.ts`
5. `graphBasis.layerComposer.ts`
6. `graphBasis.context.ts`
7. `graphBasis.test.ts`
8. `GraphBasisLayerPanel.tsx`
9. `graphBasis.leaflet.ts`

Datenmodelle:
- `ScimRuntimeContextState`
- `GraphState`
- `GraphNode`
- `GraphEdge`
- `GraphShapePoint`
- `GraphBoundaryConnection`
- `RouteSectionCandidate`
- `BasisLayerState`
- `LeafletBasisCheckState`

Validierung:
- System-Adjust muss vorhanden und gültig sein.
- Boundary muss vorhanden und gültig sein.
- Extraktion muss vorhanden und gültig sein.
- Boundary und Extraktion müssen dieselbe `representation_id` haben.
- Extraktion braucht mindestens einen wanderrelevanten Weg.
- Graph braucht Knoten und Kanten.
- Jede Kante braucht gültige Start- und Endknoten.
- Jede Kante braucht gültige LineString-Geometrie und positive Länge.
- Randanschlüsse aus der Extraktion müssen erhalten bleiben.
- Graph und Basislayer dürfen keine Rohsignale, Geräte-IDs oder Einzeltraces enthalten.
- Sensus-Core-Kandidatenlayer dürfen keine Debugdaten oder Rohsignal-Datenklassen enthalten.

Graph Builder:
- Endpunkte, Kreuzungen und Randanschlüsse als topologische Knoten erzeugen.
- Shape-Punkte erhalten.
- Shape-Punkte nur bei fachlichem Grund zu semantischen Zwischenknoten aufwerten.
- Kanten zwischen Knoten erzeugen.
- Quellreferenzen erhalten.
- Kandidaten für spätere Bewegungskanten, Maskierung und Routenabschnitte markieren.
- Abschnittskandidaten vorbereiten, aber nicht bewerten.

Basislayer:
- Operator-GeoJSON aus Graph erzeugen.
- Debug-GeoJSON getrennt erzeugen.
- Sensus-Core-Kandidatenlayer nur reduziert und ohne Debug-/Rohdaten vorbereiten.
- Keine Auslastungsfarben, keine Aufenthaltsbereiche, keine Routenbewertung.

UI:
Tabs:
1. Kontextprüfung
2. Graph erzeugen
3. Graph prüfen
4. Basislayer erzeugen
5. Leaflet-Prüfung

Tests:
- gültiger Mock
- fehlender System-Adjust
- fehlende Boundary
- fehlende Extraktion
- Representation-Mismatch
- Extraktion ohne Wege
- Kante mit fehlendem Knoten
- ungültige Kantengeometrie
- Kantenlänge 0
- verlorener Randanschluss
- Rohsignal im Graph verboten
- Debugdaten im Sensus-Core-Kandidatenlayer verboten
- Kontextübergabe überschreibt keine fremden Bereiche

Kernaussage:
Panel 6 macht aus Boundary und Extraktion eine stabile, prüfbare SCIM-Netztopologie und einen technischen Basislayer. Es berechnet noch keine Auslastung und keine Routenentscheidung.
```

---

# 26. Kernaussage für Panel 6

> Panel 6 ist der erste baubare Engine-Block nach Boundary und Extraktion. Es validiert den gemeinsamen SCIM-Kontext, erzeugt den Arbeitsgraphen, trennt topologische Knoten von Shape-Punkten, erhält Randanschlüsse, bereitet Abschnittskandidaten vor und erzeugt einen prüfbaren Basislayer. Alles, was Aufenthaltsklassifizierung, Load-Projektion, Bewegungsauslastung, Maskierung oder Routenbewertung betrifft, bleibt den folgenden Panels vorbehalten.
