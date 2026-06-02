# Anthem-Snapshot — Spec (verbindlich)

**Status:** Design-Konsens 2026-06-02. Maßgeblich für die Anthem-Schicht des
paket-basierten Umbaus (`docs/ziel_app_umbauplan.md`, `docs/komfort_kaskade_spec.md`).

---

## Begriff

**Ein Snapshot = ein 5-Minuten-Lastbild**, das SCIM erzeugt und ausliefert.
Das **Anthem ist genau dieses ausgelieferte Artefakt** (das kurzfristige Paket im
Horizont Shell/Origin/**Anthem**). Die laufende Auslieferung ist eine **Folge von
Snapshots im 5-Min-Takt**.

- **Sim vs. echt:** Heute existiert nur eine **Sim-Telco** → jeder Snapshot ist ein
  **Sim-Snapshot = Sim-Anthem**. Das Format ist **quellen-agnostisch**; echte Telco
  tauscht später nur den Erzeuger, nicht den Vertrag.

---

## Erzeugung (SCIM-Seite)

Pro 5-Min-Schritt:
1. **Telco-Auslastung** abnehmen (heute: Sim via Playbook/Tageskurve).
2. **Auf die Boundary der Representation normalisieren** (z.B. Lichtenberg) —
   `normalizeLoads`, geклippt auf den Rep-Umriss.
3. **Segment-Last `[0..1]`** je Segment ableiten (Reihenfolge = Origin-Net-Index;
   Segment-ID-Format `stretchId#segIndex`, eingefroren).

**Wichtig — Last, nicht Farbe:** Anthem trägt die **normalisierte Last `[0..1]`**.
Die **Farbe rechnet die Shell-Engine (`colorize`) in der App** aus Last + Palette
(Palette liegt in Origin/colour-settings). Grund: die Komfort-Kaskade in der App
(Comfort-Check + BAK-Routing) braucht den **Lastwert**, nicht nur eine Farbe —
sonst kann sie nicht gegen die User-Schwelle prüfen oder Wege gewichten. „Farbcode"
ist das *Ergebnis*, nicht der *Übertragungswert*.

---

## Format

```jsonc
{
  "kind": "anthem_snapshot_v1",
  "repId": "rep-lichtenberg",
  "t": "<ISO-Zeit, 5-Min-Raster (Sim-Zeit im MVP)>",
  "loads": [0.0 .. 1.0]   // normalisierte Last je Segment, Reihenfolge = Origin-Net-Index
  // segmentIds[] nur, falls die Index-Reihenfolge nicht garantiert werden kann
}
```

- **Keine Koordinaten.** Die App mappt `Index/segId → Geometrie` über das **Origin-
  Netz** (einmal statisch geladen).
- **Größe:** ~1 Byte/Segment (vgl. `ResampledNet.loadArrayBytes`) — im Datengrößen-
  Budget.

---

## Lebenszyklus — presence-getakteter Pflichtzyklus mit 2 h-Hysterese

```
[Leerlauf]  keine Presence → SCIM rechnet NICHT, hält NICHTS vor (kalt)
    │
    │  erste origin-presence kommt rein
    ▼
[Aktiv]     - sofort erstes Anthem rechnen + ausliefern
            - danach alle 5 Min ein neues Anthem rechnen + ausliefern
            - jede weitere Presence frischt „zuletzt gesehen" auf
    │
    │  2 h ohne neue origin-presence
    ▼
[Leerlauf]  SCIM stoppt, verwirft alles → kalt
```

- **Trigger Start:** erste `presence-origin`-Information (App meldet Aufenthalt /
  erste Anforderung).
- **Presence-Handshake (echt, kein Sim-Shortcut):** Die Ziel-App schickt beim ersten
  Upload nach der **Shell-Installation** ein `presence-origin`-Anforderungssignal an
  SCIM — **identisch zum späteren Echtbetrieb ohne Simulation**. Dieses Anforderungs-
  teil der App **existiert noch nicht** und ist neu zu bauen (so, wie es später
  sinnvoll und richtig ist).
- **Trigger Ende:** 2 h nach der **letzten** `presence-origin`-Information.
- **Kein Vorrechnen, keine Vorhaltung** über den Live-Zyklus hinaus. Nach 2 h
  Kaltstart: die nächste eingehende Presence startet den Zyklus neu.
- Der erste Snapshot wird **on presence** gerechnet (deckt „liefert nach erster
  Anforderung aus").

---

## Erst-Bezug — Reveal-Choreografie

Der **erste Anthem-Bezug** der Ziel-App wird gestaffelt aufgebaut (füllt die Lücke
zwischen Presence-Signal und erstem Snapshot mit einem progressiven Reveal statt
Leerbild). Origin wird dabei **in Teilen** gestreamt, nicht als ein Blob:

0. **Shell** wird zuerst geladen — sie ist der **Orchestrator** und fordert alles
   Weitere **gestaffelt** an (nie alles auf einmal).
1. Die Shell fordert die **unsichtbare Boundary** an = das **Origin-Manifest**
   (Einstiegs-/Verlinkungselement): rahmt die OSM-Karte (bbox) **und** referenziert
   alle weiteren Origin-Schichten + den Anthem-Endpoint (gebunden an `repId`).
2. Die App **fokussiert gemächlich** auf die Boundary in der OSM-Karte — die
   Boundary wird dabei als **invertierte Maske** animiert (s.u.), nicht als bloß
   gezeichnete Linie.
3. **origin-net** (origin-wegnetz) blendet in **Weiß** ein.
4. **Anthem** legt sich über das Netz (Last→Farbe via Shell `colorize`).
5. **origin-rest** nacheinander: **asset-set · poi-set · pixel-charges**.

**Prioritäts-Entscheidung (load-first):** Anthem kommt in Schritt 4 — also **vor**
poi-set/asset-set. Der flüchtige „Puls" des Orts erscheint zuerst, die statischen
Punkte danach. Lade-Reihenfolge = Reveal-Reihenfolge; das Manifest (L0) hält die
Referenzen, die Shell zieht jede Schicht einzeln nach (vgl. P11 „Deploy-Reihenfolge
deklarieren").

**Origin gestaffelt (Manifest-first):** L0 origin-boundary (Manifest, unsichtbar,
rahmt+verlinkt) · L1 origin-net (weiß, Segment-IDs+Adjazenz) · *(Anthem-Strom)* ·
L2 origin-asset-set · L3 origin-poi-set · L4 origin-pixel-charges.

> **`pixel-charges`**: im MVP **nur ein Begriff**, kein Asset/Inhalt (reservierter
> Origin-Platz, leer). **Später: Pixel-Bilder für POI-Sheets** (Raster).

---

### Boundary-Reveal (invertierte Maske)

Die Boundary erscheint **nicht** als bloß unsichtbarer Rahmen, sondern als
**animierte invertierte Maske** — das *stille Einloggen* in die Representation:

- Beim Start gibt es **kein sichtbares OSM**, obwohl die Shell die Karte längst
  aufgerufen hat: davor liegt ein **weißer Screen** (Info „Lichtenberg" + Logo).
  Dahinter ist die Karte bereits **fokussiert**.
- „Lichtenberg" + Logo **blenden aus oder wandern** an ihren Zielort **links oben
  in den Header**.
- Im Zentrum **wächst die Boundary als Fenster**: der weiße Invert-Fill bekommt ein
  Loch in Boundary-Form, das die OSM **freilegt**. Gleichzeitig **dimmt der weiße
  Invert-Fill aus**, und der **Stroke der Boundary bleibt** stehen.

> **Bau-Ort:** Wird zunächst in **P07 als Prep** gebaut und im **Inspector**
> angezeigt — **nicht im Panel**.
> **Noch nicht bauen (nur notiert):** Logo + „Lichtenberg"-Schriftzug und ihr
> Wandern in den Header.

---

## Turbo-Slider (nur Sim-MVP)

Das **unterscheidende UI-Element des Sim-MVP** gegenüber der echten App. Da Sim-Zeit
raffbar ist, spult der Turbo die **Sim-Uhr** vor:

- **Globale Sim-Tageszeit:** Es läuft eine *globale* Sim-Uhr; die App **steigt ein**
  (startet `t` nicht bei Presence-Eingang neu). Sie fragt den Sim-Snapshot **zur
  Sim-Zeit `t`** an; **Turbo erhöht `t` schneller** → zieht die nächste Snapshot-
  Stufe. **Kein lokales Rechnen** in der App — sie bleibt reiner Konsument.
- Editor-Vorbild existiert: `simClock.ts`, Turbo-Leiter 5/10/20/30/60 Min.
- **Echte App:** kein Turbo — nur Echtzeit-5-Min-Bilder.

---

## Abgrenzung

- **Origin** (mittel, statisch): Geometrie, Segment-IDs, Adjazenz, POIs — einmal
  geladen.
- **Anthem** (kurz, 5 Min): nur die Last-Folge dieser Spec.
- **Shell** (lang): die Engines, u.a. `colorize` (Last→Farbe) und der BAK-Router.
