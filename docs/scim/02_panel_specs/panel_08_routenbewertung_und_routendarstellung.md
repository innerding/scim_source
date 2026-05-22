# SCIM Panel 8 – Routenbewertung und Routendarstellung

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor den konkreten Panel-Auftrag. Sie stellt sicher, dass Panel 8 nicht als isolierte Routentabelle, Leaflet-Linie oder UI-Sortierung gebaut wird, sondern als dritter baubarer Engine-Block nach Graph/Basislayer und POI/Load/Bewegung.

### 0.1 SCIM-Gesamtsystem

SCIM ist ein Gesamtsystem aus:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokaler Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 8 liegt im rechnerischen SCIM-Kern und an der Grenze zur darstellbaren Routenlogik. Es nimmt den validierten SCIM-Kontext, den Graphen, das POI-Modell, die Load-Projektion, das Bewegungsmodell und das Maskierungsmodell aus Panel 7 auf und erzeugt daraus:

- bewertete routenrelevante Abschnitte,
- Abschnittsstatus für Routenvorschläge,
- Bewegungsbewertung je Abschnitt,
- Aufenthaltskontext je Abschnitt,
- Abwertung, Warnung oder Ausschluss je Profil,
- routenbezogene Layer für Leaflet,
- Leaflet-Routenprüfung.

Panel 8 erzeugt noch kein endgültiges Sensus-Core-Paket. Es liefert aber die zentrale fachliche Grundlage für Panel 9: Sensus-Core Package Builder.

### 0.2 Rollenklärung

**SCIM-Engine**  
Der rechnerische Kern. In Panel 8 wird die Auslastungsgrundlage aus Panel 7 in routingrelevante Entscheidungen übersetzt. Dabei werden Bewegungsauslastung, Aufenthaltskontext, Maskierung, regionale Sperren, Routentypen und Ziel-App-Profile zusammengeführt.

**Leaflet**  
Leaflet ist Prüf- und Darstellungswerkzeug. In Panel 8 wird Leaflet genutzt, um bewertete Routenabschnitte, abgewertete Abschnitte, ausgeschlossene Abschnitte, Warnbereiche und Routenvorschläge visuell gegen Basisgraph und Originalwege zu prüfen. Leaflet berechnet die Bewertung nicht.

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät beziehungsweise in der laufzeitnahen App-Representation. Panel 8 erzeugt noch kein Sensus-Core-Paket, muss seine Ergebnisse aber so strukturieren, dass Panel 9 sie datenschutzkonform und ziel-app-gerecht reduzieren kann.

**Routenbewertung und Routendarstellung**  
Panel 8 verbindet sechs fachlich gekoppelte Schritte:

- Routenabschnitte aus Graph-Abschnittskandidaten und Bewegungskanten bilden,
- Bewegungsauslastung je Routenabschnitt bewerten,
- Aufenthaltsbereiche, Maskierungen und POI-Kontext je Abschnitt prüfen,
- regionale Sperren, Hinweise und Staustellenindikatoren einbeziehen,
- Abschnitt je Routentyp warnen, abwerten oder ausschließen,
- Routendarstellung und Leaflet-Vergleich erzeugen.

Leitsatz:

> Panel 8 entscheidet nicht, ob ein Signal Aufenthalt oder Bewegung ist. Panel 8 entscheidet, wie bereits berechnete Aufenthalt-, Bewegungs-, Maskierungs- und Staustelleninformationen auf Routenabschnitte und Routenvorschläge wirken.

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
  route_model?: RouteModelState;
  route_layer_model?: RouteLayerModelState;
  leaflet_route_check?: LeafletRouteCheckState;
  layer_model?: unknown;
  sensus_core_package?: unknown;
  local_user_context?: unknown;
  view_state?: unknown;
  release?: unknown;
  status?: ScimGlobalStatus;
}
```

Panel 8 darf schreiben in:

```ts
context.route_model
context.route_layer_model
context.leaflet_route_check
```

Panel 8 darf lesen aus:

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
```

Panel 8 darf nicht schreiben in:

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

Panel 8 ist besonders wichtig, weil hier aus fachlicher Auslastungsberechnung tatsächliche Routenwirkung entsteht. Wenn diese Übersetzung unsauber ist, werden Routen zu hart blockiert, zu weich bewertet oder datenschutzkritische Details in Routenvorschläge übernommen.

---

## 0.5 Datenschutzgrenze

Panel 8 darf keine Datenschutzgrenzen aufweichen. Es verarbeitet ausschließlich bereits berechnete, aggregierte und validierte Ergebnisse aus vorgelagerten Panels.

Nicht erlaubt:

- Rohsignale übernehmen,
- Geräte-IDs speichern,
- Einzeltraces rekonstruieren,
- einzelne Standortpunkte als Routenargument verwenden,
- exakte Signalzahlen in Sensus-Core-Kandidaten übernehmen, falls Reduktion dies verbietet,
- Debug- oder Operatorwerte als öffentliche Routendaten markieren,
- Routenentscheidungen auf nicht aggregierte oder privacy-blocked Signalgruppen stützen.

Panel 8 darf technische Operator- und Debugdiagnosen erzeugen. Diese müssen aber strikt von `sensus_core_candidate_geojson`, `route_options` und späteren Sensus-Core-Ausgaben getrennt bleiben.

---

## 0.6 System-Adjust-Vorrang

Panel 8 ist abhängig von `context.system_adjust`.

Ohne gültigen System-Adjust-Stand dürfen keine runtime-gültigen Routenbewertungen, Routenlayer oder Routenvorschläge entstehen.

System-Adjust begrenzt für Panel 8 insbesondere:

- zulässige Abwertungs- und Ausschlussschwellen,
- Mindestaggregation für routenrelevante Auslastung,
- zulässige Bewegungs- und Aufenthaltslastgrenzen,
- zulässiges Grenzwertverhalten,
- Datenschutz- und Reduktionsgrenzen,
- Feature Flags für Routenbewertung, Staustellenwirkung, Leaflet-Debug und Sensus-Core-Export,
- zulässige User-Toleranzbereiche für spätere lokale Anwendung.

---

## 0.7 Regio-Content-Abhängigkeit

Panel 8 nutzt `context.regio_content` für:

- regionale Routenparameter,
- Abwertungs- und Ausschlussschwellen,
- Fallback-Regeln,
- Routentyp-Profile,
- regionale Sperren mit Routenwirkung,
- regionale Hinweise und Warnungen,
- regionale Staustellenprüfung.

Panel 8 darf Regio-Content nicht verändern. Es darf regionale Parameter nur anwenden, wenn sie bereits validiert und freigegeben sind.

---

## 0.8 Ziel-App-UI-Abhängigkeit

Panel 8 nutzt `context.target_app_ui` für:

- verfügbare Routentypen,
- erlaubte Grenzwertverhalten,
- Warnlogik bei abgewerteten oder ausgeschlossenen Abschnitten,
- Vorbereitung späterer lokaler User-Regler,
- Reduktionsanforderungen für Routenlayer und Routenvorschläge.

Panel 8 darf keine lokalen User-Einstellungen anwenden. Es bereitet nur route-profile- und app-profilfähige Ergebnisse für spätere Panels vor.

---

## 0.9 Graph- und Panel-7-Abhängigkeit

Panel 8 ist direkt abhängig von:

```ts
context.graph
context.poi_model
context.load_model
context.movement_model
context.masking_model
```

Erforderlich sind:

- gültiger Graph,
- vorbereitete RouteSectionCandidates,
- gültige Bewegungsauslastungen,
- dokumentierte Maskierungen,
- dokumentierte Aufenthaltsbereiche,
- dokumentierte Staustellenindikatoren,
- nachvollziehbarer Signalverbrauch,
- keine Doppelverwertung von Load-Gruppen.

Ohne gültiges Bewegungs- und Maskierungsmodell darf Panel 8 keine belastbare Routenbewertung erzeugen. Ein `loadless_route_mode` kann später optional erlaubt werden, erzeugt dann aber nur klassische oder strukturelle Routen ohne SCIM-Auslastungsbewertung.

---

## 0.10 Trennung von Darstellung, Abschnittsbewertung und Routenvorschlag

Panel 8 muss drei Ebenen strikt trennen:

1. **Abschnittsbewertung**  
   Bewertung einzelner routenrelevanter Abschnitte aus Bewegung, Aufenthalt, Maskierung, Staustellen und Sperren.

2. **Routenoptionen**  
   Zusammenstellung oder Bewertung von Routenvarianten anhand mehrerer Abschnitte und Routentypen.

3. **Routendarstellung**  
   Leaflet-taugliche Darstellung bewerteter Abschnitte und Routenoptionen, getrennt nach Operator-, Debug- und Sensus-Core-Kandidaten.

Ein Abschnitt kann sichtbar bleiben, obwohl er für einen Routentyp abgewertet oder ausgeschlossen ist. Umgekehrt darf ein Abschnitt in der Routensortierung relevant sein, ohne alle technischen Bewertungsdetails in der Ziel-App zu zeigen.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**Routenbewertung und Routendarstellung**

Technischer Modulname:

```ts
RouteEvaluationDisplayPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
buildRouteSections()
validateRouteSections()
evaluateRouteSectionMovement()
evaluateRouteSectionStayContext()
applyRouteRestrictions()
applyRouteProfiles()
buildRouteOptions()
composeRouteLayers()
validateRouteLayers()
runLeafletRouteCheck()
applyRouteEvaluationToContext()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/route-evaluation-display/
  RouteEvaluationDisplayPanel.tsx
  routeEvaluation.types.ts
  routeEvaluation.schema.ts
  routeEvaluation.defaults.ts
  routeEvaluation.mock.ts
  routeEvaluation.validation.ts
  routeEvaluation.sections.ts
  routeEvaluation.movement.ts
  routeEvaluation.stayContext.ts
  routeEvaluation.restrictions.ts
  routeEvaluation.profiles.ts
  routeEvaluation.options.ts
  routeEvaluation.layerComposer.ts
  routeEvaluation.leaflet.ts
  routeEvaluation.context.ts
  routeEvaluation.test.ts
```

---

# 2. Zweck des Panels

Panel 8 erzeugt aus Graph, Bewegungsauslastung, Aufenthaltskontext, Maskierung, regionalen Routenvorgaben und Ziel-App-Profilen ein bewertetes Routenmodell.

Es beantwortet für spätere Panels:

- Welche routenrelevanten Abschnitte existieren?
- Welche Bewegungsauslastung liegt je Abschnitt vor?
- Welche Aufenthaltsbereiche berühren oder beeinflussen einen Abschnitt?
- Welche Abschnitte sind maskiert, teilweise maskiert oder durch Aufenthalt nur eingeschränkt bewertbar?
- Welche regionalen Sperren oder Hinweise wirken auf Abschnitte?
- Welche Staustellenindikatoren beeinflussen Abschnitte?
- Welche Abschnitte sind geeignet, abgewertet, gewarnt oder ausgeschlossen?
- Welche Routentypen dürfen welche Abschnitte nutzen?
- Welche Routenoptionen können an Panel 9 übergeben werden?
- Welche Routenlayer sind für Operator, Debug und Sensus-Core-Kandidaten geeignet?

Leitsatz:

> Panel 8 übersetzt die berechnete SCIM-Auslastung in routenwirksame Abschnittsbewertung und prüfbare Routendarstellung.

---

# 3. Nicht-Ziele

Panel 8 darf nicht:

- System-Adjust-Grenzen ändern,
- Regio-Content ändern,
- Ziel-App-UI-Profile ändern,
- Telco-Load-Batches ändern,
- Boundary oder Extraktion ändern,
- Graphknoten oder Graphkanten strukturell neu erzeugen,
- Aufenthalt oder Bewegung neu klassifizieren,
- Maskierungen fachlich neu berechnen,
- Load-Gruppen neu verbrauchen,
- Sensus-Core-Pakete erzeugen,
- lokale User-Einstellungen anwenden,
- finale Freigaben oder Exporte erzeugen.

Panel 8 ist ein Routenbewertungs- und Routendarstellungspanel. Paketierung, lokale User-Anwendung und Freigabe folgen später.

---

# 4. Fachliche Verantwortung

Panel 8 hat sieben fachliche Kernaufgaben.

## 4.1 Routenabschnitte bilden

Panel 8 übernimmt `route_section_candidates` aus dem Graphen und bildet daraus bewertbare Routenabschnitte.

Dabei werden:

- Kanten zwischen topologischen Knoten zusammengefasst,
- Boundary-zu-Knoten-Abschnitte erhalten,
- Buffer-Anschlussabschnitte markiert,
- Abschnitte mit Maskierung oder POI-Kontext bei Bedarf gesplittet,
- Abschnittsgeometrien erzeugt,
- Abschnittsquellen dokumentiert,
- Abschnittslängen berechnet,
- Eignung für Routenbewertung geprüft.

## 4.2 Bewegungsbewertung je Abschnitt berechnen

Panel 8 verdichtet `movement_model.movement_loads` auf Routenabschnitte.

Mögliche Metriken:

- Durchschnitt der Bewegungsscores,
- gewichteter Durchschnitt nach Kantenlänge,
- Maximalwert als Sicherheitsindikator,
- Anteil hoch belasteter Kanten,
- Anteil unbewertbarer oder maskierter Kanten,
- Confidence-Score je Abschnitt,
- Datenqualitätsstatus je Abschnitt.

## 4.3 Aufenthaltskontext je Abschnitt berechnen

Panel 8 prüft je Abschnitt:

- schneidet der Abschnitt einen bestätigten Aufenthaltsbereich,
- tangiert der Abschnitt einen Aufenthaltsbereich,
- liegt der Abschnitt im Vergleichssaum,
- ist nur ein Teilsegment betroffen,
- wurde eine Kante durch Aufenthalt maskiert,
- welche POIs beeinflussen den Abschnitt,
- wie stark ist der Aufenthaltsscore,
- ist der Kontext nur Hinweis, Abwertung oder Ausschlusskandidat.

Arbeitsannahme:

> Ein Routenabschnitt gilt als durch einen Aufenthaltsbereich betroffen, wenn seine Geometrie den bestätigten POI-Aufenthaltsradius schneidet oder innerhalb eines definierten Toleranzabstands beziehungsweise Vergleichssaums zum Aufenthaltsbereich verläuft.

## 4.4 Regionale Sperren, Hinweise und Staustellen einbeziehen

Panel 8 korreliert Routenabschnitte mit:

- regionalen Sperren,
- saisonalen Sperren,
- Gefahrenhinweisen,
- lokalen Warnungen,
- regionalen Routenvorgaben,
- Staustellenindikatoren aus Panel 7,
- manuell bestätigten Stau- oder Restriktionshinweisen.

Regionale Sperren können je nach Freigabe und Profil eine Warnung, Abwertung oder Ausschlusswirkung erzeugen.

## 4.5 Abwertung oder Ausschluss anwenden

Panel 8 entscheidet je Abschnitt und je Routentyp:

- `suitable`,
- `warning`,
- `degraded`,
- `excluded`,
- `fallback_only`,
- `unknown`.

Arbeitsannahme:

> Grenzwertüberschreitungen führen zunächst zu einer Abwertung. Ein harter Ausschluss erfolgt nur, wenn Ziel-App-Profil, Routentyp-Profil, regionale Sperre oder Systemgrenze dies ausdrücklich verlangen.

## 4.6 Routenoptionen vorbereiten

Panel 8 kann Routenoptionen vorbereiten, sofern die Routingquelle oder ein bestehender Routingdienst Routenverläufe liefert.

Wichtig:

- SCIM ersetzt nicht zwingend klassische Routingberechnung für Länge, Zeit, Höhenprofil oder Wegführung.
- SCIM ergänzt bestehende Routenoptionen um Auslastung, Aufenthaltskontext, Warnungen, Abwertungen und Ausschlüsse.
- Wenn keine Routingoptionen vorliegen, bewertet Panel 8 zunächst nur Abschnitte und stellt sie als route-ready Bewertungsmodell bereit.

## 4.7 Routendarstellung und Leaflet-Vergleich erzeugen

Panel 8 erzeugt routenbezogene Layer:

- Operator-Route-Layer,
- Abschnittsbewertungs-Layer,
- Warn-/Abwertungs-Layer,
- Ausschluss-Layer,
- Routenoptions-Layer,
- Sensus-Core-Kandidaten-Layer,
- Debug-Layer, strikt getrennt.

Leaflet dient zur Prüfung, ob bewertete Abschnitte, Routenoptionen, Originalwege, Basisgraph, POI-Kontext und Warnungen räumlich plausibel übereinanderliegen.

---

# 5. Datenmodell

## 5.1 RouteModelState

```ts
export interface RouteModelState {
  route_model_id: string;
  representation_id: string;
  graph_id: string;
  movement_model_id: string;
  masking_model_id: string;
  created_at: string;
  evaluation_version: string;
  route_sections: EvaluatedRouteSection[];
  route_options: RouteOption[];
  route_profiles_applied: AppliedRouteProfile[];
  route_model_summary: RouteModelSummary;
  validation: RouteModelValidationResult;
  status: RouteModelStatus;
}
```

## 5.2 RouteModelStatus

```ts
export type RouteModelStatus =
  | 'not_created'
  | 'building_sections'
  | 'sections_created_unvalidated'
  | 'evaluating'
  | 'route_model_created_unvalidated'
  | 'validating'
  | 'route_model_valid'
  | 'route_model_warning'
  | 'route_model_invalid'
  | 'route_model_error';
```

---

# 6. EvaluatedRouteSection

## 6.1 Typ

```ts
export interface EvaluatedRouteSection {
  route_section_id: string;
  source_section_candidate_id?: string;
  representation_id: string;
  graph_id: string;
  edge_ids: string[];
  from_node_id: string;
  to_node_id: string;
  geometry: GeoJsonLineString;
  length_meters: number;
  section_type: RouteSectionType;
  boundary_relation: RouteSectionBoundaryRelation;
  movement_evaluation: SectionMovementEvaluation;
  stay_context: SectionStayContext;
  masking_context: SectionMaskingContext;
  restriction_context: SectionRestrictionContext;
  jam_context: SectionJamContext;
  profile_results: RouteSectionProfileResult[];
  overall_route_status: RouteSectionStatus;
  route_readiness: RouteReadiness;
  warnings: RouteSectionWarning[];
  metadata?: Record<string, unknown>;
}
```

## 6.2 SectionType

```ts
export type RouteSectionType =
  | 'between_topological_nodes'
  | 'boundary_to_topological_node'
  | 'dead_end_section'
  | 'buffer_connector_section'
  | 'split_by_masking'
  | 'split_by_stay_context'
  | 'split_by_restriction'
  | 'unknown';
```

## 6.3 BoundaryRelation

```ts
export type RouteSectionBoundaryRelation =
  | 'inside_boundary'
  | 'intersects_boundary'
  | 'inside_buffer_only'
  | 'crosses_boundary'
  | 'unknown';
```

## 6.4 RouteSectionStatus

```ts
export type RouteSectionStatus =
  | 'suitable'
  | 'warning'
  | 'degraded'
  | 'excluded'
  | 'fallback_only'
  | 'unknown';
```

## 6.5 RouteReadiness

```ts
export interface RouteReadiness {
  usable_for_route_options: boolean;
  usable_for_low_load_route: boolean;
  usable_for_fastest_route: boolean;
  usable_for_fallback_route: boolean;
  blocks_sensus_core_export: boolean;
  reason?: string;
}
```

---

# 7. Bewegungsbewertung

## 7.1 SectionMovementEvaluation

```ts
export interface SectionMovementEvaluation {
  movement_score: number;
  weighted_movement_score: number;
  max_edge_movement_score: number;
  average_density_score: number;
  high_load_edge_ratio: number;
  evaluated_edge_count: number;
  unevaluated_edge_count: number;
  masked_edge_count: number;
  confidence_score: number;
  movement_class: SectionMovementClass;
  status: SectionMovementStatus;
}
```

## 7.2 SectionMovementClass

```ts
export type SectionMovementClass =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'unknown';
```

## 7.3 SectionMovementStatus

```ts
export type SectionMovementStatus =
  | 'movement_evaluation_valid'
  | 'movement_evaluation_warning'
  | 'movement_evaluation_incomplete'
  | 'movement_evaluation_blocked';
```

## 7.4 Bewegungsregeln

```txt
movement_score must be within 0..1
weighted_movement_score must be within 0..1
max_edge_movement_score must be within 0..1
confidence_score must be within 0..1
fully masked edges must not contribute as normal movement edges
partially masked edges may contribute only with unmasked length or conservative warning
privacy-blocked movement loads must not contribute
expired movement loads must not contribute to runtime route evaluation
```

---

# 8. Aufenthaltskontext

## 8.1 SectionStayContext

```ts
export interface SectionStayContext {
  touched_stay_area_ids: string[];
  related_active_poi_ids: string[];
  max_stay_score: number;
  average_stay_score: number;
  stay_context_score: number;
  affected_length_meters?: number;
  affected_length_ratio?: number;
  relation: StayRouteRelation;
  route_effect: StayRouteEffect;
  status: SectionStayContextStatus;
}
```

## 8.2 StayRouteRelation

```ts
export type StayRouteRelation =
  | 'none'
  | 'intersects_stay_radius'
  | 'touches_stay_radius'
  | 'inside_comparison_margin'
  | 'partial_overlap'
  | 'nearby_reference_only';
```

## 8.3 StayRouteEffect

```ts
export type StayRouteEffect =
  | 'none'
  | 'warning_only'
  | 'degrade_candidate'
  | 'exclude_candidate'
  | 'stay_context_only';
```

## 8.4 SectionStayContextStatus

```ts
export type SectionStayContextStatus =
  | 'stay_context_valid'
  | 'stay_context_warning'
  | 'stay_context_incomplete'
  | 'stay_context_blocked';
```

## 8.5 Aufenthaltskontext-Regeln

```txt
confirmed stay areas may influence route sections
blocked_by_privacy stay loads must not influence route status
blocked_by_quality stay loads may create warnings only if configured
stay context effect must not override hard regional exclusions
comparison margin creates warning or degrade candidate, not automatic exclusion
intersects_stay_radius may degrade or exclude depending on profile and thresholds
nearby_reference_only must not create exclusion by itself
```

---

# 9. Maskierungskontext

## 9.1 SectionMaskingContext

```ts
export interface SectionMaskingContext {
  masked_edge_ids: string[];
  fully_masked_edge_ids: string[];
  partially_masked_edge_ids: string[];
  mask_count: number;
  masked_length_meters: number;
  masked_length_ratio: number;
  movement_usable_length_meters: number;
  route_effect: MaskRouteEffect;
  status: SectionMaskingStatus;
}
```

## 9.2 MaskRouteEffect

```ts
export type MaskRouteEffect =
  | 'none'
  | 'reduce_movement_weight'
  | 'degrade_section'
  | 'exclude_section'
  | 'stay_context_only';
```

## 9.3 SectionMaskingStatus

```ts
export type SectionMaskingStatus =
  | 'masking_context_valid'
  | 'masking_context_warning'
  | 'masking_context_incomplete'
  | 'masking_context_blocked';
```

## 9.4 Maskierungsregeln

```txt
masked edges must reference context.masking_model.masked_edges
fully masked edges must not be counted as normal movement route length
partial masks must include affected length or conservative full-edge warning
if masked_length_ratio exceeds configured threshold, section becomes degraded or excluded according to profile
masking may reduce movement score confidence
masking must never create a raw signal reference in route output
```

---

# 10. Regionale Sperren und Hinweise

## 10.1 SectionRestrictionContext

```ts
export interface SectionRestrictionContext {
  related_restriction_ids: string[];
  active_restriction_count: number;
  warning_count: number;
  degrade_count: number;
  exclude_count: number;
  strongest_route_effect: RestrictionRouteEffect;
  display_effects: RestrictionDisplayEffect[];
  status: SectionRestrictionStatus;
}
```

## 10.2 SectionRestrictionStatus

```ts
export type SectionRestrictionStatus =
  | 'restriction_context_valid'
  | 'restriction_context_warning'
  | 'restriction_context_incomplete'
  | 'restriction_context_blocked';
```

## 10.3 Sperr- und Hinweisregeln

```txt
only approved active restrictions may create route effect
expired restrictions may appear as operator diagnostics only
restriction route_effect exclude overrides normal movement suitability
restriction route_effect degrade degrades section even if load is low
restriction display_effect determines later Sensus-Core hint or warning eligibility
operator_only restrictions must not become public route warnings unless explicitly mapped
```

---

# 11. Staustellenkontext

## 11.1 SectionJamContext

```ts
export interface SectionJamContext {
  related_jam_indicator_ids: string[];
  max_jam_score: number;
  average_jam_score: number;
  confidence_score: number;
  route_effect: JamRouteEffect;
  status: SectionJamStatus;
}
```

## 11.2 JamRouteEffect

```ts
export type JamRouteEffect =
  | 'none'
  | 'warning_only'
  | 'degrade_candidate'
  | 'exclude_candidate';
```

## 11.3 SectionJamStatus

```ts
export type SectionJamStatus =
  | 'jam_context_valid'
  | 'jam_context_warning'
  | 'jam_context_incomplete'
  | 'jam_context_blocked';
```

## 11.4 Staustellenregeln

```txt
jam indicators from Panel 7 are advisory inputs
blocked_by_privacy jam indicators must not influence route effect
probable or confirmed jam indicators may warn or degrade depending on route profile
jam exclude requires explicit system, regional or profile permission
mixed_stay_movement_unclear should prefer warning or degrade, not hard exclusion by default
```

---

# 12. Profilbewertung je Abschnitt

## 12.1 RouteSectionProfileResult

```ts
export interface RouteSectionProfileResult {
  profile_id: string;
  route_mode_id: string;
  route_priority: RoutePriority;
  movement_threshold: number;
  stay_threshold: number;
  degrade_threshold: number;
  exclude_threshold: number;
  effective_score: number;
  status: RouteSectionStatus;
  reason_codes: RouteSectionReasonCode[];
  warnings: RouteSectionWarning[];
}
```

## 12.2 RoutePriority

```ts
export type RoutePriority =
  | 'fastest'
  | 'shortest'
  | 'low_load'
  | 'quiet'
  | 'balanced'
  | 'fallback';
```

## 12.3 ReasonCodes

```ts
export type RouteSectionReasonCode =
  | 'ROUTE_LOW_LOAD'
  | 'ROUTE_MOVEMENT_HIGH'
  | 'ROUTE_STAY_CONTEXT_HIGH'
  | 'ROUTE_MASKED_BY_STAY'
  | 'ROUTE_PARTIALLY_MASKED'
  | 'ROUTE_REGIONAL_WARNING'
  | 'ROUTE_REGIONAL_DEGRADE'
  | 'ROUTE_REGIONAL_EXCLUDE'
  | 'ROUTE_JAM_WARNING'
  | 'ROUTE_JAM_DEGRADE'
  | 'ROUTE_DATA_INCOMPLETE'
  | 'ROUTE_PRIVACY_REDUCTION_ACTIVE'
  | 'ROUTE_FALLBACK_ONLY';
```

## 12.4 RouteSectionWarning

```ts
export interface RouteSectionWarning {
  warning_id: string;
  warning_type:
    | 'high_movement_load'
    | 'high_stay_context'
    | 'masked_section'
    | 'partial_masking'
    | 'regional_restriction'
    | 'jam_indicator'
    | 'data_quality_low'
    | 'route_fallback_only'
    | 'privacy_reduction_active';
  severity: 'info' | 'warning' | 'critical';
  message_key: string;
  sensus_core_eligible: boolean;
  operator_only: boolean;
}
```

---

# 13. Routenoptionen

## 13.1 RouteOption

```ts
export interface RouteOption {
  route_option_id: string;
  source: RouteOptionSource;
  route_mode_id: string;
  label: string;
  section_ids: string[];
  geometry: GeoJsonLineString | GeoJsonMultiLineString;
  total_length_meters: number;
  estimated_duration_seconds?: number;
  classic_route_metrics?: ClassicRouteMetrics;
  scim_route_score: ScimRouteScore;
  status: RouteOptionStatus;
  warnings: RouteOptionWarning[];
  sensus_core_candidate: boolean;
  debug_only: boolean;
}
```

## 13.2 RouteOptionSource

```ts
export type RouteOptionSource =
  | 'external_routing_service'
  | 'existing_route_import'
  | 'graph_shortest_path'
  | 'manual_mock'
  | 'section_only_no_route_option';
```

## 13.3 ClassicRouteMetrics

```ts
export interface ClassicRouteMetrics {
  distance_meters?: number;
  duration_seconds?: number;
  elevation_gain_meters?: number;
  elevation_loss_meters?: number;
  difficulty_class?: string;
  source?: string;
}
```

## 13.4 ScimRouteScore

```ts
export interface ScimRouteScore {
  overall_score: number;
  movement_score: number;
  stay_context_score: number;
  restriction_score: number;
  jam_score: number;
  confidence_score: number;
  degraded_section_count: number;
  excluded_section_count: number;
  warning_section_count: number;
}
```

## 13.5 RouteOptionStatus

```ts
export type RouteOptionStatus =
  | 'recommended'
  | 'available'
  | 'available_with_warnings'
  | 'degraded'
  | 'fallback_only'
  | 'excluded'
  | 'not_enough_data';
```

## 13.6 RouteOptionWarning

```ts
export interface RouteOptionWarning {
  warning_id: string;
  related_section_ids: string[];
  warning_type: RouteSectionWarning['warning_type'];
  severity: 'info' | 'warning' | 'critical';
  message_key: string;
  sensus_core_eligible: boolean;
}
```

---

# 14. RouteLayerModelState

## 14.1 Kernoutput

```ts
export interface RouteLayerModelState {
  route_layer_model_id: string;
  representation_id: string;
  route_model_id: string;
  created_at: string;
  layer_format: RouteLayerFormat;
  operator_route_geojson: GeoJSONFeatureCollection;
  route_section_geojson: GeoJSONFeatureCollection;
  route_warning_geojson: GeoJSONFeatureCollection;
  sensus_core_candidate_geojson?: GeoJSONFeatureCollection;
  debug_route_geojson?: GeoJSONFeatureCollection;
  layer_summary: RouteLayerSummary;
  validation: RouteLayerValidationResult;
  status: RouteLayerStatus;
}
```

## 14.2 RouteLayerFormat

```ts
export type RouteLayerFormat =
  | 'geojson'
  | 'vector_tile_candidate'
  | 'internal_feature_collection';
```

## 14.3 RouteLayerStatus

```ts
export type RouteLayerStatus =
  | 'not_created'
  | 'composing'
  | 'route_layer_created_unvalidated'
  | 'validating'
  | 'route_layer_valid'
  | 'route_layer_warning'
  | 'route_layer_invalid'
  | 'route_layer_error';
```

## 14.4 RouteLayerSummary

```ts
export interface RouteLayerSummary {
  operator_feature_count: number;
  route_section_feature_count: number;
  warning_feature_count: number;
  sensus_core_candidate_feature_count: number;
  debug_feature_count: number;
  excluded_feature_count: number;
  degraded_feature_count: number;
  warning_count: number;
  error_count: number;
}
```

## 14.5 Layer-Regeln

```txt
operator_route_geojson may include technical route ids
route_section_geojson must reference evaluated route sections
debug_route_geojson must be separated from Sensus-Core candidates
sensus_core_candidate_geojson must not contain raw signals
sensus_core_candidate_geojson must not contain device counts
sensus_core_candidate_geojson must not contain exact internal debug scores if reduction profile forbids them
route layers must preserve section status and warning eligibility
excluded sections may remain visible in operator view
excluded sections may be hidden or warning-only in Sensus-Core candidate depending on target_app_ui
```

---

# 15. LeafletRouteCheckState

## 15.1 Typ

```ts
export interface LeafletRouteCheckState {
  leaflet_route_check_id: string;
  representation_id: string;
  route_model_id: string;
  route_layer_model_id: string;
  checked_at: string;
  visible_overlays: LeafletRouteOverlay[];
  check_items: LeafletRouteCheckItem[];
  issues: LeafletRouteIssue[];
  status: LeafletRouteCheckStatus;
}
```

## 15.2 LeafletRouteOverlay

```ts
export type LeafletRouteOverlay =
  | 'boundary'
  | 'buffer'
  | 'basis_layer'
  | 'graph_edges'
  | 'route_sections'
  | 'movement_evaluation'
  | 'stay_context'
  | 'masked_edges'
  | 'regional_restrictions'
  | 'jam_indicators'
  | 'route_options'
  | 'excluded_sections'
  | 'degraded_sections'
  | 'debug_route';
```

## 15.3 LeafletRouteCheckStatus

```ts
export type LeafletRouteCheckStatus =
  | 'not_checked'
  | 'checking'
  | 'leaflet_route_valid'
  | 'leaflet_route_warning'
  | 'leaflet_route_invalid'
  | 'leaflet_route_error';
```

## 15.4 CheckItem

```ts
export interface LeafletRouteCheckItem {
  check_id: string;
  label: string;
  passed: boolean;
  severity: 'info' | 'warning' | 'error';
  related_ids?: string[];
  message: string;
}
```

## 15.5 LeafletRouteIssue

```ts
export interface LeafletRouteIssue {
  code: RouteEvaluationErrorCode;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}
```

## 15.6 Leaflet-Prüfregeln

```txt
route sections must align with graph edges
route options must align with route sections
excluded sections must be visually distinguishable in operator view
degraded sections must be visually distinguishable in operator view
stay context overlay must align with POI radius or comparison margin
masked edges must match Panel 7 masking model
regional restrictions must spatially match affected sections
Sensus-Core candidate overlay must not show debug-only features
original basis paths must be comparable against route layer
```

---

# 16. UI-Struktur

Panel 8 besteht aus sechs Tabs:

1. **Routenabschnitte**
2. **Bewegungsbewertung**
3. **Aufenthaltskontext**
4. **Abwertung oder Ausschluss**
5. **Routendarstellung**
6. **Leaflet-Vergleich**

## 16.1 Tab 1 – Routenabschnitte

Zweck:

- Abschnittskandidaten aus dem Graphen übernehmen,
- bewertbare Routenabschnitte erzeugen,
- Splits wegen Maskierung, Aufenthalt oder Restriktionen dokumentieren.

Anzeigen:

- Abschnitts-ID,
- Von-/Bis-Knoten,
- Kantenliste,
- Länge,
- Abschnittstyp,
- Boundary-Bezug,
- Bewertbarkeit,
- Split-Grund.

Aktionen:

- Routenabschnitte bauen,
- Routenabschnitte validieren,
- Abschnitte in Leaflet anzeigen.

## 16.2 Tab 2 – Bewegungsbewertung

Zweck:

- Bewegungslast von Kanten auf Abschnitte verdichten,
- Abschnittsscore und Klasse berechnen,
- Confidence und Datenqualität prüfen.

Anzeigen:

- Bewegungsscore,
- gewichteter Bewegungsscore,
- Max-Edge-Score,
- High-Load-Anteil,
- bewertete Kanten,
- maskierte Kanten,
- Bewegungs-Klasse,
- Confidence.

Aktionen:

- Bewegungsbewertung ausführen,
- Schwellen prüfen,
- Bewegungslayer anzeigen.

## 16.3 Tab 3 – Aufenthaltskontext

Zweck:

- Routenabschnitte gegen Aufenthaltsbereiche, Vergleichssäume und POIs prüfen.

Anzeigen:

- berührte POIs,
- berührte Aufenthaltsbereiche,
- Relation zum Radius,
- betroffenes Teilstück,
- Stay-Score,
- Kontextwirkung,
- Warn- oder Abwertungskandidat.

Aktionen:

- Aufenthaltskontext berechnen,
- POI-/Radius-/Vergleichssaum-Overlay anzeigen,
- Konfliktabschnitte prüfen.

## 16.4 Tab 4 – Abwertung oder Ausschluss

Zweck:

- Bewegungsbewertung, Aufenthaltskontext, Maskierung, Sperren, Staustellen und Routentypen zu Abschnittsstatus verdichten.

Anzeigen:

- Abschnittsstatus je Profil,
- Grenzwertverhalten,
- regionale Sperrwirkung,
- Fallback-Status,
- Warnungen,
- Ausschlussgrund,
- Sensus-Core-Eignung.

Aktionen:

- Profilbewertung anwenden,
- Abwertung/Ausschluss validieren,
- Statusmatrix anzeigen.

## 16.5 Tab 5 – Routendarstellung

Zweck:

- Route-Layer für Operator, Debug und Sensus-Core-Kandidaten erzeugen.

Anzeigen:

- Operator-Route-Layer,
- Abschnitts-Layer,
- Warn-Layer,
- Ausschluss-Layer,
- Sensus-Core-Kandidaten,
- Debug-Layer getrennt.

Aktionen:

- Routenlayer komponieren,
- Layer validieren,
- Ziel-App-Reduktion prüfen.

## 16.6 Tab 6 – Leaflet-Vergleich

Zweck:

- bewertete Routenabschnitte und Route-Layer visuell gegen Graph, Basislayer, POIs, Maskierungen, Restriktionen und Originalwege prüfen.

Anzeigen:

- Boundary,
- Buffer,
- Basislayer,
- Originalwege,
- Routenabschnitte,
- Route-Optionen,
- abgewertete Abschnitte,
- ausgeschlossene Abschnitte,
- Aufenthaltskontext,
- Maskierungen,
- Fehlerliste.

Aktionen:

- Leaflet-Routenprüfung ausführen,
- Overlays ein-/ausblenden,
- Prüfbericht erzeugen.

---

# 17. Validierung

## 17.1 Gemeinsames Issue-Modell

```ts
export interface RouteEvaluationIssue {
  code: RouteEvaluationErrorCode;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}
```

## 17.2 RouteModelValidationResult

```ts
export interface RouteModelValidationResult {
  is_valid: boolean;
  errors: RouteEvaluationIssue[];
  warnings: RouteEvaluationIssue[];
  checked_at: string;
  checked_against_graph_id: string;
  checked_against_movement_model_id: string;
  checked_against_masking_model_id: string;
  checked_against_system_adjust_version: string;
}
```

## 17.3 Pflichtvalidierungen Routenabschnitte

```txt
system_adjust must exist and be valid
scim_context must exist and be valid
graph must exist and be valid
movement_model must exist and be valid or warning
masking_model must exist and be valid or warning
route_sections must reference existing graph edges
route_sections must reference existing graph nodes
route section geometry must be valid
route section length must be positive
route section representation_id must match context.representation_id
route sections must preserve boundary relation
split sections must reference split reason
```

## 17.4 Pflichtvalidierungen Bewegungsbewertung

```txt
movement evaluation must reference movement_model movement loads
movement_score values must be within 0..1
weighted score values must be within 0..1
confidence_score values must be within 0..1
fully masked edges must not contribute as normal movement edges
privacy-blocked movement loads must not influence route sections
expired movement loads must not influence runtime route sections
unevaluated edge ratio must produce warning if above configured threshold
```

## 17.5 Pflichtvalidierungen Aufenthaltskontext

```txt
stay context must reference existing active POIs or stay loads
stay context relation must be explicit
confirmed stay influence requires valid stay load
blocked stay loads must not influence route status
affected length must not exceed section length
comparison margin relation must not automatically hard-exclude unless profile explicitly allows it
```

## 17.6 Pflichtvalidierungen Maskierungskontext

```txt
masked edge references must exist in masking_model
fully masked edge length must be counted as masked length
partial mask must provide geometry or affected_length_meters
masked_length_ratio must be within 0..1
route effect must follow System-Adjust and route profile settings
```

## 17.7 Pflichtvalidierungen Sperren und Hinweise

```txt
regional restrictions must be approved and active for route effect
expired restrictions must not create runtime exclusion
operator_only restrictions must not become Sensus-Core warnings unless mapped
restriction exclude must override lower load status
restriction degrade must at least degrade the section
```

## 17.8 Pflichtvalidierungen Routenoptionen

```txt
route options must reference existing route sections
route option geometry must exist
route option total_length_meters must be positive
scim_route_score values must be within 0..1
excluded route sections must block recommended status unless fallback policy allows
sensus_core_candidate true requires target_app_ui compatibility
route option must not contain raw or debug properties
```

## 17.9 Pflichtvalidierungen RouteLayer

```txt
route_layer_model must reference route_model
operator_route_geojson must exist
route_section_geojson must reference route_sections
sensus_core_candidate_geojson must not contain raw signals
sensus_core_candidate_geojson must not contain device counts
debug_route_geojson must not be marked sensus_core_candidate
feature properties must not expose forbidden data classes
```

## 17.10 Pflichtvalidierungen Leaflet-Vergleich

```txt
leaflet_route_check must reference route_model and route_layer_model
route section overlay must align with graph edge overlay
route option overlay must align with route section overlay
masked edge overlay must match Panel 7 masking model
excluded and degraded sections must be visually distinguishable
Sensus-Core candidate overlay must hide debug-only features
```

---

# 18. Fehlercodes

```ts
export type RouteEvaluationErrorCode =
  | 'RED_SYSTEM_ADJUST_MISSING'
  | 'RED_SYSTEM_ADJUST_INVALID'
  | 'RED_SCIM_CONTEXT_MISSING'
  | 'RED_SCIM_CONTEXT_INVALID'
  | 'RED_GRAPH_MISSING'
  | 'RED_GRAPH_INVALID'
  | 'RED_MOVEMENT_MODEL_MISSING'
  | 'RED_MOVEMENT_MODEL_INVALID'
  | 'RED_MASKING_MODEL_MISSING'
  | 'RED_MASKING_MODEL_INVALID'
  | 'RED_ROUTE_SECTION_EDGE_MISSING'
  | 'RED_ROUTE_SECTION_NODE_MISSING'
  | 'RED_ROUTE_SECTION_GEOMETRY_INVALID'
  | 'RED_ROUTE_SECTION_LENGTH_INVALID'
  | 'RED_MOVEMENT_SCORE_OUT_OF_RANGE'
  | 'RED_MOVEMENT_USES_MASKED_EDGE'
  | 'RED_PRIVACY_BLOCKED_LOAD_USED'
  | 'RED_EXPIRED_LOAD_USED'
  | 'RED_STAY_CONTEXT_REF_MISSING'
  | 'RED_STAY_CONTEXT_BLOCKED_USED'
  | 'RED_MASK_REF_MISSING'
  | 'RED_MASK_RATIO_INVALID'
  | 'RED_RESTRICTION_REF_MISSING'
  | 'RED_RESTRICTION_EXPIRED_USED'
  | 'RED_PROFILE_THRESHOLD_OUT_OF_RANGE'
  | 'RED_DEGRADE_EXCLUDE_ORDER_INVALID'
  | 'RED_ROUTE_OPTION_SECTION_MISSING'
  | 'RED_ROUTE_OPTION_GEOMETRY_INVALID'
  | 'RED_ROUTE_SCORE_OUT_OF_RANGE'
  | 'RED_SENSUS_CORE_RAW_SIGNAL_LEAK'
  | 'RED_SENSUS_CORE_DEBUG_LEAK'
  | 'RED_LEAFLET_ROUTE_LAYER_MISMATCH';
```

---

# 19. Statuslogik

Panel 8 ist nur dann vollständig gültig, wenn alle drei Kontextsegmente gültig sind:

```ts
context.route_model.status === 'route_model_valid'
context.route_layer_model.status === 'route_layer_valid'
context.leaflet_route_check.status === 'leaflet_route_valid'
```

Warnungsmodus ist zulässig, wenn:

- keine blockierenden Fehler vorliegen,
- einzelne Abschnitte unvollständige Bewegungsdaten haben,
- einzelne Aufenthaltskontexte nur als Warnung wirken,
- Staustellenindikatoren unsicher sind,
- einzelne Route-Optionen nicht empfohlen, aber als Fallback nutzbar sind,
- Leaflet-Vergleich nur visuelle Warnungen ohne Datenfehler meldet.

Ungültig ist Panel 8, wenn:

- System-Adjust fehlt oder ungültig ist,
- Graph fehlt oder ungültig ist,
- Movement- oder Masking-Modell fehlt,
- privacy-blocked oder expired Load-Werte routenwirksam verwendet werden,
- voll maskierte Kanten als normale Bewegung bewertet werden,
- regionale harte Sperren ignoriert werden,
- Sensus-Core-Kandidaten Roh-, Debug- oder Geräteinformationen enthalten,
- Routenlayer nicht zu den bewerteten Abschnitten passen.

---

# 20. Kontextübergabe

Panel 8 schreibt folgende Kontextsegmente:

```json
{
  "route_model": {
    "route_model_id": "route_model_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "graph_id": "graph_hochwab_nord_001",
    "movement_model_id": "movement_hochwab_nord_001",
    "masking_model_id": "masking_hochwab_nord_001",
    "route_sections": [],
    "route_options": [],
    "route_profiles_applied": [],
    "status": "route_model_valid"
  },
  "route_layer_model": {
    "route_layer_model_id": "route_layer_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "route_model_id": "route_model_hochwab_nord_001",
    "operator_route_geojson": {},
    "route_section_geojson": {},
    "route_warning_geojson": {},
    "sensus_core_candidate_geojson": {},
    "status": "route_layer_valid"
  },
  "leaflet_route_check": {
    "leaflet_route_check_id": "leaflet_route_check_hochwab_nord_001",
    "representation_id": "rep_hochwab_nord_001",
    "route_model_id": "route_model_hochwab_nord_001",
    "route_layer_model_id": "route_layer_hochwab_nord_001",
    "visible_overlays": [],
    "check_items": [],
    "issues": [],
    "status": "leaflet_route_valid"
  }
}
```

Direkte Abnehmer:

- Panel 9: Sensus-Core Package Builder,
- spätere Layer-Komposition,
- spätere Sensus-Core-Paketierung,
- spätere lokale Sensus-Core-Anwendung,
- Panel 11: Leaflet-Wirkungsprüfung,
- Panel 12: Freigabe und Export.

Wichtig:

Panel 8 erzeugt bewertete Routenabschnitte und routenbezogene Layer. Es erzeugt noch kein finales Sensus-Core-Paket, keine lokale User-Auswahl und keine finale Exportfreigabe.

---

# 21. Leaflet-Prüfung

Panel 8 kann folgende Overlays für die Operatorprüfung erzeugen:

```txt
route_section_overlay
movement_score_overlay
stay_context_overlay
masked_section_overlay
degraded_section_overlay
excluded_section_overlay
regional_restriction_overlay
jam_indicator_route_overlay
route_option_overlay
sensus_core_candidate_route_overlay
debug_route_overlay
```

Regeln:

- Operator-Overlays dürfen technische IDs enthalten.
- Debug-Overlays müssen klar getrennt sein.
- Sensus-Core-Kandidaten dürfen keine Rohsignale, Geräteinformationen, exakten Debugscores oder Operatornotizen enthalten.
- Abgewertete Abschnitte müssen visuell von ausgeschlossenen Abschnitten unterscheidbar sein.
- Aufenthaltskontext muss nachvollziehbar auf POI-Radius, Vergleichssaum oder Maskierung zurückführbar sein.
- Route-Optionen müssen mit den bewerteten Abschnitten übereinstimmen.

---

# 22. Akzeptanzkriterien

## 22.1 Routenabschnitte

- Das Panel kann Routenabschnitte aus gültigem Graph und RouteSectionCandidates erzeugen.
- Jeder Abschnitt referenziert existierende Kanten.
- Jeder Abschnitt referenziert existierende Start- und Endknoten.
- Jede Abschnittsgeometrie ist gültig.
- Jede Abschnittslänge ist positiv.
- Boundary- und Buffer-Bezug bleiben erhalten.
- Splits wegen Maskierung, Aufenthalt oder Restriktion werden dokumentiert.
- Abschnittskandidaten ohne Bewertbarkeit erzeugen Warnungen oder blockierende Fehler.

## 22.2 Bewegungsbewertung

- Bewegungsscores werden aus `movement_model.movement_loads` berechnet.
- Vollständig maskierte Kanten fließen nicht als normale Bewegungskanten ein.
- Teilmaskierte Kanten werden nur mit unmaskiertem Anteil oder konservativer Warnung bewertet.
- Scores liegen im Bereich 0..1.
- Confidence wird dokumentiert.
- Privacy-blocked oder abgelaufene Load-Gruppen beeinflussen keine Routenbewertung.

## 22.3 Aufenthaltskontext

- Abschnitte werden gegen bestätigte Aufenthaltsbereiche geprüft.
- Relation zum POI-Radius oder Vergleichssaum wird explizit geführt.
- Berührte POIs und Aufenthaltsbereiche werden referenziert.
- Aufenthalt im Vergleichssaum erzeugt nicht automatisch harten Ausschluss.
- Blockierte oder qualitativ unbrauchbare Aufenthaltsdaten erzeugen keine harte Routenwirkung.

## 22.4 Abwertung oder Ausschluss

- Profilbewertung wird je Routentyp erzeugt.
- `route_degrade_threshold <= route_exclude_threshold` wird geprüft.
- Regionale harte Sperren überschreiben normale Eignung.
- Grenzwertüberschreitungen führen standardmäßig zu Abwertung, sofern kein Profil Ausschluss verlangt.
- Fallback-Regeln werden getrennt geführt.
- Jeder Ausschluss hat einen ReasonCode.

## 22.5 Routenoptionen

- Routenoptionen referenzieren existierende Routenabschnitte.
- Routenoptionen enthalten SCIM-Scores.
- Routenoptionen können empfohlen, verfügbar, gewarnt, degradiert, fallback-only oder ausgeschlossen sein.
- Klassische Routingmetriken werden optional übernommen, aber nicht von SCIM neu erfunden.
- Sensus-Core-Kandidaten enthalten keine Roh- oder Debugdaten.

## 22.6 Routendarstellung

- Operator-Route-Layer wird erzeugt.
- Abschnitts-Layer wird erzeugt.
- Warn-/Abwertungs-/Ausschluss-Layer werden erzeugt.
- Sensus-Core-Kandidaten-Layer wird nur mit erlaubten Datenklassen erzeugt.
- Debug-Layer sind getrennt.
- Leaflet kann die Layer über Basisgraph und Originalwegen prüfen.

## 22.7 Leaflet-Vergleich

- Routenabschnitte liegen räumlich auf Graphkanten.
- Route-Optionen liegen räumlich auf Routenabschnitten.
- Aufenthaltskontext, Maskierungen und Sperren überlagern plausibel.
- Abgewertete und ausgeschlossene Abschnitte sind visuell unterscheidbar.
- Sensus-Core-Kandidaten zeigen keine Debug-Attribute.
- Fehler und Warnungen werden im Panel sichtbar.

---

# 23. Testfälle

## 23.1 Positivtest: gültige Abschnittsbewertung

Gegeben:

- gültiger System-Adjust,
- gültiger Graph,
- gültiges Movement-Modell,
- gültiges Masking-Modell,
- ein RouteSectionCandidate mit zwei Kanten,
- beide Kanten besitzen gültige Bewegungsscores.

Erwartung:

- Abschnitt wird erzeugt,
- Bewegungsscore wird berechnet,
- Status ist `suitable` oder `warning`,
- keine blockierenden Fehler.

## 23.2 Positivtest: Teilmaskierung führt zu Abwertung

Gegeben:

- ein Abschnitt enthält eine teilmaskierte Kante,
- Masking-Modell liefert affected_length_meters,
- Bewegung auf unmaskiertem Anteil bleibt verwendbar.

Erwartung:

- Abschnitt erhält Maskierungskontext,
- Bewegungsscore wird konservativ berechnet,
- Abschnitt wird je Profil `degraded` oder `warning`,
- kein Rohsignal wird übernommen.

## 23.3 Positivtest: regionale Sperre schließt Abschnitt aus

Gegeben:

- ein Abschnitt schneidet eine aktive regionale Sperre,
- Sperre hat `route_effect = exclude`,
- Sperre ist freigegeben und nicht abgelaufen.

Erwartung:

- Abschnitt wird `excluded`,
- ReasonCode `ROUTE_REGIONAL_EXCLUDE`,
- RouteOption mit diesem Abschnitt wird nicht empfohlen.

## 23.4 Positivtest: Aufenthaltskontext im Vergleichssaum

Gegeben:

- Abschnitt liegt im Vergleichssaum eines bestätigten POIs,
- Abschnitt schneidet nicht den eigentlichen POI-Radius,
- Profil erlaubt Warnung oder Abwertung.

Erwartung:

- Relation `inside_comparison_margin`,
- kein automatischer harter Ausschluss,
- Warnung oder Abwertung nach Profil.

## 23.5 Negativtest: privacy-blocked Load wird verwendet

Gegeben:

- eine Bewegungslast ist privacy-blocked,
- Abschnittsbewertung versucht diese Last zu verwenden.

Erwartung:

- blockierender Fehler `RED_PRIVACY_BLOCKED_LOAD_USED`,
- RouteModel ungültig.

## 23.6 Negativtest: voll maskierte Kante als Bewegung verwendet

Gegeben:

- eine Kante ist vollständig maskiert,
- Bewegungsscore wird trotzdem normal eingerechnet.

Erwartung:

- blockierender Fehler `RED_MOVEMENT_USES_MASKED_EDGE`,
- Abschnittsbewertung ungültig.

## 23.7 Negativtest: Debugdaten in Sensus-Core-Kandidaten

Gegeben:

- Sensus-Core-Kandidaten-Layer enthält Debug-Attribut oder Rohsignalreferenz.

Erwartung:

- blockierender Fehler `RED_SENSUS_CORE_DEBUG_LEAK` oder `RED_SENSUS_CORE_RAW_SIGNAL_LEAK`,
- RouteLayer ungültig.

---

# 24. Umsetzungshinweise für Codex/Claude

## 24.1 Erst headless bauen

Zuerst sollen Typen, Schema, Mock-Daten und Validierungslogik gebaut werden. Die UI kommt danach.

Reihenfolge:

```txt
1. routeEvaluation.types.ts
2. routeEvaluation.mock.ts
3. routeEvaluation.validation.ts
4. routeEvaluation.sections.ts
5. routeEvaluation.movement.ts
6. routeEvaluation.stayContext.ts
7. routeEvaluation.restrictions.ts
8. routeEvaluation.profiles.ts
9. routeEvaluation.options.ts
10. routeEvaluation.layerComposer.ts
11. routeEvaluation.leaflet.ts
12. routeEvaluation.context.ts
13. routeEvaluation.test.ts
14. RouteEvaluationDisplayPanel.tsx
```

## 24.2 Keine Fachlogik im UI-Container

Die React-Komponente darf nur anzeigen und Aktionen auslösen. Die Fachlogik gehört in reine Funktionen und Services.

## 24.3 Panel-7-Ergebnisse nicht neu berechnen

Panel 8 darf Aufenthalt, Bewegung und Maskierung nicht neu klassifizieren. Es darf diese Ergebnisse nur routenwirksam verdichten und bewerten.

## 24.4 Abwertung vor Ausschluss

Default-Verhalten:

```txt
Warnen → Abwerten → Ausschließen nur bei Profil/System/Regio-Vorgabe
```

Ein harter Ausschluss braucht eine explizite Grundlage:

- regionale Sperre,
- Systemgrenze,
- Routentyp-Profil,
- Ziel-App-Profil,
- überschrittener Ausschlussschwellenwert.

## 24.5 Sensus-Core-Kandidaten strikt reduzieren

RouteLayer darf technische Operator- und Debugwerte führen, aber nicht im Sensus-Core-Kandidatenlayer.

Nicht erlaubt in Sensus-Core-Kandidaten:

```txt
raw signal refs
device counts
exact trace data
debug scores
operator notes
internal validation payloads
```

## 24.6 Leaflet als Prüfung, nicht als Engine

Leaflet zeigt und prüft. Die Bewertung entsteht in Headless-Funktionen und Services.

---

# 25. Kompakter Codex-Auftrag für Panel 8

```text
Baue Panel 8: Routenbewertung und Routendarstellung für die SCIM.

Panel 8 liest context.system_adjust, context.regio_content, context.target_app_ui, context.scim_context, context.graph, context.basis_layer, context.poi_model, context.load_model, context.movement_model und context.masking_model. Es schreibt ausschließlich context.route_model, context.route_layer_model und context.leaflet_route_check.

Baue zuerst headless:
- routeEvaluation.types.ts
- routeEvaluation.mock.ts
- routeEvaluation.validation.ts
- routeEvaluation.sections.ts
- routeEvaluation.movement.ts
- routeEvaluation.stayContext.ts
- routeEvaluation.restrictions.ts
- routeEvaluation.profiles.ts
- routeEvaluation.options.ts
- routeEvaluation.layerComposer.ts
- routeEvaluation.leaflet.ts
- routeEvaluation.context.ts
- routeEvaluation.test.ts

Danach baue RouteEvaluationDisplayPanel.tsx mit sechs Tabs:
1. Routenabschnitte
2. Bewegungsbewertung
3. Aufenthaltskontext
4. Abwertung oder Ausschluss
5. Routendarstellung
6. Leaflet-Vergleich

Wichtig:
- Panel 8 berechnet Aufenthalt, Bewegung und Maskierung nicht neu.
- Panel 8 verdichtet Panel-7-Ergebnisse auf routenrelevante Abschnitte.
- Vollständig maskierte Kanten dürfen nicht als normale Bewegung bewertet werden.
- Privacy-blocked oder expired Load-Werte dürfen keine Routenwirkung erzeugen.
- Aufenthaltskontext kann warnen, abwerten oder je Profil ausschließen.
- Regionale harte Sperren überschreiben normale Abschnittseignung.
- Grenzwertüberschreitungen führen standardmäßig zunächst zur Abwertung; harter Ausschluss braucht System-, Regio- oder Profilgrundlage.
- RouteLayer müssen Operator-, Debug- und Sensus-Core-Kandidaten strikt trennen.
- Sensus-Core-Kandidaten dürfen keine Rohsignale, Geräteinformationen oder Debugdaten enthalten.
- Panel 8 erzeugt kein finales Sensus-Core-Paket, keine lokale User-Auswahl und keine finale Freigabe.
```

---

# 26. Kernaussage für Panel 8

> Panel 8 ist die routenwirksame Bewertungsstufe der SCIM: Es nimmt Graph, Bewegung, Aufenthalt, Maskierung, Sperren, Staustellenindikatoren und Routentypen auf und erzeugt daraus bewertete Routenabschnitte, vorbereitete Routenoptionen und prüfbare Leaflet-Routenlayer. Seine wichtigste Regel lautet: Panel 8 bewertet Routenwirkung, aber es rekonstruiert keine Signale und klassifiziert Aufenthalt oder Bewegung nicht neu.

---

# 27. Mock-Daten

```ts
export const mockRouteModelState: RouteModelState = {
  route_model_id: 'route_model_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  graph_id: 'graph_hochwab_nord_001',
  movement_model_id: 'movement_hochwab_nord_001',
  masking_model_id: 'masking_hochwab_nord_001',
  created_at: '2026-05-21T00:00:00.000Z',
  evaluation_version: 'route_eval_v1.0.0',
  route_sections: [
    {
      route_section_id: 'route_section_001',
      source_section_candidate_id: 'section_candidate_001',
      representation_id: 'rep_hochwab_nord_001',
      graph_id: 'graph_hochwab_nord_001',
      edge_ids: ['edge_way_001_001', 'edge_way_001_002'],
      from_node_id: 'node_start_001',
      to_node_id: 'node_end_001',
      geometry: {
        type: 'LineString',
        coordinates: [
          [15.21, 47.64],
          [15.22, 47.65],
          [15.23, 47.66]
        ]
      },
      length_meters: 820,
      section_type: 'between_topological_nodes',
      boundary_relation: 'inside_boundary',
      movement_evaluation: {
        movement_score: 0.58,
        weighted_movement_score: 0.61,
        max_edge_movement_score: 0.71,
        average_density_score: 0.62,
        high_load_edge_ratio: 0.25,
        evaluated_edge_count: 1,
        unevaluated_edge_count: 0,
        masked_edge_count: 1,
        confidence_score: 0.78,
        movement_class: 'medium',
        status: 'movement_evaluation_valid'
      },
      stay_context: {
        touched_stay_area_ids: ['stay_area_candidate_001'],
        related_active_poi_ids: ['active_poi_001'],
        max_stay_score: 0.74,
        average_stay_score: 0.74,
        stay_context_score: 0.68,
        affected_length_meters: 120,
        affected_length_ratio: 0.146,
        relation: 'partial_overlap',
        route_effect: 'degrade_candidate',
        status: 'stay_context_valid'
      },
      masking_context: {
        masked_edge_ids: ['edge_way_001_002'],
        fully_masked_edge_ids: [],
        partially_masked_edge_ids: ['edge_way_001_002'],
        mask_count: 1,
        masked_length_meters: 120,
        masked_length_ratio: 0.146,
        movement_usable_length_meters: 700,
        route_effect: 'degrade_section',
        status: 'masking_context_valid'
      },
      restriction_context: {
        related_restriction_ids: [],
        active_restriction_count: 0,
        warning_count: 0,
        degrade_count: 0,
        exclude_count: 0,
        strongest_route_effect: 'none',
        display_effects: [],
        status: 'restriction_context_valid'
      },
      jam_context: {
        related_jam_indicator_ids: ['jam_candidate_001'],
        max_jam_score: 0.41,
        average_jam_score: 0.41,
        confidence_score: 0.55,
        route_effect: 'warning_only',
        status: 'jam_context_warning'
      },
      profile_results: [
        {
          profile_id: 'regional_low_load_profile',
          route_mode_id: 'low_load',
          route_priority: 'low_load',
          movement_threshold: 0.7,
          stay_threshold: 0.7,
          degrade_threshold: 0.65,
          exclude_threshold: 0.9,
          effective_score: 0.66,
          status: 'degraded',
          reason_codes: ['ROUTE_PARTIALLY_MASKED', 'ROUTE_STAY_CONTEXT_HIGH'],
          warnings: [
            {
              warning_id: 'route_warning_001',
              warning_type: 'high_stay_context',
              severity: 'warning',
              message_key: 'route.section.high_stay_context',
              sensus_core_eligible: true,
              operator_only: false
            }
          ]
        }
      ],
      overall_route_status: 'degraded',
      route_readiness: {
        usable_for_route_options: true,
        usable_for_low_load_route: true,
        usable_for_fastest_route: true,
        usable_for_fallback_route: true,
        blocks_sensus_core_export: false
      },
      warnings: [
        {
          warning_id: 'route_warning_001',
          warning_type: 'high_stay_context',
          severity: 'warning',
          message_key: 'route.section.high_stay_context',
          sensus_core_eligible: true,
          operator_only: false
        }
      ]
    }
  ],
  route_options: [
    {
      route_option_id: 'route_option_low_load_001',
      source: 'manual_mock',
      route_mode_id: 'low_load',
      label: 'Auslastungsarme Route – Mock',
      section_ids: ['route_section_001'],
      geometry: {
        type: 'LineString',
        coordinates: [
          [15.21, 47.64],
          [15.22, 47.65],
          [15.23, 47.66]
        ]
      },
      total_length_meters: 820,
      estimated_duration_seconds: 900,
      classic_route_metrics: {
        distance_meters: 820,
        duration_seconds: 900,
        elevation_gain_meters: 60,
        source: 'manual_mock'
      },
      scim_route_score: {
        overall_score: 0.66,
        movement_score: 0.61,
        stay_context_score: 0.68,
        restriction_score: 0,
        jam_score: 0.41,
        confidence_score: 0.76,
        degraded_section_count: 1,
        excluded_section_count: 0,
        warning_section_count: 1
      },
      status: 'degraded',
      warnings: [
        {
          warning_id: 'route_option_warning_001',
          related_section_ids: ['route_section_001'],
          warning_type: 'high_stay_context',
          severity: 'warning',
          message_key: 'route.option.contains_degraded_section',
          sensus_core_eligible: true
        }
      ],
      sensus_core_candidate: true,
      debug_only: false
    }
  ],
  route_profiles_applied: [
    {
      profile_id: 'regional_low_load_profile',
      route_mode_id: 'low_load',
      source: 'regio_content',
      applied_at: '2026-05-21T00:00:00.000Z'
    }
  ],
  route_model_summary: {
    route_section_count: 1,
    suitable_section_count: 0,
    warning_section_count: 0,
    degraded_section_count: 1,
    excluded_section_count: 0,
    fallback_only_section_count: 0,
    route_option_count: 1,
    recommended_route_option_count: 0,
    warning_count: 1,
    error_count: 0
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_graph_id: 'graph_hochwab_nord_001',
    checked_against_movement_model_id: 'movement_hochwab_nord_001',
    checked_against_masking_model_id: 'masking_hochwab_nord_001',
    checked_against_system_adjust_version: 'sys_v1.0.0'
  },
  status: 'route_model_valid'
};

export const mockRouteLayerModelState: RouteLayerModelState = {
  route_layer_model_id: 'route_layer_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  route_model_id: 'route_model_hochwab_nord_001',
  created_at: '2026-05-21T00:00:00.000Z',
  layer_format: 'geojson',
  operator_route_geojson: {
    type: 'FeatureCollection',
    features: []
  },
  route_section_geojson: {
    type: 'FeatureCollection',
    features: []
  },
  route_warning_geojson: {
    type: 'FeatureCollection',
    features: []
  },
  sensus_core_candidate_geojson: {
    type: 'FeatureCollection',
    features: []
  },
  debug_route_geojson: {
    type: 'FeatureCollection',
    features: []
  },
  layer_summary: {
    operator_feature_count: 1,
    route_section_feature_count: 1,
    warning_feature_count: 1,
    sensus_core_candidate_feature_count: 1,
    debug_feature_count: 1,
    excluded_feature_count: 0,
    degraded_feature_count: 1,
    warning_count: 0,
    error_count: 0
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_route_model_id: 'route_model_hochwab_nord_001'
  },
  status: 'route_layer_valid'
};

export const mockLeafletRouteCheckState: LeafletRouteCheckState = {
  leaflet_route_check_id: 'leaflet_route_check_hochwab_nord_001',
  representation_id: 'rep_hochwab_nord_001',
  route_model_id: 'route_model_hochwab_nord_001',
  route_layer_model_id: 'route_layer_hochwab_nord_001',
  checked_at: '2026-05-21T00:00:00.000Z',
  visible_overlays: [
    'boundary',
    'basis_layer',
    'route_sections',
    'movement_evaluation',
    'stay_context',
    'masked_edges',
    'route_options'
  ],
  check_items: [
    {
      check_id: 'leaflet_route_check_item_001',
      label: 'Routenabschnitte liegen auf Graphkanten',
      passed: true,
      severity: 'info',
      related_ids: ['route_section_001'],
      message: 'Der bewertete Routenabschnitt liegt plausibel auf den Graphkanten.'
    }
  ],
  issues: [],
  status: 'leaflet_route_valid'
};
```

## 27.1 Ergänzende Typen für Mock-Daten

```ts
export interface AppliedRouteProfile {
  profile_id: string;
  route_mode_id: string;
  source: 'system_adjust' | 'regio_content' | 'target_app_ui' | 'mock';
  applied_at: string;
}

export interface RouteModelSummary {
  route_section_count: number;
  suitable_section_count: number;
  warning_section_count: number;
  degraded_section_count: number;
  excluded_section_count: number;
  fallback_only_section_count: number;
  route_option_count: number;
  recommended_route_option_count: number;
  warning_count: number;
  error_count: number;
}

export interface RouteLayerValidationResult {
  is_valid: boolean;
  errors: RouteEvaluationIssue[];
  warnings: RouteEvaluationIssue[];
  checked_at: string;
  checked_against_route_model_id: string;
}
```
