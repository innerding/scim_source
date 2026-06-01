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

## Aktuelle Karte (in Arbeit)

| id (fix) | label | kurzLabel | konzept/rolle |
|---|---|---|---|
| `P07` | Boundary | `bou` | Boundary-Darstellung + Rep-Junction (Extraction entfällt — POIs aus Katalog) |
| `P08` | Wegnetz-Sampling | `wns` | merge → DP → resample → regelmäßiges Netz + Segment-id (vorher: „Graph + BasisLayer") |
| `P09` | Engine-Prep-Build | `epb` | bereitet POI/Last/Mask/Move für die Ziel-App (R06/R07) vor (vorher: „Engine (4 Modelle)") |

## Verabredete Struktur-Entscheidungen

- **Konvergenz:** die Pipeline (P07/P08/P09) konsumiert die *committete
  Representation*, nicht Mock — eine Welt.
- **P09-Spaltung:** P09 bereitet build-seitig vor; die echten Laufzeit-Engines
  (Last / Maskierung=BCK / Bewegung=BAK) liegen auf der Ziel-App in `R06`/`R07`.
- **Inspector:** kein Panel/Tab, sondern die Karten-Spalte; reiner Spiegel der
  Lieferartefakte (Vorgriff auf die Ziel-App-Darstellung).

## Offen (Phase 3 — Cosmo-Control-Sicheln)

- 3 Sichel-Hitboxen (Kreissegmente) bauen: `bou`/links→P07, `epb`/rechts→P09,
  `wns`/unten→P08. Aktivstellung wie die Faces.
- Bögen haben eine **Drehmechanik** (60°-Transmissions-Schwenk) — die **Sicheln
  dürfen nicht mitdrehen** (eigene, nicht-rotierende Gruppe).
- `loa`-Bogen öffnet heute P09 — dieser Klick-Draht wird abgesteckt; offen, wohin
  `loa` danach routet (Load-Thresholds).
