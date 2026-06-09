# Guidance + Play — Bauplan (aktualisiert, shell-kit-konform)

*Stand 2026-06-09 · ersetzt den „Play/Guidance"-Teil von docs/runtime_mvp.md (2026-05-27, prä-shell-kit).*
*Doktrin: Logik in **shell-kit** (in Shell-Studio testbar), Runtime = dünner Adapter.*

---

## ⚠ KORREKTUR (2026-06-09) — Ziel ist OriginPreview, nicht die Demo

Es gibt **zwei Karten-Pfade** in der Runtime:
- **`?rep=<id>` → `OriginPreview`** (`src/target-app/origin/OriginPreview.tsx`) = der **ECHTE** Pfad
  (QR / live vor Ort). Hat schon **Colour-Mesh + POI-Auswahl + Route (bak) + Comfort** — aber
  **noch KEIN „Play"/Gehen**. ← **HIER gehört Guidance/Play hin.**
- **`?demo=1` → `App.tsx` + `MapView`** = **Demo** (privat); `MapView` ist **`@LEGACY`** (wird mit der
  Demo-Ablösung gelöscht). Die im „Audit" unten beschriebene reiche Guidance-State-Machine
  (`useAppMachine`) lebt **hier** — auf zu löschendem Code, **NICHT** der Zielort.

**Stand Bau:** **S1 (shell-kit `walker.ts`) fertig** (v0.43.0, 7/7 Tests) + **`DurationClock` fertig**
(Runtime, wiederverwendbar). **S2 wurde versehentlich in die Demo verdrahtet** (bleibt, schadet
nicht). Der echte **S2/S3/S4 kommt in `OriginPreview`** — dort liegt die bak-Route als Polylinie bereit.

> Das „Audit" unten beschreibt die **Demo** (Pfad B). Für den echten Bau die Schritte sinngemäß
> auf OriginPreview übertragen: bak-Route = die zu gehende Polylinie, Comfort/Marker dort einhängen.

---

## Audit (Pfad B = Demo, @LEGACY) — was an Guidance-Gerüst existiert

**Runtime `sensus-core-runtime/src/target-app/`:**
- Volle **State-Machine** (`app/useAppMachine.ts`): browsing → `proposal_running/paused` (BCK) → `route_committed` → `guidance_active / guidance_paused / guidance_completed`. Aktionen: `START_GUIDANCE`, `NEXT_SEGMENT`, `PAUSE/RESUME/COMPLETE_GUIDANCE`, `BACK_TO_PLANNING`.
- **GuidanceHeader** (`ui/GuidanceHeader.tsx`): nächster Halt, Rest-Distanz, ETA, Fortschritts-Balken — rechnet aus *Position vs. Route-Punkten*.
- **MapView** (`map/MapView.tsx`): rendert die **echte Route-Polyline** (`pkg.route_options[].geometry.coordinates`) + POI-Marker. Prop `highlightSegmentIndex` existiert, ist aber **ungenutzt** (`void`).
- Proposals / BCK / BAK / Silent-Refresh-Schutz während Navigation.

**shell-kit `src/app/`:**
- `bak.ts`: `solveRoute(net, waypoints) → Route` (Dijkstra), `routeBreachesComfort(...)`, `toggleWaypoint(...)`.
- `route.ts`: `renderRoute(...)`. `RouteComfortBanner.tsx`, `ComfortSliders.tsx`.

**Fazit:** Laden → POIs → Auswahl → Route → **Guidance-Gerüst** ist gebaut und getestet (bak-test). Die Route hat **echte Geometrie** (Polyline).

---

## Was FEHLT — nur „Play" (die Bewegung)

1. **Bewegte Position** entlang der Route-Polyline — gibt es nicht (Fortschritt ist heute abstrakt: `total_segments = ceil(Dauer/8)`, Advance manuell per `NEXT_SEGMENT`).
2. **Positions-Marker** auf der Karte (Pfeil mit Richtung) — fehlt (`highlightSegmentIndex` ungenutzt).
3. **Play/Pause-Control** (Auto-Fortbewegung) — nur „Start"/manuell vorhanden.
4. **Ankunft** (Position nahe Waypoint → POI-Cue) + **Tour-Ende** an Polyline-Ende.
5. Echtes **`watchPosition`** — gar nicht (laut Plan Stufe 3, optional).

---

## Bauplan (in Reihenfolge)

### S1 — shell-kit `app/walker.ts` (pure, testbar)  ★ Kern
Reine Funktion, keine Leaflet-/React-Abhängigkeit:
```
walkAlong(polyline: LatLng[], elapsedSec, speedMps) → {
  pos: LatLng, bearingDeg, progress 0..1, distDoneM, finished
}
nearestWaypoint(pos, waypoints) → { idx, distM }
```
- Interpoliert die Position entlang der Polyline (kumulierte Segment-Längen).
- Node-Test wie `bak`/`Skala` (Fixpunkte: Start/Mitte/Ende, Bearing).
- **Das ist das eigentliche Stück.** Austauschbare Positions-Quelle → später GPS.

### S2 — Runtime-Adapter: Play/Pause treibt die Guidance
- In `guidance_active`: ein `setInterval` (oder rAF) ruft `walkAlong(…, elapsed)` → setzt die Live-Position; bei `finished` → `COMPLETE_GUIDANCE`.
- **Play/Pause-Button** in `FooterBar` (Pause = Timer anhalten = `PAUSE_GUIDANCE`). Manuelles „Weiter" bleibt als Fallback.
- Optional: `progress_ratio`/`elapsed_minutes` aus der echten Walker-Distanz speisen statt aus dem abstrakten Segment-Zähler.

### S3 — MapView: bewegter Positions-Marker
- `L.marker` (Pfeil-Icon, `rotate` via `bearingDeg`) an der Walker-Position; pro Tick aktualisieren.
- Optional sanftes Auto-Pan (Karte folgt der Position).
- GuidanceHeader bekommt die **Walker-Position** als „aktuelle Position" (statt fixem Punkt) — Rest-Distanz/ETA werden dadurch live.

### S4 — Ankunft + Tour-Ende
- `nearestWaypoint(pos) < ~25 m` → Ankunfts-Cue (POI-Card öffnen; visuell, kein Vibrate-Theater).
- Polyline-Ende → `guidance_completed` → Glückwunsch/Statistik-Sheet (prüfen, ob schon vorhanden; sonst minimal).

### S5 — (Stufe 3, optional) echtes GPS
- `navigator.geolocation.watchPosition` als **alternative Quelle** mit derselben Schnittstelle wie der Walker → 1:1 austauschbar, Fallback auf Sim. Kein Demo-Blocker.

---

## Wiederverwenden (NICHT neu bauen)
`solveRoute` · `renderRoute` · `routeBreachesComfort` · `RouteComfortBanner` · `GuidanceHeader` · die ganze State-Machine · die Route-Geometrie aus dem Paket.

## Aufwand & Reihenfolge
**S1 → S2 → S3 → S4** = eine fokussierte Session (das Demo „läuft" danach). **S5** separat, optional.
Kein Greenfield-Finale — ein **Bewegungs-Baustein in shell-kit + Adapter + Marker**.

## Offene Mini-Entscheidungen
- Diskret (Auto-`NEXT_SEGMENT` per Timer, 30 Min) vs. **kontinuierlich** (Walker auf Polyline) → **kontinuierlich**, weil die Geometrie da ist und es echt aussieht.
- Speed: fixer Demo-Wert (z. B. 1,4 m/s Gehtempo) + Zeitraffer-Faktor für die Vorführung.

---

## UX-Nachtrag (Operator-Feedback 2026-06-09)

- **Rest-Dauer-Uhr = erstes Anzeige-Element (Herzstück).** Sobald eine Route existiert:
  Planung = Gesamt-Schätzung (`estimated_duration_minutes`), Begehung = **Rest-Dauer**
  (zählt runter, aus Walker-Progress). Persistent sichtbar während der Begehung. Reine
  Anzeige (nicht interaktiv). → fließt in **S2**.
- **Fortschrittsbalken-Header: RAUS.** Die Uhr ersetzt ihn (menschlicher als ein abstrakter
  Balken). **Nächster Halt + Rest-Distanz** aus GuidanceHeader BLEIBEN. Nur EINE Steuerleiste
  (kein Zwei-Footer-Demo mehr). → vereinfacht **S2/S3**.
- **Positions-Pfeil zeigt Fahrtrichtung sofort** aus `bearingDeg` (Walker) — **kein** Sensor
  nötig. → **S3**.
- **Magnetischer Kompass** (`DeviceOrientationEvent`) = Geräte-Sensor, gehört mit
  `watchPosition` in **S5** (echtes Gerät), iOS-Permission. Kein Demo-Blocker.
- **Long-tap-POI-Detail** (short-tap=markieren bleibt) ist ein eigenes Browsing-Feature,
  NICHT im Play-Kern — aber **dieselbe POI-Detail-Komponente** wie die Ankunfts-Card (**S4**).
  → Parallel-Task, der die Ankunfts-Card mitliefert.

### Icons — Spezifikation (3 Format-Klassen)

**A — UI-Line-Icons** · `viewBox 0 0 24 24` · `stroke-width 1.7` · `linecap/linejoin round` ·
`fill none` + `stroke currentColor` · Safe-Area ~2 px · *Play/Pause gefüllt* (`fill currentColor`):
| Icon | Zweck | Schritt | Status |
|---|---|---|---|
| Play | Begehung starten/fortsetzen (gefüllt) | S2 | vorhanden · überarbeiten |
| Pause | Begehung anhalten (2 Balken, gefüllt) | S2 | **neu** |
| Plus | POI „+ zur Tour" | Browsing | vorhanden |
| Häkchen/Check | Ankunft am POI + Check im Long-tap | S4 | evtl. |
| Zielflagge | Tour-Ende | S4 | vorhanden |
| Kompass | magnet. Geräte-Heading | S5 | vorhanden · später |

**B — Ziffern-Zelle** · gleiche Zelle/Höhe/Strichgewicht wie die Ziffern (monospace):
| Icon | Zweck | Schritt | Status |
|---|---|---|---|
| Ziffern 0–9 | Rest-Dauer-Uhr | S2 | vorhanden (monospace ✓) |
| Doppelpunkt | Uhr-Trenner `MM:SS` (2 Punkte in x-Höhe, gleiches Gewicht) | S2 | **neu** |

**C — Karten-Marker** · `viewBox 0 0 32 32` · explizite Farben (NICHT currentColor) ·
transluzente Akzent-Scheibe + weißer Rand ~2 px + weißes Kite · Kite eigene `<g>`,
Pivot `16,16`, Spitze nach Norden (rotiert per `bearingDeg`):
| Icon | Zweck | Schritt | Status |
|---|---|---|---|
| Positions-Marker (Scheibe + Kite) | „Du" auf der Karte | S3 | **neu** |

**Jetzt vorzubereiten (S2–S3):** Pause · Doppelpunkt · Positions-Marker.
**Bestand finden/überarbeiten:** Play · Plus · Zielflagge · Kompass · Ziffern. **Später (S4):** Häkchen.
