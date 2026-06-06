# Thresholds-Umbauplan (P01) — finaler Plan vor dem Bau

**Status:** Design abgeschlossen 2026-06-06. Bau **nach Freigabe, in einem Durchgang**.
Ziel: Regler nach Wichtigkeit, in Klartext beschriftet, gestuft (einfach → fortgeschritten);
Orientierung als Bedeutungsträger.

---

## Grundmodell: eine Last, zwei Darstellungen

Es gibt **eine** gemessene Last (heute Sim, später Telco). Darauf sitzen:
- **Comfort-Schieber** (vertikal, User-Instrument) — daran wählt der User Comfort.
- **Mesh** (die Karte) — zeigt die Last farbig.

**Merksatz: Mesh = alles außer dem Wrap.** Die Skalen-Form gilt für beide; nur die
„Verjüngung" (der Wrap, ein reiner UX-Trick) wirkt **nur** auf den Comfort-Schieber.

---

## Regler-Bestand

### Skalen-Form — VERTIKAL (formt die Verteilung der Skala)
- **Spreizung (3 Regler, global)** — wirkt auf **Comfort UND Mesh**:
  1. **Mitte-Position** — wo die homogene Mitte sitzt.
  2. **oben heterogen** — wie stark der obere Bereich spreizt.
  3. **unten heterogen** — wie stark der untere Bereich spreizt.
  → Mitte gleichmäßig, Enden gespreizt. (Ersetzt das alte binäre `spread`.)
- **Verjüngung / Wrap (2 Regler, global)** — wirkt **nur auf den Comfort-Schieber**:
  4. **Verjüngung unten** · 5. **Verjüngung oben** — Striche laufen zu den Enden enger
  zusammen → weniger Rot-Fläche im Schieber, ohne das Mesh anzufassen.

### Farbsorten — HORIZONTAL (welche Farben)
- **2–6 Farb-Stops** (Default z. B. 3: grün · gelb · rot) — die prinzipiellen Farbwerte.
  Wirken auf **beides**. (Ersetzt das feste `palette`.)

### Orientierungs-Konvention
**vertikal = Skalen-Form · horizontal = Farbsorten.** Auf einen Blick lesbar.

---

## Ehrlichkeit (bewusste Entscheidungen)

- **Kein `floor` („immer etwas Rot").** Wäre unehrlich (Rot ohne Last). Gestrichen.
- **Keine Ruhe-Schwelle.** Nicht nötig.
- Die **Spreizung** zeigt Variation **wo wirklich Last ist** (relativ) — das ist die
  ehrliche Quelle für „genug Rot im Mesh".
- Die **Comfort-Schwelle** wird fürs **Abdimmen** auf die **echte Last zurückgerechnet**
  (entzerrt) — der Wrap verfälscht nur die Anzeige, nicht die Logik.

---

## Transform: heutige `colourSettings` → neues Modell

| heute | neu |
|---|---|
| `spread` (binär) | **Spreizung (3)** |
| `palette` (fest) | **Farbsorten (2–6 Stops)** |
| `floor` | **entfällt** |
| — | **Verjüngung (2)** — neu (Wrap, Comfort-only) |
| `spectrum`, `bias`, `safety`, `degradier` | **beim Bau klären** (s.u.) |

**Offen, beim Bau zu entscheiden:** wo die alten Farb-Kurven-Regler landen —
- `spectrum` (wie früh rot) / `bias` (Grundton) → vermutlich in **Spreizung**
  (Mitte-Position ≈ bias, Verteilung ≈ spectrum) **aufgegangen**.
- `safety` (Sicherheits-Aufschlag) / `degradier` (Abdimm-Schwelle) → sind **Mesh-Verhalten**,
  nicht Skalen-Form → entweder eigene horizontale Mesh-Regler **oder** zu BCK verschoben.

Heutige Anzeige sortiert nach **Horizont** (System/Region/Load); neu nach **Wichtigkeit +
Orientierung**. Intern bleibt jeder Wert seinem Horizont zugeordnet (Versionierungs-Kadenz).

---

## Zu bauen

1. **Spreizung (3)** + **Verjüngung (2)** als vertikale Regler.
2. **Farb-Stops (2–6)** als horizontale Regler.
3. **Wrap-Mechanik** (Comfort-Skala verzerren) + **Entzerrung** der Comfort-Schwelle fürs Abdimmen.
4. Stufen-UI (einfach immer sichtbar, fortgeschritten ausklappbar).
5. `colourSettings`-Felder erweitern (Spreizung-Tripel, Verjüngung-Paar, Stops-Array);
   alte Felder transformieren/ablösen (s.o.).

## Abgrenzung
Design fix. Bau in einem Durchgang nach Freigabe. Mesh-Farbe und Comfort-Schieber bleiben
zwei Darstellungen einer Last; nur der Wrap ist Comfort-exklusiv.
