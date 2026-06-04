# Ziel-App Umbauplan — paket-basierte App über Shell/Origin/Anthem (verbindlich)

**Status:** Design-Konsens 2026-06-02. Routing-Modell **B** (Segment-Graph in der
App) entschieden. Diese Spec ist maßgeblich für den Umbau.

**Siehe auch:** `docs/shell_katalog_zwei_takte.md` — wie Render-Mechanik (Shell,
langsam/versioniert) und Katalog (live) auf zwei Schienen getrennt gebaut werden,
inkl. Git-Sharing des Render-Kerns (git-getaggte npm-Dependency).

**Überordnetes Ziel:** Eine **Ziel-App** über **sensus core** und seine Pakete
**Shell · Origin · Anthem** per **git / Cloudflare R2** ausspielen. Die App meldet
ihren Aufenthalt in einer **Representation** (z.Z. nur Lichtenberg), fordert eine
**Lastbewertung** an und bekommt alle 5 Minuten einen **Anthem-Snapshot**:
**Farbe/Last je Segment OHNE Koordinaten, mit Segment-ID**. Die Komfort-Kaskade
(Ausweich-/Alternativroute, siehe `komfort_kaskade_spec.md`) läuft **ausschließlich
über die Pakete in der App**.

---

## Topologie (drei Codebasen unter SCIM3ClaudeMax/)

- **`scim_source/`** — SCIM-Editor (Operator, Panels P01–P12 + Runtime-Builder-
  Stubs R01–R08) **+ Worker** (Cloudflare, R2 + D1).
- **`sensus-core-runtime/`** — die echte Ziel-App (`src/target-app/`: Loader,
  State-Machine planning→proposal→guidance, BCK, BAK, Leaflet-Map, Guidance ~70 %).
- **`sensus-core-source/`** — Spec-Docs (`scim3_umbau_plan.md`,
  `ziel_app_runtime_spec.md`, `ziel_app_mvp_implementation_spec.md`, …).

> **Divergenz zur bestehenden MVP-Spec (bewusst):** `ziel_app_mvp_implementation_
> spec.md` legt fest, dass der App-BAK im MVP **nur vorgebackene `route_options`
> filtert/sortiert** (kein App-Routing; Segment-Graph = Post-MVP). Dieser Umbauplan
> wählt bewusst das **Post-MVP-Ziel (Modell B)**, weil nur so die Komfort-Kaskade
> live beliebige Stauungen umfahren kann statt aus einem festen Menü zu wählen.

---

## Die drei Pakete = der Vertrag

| Paket | Horizont | Inhalt | Quelle heute |
|---|---|---|---|
| **Shell** | lang (App-Version) | die Engines selbst (colorize, BCK, BAK-Routing) | `src/scim/sensus/*` |
| **Origin** | mittel (Representation) | **gestaffelt (Manifest-first):** L0 boundary=**Manifest** (unsichtbar, rahmt OSM + verlinkt Rest+Anthem) · L1 Netz @10 m **mit Segment-IDs + Adjazenz (NEU)** · L2 asset-set · L3 poi-set · L4 pixel-charges (MVP leer, später POI-Sheet-Raster) | `src/scim/sensus/originPackage.ts` |
| **Anthem** | kurz (~5 Min) | presence-origin · **Snapshot `segId→load` (NEU)** · user-exclusion | heute nur intern als `number[]` |

**Segment-ID-Format (eingefroren, konsistent im Code):** Strecke `edgeId.piece`,
Segment `stretchId#segIndex` (z.B. `5.0#2`). Quelle: `netRoute.ts` (`netSegments`),
`netResample.ts` (`ResampledNet`).

---

## Vier Lücken (codegestützt bestätigt, Stand 2026-06-02)

1. **Anthem-Snapshot fehlt.** Last lebt nur als positions-indiziertes `number[]`
   im Editor-RAM (`playbookLoad`/`simSegmentLoads`). Keine Serialisierung
   `{segId→load}`, kein 5-Min-Speicher, kein Worker-Endpoint.
2. **App trägt noch Koordinaten.** `sensus-core-runtime/.../package.types.ts`
   `SvgSegment` hat `coordinates` + `load_value` — noch kein segment-id-only.
3. **Routing an Editor-Geometrie gekoppelt.** `pickTestRoute/routeFromBusTo/
   reroute` brauchen volle `PathEdge`+`ResampledNet`. **Aber** `routeComfortCheck`
   braucht nur Segment-IDs + Ø-Last + Schwelle → app-fähig. Das *Pfadfinden* muss
   auf eine Segment-Graph-Variante umgestellt werden.
4. **Guidance ~70 % Gerüst** (State + UI), ohne Auto-Vorschub / Turn-by-Turn.

---

## Anthem-Snapshot-Format (Phase-0-Vertrag)

```jsonc
{
  "kind": "anthem_snapshot_v1",
  "repId": "rep-lichtenberg",
  "t": "<ISO-Zeit, 5-Min-Raster>",
  "loads": [0.0 .. 1.0]    // Reihenfolge = Origin-Net-Segment-Index
  // optional segmentIds[] nur, wenn Reihenfolge nicht garantiert werden kann
}
```

- **Keine Koordinaten.** Die App mappt `Index/segId → Geometrie` über das
  **Origin-Netz** (einmal geladen, statisch).
- Größe: ~1 Byte/Segment (vgl. `ResampledNet.loadArrayBytes`), passt zum
  Datengrößen-Budget.
- Presence-Anmeldung: App meldet Aufenthalt (Region/Boundary) → fordert
  Lastbewertung → erhält den aktuellen Snapshot der Representation.
- **Anthem trägt normalisierte Last `[0..1]`, NICHT Farbe** — die Farbe rechnet die
  Shell-Engine (`colorize`) app-seitig, weil die Komfort-Kaskade den Lastwert
  braucht. **Lebenszyklus:** presence-getakteter Pflichtzyklus mit 2 h-Hysterese
  (Presence → sofort + alle 5 Min rechnen; 2 h ohne Presence → Stopp, nichts
  vorhalten, Kaltstart). **Turbo-Slider** nur im Sim-MVP (zieht Sim-Snapshots zur
  Sim-Zeit `t`). **Volle Spec: `docs/anthem_snapshot_spec.md`.**

---

## Umbauplan — Phasen (jede deploybar)

| Phase | Inhalt | Berührt | Sichtbar |
|---|---|---|---|
| **0 · Vertrag** ✅ | Anthem-Snapshot-Format + Origin-Manifest + Segment-Adjazenz als Typen/Doc → `src/scim/sensus/packageContract.ts` (reine Typen) | neue types | — |
| **1 · Encoder** | reine `buildAnthemSnapshot(net, loads, repId, t)`; P09-t2 ruft sie, P11 nimmt sie als Anthem-Partikel | `src/scim/sensus/`, P09/P11 | P09/P11 zeigen Partikel |
| **2 · Worker + Presence** | `GET /api/anthem/:repId` (5-Min-Snapshot) + Schreibpfad; **Presence-Handshake echt bauen**: App sendet `presence-origin`-Anforderung (beim 1. Upload nach Shell-Install) → triggert den 5-Min-Zyklus. App-Anforderungsteil ist NEU. | `worker/src/index.ts`, `sensus-core-runtime` | Lichtenberg: Presence → Snapshot |
| **3 · App: Segment-ID** | `SvgSegment`→segment-id-keyed; App baut `segId→Geometrie` aus Origin-Net, färbt über Snapshot | `sensus-core-runtime` | App rendert Live-Last paket-only |
| **4 · Routing in die App** | Routing-Kern als Segment-Graph-Variante in geteilte Shell-Engine; App-BAK fährt die Komfort-Kaskade über Segmente + Live-Last | Shell-Engine, App-BAK | Kaskade lebt in der App |
| **5 · Guidance** | Auto-Segment-Vorschub, Next-Stop-Karte, „Route verlassen"-Hinweis; optional GPS | `sensus-core-runtime/.../guidance` | geführte Route |
| **quer · P09/P11** | P09 = vollständige listbare Partikel-Registry (Shell+Origin+Anthem); P11 = „Bezugs-Auftrag" je Representation, versioniert paketieren | P09/P11 | Bezug bestellbar |

**Abhängigkeiten:** 0 → 1 → 2 → 3 → 4 → 5. P09/P11-Ausbau läuft parallel ab Phase 1.

---

## Atomare Partikel & „Bezug" (P09 → P11)

- **Partikel** = unverzichtbare Daten-/Engine-Kapseln, nach Horizont in Shell/
  Origin/Anthem sortiert. Origin zählt heute 4 (boundary, net, poi-set, asset-set)
  mit realen Byte-Größen (`originPackage.ts`).
- **P09** soll **alle** Partikel erreichen + listen (Shell-Engines, Origin-Daten,
  Anthem-Schema).
- **P11** gibt den **Bezugs-Auftrag**: wählt je Representation die Partikel, hält
  den Representation-Bezug (Version/ID) und schnürt + versioniert die drei Pakete.

---

## Leitplanken (Anti-Dopplung · Mock-Erbe · Tests)

SCIM entstand als **Mock-Gerüst**. Vieles wird nicht mehr gebraucht, nach Zielerreichung
noch weniger — aber das bisher Gebaute ist **schön und übersichtlich**. Diese Arbeit
darf **keine verwirrende Dopplung** erzeugen.

- **Keine Dopplung:** Jede neue Sache **ersetzt oder konvergiert** ihren Vorgänger,
  statt daneben zu existieren.
- **Eine Quelle je Engine** (Shell), **eine Quelle je Begriff** (Spec).
- **Mock-/Altteile markieren, nicht jetzt aufräumen:** Ein echtes Aufräumen der
  **Navigations-Row** oder von **Panel-/Panel-Tab-Inhalten** ist **nicht absehbar**.
  Überholtes wird als *Legacy/deprecated* gekennzeichnet, nicht umgebaut.
- **Tests, Analysen, Reviews** gehören in **jede Phase** (nicht als Nachgedanke).

**Bekannte Dopplungs-Nähte (bewusst beobachten):**
1. **Engine-Doppelung (größtes Risiko):** Routing/Comfort liegen im Editor
   (`playbook.ts`/`netRoute.ts`) UND in der App (`brodaComfortKernel`/
   `brodaAvoidanceKernel`). Phase 4 **konvergiert** beide in die geteilte Shell-Engine
   — baut keine dritte Variante.
2. **Bundle-Doppelung:** alt `scim3_bundle_v1` (GeoJSON+Koords) vs. neu Shell/Origin/
   Anthem. Neu **löst ab**, alt = Legacy markieren.
3. **Format-Doppelung:** App `SvgSegment` (Koords) → Phase 3 **ersetzt** durch
   Anthem (segId-only), hält nicht beide.
4. **Begriffs-Doppelung:** BCK/BAK kanonisch nur in `komfort_kaskade_spec.md`.

## Was bleibt im Editor, was geht in die App

- **Editor (Build-Phase):** Netz resampeln, POIs, Boundary, Last *simulieren/messen*,
  Segment-Adjazenz ableiten, Pakete schnüren + publishen.
- **App (Laufzeit, nur über Pakete):** Snapshot holen, `segId→Geometrie` mappen,
  BCK Comfort-Hüllkurve, **BAK Komfort-Kaskade über Segment-Graph**, Guidance.
- **Hart & app-seitig:** Comfort-Rahmen (User-Schwelle), Standort (fix im MVP).

Siehe Komfort-Kaskade im Detail: `docs/komfort_kaskade_spec.md`.
