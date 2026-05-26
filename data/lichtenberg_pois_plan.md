# Lichtenberg POI-Plan v1
**Stand:** 2026-05-26  ·  **10 POIs**  ·  ✓ 10 · ≈ 0 · ❓ 0

Operator-Kategorien (nicht OSM-Kategorien). Coord-Status:
**✓** aus OSM/bestätigt · **≈** abgeleitet/geschätzt · **❓** fehlt

---

## Tabelle 1 · POI-Liste

### Points_historical

| Icon | Tagline | Description | Coord | Cluster | Status |
|---|---|---|---|---|---|
| bildstock | Schönangerer |  | 14.24776, 48.40144 | — | ✓ |
| bildstock | Rotes Kreuz |  | 14.25170, 48.39183 | — | ✓ |

### Points_others

| Icon | Tagline | Description | Coord | Cluster | Status |
|---|---|---|---|---|---|
| sendemast | Sender | UKW/DAB/TV-Sender 155 m hoch (seit 1960) | 14.25456, 48.38468 | Lichtenberg | ✓ |

### Square_Rest

| Icon | Tagline | Description | Coord | Cluster | Status |
|---|---|---|---|---|---|
| aussichtswarte+ | Giselawarte 927 m | Steinblock-Aussichtswarte von 1857, 17,5 m hoch | 14.25444, 48.38528 | Lichtenberg *(Cluster-Icon)* | ✓ |
| fernglas | Kogl |  | 14.23873, 48.38005 | — | ✓ |

### Regenerate_Substanze

| Icon | Tagline | Description | Coord | Cluster | Status |
|---|---|---|---|---|---|
| besteck | zur Gis | Jausenstation seit 1702 am Gipfel | 14.25618, 48.38306 | Lichtenberg | ✓ |
| besteck | Eidenberger | Ausflugsgasthaus mit Tiroler Almhütte | 14.23322, 48.39395 | — | ✓ |

### Regenerate_Water

| Icon | Tagline | Description | Coord | Cluster | Status |
|---|---|---|---|---|---|
| gewaesser | Pollack-Quelle | Trinkwasserquelle am Berg | 14.25894, 48.38246 | Lichtenberg | ✓ |

### Service_Sleep

| Icon | Tagline | Description | Coord | Cluster | Status |
|---|---|---|---|---|---|
| hotel | Lamahof | Bauernhof-Unterkunft mit Lamas | 14.23562, 48.40182 | — | ✓ |

### Service_Others

| Icon | Tagline | Description | Coord | Cluster | Status |
|---|---|---|---|---|---|
| werkstatt | Kranzler ab Hof | Ab-Hof-Verkauf | 14.25954, 48.37282 | — | ✓ |

---

## Tabelle 2 · Kategorien-Übersicht

| Bucket | Subkategorie | verwendete Icons |
|---|---|---|
| Points | Points_historical | bildstock |
| Points | Points_others | sendemast |
| Squares | Square_Rest | aussichtswarte · fernglas |
| Squares | Square_Move | — |
| Regenerate | Regenerate_Substanze | besteck |
| Regenerate | Regenerate_Water | gewaesser |
| Transport | Transport_Vehicle | — |
| Transport | Transport_Parking/(Charging) | — |
| Service | Service_Sleep | hotel |
| Service | Service_Others | werkstatt |
| Help | Help_order | — |
| Help | Help_emergency | — |

**5 belegte Buckets · 7 belegte Subkategorien · 7 verwendete Icons**

---

## Tabelle 3 · Container-System (Geometrie + Farbe)

| Bucket | Subkategorie | Geometrie | Farbe | Bezeichnung / Was lebt dort |
|---|---|---|---|---|
| Points | Points_historical | Kreis | gelb | Bildstock · Bauwerk · Denkmal · Burg · Schloss · Arena |
| Points | Points_others | Kreis | gelb-grün | Wasser · Brücke · Botanik · Brunnen · Kirche · Wasserfall · Sendemast |
| Squares | Square_Rest | Quadrat | oliv-grün | Aussicht · Rast · überdachte Rast (passiv) |
| Squares | Square_Move | Quadrat | hell-grün | Spielplatz · Sport · Attraktion · Aussichtsturm (aktiv) |
| Regenerate | Regenerate_Substanze | Tropfen | hell-blau | Geschäft · Imbiss · Gasthaus · Restaurant · Bar |
| Regenerate | Regenerate_Water | Tropfen | dunkel-blau | Trinkwasser · Klo · See · Hallenbad · Badeplatz |
| Transport | Transport_Vehicle | Rechteck hoch | hell-grau | Bergbahn · Schiff · Bus · Bahn |
| Transport | Transport_Parking/(Charging) | Rechteck hoch | dunkel-grau | Parkplatz · Ladestation |
| Service | Service_Sleep | Rechteck breit *(Scheckkarte)* | gold | Zelt · Pension · Hotel · Kurhotel |
| Service | Service_Others | Rechteck breit *(Scheckkarte)* | gold | Mechaniker · Sportgeschäft · Apotheke* |
| Help | Help_order | Dreieck | dunkel-orange | Sperre · Governance-Hinweis |
| Help | Help_emergency | Dreieck | rot-orange | Apotheke · Arzt · Notruf |
| Cluster | Cluster *(meta)* | Hexagon-Ring | magenta | Vereinigung mehrerer POIs |

**Konventionen** (regionsübergreifend, siehe ann_042)
- Geometrie + Farbe = **Container**
- Schwarzes Stroke / weißes Fill = **Symbol-Stil** im Container
- Service: Sub-Differenzierung allein durch das Innensymbol
- Cluster: keine Sub (magenta einheitlich)
- Hexagon-Ring: transparent als unsichtbarer Cluster-Ring · opaque als vereinigtes Cluster-POI beim Herauszoomen

---

## Cluster

### Lichtenberg *(4 POIs)*
**Hover:** „Lichtenberg-Gipfel mit Sender, Giselawarte und Gasthaus"

aussichtswarte+ Giselawarte 927 m *(Cluster-Icon)* · sendemast Sender · besteck zur Gis · gewaesser Pollack-Quelle

---

## Notiz · Künftige Cluster-Identitäts-Umstellung (TODO Phase 1, ann_050)

Heutige Konfiguration: die **Giselawarte**-POI trägt das Cluster-Icon (Backward-Compat-Modus aus ann_048).

Sobald Phase 1 der Ziel-App-Roadmap gebaut ist (Ghost-Cluster-POI im Editor):
- Giselawarte verliert das Cluster-Icon-Flag (wird normale Mitglied-POI)
- Neue **Ghost-POI „Gipfel"** in der Cluster-Subkategorie anlegen
- Parent des Ghosts: Giselawarte (erbt deren Coord)
- Ghost-Icon: **`fernglas+`** mit Höhe 927 (Aussichts-Marker auf Berg)

Begründung: der geografische Gipfel liegt im Wald, Aussicht gibt's nur über die Warte. Der Ghost trennt physisches Wahrzeichen (Warte) von semantischer Cluster-Identität (Gipfel).

---

## Notiz · MVP-Charakterisierung

Diese Plan-md folgt der MVP-Variante aus `docs/howto_region_catalog.md`:
- Schreibtisch-Recherche ohne Vor-Ort-Besuch
- Cross-referenziert über OSM + Wikipedia + Outdooractive/Alpenvereinaktiv
- Nur 10 POIs (Demo-Umfang)
- Nur Tagline + Description short gepflegt
- Eine Cluster-Bildung (Lichtenberg-Gipfel)
- Bestehende Subkategorien wiederverwendet

Quellen: OSM Overpass-API, Wikipedia (Lichtenberg/Eidenberg), Outdooractive, Alpenvereinaktiv.
