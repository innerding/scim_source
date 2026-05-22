# SCIM-Bauplan: baubare Panel-Architektur mit Inputs und Sensus Core

## 0. Ziel

Die SCIM wird als Gesamtsystem gebaut. Der rechnerische Kern ist die SCIM-Engine. **Sensus Core** ist die SCIM am Endgerät bzw. in der laufzeitnahen App-Representation.

Leaflet ist nicht die SCIM-Engine. Leaflet wird vor allem für zwei Aufgaben genutzt:

1. Representation-Boundary zeichnen und prüfen
2. Wirkung der SCIM-Ergebnisse visuell kontrollieren

Der Bauplan besteht aus klaren Panels. Jedes Panel erzeugt ein einfaches, weiterreichbares Ergebnis.

Leitsatz:

> Inputs laden und validieren → Boundary erzeugen → Daten extrahieren → Graph bauen → SCIM berechnen → Sensus-Core-Ausgabe erzeugen → lokal anwenden → Wirkung prüfen.

---

# A. Input- und Steuerpanels

Diese Panels gehören zur SCIM, liegen aber vor dem eigentlichen Rechenkern. Sie liefern Parameter, Inhalte, Freigaben, Ziel-App-Struktur und Load-Daten.

---

## Panel 1: System-Adjust Input

### Zweck

Systemweite Regeln, Grenzen und Defaults laden.

### Quelle

SCIM3 Atlas Console oder ein entsprechender System-Adjust-Service.

### Warum eigenes Panel?

Ja. System-Adjust braucht ein eigenes Panel, weil diese Werte alle späteren Panels begrenzen. Ohne System-Adjust darf kein Regio-Content, kein User-Input und kein Telco-Load-Ergebnis gültig werden.

### UI

- Version auswählen
- aktive Systemgrenzen anzeigen
- Datenschutzgrenzen anzeigen
- Regelversion anzeigen
- Validieren-Button

### Input

- Systemparameter
- technische Grenzwerte
- Datenschutzregeln
- Mindestaggregation
- Defaultwerte
- zulässige Wertebereiche
- Regelversionen

### Output

```json
{
  "system_adjust_version": "sys_v1",
  "privacy_limits": {},
  "aggregation_limits": {},
  "allowed_ranges": {},
  "default_parameters": {},
  "rule_versions": {},
  "status": "system_adjust_valid"
}
```

### Übergabe

An alle folgenden Panels als nicht unterschreitbarer Rahmen.

---

## Panel 2: Regio-Content Input

### Zweck

Regionale POIs, Radien, regionale Parameter und Freigaben laden.

### Quelle

Path-Works Regio-Dashboard.

### Warum eigenes Panel?

Ja. Regio-Content braucht ein eigenes Panel, weil POIs und regionale Parameter nicht aus der Engine selbst entstehen dürfen. Die Engine verarbeitet nur freigegebene regionale Inhalte.

### UI

- Region auswählen
- freigegebene POIs anzeigen
- POI-Radien anzeigen
- abgelehnte POI-Kandidaten anzeigen
- regionalen Parameterstand anzeigen
- Freigabestatus prüfen

### Input

- freigegebene POIs
- abgelehnte POI-Kandidaten
- POI-Radien
- regionale Vergleichsparameter
- regionale Routenparameter
- lokale Staustellen- oder Sperrinformationen
- regionale Parameterfreigabe

### Output

```json
{
  "regio_content_version": "regio_v1",
  "approved_pois": [],
  "rejected_pois": [],
  "poi_radii": [],
  "regional_parameters": {},
  "regional_restrictions": [],
  "status": "regio_content_valid"
}
```

### Übergabe

An Boundary-, Extraktions-, POI- und Bewertungslogik.

---

## Panel 3: Ziel-App UI Input

### Zweck

Festlegen, was Sensus Core bzw. die Ziel-App später überhaupt anzeigen, schalten und bedienen darf.

### Quelle

Ziel-App-Konfiguration, Sensus-Core-Konfiguration, App-Child-Ausspielprofil.

### Warum eigenes Panel?

Ja. Dieses Panel muss vor dem Ausspielen existieren, weil die Engine sonst zwar Werte berechnet, aber nicht weiß, welche davon für Endnutzer sichtbar, bedienbar oder verborgen sein müssen.

### UI

- Ziel-App-Profil auswählen
- sichtbare Layer definieren
- erlaubte Routentypen definieren
- erlaubte lokale User-Regler definieren
- Warn- und Hinweislogik auswählen
- Reduktionsprofil prüfen

### Input

- verfügbare Routentypen
- sichtbare Layer
- erlaubte User-Einstellungen
- Darstellungsprofile
- Warntexte und Hinweislogik
- Ziel-App-Reduktionsregeln
- Freigabestatus der Ausspielung

### Output

```json
{
  "target_app_ui_version": "ui_v1",
  "available_route_modes": [],
  "visible_layers": [],
  "allowed_user_controls": [],
  "display_profiles": {},
  "warning_rules": {},
  "status": "target_app_ui_valid"
}
```

### Übergabe

An Layer Composer, Sensus-Core-Ausgabe und lokales User-Panel.

---

## Panel 4: Telco-Load Input

### Zweck

Aggregierte Telco-Load- und Runtime-Load-Daten in die SCIM laden.

### Quelle

Telco-Load-Schnittstelle, Runtime-Load-Service, aggregierte Load-Datenquelle.

### Warum eigenes Panel?

Ja. Telco-Load braucht ein eigenes Panel, weil Signalqualität, Zeitfenster, Mindestaggregation, Gültigkeit und Datenschutz vor der Engine validiert werden müssen.

### UI

- Load-Batch auswählen
- Zeitfenster anzeigen
- Signalqualität anzeigen
- Aggregationsniveau anzeigen
- Datenschutzvalidierung anzeigen
- veraltete oder widersprüchliche Signale markieren

### Input

- aggregierte Load-Signale
- räumlicher Bezug
- Zeitfenster
- Signalqualität
- Aggregationsniveau
- Gültigkeitsdauer
- Verfallslogik
- Bewegungs-/Stillstandsindikatoren, falls vorhanden

### Output

```json
{
  "telco_load_batch_id": "load_001",
  "time_window": {},
  "load_signals": [],
  "aggregation_level": {},
  "signal_quality": {},
  "expiry_rules": {},
  "status": "telco_load_valid"
}
```

### Übergabe

An Aufenthalts-, Bewegungs- und Staustellenlogik.

---

# B. Raum- und Datenpanels

Diese Panels bauen den konkreten Arbeitsraum und das Datenpaket für eine Representation.

---

## Panel 5: Representation-Boundary

### Zweck

Eine benannte räumliche Arbeitsfläche erzeugen.

### Quelle

Leaflet-Zeichenoberfläche oder importierte Geometrie.

### Warum eigenes Panel?

Ja. Die Boundary ist der Startpunkt jeder konkreten Representation. Ohne Boundary gibt es keinen gültigen räumlichen SCIM-Kontext.

### UI

- Leaflet-Karte
- Polygon/Rechteck zeichnen
- Name der Representation
- Speichern-Button
- Boundary validieren

### Input

- gezeichnete oder importierte Geometrie
- Name der Representation
- System-Adjust-Grenzen
- optional Regio-Content-Kontext

### Verarbeitung

- Geometrie validieren
- Bounding Box berechnen
- Boundary speichern
- technischen Puffer vorbereiten

### Output

```json
{
  "representation_id": "rep_001",
  "name": "Hochschwab Nord",
  "boundary_geojson": {},
  "bbox": [minLon, minLat, maxLon, maxLat],
  "buffer_policy": {},
  "status": "boundary_created"
}
```

### Übergabe

An Daten-Extraktion.

---

## Panel 6: Daten-Extraktion

### Zweck

Alle für SCIM relevanten Rohdaten innerhalb der Boundary und des Puffers herauslösen.

### UI

- aktive Boundary anzeigen
- Puffer anzeigen
- Button: Daten extrahieren
- Ergebnisliste: Wege, POIs, Randobjekte, Signale

### Input

- Boundary
- System-Adjust Input
- Regio-Content Input
- Telco-Load Input

### Verarbeitung

- POI-Kandidaten innerhalb Boundary extrahieren
- freigegebene Regio-POIs zuordnen
- wanderrelevante Wege innerhalb Boundary + Puffer extrahieren
- Randanschlüsse erkennen
- Telco-Load-Daten räumlich vorfiltern

### Output

```json
{
  "representation_id": "rep_001",
  "ways": [],
  "poi_candidates": [],
  "approved_pois": [],
  "boundary_connections": [],
  "filtered_load_signals": [],
  "status": "data_extracted"
}
```

### Übergabe

An SCIM-Arbeitsgraph.

---

# C. SCIM-Engine-Panels

Diese Panels bilden den rechnerischen Kern. Sie sollten möglichst UI-arm und testbar sein.

---

## Panel 7: SCIM-Kontext-Validator

### Zweck

Alle Inputs und Extraktionsdaten zu einem gültigen SCIM-Kontext zusammenführen.

### Warum eigenes Panel?

Ja. Dieses Panel ist wichtig, weil hier geprüft wird, ob System-Adjust, Regio-Content, Ziel-App UI, Telco-Load und Boundary zueinander passen.

### UI

- Status je Input
- Fehlerliste
- Warnungen
- Button: SCIM-Kontext validieren

### Input

- System-Adjust Output
- Regio-Content Output
- Ziel-App UI Output
- Telco-Load Output
- Boundary Output
- Extraktionspaket

### Verarbeitung

- Versionen prüfen
- Wertebereiche prüfen
- Datenschutzgrenzen prüfen
- Freigaben prüfen
- fehlende Inputs markieren
- Konflikte auflösen oder blockieren

### Output

```json
{
  "representation_id": "rep_001",
  "scim_context_id": "ctx_001",
  "system_adjust": {},
  "regio_content": {},
  "target_app_ui": {},
  "telco_load": {},
  "extracted_data": {},
  "validation_errors": [],
  "validation_warnings": [],
  "status": "scim_context_valid"
}
```

### Übergabe

An Graph Builder.

---

## Panel 8: Graph Builder

### Zweck

Aus Wegen, POIs und Randanschlüssen einen SCIM-Arbeitsgraphen erzeugen.

### UI

- Graph erzeugen
- Anzahl Knoten
- Anzahl Kanten
- Anzahl Shape-Punkte
- Debug-Ansicht optional

### Input

- validierter SCIM-Kontext
- extrahierte Wege
- Randanschlüsse

### Verarbeitung

- Linien in Knoten und Kanten zerlegen
- topologische Knoten erkennen
- Shape-Punkte erhalten und semantisch trennen
- Kantenabschnitte bilden
- routenrelevante Abschnitte vorbereiten

### Output

```json
{
  "representation_id": "rep_001",
  "graph_id": "graph_001",
  "nodes": [],
  "edges": [],
  "shape_points": [],
  "route_sections": [],
  "status": "graph_created"
}
```

### Übergabe

An POI- und Aufenthaltsmodell.

---

## Panel 9: POI- und Aufenthaltsmodell

### Zweck

Freigegebene POIs, Radien und Aufenthaltsbereiche in den Graphen einhängen.

### UI

- POI-Liste
- Status: Kandidat, freigegeben, deaktiviert
- Radius je POI
- Aufenthaltsradius anzeigen

### Input

- Graph
- Regio-Content Input
- System-Adjust-Grenzen
- POI-Kandidaten aus Extraktion

### Verarbeitung

- POIs Graphknoten oder Segmenten zuordnen
- bestätigte POI-Radien anwenden
- Aufenthaltsbereiche erzeugen
- betroffene Kanten/Abschnitte markieren
- nicht freigegebene POIs ausschließen

### Output

```json
{
  "representation_id": "rep_001",
  "poi_model_id": "poi_model_001",
  "approved_pois": [],
  "stay_areas": [],
  "poi_edge_links": [],
  "status": "poi_model_created"
}
```

### Übergabe

An Load Processor.

---

## Panel 10: Load Processor

### Zweck

Telco-Load- und Runtime-Load-Signale auf Graph, Bewegungskanten und Aufenthaltsbereiche projizieren.

### UI

- Signalqualität anzeigen
- gültige/ungültige Signale anzeigen
- Projektion prüfen
- Datenschutzstatus anzeigen

### Input

- Graph
- POI-/Aufenthaltsmodell
- Telco-Load Input
- System-Adjust Datenschutzgrenzen

### Verarbeitung

- Signale räumlich auf Graphobjekte projizieren
- Mindestaggregation prüfen
- Gültigkeitsdauer und Verfallslogik anwenden
- Signale für Aufenthalt, Bewegung oder Staustelle vorbereiten
- Rohwerte aus Ziel-App-Ausgabe ausschließen

### Output

```json
{
  "representation_id": "rep_001",
  "projected_loads": [],
  "valid_signal_groups": [],
  "invalid_signal_groups": [],
  "privacy_status": "valid",
  "status": "loads_projected"
}
```

### Übergabe

An Aufenthalts- und Bewegungslogik.

---

## Panel 11: Aufenthalts- und Bewegungslogik

### Zweck

Signale getrennt als Aufenthalt oder Bewegung bewerten.

### UI

- Button: Auslastung berechnen
- Aufenthaltsbereiche anzeigen
- Bewegungskanten anzeigen
- Werte je Objekt anzeigen

### Input

- Graph
- Aufenthaltsbereiche
- projizierte Load-Signale
- Systemparameter
- regionale Parameter

### Verarbeitung

- Signale innerhalb bestätigter POI-Radien prüfen
- Aufenthaltsdichte berechnen
- Vergleichsdichte angrenzender Bewegungskanten berechnen
- Aufenthalt klassifizieren
- Aufenthalt maskiert Bewegung
- Bewegungsauslastung nur auf nicht maskierten Kanten berechnen
- keine Doppelverwertung derselben Signale

### Output

```json
{
  "representation_id": "rep_001",
  "stay_loads": [],
  "movement_loads": [],
  "masked_edges": [],
  "jam_indicators": [],
  "status": "loads_calculated"
}
```

### Übergabe

An Routenabschnitts-Bewertung.

---

## Panel 12: Routenabschnitts-Bewertung

### Zweck

Bewegungskanten zu routenrelevanten Abschnitten verdichten und bewerten.

### UI

- Liste routenrelevanter Abschnitte
- Bewegungsauslastung je Abschnitt
- berührte Aufenthaltsbereiche
- Status: geeignet, abgewertet, ausgeschlossen

### Input

- Graph
- Bewegungsauslastung
- Aufenthaltsbelastung
- System-Adjust-Grenzen
- regionale Routenparameter
- Ziel-App UI Profil

### Verarbeitung

- Kanten zwischen topologischen Knoten zu Abschnitten zusammenfassen
- durchschnittliche Bewegungsauslastung je Abschnitt berechnen
- angrenzende oder berührte Aufenthaltsbereiche prüfen
- Abschnitt bewerten
- Abschnitt für Routenvorschläge markieren

### Output

```json
{
  "representation_id": "rep_001",
  "route_sections": [
    {
      "id": "section_001",
      "movement_score": 0.42,
      "stay_context_score": 0.75,
      "route_status": "degraded"
    }
  ],
  "status": "route_sections_evaluated"
}
```

### Übergabe

An Layer Composer und Sensus-Core-Paket.

---

## Panel 13: Layer Composer

### Zweck

Aus Engine-Ergebnissen technische und reduzierte Layerpakete erzeugen.

### UI

- Layer-Vorschau
- Ziel-App-Ansicht
- Operator-Ansicht
- Debug-Schalter

### Input

- Boundary
- Graph
- POIs
- Aufenthaltsbereiche
- Bewegungswerte
- Routenbewertungen
- Ziel-App UI Input

### Verarbeitung

- SCIM-Wegelayer erzeugen
- POI-Symbole erzeugen
- Aufenthaltsradien erzeugen
- Bewegungsauslastung einfärben
- degradierte POIs zurückstufen
- Debug-Layer trennen
- Ziel-App-Layer reduzieren

### Output

```json
{
  "representation_id": "rep_001",
  "operator_layers": {},
  "sensus_core_layers": {},
  "debug_layers": {},
  "status": "layers_composed"
}
```

### Übergabe

An Sensus-Core-Ausspielung und Leaflet-Wirkungsprüfung.

---

# D. Sensus-Core- und Endgeräte-Panels

Diese Panels betreffen die SCIM am Endgerät. Sensus Core konsumiert freigegebene SCIM-Ergebnisse und kombiniert sie mit lokalem User Input.

---

## Panel 14: Sensus-Core Package Builder

### Zweck

Ein freigegebenes, endgerätetaugliches SCIM-Paket erzeugen.

### Warum eigenes Panel?

Ja. Sensus Core braucht ein eigenes Übergabepaket, weil am Endgerät nicht alle Operator-, Debug- und Rohdaten verfügbar sein dürfen.

### UI

- Paketversion anzeigen
- enthaltene Layer anzeigen
- ausgeschlossene Debug-/Rohdaten anzeigen
- Ziel-App-Profil anzeigen
- Paket validieren

### Input

- reduzierte Layer aus Panel 13
- Ziel-App UI Input
- System-Adjust Datenschutzgrenzen
- Routenbewertung
- freigegebene Parameterstände

### Verarbeitung

- öffentliche Layer filtern
- Rohdaten entfernen
- Debug-Daten entfernen
- Freigabestatus prüfen
- Paket versionieren
- lokale User-Regler vorbereiten

### Output

```json
{
  "sensus_core_package_id": "scp_001",
  "representation_id": "rep_001",
  "public_layers": {},
  "route_options": [],
  "allowed_user_controls": [],
  "parameter_version": "v1",
  "status": "sensus_core_package_ready"
}
```

### Übergabe

An lokales Sensus-Core-User-Panel.

---

## Panel 15: Lokaler User Input in Sensus Core

### Zweck

Lokale, gerätebezogene Nutzerauswahl auf das freigegebene Sensus-Core-Paket anwenden.

### Warum eigenes Panel?

Ja. Dieser Input findet lokal am Gerät statt und darf nur innerhalb der freigegebenen Ziel-App-Regler wirken.

### UI

- Routentyp wählen
- Auslastungstoleranz wählen
- Darstellungsintensität wählen
- Hinweise/Warnungen aktivieren oder reduzieren

### Input

- Sensus-Core-Paket
- erlaubte User-Regler
- lokale User-Auswahl

### Verarbeitung

- lokale Auswahl gegen erlaubte Regler prüfen
- Routenoptionen filtern oder sortieren
- Darstellung lokal reduzieren oder hervorheben
- keine System- oder Regio-Grenzen überschreiben

### Output

```json
{
  "local_sensus_core_context_id": "lsc_001",
  "selected_route_profile": "low_load_route",
  "effective_tolerances": {},
  "filtered_route_options": [],
  "local_display_layers": {},
  "status": "local_user_context_applied"
}
```

### Übergabe

An Endgeräte-Darstellung.

---

## Panel 16: Endgeräte-Darstellung / Sensus-Core View

### Zweck

Die lokale, reduzierte und nutzergeeignete SCIM-Ausgabe anzeigen.

### UI

- Karte oder Kartenansicht
- freigegebene Layer
- Routenvorschläge
- Hinweise und Warnungen
- keine Rohdaten
- keine Debug-Daten

### Input

- lokaler Sensus-Core-Kontext
- freigegebene Layer
- gefilterte Routenvorschläge

### Verarbeitung

- Layer anzeigen
- Routenvorschläge anzeigen
- POIs und Aufenthaltsradien reduziert darstellen
- Warnungen anzeigen
- Datenschutzschutz einhalten

### Output

```json
{
  "view_state_id": "view_001",
  "visible_layers": {},
  "visible_route_options": [],
  "visible_warnings": [],
  "status": "sensus_core_view_rendered"
}
```

---

# E. Prüf- und Freigabepanels

Diese Panels sichern ab, dass die SCIM korrekt wirkt und nur zulässige Daten ausgespielt werden.

---

## Panel 17: Leaflet-Wirkungsprüfung

### Zweck

Die Wirkung der SCIM-Engine visuell prüfen.

### UI

- Leaflet-Karte
- Boundary sichtbar
- SCIM-Layer sichtbar
- Originalwege ausblenden, abschwächen oder überlagern
- Vergleich: Basemap / SCIM-Ergebnis
- Ziel-App-Vorschau
- Operator-Vorschau

### Input

- Operator-Layer
- Sensus-Core-Layer
- Boundary
- Routenbewertungen

### Verarbeitung

- Layer in Leaflet anzeigen
- Originalwege kontrollieren
- POI-Aufenthaltsradien anzeigen
- degradierte POIs prüfen
- Routenabschnitte prüfen
- Ziel-App-Reduktion prüfen

### Output

```json
{
  "representation_id": "rep_001",
  "visual_check": "passed",
  "issues": [],
  "status": "visual_checked"
}
```

### Übergabe

An Freigabe und Export.

---

## Panel 18: Freigabe und Export

### Zweck

Ein geprüftes SCIM-Ergebnis speichern und für Sensus Core bereitstellen.

### UI

- Zusammenfassung
- Validierungsstatus
- Datenschutzstatus
- Ziel-App-Profil
- Freigeben-Button
- Export-Button

### Input

- geprüfte Layer
- Sensus-Core-Paket
- bewerteter Graph
- Parameterstand
- Visual-Check-Ergebnis

### Verarbeitung

- Ergebnis versionieren
- Parameterstand speichern
- Sensus-Core-Paket freigeben
- Operator-Daten getrennt halten
- Debug-Daten getrennt halten
- nur freigegebene Daten exportieren

### Output

```json
{
  "representation_id": "rep_001",
  "release_id": "release_001",
  "sensus_core_package_id": "scp_001",
  "public_layers": {},
  "operator_layers": {},
  "parameter_version": "v1",
  "status": "released"
}
```

---

# Panel-Entscheidung: Welche Inputs brauchen eigene Panels?

## Eigene Panels zwingend

1. **System-Adjust Input**  
   Weil Systemgrenzen und Datenschutz alle anderen Panels begrenzen.

2. **Regio-Content Input**  
   Weil POI-Freigaben, Radien und regionale Parameter fachlich eigenständig sind.

3. **Ziel-App UI Input**  
   Weil vor dem Ausspielen definiert werden muss, was Sensus Core anzeigen und bedienen darf.

4. **Telco-Load Input**  
   Weil Load-Daten eigene Validierung, Aggregation, Gültigkeit und Datenschutzprüfung brauchen.

5. **Lokaler User Input in Sensus Core**  
   Weil dieser Input am Gerät stattfindet und erst auf das freigegebene Sensus-Core-Paket angewendet werden darf.

## Kein eigenes Engine-Panel nötig

Die konkreten Buttons einzelner UIs gehören nicht in die rechnerische Engine. Sie gehören in die jeweiligen Input- oder View-Panels und erzeugen nur definierte Inputs.

---

# Empfohlene Bau-Reihenfolge für Codex/Claude

1. Panel 1: System-Adjust Input mit Schema und Validator
2. Panel 2: Regio-Content Input mit POI-/Radius-Schema
3. Panel 5: Boundary-Zeichnung in Leaflet
4. Panel 6: Daten-Extraktion mit Dummy-Daten
5. Panel 7: SCIM-Kontext-Validator
6. Panel 8: Graph Builder
7. Panel 13: Layer Composer mit einfachem GeoJSON-Output
8. Panel 17: Leaflet-Wirkungsprüfung
9. Panel 4: Telco-Load Input
10. Panel 9: POI- und Aufenthaltsmodell
11. Panel 10: Load Processor
12. Panel 11: Aufenthalts- und Bewegungslogik
13. Panel 12: Routenabschnitts-Bewertung
14. Panel 3: Ziel-App UI Input
15. Panel 14: Sensus-Core Package Builder
16. Panel 15: Lokaler User Input in Sensus Core
17. Panel 16: Endgeräte-Darstellung
18. Panel 18: Freigabe und Export

Diese Reihenfolge baut zuerst die tragende Datenpipeline und erst danach die volle Endgeräte-Logik.

---

# Gemeinsamer SCIM-Kontext

Alle Panels arbeiten auf einem gemeinsamen Kontext, füllen aber jeweils nur ihren Teil.

```json
{
  "representation_id": "rep_001",
  "system_adjust": {},
  "regio_content": {},
  "target_app_ui": {},
  "telco_load": {},
  "boundary": {},
  "extracted_data": {},
  "scim_context": {},
  "graph": {},
  "poi_model": {},
  "load_model": {},
  "route_model": {},
  "layer_model": {},
  "sensus_core_package": {},
  "local_user_context": {},
  "view_state": {},
  "release": {},
  "status": "..."
}
```

---

# Architekturentscheid

> SCIM umfasst Inputs, Validierung, Engine, Layer-Erzeugung, Sensus-Core-Paketierung, lokale User-Anwendung und Freigabe.  
> Die SCIM-Engine ist der rechnerische Kern.  
> Sensus Core ist die SCIM am Endgerät.  
> Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug, aber nicht der Engine-Kern.

---

# Bau- und Übergabestrategie

## Grundentscheidung

Die Panels sollen nicht erst ganz am Ende miteinander verbunden werden. Das wäre riskant, weil Schnittstellenfehler, Datenmodellfehler und falsche Annahmen erst sehr spät sichtbar würden.

Besser ist eine gestufte Arbeitsweise:

1. Panels fachlich einzeln spezifizieren.
2. Panels technisch einzeln baubar halten.
3. Panels in kleinen Arbeitsblöcken nacheinander integrieren.
4. Nach jedem Block ein lauffähiges Zwischenresultat erzeugen.
5. Erst am Ende die vollständige SCIM-Kette verbinden.

Leitsatz:

> Einzelne Panels brauchen klare Schnittstellen. Arbeitsblöcke brauchen lauffähige Mini-Pipelines.

---

## Wann ein Panel einzeln gebaut werden soll

Ein Panel wird einzeln gebaut, wenn es eine eigenständige Datenquelle, Validierung oder UI-Logik hat.

Einzelbau ist sinnvoll bei:

- System-Adjust Input
- Regio-Content Input
- Ziel-App UI Input
- Telco-Load Input
- Representation-Boundary
- Lokaler User Input in Sensus Core

Grund:

Diese Panels erzeugen jeweils eigene Input- oder Konfigurationsobjekte. Sie müssen auch ohne die gesamte Engine testbar sein.

---

## Wann mehrere Panels als Arbeitsblock gebaut werden sollen

Mehrere Panels sollen gemeinsam gebaut werden, wenn ihr Nutzen erst durch die Weitergabe an das nächste Panel sichtbar wird.

Blockbau ist sinnvoll bei:

- Boundary + Daten-Extraktion
- Daten-Extraktion + Graph Builder
- Graph Builder + Layer Composer
- POI-Modell + Load Processor + Aufenthalts-/Bewegungslogik
- Routenbewertung + Sensus-Core-Package
- Sensus-Core-Package + lokaler User Input + Endgeräte-View

Grund:

Diese Panels bilden Verarbeitungsketten. Ein einzelnes Panel ohne Nachfolgepanel liefert sonst nur ein abstraktes JSON ohne überprüfbare Wirkung.

---

# Empfohlene Arbeitsblöcke

## Block 0: Gemeinsames Fundament

### Zweck

Vor allen Panels ein gemeinsames technisches und fachliches Fundament schaffen.

### Enthält

- gemeinsames Datenmodell
- gemeinsame Type-/Schema-Definitionen
- Statusmodell
- Fehler- und Warnmodell
- Versionierungsmodell
- Mock-Datenstruktur
- gemeinsamer SCIM-Kontext

### Ergebnis

```json
{
  "schemas": {},
  "status_model": {},
  "error_model": {},
  "mock_context": {},
  "status": "foundation_ready"
}
```

### Warum zuerst?

Ohne gemeinsames Fundament bauen Codex oder Claude jedes Panel mit eigenen Annahmen. Dann passen die Outputs später nicht zusammen.

---

## Block 1: System- und Regio-Inputs

### Panels

- Panel 1: System-Adjust Input
- Panel 2: Regio-Content Input

### Zweck

Systemgrenzen und regionale Inhalte separat laden, validieren und zusammen prüfbar machen.

### Ergebnis

```json
{
  "system_adjust": {},
  "regio_content": {},
  "input_validation": {},
  "status": "system_regio_inputs_ready"
}
```

### Akzeptanzkriterium

Regio-Content darf keine Werte enthalten, die System-Adjust-Grenzen unterschreiten.

---

## Block 2: Boundary und Extraktion

### Panels

- Panel 5: Representation-Boundary
- Panel 6: Daten-Extraktion

### Zweck

Eine Boundary zeichnen oder importieren und daraus ein erstes Extraktionspaket erzeugen.

### Ergebnis

```json
{
  "boundary": {},
  "extracted_data": {
    "ways": [],
    "poi_candidates": [],
    "approved_pois": [],
    "boundary_connections": []
  },
  "status": "boundary_extraction_ready"
}
```

### Akzeptanzkriterium

Aus einer Boundary entsteht reproduzierbar ein Datenpaket mit Wegen, POIs und Randanschlüssen.

---

## Block 3: Minimaler Graph und erste Darstellung

### Panels

- Panel 7: SCIM-Kontext-Validator
- Panel 8: Graph Builder
- Panel 13: Layer Composer
- Panel 17: Leaflet-Wirkungsprüfung

### Zweck

Die erste sichtbare Mini-Pipeline bauen: aus Daten wird ein Graph, aus dem Graph wird ein Layer, der Layer wird in Leaflet geprüft.

### Ergebnis

```json
{
  "scim_context": {},
  "graph": {},
  "basic_layers": {},
  "visual_check": {},
  "status": "minimal_pipeline_visible"
}
```

### Akzeptanzkriterium

Ein extrahierter Weg wird als SCIM-Layer sichtbar, auch wenn noch keine Auslastungslogik aktiv ist.

---

## Block 4: POI- und Aufenthaltslogik

### Panels

- Panel 9: POI- und Aufenthaltsmodell
- Panel 10: Load Processor
- Panel 11: Aufenthalts- und Bewegungslogik

### Zweck

POIs, Radien, Telco-Load und Maskierung zusammenführen.

### Ergebnis

```json
{
  "poi_model": {},
  "projected_loads": {},
  "stay_loads": [],
  "movement_loads": [],
  "masked_edges": [],
  "status": "load_logic_ready"
}
```

### Akzeptanzkriterium

Ein freigegebener POI mit Radius kann Aufenthaltslast erzeugen, und betroffene Kanten werden gegen Bewegungsauslastung maskiert.

---

## Block 5: Routenbewertung

### Panels

- Panel 12: Routenabschnitts-Bewertung
- Panel 13: Layer Composer erweitern
- Panel 17: Leaflet-Wirkungsprüfung erweitern

### Zweck

Routenrelevante Abschnitte bewerten und sichtbar machen.

### Ergebnis

```json
{
  "route_model": {},
  "route_layers": {},
  "visual_check": {},
  "status": "route_evaluation_ready"
}
```

### Akzeptanzkriterium

Ein Abschnitt kann geeignet, abgewertet oder ausgeschlossen sein, ohne dass seine reine Auslastungsdarstellung verschwindet.

---

## Block 6: Ziel-App UI und Sensus-Core-Paket

### Panels

- Panel 3: Ziel-App UI Input
- Panel 14: Sensus-Core Package Builder

### Zweck

Aus den technischen SCIM-Ergebnissen ein reduziertes, endgerätetaugliches Sensus-Core-Paket erzeugen.

### Ergebnis

```json
{
  "target_app_ui": {},
  "sensus_core_package": {},
  "status": "sensus_core_package_ready"
}
```

### Akzeptanzkriterium

Das Paket enthält keine Rohdaten, keine Debug-Daten und nur freigegebene Layer und Regler.

---

## Block 7: Lokale Anwendung am Endgerät

### Panels

- Panel 15: Lokaler User Input in Sensus Core
- Panel 16: Endgeräte-Darstellung / Sensus-Core View

### Zweck

Lokale User-Auswahl auf das freigegebene Sensus-Core-Paket anwenden.

### Ergebnis

```json
{
  "local_user_context": {},
  "view_state": {},
  "status": "local_sensus_core_view_ready"
}
```

### Akzeptanzkriterium

Der User kann lokal einen erlaubten Routentyp oder eine erlaubte Toleranz wählen, ohne System- oder Regio-Grenzen zu überschreiben.

---

## Block 8: Freigabe und Export

### Panels

- Panel 18: Freigabe und Export

### Zweck

Geprüfte Ergebnisse versionieren und ausspielen.

### Ergebnis

```json
{
  "release": {},
  "public_layers": {},
  "operator_layers": {},
  "status": "released"
}
```

### Akzeptanzkriterium

Nur validierte und freigegebene Sensus-Core-Pakete werden ausgespielt.

---

# Welche Information braucht jedes Panel?

## Generelle Vorinformation für jedes Panel

Jeder Codex-/Claude-Auftrag muss immer diese gemeinsame Vorinformation enthalten:

1. **SCIM-Systemgrenze**  
   SCIM umfasst Inputs, Engine, Layer-Erzeugung, Sensus-Core-Paketierung, lokale Anwendung und Freigabe.

2. **Rollenklärung**  
   Leaflet ist Zeichen-, Prüf- und Darstellungswerkzeug. Die Engine rechnet unabhängig von Leaflet. Sensus Core ist die SCIM am Endgerät.

3. **Gemeinsamer Kontext**  
   Alle Panels lesen und schreiben in einen gemeinsamen SCIM-Kontext, aber jedes Panel verändert nur seinen eigenen Bereich.

4. **Input-/Output-Prinzip**  
   Jedes Panel hat ein klares Input-Schema, Output-Schema, Statusfeld, Fehlerfeld und Warnfeld.

5. **Datenschutzgrenze**  
   Rohsignale, Einzelsignale und Debug-Daten dürfen nicht in Sensus-Core-User-Ausgaben gelangen.

6. **System-Adjust-Vorrang**  
   Kein Panel darf System-Adjust-Grenzen unterschreiten.

7. **Regio-Content-Freigabe**  
   POIs werden erst durch regionale Freigabe und bestätigten Radius aufenthaltsrelevant.

8. **Trennung von Darstellung und Bewertung**  
   Sichtbarkeit eines Abschnitts und seine Routeneignung sind getrennte Zustände.

---

## Konkrete Anweisungen für jedes Panel

Jeder Panel-Auftrag soll mindestens diese Angaben enthalten:

1. **Panel-Name**
2. **Zweck des Panels**
3. **Nicht-Ziele**
4. **Input-Schema**
5. **Output-Schema**
6. **Validierungsregeln**
7. **Statuswerte**
8. **Fehler- und Warnfälle**
9. **UI-Anforderungen, falls vorhanden**
10. **Mock-Daten**
11. **Akzeptanzkriterien**
12. **Übergabe an nächstes Panel**
13. **Tests**

---

# Standard-Prompt-Vorlage für ein einzelnes Panel

```text
Baue Panel [NAME] für die SCIM.

Kontext:
SCIM ist ein Gesamtsystem aus Input-Schicht, SCIM-Engine, Layer-Erzeugung, Sensus-Core-Paketierung, lokaler User-Anwendung und Freigabe. Sensus Core ist die SCIM am Endgerät. Leaflet ist nur Zeichen-, Prüf- und Darstellungswerkzeug, nicht der Engine-Kern.

Aufgabe:
Baue nur dieses Panel. Verändere keine anderen Panel-Bereiche außer den ausdrücklich genannten Schnittstellen.

Zweck:
[Zweck]

Input:
[Input-Schema]

Output:
[Output-Schema]

Validierung:
[Regeln]

UI:
[UI-Anforderungen oder „keine UI, nur Funktion/Service“]

Statuswerte:
[Liste]

Fehler/Warnungen:
[Liste]

Mock-Daten:
[Beispiel]

Akzeptanzkriterien:
[prüfbare Kriterien]

Übergabe:
Das Panel muss sein Ergebnis so ausgeben, dass Panel [NÄCHSTES PANEL] es ohne weitere Interpretation verwenden kann.
```

---

# Standard-Prompt-Vorlage für einen Panel-Block

```text
Baue Arbeitsblock [NAME] für die SCIM.

Kontext:
SCIM besteht aus baubaren Panels mit klaren JSON-Schnittstellen. Der Block soll mehrere Panels zu einer lauffähigen Mini-Pipeline verbinden. Die Panels müssen einzeln testbar bleiben, aber der Block muss ein sichtbares oder prüfbares Gesamtergebnis erzeugen.

Enthaltene Panels:
- [Panel A]
- [Panel B]
- [Panel C]

Block-Ziel:
[Ziel]

Gemeinsamer Input:
[Input]

Zwischenoutputs:
[Output je Panel]

Finaler Output:
[Block-Ergebnis]

Integrationsregeln:
- Kein Panel darf fremde Kontextbereiche überschreiben.
- Jeder Übergabeschritt muss validiert werden.
- Fehler müssen dem erzeugenden Panel zugeordnet bleiben.
- Der Block muss mit Mock-Daten lauffähig sein.

Akzeptanzkriterien:
[prüfbare Kriterien]

Tests:
- Unit-Tests je Panel
- Integrationstest über den gesamten Block
- Mock-Daten-Test
- Fehlerfall-Test
```

---

# Praktische Empfehlung

Nicht alle Panels erst isoliert bauen und ganz am Ende verbinden.

Stattdessen:

1. **Schemas und Kontext zuerst.**
2. **Input-Panels einzeln bauen.**
3. **Verarbeitungspanels in kleinen Blöcken bauen.**
4. **Nach jedem Block ein sichtbares oder prüfbares Ergebnis erzeugen.**
5. **Endgeräte- und Freigabelogik erst nach stabiler Engine-Pipeline bauen.**

So bleibt jedes Panel codierbar, aber die SCIM wächst trotzdem als zusammenhängendes System.

---

# Panel einzeln bauen oder Block-Panel mit Tabs?

## Entscheidung

Fachlich und technisch sollen die Panels **einzeln als Module** gebaut werden. In der UI können mehrere zusammengehörige Panels aber als **ein Arbeitsblock-Panel mit Tabs oder Steps** erscheinen.

Leitsatz:

> Technisch einzelne Module. Bedienseitig zusammengefasste Arbeitsblöcke.

---

## Warum nicht alles als einzelne sichtbare Panels?

Zu viele einzelne sichtbare Panels machen die Bedienung schwer und fragmentieren den Workflow.

Nachteile:

- zu viele UI-Wechsel
- unklare Reihenfolge
- Nutzer verliert Überblick
- Zwischenoutputs wirken technisch und abstrakt
- Integration wird schwer prüfbar

Einzelne sichtbare Panels sind nur sinnvoll, wenn sie eine eigenständige Quelle oder Verantwortung haben.

---

## Warum nicht je Block nur ein einziges großes Panel?

Ein einziges großes Block-Panel ohne interne Modultrennung wäre technisch riskant.

Nachteile:

- schwer testbar
- schwer wartbar
- unklare Schnittstellen
- spätere Wiederverwendung einzelner Logiken schwierig
- Fehler schwer einem Verarbeitungsschritt zuzuordnen

Deshalb darf ein Block-Panel nicht monolithisch gebaut werden.

---

## Beste Bauform

Ein Arbeitsblock wird als **Container-Panel** gebaut.

Dieses Container-Panel enthält mehrere Tabs, Steps oder Subpanels.

Jeder Tab entspricht weiterhin einem fachlichen Modul mit eigenem Input, Output, Status und Fehlern.

Beispiel:

```text
Arbeitsblock: Boundary und Extraktion

Container-Panel:
- Tab 1: Boundary zeichnen
- Tab 2: Puffer prüfen
- Tab 3: Daten extrahieren
- Tab 4: Extraktionsergebnis prüfen
```

Technisch bleiben Boundary und Extraktion getrennte Module. Bedienseitig erscheinen sie als ein zusammenhängender Arbeitsblock.

---

# Welche Panels sollten einzeln sichtbar bleiben?

## Eigenständige Input-Panels

Diese sollten eher eigene sichtbare Panels bleiben:

1. System-Adjust Input
2. Regio-Content Input
3. Ziel-App UI Input
4. Telco-Load Input

Grund:

Sie haben eigene Quellen, eigene Versionierung und eigene Validierung.

---

## Eigenständige Endgeräte-Panels

Diese sollten ebenfalls eher eigene sichtbare Panels bleiben:

1. Sensus-Core Package Builder
2. Lokaler User Input in Sensus Core
3. Endgeräte-Darstellung / Sensus-Core View
4. Freigabe und Export

Grund:

Hier ändern sich Verantwortlichkeit, Datenzugriff und Zielgruppe.

---

# Welche Panels sollten als Block-Panel mit Tabs gebaut werden?

## Block-Panel 1: Boundary und Extraktion

Enthält:

- Representation-Boundary
- Daten-Extraktion

Tabs:

1. Boundary
2. Puffer
3. Extraktion
4. Extraktionsergebnis

Output:

```json
{
  "boundary": {},
  "extracted_data": {},
  "status": "boundary_extraction_ready"
}
```

---

## Block-Panel 2: Graph und Basislayer

Enthält:

- SCIM-Kontext-Validator
- Graph Builder
- Layer Composer Basisfunktion
- Leaflet-Wirkungsprüfung Basisfunktion

Tabs:

1. Kontextprüfung
2. Graph
3. Basislayer
4. Leaflet-Prüfung

Output:

```json
{
  "scim_context": {},
  "graph": {},
  "basic_layers": {},
  "visual_check": {},
  "status": "minimal_pipeline_visible"
}
```

---

## Block-Panel 3: POI, Load und Bewegung

Enthält:

- POI- und Aufenthaltsmodell
- Load Processor
- Aufenthalts- und Bewegungslogik

Tabs:

1. POIs und Radien
2. Load-Projektion
3. Aufenthalt
4. Bewegung
5. Maskierung

Output:

```json
{
  "poi_model": {},
  "projected_loads": {},
  "stay_loads": [],
  "movement_loads": [],
  "masked_edges": [],
  "status": "load_logic_ready"
}
```

---

## Block-Panel 4: Routenbewertung und Darstellung

Enthält:

- Routenabschnitts-Bewertung
- Layer Composer Erweiterung
- Leaflet-Wirkungsprüfung Erweiterung

Tabs:

1. Abschnitte
2. Bewertung
3. Routendarstellung
4. Vergleich in Leaflet

Output:

```json
{
  "route_model": {},
  "route_layers": {},
  "visual_check": {},
  "status": "route_evaluation_ready"
}
```

---

## Block-Panel 5: Sensus Core lokal

Enthält:

- Lokaler User Input in Sensus Core
- Endgeräte-Darstellung / Sensus-Core View

Tabs:

1. Lokale Auswahl
2. Routenvorschläge
3. Kartenansicht
4. Hinweise/Warnungen

Output:

```json
{
  "local_user_context": {},
  "view_state": {},
  "status": "local_sensus_core_view_ready"
}
```

---

# Technische Modulregel für Block-Panels

Auch wenn ein Block als ein UI-Panel mit Tabs gebaut wird, müssen die Submodule technisch getrennt bleiben.

Jedes Submodul braucht:

- eigene Funktion oder Service-Klasse
- eigenes Input-Schema
- eigenes Output-Schema
- eigene Validierung
- eigene Statuswerte
- eigene Fehler/Warnungen
- eigene Tests

Der Container darf nur orchestrieren.

Der Container darf nicht die Fachlogik enthalten.

---

# UI-Regel für Block-Panels

Ein Block-Panel sollte dem User nur die relevanten Entscheidungen zeigen.

Technische Zwischenoutputs sollen sichtbar sein, aber nicht dominieren.

Gute UI-Struktur:

- oben: Blockstatus
- links oder oben: Tabs/Steps
- Mitte: aktuelle Aufgabe
- rechts/unten: Ergebnis und Validierung
- Footer: Weitergabe an nächsten Block

---

# Endgültige Empfehlung

Die Panels werden **technisch einzeln** gebaut, aber **produktseitig blockweise** als Tabs oder Steps angezeigt.

Also nicht:

> 18 getrennte große UI-Panels.

Und auch nicht:

> 5 monolithische Block-Panels ohne interne Schnittstellen.

Sondern:

> 18 fachliche Module, organisiert in ungefähr 8 baubare Arbeitsblöcke, von denen einige als ein UI-Panel mit Tabs erscheinen.

Das ist für Codex/Claude am stabilsten, weil jedes Modul klare Schnittstellen hat, aber jeder Arbeitsblock ein prüfbares Zwischenresultat liefert.

---

# Wann Tabs bauen?

## Grundsatz

Die Zusammenfassung mehrerer Panels in Tabs oder Steps kann **spät im Coding** erfolgen, aber nicht völlig unvorbereitet.

Die Module müssen von Anfang an so gebaut werden, dass sie später in ein Container-Panel eingefügt werden können.

Leitsatz:

> Erst Module und Schnittstellen stabil bauen. Danach UI-Container mit Tabs/Steps darüberlegen.

---

## Was darf bis zum Schluss warten?

Folgende Dinge können relativ spät erfolgen:

- finale Tab-Navigation
- endgültige Stepper-Logik
- Layout des Container-Panels
- visuelle Gruppierung mehrerer Module
- finale Bedienreihenfolge im UI
- kosmetische Übergänge zwischen Tabs
- gemeinsame Block-Header und Block-Footer

Diese Dinge betreffen hauptsächlich Produkt- und Bedienoberfläche.

---

## Was darf nicht bis zum Schluss warten?

Folgende Dinge müssen von Anfang an sauber angelegt sein:

- gemeinsamer SCIM-Kontext
- stabile Input-/Output-Schemas je Modul
- eindeutige Statuswerte je Modul
- Fehler- und Warnmodell
- Modulgrenzen
- Übergabeformate zwischen Modulen
- Validierungsregeln
- Testbarkeit jedes Moduls
- keine Fachlogik im späteren Tab-Container

Wenn diese Grundlagen fehlen, wird die spätere Tab-Zusammenfassung schwierig oder erzeugt Nacharbeit.

---

## Praktischer Coding-Ablauf

### Phase 1: Headless Module

Zuerst werden die Module möglichst unabhängig von der finalen UI gebaut.

Beispiel:

- `validateSystemAdjust()`
- `loadRegioContent()`
- `createBoundaryContext()`
- `extractRepresentationData()`
- `buildGraph()`
- `composeLayers()`

Ziel:

> Jedes Modul funktioniert mit Mock-Daten und erzeugt sein eigenes Output-Objekt.

---

### Phase 2: einfache Einzel-Views

Danach bekommt jedes Modul eine einfache Test- oder Admin-View.

Diese Views müssen noch nicht schön sein.

Ziel:

> Inputs eingeben, Modul ausführen, Output prüfen.

---

### Phase 3: Mini-Pipelines

Dann werden zusammengehörige Module in kleinen Arbeitsblöcken verbunden.

Beispiel:

```text
Boundary → Extraktion → Graph → Basislayer
```

Ziel:

> Der Output eines Moduls wird real vom nächsten Modul verwendet.

---

### Phase 4: Container-Panels mit Tabs/Steps

Erst danach werden die UI-Container gebaut.

Beispiel:

```text
Container: Graph und Basislayer
Tabs:
1. Kontextprüfung
2. Graph
3. Basislayer
4. Leaflet-Prüfung
```

Ziel:

> Bestehende Module werden nur noch produktseitig gruppiert.

---

### Phase 5: finale UX-Glättung

Zum Schluss folgen:

- Tab-Reihenfolge
- Labels
- reduzierte Anzeigen
- Fortschrittslogik
- Sperrlogik bei ungültigen Vorstufen
- bessere Fehlertexte
- produktionsnahe Bedienung

---

# Codierregel für spätere Tabs

Jedes Modul muss von Anfang an drei Nutzungsarten unterstützen:

1. **Headless** als reine Funktion oder Service
2. **Standalone** als einfache Einzelansicht
3. **Embedded** als Tab oder Step in einem Container-Panel

Dafür darf das Modul nicht direkt von seinem späteren Container abhängen.

Gute Regel:

> Ein Modul kennt seinen Input und seinen Output, aber nicht den Tab, in dem es später angezeigt wird.

---

# Antwort auf die Baufrage

Ja: Die finale Zusammenfassung in Tabs kann am Schluss des Codings erfolgen.

Aber: Die Module müssen vorher so gebaut werden, dass sie tabfähig sind.

Das bedeutet:

- keine verdeckte Abhängigkeit vom UI-Container
- keine Logik im Tab-Wrapper
- klare Props oder Input-Objekte
- klare Output-Callbacks oder Output-Objekte
- Status und Fehler je Modul getrennt
- gemeinsamer SCIM-Kontext als verbindende Struktur

So bleibt die Entwicklung stabil: erst rechnen, dann prüfen, dann gruppieren, dann polieren.

