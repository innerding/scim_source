# Thresholds-Umbauplan (P01) — Schichten, Reihenfolge, Beschriftung

**Status:** Plan 2026-06-06. Bau **nach** Freigabe, in einem Durchgang (kein iteratives
Drauflosbauen). Anlass: Regler sollen nach Wichtigkeit, verständlich beschriftet und
gestuft (einfach → fortgeschritten) sein; „System" ist der wichtigste Teil.

---

## Leitgedanke: drei Schichten, eine Last

Es gibt **eine** gemessene Last (heute Sim, später Telco). Darauf sitzen drei Schichten:

```
            ┌──────────────────────────────────────────────┐
   Last  →  │ (0) SYSTEM — Last sinnvoll machen             │  geteilt
            │     (Normalisierung: spread/floor)            │
            └───────────────┬──────────────────────────────┘
                            │  die „sinnvolle" Last
            ┌───────────────┴───────────────┐
   ┌────────┴─────────┐            ┌─────────┴──────────┐
   │ (1) MESH-FARBE   │            │ (2) COMFORT-SCHIEBER│   pro Fläche
   │ spectrum/bias/   │            │ Skala + Beschriftung │   unabhängig
   │ palette          │            │ (A: Dichte-Labels)   │
   └──────────────────┘            └──────────────────────┘
```

- **(0) SYSTEM ist das Wichtigste.** Es entscheidet, *wie sich die Last über die Skala
  verteilt* — damit das Mesh nicht durchweg grün und der Schieber nicht überreizt ist.
  Beide Flächen sitzen auf dieser einen normalisierten Last. **Stimmt System, stimmen
  beide.**
- **(1) und (2) sind die Darstellung pro Fläche** und kollidieren nicht miteinander —
  weil sie nur *einfärben/beschriften*, nicht die Last verändern.

---

## Reihenfolge & Stufen (so soll P01 aussehen)

### SYSTEM — am wichtigsten (immer sichtbar)
1. **„Spreizung / Absolut↔Relativ"** *(= spread)* — macht aus meist-niedriger Last eine
   sichtbare Verteilung. 0 = echte Werte (ruhig→grün), 1 = aktueller Bereich gestreckt.
2. **„Mindest-Sichtbarkeit"** *(= floor)* — die Spitze zeigt immer etwas Rot.

→ Diese zwei sind „System": sie verhindern *alles-grün* **und** *Schieber knallt*.

### MESH-FARBE — einfach (immer sichtbar)
3. **„Wie früh wird es rot?"** *(= spectrum)*
4. **„Grundton kühler/heißer"** *(= bias)*

### MESH-FARBE — fortgeschritten (ausklappbar)
5. **„Sicherheits-Aufschlag"** *(= safety)*
6. **„Abdimm-Schwelle"** *(= degradier)* — überlastete Strecken entdrängen.
7. **„Farbmodell"** *(= palette)*

### COMFORT-SCHIEBER — eigener Block (A)
8. **Dichte-Skala mit Beschriftung** — z. B. `<1/km` grün … `>1/m` rot, mit
   Unterteilungen. Das **User-Instrument**, unabhängig von (1).

---

## Mapping: neuer Regler ↔ bestehendes Feld (keine Daten-Migration)

| Neuer (klarer) Regler | colourSettings-Feld | heute zugeordnet |
|---|---|---|
| Spreizung absolut↔relativ | `spread` | P01 System |
| Mindest-Sichtbarkeit | `floor` | P01 System |
| Wie früh wird es rot | `spectrum` | P04 Load |
| Grundton kühler/heißer | `bias` | P02 Region |
| Sicherheits-Aufschlag | `safety` | P02 Region |
| Abdimm-Schwelle | `degradier` | P02 Region |
| Farbmodell | `palette` | P04 Load |
| Dichte-Skala (A) | **NEU** | — |

**Alle Felder existieren schon** in `colourSettings` (außer A). Der Umbau ist also
**Umsortieren + Beschriften + Stufen**, keine neue Daten-Struktur.

---

## Wie das Bestehende transformiert wird

- **Heute:** `ThresholdsView` zeigt drei Abschnitte **nach Horizont** (System/Region/Load),
  jeder ein generischer `ColourAdjust`. Verständlich nur für Eingeweihte.
- **Neu:** `ThresholdsView` zeigt **nach Wichtigkeit + Stufe** (System → Mesh-Farbe einfach
  → Mesh-Farbe fortgeschritten → Comfort-Schieber). Klartext-Labels statt Feldnamen.
- **Intern unverändert:** jeder Wert bleibt seinem **Horizont** zugeordnet (für die
  Versionierungs-Kadenz: System=lang, Region=mittel, Load=kurz). Nur die **Anzeige**
  ändert sich. `colourSettings` bleibt 1:1.
- **`ColourAdjust`** wird von „rendert ein Horizont-Set" zu „rendert eine benannte
  Regler-Gruppe" — oder durch eine neue, schlichtere Komponente ersetzt.

---

## Was fehlt (zu bauen)

1. **Dichte-Skala (A)** für den Comfort-Schieber — beschriftete Stützpunkte in
   Personen/Länge. *(Zahlen nominal bis echtes Telco; die Skala ist der Vertrag.)*
2. **Klartext-Labels + Stufen-UI** (einfach immer sichtbar, fortgeschritten ausklappbar).
3. **Trennung Schieber-Darstellung ↔ Mesh-Darstellung** sauber sichtbar machen
   (zwei Blöcke), auf der geteilten System-Last.

---

## Offene Entscheidung (vor dem Bau zu klären)

**Zeigt der Comfort-Schieber die *absolute Dichte* (A, roh/ehrlich) oder die
*System-normalisierte* Skala?**
- *Absolut:* ehrlich, aber bei niedriger Last steht der Schieber „unten im Grünen".
- *System-normalisiert:* sitzt mittig/ausgewogen, aber die Dichte-Labels sind dann
  relativ, nicht absolut.
- (Möglich: absolute Labels **anzeigen**, Schieber-Position aber auf der normalisierten
  Verteilung — Beschriftung absolut, Mechanik normalisiert.)

---

## Abgrenzung
Plan. Bau in einem Durchgang nach Freigabe. Keine `colourSettings`-Migration. Mesh-Farbe
und Schieber bleiben unabhängige Darstellungen auf der geteilten System-Last.
