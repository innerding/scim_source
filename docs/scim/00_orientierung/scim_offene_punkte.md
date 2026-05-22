# SCIM – Entschiedene Punkte (ehemals offene Punkte)

Dieses Dokument enthält die Entscheidungen zu den ursprünglich offenen Punkten 14.1 bis 14.9.

Status-Legende:

- **ENTSCHIEDEN** — kann direkt implementiert werden
- **ARBEITSPARAMETER** — gilt für Entwicklung und Tests; braucht Rechts-/Compliance-Freigabe vor Production Release

---

## 14.1 Berührung von Aufenthaltsbereichen durch Routenabschnitte

**Status: ENTSCHIEDEN**

Ein Routenabschnitt gilt als durch einen Aufenthaltsbereich betroffen, wenn seine Geometrie den bestätigten POI-Aufenthaltsradius **geometrisch schneidet** oder innerhalb des **Vergleichssaums** liegt.

Der Vergleichssaum ist die Toleranzzone. Es wird kein separater Toleranzparameter eingeführt.

Relationen in Priorität:

| Relation | `StayRouteRelation` | Wirkung |
|---|---|---|
| Abschnitt schneidet POI-Radius | `intersects_stay_radius` | Abwertungskandidat oder Ausschluss je Profil |
| Abschnitt liegt im Vergleichssaum | `inside_comparison_margin` | Warning oder Abwertungskandidat, kein automatischer Ausschluss |
| Teilsegment betroffen | `partial_overlap` | konservative Abwertung |
| Reine Punktberührung | `touches_stay_radius` | nur advisory, keine Routenwirkung |
| Nahe Referenz ohne Schnitt | `nearby_reference_only` | kein Routeneffekt |

Implementierungshinweis: Diese Relationen sind bereits in `SectionStayContext.relation` (Panel 8) modelliert.

---

## 14.2 Ausschluss oder Abwertung von Routenabschnitten

**Status: ENTSCHIEDEN**

Standardverhalten: Dreistufige Eskalation von unten nach oben:

```
warning → degraded → excluded
```

Harter Ausschluss (`excluded`) nur wenn mindestens eine dieser Bedingungen zutrifft:

- aktive regionale Sperre mit `route_effect = exclude`
- `movement_score` überschreitet `route_exclude_threshold`
- Routentyp-Profil schreibt Ausschluss ab dieser Schwelle vor
- Ziel-App-UI blockiert diesen Abschnitt explizit

Standardschwellen (in System-Adjust als `DefaultParameters`, in Regio-Content überschreibbar innerhalb `AllowedRanges`):

| Aktion | Standard | System-Adjust-Feld |
|---|---|---|
| warning | movement_score > 0.50 | _(implizit unter degrade_threshold)_ |
| degraded | movement_score > **0.65** | `default_route_degrade_threshold` |
| excluded | movement_score > **0.90** | `default_route_exclude_threshold` |

Default-Verhalten bei Überschreitung: `route_exceedance_default_behavior = 'degrade'`

Diese Werte sind bereits in den Panel-1-Mock-Defaults hinterlegt (`mockDefaultParameters`).

---

## 14.3 User-Schwellenwerte und Profile

**Status: ENTSCHIEDEN**

Vierstufiges Modell, jede Stufe darf nur innerhalb der übergeordneten Grenzen operieren:

```
System-Adjust     → absolute nicht unterschreitbare Systemgrenzen (min/max)
Regio-Content     → regionale Defaultwerte und POI-spezifische Parameter
Target-App-UI     → Routentyp-Profile (low_load, quiet, fastest, balanced, fallback)
Panel 10 lokal    → User-Regler innerhalb Target-App-UI-erlaubter Bandbreite
```

Regel:

- User-Regler in Panel 10 können niemals System-Adjust-Grenzen unterschreiten, egal über welche Ebene.
- Regio-Content kann Defaults enger als System-Adjust setzen, aber nicht weiter.
- Target-App-UI wählt aus den Regio-Content-Defaults, welche Profile der User überhaupt angeboten bekommt.

---

## 14.4 Behandlung semantisch relevanter Shape-Knoten

**Status: ENTSCHIEDEN**

Ein Shape-Knoten wird zum semantischen Zwischenknoten aufgewertet, wenn er mindestens eine dieser Bedingungen erfüllt:

1. liegt innerhalb eines bestätigten POI-Aufenthaltsradius
2. ist Grenzpunkt zwischen einer maskierten und einer unmaskierten Kante
3. ist Randknoten einer Staustellenabgrenzung
4. wird als Abschnitt-Split-Punkt für Panel 8 benötigt (Masking, Aufenthalt, Sperre)
5. trägt wiederholt Signalkumulationen, die eine Aufenthaltsklassifizierung ermöglichen würden

Die Aufwertung verändert **nur die SCIM-semantische Rolle**, nie die Originalgeometrie des Wegs. Im Graph bekommt der Knoten zusätzlich ein Feld:

```ts
semantic_role?: 'stay_boundary' | 'mask_boundary' | 'jam_boundary' | 'section_split'
```

---

## 14.5 Pufferbereich für Datenabfrage

**Status: ENTSCHIEDEN**

Dynamische Berechnung:

```
buffer_meters = max(
  max(aktive_poi_radien) + max(vergleichssäume),
  system_adjust.allowed_ranges.boundary_buffer_meters.min
)
```

Empfohlene System-Adjust-Standardwerte (in `AllowedRanges.boundary_buffer_meters`):

| Parameter | Empfehlung |
|---|---|
| `min` | **150 m** |
| `max` | **500 m** |
| `default` | **200 m** |

Regio-Content kann den effektiven Puffer innerhalb dieser Grenzen regional anpassen.

Begründung für 150 m Minimum: deckt typische POI-Radien (30–100 m) + Vergleichssaum + einen Graphsegment-Puffer ab, damit Randknoten und Randkanten nicht abgeschnitten werden.

Implementierungshinweis: Das Feld `boundary_buffer_meters` ist als `NumericRange` in `AllowedRanges` (Panel 1) hinzuzufügen.

---

## 14.6 Runtime-Load-Signale und Standortsignale

**Status: ENTSCHIEDEN**

**Signalhierarchie:**

- Primär: aggregierte Telco-Load-Batches (Panel 4), bereits datenschutzkonform aggregiert
- Supplementär: Standortsignale der Ziel-App — nur für Bewegungs-/Aufenthalts-Disambiguierung bei dünner Datenlage, nicht als eigenständige Lastquelle; brauchen eigene Mindestaggregation

**Gültigkeitsdauern (in System-Adjust als Parameter):**

| Parameter | Empfehlung | System-Adjust-Feld |
|---|---|---|
| Runtime-Signal-Gültigkeit | **15 Minuten** | `default_signal_validity_seconds = 900` |
| Batch-Signal-Gültigkeit | **4 Stunden** (operatorabhängig) | konfigurierbar |
| Signal-Decay-Halbwertzeit | **7,5 Minuten** | `default_decay_half_life_seconds = 450` |

**Konfliktbehandlung:** Wenn Telco-Load und Standortsignale widersprüchlich sind, hat Telco-Load Vorrang. Standortsignal erzeugt nur Confidence-Reduktion, keine eigenständige Klassifizierung.

**Taktung bei hoher Last:** engere Aggregationsfenster (z.B. 5 min), aber strengere Mindestaggregation (mehr Geräte erforderlich).

---

## 14.7 Parameterebenen System-Adjust / Regio-Content / Representation

**Status: ENTSCHIEDEN** (Bestehendes formalisiert)

| Ebene | Quelle | Inhalt |
|---|---|---|
| System-Adjust | SCIM3 Atlas Console | Systemgrenzen, Datenschutzgrenzen, Defaultwerte, Parameterbereiche, Regelversionen |
| Regio-Content | Path-Works Regio-Dashboard | POI-Freigaben, POI-Radien, regionale Defaultwerte, Sperren, Staustellenprüfung |
| Mother-Representation | Sensus Core laufzeitnah | verarbeitet freigegebene Zustände, bildet aktuellen SCIM-Zustand |
| Representation / App | Sensus Core am Endgerät | reduzierte Darstellung, Routenvorschläge, User-Regler, Toleranzen |

Keine Ebene darf die Grenzen der übergeordneten Ebene unterschreiten.

---

## 14.8 Datenschutz und Anonymisierung

**Status: ARBEITSPARAMETER**

Diese Werte gelten als Defaults für Entwicklung und Tests. Vor einem Production Release ist eine **Rechts- und Datenschutz-Freigabe** erforderlich.

### Mindestaggregation

| Parameter | Empfehlung | System-Adjust-Feld |
|---|---|---|
| Min. unterschiedliche Geräte je sichtbarer Kumulation | **5** | `min_distinct_devices_per_visible_aggregate` |
| Min. Signale je Aggregationsfenster | **15** | `min_signals_per_visible_aggregate` |
| Min. Signale für Aufenthaltsklassifizierung | **10** | `min_signals_for_stay_classification` |
| Min. Signale für Bewegungslast | **8** | `min_signals_for_movement_load` |

### Zeitliche Grenzen

| Parameter | Empfehlung | System-Adjust-Feld |
|---|---|---|
| Max. Rohsignal-Retention | **5 Minuten** | `max_raw_signal_validity_seconds = 300` |
| Max. Rohsignal-Speicherung | **5 Minuten** | `max_raw_signal_storage_seconds = 300` |
| Max. Aggregat-Speicherung | **90 Tage** | `max_aggregated_signal_storage_seconds = 7776000` |
| Aggregationsfenster | **15 Minuten rolling** | `default_time_window_seconds = 900` |

### Räumliche Grenzen

| Parameter | Empfehlung | System-Adjust-Feld |
|---|---|---|
| Räumliche Mindestauflösung (sichtbare Last) | Projektion auf Graphkante, min. **100 m Kantenlänge** | `min_visible_edge_length_meters = 100` |
| Min. sichtbarer Aufenthaltsradius | **30 m** | `min_visible_stay_area_radius_meters = 30` |
| Räumliche Verarbeitung | Rohkoordinaten auf Graphkanten projizieren, **keine Punktkoordinaten** in SCIM-Kontext nach Panel 4 | _(hardcoded Regel, kein Parameter)_ |

### Nicht unterschreitbare Systemgrenzen (hardcoded, kein Parameter)

```ts
allow_single_device_visibility = false          // fest
allow_raw_signals_in_sensus_core = false        // fest
allow_debug_data_in_sensus_core = false         // fest
privacy_blocked → nie entsperrbar durch Downstream-Panel
run_mode = production → blockiert Simulation-Load als Lastbasis
```

### Zugriffsebenen

| Ebene | Darf sehen |
|---|---|
| System-Adjust | Systemparameter, Grenzen, Modellversionen — keine Bewegungsprofile |
| Regio-Content | POIs, Radien, aggregierte Auslastungen, Staustellen — keine Einzelsignale |
| Mother-Representation | freigegebene Aggregate, temporär Rohsignale (max. 5 min, zweckgebunden) |
| Representation / App | nur reduzierte, nutzergeeignete SCIM-Ergebnisse — keine Rohsignale, keine Operator-Daten |

---

## 14.9 Darstellungslogik in Leaflet

**Status: ENTSCHIEDEN**

Zwei strikt getrennte Ansichten:

### Operator-Ansicht (Panel 7–11, nie in Sensus Core)

Alle technischen Layer erlaubt:

- Kanten-IDs, Knotenpunkte, Aggregate-Scores
- Maskierungen, POI-Radien, Vergleichssäume
- Debug-Overlay, Operator-Notizen
- Rohaggregate (keine Rohsignale)

### Ziel-App-Ansicht (`sensus_core_candidate_geojson`)

Nur erlaubte Datenklassen: `public_aggregate`, `reduced_scim_result`, `public_route`, `public_warning`

| Element | Darstellung |
|---|---|
| Bewegungslast auf Kanten | Farbschema: none / low / medium / high / critical (keine Score-Zahlen) |
| Aufenthaltsdichte um POIs | Kreisintensität (kein Absolutwert, kein Gerätebezug) |
| Staustellenindikatoren | Icon-Overlay, kein Score sichtbar |
| Routenvorschläge | farbige Polylines je Status (empfohlen / mit Warnung / Fallback) |
| Ausgeschlossene Abschnitte | je Target-App-UI ausblenden oder grau, kein Ausschlussgrund im Detail |

**Nicht sichtbar in Ziel-App:** Scores als Zahlen, Signalzahlen, Geräteanzahl, Operator-Notizen, Debug-Attribute, interne IDs, Rohaggregate.

Diese Trennung ist in `ScimDataPrivacyLevel`, `ScimVisibility` und `ScimLayerDataClass` (Kontextvertrag) sowie in `RouteLayerModelState` (Panel 8) bereits modelliert.

---

## Übersicht: Implementierungsbereitschaft

| Punkt | Status | Nächste Aktion |
|---|---|---|
| 14.1 Aufenthaltsberührung | ENTSCHIEDEN | direkt in Panel 8 übernehmen (bereits als `StayRouteRelation` modelliert) |
| 14.2 Ausschluss/Abwertung | ENTSCHIEDEN | Schwellen in Panel-1-Defaults bestätigt (0.65 / 0.90) |
| 14.3 Schwellenwertebenen | ENTSCHIEDEN | in Panel 1–3 und Target-App-UI-Spec bestätigen |
| 14.4 Shape-Knoten | ENTSCHIEDEN | `semantic_role` in Graph-Spec (Panel 6) ergänzen |
| 14.5 Puffer | ENTSCHIEDEN | `boundary_buffer_meters` in `AllowedRanges` (Panel 1) ergänzen |
| 14.6 Runtime-Load | ENTSCHIEDEN | `default_signal_validity_seconds = 900` in Panel-1-Defaults |
| 14.7 Parameterebenen | ENTSCHIEDEN | bestehende Festlegung verbindlich — kein weiterer Handlungsbedarf |
| 14.8 Datenschutz | ARBEITSPARAMETER | mit 5/15/300s/900s/100m/30m als Dev-Defaults starten; Rechts-/Compliance-Freigabe vor Production |
| 14.9 Leaflet-Ansichten | ENTSCHIEDEN | als Rendering-Regel in Panel 11 aufnehmen |
