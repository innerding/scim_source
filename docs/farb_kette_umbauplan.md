# Farb-Kette & Umbauplan — Last → Farbe, Production-Wegnetz bis User-Device

Eingefroren 2026-06-02. Verbindlicher Konsens für den Umbau der Farb-/Schwellen-
Logik. Prinzip wie immer: **id einfrieren, label entwickeln.**

---

## 0 · Grundprinzipien

- **Anzeige = immer Segment-Last.** Die feine Heat-Linie ist pro Segment gefärbt.
- **Ausschluss/Degradierung = immer pro *Strecke*** (Kreuzung→Kreuzung), über die
  **Ø-Last** zwischen den Kreuzungsknoten — und nur **an Kreuzungen** schaltbar.
  (Man kann eine Strecke nur als Ganzes meiden, nicht mitten drin aussteigen.)
- **Zwei Arten Wegnehmen:**
  - **Degradierung** (Operator) = *visuell entdrängt* — blasser/dünner, behält Farbe.
  - **Ausschluss** (User, Runtime) = *semantisch neutralisiert* — ohne Farbwert (farblos).
- **Shell = Engine** (generischer Code) · **Anthem = Last** (volatile Werte).

---

## 1 · Die Panel-Kette: Production-Wegnetz → User-Device

### Production (Operator, in SCIM)
| Panel | Rolle in der Kette |
|---|---|
| **Drawer** (`geometry_editor`) | zeichnet das rohe Netz (OP/OSM), zwei Wahrheiten |
| **P07 Boundary** | Boundary + Rep-Junction |
| **P08 Wegnetz-Sampling** | merge → DP → resample → **origin-net** (gleich lange Segmente + Segment-ids + Kreuzungen) |
| **P09 Engine-Prep-Build** | bereitet die vier Engines vor (POI=dompteur · Last=colorist · **Mask=comfort/User-Ausschluss** · Move=BAK) |
| **P01/P02/P04 Thresholds** | die Farb-/Darstellungs-Settings (System/Region/Load) → speisen die `colorize`-Pipeline |
| **P11 Sensus Core Services** | ordert die particles, schnürt **Shell · Origin · Anthem** (+ Version, Deploy-Reihenfolge) |
| **Transmitter** (künftig) | terminiert die Ausspielung (5-Min-Takt) |

*(P10 „Route+Layer" löst sich auf: Degradier-Schwelle → Region, Ausschluss → User/Runtime, Farbe/Aggressivität/Palette → System/Region/Load. Kein 4. Bogen nötig.)*

### Ausspielung → User-Device (Ziel-App, lokal, ohne SCIM)
```
Shell (App-Shell)   : Engines colorize/dompteur/BCK/BAK + container-system   [generisch]
Origin (Apfel-Daten): boundary · origin-net · asset-set · poi-set · pixel    + regionale Settings
Anthem (Atem)       : presence-origin (Gate, Einatmen) · load-values (5 Min) · User-Ausschluss-Schwelle
```
**Auf dem Gerät:** Shell-Engine + Origin-Daten + Anthem-Last →
`colorize`-Pipeline → **Anzeige** (Farbe je Segment, Degradierung/Ausschluss je Strecke).

---

## 2 · Die Farb-Kette `G(load)` (welche Einstellung baut auf welche)

```
rawload (Anthem: Sim-Telco / später Telco)
  → P01 System :  Normalisieren + Mindest-Rot-Floor      (ehrlich & lesbar)
  → P02 Region :  Tendenz-Bias + Safety-Default          (regionale Handschrift)
  → P04 Load   :  Palette/Spektrum  →  FARBE je Segment   (Grund-Schema rendert)
  → P02 Region :  Degradierung   (Ø-Last/Strecke → entdrängt)
  → P09 Mask   :  User-Ausschluss (Ø-Last/Strecke → farblos)
```
`G(load)` ist also keine fixe Funktion mehr, sondern diese komponierte Pipeline.
Alle drei Operator-Thresholds + die User-Maske hängen in **einer** Production-
Runtime-Kette.

### Die vier Farb-Stationen (Titel + Regler)
- **P04 · „Das Grund-Spektrum"** — Spektrum-Charakter (ruhig↔aggressiv) · Hintergrund-Anpassung.
- **P02 · „Die regionale Handschrift"** — Tendenz-Bias (grün↔rot) · Safety-Default · Degradier-Schwelle (Operator, entdrängt).
- **P01 · „Der ehrliche Spiegel"** — Mindest-Rot-Floor · Normalisierung (Spreizung) · Cross-Rep-Konsistenz.
- **P09 · „Der Ausschluss des Users"** (Runtime) — Ausschluss-Schwelle (neutralisiert/farblos).

---

## 2a · Regler-Grundsatz (verbindlich): der Gradient bleibt durchgehend

Jeder Farb-Regler zeigt **EINE stetige Skala** — die volle `colorize`-Palette,
ununterbrochen; sie ist zugleich die Legende. **Schwellen sind aufgesetzte
Marker** an ihrer Position („ab hier") — sie **schneiden, recolorieren oder
beenden den Gradienten nie.**

- **Negativbeispiel (so nicht):** der alte Route-Layer-Regler
  `P08RouteLayerForm` (Z. 203–204) baut die Leiste aus zwei umgefärbten Stücken
  (grün→gelb | orange→rot) mit Farbsprung am `degrade`-Griff und Abschnitt bei
  `exclude` → der Gradient ist zerschnitten.
- Das eigentliche **Wegnehmen (Degradieren/Ausschließen) passiert je Strecke
  über die Ø-Last**, nicht durch Zerschneiden der Farbskala.

**Ausnahme nur bewusst:** sollte später eine Funktion das Bändern/Schneiden
sinnvoll brauchen, wird das *explizit* entschieden. Default ist **immer** der
durchgehende Gradient — damit es nicht ungewollt passiert.

---

## 3 · Shell / Origin / Anthem — Zuordnung

| Paket | Inhalt (zur Farb-/Schwellen-Logik) |
|---|---|
| **Shell** (long) | Engine-Funktionen: `colorize`, `normalizeLoads`, `classifyStretches`, BCK/BAK · container-system |
| **Origin** (mid) | origin-net (Geometrie + Segment-ids + Kreuzungen) · asset/poi · **regionale Settings** (Bias/Safety/Degradier/Palette) |
| **Anthem** (short) | **load-values** (Segment-Werte, 5 Min) · Live-Last-Statistik (für Normalisieren) · **presence-origin** (Gate) · **User-Ausschluss-Schwelle** |

Offene Detail-Frage (beim Schnüren in P11 festklopfen): System-Settings → lang
(instanzweit, Shell-nah) · Region-Settings → mittel (Origin) · Load-Palette →
Origin (stabil); die *Last selbst* bleibt Anthem.

---

## 4 · Umbauplan (kleine, testbare Einheiten)

### Phase A — Engine-Kern (Shell · rein + getestet, keine UI)
- **A1 `stretchAverages(net, loads)`** — Ø-Last je Strecke (zwischen Kreuzungen). Basis fürs Schalten.
- **A2 `colorize(load, params)`** — parametrisierte Palette (Spektrum · Bias), stetig; ersetzt fixes `heatColor`. Defaults = heatColor. *(Floor wandert zu A3 — gehört zur System-Normalisierung.)*
- **A3 `normalizeLoads(loads, {floor, spread})`** — System-Normalisierung aus der Last-Verteilung (inkl. Mindest-Rot-Floor).
- **A4 `classifyStretches(net, stretchAvg, {degradier, ausschluss})`** → je Strecke `normal | degraded | excluded`, crossing-gated.

### Phase B — Einstellungs-Modell + Operator-Regler
- **B1** Settings-Modell + Persistenz (je Region, localStorage wie edge-types).
- **B2** Regler in **P01/P02/P04 → Adjust** (Titel/Beschreibungen aus §2).

### Phase C — Anthem + User
- **C1 P09 → Mask:** User-Ausschluss-Schwelle (Runtime-Sim-Slider). Last aus `simSegmentLoads`, Live-Statistik fürs Normalisieren.

### Phase D — Render-Integration (Inspector)
- **D1** „Last (sim)" + Colour-Mesh: Anzeige per Segment via `colorize`-Pipeline; dann pro Strecke Degradierung (entdrängt) + Ausschluss (farblos); live auf Settings.

### Phase E — Modell-Sichtbarkeit
- **E1** P09/P11: Shell/Anthem-Tagging sichtbar (Engine→Shell · Last→Anthem).

**Reihenfolge:** A → B → C → D → E. A ist das pure, testbare Fundament; B/C füttern Parameter; D macht sichtbar; E dokumentiert die Paketzugehörigkeit.

**Erste Einheit: A1** (`stretchAverages`) — Grundlage für Ausschluss/Degradierung, von nichts abhängig.
