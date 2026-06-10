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

---

## Verfeinerung & Erweiterung (2026-06-10) — BAK-Kaskade präzisiert

*Operator-Feedback nach Live-Test. Basis-Kaskade (Stufe 1 auto / Stufe 2 Frage) ist
gebaut; hier die nächsten Schritte. Regel-Heimat = in-app `ann_116`. Leitbild
unverändert: stille Eskalation, „kein Routen-Shop", Wahl muss eindeutig treffbar sein.*

### A — Konkrete Verfeinerungen (baubar, klein → groß)

- **A2 ✓ GEBAUT (73bfd44) · BAK-Modal-Breite.** Auf **≤ halbe Screen-Breite**
  (`width: min(50vw, 320px)`); Buttons brechen um (`flexWrap`, `flex 1 1 110px`) →
  stapeln sauber auf schmalem Screen. Live: 188 px ≤ 187,5.
- **A3 ✓ GEBAUT (73bfd44) · Zeit-Box-Hintergrund = Comfort-Farbe.** Steuerleiste
  bekommt **immer** `colorAt(comfort, scale)`; Textfarbe luminanz-adaptiv
  (`contrastText`), Play/Pause-Badge mit drop-shadow für Trennung auf hellen Farben.
- **A4 ✓ GEBAUT (73bfd44) · BAK-Box-Hintergrund = „Ohne-BAK"-Farbe.** Modal bekommt
  **immer** die Spitzen-Last-Farbe der ungemilderten Basis-Route (`peakColorOf`);
  Text/Buttons adaptiv (fg/bg getauscht). Je belebter, desto „heißer" → Dringlichkeit.
- **A1 ✓ GEBAUT (82920f7) · Stufe-1-Hinweis quantifiziert + Schwelle.** Zeigt **immer
  Prozent UND Mehrzeit** (`% = (altLen−baseLen)/baseLen`, `Mehrzeit = .../WALK_SPEED_MPS`).
  **Bis +20 %** ruhig („↳ Wegen Andrang umgeleitet · +9 % · +9 Min"); **ab +20 %**
  auffällig („⚠ Deutlich längerer Weg · +85 % · +19 Min": größer, fett, Warn-Icon,
  stärkerer Schatten). Live verifiziert.

**→ Damit ist A komplett.**

### Karten-Lebenszyklus (geklärt 2026-06-10)

- **Häufigkeit der Stufe-2-Frage = pro Engpass EINMAL.** ✓ Entschieden — entspricht
  dem gebauten Stand (`keptPoiIds`: „Trotzdem hin" = Ruhe für diesen POI; ein neuer
  Engpass fragt neu). **Kein Code-Änderung nötig.**
- **Swipe-to-dismiss = ⏸ GEPARKT (offen).** Tendenz „Snooze" (kurz wegblenden),
  evtl. über eine **Nachfrage-Kaskade** statt sofort. Als global heikle Geste
  markiert (kann an anderer Stelle ungünstig werden) → im Detail zu überlegen, **nicht
  jetzt bauen**.
- **Sammel-Karte bei Karten-Überlast = ✓ ENTSCHIEDEN → gehört zu B.** Ab mehreren
  gleichzeitigen Engpässen kollabieren die Einzelkarten zu **EINER** Karte mit zwei
  gegensätzlichen Polen: **„Belebte Ziele weglassen"** (Comfort: alle Engpass-POIs raus)
  vs **„Alle behalten"** (Ziele: nichts opfern, **BAK wird still** = das Mute). Diese
  eine Entscheidung räumt alle Karten ab. **Gestaltung (Operator):** die **Route in der
  Karte** darstellen + die **fraglichen POIs (verwelkend**, vgl. B2) + **Reihenfolge**
  → der Wanderer sieht, *wo* es klemmt = Orientierung. Spätere 3. Option „ruhigere
  Ähnliche vorschlagen" = Bulk-Variante von Stufe 3. (Schwelle, z. B. ab 3, justierbar.)

### B — Stufe 3 (POI-Tausch) + Sammel-Karte

- **B1 ✓ GEBAUT (shell-kit v0.46.0) · Ähnlichkeits-Vorschlag (Klassifikator + Pipeline).**
  `similarity.ts`: `bucketOf` (Präfix vor „_") + `similarityTier` (3 gleiche Subkat /
  2 gleiche Hauptkat / 1 äquivalente Hauptkat / 0 unähnlich; **nur direkte Paare**, keine
  Transitivität: Points≡Square · Square≡Regenerate · Transport≡Service; `BUCKET_EQUIVALENCE`
  erweiterbar). `swap.ts`: `suggestSwap(net, chainIds, pois, bottleneckId, dimmed)` —
  komponierbare Pipeline: 1) nur Ähnliche (tier≥1) · 2) getauschte Route muss ruhig sein
  (kein Breach) · 3) Rang = höchste Ähnlichkeit, dann kleinster Umweg → bester Ersatz-POI
  (+`deltaM`/`newTotalM`) oder null. 27/27 Tests. **Noch nicht in der Runtime verdrahtet
  (das macht B2).** Regel-Pflege in `ann_116`.
- **B2 ✓ GEBAUT (runtime 2597c0a, shell-kit v0.47.0) · POI-Confrontation-Animation.**
  Stufe 3: bei Engpass bietet die Kaskade einen **Tausch** gegen einen ähnlichen, ruhigeren
  POI (`suggestSwap`) statt nur „Auslassen". `PoiConfrontation.tsx` = Energieaustausch: X
  (belebt) **verwelkt** (schrumpft/kippt/dimmt/entsättigt, forwards), Y (ruhiger) **erblüht**
  (wächst/glüht/atmet, infinite alternate), ein **Funke** fließt X→Y; darunter „ruhiger · ±Min".
  Buttons [Bei X bleiben] / [Tauschen]. Resolver: erst `suggestSwap` (Treffer→Stufe 3, sonst
  Stufe 2). shell-kit v0.47.0: **lokale Ruhe-Prüfung** (nur die Beine um den Ersatz müssen
  komfortabel sein, nicht die ganze Route — die Kaskade löst einen Engpass/Runde). Live ok.
- **B3 ✓ GEBAUT (runtime bfcb42b, shell-kit v0.50.0) · Manege — Sammel-Karte.**
  `PoiManege.tsx`: ab `MANEGE_THRESHOLD`=3 (justierbar) gleichzeitigen Engpässen EINE Bühne —
  SVG-Mini-Karte auf den Engpass-Abschnitt gezoomt (Route + verwelkende, last-gefärbte,
  nummerierte Marken) + Liste top-down mit Original-Routen-Nummern (Custom-Ziffern) + 2 Pole
  „Belebte Ziele weglassen"/„Alle behalten"(=Mute). shell-kit `breachingLegs` (alle Engpässe).
  Glass-Look, Karte 88vw. Live verifiziert (5 Engpässe → Manege, beide Pole). — Ursprungs-Spec:
- **B3-alt · Manege — Sammel-Karte (aus „Karten-Lebenszyklus").** Eine Karte bei Überlast
  mit Route-Darstellung + verwelkenden Engpass-POIs (teilt die Verwelk-Optik mit B2) +
  Reihenfolge; zwei Pole „Belebte Ziele weglassen" / „Alle behalten" (= Mute). Heißt
  **Manege** (ann_119); Komponente z. B. `PoiManege`. **Ordnung (entschieden 2026-06-10):**
  das räumliche bottom-up („du unten, Weg geht hoch") lebt in der **Mini-Karte** (dort
  ist oben=voraus natürlich); die **Entscheidungs-Liste** bleibt **konventionell top-down
  in Begehreihenfolge** mit den **Original-Routen-Nummern** (Custom-Ziffern-Badges wie die
  Hauptkarte) — KEINE Live-Umnummerierung (sie würde den Karte↔Manege-Anker zerschneiden;
  Lücken wie „Stopp 3·5·7" sind sogar Info). Die einzelne Stufe-3-Confrontation = „eine
  Nummer in der Manege".

### C — Offene Designfrage (zu lösen, NICHT jetzt)

- **C1 · Eigene Strecken-/Kreuzungspunkt-Wahl** (nicht nur POIs): eine Strecke
  zwischen zwei Kreuzungen, oder mehrere. Kandidaten: (a) Auswahl über Strecken ·
  (b) über Kreuzungspunkte · (c) eigenes Werkzeug · (d) Swipe + Trassierung.
  **Manifest-Leitplanke: eindeutig treffbar** (treffsicher an-/abwählen, keine
  Zweideutigkeit — vgl. Ziel-App-UX „Geh deinen Weg") — sonst Ärger. **Erst Design
  klären, dann bauen.**

### Abarbeitungs-Reihenfolge (Vorschlag)
**A2 → A3 → A4 → A1 → B → C** (kleine sichtbare zuerst; C nach Design-Klärung).

---

## Backlog — notiert, nicht jetzt (2026-06-10) · siehe `ann_120`

- **Undo / Rückgängig für Routen-Edits.** Route verkürzt (auslassen/tauschen/abwählen) und
  spät bemerkt → kein Schritt-zurück. Heute hängt ein re-geklickter POI ans Ende (Reihenfolge
  kaputt). → kleine Undo-Historie der `selectedPoiIds`.
- **Demo ↔ Echt-Wandern umschalten.** Aktuell läuft der Sim (Sim-Walker + telco-last-sim).
  Echt = **S5** (`watchPosition`, 1:1-Tausch der Positions-Quelle) + reale Anthem-Last. Offen:
  wo/wie der Umschalter (Auto-Detect / Schalter / `?demo=1` vs. live). Hängt an S5.
- **Stufe-3 Tap-to-cycle ✓ GEBAUT (Confrontation v2, runtime f41313e, shell-kit v0.49.0).**
  `dompteurPicks` (Top-N); Tap aufs blühende POI / ↻ i/N-Badge blättert durch die Kandidaten,
  Name/Zeit/Verlauf/Icon aktualisieren. swapIdx, Reset nur bei Engpass-Wechsel.
- **Glass-Look-Panel ✓ GEBAUT (Confrontation v2).** Alle Kaskaden-Boxen durchscheinend (`withAlpha`
  0.6 + backdrop blur + Glass-Edge) → Route bleibt darunter sichtbar. **Entscheid:** Last-**Verlauf**
  bleibt (dezenter unter Glass — bewusst, Farbtonlage unverändert). Drag = nicht gebaut (nicht nötig).
