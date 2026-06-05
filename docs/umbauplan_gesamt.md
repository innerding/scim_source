# Gesamt-Umbauplan — Ziel-App über Shell/Origin/Anthem + BCK/BAK (lebendig)

**Status:** Merge aus `ziel_app_umbauplan.md` (Design-Konsens 2026-06-02, Modell B)
**+ realem Baustand 2026-06-05**. Dieses Doc ist die **lebendige Landkarte**: was das
Ziel ist, was schon steht, was bleibt. Detail-Specs bleiben maßgeblich:
`anthem_snapshot_spec.md`, `komfort_kaskade_spec.md`, `shell_katalog_zwei_takte.md`,
`wege_und_begriffe.md`.

---

## 1 · Überordnetes Ziel

Eine **Ziel-App** über **sensus core** und seine Pakete **Shell · Origin · Anthem**
per **git / Cloudflare R2** ausspielen. Die App meldet ihren Aufenthalt in einer
**Representation** (z.Z. nur Lichtenberg), fordert eine **Lastbewertung** an und
bekommt im **5-Min-Takt** einen **Anthem-Snapshot**: **Last je Segment OHNE
Koordinaten** (Index = Origin-Net-Segment). Die App rechnet Farbe und Route selbst
(**Modell B**, Segment-Graph in der App). Slogan: **„Geh deinen Weg."**

**Wahrheitskreislauf (Trygon-Loop):** Regelkreis im 5-Min-Takt —
**AP** (Anthem-Puls, *misst* Last) → **CK** (Comfort Kernel = **BCK**, *beobachtet*)
→ **AK** (Avoidance Kernel = **BAK**, *handelt*: Route) → verändert das Aufkommen →
AP misst neu. „Wahrheit", weil an real gemessener Last hängend (Ground Truth).

---

## 2 · Topologie (Codebasen unter SCIM3ClaudeMax/)

- **`scim_source/`** — SCIM-Editor (Operator, Panels P01–P14 + Runtime-Builder R01–R08)
  **+ Worker** (Cloudflare, R2). Hier wird gebaut/gemessen/publiziert.
- **`sensus-core-runtime/`** — die echte Ziel-App (`src/target-app/`). Hier wird
  konsumiert (Black Box: holt Pakete, rechnet lokal).
- **`shell-kit/`** *(NEU, 2026-06-05)* — die **EINZIGE Quelle des Shell-Pakets**
  (git-getaggte Lib). Editor UND Runtime referenzieren sie, kopieren nie. `app/`
  reist per Rep, `launcher/` bleibt our-side.

---

## 3 · Die drei Pakete = der Vertrag

| Paket | Horizont | Inhalt | Heutige Quelle |
|---|---|---|---|
| **Shell** | lang (App-Version) | die Engines: render (Container/POI/Cluster), **colorist**, **anthem-Mathematik**, **comfort/avoidance (BCK/BAK)** | **`shell-kit/app/*`** |
| **Origin** | mittel (Representation) | boundary · Netz @10 m (Segment-IDs) · poi-set (Container) · asset-set · **colour-settings (Schwellen)** | `originPackage.ts` → `bundle.json` / `mesh.json` (R2) |
| **Anthem** | kurz (~5 Min) | presence-origin · **Snapshot `loads[]` je Segment-Index, koordinatenlos** | Worker `GET /api/anthem/:repId` (live) |

**Trennung der Farb-/Schwellen-Kette (wichtig):**
- **spread/floor** (Normalisierung) wirken beim **Producer** (Worker, in
  `produceAnthem`/`normalizeLoads`) — sie formen die Lastwerte.
- **palette/spectrum/bias/safety** (Farbabbildung) wirken beim **Consumer** (Gerät,
  in `colorize`) — sie malen die Last. Beide stammen aus **P01 colourSettings**,
  reisen aber rollengerecht: norm im Origin-Mesh, palette im Origin-Bundle.

---

## 4 · Baustand gegen die Phasen (das Wesentliche)

> **Großes Bild:** Die Phasen **0–3** des ursprünglichen Plans (Vertrag, Encoder,
> Worker+Presence, App rendert Live-Last paket-only) sind **erreicht**. Was bleibt,
> ist die **Geräte-Intelligenz**: Phase 4 (**BCK/BAK** Routing) + Phase 5 (Guidance).

| Phase | Inhalt | Stand 2026-06-05 |
|---|---|---|
| **0 · Vertrag** | Anthem-Snapshot-Format, Origin-Manifest, Segment-IDs (Typen) | ✅ `packageContract.ts` |
| **1 · Encoder** | reine Last-Mathematik + `buildAnthemSnapshot` | ✅ in **shell-kit** (`app/anthem`): simSegmentLoads/normalizeLoads/stretchAverages/classifyStretches/dayPhase/produceAnthemLoads/produceAnthemSnapshot |
| **2 · Worker + Presence** | `GET /api/anthem/:repId?t=` (5-Min, presence-gegated), `POST …/presence` | ✅ **live** (verifiziert: 648 Strecken/6271 Segmente, `?t=` Turbo, 425-Kaltstart) |
| **3 · App rendert Live-Last (paket-only)** | App holt Snapshot, mappt segId→Geometrie, färbt | ✅ Runtime `OriginPreview`: knock→fetchAnthem→`snap.loads`→Origin-Net→`colorize` |
| **4 · Routing in die App (BCK/BAK)** | Comfort-Hüllkurve + Vermeidungs-Kaskade über Segment-Graph, gespeist aus Live-Last | ⬜ **als Nächstes** (Detail §5) |
| **5 · Guidance** | Auto-Segment-Vorschub, Next-Stop, „Route verlassen" | ⬜ (~70 % Gerüst in der App) |

**Zusätzlich gebaut (gerätesichtbar, shell-run-Strecke):** colorize (Colour-Mesh),
container/POIs, **Cluster** (zoom-abhängiger Ghost), Origin-Bundle-CTA (P11), der
Origin-Mesh als **eine Quelle** (`resolveOriginNet`). Alles aus shell-kit.

**shell-kit-Mitglieder (v0.8.0):** `ComfortSliders` · `geometry`/`geometryOf` ·
`decorations` · `render` (buildComposite …) · `colorist` (colorize/PALETTES) ·
`anthem` (Last-Mathematik + Snapshot) · `cluster` (renderClusterPois, eigener
Subpath) · `colorMesh` (buildColorMesh — derzeit ungenutzt seit Per-Vertex-Färbung).

---

## 5 · BCK / BAK — die Komfort-Funktion (Phase 4, Kern)

**Rollen (eingefroren, nach Broda benannt):**
- **BCK = Broda Comfort Kernel** — *beobachtet* den Komfort (= **CK** im Trygon-Loop).
- **BAK = Broda Avoidance Kernel** — *handelt*, wenn der Komfort kippt (= **AK**).

### 5a · BCK — Comfort als Destillat (Bedien-Modell, autoritativ)

Der **Comfort-Slider baut keine Routen.** Seine Schiene ist ein **Gradient-Balken =
Destillat des Colour-Meshs** (die Lastverteilung des Netzes auf eine Achse
eingedampft — ein „Schauglas"). Der **Schieber ist eine Schwelle**:

- Nach unten ziehen ⇒ **Netz einschränken**: Streckenabschnitte oberhalb der
  tolerierten Last fallen weg — (a) dargestellt (Idee: starke Abdimmung) und
  (b) faktisch nicht mehr routbar. **Das ist BCK.**
- **Last ändert sich → Destillat wandert mit.** Damit der Nutzer seine getroffene
  Comfort-Einstellung *behält*, gleitet das **Schauglas unter einem ruhenden
  Schieber** (UX-Tendenz, noch nicht final) — die Welt bewegt sich, die Geste bleibt.

### 5b · BAK — die Vermeidungs-Kaskade (Routing)

Eine harte Konstante (**Comfort-Rahmen**, User-Schwelle), ein fixer **Standort**
(MVP). Jede Stufe lockert *genau eine* Sache mehr, um im Comfort zu bleiben:

| Stufe | Bleibt fest | Gelockert | Aktion | Status |
|---|---|---|---|---|
| **0 · Direktroute** | Standort · Ziel-POI · Wegpunkte · Pfad | — | Route + Comfort-Check | ✅ (Editor S4) |
| **1 · Ausweichroute** | Standort · Ziel-POI · Wegpunkte | **Pfad** | um volle Strecken herum (`reroute`) | ✅ (Editor S5) |
| **2 · Wegpunkte umgehen** | Standort · Ziel-POI | **Wegpunkte** | System **fragt** „darf ich umgehen?" | ⬜ |
| **3 · Alternativroute** | Standort | **Ziel-POI** | Ziel tauschen (Comfort-Maximierung: das entfernteste noch comfortable POI) | ◐ Basis |

**Eskalation:** Stufe N+1 nur, wenn Stufe N im Comfort nichts findet. Nur Stufe 2
hat eine Rückfrage. Detail: `komfort_kaskade_spec.md`.

### 5c · Wo BCK/BAK leben sollen (Phase 4)

- Routing-Kern als **Segment-Graph-Variante in die geteilte shell-kit-Engine**
  (Modell B), gespeist aus **Live-Anthem-Last** (Snapshot) + **User-Comfort-Schwelle**.
- **Konvergenz, keine dritte Variante:** Editor-Routing (`playbook.ts`/`netRoute.ts`)
  UND App-Kernel (`brodaComfortKernel`/`brodaAvoidanceKernel`) → **eine** shell-kit-Engine.
- Der Comfort-Rahmen ist hart & app-seitig; Comfort + Wanderdauer sind die einzigen
  User-Stellschrauben (Manifest „Geh deinen Weg").

---

## 6 · Leitplanken (Anti-Dopplung · Mock-Erbe · Tests)

- **Keine Dopplung:** Jede neue Sache **ersetzt oder konvergiert** ihren Vorgänger.
- **Eine Quelle je Engine** (shell-kit), **eine Quelle je Begriff** (Spec).
- **Mock/Alt markieren, nicht jetzt aufräumen.** Demo/Mock-Fallback bleibt bis zum
  **persönlichen Lösch-Commit** des Operators.
- **Tests/Analyse/Review in jeder Phase.**

**Bekannte Nähte:** Engine-Doppelung (Phase 4 konvergiert) · alt `scim3_bundle_v1`
= Legacy · App-`SvgSegment` (Koords) abgelöst durch segId-only.

---

## 7 · Offene Rest-Schulden (außerhalb des Phasen-Kerns)

- **Mesh-Re-Publish mit `norm`:** Worker normalisiert mit `mesh.json.norm` (alt) →
  P01 **spread/floor** erreichen den Worker erst nach Mesh-Re-Publish mit aktueller
  norm (Analog zur Bundle-CTA fehlt für `/mesh`).
- **Anthem-Snapshot-Encoder vereinheitlichen:** Editor `anthemEncoder` ↔ shell-kit
  `produceAnthemSnapshot` — ein Producer (Worker nutzt shell-kit-Mathematik).
- **Sub-Schritt B (Render-Kern-Dedup):** Editor `sensus/shellRenderCore.ts` +
  lokale `GEOMETRIES` → auf shell-kit umbiegen, lokal löschen.
- **Studio ↔ Runtime strikt 1:1:** Studio-Monitor wendet colourSettings/Snapshot-Pfad
  noch nicht an wie die Runtime.
- **POI-Deco-Glyphen** reisen nicht im Bundle (Deco null in der Runtime).
- **Testmodus in P01** (sofort-sichtbar) — Notiz steht; Runtime-Turbo zeigt's vorab.
- **Echtes Telco + Presence**, Guidance „besser als das Beste", **Kehrseite** (TVB),
  **Collector/Launcher** (Cross-Rep), Globe-switcher-Allowlist, regionale Dashboards,
  Datengröße-Hebel, Asphalt-Warnungen — Post-MVP.

---

## 8 · Abhängigkeiten

`0 → 1 → 2 → 3` ✅ erledigt → **`4 (BCK/BAK)` → `5 (Guidance)`**. P09/P11-Ausbau
(Partikel-Registry, Bezugs-Auftrag) läuft parallel.
