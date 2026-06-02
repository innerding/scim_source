# Begriffs-Karte (SCIM Panels/Tabs)

Eine Wahrheit für die Benennung. Hintergrund: SCIM-Begriffe finden sich erst und
ersetzen anfangs angenommene, damit das System menschenlesbarer wird. Damit der
Code (und die Maschine) dabei den Halt nicht verliert, gilt:

## Prinzip: ID einfrieren, Label entwickeln

- **`id` — fix, load-bearing.** Eine stabile, eindeutige Zeichenkette. Mal ein
  Code (`P01`–`P14`, `R01`–`R08`, `V01`–`V03`), mal ein Wort (`workspace`,
  `geometry_editor`, `catalog`, `system`, `ai_interface`). Das Tetraeder hat
  einen eigenen ID-Raum (`geometry_draw`, `sensus_core_build`, `system_adjust`,
  `regio_content`, `load_thresholds` …). Dem Code ist der *Inhalt* egal — er
  braucht nur *fix + eindeutig*. **IDs niemals umbenennen** (Routing,
  `contextKey`, `KOSMOLOGIE_IDS` hängen dran).
- **`label` — frei änderbar.** Reiner Anzeigetext (Navigator, Panel-Header).
- **`kurzLabel` — frei änderbar.** 3-Letter-Kürzel für die Cosmo-Controls.
- **`konzept/rolle`** — `shortDescription` + `helpText`, frei.
- **`bauKonzept`** — temporäre Detailsätze, im Panel als „Baukonzeptnotiz"
  sichtbar, solange noch nichts gebaut ist; später entfernbar.

Beweis, dass das trägt: der **Drawer** heißt im Label „Drawer", seine `id` ist
weiterhin `geometry_editor` — Label neu, ID stabil, nichts brach.

## Rollen-Neuzuordnung — Builder-Modell (Konsens 2026-06-02, AUTORITATIV)

**Kernlinie:** Die Paketnamen **Shell · Origin · Anthem sind Publishing-Begriffe —
sie entstehen erst *ab* Sensus Core (P11).** Davor stehen die **Bauer** mit eigenen
Namen; jede Rolle *baut* ihr Paket.

| id (fix) | Name (neu) | baut → wird bei Publishing zu | Sichel/Ort |
|---|---|---|---|
| `P06` | **Transmitter** (Anthem-Builder) | → **Anthem** | Mesh |
| `P07` | **High-Shell** (App-UI/UX · Intro/Boundary/Reveal) | → **Shell** (high) | Sichel **links** |
| `P08` | **Deep-Shell** (Engine-Prep · colorize/BCK/BAK) | → **Shell** (deep) | Sichel **rechts** |
| `P09` | **Origin-Capsuler** (Atomic Particles · boundary/Wegnetz-Sampling/POIs/Assets) | → **Origin** | Sichel **unten** |
| `P11` | **Sensus Core Publishing** | schnürt Shell(high⊕deep)·Origin·Anthem, versioniert, spielt aus (→ R2) | Apex |

- **Shell = High-Shell ⊕ Deep-Shell**, **Origin = Capsuler-Partikel**, **Anthem =
  Transmitter** — diese drei Worte fallen **erst bei P11**.
- **P11 baut nichts mehr** — Assembler/Publisher. Der **Reigen** lebt hier als
  Übersicht des Bauplans.
- **Sichel-Rotation:** P07 links (Rolle neu), P08 → rechts, P09 → unten. **IDs
  eingefroren**, Label/Konzept/Sichel-Position frei (Prinzip oben).

**Wo die Builder-Funktionen zuhause sind:**
- **Origin-Manifest-Builder** (`buildOriginManifest`, gebaut) → **P09 Origin-Capsuler**
  (zieht aus P11 dorthin).
- **Anthem-Encoder** (`buildAnthemSnapshot`, offen) → **P06 Transmitter**.
- **Intro/reveal-engine** → **P07 High-Shell** (raus aus P09; „Engine-Prep & Origin
  Capsulation" war die Fehl-Verklebung).

**Status:** Karte beschlossen. **Code-Migration offen** (eigener Schritt). Die
aktuellen `source`-/Reigen-Befunde (P09 zeigt `<xy>`, Reigen zeichnet alte Rollen)
lösen sich **bei dieser Migration** auf — nicht vorher draufflicken.

---

## Aktuelle Karte (in Arbeit · Vor-Migrations-Stand, Code trägt noch alte Labels)

| id (fix) | label | kurzLabel | konzept/rolle |
|---|---|---|---|
| `P01` | System Thresholds | `sys` | System-Belastungsdaten/Schwellen · Grundparameter der SCIM-Instanz (Mock-state). Bogen `sys` |
| `P02` | Region Thresholds | `reg` | Regio-/Representations-Belastungsdaten/Schwellen · Grundparameter der Regio-Instanz (Mock-state). Bogen `reg` (vorher `rou`/„Route") |
| `P04` | Load Thresholds | `loa` | Load-Belastungsdaten/Schwellen · Grundparameter der Telco-Quelle (Mock-state). Bogen `loa` |
| `P07` | Boundary | `bou` | Boundary-Darstellung + Rep-Junction (Extraction entfällt — POIs aus Katalog). Sichel links |
| `P08` | Wegnetz-Sampling | `wns` | merge → DP → resample → regelmäßiges Netz + Segment-id (vorher: „Graph + BasisLayer"). Sichel unten |
| `P09` | Engine-Prep-Build | `epb` | bereitet POI/Last/Mask/Move für die Ziel-App (R06/R07) vor (vorher: „Engine (4 Modelle)"). Sichel rechts |
| `P11` | Sensus Core Services | `scs` (Face) | ordert die atomaren particles von P07/P08/P09 und schnürt **Shell · Origin · Anthem** (+ Version + Deploy-Reihenfolge); Scheduling später: Transmitter (vorher: „Package"/„Service"; Face-Kürzel scb→scs) |

**Drawer (geometry_editor)** Tab-Struktur: obere Ebene (globale TabBar) **Karte | Icon**; **Umriss/Wegnetz** sind interne Sub-Tabs *unter* Karte. **Icon** (oberer Tab) zeigt vorerst nur Baukonzeptnotiz (Pro-Editor-Konzept: 48/24, fill/stroke-Layer (auch bare stroke ohne Gruppe), Raster+Snap, Werkzeuge: variable Stroke-Breiten 0.20er, Stroke→Fill, Boolean Subtract/Union → Node-Explosion → DP-Node-Begrenzer; Import drag+drop (Raster=Pausschicht, .svg+live-Node-Zahl), Cleaner erweitert svg_cleaned (Illustrator/Tabler), Export+Provenienz (Quell-SVG metadata, Build-Cleaner streift ab); max 60/Icon, Ø~40/Set) (regelbasierter SW-Icon-Editor; 48×48 Viewport / 24×24 Fläche; fill/stroke-Layer; max 60 Nodes/Icon, Ø~36-40/Set; später Inspector zeigt Icon im Container-Umfeld + Animationen). Kein Karte; Overlay über dem Canvas. Ist-Stand Katalog-Set: Ø ~38 Nodes, max 96 (boots-hafen vereinfacht).

**Zeit-Horizonte (Threshold-Panels):** Load=kurzfristig · Region=mittelfristig · System=langfristig → drei Pakete, organisiert von den **Sensus Core Services (P11)**. Nicht redundant, sondern drei Geltungsbereiche. (Code-Rest: P01/P02 teilen noch dieselben Slider-Feldnamen — späterer Angleich.)

**Sensus-Core-Paket-Trio (Stand 2026-06):** **Shell** (long; Engine-Suite dompteur/colorist/BCK/BAK + container) · **Origin** (mid; origin-particles, erbt Representation-Version) · **Anthem** (short; Zwei-Wege-Atem: Einatmen `presence-origin` als Gate → Ausatmen `load-values`). Deploy-Reihenfolge: 1 Shell · 2 presence-origin (Gate) · 3 origin-wegnetz · 4 load · 5 origin-rest; MVP (origin via URL): 1 → 3 → 5. `presence-origin` = Uplink-Selektor (App→System), kein origin-Partikel.

**Threshold-Panels (P01/P02/P04) haben je 3 Tabs (Empfangsschirm-Fluss):** Signal Intake (text-first) → Analysis/Hypothesis (text-first) → **Adjust** (echte Schwellen-Slider; SCS verpackt sie). Tab-System dafür um panel-eigene Tabs mit optionalem `body`-Text geöffnet.

Bögen = Empfangsschirme: Schwellen sind Paket-Variablen, die die Runtime-Daten direkt
verändern (unabhängig von Versionierung); die User-App-Signale „erzählen" auf den Schirmen
ihre Geschichte und begründen Schwellen-Änderungen. Schwellen-Slider liegen real noch
dreifach (P01/P02/P08) — Entwirren ist ein eigener späterer Schritt.

## Verabredete Struktur-Entscheidungen

- **Konvergenz:** die Pipeline (P07/P08/P09) konsumiert die *committete
  Representation*, nicht Mock — eine Welt.
- **P09-Spaltung:** P09 bereitet build-seitig vor; die echten Laufzeit-Engines
  (Last / Maskierung=BCK / Bewegung=BAK) liegen auf der Ziel-App in `R06`/`R07`.
- **Inspector:** kein Panel/Tab, sondern die Karten-Spalte; **SCIM-interner**
  Spiegel der Build-/Lieferartefakte (System-Build-Mirror). NICHT die Ziel-App —
  die rendert lokal/eigenständig; der Inspector führt deren Engine nicht aus.

## Phase 3 — Cosmo-Control-Sicheln (GEBAUT)

- 3 Sichel-Hitboxen (Kreissegmente) im Tetraeder: `bou`/links→P07,
  `wns`/unten→P08, `epb`/rechts→P09. Aktivstellung wie die Faces. In eigener,
  **nicht-rotierender** Gruppe (Bögen schwenken 60°, Sicheln nicht).
- `loa`-Klick: war P09 → jetzt **P04** (Load/TelcoLoad — ursprüngliche Intention).
- `KOSMOLOGIE_IDS`: P04 (Arc), P07/P08/P09 (Sicheln) eingetragen → Navigations-
  Titel **und** Panel-Header dimmen automatisch (eine Regel: `dimmed =
  KOSMOLOGIE_IDS.has(id)` — grau = hat Cosmo-Heimat, schwarz = keine).

## Cosmo-Controls & Panel-Tabs (Stand)
- **Inspector** = „Inspector System-Build-Mirror" (Header + Navigator-Trapez-Hover).
- **Tetraeder-Glyphs** statt 3-Letter-Codes: geo=Stift · org=Kettenglied · cat=Bild · scs=Paket (scb→scs); Sicheln bou=4-Knoten-Polygon · wns=Sampling · epb=Zahnrad; Bögen sys/reg/loa = Blitz + Slider/Schild/Load.
- **Panel-Tabs** (text-first, Baukonzept jeweils im 2.): P07 = Boundary-Darstellung · Rep-Junction. P08 = Quell-Netz · Sampling · Mesh-Output. P09 = POI · Last · Mask · Move. (generische Tab-Handles t1–t4: id fix, Label trägt Bedeutung.)
- **`poiCatalog.composite`** = **SCIM-interner** Renderer (Katalog + Inspector, Operator-Anzeige). **NICHT** das Ziel-App-Rendering — die Ziel-App läuft **lokal, ohne SCIM**, und rendert eigenständig. **P09-POI** = Erklär- + **Rescue-Seite**: birgt bei Ausspielung die Function als **versionierte, selbst-enthaltende Kapsel** (Inhalts-Hash/Diff: geändert vs. zuletzt ausgespielt) → **Sensus Core Services** → App-Shell-Paket (long-horizon, **Teil MVP-Lichtenberg**). SCIM, P09-POI und Ziel-App sind drei getrennte Laufzeiten/Rollen.

## Noch offen
- Phase 4: echte Funktion in den P07/P08/P09-Tabs + P08-Resampler.
