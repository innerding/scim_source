# SCIM Panel 1 – System-Adjust Input

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor jeden konkreten Panel-Auftrag. Sie definiert die Systemgrenzen, damit Panel 1 nicht als isolierte UI-Maske, sondern als erster verbindlicher Teil der gesamten SCIM-Kette gebaut wird.

### 0.1 SCIM-Gesamtsystem

SCIM ist nicht nur eine Kartenansicht und nicht nur eine Routingfunktion. SCIM umfasst:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokale Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 1 liegt in der Input- und Steuerungsschicht. Es erzeugt keine Route, keinen Graphen und keine Layer. Es definiert den systemweiten Rahmen, innerhalb dessen alle späteren Panels arbeiten müssen.

### 0.2 Rollenklärung

**SCIM-Engine**  
Der rechnerische Kern. Sie verarbeitet später Boundary, Regio-Content, Telco-Load, Graph, POIs, Aufenthalte, Bewegung, Maskierung und Routenbewertung.

**Leaflet**  
Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug. Leaflet ist nicht die Engine. Leaflet wird später vor allem genutzt für:

- Boundary zeichnen
- Boundary prüfen
- SCIM-Layer anzeigen
- Originalwege vergleichen
- Operator- und Ziel-App-Vorschau prüfen

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät bzw. in der laufzeitnahen App-Representation. Sensus Core darf nur freigegebene, reduzierte und datenschutzkonforme SCIM-Ergebnisse erhalten.

**System-Adjust**  
System-Adjust ist die systemweite Kalibrierungs- und Begrenzungsebene. Es ist die Quelle für globale Parameter, technische Grenzwerte, Datenschutzgrenzen, Mindestaggregation, zulässige Wertebereiche, Defaultwerte und Regelversionen.

### 0.3 Gemeinsamer SCIM-Kontext

Alle Panels schreiben in einen gemeinsamen SCIM-Kontext. Jedes Panel darf aber nur seinen eigenen Bereich verändern.

Grundstruktur:

```ts
export interface ScimContext {
  representation_id?: string;
  system_adjust?: SystemAdjustState;
  regio_content?: unknown;
  target_app_ui?: unknown;
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

Panel 1 darf nur schreiben in:

```ts
context.system_adjust
```

Panel 1 darf nicht schreiben in:

```ts
context.regio_content
context.target_app_ui
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

Panel 1 ist besonders wichtig, weil sein Output für alle späteren Panels eine harte Grenze bildet.

### 0.5 Datenschutzgrenze

System-Adjust setzt Datenschutzgrenzen, die nachgelagerte Ebenen nicht unterschreiten dürfen.

Nicht erlaubt in Sensus-Core-User-Ausgaben:

- Rohsignale
- Einzelsignale
- einzelne Geräte
- individuelle Bewegungswege
- individuelle Aufenthaltsdauer
- Debug-Rohwerte
- Operator-interne Prüfwerte

Panel 1 verarbeitet selbst keine Runtime-Load-Signale. Es definiert aber die Grenzen, nach denen solche Signale später verarbeitet werden dürfen.

### 0.6 System-Adjust-Vorrang

Kein späteres Panel darf System-Adjust-Grenzen unterschreiten.

Das betrifft insbesondere:

- Mindestaggregation
- Mindestanzahl unterschiedlicher Geräte
- Mindestanzahl Signale
- Aggregationszeitfenster
- Rohsignal-Gültigkeit
- räumliche Mindestauflösung
- zulässige POI-Radiusbereiche
- zulässige Vergleichssaumbreiten
- Grenzwerte für Routenbewertung
- Datenschutz- und Speichergrenzen

Wenn Regio-Content, Ziel-App UI, Telco-Load oder lokale User-Einstellungen außerhalb dieser Grenzen liegen, müssen sie später blockiert, korrigiert oder als ungültig markiert werden.

### 0.7 Regio-Content-Freigabe

POIs werden erst aufenthaltsrelevant, wenn sie regional freigegeben sind und einen bestätigten Aufenthaltsradius haben.

System-Adjust darf POI-Kandidatentypen, Default-Radien und zulässige Wertebereiche definieren. Es darf aber keinen konkreten regionalen POI final freigeben. Diese Freigabe gehört zu Panel 2: Regio-Content Input.

### 0.8 Trennung von Darstellung und Bewertung

SCIM trennt sichtbare Darstellung und fachliche Bewertung.

Ein Abschnitt kann:

- sichtbar bleiben,
- farblich als ausgelastet dargestellt werden,
- für Routenvorschläge abgewertet werden,
- für bestimmte Routentypen ausgeschlossen werden,
- für andere Routentypen weiterhin nutzbar bleiben.

System-Adjust definiert zulässige Bewertungsmodi und Grenzbereiche. Die konkrete Anwendung erfolgt später in Routenbewertung, Sensus-Core-Paket und lokaler User-Anwendung.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**System-Adjust Input**

Technischer Modulname:

```ts
SystemAdjustInputPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
loadSystemAdjustVersion()
validateSystemAdjust()
normalizeSystemAdjust()
applySystemAdjustToContext()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/system-adjust/
  SystemAdjustInputPanel.tsx
  systemAdjust.types.ts
  systemAdjust.schema.ts
  systemAdjust.defaults.ts
  systemAdjust.mock.ts
  systemAdjust.validation.ts
  systemAdjust.service.ts
  systemAdjust.context.ts
  systemAdjust.test.ts
```

---

# 2. Zweck des Panels

Panel 1 lädt, zeigt, normalisiert und validiert den systemweiten System-Adjust-Stand.

Es beantwortet für alle späteren Panels:

- Welche Systemversion ist aktiv?
- Welche Regelversionen gelten?
- Welche Datenschutzgrenzen gelten?
- Welche Mindestaggregation gilt?
- Welche Parameterbereiche sind zulässig?
- Welche Defaultwerte sollen verwendet werden?
- Welche Werte dürfen von Regio-Content, Ziel-App UI oder lokalem User Input niemals unterschritten oder überschritten werden?
- Ist der System-Adjust-Stand gültig genug, damit die SCIM-Kette weiterlaufen darf?

Leitsatz:

> Panel 1 erzeugt den nicht unterschreitbaren Rahmen für alle späteren SCIM-Panels.

---

# 3. Nicht-Ziele

Panel 1 darf nicht:

- regionale POIs freigeben
- konkrete POI-Radien für eine Region setzen
- Telco-Load-Daten verarbeiten
- Runtime-Signale aggregieren
- Boundary zeichnen
- Wege extrahieren
- Graphen bauen
- Aufenthalte berechnen
- Bewegungsauslastung berechnen
- Routen bewerten
- Leaflet-Layer erzeugen
- Sensus-Core-Pakete erzeugen
- lokale User-Einstellungen anwenden

Panel 1 ist ein Input- und Validierungspanel, kein Engine-Panel.

---

# 4. Fachliche Verantwortung

Panel 1 hat vier fachliche Kernaufgaben:

## 4.1 Systemstand laden

Das Panel lädt einen System-Adjust-Stand aus einer Quelle, zum Beispiel:

- SCIM3 Atlas Console
- lokaler Mock-Service
- statische JSON-Konfiguration
- späterer Backend-Endpunkt

## 4.2 Systemstand normalisieren

Unterschiedliche Quellen können Felder leicht anders liefern. Panel 1 muss den geladenen Systemstand in ein internes, stabiles Output-Schema überführen.

## 4.3 Systemstand validieren

Das Panel prüft:

- Pflichtfelder vorhanden
- Version vorhanden
- Datenschutzgrenzen vorhanden
- Mindestaggregation vorhanden
- Wertebereiche konsistent
- Defaultwerte innerhalb erlaubter Bereiche
- Regelversionen vollständig
- keine offensichtlich gefährlichen Null- oder Minimalwerte

## 4.4 Systemstand in Kontext schreiben

Nur wenn die Validierung erfolgreich ist, wird der System-Adjust-Stand in den gemeinsamen SCIM-Kontext geschrieben.

---

# 5. Datenmodell

## 5.1 Kernoutput

```ts
export interface SystemAdjustState {
  system_adjust_version: string;
  source: SystemAdjustSource;
  loaded_at: string;
  privacy_limits: PrivacyLimits;
  aggregation_limits: AggregationLimits;
  allowed_ranges: AllowedRanges;
  default_parameters: DefaultParameters;
  rule_versions: RuleVersions;
  feature_flags: SystemFeatureFlags;
  validation: SystemAdjustValidationResult;
  status: SystemAdjustStatus;
}
```

## 5.2 Quelle

```ts
export type SystemAdjustSource =
  | 'scim3_atlas_console'
  | 'mock'
  | 'local_json'
  | 'api';
```

## 5.3 Statuswerte

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

---

# 6. PrivacyLimits

System-Adjust definiert Datenschutzgrenzen als nicht unterschreitbare Systemgrenzen.

```ts
export interface PrivacyLimits {
  min_distinct_devices_per_visible_aggregate: number;
  min_signals_per_visible_aggregate: number;
  min_signals_per_route_relevance: number;
  min_signals_for_stay_classification: number;
  min_signals_for_movement_load: number;
  min_aggregation_window_seconds: number;
  max_raw_signal_validity_seconds: number;
  max_raw_signal_storage_seconds: number;
  max_aggregated_signal_storage_seconds: number;
  spatial_min_resolution_meters: number;
  min_visible_edge_length_meters: number;
  min_visible_stay_area_radius_meters: number;
  allow_single_device_visibility: false;
  allow_raw_signals_in_operator_ui: boolean;
  allow_raw_signals_in_sensus_core: false;
  allow_debug_data_in_sensus_core: false;
}
```

## 6.1 Harte Datenschutzregeln

Folgende Werte müssen hart blockiert werden:

```ts
allow_single_device_visibility !== false
allow_raw_signals_in_sensus_core !== false
allow_debug_data_in_sensus_core !== false
min_distinct_devices_per_visible_aggregate < 2
min_signals_per_visible_aggregate < 2
max_raw_signal_validity_seconds <= 0
spatial_min_resolution_meters <= 0
```

Empfohlene Arbeitsparameter (Entwicklungs-Defaults; Rechts-/Compliance-Freigabe vor Production):

```ts
min_distinct_devices_per_visible_aggregate = 5
min_signals_per_visible_aggregate = 15
min_signals_for_stay_classification = 10
min_signals_for_movement_load = 8
max_raw_signal_validity_seconds = 300       // 5 Minuten
max_raw_signal_storage_seconds = 300        // 5 Minuten
max_aggregated_signal_storage_seconds = 7776000  // 90 Tage
min_visible_edge_length_meters = 100
min_visible_stay_area_radius_meters = 30
```

Diese Werte sind als konfigurierbare System-Adjust-Parameter zu führen, nicht hart verdrahtet. Entscheidend ist, dass System-Adjust sie vorgibt und spätere Panels sie nicht unterschreiten können. Vor einem Production Release ist eine Rechts- und Datenschutz-Freigabe der konkreten Zahlenwerte erforderlich.

---

# 7. AggregationLimits

```ts
export interface AggregationLimits {
  min_time_window_seconds: number;
  max_time_window_seconds: number;
  default_time_window_seconds: number;
  min_distinct_devices: number;
  min_signal_count: number;
  min_stable_aggregate_duration_seconds: number;
  decay_supported: boolean;
  default_decay_half_life_seconds?: number;
}
```

Validierung:

```ts
min_time_window_seconds > 0
max_time_window_seconds >= min_time_window_seconds
default_time_window_seconds >= min_time_window_seconds
default_time_window_seconds <= max_time_window_seconds
min_distinct_devices >= privacy_limits.min_distinct_devices_per_visible_aggregate
min_signal_count >= privacy_limits.min_signals_per_visible_aggregate
```

---

# 8. AllowedRanges

System-Adjust definiert zulässige Bereiche für spätere Parameter.

```ts
export interface AllowedRanges {
  poi_radius_meters: NumericRange;
  comparison_margin_meters: NumericRange;
  boundary_buffer_meters: NumericRange;
  stay_density_ratio: NumericRange;
  movement_load_threshold: NumericRange;
  stay_load_threshold: NumericRange;
  route_degrade_threshold: NumericRange;
  route_exclude_threshold: NumericRange;
  signal_validity_seconds: NumericRange;
  smoothing_strength: NumericRange;
  edge_weight_factor: NumericRange;
}

export interface NumericRange {
  min: number;
  max: number;
  step?: number;
  unit?: string;
}
```

## 8.1 Empfohlene Mock-Bereiche

```ts
export const mockAllowedRanges: AllowedRanges = {
  poi_radius_meters: { min: 5, max: 500, step: 5, unit: 'm' },
  comparison_margin_meters: { min: 0, max: 100, step: 5, unit: 'm' },
  boundary_buffer_meters: { min: 150, max: 500, step: 10, unit: 'm' },
  stay_density_ratio: { min: 1.0, max: 5.0, step: 0.1, unit: 'ratio' },
  movement_load_threshold: { min: 0, max: 1, step: 0.01, unit: 'score' },
  stay_load_threshold: { min: 0, max: 1, step: 0.01, unit: 'score' },
  route_degrade_threshold: { min: 0, max: 1, step: 0.01, unit: 'score' },
  route_exclude_threshold: { min: 0, max: 1, step: 0.01, unit: 'score' },
  signal_validity_seconds: { min: 30, max: 3600, step: 30, unit: 's' },
  smoothing_strength: { min: 0, max: 1, step: 0.05, unit: 'score' },
  edge_weight_factor: { min: 0, max: 10, step: 0.1, unit: 'factor' }
};
```

---

# 9. DefaultParameters

Defaultwerte sind Vorschläge für spätere Panels. Sie dürfen nie außerhalb der AllowedRanges liegen.

```ts
export interface DefaultParameters {
  default_poi_radius_meters: number;
  default_comparison_margin_meters: number;
  default_stay_density_ratio: number;
  default_movement_load_threshold: number;
  default_stay_load_threshold: number;
  default_route_degrade_threshold: number;
  default_route_exclude_threshold: number;
  default_signal_validity_seconds: number;
  default_smoothing_strength: number;
  default_edge_weight_factor: number;
  route_exceedance_default_behavior: RouteExceedanceBehavior;
}

export type RouteExceedanceBehavior =
  | 'warn'
  | 'degrade'
  | 'exclude'
  | 'profile_dependent';
```

## 9.1 Empfohlene Mock-Defaults

```ts
export const mockDefaultParameters: DefaultParameters = {
  default_poi_radius_meters: 50,
  default_comparison_margin_meters: 25,
  default_stay_density_ratio: 1.6,
  default_movement_load_threshold: 0.7,
  default_stay_load_threshold: 0.7,
  default_route_degrade_threshold: 0.65,
  default_route_exclude_threshold: 0.9,
  default_signal_validity_seconds: 900,   // 15 Minuten
  default_decay_half_life_seconds: 450,   // 7,5 Minuten
  default_smoothing_strength: 0.35,
  default_edge_weight_factor: 1.0,
  route_exceedance_default_behavior: 'degrade'
};
```

Fachlicher Hintergrund:

- Vergleichssaum als Arbeitsannahme: 25 m
- Aufenthaltsklassifizierung als Arbeitsannahme: POI-Kumulationsdichte mindestens 1,6-mal so hoch wie angrenzende Bewegungsdichte
- Grenzwertüberschreitungen zunächst eher abwerten als hart ausschließen, sofern kein Profil oder keine Systemgrenze etwas anderes vorgibt

---

# 10. RuleVersions

Regelversionen müssen getrennt geführt werden, damit spätere Ergebnisse nachvollziehbar und reproduzierbar bleiben.

```ts
export interface RuleVersions {
  system_rules: string;
  privacy_rules: string;
  aggregation_rules: string;
  poi_candidate_rules: string;
  stay_classification_rules: string;
  movement_classification_rules: string;
  route_evaluation_rules: string;
  layer_reduction_rules: string;
  sensus_core_export_rules: string;
}
```

Validierung:

- keine leeren Strings
- semantische Versionierung bevorzugt, zum Beispiel `1.0.0`
- Versionen müssen im Output erhalten bleiben
- jedes spätere Package muss die verwendeten Regelversionen referenzieren können

---

# 11. FeatureFlags

Feature Flags erlauben spätere Ausbaustufen, ohne die Kernlogik umzubauen.

```ts
export interface SystemFeatureFlags {
  enable_poi_candidate_suggestions: boolean;
  enable_stay_classification: boolean;
  enable_movement_load: boolean;
  enable_route_evaluation: boolean;
  enable_jam_indicators: boolean;
  enable_leaflet_debug_layers: boolean;
  enable_sensus_core_export: boolean;
  enable_local_user_tolerances: boolean;
}
```

Wichtig:

Feature Flags dürfen Datenschutzgrenzen nicht umgehen. Auch wenn Debug-Layer erlaubt sind, dürfen sie nicht in Sensus Core exportiert werden.

---

# 12. Validierung

## 12.1 ValidationResult

```ts
export interface SystemAdjustValidationResult {
  is_valid: boolean;
  errors: SystemAdjustIssue[];
  warnings: SystemAdjustIssue[];
  checked_at: string;
}

export interface SystemAdjustIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
  blocking: boolean;
}
```

## 12.2 Pflichtvalidierungen

### Version

```ts
system_adjust_version must exist
system_adjust_version must be non-empty
```

### Privacy

```ts
privacy_limits must exist
allow_single_device_visibility must be false
allow_raw_signals_in_sensus_core must be false
allow_debug_data_in_sensus_core must be false
min_distinct_devices_per_visible_aggregate >= 2
min_signals_per_visible_aggregate >= 2
max_raw_signal_validity_seconds > 0
max_raw_signal_storage_seconds >= 0
spatial_min_resolution_meters > 0
```

### Aggregation

```ts
aggregation_limits must exist
min_time_window_seconds > 0
max_time_window_seconds >= min_time_window_seconds
default_time_window_seconds within min/max
min_distinct_devices >= privacy minimum
min_signal_count >= privacy minimum
```

### Ranges

```ts
all ranges must have min <= max
all relevant numeric defaults must be inside their allowed range
route_degrade_threshold <= route_exclude_threshold
```

### RuleVersions

```ts
all rule version fields must exist
no rule version field may be empty
```

## 12.3 Warnungen

Warnungen blockieren nicht automatisch, sollen aber sichtbar sein.

Beispiele:

```ts
min_distinct_devices_per_visible_aggregate is low
min_signals_per_visible_aggregate is low
max_raw_signal_storage_seconds is high
poi_radius_meters.max is unusually large
comparison_margin_meters.default is 0
route_exceedance_default_behavior is exclude
leaflet debug layers enabled
```

## 12.4 Fehlercodes

```ts
SYSADJ_VERSION_MISSING
SYSADJ_PRIVACY_LIMITS_MISSING
SYSADJ_AGGREGATION_LIMITS_MISSING
SYSADJ_ALLOWED_RANGES_MISSING
SYSADJ_DEFAULTS_MISSING
SYSADJ_RULE_VERSIONS_MISSING
SYSADJ_SINGLE_DEVICE_VISIBILITY_FORBIDDEN
SYSADJ_RAW_SIGNALS_IN_SENSUS_CORE_FORBIDDEN
SYSADJ_DEBUG_IN_SENSUS_CORE_FORBIDDEN
SYSADJ_PRIVACY_MINIMUM_TOO_LOW
SYSADJ_INVALID_RANGE
SYSADJ_DEFAULT_OUT_OF_RANGE
SYSADJ_DEGRADE_EXCEEDS_EXCLUDE
SYSADJ_RULE_VERSION_EMPTY
```

## 12.5 Warncodes

```ts
SYSADJ_LOW_PRIVACY_MARGIN
SYSADJ_LONG_RAW_SIGNAL_STORAGE
SYSADJ_LARGE_POI_RADIUS_RANGE
SYSADJ_ZERO_COMPARISON_MARGIN
SYSADJ_HARD_EXCLUDE_DEFAULT
SYSADJ_DEBUG_ENABLED
```

---

# 13. UI-Anforderungen

Panel 1 sollte als eigenständiges Input-Panel sichtbar bleiben.

## 13.1 Layout

Empfohlenes Layout:

```txt
┌────────────────────────────────────────────────────────────┐
│ Panel 1: System-Adjust Input                              │
├────────────────────────────────────────────────────────────┤
│ Systemversion auswählen / laden                            │
│ Quelle: SCIM3 Atlas Console | Mock | JSON | API             │
├────────────────────────────────────────────────────────────┤
│ Statuskarten                                                │
│ - Systemversion                                             │
│ - Datenschutz                                               │
│ - Mindestaggregation                                        │
│ - Parameterbereiche                                         │
│ - Regelversionen                                            │
│ - Validierung                                               │
├────────────────────────────────────────────────────────────┤
│ Tabs                                                        │
│ 1. Systemversion                                            │
│ 2. Datenschutzgrenzen                                       │
│ 3. Mindestaggregation                                       │
│ 4. Parameterbereiche                                        │
│ 5. Regelversionen                                           │
│ 6. Validierung                                              │
├────────────────────────────────────────────────────────────┤
│ Footer                                                      │
│ [Laden] [Validieren] [In Kontext übernehmen]                │
└────────────────────────────────────────────────────────────┘
```

## 13.2 Tabs

### Tab 1: Systemversion

Zweck:

- aktive Version anzeigen
- Quelle anzeigen
- Ladezeitpunkt anzeigen
- Feature Flags anzeigen

Felder:

```txt
System-Adjust-Version
Quelle
Geladen am
Feature Flags
Status
```

Aktionen:

```txt
Version laden
Mock-Version laden
JSON importieren
```

### Tab 2: Datenschutzgrenzen

Zweck:

- harte Datenschutzgrenzen anzeigen
- nicht unterschreitbare Werte sichtbar machen

Felder:

```txt
Mindestanzahl Geräte pro sichtbarer Kumulation
Mindestanzahl Signale pro sichtbarer Kumulation
Mindestanzahl Signale für Routeneinfluss
Mindestanzahl Signale für Aufenthaltsklassifizierung
Mindestanzahl Signale für Bewegungsauslastung
Mindest-Aggregationszeitfenster
Maximale Rohsignal-Gültigkeit
Maximale Rohsignal-Speicherung
Maximale Aggregat-Speicherung
Räumliche Mindestauflösung
Mindestlänge sichtbarer Bewegungskantenwerte
Mindestgröße sichtbarer Aufenthaltsdarstellung
Einzelgeräte sichtbar erlaubt? Muss nein sein.
Rohsignale in Sensus Core erlaubt? Muss nein sein.
Debug-Daten in Sensus Core erlaubt? Muss nein sein.
```

### Tab 3: Mindestaggregation

Zweck:

- Aggregationslogik als Systemgrenze anzeigen
- spätere Telco-Load- und Load-Processor-Panels begrenzen

Felder:

```txt
Minimales Zeitfenster
Maximales Zeitfenster
Default-Zeitfenster
Minimale Geräteanzahl
Minimale Signalanzahl
Minimale Dauer eines stabilen Aggregats
Verfallslogik unterstützt?
Default-Halbwertszeit, falls vorhanden
```

### Tab 4: Parameterbereiche

Zweck:

- zulässige Bereiche für spätere Regio-, Routen- und Ziel-App-Parameter anzeigen

Felder:

```txt
POI-Radius min/max/default
Vergleichssaum min/max/default
Dichteverhältnis min/max/default
Bewegungslast-Grenzwert min/max/default
Aufenthaltslast-Grenzwert min/max/default
Routen-Abwertung min/max/default
Routen-Ausschluss min/max/default
Signal-Gültigkeit min/max/default
Glättung min/max/default
Kantengewicht min/max/default
```

### Tab 5: Regelversionen

Zweck:

- nachvollziehbar machen, mit welchen Regelversionen die spätere Pipeline arbeitet

Felder:

```txt
Systemregeln
Datenschutzregeln
Aggregationsregeln
POI-Kandidatenregeln
Aufenthaltsklassifizierung
Bewegungsklassifizierung
Routenbewertung
Layer-Reduktion
Sensus-Core-Export
```

### Tab 6: Validierung

Zweck:

- Fehler und Warnungen anzeigen
- blockierende Fehler sichtbar machen
- Übergabe an Panel 2 oder weitere Panels steuern

Felder:

```txt
Gesamtstatus
Fehlerliste
Warnliste
Letzte Prüfung
Blockiert Folgepanels ja/nein
```

Aktionen:

```txt
Validieren
Ergebnis in SCIM-Kontext übernehmen
```

---

# 14. UI-Zustände

## 14.1 Initial

```ts
status: 'not_loaded'
```

Anzeige:

```txt
Noch kein System-Adjust-Stand geladen.
```

Aktionen:

```txt
Version laden
Mock laden
JSON importieren
```

## 14.2 Loading

```ts
status: 'loading'
```

Anzeige:

```txt
System-Adjust wird geladen.
```

Aktionen gesperrt:

```txt
Validieren
In Kontext übernehmen
```

## 14.3 Loaded unvalidated

```ts
status: 'loaded_unvalidated'
```

Anzeige:

```txt
System-Adjust geladen, aber noch nicht validiert.
```

Aktionen erlaubt:

```txt
Validieren
```

## 14.4 Valid

```ts
status: 'system_adjust_valid'
```

Anzeige:

```txt
System-Adjust ist gültig und kann als Systemrahmen verwendet werden.
```

Aktionen erlaubt:

```txt
In Kontext übernehmen
Weiter zu Regio-Content Input
```

## 14.5 Warning

```ts
status: 'system_adjust_warning'
```

Anzeige:

```txt
System-Adjust ist verwendbar, enthält aber Warnungen.
```

Aktionen erlaubt:

```txt
In Kontext übernehmen, sofern keine blockierenden Fehler vorliegen
```

## 14.6 Invalid

```ts
status: 'system_adjust_invalid'
```

Anzeige:

```txt
System-Adjust ist ungültig. Folgepanels dürfen diesen Stand nicht verwenden.
```

Aktionen gesperrt:

```txt
In Kontext übernehmen
Weiter
```

---

# 15. Service-Logik

## 15.1 loadSystemAdjustVersion

```ts
export async function loadSystemAdjustVersion(
  source: SystemAdjustSource,
  version?: string
): Promise<unknown> {
  // Quelle laden: Mock, JSON, API oder SCIM3 Atlas Console.
  // Ergebnis ist absichtlich unknown, weil es erst normalisiert werden muss.
}
```

## 15.2 normalizeSystemAdjust

```ts
export function normalizeSystemAdjust(raw: unknown): SystemAdjustState {
  // Rohdaten in stabiles internes Schema überführen.
  // Fehlende optionale Felder mit sicheren Defaults ergänzen.
  // Fehlende Pflichtfelder nicht stillschweigend erfinden.
}
```

## 15.3 validateSystemAdjust

```ts
export function validateSystemAdjust(
  state: SystemAdjustState
): SystemAdjustValidationResult {
  const errors: SystemAdjustIssue[] = [];
  const warnings: SystemAdjustIssue[] = [];

  // Pflichtfelder prüfen
  // Privacy prüfen
  // Aggregation prüfen
  // Ranges prüfen
  // Defaults gegen Ranges prüfen
  // RuleVersions prüfen
  // Warnungen ableiten

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString()
  };
}
```

## 15.4 applySystemAdjustToContext

```ts
export function applySystemAdjustToContext(
  context: ScimContext,
  systemAdjust: SystemAdjustState
): ScimContext {
  if (systemAdjust.status !== 'system_adjust_valid' && systemAdjust.status !== 'system_adjust_warning') {
    throw new Error('Cannot apply invalid System-Adjust state to SCIM context.');
  }

  return {
    ...context,
    system_adjust: systemAdjust
  };
}
```

Wichtig:

Diese Funktion darf keine anderen Kontextbereiche verändern.

---

# 16. Mock-Daten

```ts
export const mockSystemAdjustState: SystemAdjustState = {
  system_adjust_version: 'sys_v1.0.0',
  source: 'mock',
  loaded_at: '2026-05-21T00:00:00.000Z',
  privacy_limits: {
    min_distinct_devices_per_visible_aggregate: 5,
    min_signals_per_visible_aggregate: 15,
    min_signals_per_route_relevance: 10,
    min_signals_for_stay_classification: 10,
    min_signals_for_movement_load: 8,
    min_aggregation_window_seconds: 60,
    max_raw_signal_validity_seconds: 300,
    max_raw_signal_storage_seconds: 300,
    max_aggregated_signal_storage_seconds: 7776000,
    spatial_min_resolution_meters: 10,
    min_visible_edge_length_meters: 100,
    min_visible_stay_area_radius_meters: 30,
    allow_single_device_visibility: false,
    allow_raw_signals_in_operator_ui: false,
    allow_raw_signals_in_sensus_core: false,
    allow_debug_data_in_sensus_core: false
  },
  aggregation_limits: {
    min_time_window_seconds: 60,
    max_time_window_seconds: 1800,
    default_time_window_seconds: 900,
    min_distinct_devices: 5,
    min_signal_count: 15,
    min_stable_aggregate_duration_seconds: 120,
    decay_supported: true,
    default_decay_half_life_seconds: 450
  },
  allowed_ranges: {
    poi_radius_meters: { min: 5, max: 500, step: 5, unit: 'm' },
    comparison_margin_meters: { min: 0, max: 100, step: 5, unit: 'm' },
    boundary_buffer_meters: { min: 150, max: 500, step: 10, unit: 'm' },
    stay_density_ratio: { min: 1.0, max: 5.0, step: 0.1, unit: 'ratio' },
    movement_load_threshold: { min: 0, max: 1, step: 0.01, unit: 'score' },
    stay_load_threshold: { min: 0, max: 1, step: 0.01, unit: 'score' },
    route_degrade_threshold: { min: 0, max: 1, step: 0.01, unit: 'score' },
    route_exclude_threshold: { min: 0, max: 1, step: 0.01, unit: 'score' },
    signal_validity_seconds: { min: 30, max: 3600, step: 30, unit: 's' },
    smoothing_strength: { min: 0, max: 1, step: 0.05, unit: 'score' },
    edge_weight_factor: { min: 0, max: 10, step: 0.1, unit: 'factor' }
  },
  default_parameters: {
    default_poi_radius_meters: 50,
    default_comparison_margin_meters: 25,
    default_stay_density_ratio: 1.6,
    default_movement_load_threshold: 0.7,
    default_stay_load_threshold: 0.7,
    default_route_degrade_threshold: 0.65,
    default_route_exclude_threshold: 0.9,
    default_signal_validity_seconds: 900,
    default_decay_half_life_seconds: 450,
    default_smoothing_strength: 0.35,
    default_edge_weight_factor: 1.0,
    route_exceedance_default_behavior: 'degrade'
  },
  rule_versions: {
    system_rules: '1.0.0',
    privacy_rules: '1.0.0',
    aggregation_rules: '1.0.0',
    poi_candidate_rules: '1.0.0',
    stay_classification_rules: '1.0.0',
    movement_classification_rules: '1.0.0',
    route_evaluation_rules: '1.0.0',
    layer_reduction_rules: '1.0.0',
    sensus_core_export_rules: '1.0.0'
  },
  feature_flags: {
    enable_poi_candidate_suggestions: true,
    enable_stay_classification: true,
    enable_movement_load: true,
    enable_route_evaluation: true,
    enable_jam_indicators: true,
    enable_leaflet_debug_layers: true,
    enable_sensus_core_export: true,
    enable_local_user_tolerances: true
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z'
  },
  status: 'system_adjust_valid'
};
```

---

# 17. Übergabe an Panel 2 und spätere Panels

Panel 1 gibt folgendes Kontextsegment weiter:

```json
{
  "system_adjust": {
    "system_adjust_version": "sys_v1.0.0",
    "privacy_limits": {},
    "aggregation_limits": {},
    "allowed_ranges": {},
    "default_parameters": {},
    "rule_versions": {},
    "feature_flags": {},
    "status": "system_adjust_valid"
  }
}
```

## 17.1 Panel 2: Regio-Content Input

Panel 2 muss gegen Panel 1 prüfen:

- POI-Radien innerhalb `allowed_ranges.poi_radius_meters`
- Vergleichssaum innerhalb `allowed_ranges.comparison_margin_meters`
- regionale Dichteverhältnisse innerhalb `allowed_ranges.stay_density_ratio`
- regionale Routenparameter innerhalb der erlaubten Bereiche
- regionale Mindestwerte nicht unter Datenschutzgrenzen

## 17.2 Panel 3: Ziel-App UI Input

Panel 3 muss gegen Panel 1 prüfen:

- Ziel-App darf nur erlaubte User-Regler anbieten
- lokale User-Toleranzen dürfen Systemgrenzen nicht überschreiben
- sichtbare Layer dürfen keine Roh- oder Debug-Daten enthalten
- Ziel-App-Reduktionsprofil muss Datenschutzgrenzen einhalten

## 17.3 Panel 4: Telco-Load Input

Panel 4 muss gegen Panel 1 prüfen:

- Mindestaggregation eingehalten
- Signal-Gültigkeit innerhalb erlaubter Grenzen
- keine Einzelsignale sichtbar
- keine Signalgruppen unter Mindestgröße als gültige Last weitergeben

## 17.4 Engine- und Sensus-Core-Panels

Alle späteren Panels müssen den verwendeten System-Adjust-Stand im Output referenzieren, damit Ergebnisse reproduzierbar sind.

---

# 18. Akzeptanzkriterien

Panel 1 ist korrekt gebaut, wenn folgende Kriterien erfüllt sind:

## 18.1 Laden

- Ein Mock-System-Adjust kann geladen werden.
- Ein System-Adjust-Objekt kann aus JSON geladen werden.
- Der Ladezustand wird korrekt angezeigt.
- Fehler beim Laden werden im Panel sichtbar.

## 18.2 Normalisieren

- Rohdaten werden in `SystemAdjustState` überführt.
- Optionale Felder erhalten sichere Defaults.
- Pflichtfelder werden nicht stillschweigend erfunden.

## 18.3 Validieren

- Fehlende Version erzeugt blockierenden Fehler.
- Fehlende PrivacyLimits erzeugen blockierenden Fehler.
- `allow_single_device_visibility: true` erzeugt blockierenden Fehler.
- `allow_raw_signals_in_sensus_core: true` erzeugt blockierenden Fehler.
- `allow_debug_data_in_sensus_core: true` erzeugt blockierenden Fehler.
- Defaultwerte außerhalb erlaubter Bereiche erzeugen blockierende Fehler.
- `route_degrade_threshold > route_exclude_threshold` erzeugt blockierenden Fehler.
- niedrige, aber nicht verbotene Datenschutzwerte erzeugen Warnungen.

## 18.4 Kontextübergabe

- Nur gültige oder gültige-mit-Warnung-Systemstände können in den SCIM-Kontext übernommen werden.
- Ungültige Systemstände blockieren die Übergabe.
- Die Übergabe verändert ausschließlich `context.system_adjust`.

## 18.5 UI

- Das Panel zeigt Version, Datenschutzgrenzen, Mindestaggregation, Parameterbereiche, Regelversionen und Validierung getrennt an.
- Blockierende Fehler sind klar erkennbar.
- Warnungen sind klar erkennbar.
- Folgeaktionen sind gesperrt, solange System-Adjust ungültig ist.

## 18.6 Tests

- Unit-Tests für Validator vorhanden.
- Unit-Tests für Range-Prüfung vorhanden.
- Unit-Tests für Datenschutzsperren vorhanden.
- Unit-Tests für Kontextübergabe vorhanden.
- Mock-Daten-Test vorhanden.

---

# 19. Testfälle

## 19.1 Gültiger Mock

Input:

```ts
mockSystemAdjustState
```

Erwartung:

```ts
validation.is_valid === true
errors.length === 0
status === 'system_adjust_valid'
```

## 19.2 Einzelgeräte sichtbar

Mutation:

```ts
privacy_limits.allow_single_device_visibility = true
```

Erwartung:

```ts
errors includes SYSADJ_SINGLE_DEVICE_VISIBILITY_FORBIDDEN
validation.is_valid === false
```

## 19.3 Rohsignale in Sensus Core

Mutation:

```ts
privacy_limits.allow_raw_signals_in_sensus_core = true
```

Erwartung:

```ts
errors includes SYSADJ_RAW_SIGNALS_IN_SENSUS_CORE_FORBIDDEN
validation.is_valid === false
```

## 19.4 Debug-Daten in Sensus Core

Mutation:

```ts
privacy_limits.allow_debug_data_in_sensus_core = true
```

Erwartung:

```ts
errors includes SYSADJ_DEBUG_IN_SENSUS_CORE_FORBIDDEN
validation.is_valid === false
```

## 19.5 Default außerhalb Range

Mutation:

```ts
default_parameters.default_poi_radius_meters = 9999
```

Erwartung:

```ts
errors includes SYSADJ_DEFAULT_OUT_OF_RANGE
validation.is_valid === false
```

## 19.6 Routenlogik inkonsistent

Mutation:

```ts
default_parameters.default_route_degrade_threshold = 0.95
default_parameters.default_route_exclude_threshold = 0.8
```

Erwartung:

```ts
errors includes SYSADJ_DEGRADE_EXCEEDS_EXCLUDE
validation.is_valid === false
```

## 19.7 Kontextschutz

Input:

```ts
const contextBefore = {
  system_adjust: undefined,
  regio_content: { existing: true },
  graph: { existing: true }
};
```

Aktion:

```ts
const contextAfter = applySystemAdjustToContext(contextBefore, validSystemAdjust);
```

Erwartung:

```ts
contextAfter.system_adjust exists
contextAfter.regio_content === contextBefore.regio_content
contextAfter.graph === contextBefore.graph
```

---

# 20. Umsetzungshinweise für Codex/Claude

## 20.1 Erst headless bauen

Zuerst sollen Typen, Schema, Mock-Daten und Validierungslogik gebaut werden. Die UI kommt danach.

Reihenfolge:

```txt
1. systemAdjust.types.ts
2. systemAdjust.mock.ts
3. systemAdjust.validation.ts
4. systemAdjust.context.ts
5. systemAdjust.test.ts
6. SystemAdjustInputPanel.tsx
```

## 20.2 Keine Fachlogik im UI-Container

Die React-Komponente darf nur anzeigen und Aktionen auslösen. Die Validierungslogik gehört in `systemAdjust.validation.ts`.

## 20.3 Keine spätere Panel-Logik vorwegnehmen

Panel 1 darf Wertebereiche definieren, aber nicht selbst regionale Inhalte, Routen oder Sensus-Core-Layer erzeugen.

## 20.4 Strikte Output-Stabilität

Der Output von Panel 1 ist ein Vertrag. Spätere Panels müssen sich darauf verlassen können.

Deshalb:

- keine wechselnden Feldnamen
- keine UI-spezifischen Feldnamen im Output
- keine impliziten Defaults außerhalb von `default_parameters`
- keine versteckten globalen Variablen

---

# 21. Kompakter Codex-Auftrag für Panel 1

```text
Baue Panel 1: System-Adjust Input für die SCIM.

Kontext:
SCIM ist ein Gesamtsystem aus Input-Schicht, SCIM-Engine, Layer-Erzeugung, Sensus-Core-Paketierung, lokaler User-Anwendung und Freigabe. Sensus Core ist die SCIM am Endgerät. Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug, nicht der Engine-Kern. Alle Panels arbeiten auf einem gemeinsamen SCIM-Kontext. Kein Panel darf System-Adjust-Grenzen unterschreiten.

Aufgabe:
Baue nur Panel 1. Das Panel lädt, normalisiert, validiert und speichert den systemweiten System-Adjust-Stand. Verändere keine anderen Kontextbereiche außer `context.system_adjust`.

Zweck:
Systemweite Regeln, Datenschutzgrenzen, Mindestaggregation, erlaubte Parameterbereiche, Defaultwerte, Feature Flags und Regelversionen bereitstellen.

Nicht-Ziele:
Keine POI-Freigabe, keine Boundary, keine Telco-Load-Verarbeitung, kein Graph, keine Aufenthaltslogik, keine Routenbewertung, kein Sensus-Core-Export.

Erzeuge:
- TypeScript-Typen
- Mock-Daten
- Validierungsfunktionen
- Kontext-Apply-Funktion
- React-Panel mit Tabs
- Unit-Tests

Tabs:
1. Systemversion
2. Datenschutzgrenzen
3. Mindestaggregation
4. Parameterbereiche
5. Regelversionen
6. Validierung

Output:
`SystemAdjustState` mit `system_adjust_version`, `privacy_limits`, `aggregation_limits`, `allowed_ranges`, `default_parameters`, `rule_versions`, `feature_flags`, `validation`, `status`.

Validierung:
Blockiere Einzelgeräte-Sichtbarkeit, Rohsignale in Sensus Core, Debug-Daten in Sensus Core, fehlende Regelversionen, ungültige Ranges, Defaults außerhalb erlaubter Bereiche und inkonsistente Routen-Schwellen.

Akzeptanzkriterien:
Ein gültiger Mock kann geladen, validiert und in `context.system_adjust` übernommen werden. Ein ungültiger Stand blockiert die Übergabe. Die Übergabe verändert keine anderen Kontextbereiche.
```

---

# 22. Kernaussage für Panel 1

Panel 1 ist kein normales Einstellungsformular. Es ist der systemweite Sicherheits- und Parametervertrag der gesamten SCIM.

Wenn Panel 1 falsch oder zu weich gebaut wird, können spätere Panels scheinbar funktionieren, aber fachlich unzulässige Zustände erzeugen: zu kleine Aggregationen, zu genaue Signaldarstellung, zu breite lokale User-Freiheiten, regionale Parameter außerhalb des Systems oder Sensus-Core-Pakete mit Debug- oder Rohdaten.

Deshalb muss Panel 1 zuerst als stabiles, testbares, hart validierendes Input-Modul gebaut werden.

