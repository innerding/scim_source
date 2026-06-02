# Runtime MVP — UX-Flow der Ziel-App

Stand: 2026-05-27 · Session-Konsens Operator + KI

---

## Worum geht es

Die SCIM-Operator-Werkbank (Geo + Cat + Thresholds → Representation) bedient
am Ende eine **Ziel-App**, die dem Endnutzer im Gelände begegnet. Diese Doku
beschreibt den **minimal nötigen UX-Flow** dieser Ziel-App — also: was muss
funktionieren, damit *„sich was bewegt"*. Mit klarer Trennung zwischen MVP-
Kern (Pflicht) und Bonus-Demo (das „haben-gewonnen"-Erlebnis).

Im Pipeline-Modell entspricht das den Panels **R01 Runtime Shell · R06 BCK/BAK ·
R07 Karte & Guidance**. Heute sind das Stub-Panels — diese Doku spezifiziert
ihr UX-Soll.

---

## Was IST heute schon da (wiederverwendbar)

- **Geometrie-Daten** als GeoJSON (`data/geometries/*.json`) — committed
- **POI-Katalog** mit Coords + Subkategorie + Cluster (`data/<region>_pois_plan.md`)
- **Representation** als Manifest (Geo + Cat verknüpft, heute ohne Konsument)
- **Karten-Renderer** Leaflet mit Heat-Pipe-Colour-Mesh entlang echter OSM-Wege
  (`src/scim/ui/colourMeshOverlay.ts`)
- **POI-Marker** mit Load-Klassen-Farbe
- **Overpass-Cache** für OSM-Wegegeometrien (24h pro bbox)

**Es fehlt** für die Ziel-App: URL-Routing, Representation-Konsument,
Route-Computation durch POIs, Position-Tracking, Guidance-UI, Load-Simulation,
BAK-Logik.

---

## MVP-Kern: „sich bewegt"

### Schritt-für-Schritt-Flow

**1. Eintritt: `scim3.diesenpark.com/<region>/<r-name>`**
- Cloudflare-SPA-Fallback (`_redirects`) routet alle unbekannten Pfade an
  `/index.html`
- URL-Parser liest pathname, matcht gegen `data/representations/*.json`,
  setzt aktive R im RepresentationContext
- Falls keine Match: Landing mit Auswahl-Liste aller R's

**2. Karte erscheint**
- Map fittet auf `activeRep.geometry`-Bounds
- Base-Tile `dark_nolabels` (CartoDB)
- Boundary als zarter Outline
- Colour-Mesh: OSM-Wege via Overpass für die R-bbox, Per-Edge-Heat-Gradient
- POIs aus `activeRep.catalog_id` als Marker (gefüllter Kreis mit Container-
  Geometrie + Bucket-Farbe)

**3. POI antippen → Wishlist**
- Tap auf POI öffnet kleine Karte: Name, Tagline, Subcategory, „+ Zur Tour"
- Wishlist-Bottom-Sheet zeigt gewählte POIs in Reihenfolge der Auswahl
- Drag-Reorder optional (für MVP nicht zwingend)

**4. „Route bauen" (ab ≥ 2 POIs)**
- Button im Wishlist-Sheet aktiv ab 2 POIs
- Route-Computation: kürzester Pfad durch die OSM-Edges, der die POIs in
  Reihenfolge verbindet (einfach: A* oder Dijkstra auf der schon
  gecachten Edge-Liste)
- Ergebnis: Polyline mit weißem Glow + farbiger Hauptlinie (gleiche Optik
  wie POI-Routen heute, nur länger und auf echten Wegen)
- Route-Stats: Gesamtlänge, geschätzte Dauer, Anzahl POIs

**5. „Los geht's"**
- Karten-Modus wechselt: Route bleibt zentral, Mesh-Hintergrund leiser
- Aktuelle Position als Marker (Pfeil mit Richtung)
- **Cheaten erlaubt:** keine echte Geolocation nötig — Marker startet am
  ersten POI und bewegt sich entweder
  - automatisch (Time-Slider) oder
  - per Tap auf die Karte (Position springt zum nächsten Wegpunkt)
- Next-Stop-Card oben: „Nächster Halt: Hochgschirr-Aussicht · 420 m · ~6 min"

**6. Ankunft am POI**
- Vibrations/Audio-Cue (browser-erlaubt: nur visuell)
- Karte zoomt minimal heran, POI-Card öffnet sich automatisch
- „Weiter" advanced zum nächsten Wegpunkt in der Liste

**7. Tour-Ende**
- Letzter POI erreicht → Glückwunsch-Sheet
- Statistik: zurückgelegte Strecke, besuchte POIs, Cluster-Touches

### Minimal-UI-Inventar (was zu bauen ist)

| Element | Wo | Aufgabe |
|---|---|---|
| URL-Router | `src/runtime/router.ts` neu | pathname → Representation |
| RepresentationContext | `src/runtime/repContext.ts` neu | aktive R global |
| POIMarker-Tap | erweitert | öffnet POI-Card mit „+ Zur Tour" |
| Wishlist-Sheet | neu | gewählte POIs, „Route bauen"-Button |
| Route-Solver | `src/runtime/routeSolver.ts` neu | shortest-path through POIs |
| Route-Polyline | erweitert ColourMesh | dickere, betonte Route auf der Mesh |
| Position-Marker | neu | Pfeil mit Richtung |
| Time-Slider | neu (dev-only?) | Position auf Route fortbewegen |
| Next-Stop-Card | neu | aktueller Nächster-POI-Hinweis |
| Tour-Ende-Sheet | neu | Glückwunsch + Statistik |

---

## Bonus: BAK-Movement — „out of your comfort"

Der Bonus ist der eigentliche **Wow-Moment** — das, was SCIM einzigartig macht:
**adaptive Routenanpassung an Echtzeit-Last.** Wenn der MVP-Kern steht, ist
dieser Bonus klein, weil er auf den selben Daten arbeitet.

### Konzeptionelle Grundlage

- **BCK = Body Comfort Kernel** — beobachtet, wie wohl sich der Nutzer auf der
  aktuellen Route fühlt (Last, Tempo, Andrang)
- **BAK = Broda Avoidance Kernel** — *handelt*, wenn der Komfort kippt. Meidet
  als Kaskade volle Strecken → Wegpunkte → tauscht das Ziel-POI. Schlägt
  alternative Routen vor, leitet um. Detail-Spec: `docs/komfort_kaskade_spec.md`.

Im Runtime-Builder-Modell entspricht das R06.

### Bonus-Flow-Demonstration

**1. Time-Switcher in der App-Toolbar**
- Slider „Vormittag · Mittag · Nachmittag · Wochenende-Spitze"
- Bei jedem Schritt verändert sich die Fake-Load-Verteilung
- Heat-Pipe-Farben passen sich live an, POI-Load-Klassen springen

**2. Die aktuelle Route wird orange**
- Während der Nutzer auf einem bestimmten Segment ist, schiebt der Time-
  Switcher die Last so, dass dieses Segment in den „orange/voll"-Bereich
  rutscht
- Visuell: Segment-Farbe wandert von cyan-teal zu lavender zu magenta

**3. BAK schaltet sich ein**
- Decke-Banner oben: „Aktuell viel los hier — kennen wir was Ruhigeres?"
- Zwei Optionen: „Original durchziehen" / „Alternative ansehen"

**4. Alternative wird auf der Karte vorgeschlagen**
- Berechnung: shortest path durch die selben POIs (oder eine Untermenge),
  der die heißen Segmente meidet (Load < Schwellwert) — wenn das nicht
  geht, ersetzt eine kühlere POI-Auswahl die belastete Untermenge
- Visuell: Original-Route blasst aus, Alternative leuchtet hell auf
- Vergleich-Card: „+2 min Weg, dafür 60 % weniger Andrang"

**5. Akzeptieren**
- Tap auf „Übernehmen" → Route-State wechselt → Guidance läuft auf neuer Route
- Letzter Time-Slider-Sprung zeigt, dass die alte Route weiter rot wird,
  während die neue grün bleibt — der Adaptionsbeweis

### Was darf simuliert sein

| Bereich | Simulations-OK | Begründung |
|---|---|---|
| Position | ✓ (Tap- oder Time-basiert) | echte Geolocation ist Mobile-Permission-Theater |
| Echtzeit-Last | ✓ (Time-Switcher) | echte Telco-Daten kommen aus P04, später |
| Andere Nutzer auf Route | ✓ (in Load-Berechnung implizit) | siehe oben |
| BAK-Trigger-Schwelle | ✓ (Demo-Wert) | echte Schwelle kommt aus `loa` Sphere der R |

### Was MUSS echt sein

- OSM-Wege (haben wir via Overpass)
- POI-Positionen aus dem Katalog (haben wir)
- Routenberechnung auf echtem Graph
- Map-Rendering und Heat-Pipe-Optik (haben wir)
- BAK-Logik (eine Funktion, keine ML-Magie): „wenn current.load > X für N
  Sekunden → suche Alternative mit max.load < Y"

---

## Wie aus diesem MVP eine echte App wird

Pfad in drei Stufen, jede einzeln deploybar:

### Stufe 1 (MVP-Kern, ~3 Sessions Arbeit)
- URL-Routing + RepresentationContext (siehe HANDOVER, Punkt 1)
- Wishlist + Route-Solver
- Position-Marker + Tap-basiertes Fortbewegen
- Next-Stop-Card

### Stufe 2 (Bonus-Demo, ~2 Sessions)
- Time-Switcher und Fake-Load-Time-Variation
- BAK-Banner + Alternative-Route-Berechnung
- Vergleich-Card

### Stufe 3 (Polish)
- Echte Geolocation (mit Fallback auf Tap)
- Persistente Tour-Historie (localStorage)
- Share-Link zur aktuellen Route (`/<region>/<r>?tour=poi_005,poi_012,poi_023`)
- QR-Code für Tour-Übergabe an andere

---

## Was diese Doku NICHT ist

- **Kein** UI-Design (Mockups, Farben außerhalb der schon definierten
  Heat-Palette, Typografie kommen später).
- **Keine** Code-Spezifikation (Funktionssignaturen, Komponenten-API). Die
  Doku ist auf der „was und warum"-Ebene, nicht „wie".
- **Kein** Performance-Engineering (Caching-Strategien, Service-Worker,
  PWA-Manifest etc. — sind Stufe 3+).

---

## Lookup für die nächste Session

Wenn jemand fragt „wie sieht der MVP-Flow konkret aus": **hier**.
Wenn jemand fragt „wo passt BAK rein": **Bonus-Sektion, BAK-Movement**.
Wenn jemand fragt „was darf gemockt werden": **Tabelle in Bonus-Sektion**.
Wenn jemand fragt „was ist die Reihenfolge zum Bauen": **drei Stufen am Ende**.

Authoritativer Eintrag in `~/.claude/.../MEMORY.md` mit Querverweis.
