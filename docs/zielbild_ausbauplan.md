# Zielbild & Umbau-/Ausbauplan (konsolidiert · 2026-06-02)

Dies ist die **Dachseite**: kurzes Zielbild, die aktuelle Landkarte, der Ist-Stand
und der neue, sequenzierte Plan. Details bleiben in den Einzel-Specs (eine Quelle je
Thema) — hier nur Synthese + Reihenfolge.

## Zielbild (kurzfristig)

Eine **Ziel-App** über **sensus core** und seine Pakete **Shell · Origin · Anthem**
per **git / Cloudflare R2** ausspielen. Die App (Runtime Shell, R01) lädt die Pakete,
meldet ihren Aufenthalt (`presence-origin`) und bekommt alle 5 Min einen **Anthem-
Snapshot** (Last je Segment, ohne Koordinaten, mit Segment-ID). Die **Komfort-Kaskade
(BAK)** läuft **lokal in der App** über einen Segment-Graphen. **Lichtenberg** ist die
Vorzeige-Representation.

## Die Landkarte (Rollen — autoritativ, Begriffs-Karte 2026-06-02)

**Shell/Origin/Anthem sind PUBLISHING-Begriffe — sie entstehen erst ab P11.** Davor
*baut* jede Rolle ihr Paket:

| Panel | Rolle (neu) | baut → wird zu | Sichel |
|---|---|---|---|
| **P06** | Transmitter (Anthem-Builder) | Anthem | Mesh |
| **P07** | High-Shell (App-UI/UX · Intro/Boundary/Reveal) | Shell (high) | links |
| **P08** | Deep-Shell (Engine-Prep · colorize/BCK/BAK) | Shell (deep) | rechts |
| **P09** | Origin-Capsuler (Atomic Particles · Boundary/Wegnetz-Sampling/POIs/Assets) | Origin | unten |
| **P11** | Sensus Core Publishing | schnürt Shell(high⊕deep)·Origin·Anthem, versioniert, spielt aus | Apex |
| **R01** | Runtime Shell (App-Grundhülle/Wirt, kein Analyse-Tool) | — (führt aus) | Mond |

- **Shell = High-Shell ⊕ Deep-Shell.** IDs eingefroren; Label/Konzept/Sichel-Position frei.
- **presence-origin** hat zwei Enden: Uplink App→Transmitter (Einatmen), Downlink
  Anthem→App (Ausatmen).

## Doku-Familie (eine Quelle je Thema)

- `docs/begriffs_karte.md` — Rollen/Namen, Sichel-Modell, Shell-Paket vs Runtime Shell.
- `docs/ziel_app_umbauplan.md` — Modell B (App routet selbst), Pakete, Leitplanken.
- `docs/anthem_snapshot_spec.md` — Anthem-Format (Last, nicht Farbe), Lebenszyklus
  (2 h-Hysterese), Reveal-Choreografie (invertierte Maske), Turbo (Sim-MVP).
- `docs/komfort_kaskade_spec.md` — BAK-Kaskade (Ausweich → Wegpunkte umgehen →
  Alternativ, Comfort-Maximierung), Longpress-Via.
- `src/scim/sensus/packageContract.ts` — Vertragstypen (AnthemSnapshot · OriginManifest
  · SegmentAdjacency · SegmentId).

## Ist-Stand (gebaut)

- **Phase 0**: Vertragstypen (`packageContract.ts`).
- **Origin-Manifest-Builder** (`originManifest.ts`) — derzeit in P11 verdrahtet.
- **Kaskade S6** (Alternativroute-Basis) im Editor-Playbook.
- **Sichtbarkeit**: P07 Boundary-Ring + Reveal-Prep · P08 Pipeline-Vergleich · P09
  Engine-Artefakte (produces live an Rep) · P11 Reigen + Auftraggeber + Kapsel · R01
  Runtime-Shell-Ansicht · Threshold-Bögen aufgeräumt · Start-Performance gefixt.
- **Bekannte Altlasten**: `source` zeigt `<xy>` (falsches rep-Signal in P09), Reigen
  zeichnet noch die alten Sichel-Rollen — **lösen sich in der Migration** (s.u.).

---

## Plan A — Migration (Rollen-Neuzuordnung in Code)

Reihenfolge nach Risiko. Inhalt und Label sind teils gekoppelt (Leitplanke: keine
Label/Inhalt-Mismatches) → Inhalt wandert mit dem Label.

| Schritt | Tut | Risiko |
|---|---|---|
| **M1** ✅-jetzt | Relabel **P07→High-Shell**, **P11→Sensus Core Publishing** (Inhalt passt schon: P07=Boundary/Reveal, P11=Publishing). Begriffs-Tabelle nachziehen. | klein |
| **M2** | **Engine ↔ Sampling tauschen**: Engine-Prep-Inhalt P09→**P08** (Relabel Deep-Shell); Wegnetz-Sampling-Inhalt P08→**P09** (Relabel Origin-Capsuler). | mittel |
| **M3** | **Intro/reveal-engine** P09 → **P07** (High-Shell). | klein |
| **M4** | **Capsuler-Heimat**: `buildOriginManifest` + Kapsel-UI P11 → **P09**; dabei **rep-Signal-Bug fixen** (echte aktive/gewählte Rep) → heilt `source=<xy>`. | mittel |
| **M5** | **P11 = Publishing**: Reigen **neu zeichnen** auf den Builder-Plan (P06→Anthem · P07/P08→Shell · P09→Origin → schnüren). | mittel |
| **M6** | **Sichel-Rotation**: P08↔P09 Positionen (Tetraeder-SICKLES + Navigator-Mapping). | mittel |

## Plan B — Ausbau (Richtung Ziel, am richtigen Ort)

| Phase | Tut | Ort |
|---|---|---|
| **1** | **Anthem-Encoder** `buildAnthemSnapshot` (Last→segId-Snapshot) | **P06 Transmitter** |
| **2** | **Worker** `GET /api/anthem/:repId` + **Presence-Handshake** (App sendet `presence-origin`) | worker + Runtime |
| **3** | **App konsumiert** segId-Snapshot statt Koords; `segId→Geometrie` aus Origin | sensus-core-runtime |
| **4** | **Routing-Konvergenz**: Segment-Graph in die geteilte Shell-Engine; BAK-Kaskade in der App | Shell-Engine/App |
| **5** | **Guidance** vervollständigen (Auto-Vorschub, Next-Stop, „Route verlassen") | App |

Querschnitt: Origin gestaffelt (Manifest-first), Segment-Adjazenz in Origin; deferred:
Logo/„Lichtenberg"-Header-Animation im Reveal.

## Plan T — Transmission-Umbau (Konsens 2026-06-03)

Der **Transmitter atmet**; die drei Bögen sind seine Anatomie. ID-Strategie:
die drei Threshold-IDs werden die drei Transmitter-Bögen (IDs eingefroren, Rollen
wandern).

| Bogen | Position | ID | Rolle |
|---|---|---|---|
| **Thresholds** | oben links | **P01** | System → Region → Load gestaffelt |
| **Telco** | oben rechts | **P04** | Quelle: Simulation · Sim-Clock/Turbo · presence-Intake · Normalization |
| **Coder** | unten | **P02** | Anthem-Encoder (`buildAnthemSnapshot`) |
| **Transmitter** | Mesh | **P06** | Ausatmen: Anthem-Auslieferung |

Atem-Flow: **Telco (ein) → Thresholds (deuten) → Coder (packen) → Transmitter (aus → Runtime).**

**Zuordnungen (geklärt):** presence-origin-intake = Telco (Empfangsschirm; Gegenstück
zum Origin-Manifest-Builder in P09 — dieser schreibt die `anthemEndpoint`-Adresse,
presence klopft daran). Sim-Clock/Time-Turbo + Simulation = Telco. Anthem-Auslieferung
= Transmitter. Runtime = Empfänger/Decoder. Bibliothek = Versionen (Mond).

**Schritte:** T1 Thresholds vereinen (P01, gestaffelt) · T2 Bögen ummappen + Glyphen
(LL→P01, OR→P04, unten→P02; Labels Telco/Coder) · T3 Simulation→Telco (P04) +
presence/Normalization · T5 Transmitter (P06) = Ausspielung, Atem-Anatomie-View ·
**T4 Coder = Anthem-Encoder** (`buildAnthemSnapshot`, = Plan-B-Phase-1, substanziell).
Reihenfolge: T1 → T2 → T3 → T5 → T4.

## Leitplanken (unverändert)

Mock-Erbe ist schön gebaut — **keine verwirrende Dopplung**: neu ersetzt/konvergiert,
eine Quelle je Engine/Begriff, Altes als Legacy markieren statt umbauen, Tests/Analysen
in jede Phase. Nav-Row/Panel-Cleanup nicht erzwingen.
