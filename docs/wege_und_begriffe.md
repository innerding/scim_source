# Wege & Begriffe — Daten- und Publishing-Pfade (aus dem Code gezogen)

Zweck: EINE nachprüfbare Karte der Daten-/Publishing-Wege und der Begriffe, die
darin vorkommen. Schwester zu `docs/begriffs_karte.md` (die Panels/Tabs erklärt);
hier geht es um die **Wege** (wer baut was, was reist wohin).

**Lesehilfe:** Jeder Begriff ist mit seiner Datei belegt → du kannst stichprobenartig
nachprüfen. `⚠` = wichtige Bruchstelle/Tangle. `(offen)` = noch nicht gebaut.
`(geparkt)` = gebaut, bewusst stillgelegt. Stand 2026-06-04.

---

## Die drei Orte

| Ort | Was | URL |
|---|---|---|
| **Editor / Werkbank** (`scim_source`) | Katalog, Pipeline, Capsuler, Publisher, Shell-Studio, Render-Kern | scim3.diesenpark.com |
| **Worker** (`scim_source/worker/src/index.ts`) | Cloudflare Worker: R2 + D1, alle `/api/*`-Endpoints | (Worker-URL) |
| **Runtime / ausgelieferte App** (`sensus-core-runtime`) | lädt Pakete, rendert Karte/POIs/Overlay | diesenpark.com |

---

## Weg 1 — Per-Rep-Publish (Editor → R2 → Runtime)

```
EDITOR (scim_source)
  Katalog (Plan-.md)  ┐
  Boundary/Geometrie  ├─► (1) PIPELINE  ──► generateScimBundle()  ──►  ScimBundle
  Wegnetz             ┘      regioContent.approved_pois              (schema 'scim3_bundle_v1')
                              × poiModel.evaluated_pois                     │
                                                                           ▼
                                                              BundlePublisher  (der „CTA")
                                                              PUT /api/packages/upload
                                                                           │
                                                                           ▼
                                                                    R2 + D1 (Worker)
                                                                           │
RUNTIME (sensus-core-runtime)                                              ▼
  lädt JSON via ?pkg= / Region-Index  ◄───────────────────  SensusCorePackage
  MapView: Boundary · public_pois · svg_overlay (vorgebacken)   (Spiegel-Schema von ScimBundle)
```

- **`ScimBundle`** = Editor-Export-Hülle, `schema: 'scim3_bundle_v1'`.
  Belegt: `src/scim/release-export/scimBundle.ts` (+ `.types.ts`).
- **`generateScimBundle()`** baut sie aus den **Pipeline-Modellen**
  (`regioContent.approved_pois` × `poiModel.evaluated_pois`) — Beleg: `scimBundle.ts` Z. 15/57/60.
- **`BundlePublisher`** = der Publish-CTA → `PUT /api/packages/upload`.
  Belegt: `src/scim/release-export/BundlePublisher.tsx`.
  ⚠ Gerendert im **Pipeline-Ergebnis-View** (`PanelResultContent.tsx` Z. 1000), **nicht** in einem P11-Tab.
- **`SensusCorePackage`** = das, was die **Runtime** liest (Spiegel-Schema).
  Belegt: `sensus-core-runtime/src/target-app/package/package.types.ts` + `package.loader.ts`.
- ⚠ **`ScimBundle` (Editor) und `SensusCorePackage` (Runtime) sind ZWEI Spiegel-Schemata.**
  Technische Schuld notiert (region als Pflichtfeld) „vor dem nächsten echten Paket-Export zu klären";
  geplante Migration `BundlePublisher → RepresentationPublisher + ColourMeshPublisher` (ann_030/031).
- ⚠ **Die Runtime isst heute MOCK-Fixtures**, nicht echte R2-Pakete.

---

## Weg 2 — Capsuler / Origin (per-Rep, „tief")  ⚠ NICHT mit Weg 1 verbunden

```
EDITOR
  Representation  ──► (2) CAPSULER  buildOriginPackage(rep)  ──►  Origin-Partikel
                          │                                       origin-boundary
                          │                                       origin-net
                          │                                       origin-poi-set  (POIs + Container-Schlüssel {geometry_id,color})
                          │                                       origin-asset-set (Icon-SVGs)
                          ▼
                Shell-Studio Test-Stand (Origin-Switch)  +  Anzeige-Panels (SichelViews, P09)
```

- **`buildOriginPackage`** = der Capsuler/Resolver.
  Belegt: `src/scim/sensus/originPackage.ts`.
- **Wer ruft ihn?** Nur `PanelWorkspace`, `ShellStudio` (Origin-Switch des Test-Stands), `SichelViews`.
  Belegt per grep — **nicht** Pipeline, **nicht** `generateScimBundle`.
- ⚠ **Folge:** Das publizierte ScimBundle (Weg 1) nutzt den Capsuler **nicht**. Der Capsuler
  (das „neue" Origin) speist heute nur den **Test-Stand** und Anzeigen. Die beiden Wege treffen
  sich noch nicht. (Das ist die „Bundle-Doppelung" aus `ziel_app_umbauplan.md`, hier konkret verortet.)
- **Test-Stand-Prinzip** (ann, `AiInterfacePanel.tsx`): „Origin an → `buildOriginPackage(rep)`
  (echte Geometrie/POIs/asset-set) · Anthem an → `produceAnthem`/`simSegmentLoads`. NICHT der Collector."
  → Echtes Lichtenberg-Material läuft also **im Shell-Studio bereits** über den Origin-Switch.

---

## Weg 3 — Anthem-Pulse (Live-Last, 5-Min)

```
EDITOR  P09: cap origin-mesh veröffentlichen  ──►  PUT /api/origin/:repId/mesh  ──►  R2
RUNTIME presence  ──►  POST /api/anthem/:repId/presence  ──►  Worker startet 5-Min-Zyklus
RUNTIME           ──►  GET  /api/anthem/:repId  ◄── Worker rechnet Snapshot (produceAnthem,
                                                     aus origin-mesh + (Sim-)Zeit)  =  loads[0..1]/Segment, KEINE Koords
RUNTIME useAnthemOverlay (⏸ GEPARKT)  → mappt segId→Geometrie, färbt live
                                       → bei null: Fallback auf vorgebackenes svg_overlay
```

- **Worker** teilt die Engine mit dem Editor (`produceAnthem`) → keine Dopplung. Belegt: `worker/src/index.ts` importiert `../../src/scim/sensus/anthemProducer`.
- **`useAnthemOverlay`** = der Live-Konsum in der Runtime, **gebaut aber geparkt** (kein echter Anthem).
  Belegt: `sensus-core-runtime/src/target-app/anthem/useAnthemOverlay.ts`. Stand-Notiz: Anthem-Pulse Station „konsumieren" (`anthemCycle.ts`).

---

## Weg 4 — Browse / Eintritt (cross-Rep)  (offen)

```
jede Rep: Capsuler-Fakten (nation/region/icon)
   └► Collector-Path (P11, OFFEN)  ──► Nation→Region→Rep-Katalog  ──► Launcher (OFFEN)  ──► wählt Bundle
Globe-Switcher (Edge):  QR → direkt zur Rep (Launcher überspringen)  ·  diesenpark.com → Launcher zeigen
```

- **Collector-Path** = Cross-Rep-Aggregat auf dem Publishing-Layer. ⚠ **NICHT** der Per-Rep-Publish-CTA.
  Belegt: `src/scim/ui/panels/CollectorView.tsx` („offener Posten").
- **Launcher** = globale Auswahl-Fläche (offen). **Globe-Switcher** = Eintritts-Weiche
  (`src/scim/ui/panels/GlobeSwitcherView.tsx`).
- Für *eine bekannte* Rep (Lichtenberg via `?pkg=`/QR) ist Weg 4 **nicht nötig**.

---

## Glossar (Begriff → was → wo belegt)

| Begriff | Was es ist | Datei |
|---|---|---|
| **Pipeline** | rechnet je Rep die Modelle (regioContent/poiModel …) | `src/scim/pipeline/scimPipeline.ts` |
| **Capsuler** (`buildOriginPackage`) | löst Origin-Partikel auf (boundary/net/poi-set/asset-set), Container-Schlüssel | `src/scim/sensus/originPackage.ts` |
| **ScimBundle** (`scim3_bundle_v1`) | Editor-Export-Hülle, per-Rep | `src/scim/release-export/scimBundle.ts(.types)` |
| **BundlePublisher** | Publish-CTA → R2 (`PUT /api/packages/upload`) | `src/scim/release-export/BundlePublisher.tsx` |
| **SensusCorePackage** | Runtime-Lese-Schema (Spiegel v. ScimBundle) | `sensus-core-runtime/.../package/package.types.ts` |
| **Worker** | R2/D1 + alle `/api/*` | `scim_source/worker/src/index.ts` |
| **Origin-Mesh** | resampeltes Netz (Segmente) für Live-Anthem | `PUT/GET /api/origin/:repId/mesh` |
| **Anthem-Snapshot** | loads[0..1]/Segment, koordinatenlos, 5-Min | `packageContract.ts`, `anthemProducer.ts` |
| **useAnthemOverlay** | Live-Anthem-Konsum (Runtime), geparkt | `sensus-core-runtime/.../anthem/useAnthemOverlay.ts` |
| **Shell-Render-Kern** | generische Render-Engine (Container/Composite/Cluster) | `src/scim/sensus/shellRenderCore.ts` |
| **Collector-Path** | Cross-Rep-Katalog-Aggregat (offen) | `src/scim/ui/panels/CollectorView.tsx` |
| **Launcher** | globale Auswahl-Fläche (offen) | — |
| **Globe-Switcher** | Eintritts-Weiche QR↔URL | `src/scim/ui/panels/GlobeSwitcherView.tsx` |

---

## Die wichtigsten offenen Bruchstellen (⚠)

1. **Weg 1 ↔ Weg 2 getrennt:** das publizierte Bundle (alt, pipeline-basiert) nutzt den
   Capsuler (neu, Origin) nicht. Konvergenz steht aus.
2. **ScimBundle ↔ SensusCorePackage:** zwei Spiegel-Schemata; region-Pflichtfeld-Schuld;
   Publisher-Split geplant — vor echtem Export zu klären.
3. **Publish-CTA sitzt nicht in P11**, sondern im Pipeline-Ergebnis-View.
4. **Runtime isst Mocks**, nicht echte R2-Pakete.
5. **useAnthemOverlay geparkt** (kein echter Anthem).
6. **Collector + Launcher offen.**

> Was „echtes Lichtenberg-Paket" praktisch heißt, hängt an Bruchstelle 1+2: entweder den
> alten ScimBundle-Weg pragmatisch nutzen, ODER zuerst Capsuler→Publish verbinden. Das ist
> eine bewusste Entscheidung, kein Detail — siehe `ziel_app_umbauplan.md`.

---

## GESETZ: SHELL-Paket vs. shell-kit (einzige Quelle der Wahrheit)

Konsens 2026-06-05. Auch als In-App-Invariante `ann_103` (AiInterfacePanel).

**Das SHELL-PAKET kommt AUSSCHLIESSLICH aus `shell-kit`.** `shell-kit` ist die
**einzige Quelle der Wahrheit** für den Shell-Teil — eine geteilte, git-getaggte
Bibliothek (Empfehlung D, siehe oben), die Editor (Shell-Studio), Runtime und später
Dashboards **referenzieren, nie kopieren**.

### Struktur
```
shell-kit/
  app/        ← die per-Rep-Shell, die ins Paket reist (Render-Kern, colorize,
              BCK/BAK, ComfortSliders, intro/reveal, guidance, drossler …) = „das Shell-Paket"
  launcher/   ← our-side-Flächen (Launcher, Kacheln „powered by diesenpark.com"),
              laufen auf unserer Seite und reisen NICHT per Rep mit
  shared/     ← (optional) Primitive, die beide brauchen — erst anlegen, wenn nötig
```

### Die drei Grenzen
1. **„Shell-Paket" = generischer CODE-Teil, nicht die volle Auslieferung.** Origin
   (per-Rep-Daten: Boundary/Netz/POIs/Icons) und Anthem (Live-Last) sind EIGENE
   Quellen, nicht aus shell-kit. Volle Auslieferung ans Gerät = **Shell ⊕ Origin ⊕
   Anthem**; shell-kit ist alleinige Quelle nur des Shell-Teils (zwei Takte: Code vs. Daten).
2. **Identität wird gestempelt, liegt nicht in shell-kit.** shell-kit ist generisch/
   identitätsfrei; Rep-Icon/Boundary/Name kommen aus Origin und werden beim Publishing
   aufgestempelt.
3. **shell-kit ⊇ was per Rep ausgespielt wird.** „Alles im Shell-Paket kommt aus
   shell-kit" ✓ (aus `shell-kit/app/`). „Alles in shell-kit reist in jedem Paket mit" ✗
   — das per-Rep-Paket ist eine Teilmenge (`app/`); Launcher & Co. (`launcher/`) bleiben
   unsere Seite.

### Rollen
- **Shell-Studio = Schaufenster/Prüfstand** (die *Ansicht*: jede Funktion sehen +
  prüfen, wie sie ins Paket geht).
- **shell-kit = Substanz** (die *Quelle*: der ausspielbare Code).
- Das Studio **rendert aus shell-kit** → was geprüft wird, **IST** was ausgespielt wird.
  Ein UI-Panel kann nicht die Quelle SEIN (es stellt nur dar); die Quelle ist ein
  Code-Modul, das der Build ins Paket bündelt.

**Stand:** `shell-kit` noch nicht aufgestellt (Repo-Lift offen). Erster geplanter
Schritt: shell-kit aufstellen, beginnend mit dem Comfort-Button (`ComfortSliders` +
`brodaComfortKernel`) als erstem Mitglied in `shell-kit/app/`.
