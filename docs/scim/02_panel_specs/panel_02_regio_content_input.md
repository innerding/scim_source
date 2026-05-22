# SCIM Panel 2 – Regio-Content Input

## 0. Generelle SCIM-Vorinformation für das Coding

Diese Vorinformation gehört vor jeden konkreten Panel-Auftrag. Sie stellt sicher, dass Panel 2 nicht als isolierte POI-Verwaltung gebaut wird, sondern als regionaler Input-Baustein der gesamten SCIM-Kette.

### 0.1 SCIM-Gesamtsystem

SCIM ist ein Gesamtsystem aus:

1. Input-Schicht
2. Validierungsschicht
3. SCIM-Engine
4. Graph- und Layer-Erzeugung
5. Sensus-Core-Paketierung
6. lokaler Anwendung am Endgerät
7. Prüfung, Freigabe und Export

Panel 2 liegt in der Input- und Steuerungsschicht. Es erzeugt keine Routen, keine Bewegungsauslastung und keine Sensus-Core-Ausgabe. Es liefert die regional freigegebenen Inhalte und regionalen Parameter, mit denen spätere Panels arbeiten dürfen.

### 0.2 Rollenklärung

**SCIM-Engine**  
Der rechnerische Kern. Sie verarbeitet später Boundary, Regio-Content, Telco-Load, Graph, POIs, Aufenthalte, Bewegung, Maskierung und Routenbewertung.

**Leaflet**  
Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug. Leaflet ist nicht die Engine. In Bezug auf Regio-Content wird Leaflet später vor allem genutzt, um regionale POIs, Radien, Vergleichsräume, Sperren, Hinweise und Vorschauen sichtbar zu prüfen.

**Sensus Core**  
Sensus Core ist die SCIM am Endgerät bzw. in der laufzeitnahen App-Representation. Sensus Core darf nur freigegebene, reduzierte und datenschutzkonforme SCIM-Ergebnisse erhalten. Entwürfe, Debug-Daten, abgelehnte POI-Kandidaten oder nicht freigegebene regionale Parameter dürfen nicht in die Endgeräteausgabe gelangen.

**System-Adjust**  
System-Adjust ist die systemweite Kalibrierungs- und Begrenzungsebene. Panel 2 darf keine Werte setzen, die System-Adjust-Grenzen unterschreiten oder überschreiten.

**Regio-Content**  
Regio-Content ist die regionale Inhalts-, POI- und Parameterpflege. Er umfasst freigegebene POIs, abgelehnte POI-Kandidaten, bestätigte POI-Radien, regionale Vergleichsparameter, regionale Routenvorgaben, lokale Sperren/Hinweise, regionale Staustellenprüfung und Freigabestände.

### 0.3 Gemeinsamer SCIM-Kontext

Alle Panels arbeiten auf einem gemeinsamen SCIM-Kontext. Jedes Panel darf nur seinen eigenen Bereich verändern.

Grundstruktur:

```ts
export interface ScimContext {
  representation_id?: string;
  system_adjust?: SystemAdjustState;
  regio_content?: RegioContentState;
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

Panel 2 darf nur schreiben in:

```ts
context.regio_content
```

Panel 2 darf lesen aus:

```ts
context.system_adjust
```

Panel 2 darf nicht schreiben in:

```ts
context.system_adjust
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

Panel 2 ist besonders wichtig, weil es die regionale Wirklichkeit in die SCIM bringt: konkrete POIs, konkrete Radien, konkrete regionale Parameter, lokale Sperren und regionale Freigaben.

### 0.5 Datenschutzgrenze

Panel 2 darf keine Datenschutzgrenzen aufweichen. Es darf Operatoren keine Werte erlauben, die System-Adjust unterschreiten.

Nicht erlaubt:

- Einzelgeräte sichtbar machen
- Rohsignale in regionalen Operator-Content übernehmen
- Debug-Rohwerte als freigegebenen Regio-Content speichern
- regionale Mindestaggregation unter System-Adjust setzen
- POI- oder Routenvorgaben freigeben, die Datenschutz- oder Mindestaggregationsregeln verletzen

Panel 2 arbeitet in der Regel mit regionalen Inhalten und Parametern, nicht mit Rohsignalen. Falls aggregierte Lastzustände oder Staustellenhinweise in regionalen Prüfansichten auftauchen, müssen sie bereits innerhalb der System-Adjust-Datenschutzgrenzen liegen.

### 0.6 System-Adjust-Vorrang

Panel 2 ist nach Panel 1 abhängig von `context.system_adjust`.

Ohne gültigen System-Adjust-Stand darf Panel 2 zwar Mock- oder Entwurfsdaten anzeigen, aber keinen gültigen Regio-Content in den gemeinsamen SCIM-Kontext übernehmen.

System-Adjust begrenzt für Panel 2 insbesondere:

- POI-Radius-Minimum und -Maximum
- Vergleichssaum-Minimum und -Maximum
- Dichteverhältnis für Aufenthaltsklassifizierung
- regionale Routenparameter
- Mindestaggregation
- Signal- und Aggregationszeitfenster, sofern regional einstellbar
- Datenschutzgrenzen
- erlaubte Modi für Abwertung oder Ausschluss
- erlaubte Feature Flags

### 0.7 Regio-Content-Freigabe

POIs werden erst aufenthaltsrelevant, wenn sie regional freigegeben sind und einen bestätigten Aufenthaltsradius haben.

OSM- oder andere Quelldaten können POI-Kandidaten liefern. Diese Kandidaten sind noch keine aktiven SCIM-Aufenthaltsbereiche. Erst der regionale Freigabestatus macht sie wirksam.

Grundregel:

> Nicht der OSM-POI-Typ entscheidet abschließend über Aufenthaltsrelevanz, sondern die explizite regionale Freigabe und das Vorhandensein eines bestätigten Aufenthaltsradius.

### 0.8 Trennung von Darstellung und Bewertung

Panel 2 kann regionale Darstellungsparameter und regionale Bewertungsparameter liefern. Diese dürfen nicht vermischt werden.

Beispiele:

- Ein POI kann in der Operator-Ansicht sichtbar sein, aber noch nicht freigegeben.
- Ein abgelehnter POI-Kandidat kann zur Dokumentation sichtbar sein, darf aber keine Aufenthaltslogik aktivieren.
- Ein regionaler Hinweis kann sichtbar sein, ohne automatisch eine Route auszuschließen.
- Eine regionale Sperre kann routenwirksam sein, ohne als Ziel-App-Hinweis im gleichen Detailgrad sichtbar zu werden.

---

# 1. Panel-Definition

## 1.1 Panel-Name

**Regio-Content Input**

Technischer Modulname:

```ts
RegioContentInputPanel
```

Empfohlene Service-/Funktionsnamen:

```ts
loadRegioContentVersion()
normalizeRegioContent()
validateRegioContent()
applyRegioContentToContext()
validatePoiAgainstSystemAdjust()
validateRegionalParametersAgainstSystemAdjust()
```

Empfohlene Datei-/Ordnerstruktur:

```txt
src/scim/regio-content/
  RegioContentInputPanel.tsx
  regioContent.types.ts
  regioContent.schema.ts
  regioContent.defaults.ts
  regioContent.mock.ts
  regioContent.validation.ts
  regioContent.service.ts
  regioContent.context.ts
  regioContent.test.ts
```

---

# 2. Zweck des Panels

Panel 2 lädt, zeigt, normalisiert und validiert den regionalen Content-Stand aus dem Path-Works Regio-Dashboard oder einer entsprechenden regionalen Content-Quelle.

Es beantwortet für spätere Panels:

- Welche Region ist aktiv?
- Welche regionale Content-Version ist aktiv?
- Welche POIs sind freigegeben?
- Welche POI-Kandidaten wurden abgelehnt?
- Welche POIs sind noch zur Prüfung offen?
- Welche Aufenthaltsradien sind bestätigt?
- Welche regionalen Vergleichsparameter gelten?
- Welche regionalen Routenparameter gelten?
- Welche lokalen Sperren, Hinweise oder Staustellenprüfungen gelten?
- Ist der regionale Parameterstand freigegeben?
- Sind alle regionalen Werte mit System-Adjust vereinbar?

Leitsatz:

> Panel 2 erzeugt den freigegebenen regionalen Inhalts- und Parameterstand für Boundary-, Extraktions-, POI-, Aufenthalts-, Bewegungs- und Routenlogik.

---

# 3. Nicht-Ziele

Panel 2 darf nicht:

- System-Adjust-Grenzen ändern
- neue Systemregeln definieren
- Ziel-App-UI-Profile definieren
- Telco-Load-Daten verarbeiten
- Runtime-Signale projizieren
- Aufenthalte berechnen
- Bewegungsauslastung berechnen
- Routenabschnitte bewerten
- Leaflet-Layer final erzeugen
- Sensus-Core-Pakete erzeugen
- lokale User-Toleranzen anwenden

Panel 2 darf POIs, Radien und regionale Parameter bereitstellen. Die spätere Berechnung erfolgt in den Engine-Panels.

---

# 4. Fachliche Verantwortung

Panel 2 hat sieben fachliche Kernaufgaben:

## 4.1 Region laden

Das Panel lädt eine Region oder einen regionalen Content-Stand aus einer Quelle, zum Beispiel:

- Path-Works Regio-Dashboard
- regionaler Content-Service
- lokaler Mock-Service
- statische JSON-Konfiguration
- späterer Backend-Endpunkt

## 4.2 POI-Kandidaten und POI-Freigaben laden

Das Panel lädt:

- vorgeschlagene POI-Kandidaten
- freigegebene POIs
- abgelehnte POIs
- POIs zur Prüfung
- manuell angelegte POIs
- POI-Kategorien
- POI-Quellen

## 4.3 POI-Radien prüfen

Das Panel prüft für jeden freigegebenen POI:

- Radius vorhanden
- Radius innerhalb System-Adjust-Grenzen
- Zentrum vorhanden
- Geometrie plausibel
- Freigabestatus konsistent

## 4.4 Regionale Parameter prüfen

Das Panel prüft regionale Parameter gegen System-Adjust:

- Vergleichssaum
- Aufenthalts-Dichteverhältnis
- Aggregationszeitfenster, sofern regional gesetzt
- Bewegungslast-Grenzwerte
- Aufenthaltslast-Grenzwerte
- Routen-Abwertungs- und Ausschlusswerte
- Glättungsparameter
- regionale Defaultwerte

## 4.5 Sperren und Hinweise laden

Das Panel lädt regionale Sperren, Hinweise oder lokale Einschränkungen.

Beispiele:

- Wegsperren
- saisonale Sperren
- Gefahrenhinweise
- lokale Warnhinweise
- temporäre Hinweise
- regionale Staustellenprüfungen
- manuell bestätigte Stauindikatoren

Diese Inhalte müssen getrennt nach Sichtbarkeit und Routenwirksamkeit geführt werden.

## 4.6 Freigabestatus prüfen

Das Panel prüft, ob der regionale Stand freigegeben ist.

Nicht freigegebene Entwürfe dürfen nicht als gültiger Regio-Content in die Runtime-SCIM oder in Sensus Core wirken.

## 4.7 Regio-Content in Kontext schreiben

Nur wenn die Validierung erfolgreich ist, wird der regionale Content-Stand in den gemeinsamen SCIM-Kontext geschrieben.

---

# 5. Datenmodell

## 5.1 Kernoutput

```ts
export interface RegioContentState {
  regio_content_version: string;
  source: RegioContentSource;
  loaded_at: string;
  region: RegioRegion;
  approved_pois: RegioPoi[];
  rejected_pois: RejectedPoi[];
  pending_pois: PendingPoi[];
  poi_radii: PoiRadius[];
  regional_parameters: RegionalParameters;
  regional_restrictions: RegionalRestriction[];
  regional_warnings: RegionalWarning[];
  release: RegioReleaseState;
  validation: RegioContentValidationResult;
  status: RegioContentStatus;
}
```

## 5.2 Quelle

```ts
export type RegioContentSource =
  | 'path_works_regio_dashboard'
  | 'mock'
  | 'local_json'
  | 'api';
```

## 5.3 Statuswerte

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

## 5.4 Region

```ts
export interface RegioRegion {
  region_id: string;
  region_name: string;
  region_type: 'admin_area' | 'park' | 'trail_area' | 'custom_region' | 'representation_area';
  country_code?: string;
  admin_code?: string;
  default_language?: string;
  timezone?: string;
  region_geometry?: GeoJsonGeometry;
  bbox?: [number, number, number, number];
}
```

---

# 6. POI-Modell

## 6.1 RegioPoi

```ts
export interface RegioPoi {
  poi_id: string;
  source_poi_id?: string;
  source: PoiSource;
  name?: string;
  category: RegioPoiCategory;
  candidate_class: PoiCandidateClass;
  status: PoiApprovalStatus;
  center: GeoPoint;
  radius_meters: number;
  comparison_margin_meters?: number;
  effective_comparison_radius_meters?: number;
  visibility: PoiVisibility;
  valid_from?: string;
  valid_until?: string;
  operator_note?: string;
  approved_by?: string;
  approved_at?: string;
  system_adjust_version: string;
}

export type PoiSource =
  | 'osm'
  | 'manual'
  | 'import'
  | 'regional_dataset'
  | 'system_suggestion';

export type PoiCandidateClass =
  | 'safe_relevant'
  | 'possibly_relevant'
  | 'manual'
  | 'unknown';

export type PoiApprovalStatus =
  | 'candidate'
  | 'approved'
  | 'rejected'
  | 'pending_review'
  | 'disabled';

export type PoiVisibility =
  | 'operator_only'
  | 'scim_active'
  | 'sensus_core_visible'
  | 'hidden';
```

## 6.2 GeoPoint

```ts
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lon, lat]
}
```

## 6.3 RegioPoiCategory

```ts
export type RegioPoiCategory =
  | 'alpine_hut'
  | 'wilderness_hut'
  | 'picnic_site'
  | 'viewpoint'
  | 'shelter'
  | 'restaurant'
  | 'cafe'
  | 'drinking_water'
  | 'toilets'
  | 'peak'
  | 'waterfall'
  | 'parking'
  | 'public_transport'
  | 'aerialway_station'
  | 'information'
  | 'shop'
  | 'wayside_cross'
  | 'tower'
  | 'spring'
  | 'cave_entrance'
  | 'manual_other';
```

## 6.4 Sicher relevante POI-Kandidaten

Folgende OSM-Tags sollen als sicher relevante POI-Kandidaten unterstützt werden:

```txt
tourism=alpine_hut
tourism=wilderness_hut
tourism=picnic_site
tourism=viewpoint
amenity=shelter
amenity=restaurant
amenity=cafe
amenity=drinking_water
amenity=toilets
natural=peak
natural=waterfall
leisure=picnic_table
```

## 6.5 Möglicherweise relevante POI-Kandidaten

Folgende OSM-Tags sollen als möglicherweise relevante POI-Kandidaten unterstützt werden:

```txt
amenity=parking
highway=bus_stop
public_transport=platform
railway=station
aerialway=station
tourism=information
information=guidepost
information=board
information=map
shop=convenience
shop=bakery
historic=wayside_cross
man_made=cross
man_made=tower
natural=spring
natural=cave_entrance
```

## 6.6 Nicht automatisch aufenthaltsrelevant

Nicht automatisch aufenthaltsrelevant:

```txt
hazard=*
barrier=*
ford=*
rein technische Objekte ohne Aufenthaltsbezug
reine Wegmarkierungen ohne Aufenthaltsfunktion
```

Diese Objekte können als Hinweise oder Sperr-/Gefahreninformationen relevant sein, dürfen aber nicht automatisch aktive Aufenthaltsbereiche erzeugen.

---

# 7. POI-Radien

## 7.1 PoiRadius

```ts
export interface PoiRadius {
  poi_id: string;
  radius_meters: number;
  radius_source: RadiusSource;
  radius_status: RadiusStatus;
  comparison_margin_meters: number;
  effective_comparison_radius_meters: number;
  min_allowed_radius_meters: number;
  max_allowed_radius_meters: number;
  system_adjust_version: string;
  updated_by?: string;
  updated_at?: string;
}

export type RadiusSource =
  | 'system_default'
  | 'category_default'
  | 'operator_adjusted'
  | 'regional_template'
  | 'manual';

export type RadiusStatus =
  | 'suggested'
  | 'confirmed'
  | 'needs_review'
  | 'invalid';
```

## 7.2 Radiusregeln

Ein freigegebener POI braucht immer:

```txt
status = approved
radius_status = confirmed
radius_meters innerhalb System-Adjust allowed_ranges.poi_radius_meters
center vorhanden
system_adjust_version vorhanden
```

Ein POI mit `status = candidate` oder `pending_review` darf einen vorgeschlagenen Radius haben, erzeugt aber keinen aktiven Aufenthaltsbereich.

Ein POI mit `status = rejected` darf keinen aktiven Radius in `poi_radii` haben. Er kann aber einen dokumentierten abgelehnten Vorschlagsradius besitzen, falls dieser getrennt in `rejected_pois` geführt wird.

## 7.3 Vergleichssaum

Der Vergleichssaum ist regional einstellbar, aber durch System-Adjust begrenzt.

Arbeitsannahme:

```txt
comparison_margin_meters = 25
```

Berechnung:

```ts
effective_comparison_radius_meters = radius_meters + comparison_margin_meters;
```

---

# 8. RejectedPoi und PendingPoi

## 8.1 RejectedPoi

```ts
export interface RejectedPoi {
  poi_id: string;
  source_poi_id?: string;
  source: PoiSource;
  name?: string;
  category?: RegioPoiCategory;
  center?: GeoPoint;
  rejected_reason: RejectedPoiReason;
  rejected_by?: string;
  rejected_at?: string;
  operator_note?: string;
}

export type RejectedPoiReason =
  | 'not_stay_relevant'
  | 'duplicate'
  | 'wrong_location'
  | 'unsafe_source'
  | 'temporary_not_relevant'
  | 'other';
```

## 8.2 PendingPoi

```ts
export interface PendingPoi {
  poi_id: string;
  source_poi_id?: string;
  source: PoiSource;
  name?: string;
  category?: RegioPoiCategory;
  candidate_class: PoiCandidateClass;
  center: GeoPoint;
  suggested_radius_meters?: number;
  suggested_comparison_margin_meters?: number;
  review_reason?: string;
  created_at?: string;
}
```

---

# 9. Regionale Parameter

## 9.1 RegionalParameters

```ts
export interface RegionalParameters {
  parameter_version: string;
  comparison_margin_meters: number;
  stay_density_ratio: number;
  movement_load_threshold: number;
  stay_load_threshold: number;
  route_degrade_threshold: number;
  route_exclude_threshold: number;
  route_exceedance_behavior: RouteExceedanceBehavior;
  signal_validity_seconds?: number;
  aggregation_window_seconds?: number;
  smoothing_strength?: number;
  edge_weight_factor?: number;
  fallback_route_policy: FallbackRoutePolicy;
  route_profiles: RegionalRouteProfile[];
  system_adjust_version: string;
}

export type RouteExceedanceBehavior =
  | 'warn'
  | 'degrade'
  | 'exclude'
  | 'profile_dependent';

export type FallbackRoutePolicy =
  | 'allow_degraded_if_no_alternative'
  | 'block_if_threshold_exceeded'
  | 'warn_and_allow'
  | 'profile_dependent';
```

## 9.2 RegionalRouteProfile

```ts
export interface RegionalRouteProfile {
  profile_id: string;
  label: string;
  description?: string;
  movement_load_threshold?: number;
  stay_load_threshold?: number;
  route_degrade_threshold?: number;
  route_exclude_threshold?: number;
  route_exceedance_behavior?: RouteExceedanceBehavior;
  enabled: boolean;
}
```

## 9.3 Parameterregeln

Regionale Parameter dürfen von System-Adjust-Defaults abweichen, aber nur innerhalb der `allowed_ranges`.

Pflichtprüfungen:

```ts
comparison_margin_meters within system_adjust.allowed_ranges.comparison_margin_meters
stay_density_ratio within system_adjust.allowed_ranges.stay_density_ratio
movement_load_threshold within system_adjust.allowed_ranges.movement_load_threshold
stay_load_threshold within system_adjust.allowed_ranges.stay_load_threshold
route_degrade_threshold within system_adjust.allowed_ranges.route_degrade_threshold
route_exclude_threshold within system_adjust.allowed_ranges.route_exclude_threshold
route_degrade_threshold <= route_exclude_threshold
signal_validity_seconds within system_adjust.allowed_ranges.signal_validity_seconds, if set
smoothing_strength within system_adjust.allowed_ranges.smoothing_strength, if set
edge_weight_factor within system_adjust.allowed_ranges.edge_weight_factor, if set
```

---

# 10. Sperren und Hinweise

## 10.1 RegionalRestriction

```ts
export interface RegionalRestriction {
  restriction_id: string;
  type: RegionalRestrictionType;
  geometry: GeoJsonGeometry;
  label?: string;
  description?: string;
  severity: RestrictionSeverity;
  route_effect: RestrictionRouteEffect;
  display_effect: RestrictionDisplayEffect;
  valid_from?: string;
  valid_until?: string;
  source: RestrictionSource;
  status: RestrictionStatus;
  approved_by?: string;
  approved_at?: string;
}

export type RegionalRestrictionType =
  | 'closure'
  | 'seasonal_closure'
  | 'hazard'
  | 'construction'
  | 'warning'
  | 'local_note'
  | 'jam_indicator_review'
  | 'operator_note';

export type RestrictionSeverity =
  | 'info'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type RestrictionRouteEffect =
  | 'none'
  | 'warn'
  | 'degrade'
  | 'exclude';

export type RestrictionDisplayEffect =
  | 'operator_only'
  | 'sensus_core_hint'
  | 'sensus_core_warning'
  | 'hidden';

export type RestrictionSource =
  | 'operator'
  | 'regional_import'
  | 'external_dataset'
  | 'system_suggestion';

export type RestrictionStatus =
  | 'draft'
  | 'approved'
  | 'expired'
  | 'disabled'
  | 'needs_review';
```

## 10.2 RegionalWarning

```ts
export interface RegionalWarning {
  warning_id: string;
  type: 'parameter_warning' | 'poi_warning' | 'restriction_warning' | 'release_warning';
  severity: 'info' | 'warning';
  message: string;
  field?: string;
  related_id?: string;
}
```

## 10.3 Sperren-Regeln

- Eine Sperre mit `route_effect = exclude` muss `status = approved` haben, bevor sie routenwirksam wird.
- Eine Sperre mit `display_effect = sensus_core_warning` darf keine Operator-internen Rohinformationen enthalten.
- Eine Sperre mit abgelaufenem `valid_until` darf nicht aktiv routenwirksam sein.
- Hinweise können `operator_only` bleiben und dürfen dann nicht in Sensus Core exportiert werden.

---

# 11. Freigabe

## 11.1 RegioReleaseState

```ts
export interface RegioReleaseState {
  release_status: RegioReleaseStatus;
  release_id?: string;
  released_by?: string;
  released_at?: string;
  draft_id?: string;
  previous_release_id?: string;
  changelog?: string;
  blocks_runtime_use: boolean;
}

export type RegioReleaseStatus =
  | 'draft'
  | 'in_review'
  | 'released'
  | 'rejected'
  | 'archived';
```

## 11.2 Freigaberegeln

Für gültigen Runtime-Regio-Content gilt:

```ts
release.release_status === 'released'
release.blocks_runtime_use === false
validation.is_valid === true
status === 'regio_content_valid' || status === 'regio_content_warning'
```

Entwürfe dürfen angezeigt, geprüft und gespeichert werden, aber nicht als gültiger Runtime-Input an Engine oder Sensus Core übergeben werden.

---

# 12. Validierung

## 12.1 ValidationResult

```ts
export interface RegioContentValidationResult {
  is_valid: boolean;
  errors: RegioContentIssue[];
  warnings: RegioContentIssue[];
  checked_at: string;
  checked_against_system_adjust_version: string;
}

export interface RegioContentIssue {
  code: string;
  severity: 'error' | 'warning';
  field?: string;
  related_id?: string;
  message: string;
  blocking: boolean;
}
```

## 12.2 Pflichtvalidierungen

### System-Adjust vorhanden

```ts
context.system_adjust must exist
context.system_adjust.status must be system_adjust_valid or system_adjust_warning
```

Ohne gültigen System-Adjust-Stand darf kein Regio-Content als gültig übernommen werden.

### Version und Region

```ts
regio_content_version must exist
region.region_id must exist
region.region_name must exist
region.region_type must exist
```

### POIs

Für `approved_pois`:

```ts
poi_id must exist
status must be approved
center must be valid Point
radius_meters must exist
radius_meters within system_adjust.allowed_ranges.poi_radius_meters
radius_meters > 0
system_adjust_version must match or be compatible
```

Für `rejected_pois`:

```ts
rejected_reason must exist
rejected POIs must not appear in approved_pois
```

Für `pending_pois`:

```ts
center must exist
status must not be approved
pending POIs must not create active stay areas
```

### POI-Radien

```ts
every approved POI must have confirmed radius
radius_status must be confirmed
comparison_margin_meters within system_adjust.allowed_ranges.comparison_margin_meters
effective_comparison_radius_meters must equal radius_meters + comparison_margin_meters
```

### Regionale Parameter

```ts
regional_parameters must exist
all regional numeric parameters must be within system_adjust.allowed_ranges
route_degrade_threshold <= route_exclude_threshold
aggregation values must not undercut system_adjust.privacy_limits or aggregation_limits
```

### Sperren und Hinweise

```ts
restriction_id must exist
geometry must exist
route_effect must be valid
display_effect must be valid
expired restrictions must not be active route exclusions
operator_only restrictions must not be marked as sensus_core visible
```

### Freigabe

```ts
release.release_status must be released for runtime-valid content
blocks_runtime_use must be false for runtime-valid content
released_at must exist if release_status is released
```

---

# 13. Fehlercodes

```ts
REGIO_SYSTEM_ADJUST_MISSING
REGIO_SYSTEM_ADJUST_INVALID
REGIO_VERSION_MISSING
REGIO_REGION_ID_MISSING
REGIO_REGION_NAME_MISSING
REGIO_REGION_TYPE_MISSING
REGIO_APPROVED_POI_ID_MISSING
REGIO_APPROVED_POI_CENTER_MISSING
REGIO_APPROVED_POI_RADIUS_MISSING
REGIO_POI_RADIUS_OUT_OF_RANGE
REGIO_POI_RADIUS_NOT_CONFIRMED
REGIO_APPROVED_POI_DUPLICATE
REGIO_REJECTED_POI_DUPLICATE_WITH_APPROVED
REGIO_REJECTED_REASON_MISSING
REGIO_PENDING_POI_INVALID_STATUS
REGIO_PENDING_POI_ACTIVE_FORBIDDEN
REGIO_COMPARISON_MARGIN_OUT_OF_RANGE
REGIO_EFFECTIVE_COMPARISON_RADIUS_INVALID
REGIO_REGIONAL_PARAMETERS_MISSING
REGIO_PARAMETER_OUT_OF_RANGE
REGIO_AGGREGATION_UNDERCUTS_SYSTEM_LIMIT
REGIO_DEGRADE_EXCEEDS_EXCLUDE
REGIO_RESTRICTION_ID_MISSING
REGIO_RESTRICTION_GEOMETRY_MISSING
REGIO_EXPIRED_RESTRICTION_ACTIVE
REGIO_OPERATOR_ONLY_VISIBLE_IN_SENSUS_CORE
REGIO_RELEASE_NOT_RELEASED
REGIO_RELEASE_BLOCKS_RUNTIME
REGIO_RELEASE_TIMESTAMP_MISSING
```

---

# 14. Warncodes

```ts
REGIO_POI_RADIUS_NEAR_MINIMUM
REGIO_POI_RADIUS_NEAR_MAXIMUM
REGIO_LARGE_COMPARISON_MARGIN
REGIO_PENDING_POIS_EXIST
REGIO_MANY_REJECTED_POIS
REGIO_ROUTE_EXCLUDE_DEFAULT_ACTIVE
REGIO_RESTRICTIONS_EXIST
REGIO_TEMPORARY_RESTRICTIONS_EXPIRING_SOON
REGIO_RELEASE_HAS_WARNINGS
REGIO_SYSTEM_ADJUST_VERSION_MISMATCH
REGIO_MANUAL_POIS_WITHOUT_SOURCE_NOTE
REGIO_UNKNOWN_POI_CATEGORY
```

---

# 15. UI-Anforderungen

Panel 2 soll als eigenständiges Input-Panel sichtbar bleiben.

## 15.1 Layout

Empfohlenes Layout:

```txt
┌────────────────────────────────────────────────────────────┐
│ Panel 2: Regio-Content Input                              │
├────────────────────────────────────────────────────────────┤
│ Region auswählen / Regio-Content laden                     │
│ Quelle: Path-Works Regio-Dashboard | Mock | JSON | API      │
├────────────────────────────────────────────────────────────┤
│ Statuskarten                                                │
│ - Region                                                    │
│ - POI-Freigaben                                             │
│ - POI-Radien                                                │
│ - Regionale Parameter                                       │
│ - Sperren und Hinweise                                      │
│ - Freigabestatus                                            │
├────────────────────────────────────────────────────────────┤
│ Tabs                                                        │
│ 1. Region                                                   │
│ 2. POI-Freigaben                                            │
│ 3. POI-Radien                                               │
│ 4. Regionale Parameter                                      │
│ 5. Sperren und Hinweise                                     │
│ 6. Freigabestatus                                           │
├────────────────────────────────────────────────────────────┤
│ Footer                                                      │
│ [Laden] [Validieren] [In Kontext übernehmen]                │
└────────────────────────────────────────────────────────────┘
```

## 15.2 Tab 1: Region

Zweck:

- aktive Region anzeigen
- regionale Version anzeigen
- Quelle anzeigen
- räumliche Region prüfen

Felder:

```txt
Region-ID
Regionsname
Regionstyp
Land / Admin-Code
Zeitzone
Default-Sprache
Bounding Box
Region-Geometrie vorhanden ja/nein
Regio-Content-Version
Quelle
Geladen am
```

Aktionen:

```txt
Region laden
Mock-Region laden
JSON importieren
```

## 15.3 Tab 2: POI-Freigaben

Zweck:

- POI-Kandidaten prüfen
- freigegebene POIs anzeigen
- abgelehnte POIs anzeigen
- POIs zur Prüfung anzeigen

Listen:

```txt
Freigegebene POIs
Abgelehnte POIs
POIs zur Prüfung
Manuelle POIs
```

Felder je freigegebenem POI:

```txt
POI-ID
Name
Kategorie
Quelle
Kandidatenklasse
Status
Koordinaten
Radius
Sichtbarkeit
Freigegeben von
Freigegeben am
Operator-Notiz
```

Filter:

```txt
Sicher relevant
Möglicherweise relevant
Manuell
Freigegeben
Abgelehnt
Zur Prüfung
Deaktiviert
```

## 15.4 Tab 3: POI-Radien

Zweck:

- bestätigte Radien sichtbar machen
- Radiuswerte gegen System-Adjust prüfen
- Vergleichssaum und effektiven Vergleichsradius anzeigen

Felder:

```txt
POI-ID
POI-Name
Radius
Radiusquelle
Radiusstatus
System-Minimum
System-Maximum
Vergleichssaum
Effektiver Vergleichsradius
Letzte Änderung
```

Validierungsanzeige:

```txt
Radius gültig
Radius zu klein
Radius zu groß
Radius nicht bestätigt
Vergleichssaum ungültig
```

## 15.5 Tab 4: Regionale Parameter

Zweck:

- regionale Parameter als Abweichung oder Konkretisierung von System-Adjust anzeigen

Felder:

```txt
Parameter-Version
Vergleichssaum
Aufenthalts-Dichteverhältnis
Bewegungslast-Grenzwert
Aufenthaltslast-Grenzwert
Routen-Abwertungsschwelle
Routen-Ausschlussschwelle
Grenzwertverhalten
Fallback-Routenregel
Signal-Gültigkeit, falls regional gesetzt
Aggregationszeitfenster, falls regional gesetzt
Glättungsstärke
Kantengewicht
Routenprofile
```

Anzeige je Parameter:

```txt
Regionaler Wert
System-Default
System-Minimum
System-Maximum
Status: gültig / Warnung / ungültig
```

## 15.6 Tab 5: Sperren und Hinweise

Zweck:

- lokale Sperren, Hinweise, Gefahren, saisonale Regeln und Staustellenprüfungen sichtbar machen
- Routenwirkung und Darstellungswirkung getrennt führen

Felder je Eintrag:

```txt
ID
Typ
Geometrie vorhanden
Label
Beschreibung
Schweregrad
Routenwirkung
Darstellungswirkung
Gültig von
Gültig bis
Quelle
Status
Freigegeben von
Freigegeben am
```

Wichtig:

`route_effect` und `display_effect` müssen getrennt angezeigt werden.

## 15.7 Tab 6: Freigabestatus

Zweck:

- prüfen, ob der regionale Stand in die SCIM-Pipeline übernommen werden darf

Felder:

```txt
Release-Status
Release-ID
Draft-ID
Vorheriger Release
Freigegeben von
Freigegeben am
Changelog
Blockiert Runtime-Nutzung ja/nein
Validierungsstatus
Fehlerliste
Warnliste
Geprüft gegen System-Adjust-Version
```

Aktionen:

```txt
Validieren
In Kontext übernehmen
```

---

# 16. UI-Zustände

## 16.1 Initial

```ts
status: 'not_loaded'
```

Anzeige:

```txt
Noch kein Regio-Content geladen.
```

Aktionen:

```txt
Region laden
Mock laden
JSON importieren
```

## 16.2 Loading

```ts
status: 'loading'
```

Anzeige:

```txt
Regio-Content wird geladen.
```

Aktionen gesperrt:

```txt
Validieren
In Kontext übernehmen
```

## 16.3 Loaded unvalidated

```ts
status: 'loaded_unvalidated'
```

Anzeige:

```txt
Regio-Content geladen, aber noch nicht validiert.
```

Aktionen erlaubt:

```txt
Validieren
```

## 16.4 Draft

```ts
status: 'regio_content_draft'
```

Anzeige:

```txt
Regio-Content ist ein Entwurf und darf nicht runtime-wirksam übernommen werden.
```

Aktionen erlaubt:

```txt
Validieren
```

Aktionen gesperrt:

```txt
In Runtime-Kontext übernehmen
```

## 16.5 Valid

```ts
status: 'regio_content_valid'
```

Anzeige:

```txt
Regio-Content ist gültig und freigegeben.
```

Aktionen erlaubt:

```txt
In Kontext übernehmen
Weiter zu Ziel-App UI Input oder Boundary/Extraktion
```

## 16.6 Warning

```ts
status: 'regio_content_warning'
```

Anzeige:

```txt
Regio-Content ist verwendbar, enthält aber Warnungen.
```

Aktionen erlaubt:

```txt
In Kontext übernehmen, sofern keine blockierenden Fehler vorliegen und Release freigegeben ist
```

## 16.7 Invalid

```ts
status: 'regio_content_invalid'
```

Anzeige:

```txt
Regio-Content ist ungültig. Folgepanels dürfen diesen Stand nicht verwenden.
```

Aktionen gesperrt:

```txt
In Kontext übernehmen
Weiter
```

---

# 17. Service-Logik

## 17.1 loadRegioContentVersion

```ts
export async function loadRegioContentVersion(
  source: RegioContentSource,
  regionId?: string,
  version?: string
): Promise<unknown> {
  // Quelle laden: Path-Works Regio-Dashboard, Mock, JSON oder API.
  // Ergebnis ist unknown, weil es erst normalisiert werden muss.
}
```

## 17.2 normalizeRegioContent

```ts
export function normalizeRegioContent(raw: unknown): RegioContentState {
  // Rohdaten in stabiles internes Schema überführen.
  // Optionale Felder mit sicheren Defaults ergänzen.
  // Pflichtfelder nicht stillschweigend erfinden.
}
```

## 17.3 validateRegioContent

```ts
export function validateRegioContent(
  state: RegioContentState,
  systemAdjust: SystemAdjustState | undefined
): RegioContentValidationResult {
  const errors: RegioContentIssue[] = [];
  const warnings: RegioContentIssue[] = [];

  // System-Adjust prüfen
  // Region prüfen
  // POIs prüfen
  // Radien prüfen
  // regionale Parameter prüfen
  // Sperren und Hinweise prüfen
  // Freigabe prüfen
  // Warnungen ableiten

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    checked_against_system_adjust_version: systemAdjust?.system_adjust_version ?? 'missing'
  };
}
```

## 17.4 applyRegioContentToContext

```ts
export function applyRegioContentToContext(
  context: ScimContext,
  regioContent: RegioContentState
): ScimContext {
  if (regioContent.status !== 'regio_content_valid' && regioContent.status !== 'regio_content_warning') {
    throw new Error('Cannot apply invalid or draft Regio-Content state to SCIM context.');
  }

  if (regioContent.release.release_status !== 'released' || regioContent.release.blocks_runtime_use) {
    throw new Error('Cannot apply unreleased Regio-Content to runtime SCIM context.');
  }

  return {
    ...context,
    regio_content: regioContent
  };
}
```

Wichtig:

Diese Funktion darf keine anderen Kontextbereiche verändern.

## 17.5 validatePoiAgainstSystemAdjust

```ts
export function validatePoiAgainstSystemAdjust(
  poi: RegioPoi,
  systemAdjust: SystemAdjustState,
  issues: RegioContentIssue[]
): void {
  // Radius vorhanden
  // Radius innerhalb Range
  // Center vorhanden
  // Status konsistent
  // Systemversion kompatibel
}
```

## 17.6 validateRegionalParametersAgainstSystemAdjust

```ts
export function validateRegionalParametersAgainstSystemAdjust(
  params: RegionalParameters,
  systemAdjust: SystemAdjustState,
  issues: RegioContentIssue[]
): void {
  // Alle regionalen Werte gegen allowed_ranges prüfen.
  // Mindestaggregation gegen Privacy/Aggregation Limits prüfen.
  // route_degrade_threshold <= route_exclude_threshold prüfen.
}
```

---

# 18. Mock-Daten

```ts
export const mockRegioContentState: RegioContentState = {
  regio_content_version: 'regio_v1.0.0',
  source: 'mock',
  loaded_at: '2026-05-21T00:00:00.000Z',
  region: {
    region_id: 'region_hochwab_nord',
    region_name: 'Hochschwab Nord',
    region_type: 'trail_area',
    country_code: 'AT',
    default_language: 'de',
    timezone: 'Europe/Vienna',
    bbox: [15.0, 47.5, 15.4, 47.8]
  },
  approved_pois: [
    {
      poi_id: 'poi_001',
      source_poi_id: 'osm_node_123',
      source: 'osm',
      name: 'Beispielhütte',
      category: 'alpine_hut',
      candidate_class: 'safe_relevant',
      status: 'approved',
      center: { type: 'Point', coordinates: [15.21, 47.64] },
      radius_meters: 50,
      comparison_margin_meters: 25,
      effective_comparison_radius_meters: 75,
      visibility: 'scim_active',
      approved_by: 'operator_mock',
      approved_at: '2026-05-21T00:00:00.000Z',
      system_adjust_version: 'sys_v1.0.0'
    }
  ],
  rejected_pois: [
    {
      poi_id: 'poi_rejected_001',
      source_poi_id: 'osm_node_456',
      source: 'osm',
      name: 'Nicht relevanter Wegweiser',
      category: 'information',
      center: { type: 'Point', coordinates: [15.23, 47.65] },
      rejected_reason: 'not_stay_relevant',
      rejected_by: 'operator_mock',
      rejected_at: '2026-05-21T00:00:00.000Z'
    }
  ],
  pending_pois: [
    {
      poi_id: 'poi_pending_001',
      source_poi_id: 'osm_node_789',
      source: 'osm',
      name: 'Aussichtspunkt zur Prüfung',
      category: 'viewpoint',
      candidate_class: 'safe_relevant',
      center: { type: 'Point', coordinates: [15.25, 47.66] },
      suggested_radius_meters: 35,
      suggested_comparison_margin_meters: 25,
      review_reason: 'Operator-Freigabe ausstehend',
      created_at: '2026-05-21T00:00:00.000Z'
    }
  ],
  poi_radii: [
    {
      poi_id: 'poi_001',
      radius_meters: 50,
      radius_source: 'operator_adjusted',
      radius_status: 'confirmed',
      comparison_margin_meters: 25,
      effective_comparison_radius_meters: 75,
      min_allowed_radius_meters: 5,
      max_allowed_radius_meters: 500,
      system_adjust_version: 'sys_v1.0.0',
      updated_by: 'operator_mock',
      updated_at: '2026-05-21T00:00:00.000Z'
    }
  ],
  regional_parameters: {
    parameter_version: 'regio_params_v1.0.0',
    comparison_margin_meters: 25,
    stay_density_ratio: 1.6,
    movement_load_threshold: 0.7,
    stay_load_threshold: 0.7,
    route_degrade_threshold: 0.65,
    route_exclude_threshold: 0.9,
    route_exceedance_behavior: 'degrade',
    signal_validity_seconds: 300,
    aggregation_window_seconds: 300,
    smoothing_strength: 0.35,
    edge_weight_factor: 1.0,
    fallback_route_policy: 'allow_degraded_if_no_alternative',
    route_profiles: [
      {
        profile_id: 'low_load_route',
        label: 'Auslastungsarme Route',
        movement_load_threshold: 0.55,
        stay_load_threshold: 0.55,
        route_degrade_threshold: 0.5,
        route_exclude_threshold: 0.85,
        route_exceedance_behavior: 'profile_dependent',
        enabled: true
      }
    ],
    system_adjust_version: 'sys_v1.0.0'
  },
  regional_restrictions: [
    {
      restriction_id: 'restriction_001',
      type: 'seasonal_closure',
      geometry: {
        type: 'LineString',
        coordinates: [
          [15.20, 47.63],
          [15.22, 47.64]
        ]
      },
      label: 'Saisonale Sperre Beispielweg',
      severity: 'medium',
      route_effect: 'degrade',
      display_effect: 'sensus_core_warning',
      valid_from: '2026-05-01T00:00:00.000Z',
      valid_until: '2026-10-31T23:59:59.000Z',
      source: 'operator',
      status: 'approved',
      approved_by: 'operator_mock',
      approved_at: '2026-05-21T00:00:00.000Z'
    }
  ],
  regional_warnings: [],
  release: {
    release_status: 'released',
    release_id: 'regio_release_001',
    released_by: 'operator_mock',
    released_at: '2026-05-21T00:00:00.000Z',
    previous_release_id: undefined,
    changelog: 'Initialer Mock-Release für Panel 2.',
    blocks_runtime_use: false
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:00:00.000Z',
    checked_against_system_adjust_version: 'sys_v1.0.0'
  },
  status: 'regio_content_valid'
};
```

---

# 19. Übergabe an Folgepanels

Panel 2 gibt folgendes Kontextsegment weiter:

```json
{
  "regio_content": {
    "regio_content_version": "regio_v1.0.0",
    "region": {},
    "approved_pois": [],
    "rejected_pois": [],
    "pending_pois": [],
    "poi_radii": [],
    "regional_parameters": {},
    "regional_restrictions": [],
    "regional_warnings": [],
    "release": {},
    "status": "regio_content_valid"
  }
}
```

## 19.1 Übergabe an Panel 5: Boundary und Extraktion

Boundary und Extraktion nutzen Regio-Content für:

- regionale Geometrie oder Default-Region
- freigegebene POIs im oder nahe dem Boundary-Bereich
- abgelehnte POI-Kandidaten zur Vermeidung falscher Vorschläge
- regionale Sperren und Hinweise
- regionale Puffer- oder Vergleichsparameter, sofern definiert

## 19.2 Übergabe an Panel 6: Graph und Basislayer

Graph- und Basislayer-Module nutzen Regio-Content für:

- freigegebene POIs als spätere Graphbezüge
- regionale Sperren als mögliche Kantenattribute
- regionale Hinweise als Operator- oder Ziel-App-Layerkandidaten

## 19.3 Übergabe an Panel 7: POI, Load und Bewegung

POI-, Load- und Bewegungslogik nutzt Regio-Content für:

- bestätigte POI-Radien
- Vergleichssaum
- Aufenthalts-Dichteverhältnis
- regionale Mindest-/Defaultparameter
- Sperren und Hinweise
- Staustellenprüfungen

## 19.4 Übergabe an Panel 8: Routenbewertung und Routendarstellung

Routenbewertung nutzt Regio-Content für:

- regionale Routenparameter
- Abwertungs- und Ausschlussschwellen
- Fallback-Regeln
- Routentyp-Profile
- regionale Sperren mit Routenwirkung
- Hinweise und Warnungen

## 19.5 Übergabe an Sensus-Core Package Builder

Sensus-Core Package Builder darf nur freigegebene, reduzierte und zulässige Bestandteile übernehmen:

- freigegebene POIs, sofern Ziel-App sichtbar
- freigegebene Hinweise/Warnungen
- keine abgelehnten POIs als User-Ausgabe
- keine Operator-Notizen
- keine Draft-Restriktionen
- keine Debug- oder Rohdaten



# 20. Akzeptanzkriterien

## 20.1 Laden

- Ein Mock-Regio-Content kann geladen werden.
- Ein Regio-Content-Objekt kann aus JSON geladen werden.
- Der Ladezustand wird korrekt angezeigt.
- Fehler beim Laden werden im Panel sichtbar.

## 20.2 System-Adjust-Abhängigkeit

- Ohne gültiges `context.system_adjust` kann kein Regio-Content als runtime-gültig übernommen werden.
- Regio-Content wird gegen die aktive System-Adjust-Version geprüft.
- System-Adjust-Grenzen werden nicht unterschritten.

## 20.3 POI-Freigaben

- Freigegebene POIs brauchen Zentrum, Radius und Status `approved`.
- Kandidaten erzeugen keine aktiven Aufenthaltsbereiche.
- Abgelehnte POIs erscheinen nicht gleichzeitig als freigegebene POIs.
- Manuelle POIs können geführt werden, brauchen aber Quelle und Operator-Hinweis.

## 20.4 POI-Radien

- Jeder freigegebene POI braucht einen bestätigten Radius.
- Radiuswerte außerhalb der System-Adjust-Range erzeugen blockierende Fehler.
- Vergleichssaum außerhalb der System-Adjust-Range erzeugt blockierende Fehler.
- Effektiver Vergleichsradius wird korrekt geprüft.

## 20.5 Regionale Parameter

- Alle regionalen Werte liegen innerhalb der System-Adjust-Ranges.
- `route_degrade_threshold <= route_exclude_threshold` wird geprüft.
- Regionale Aggregationswerte unterschreiten keine Datenschutz- oder Aggregationsgrenzen.
- Routentyp-Profile werden einzeln geprüft.

## 20.6 Sperren und Hinweise

- Sperren haben ID, Typ, Geometrie, Routenwirkung, Darstellungswirkung und Status.
- Abgelaufene Sperren wirken nicht aktiv routenausschließend.
- Operator-only-Hinweise werden nicht als Sensus-Core-sichtbar markiert.
- `route_effect` und `display_effect` bleiben getrennt.

## 20.7 Freigabe

- Nur `release_status = released` und `blocks_runtime_use = false` erlaubt Runtime-Übernahme.
- Entwürfe können validiert, aber nicht als Runtime-Kontext übernommen werden.
- Fehler blockieren die Übergabe.
- Warnungen erlauben die Übergabe nur, wenn keine blockierenden Fehler und ein gültiger Release vorliegen.

## 20.8 Kontextübergabe

- Die Übergabe verändert ausschließlich `context.regio_content`.
- Kein anderer Kontextbereich wird überschrieben.
- Ungültige oder nicht freigegebene Stände blockieren die Übergabe.

## 20.9 UI

- Das Panel zeigt Region, POI-Freigaben, POI-Radien, regionale Parameter, Sperren/Hinweise und Freigabestatus getrennt an.
- Blockierende Fehler sind klar erkennbar.
- Warnungen sind klar erkennbar.
- Folgeaktionen sind gesperrt, solange Regio-Content ungültig oder nicht freigegeben ist.

## 20.10 Tests

- Unit-Tests für Validator vorhanden.
- Unit-Tests für POI-Radius-Prüfung vorhanden.
- Unit-Tests für regionale Parameter gegen System-Adjust vorhanden.
- Unit-Tests für Freigabestatus vorhanden.
- Unit-Tests für Kontextübergabe vorhanden.
- Mock-Daten-Test vorhanden.

---

# 21. Testfälle

## 21.1 Gültiger Mock

Input:

```ts
mockRegioContentState
validSystemAdjust
```

Erwartung:

```ts
validation.is_valid === true
errors.length === 0
status === 'regio_content_valid'
```

## 21.2 System-Adjust fehlt

Input:

```ts
mockRegioContentState
systemAdjust = undefined
```

Erwartung:

```ts
errors includes REGIO_SYSTEM_ADJUST_MISSING
validation.is_valid === false
```

## 21.3 Radius außerhalb Range

Mutation:

```ts
approved_pois[0].radius_meters = 9999
```

Erwartung:

```ts
errors includes REGIO_POI_RADIUS_OUT_OF_RANGE
validation.is_valid === false
```

## 21.4 Freigegebener POI ohne bestätigten Radius

Mutation:

```ts
poi_radii[0].radius_status = 'suggested'
```

Erwartung:

```ts
errors includes REGIO_POI_RADIUS_NOT_CONFIRMED
validation.is_valid === false
```

## 21.5 Abgelehnter POI doppelt freigegeben

Mutation:

```ts
rejected_pois[0].poi_id = approved_pois[0].poi_id
```

Erwartung:

```ts
errors includes REGIO_REJECTED_POI_DUPLICATE_WITH_APPROVED
validation.is_valid === false
```

## 21.6 Pending POI wird aktiv

Mutation:

```ts
pending_pois[0].status = 'approved'
```

Erwartung:

```ts
errors includes REGIO_PENDING_POI_ACTIVE_FORBIDDEN
validation.is_valid === false
```

## 21.7 Regionale Parameter außerhalb Range

Mutation:

```ts
regional_parameters.stay_density_ratio = 99
```

Erwartung:

```ts
errors includes REGIO_PARAMETER_OUT_OF_RANGE
validation.is_valid === false
```

## 21.8 Routenlogik inkonsistent

Mutation:

```ts
regional_parameters.route_degrade_threshold = 0.95
regional_parameters.route_exclude_threshold = 0.8
```

Erwartung:

```ts
errors includes REGIO_DEGRADE_EXCEEDS_EXCLUDE
validation.is_valid === false
```

## 21.9 Draft blockiert Runtime

Mutation:

```ts
release.release_status = 'draft'
```

Erwartung:

```ts
errors includes REGIO_RELEASE_NOT_RELEASED
applyRegioContentToContext throws
```

## 21.10 Kontextschutz

Input:

```ts
const contextBefore = {
  system_adjust: validSystemAdjust,
  regio_content: undefined,
  graph: { existing: true },
  target_app_ui: { existing: true }
};
```

Aktion:

```ts
const contextAfter = applyRegioContentToContext(contextBefore, validRegioContent);
```

Erwartung:

```ts
contextAfter.regio_content exists
contextAfter.system_adjust === contextBefore.system_adjust
contextAfter.graph === contextBefore.graph
contextAfter.target_app_ui === contextBefore.target_app_ui
```

---

# 22. Umsetzungshinweise für Codex/Claude

## 22.1 Erst headless bauen

Zuerst sollen Typen, Schema, Mock-Daten und Validierungslogik gebaut werden. Die UI kommt danach.

Reihenfolge:

```txt
1. regioContent.types.ts
2. regioContent.mock.ts
3. regioContent.validation.ts
4. regioContent.context.ts
5. regioContent.test.ts
6. RegioContentInputPanel.tsx
```

## 22.2 Keine Fachlogik im UI-Container

Die React-Komponente darf nur anzeigen und Aktionen auslösen. Die Validierungslogik gehört in `regioContent.validation.ts`.

## 22.3 System-Adjust als Pflichtinput behandeln

Panel 2 muss technisch so gebaut sein, dass der Validator immer den System-Adjust-Stand erhält.

Kein Regio-Content darf ohne System-Adjust als runtime-gültig gelten.

## 22.4 Keine Engine-Logik vorwegnehmen

Panel 2 darf POIs und Radien speichern, aber keine Aufenthaltsbereiche berechnen.

Panel 2 darf regionale Routenparameter speichern, aber keine Routenabschnitte bewerten.

Panel 2 darf Sperren und Hinweise speichern, aber keine finalen Layer erzeugen.

## 22.5 Strikte Output-Stabilität

Der Output von Panel 2 ist ein Vertrag. Spätere Panels müssen sich darauf verlassen können.

Deshalb:

- keine wechselnden Feldnamen
- keine UI-spezifischen Feldnamen im Output
- keine aktiven POIs ohne Freigabestatus
- keine freigegebenen POIs ohne bestätigten Radius
- keine regionalen Parameter außerhalb von System-Adjust
- keine Draft-Daten als Runtime-Input

---

# 23. Kompakter Codex-Auftrag für Panel 2

```text
Baue Panel 2: Regio-Content Input für die SCIM.

Kontext:
SCIM ist ein Gesamtsystem aus Input-Schicht, SCIM-Engine, Layer-Erzeugung, Sensus-Core-Paketierung, lokaler User-Anwendung und Freigabe. Sensus Core ist die SCIM am Endgerät. Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug, nicht der Engine-Kern. Alle Panels arbeiten auf einem gemeinsamen SCIM-Kontext. Panel 2 darf nur `context.regio_content` schreiben und muss `context.system_adjust` als nicht unterschreitbaren Rahmen lesen.

Aufgabe:
Baue nur Panel 2. Das Panel lädt, normalisiert, validiert und speichert den regionalen Regio-Content-Stand. Verändere keine anderen Kontextbereiche außer `context.regio_content`.

Zweck:
Regionale POIs, POI-Freigaben, abgelehnte POI-Kandidaten, POI-Radien, regionale Parameter, Sperren/Hinweise und Freigabestatus bereitstellen.

Nicht-Ziele:
Keine Änderung von System-Adjust, keine Ziel-App-UI-Konfiguration, keine Telco-Load-Verarbeitung, kein Graph, keine Aufenthaltsberechnung, keine Bewegungsauslastung, keine Routenbewertung, kein Sensus-Core-Export.

Erzeuge:
- TypeScript-Typen
- Mock-Daten
- Validierungsfunktionen
- Kontext-Apply-Funktion
- React-Panel mit Tabs
- Unit-Tests

Tabs:
1. Region
2. POI-Freigaben
3. POI-Radien
4. Regionale Parameter
5. Sperren und Hinweise
6. Freigabestatus

Output:
`RegioContentState` mit `regio_content_version`, `region`, `approved_pois`, `rejected_pois`, `pending_pois`, `poi_radii`, `regional_parameters`, `regional_restrictions`, `regional_warnings`, `release`, `validation`, `status`.

Validierung:
Blockiere fehlenden oder ungültigen System-Adjust, fehlende Region, freigegebene POIs ohne Zentrum oder bestätigten Radius, Radien außerhalb System-Adjust, regionale Parameter außerhalb System-Adjust, inkonsistente Routen-Schwellen, aktive abgelaufene Sperren, operator-only Inhalte in Sensus-Core-Sichtbarkeit und nicht freigegebene Releases.

Akzeptanzkriterien:
Ein gültiger Mock kann geladen, gegen System-Adjust validiert und in `context.regio_content` übernommen werden. Ein ungültiger, nicht freigegebener oder System-Adjust-widriger Stand blockiert die Übergabe. Die Übergabe verändert keine anderen Kontextbereiche.
```

---

# 24. Kernaussage für Panel 2

Panel 2 ist kein einfacher POI-Editor. Es ist der regionale Inhalts- und Parametervertrag der SCIM.

Wenn Panel 2 zu weich gebaut wird, entstehen später fachlich falsche Zustände: POIs ohne echte Freigabe, Radien außerhalb der Systemgrenzen, regionale Parameter ohne System-Adjust-Prüfung, abgelehnte Kandidaten als aktive Aufenthaltsbereiche, lokale Sperren ohne klare Routenwirkung oder nicht freigegebene Entwürfe in der Runtime.

Deshalb muss Panel 2 als eigenständiges, testbares und gegen System-Adjust hart validierendes Input-Modul gebaut werden.
