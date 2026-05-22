# SCIM Simulation-Load Adapter Spec

## 0. Zweck dieses Dokuments

Dieses Dokument definiert den **Simulation-Load Adapter** für SCIM.

Der Adapter dient dazu, Panel 4: **Telco-Load Input** mit simulierten, aber strukturell gültigen Load-Daten zu versorgen. Dadurch können Panel 7: **POI, Load und Bewegung**, Panel 8: **Routenbewertung und Routendarstellung**, Panel 9: **Sensus-Core Package Builder** und die weiteren Folgepanels getestet werden, bevor echte Telco-Load-Daten verfügbar sind.

Leitsatz:

> Simulation-Load ersetzt nicht die Datenschutz- und Aggregationsregeln. Simulation-Load ersetzt nur die externe Telco-Quelle.

---

## 1. Einordnung in die SCIM-Kette

Der Simulation-Load Adapter ist **kein neues Hauptpanel**.

Er ist eine zulässige Quelle innerhalb von:

```txt
Panel 4: Telco-Load Input
```

Panel 4 kann Load-Daten aus mehreren Quellen laden:

```txt
echter Telco-Load
Runtime-Load-Service
aggregierter Load-Backend-Service
Simulation-Load Adapter
Mock-Datei
lokale JSON-Konfiguration
```

Der Adapter schreibt nicht direkt in den globalen SCIM-Kontext. Er liefert an Panel 4 ein Datenpaket, das Panel 4 normalisiert, validiert und anschließend als `context.telco_load` übernimmt.

---

## 2. Grundregel

Ein Simulation-Load-Batch muss so aussehen, als wäre er ein bereits aggregierter, datenschutzkonformer Load-Batch.

Er darf nicht enthalten:

- einzelne Geräte,
- einzelne Standortpunkte,
- Rohsignale,
- Einzeltraces,
- nicht aggregierte Bewegungsdaten,
- individuelle Aufenthaltsdauer,
- rückführbare Telco-IDs,
- reale personenbezogene Daten.

Er muss enthalten:

- Batch-ID,
- Quelle `simulation`,
- Zeitfenster,
- räumlichen Scope,
- aggregierte Signalgruppen,
- Aggregationsniveau,
- Signalqualität,
- Verfallsregeln,
- Datenschutzstatus,
- Simulationsszenario,
- Validierungsstatus.

Kurzform:

```txt
Simulation erzeugt aggregierte Test-Last, keine Rohdaten.
```

---

## 3. Verantwortung des Simulation-Load Adapters

Der Adapter darf:

- künstliche Load-Gruppen erzeugen,
- räumliche Cluster simulieren,
- Bewegungsgruppen simulieren,
- Aufenthaltsgruppen in POI-Nähe simulieren,
- Staustellenkandidaten simulieren,
- Zeitfenster und Verfall simulieren,
- Signalqualität variieren,
- Datenschutz-Grenzfälle testen,
- Szenarien für Panel 7 und Panel 8 vorbereiten.

Der Adapter darf nicht:

- Aufenthalt final klassifizieren,
- Bewegungsauslastung final berechnen,
- Kanten maskieren,
- Routenabschnitte bewerten,
- Routenvorschläge erzeugen,
- Sensus-Core-Pakete erzeugen,
- System-Adjust oder Regio-Content ändern,
- Mindestaggregation umgehen,
- privacy-blocked Gruppen als gültig markieren.

---

## 4. Zielzustand für Panel 4

Panel 4 soll aus dem Simulation-Adapter einen normalen `TelcoLoadState` erzeugen können.

Zielstruktur:

```ts
export interface TelcoLoadState {
  telco_load_batch_id: string;
  source: TelcoLoadSource;
  loaded_at: string;
  provider?: TelcoProviderInfo;
  time_window: LoadTimeWindow;
  spatial_scope: LoadSpatialScope;
  load_signals: LoadSignalGroup[];
  aggregation_level: LoadAggregationLevel;
  signal_quality: LoadSignalQualitySummary;
  expiry_rules: LoadExpiryRules;
  privacy_check: LoadPrivacyCheck;
  validation: TelcoLoadValidationResult;
  status: TelcoLoadStatus;
}
```

Für Simulation gilt:

```ts
source = 'simulation'
provider.raw_signal_access = false
provider.device_level_access = false
```

---

## 5. Erweiterung: Simulation-Metadaten

Zusätzlich zum normalen `TelcoLoadState` sollte ein Simulation-Batch Metadaten führen.

```ts
export interface SimulationLoadMetadata {
  simulation_id: string;
  simulation_name: string;
  simulation_profile: SimulationLoadProfile;
  generated_at: string;
  seed?: number;
  deterministic: boolean;
  scenario_tags: SimulationScenarioTag[];
  intended_test_targets: SimulationTestTarget[];
  notes?: string;
}
```

Diese Metadaten können entweder in `TelcoLoadState.provider` oder in einem dedizierten Feld geführt werden:

```ts
simulation_metadata?: SimulationLoadMetadata;
```

Für produktive echte Telco-Daten bleibt dieses Feld leer.

---

## 6. SimulationLoadProfile

```ts
export type SimulationLoadProfile =
  | 'empty_area'
  | 'low_uniform_load'
  | 'high_uniform_load'
  | 'poi_stay_cluster'
  | 'movement_corridor'
  | 'mixed_stay_and_movement'
  | 'jam_candidate'
  | 'expired_load'
  | 'privacy_blocked_load'
  | 'low_quality_load'
  | 'boundary_edge_case'
  | 'buffer_only_load'
  | 'conflicting_signals'
  | 'route_degrade_case'
  | 'route_exclude_case'
  | 'fallback_route_case';
```

---

## 7. Scenario Tags

```ts
export type SimulationScenarioTag =
  | 'no_load'
  | 'valid_load'
  | 'invalid_load'
  | 'privacy_boundary'
  | 'below_min_devices'
  | 'below_min_signals'
  | 'expired'
  | 'low_quality'
  | 'poi_related'
  | 'movement_related'
  | 'jam_related'
  | 'route_related'
  | 'boundary_related'
  | 'buffer_related'
  | 'stress_test';
```

---

## 8. Intended Test Targets

```ts
export type SimulationTestTarget =
  | 'panel_4_validation'
  | 'panel_5_load_prefilter'
  | 'panel_6_load_reference_check'
  | 'panel_7_load_projection'
  | 'panel_7_stay_logic'
  | 'panel_7_movement_logic'
  | 'panel_7_masking'
  | 'panel_7_jam_indicators'
  | 'panel_8_route_degradation'
  | 'panel_8_route_exclusion'
  | 'panel_9_package_reduction'
  | 'panel_10_local_view'
  | 'panel_11_effect_check'
  | 'panel_12_release_blocker';
```

---

## 9. Simulation-Batch Input

Der Adapter sollte mit einem Konfigurationsobjekt arbeiten.

```ts
export interface SimulationLoadAdapterInput {
  simulation_id: string;
  profile: SimulationLoadProfile;
  representation_id?: string;
  region_id?: string;
  bbox?: BBox;
  boundary_geometry?: GeoJsonPolygonOrMultiPolygon;
  poi_refs?: SimulationPoiRef[];
  graph_refs?: SimulationGraphRef[];
  system_adjust: SystemAdjustState;
  regio_content?: RegioContentState;
  target_app_ui?: TargetAppUiState;
  time_window: SimulationTimeWindowConfig;
  density_config: SimulationDensityConfig;
  quality_config: SimulationQualityConfig;
  privacy_config: SimulationPrivacyConfig;
  seed?: number;
}
```

---

## 10. SimulationPoiRef

POI-Referenzen dienen dazu, Aufenthaltscluster in der Nähe freigegebener POIs zu simulieren.

```ts
export interface SimulationPoiRef {
  poi_id: string;
  center: GeoPoint;
  radius_meters: number;
  category?: string;
  approved: boolean;
}
```

Regel:

> Aufenthaltsrelevante Simulationen dürfen nur an `approved = true` POIs als gültige Aufenthaltskandidaten markiert werden.

Nicht freigegebene POIs dürfen genutzt werden, um Negativtests zu erzeugen. Dann muss die Gruppe später von Panel 7 blockiert oder als nicht aufenthaltsrelevant behandelt werden.

---

## 11. SimulationGraphRef

Graph-Referenzen dienen dazu, Bewegungskorridore oder Staustellenkandidaten entlang von Graphkanten zu simulieren.

```ts
export interface SimulationGraphRef {
  edge_id?: string;
  route_section_candidate_id?: string;
  geometry: GeoJsonLineString;
  inside_boundary: boolean;
  inside_buffer_only?: boolean;
}
```

Regel:

> Der Simulation-Adapter darf Graph-Referenzen nutzen, aber keine Graphstruktur erzeugen oder verändern.

---

## 12. SimulationTimeWindowConfig

```ts
export interface SimulationTimeWindowConfig {
  start_at: string;
  end_at: string;
  generated_at: string;
  aggregation_window_seconds: number;
  timezone?: string;
  expiry_mode: SimulationExpiryMode;
}
```

```ts
export type SimulationExpiryMode =
  | 'fresh'
  | 'near_expiry'
  | 'expired'
  | 'future_invalid';
```

Regeln:

```txt
fresh          → gültig innerhalb max_raw_signal_validity_seconds
near_expiry    → knapp gültig, Warnung möglich
expired        → muss als veraltet markiert oder blockiert werden
future_invalid → muss blockieren
```

---

## 13. SimulationDensityConfig

```ts
export interface SimulationDensityConfig {
  group_count: number;
  min_group_signal_count: number;
  max_group_signal_count: number;
  min_distinct_devices: number;
  max_distinct_devices: number;
  spatial_spread_meters: number;
  intensity_distribution: SimulationIntensityDistribution;
}
```

```ts
export type SimulationIntensityDistribution =
  | 'uniform_low'
  | 'uniform_medium'
  | 'uniform_high'
  | 'clustered'
  | 'corridor_weighted'
  | 'edge_hotspot'
  | 'mixed';
```

Regel:

> Signalanzahl und Geräteanzahl müssen gegen System-Adjust validierbar sein.

---

## 14. SimulationQualityConfig

```ts
export interface SimulationQualityConfig {
  spatial_accuracy_class: SimulationAccuracyClass;
  temporal_accuracy_class: SimulationAccuracyClass;
  confidence_class: SimulationConfidenceClass;
  conflicting_groups: boolean;
  missing_optional_fields: boolean;
}
```

```ts
export type SimulationAccuracyClass =
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown';

export type SimulationConfidenceClass =
  | 'high'
  | 'medium'
  | 'low'
  | 'invalid';
```

Regel:

> Niedrige Qualität darf nicht automatisch blockieren, wenn Datenschutz und Aggregation erfüllt sind. Sie muss aber als Warnung oder reduzierte Confidence an Folgepanels übergeben werden.

---

## 15. SimulationPrivacyConfig

```ts
export interface SimulationPrivacyConfig {
  force_below_min_devices: boolean;
  force_below_min_signals: boolean;
  force_single_device_case: boolean;
  force_raw_signal_like_properties: boolean;
  force_device_level_like_properties: boolean;
  expected_privacy_status: 'valid' | 'warning' | 'blocked';
}
```

Verwendung:

- positive Tests mit `expected_privacy_status = valid`,
- Grenzwerttests mit `warning`,
- Negativtests mit `blocked`.

Regel:

> Auch wenn `force_raw_signal_like_properties = true` gesetzt wird, dürfen keine echten Rohdaten erzeugt werden. Es werden nur synthetische verbotene Testfelder erzeugt, um Filter und Blocker zu testen.

---

## 16. LoadSignalGroup

Simulation erzeugt aggregierte Load-Gruppen.

```ts
export interface LoadSignalGroup {
  signal_group_id: string;
  group_type: LoadSignalGroupType;
  geometry: GeoJsonGeometry;
  time_window: LoadTimeWindow;
  aggregate_counts: LoadAggregateCounts;
  quality: LoadSignalGroupQuality;
  intended_semantic_hint?: SimulationSemanticHint;
  privacy_status: LoadSignalPrivacyStatus;
  status: LoadSignalGroupStatus;
}
```

---

## 17. LoadSignalGroupType

```ts
export type LoadSignalGroupType =
  | 'area_aggregate'
  | 'corridor_aggregate'
  | 'poi_radius_aggregate'
  | 'edge_nearby_aggregate'
  | 'jam_candidate_aggregate'
  | 'unknown_aggregate';
```

Regel:

> `group_type` ist noch keine fachliche SCIM-Klassifikation. Panel 7 entscheidet später über Aufenthalt, Bewegung oder Staustellenkandidat.

---

## 18. LoadAggregateCounts

```ts
export interface LoadAggregateCounts {
  distinct_device_count_bucket: CountBucket;
  signal_count_bucket: CountBucket;
  duration_bucket_seconds?: CountBucket;
}
```

```ts
export type CountBucket =
  | 'below_minimum'
  | 'minimum_met'
  | 'medium'
  | 'high'
  | 'very_high'
  | 'unknown';
```

Warum Buckets?

> Sensus Core und öffentliche Ausgaben sollen keine exakten Device Counts oder Signal Counts erhalten. Für Simulation, Validierung und interne Panel-4-Prüfung können Buckets ausreichen. Falls Panel 4 interne numerische Testwerte braucht, müssen sie vor Panel 9 entfernt oder reduziert werden.

Optional intern:

```ts
internal_test_counts?: {
  distinct_devices: number;
  signal_count: number;
}
```

Diese internen Testwerte dürfen niemals in Sensus-Core-Pakete gelangen.

---

## 19. SimulationSemanticHint

Simulation darf Hinweise geben, wofür eine Gruppe gedacht ist. Diese Hinweise sind Testhilfen und keine fachliche Entscheidung.

```ts
export type SimulationSemanticHint =
  | 'intended_stay'
  | 'intended_movement'
  | 'intended_jam'
  | 'intended_noise'
  | 'intended_invalid'
  | 'intended_boundary_case'
  | 'intended_buffer_case';
```

Regel:

> Panel 7 darf das Hint-Feld für Tests auswerten, aber die produktionsähnliche Logik muss auch ohne Hint funktionieren.

---

## 20. LoadSignalPrivacyStatus

```ts
export type LoadSignalPrivacyStatus =
  | 'privacy_valid'
  | 'privacy_warning'
  | 'privacy_blocked';
```

Blockierte Gruppen dürfen von Panel 7 nicht verarbeitet werden.

---

## 21. LoadSignalGroupStatus

```ts
export type LoadSignalGroupStatus =
  | 'valid'
  | 'warning'
  | 'invalid'
  | 'expired'
  | 'privacy_blocked';
```

---

## 22. Adapter Output

Der Adapter liefert ein `SimulationLoadAdapterOutput`.

```ts
export interface SimulationLoadAdapterOutput {
  simulation_metadata: SimulationLoadMetadata;
  raw_simulation_batch: SimulationLoadBatch;
  normalized_telco_load_candidate: TelcoLoadState;
  expected_results?: SimulationExpectedResults;
}
```

Panel 4 übernimmt nicht blind den Kandidaten, sondern validiert ihn wie jeden anderen Load-Batch.

---

## 23. SimulationLoadBatch

```ts
export interface SimulationLoadBatch {
  simulation_batch_id: string;
  source: 'simulation';
  generated_at: string;
  time_window: LoadTimeWindow;
  spatial_scope: LoadSpatialScope;
  load_signal_groups: LoadSignalGroup[];
  quality_summary: LoadSignalQualitySummary;
  privacy_check: LoadPrivacyCheck;
  scenario: SimulationLoadProfile;
  status: TelcoLoadStatus;
}
```

---

## 24. Expected Results

Optional kann die Simulation erwartete Resultate für Tests mitliefern.

```ts
export interface SimulationExpectedResults {
  expected_valid_group_count?: number;
  expected_invalid_group_count?: number;
  expected_privacy_blocked_group_count?: number;
  expected_stay_candidate_count?: number;
  expected_movement_candidate_count?: number;
  expected_masked_edge_count?: number;
  expected_jam_candidate_count?: number;
  expected_route_degraded_sections?: number;
  expected_route_excluded_sections?: number;
  expected_package_blocked?: boolean;
}
```

Regel:

> Expected Results sind nur Testorakel. Sie dürfen nicht in produktive Pipeline-Entscheidungen einfließen.

---

## 25. Standardszenarien

## 25.1 Empty Area

Zweck:

- Testet, ob Panels ohne Load sauber arbeiten.

Erwartung:

```txt
Panel 4: telco_load_valid oder telco_load_warning
Panel 7: keine Aufenthalte, keine Bewegungslast
Panel 8: loadless route mode möglich, falls erlaubt
Panel 9: Paket ohne Load-Layer möglich, falls Ziel-App erlaubt
```

---

## 25.2 Low Uniform Load

Zweck:

- Basisfall mit geringer, gültiger Auslastung.

Erwartung:

```txt
Panel 7: Bewegungslast niedrig
Panel 8: Routen normal oder empfohlen
Panel 9: reduzierte low_load Darstellung
```

---

## 25.3 High Uniform Load

Zweck:

- Testet hohe Bewegungslast ohne POI-Aufenthalt.

Erwartung:

```txt
Panel 7: hohe Bewegungslast auf mehreren Kanten
Panel 8: Warnung oder Abwertung je Routentyp
Panel 9: public_score_class high_load oder very_high_load
```

---

## 25.4 POI Stay Cluster

Zweck:

- Testet Aufenthalt innerhalb eines freigegebenen POI-Radius.

Erwartung:

```txt
Panel 7: Aufenthalt wird erkannt
Panel 7: betroffene Kanten werden maskiert
Panel 7: Aufenthaltssignale werden nicht als Bewegung gezählt
Panel 8: Aufenthaltskontext wirkt auf Routenabschnitte
```

---

## 25.5 Movement Corridor

Zweck:

- Testet Bewegung entlang von Graphkanten.

Erwartung:

```txt
Panel 7: Load wird auf Bewegungskanten projiziert
Panel 7: movement_model entsteht
Panel 8: Routenabschnittsbewertung erhält Bewegungskontext
```

---

## 25.6 Mixed Stay and Movement

Zweck:

- Testet saubere Trennung von Aufenthalt und Bewegung.

Erwartung:

```txt
Panel 7: Aufenthalt maskiert Bewegung
Panel 7: keine Doppelverwertung
Panel 8: Abschnittsbewertung nutzt Maskierung korrekt
```

---

## 25.7 Jam Candidate

Zweck:

- Testet Staustellenindikatoren.

Erwartung:

```txt
Panel 7: jam_indicator candidate
Panel 8: Warnung oder Abwertung, falls Feature Flag aktiv
Panel 9: reduzierte öffentliche Warnung, falls Ziel-App erlaubt
```

---

## 25.8 Expired Load

Zweck:

- Testet Verfallslogik.

Erwartung:

```txt
Panel 4: telco_load_expired oder warning
Panel 7: keine runtime-gültige Verarbeitung
Panel 8: keine aktuelle Load-Wirkung
```

---

## 25.9 Privacy Blocked Load

Zweck:

- Testet Mindestaggregation und Datenschutzblocker.

Erwartung:

```txt
Panel 4: telco_load_privacy_blocked oder Gruppen blockiert
Panel 7: blockierte Gruppen werden nicht verarbeitet
Panel 9: keine privacy-blocked Inhalte im Paket
Panel 12: Export blockiert, falls privacy-blocked Daten durchrutschen
```

---

## 25.10 Boundary Edge Case

Zweck:

- Testet Randbereiche und Pufferlogik.

Erwartung:

```txt
Panel 5: Load-Referenzen im Puffer werden korrekt geführt
Panel 6: Graphraum deckt spätere Projektion ab
Panel 7: inside_boundary und inside_buffer_only werden unterschieden
Panel 8: Routenabschnitte am Rand werden korrekt bewertet
```

---

## 26. Szenario-Matrix

| Szenario | Panel 4 | Panel 7 | Panel 8 | Panel 9 |
|---|---|---|---|---|
| empty_area | Validierung ohne Last | keine Lastmodelle | klassische Route möglich | Paket ohne Load-Layer |
| low_uniform_load | gültiger Batch | niedrige Bewegung | normale Route | low_load Klasse |
| high_uniform_load | gültiger Batch | hohe Bewegung | Warnung/Abwertung | reduzierte Warnung |
| poi_stay_cluster | gültiger Batch | Aufenthalt + Maskierung | Aufenthaltskontext | reduzierte Stay-Area |
| movement_corridor | gültiger Batch | Bewegungskanten | Abschnittsbewertung | Route Load Summary |
| mixed_stay_and_movement | gültiger Batch | Trennung Aufenthalt/Bewegung | korrekte Routenwirkung | reduzierte Ausgabe |
| jam_candidate | gültig/warnend | Jam-Indikator | Warnung/Abwertung | öffentliche Warnung |
| expired_load | expired/warning | keine aktuelle Verarbeitung | keine aktuelle Wirkung | ggf. keine Lastausgabe |
| privacy_blocked_load | blocked | keine Verarbeitung | keine Wirkung | Paket blockiert oder ohne Daten |
| boundary_edge_case | gültig/warnend | Rand-/Pufferprüfung | Randbewertung | reduzierte Darstellung |

---

## 27. Adapter-Funktionen

Empfohlene Funktionen:

```ts
createSimulationLoadBatch(input: SimulationLoadAdapterInput): SimulationLoadAdapterOutput;

generateSimulationSignalGroups(input: SimulationLoadAdapterInput): LoadSignalGroup[];

buildSimulationSpatialScope(input: SimulationLoadAdapterInput): LoadSpatialScope;

buildSimulationTimeWindow(input: SimulationLoadAdapterInput): LoadTimeWindow;

calculateSimulationQualitySummary(groups: LoadSignalGroup[]): LoadSignalQualitySummary;

calculateSimulationPrivacyCheck(
  groups: LoadSignalGroup[],
  systemAdjust: SystemAdjustState
): LoadPrivacyCheck;

normalizeSimulationToTelcoLoadState(
  batch: SimulationLoadBatch,
  input: SimulationLoadAdapterInput
): TelcoLoadState;

validateSimulationLoadBatch(
  candidate: TelcoLoadState,
  systemAdjust: SystemAdjustState
): TelcoLoadValidationResult;
```

---

## 28. Determinismus

Simulationen sollten optional deterministisch sein.

```ts
seed?: number;
deterministic: boolean;
```

Regel:

> Für automatisierte Tests muss dieselbe Simulation mit gleichem Seed dieselben Load-Gruppen erzeugen.

---

## 29. Räumliche Erzeugungslogik

### 29.1 Area Aggregates

Für flächige Last:

```txt
Erzeuge Polygon- oder Grid-Zellen innerhalb Boundary/BBox.
Verteile Signalgruppen gemäß intensity_distribution.
Markiere Gruppen als area_aggregate.
```

### 29.2 POI Radius Aggregates

Für Aufenthalt:

```txt
Wähle freigegebene POIs.
Erzeuge Gruppen innerhalb oder nahe dem POI-Radius.
Setze group_type = poi_radius_aggregate.
Setze intended_semantic_hint = intended_stay.
```

### 29.3 Corridor Aggregates

Für Bewegung:

```txt
Wähle Graphkanten oder Linien.
Erzeuge Gruppen entlang der Linie mit räumlichem Spread.
Setze group_type = corridor_aggregate oder edge_nearby_aggregate.
Setze intended_semantic_hint = intended_movement.
```

### 29.4 Jam Candidate Aggregates

Für Staustellen:

```txt
Erzeuge hohe Dichte auf kurzem Korridor.
Erzeuge optional geringe Bewegungsfortschritt-Hinweise als aggregierten Testmarker.
Setze group_type = jam_candidate_aggregate.
```

### 29.5 Boundary / Buffer Cases

Für Randtests:

```txt
Erzeuge Gruppen knapp innerhalb Boundary.
Erzeuge Gruppen im Buffer-only-Bereich.
Erzeuge Gruppen knapp außerhalb Buffer.
Panel 5/6/7 müssen diese sauber unterscheiden.
```

---

## 30. Datenschutzvalidierung

Der Adapter muss für jede Gruppe prüfen:

```txt
distinct devices >= System-Adjust Minimum
signal count >= System-Adjust Minimum
aggregation window >= System-Adjust Minimum
spatial resolution >= System-Adjust Minimum
raw signal access = false
device level access = false
```

Gruppen, die Regeln verletzen, müssen markiert werden:

```txt
privacy_blocked
invalid
warning
```

Sie dürfen nicht als gültige Gruppen an Panel 7 gelangen.

---

## 31. Panel-4-Validierungsregeln für Simulation

Panel 4 muss Simulation genauso streng validieren wie echte Load-Daten.

Zusätzlich prüfen:

```txt
source = simulation
simulation_metadata vorhanden
provider.raw_signal_access = false
provider.device_level_access = false
scenario angegeben
generated_at vorhanden
seed bei deterministischen Tests dokumentiert
expected_results nicht als fachliche Wahrheit verwendet
```

---

## 32. Verwendung durch Panel 5

Panel 5 darf Simulation-Load nur räumlich vorfiltern oder referenzieren.

Erlaubt:

```txt
Load-Gruppen gegen Boundary und Buffer prüfen
filtered_load_signal_refs erzeugen
räumliche Abdeckung grob ausweisen
```

Nicht erlaubt:

```txt
Aufenthalt berechnen
Bewegung berechnen
Staustellen klassifizieren
Routen bewerten
```

---

## 33. Verwendung durch Panel 6

Panel 6 darf Simulation-Load nur als Kontextreferenz führen.

Erlaubt:

```txt
prüfen, ob Load-Referenzen räumlich zum Graphraum passen
Warnungen für Gruppen außerhalb Graphraum erzeugen
```

Nicht erlaubt:

```txt
Load auf Kanten projizieren
Bewegung berechnen
Aufenthalt berechnen
Maskierung berechnen
```

---

## 34. Verwendung durch Panel 7

Panel 7 ist das erste Panel, das Simulation-Load fachlich verarbeitet.

Erlaubt:

```txt
gültige Gruppen auf POI-Radien projizieren
gültige Gruppen auf Kanten projizieren
Aufenthalt berechnen
Bewegung berechnen
Maskierung erzeugen
Staustellenindikatoren vorbereiten
```

Nicht erlaubt:

```txt
privacy-blocked Gruppen verarbeiten
ungültige Gruppen reaktivieren
Simulation-Hints als alleinige Wahrheit verwenden
Load-Gruppen doppelt verbrauchen
```

---

## 35. Verwendung durch Panel 8

Panel 8 nutzt nur die berechneten Ergebnisse aus Panel 7.

Panel 8 darf nicht direkt auf Simulation-Rohgruppen zugreifen, außer für Testdiagnose.

Erlaubt:

```txt
Movement Model bewerten
Masking Model berücksichtigen
Staustellenindikatoren berücksichtigen
Routenabschnitte warnen, abwerten oder fallback-only setzen
```

Nicht erlaubt:

```txt
Simulation-Gruppen neu klassifizieren
Aufenthalt oder Bewegung neu berechnen
```

---

## 36. Verwendung durch Panel 9

Panel 9 muss sicherstellen:

```txt
Simulation-Metadaten nicht in produktive Sensus-Core-Ausgabe übernehmen
interne Testcounts entfernen
Debug- und Expected-Result-Felder entfernen
Scorewerte reduzieren
öffentliche Klassen erzeugen
```

Für Testpakete darf `package_kind = test_package` Simulation kenntlich machen.

Für produktive Pakete gilt:

```txt
Keine Simulation als produktive reale Last ausgeben.
```

---

## 37. Release-Regel für Simulation

Panel 12 darf keine `production_release` erzeugen, wenn die fachliche Lastgrundlage aus Simulation stammt.

Zulässig:

```txt
draft_release
test_release
staging_release
```

Nicht zulässig:

```txt
production_release mit Simulation-Load als aktuelle Lastbasis
```

Ausnahme nur, wenn Simulation ausdrücklich als Demo-/Trainingsmodus exportiert wird und nicht als produktive SCIM-Wirkung.

---

## 38. Testfälle

## 38.1 Positive Tests

```txt
creates valid low_uniform_load batch
creates valid poi_stay_cluster batch
creates valid movement_corridor batch
creates deterministic output with same seed
Panel 4 validates simulation as telco_load_valid
Panel 7 projects valid simulation groups
Panel 7 separates stay and movement
Panel 8 degrades route under high load
Panel 9 removes simulation internals from package
```

## 38.2 Negative Tests

```txt
below minimum devices → privacy_blocked
below minimum signals → privacy_blocked
future time window → invalid
expired time window → expired or warning
raw-signal-like property → blocker
device-level-like property → blocker
missing simulation metadata → invalid for simulation source
invalid scenario tag → validation error
expected_results used as runtime logic → test failure
simulation package marked production_package → blocker
production release from simulation load → blocker
```

## 38.3 Boundary Tests

```txt
group inside boundary → eligible for prefilter
group inside buffer only → reference-only or edge-case handling
group outside buffer → excluded from extraction context
group crossing boundary → warning or split/reference handling
```

## 38.4 Panel-7 Semantic Tests

```txt
stay cluster at approved POI → stay candidate
stay cluster at rejected POI → no valid stay
movement corridor outside mask → movement load
movement corridor inside active stay area → masked movement
same group assigned to stay and movement → failure
jam candidate with valid aggregation → jam indicator candidate
```

---

## 39. Empfohlene Dateistruktur

```txt
src/scim/telco-load/simulation/
  simulationLoad.types.ts
  simulationLoad.defaults.ts
  simulationLoad.scenarios.ts
  simulationLoad.generator.ts
  simulationLoad.geometry.ts
  simulationLoad.quality.ts
  simulationLoad.privacy.ts
  simulationLoad.normalize.ts
  simulationLoad.validation.ts
  simulationLoad.expected.ts
  simulationLoad.test.ts
```

Integration in Panel 4:

```txt
src/scim/telco-load/
  telcoLoad.service.ts
  telcoLoad.validation.ts
  telcoLoad.context.ts
  simulation/
```

---

## 40. Beispiel-Konfiguration

```json
{
  "simulation_id": "sim_poi_stay_001",
  "profile": "poi_stay_cluster",
  "representation_id": "rep_001",
  "time_window": {
    "start_at": "2026-05-21T08:00:00Z",
    "end_at": "2026-05-21T08:15:00Z",
    "generated_at": "2026-05-21T08:16:00Z",
    "aggregation_window_seconds": 900,
    "expiry_mode": "fresh"
  },
  "density_config": {
    "group_count": 6,
    "min_group_signal_count": 8,
    "max_group_signal_count": 40,
    "min_distinct_devices": 4,
    "max_distinct_devices": 25,
    "spatial_spread_meters": 35,
    "intensity_distribution": "clustered"
  },
  "quality_config": {
    "spatial_accuracy_class": "medium",
    "temporal_accuracy_class": "high",
    "confidence_class": "high",
    "conflicting_groups": false,
    "missing_optional_fields": false
  },
  "privacy_config": {
    "force_below_min_devices": false,
    "force_below_min_signals": false,
    "force_single_device_case": false,
    "force_raw_signal_like_properties": false,
    "force_device_level_like_properties": false,
    "expected_privacy_status": "valid"
  },
  "seed": 42
}
```

---

## 41. Beispiel Output-Ausschnitt

```json
{
  "simulation_metadata": {
    "simulation_id": "sim_poi_stay_001",
    "simulation_name": "POI Stay Cluster Test",
    "simulation_profile": "poi_stay_cluster",
    "generated_at": "2026-05-21T08:16:00Z",
    "seed": 42,
    "deterministic": true,
    "scenario_tags": ["valid_load", "poi_related"],
    "intended_test_targets": [
      "panel_7_stay_logic",
      "panel_7_masking",
      "panel_8_route_degradation"
    ]
  },
  "normalized_telco_load_candidate": {
    "telco_load_batch_id": "sim_load_001",
    "source": "simulation",
    "provider": {
      "provider_id": "simulation_adapter",
      "provider_name": "SCIM Simulation Load Adapter",
      "raw_signal_access": false,
      "device_level_access": false,
      "anonymization_method": "pre_aggregated"
    },
    "status": "telco_load_valid"
  }
}
```

---

## 42. Kurzfazit

Der Simulation-Load Adapter macht SCIM baubar und testbar, bevor echte Telco-Load-Daten verfügbar sind.

Er ist besonders wichtig für:

- Panel-4-Validierung,
- Panel-7-Aufenthaltslogik,
- Panel-7-Bewegungslogik,
- Maskierungstests,
- Staustellenindikatoren,
- Panel-8-Routenabwertung,
- Panel-9-Reduktion und Paketsicherheit,
- Panel-12-Release-Blocker bei Simulation.

Die zentrale Regel bleibt:

> Simulation darf Daten erzeugen, aber keine SCIM-Wahrheit umgehen.
