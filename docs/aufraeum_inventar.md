# Aufräum-Inventar — Kill-Liste (evidenzbasiert)

**Stand 2026-06-05.** Kandidaten, die im Umfeld des Anthem/Shell-Umbaus nicht mehr
gebraucht werden. **Disziplin (Konsens):** isolieren + markieren als Default;
**löschen erst auf persönlichen Commit des Operators**, pro Posten. Drei Klassen:

- **K1** — sicher tot, *diese Session* entstanden/verwaist → entfernen mit OK.
- **K2** — Dopplung, durch eine Restschuld abzulösen → im Zuge der Schuld konvergieren.
- **K3** — Legacy/Mock/Fallback, *load-bearing* → nur `@deprecated`/`LEGACY` markieren,
  löschen erst auf Commit.

Jede Referenz unten per `grep` geprüft (beide Repos + Worker + shell-kit).

---

## K1 · sicher tot (entfernen mit OK)

| # | Sache | Ort | Beleg (Referenzen) | Aktion |
|---|---|---|---|---|
| K1.1 | **shell-kit `produceAnthemSnapshot` + `AnthemSnapshot` + `ANTHEM_PERIOD_MIN` + `nextAtFor`** | `shell-kit/src/app/anthem.ts` | **kein Aufrufer.** Runtime holt jetzt `fetchAnthem` (Worker); der Worker nutzt den Editor-Encoder (`anthemEncoder`). Nur die **Last-Mathematik** (`produceAnthemLoads`/`simSegmentLoads`/`normalizeLoads`/`dayPhase`/`stretchAverages`/`classifyStretches`) wird genutzt (Worker via `anthemProducer`). | Snapshot-**Wrapper** entfernen, **Mathematik behalten**. (löst zugleich die „zwei Encoder"-Schuld) |
| K1.2 | **shell-kit `colorMesh`** (`buildColorMesh`/`MeshStretch`/`MeshSegment`/`LoadLookup`/`splitPolyline`) | `shell-kit/src/app/colorMesh.ts` + `index.ts`-Export | **kein Aufrufer.** Seit Per-Vertex-Färbung (10 m-Raster) färbt die Runtime ohne Re-Segmentierung. | Datei + Export entfernen. |

---

## K2 · Dopplung (im Zuge einer Restschuld konvergieren)

| # | Sache | Ort | Beleg | Aktion |
|---|---|---|---|---|
| K2.1 | **Editor-Render-Kern `shellRenderCore.ts`** (Dublette von shell-kit `render`) | `scim_source/src/scim/sensus/shellRenderCore.ts` | importiert nur von `poiCatalog.composite.ts` | **Sub-Schritt B:** `composite.ts` → `shell-kit` (render) umbiegen, `shellRenderCore.ts` löschen. |
| K2.2 | **Editor-`GEOMETRIES`** (Dublette von shell-kit `geometry`) | `poiCatalog.containerSystem.ts` (Def) + Re-Export `workspace.registry` | genutzt von `WorkspacePanel`, `DrawerPanel`, `containerSystem` | Auf shell-kit `GEOMETRIES`/`geometryOf` konvergieren (Registry-Re-Export umhängen), lokale Def löschen. |
| K2.3 | **Zweiter Snapshot-Encoder** | Editor `anthemEncoder.buildAnthemSnapshot` (live, Worker) ↔ shell-kit `produceAnthemSnapshot` (tot) | s. K1.1 | **Löst sich über K1.1**: shell-kit-Wrapper entfernen, Editor-Encoder = der eine Producer. |

---

## K3 · Legacy/Mock/Fallback (nur MARKIEREN, löschen auf Commit)

| # | Sache | Ort | Beleg | Aktion |
|---|---|---|---|---|
| K3.1 | **Alter Weg 1: `scim3_bundle_v1`** (GeoJSON+Koords) | `scim_source/src/scim/release-export/` (`scimBundle.ts`, `scimBundle.types.ts`, `BundlePublisher.tsx`) | referenziert in `AiInterfacePanel`, `CatalogTab`, `PanelResultContent` (+ Pipeline-Publish-CTA) | `@LEGACY` markieren (abgelöst durch Origin-Weg). **Load-bearing in der Editor-UI** → nicht jetzt löschen. |
| K3.2 | **Koords-Segment-Format `SvgSegment`** | Editor `svg-overlay/*`; Runtime `package.types.ts`, `MapView.tsx`, `buildOverlay.ts` | genutzt vom Demo-App-Pfad (`MapView`) + parked Overlay | `@LEGACY` markieren (Modell B = segId-only). Konvergiert mit der Demo-Ablösung. |
| K3.3 | **Parked Phase-3-Overlay** | Runtime `anthem/useAnthemOverlay.ts`, `anthem/buildOverlay.ts` | **kein Aufrufer** (von `OriginPreview` faktisch abgelöst) | markieren „parked, kein Aufrufer" → entscheiden: an OriginPreview heben oder cutten. |
| K3.4 | **Demo/Mock-Fallback** | Runtime `ui/DemoBadge.tsx`, `app/useAppMachine.ts` (`isMock`), `package/package.loader.ts` | aktiver Fallback, sichtbar markiert | **BEHALTEN bis persönlicher Lösch-Commit** (stehender Grundsatz). Nur gelistet. |

---

## Reihenfolge-Vorschlag

1. **K1.1 + K1.2** (sicher tot, shell-kit) — kleiner shell-kit-Release, beide Konsumenten ziehen nach. Sofort machbar.
2. **K2.1 (Sub-Schritt B)** + **K2.2** — Render-Kern/GEOMETRIES auf shell-kit konvergieren (eine Quelle).
3. **K3.x** — nur `@LEGACY`/`@deprecated`-Marker setzen; löschen, wenn DU committest.

**Marker-Konvention:** Datei-Header `// @LEGACY (2026-06-05): <warum> · Ablösung: <wodurch>`
bzw. `// @deprecated unbenutzt seit <…>` für K1.
