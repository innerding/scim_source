# ZWISCHENSTAND — Workspace, Tiefenschichtung & die Rolle der Boundary

*Stand 2026-05-30 · Validierung und Ordnung der Grundsatzgedanken vom 30.05.*
*Annotation: `ann_076` (Kategorie: Architekturentscheid, related_panel: workspace)*

## 0. Was dieser Zwischenstand ist

Eine Validierung der Grundsatzgedanken gegen den **realen** Code- und Vertragsstand.
Er erfindet die SCIM nicht neu — er ordnet das Gefühlte dem Vorhandenen zu und zieht
daraus **eine** Konsequenz für die Workspace-Ausrichtung.

## 1. Kernbefund: das Gefühlte hat reale Gegenstücke

Die in den Gedanken neu benannten Schichten existieren bereits — unter anderen Namen:

| Gefühlter Begriff | Reales Gegenstück |
|---|---|
| **Depth-Thetr** | `NavDepthTetraeder` (Tiefen-Tetraeder, ann_060). Drei Seiten-Faces: **Package Pipeline / Runtime Builder / Versionen** |
| **Control Sensus Core** | Sensus-Core-Paket + Vertrag: Panel 9 (Builder) → 10 (lokal) → 11 (Wirkungsprüfung) → 12 (Freigabe) |
| **Package-Versionierung** | Vertrags-Leitsatz: „die sichere, **reduzierte und versionierte** Übergabe an das Endgerät" |
| **Cosmo Controls** | `Navigator` — reale „Cosmo-Controls"-Oberfläche |
| **Packages** | Vertraglich definierte Sensus-Core-Pakete |

→ Der benannte **Architekturbruch ist real**: Tiefen-Tetraeder und Sensus-Core-Kette
existieren, aber die Übergabe *Depth → Sensus-Core → Cosmo-Controls* ist noch nicht
durchgezogen.

## 2. Tragende Wahrheiten (bestätigt)

- **„Im Workspace passiert mehr, als er zeigt."** — buchstäblich wahr (Commit-Logik,
  Handoff, Katalog-Bindung hinter Listen).
- **Umriss = semantischer Gatekeeper** — real: `pathEngine.anchorPois` (in/out-Test),
  Crop kappt am Umriss.
- **„Ein Workflow-Ergebnis gehört zu einem Package-Zustand, nicht absolut zum Workspace"**
  — exakt der Geist des Paketvertrags.
- **Boundary = gemeinsamer Anker / „Hitfeld"** — Boundary ist der Anker, auf den Katalog
  und Wegnetz *zeigen*.

## 3. Begriffshygiene (Warnung)

- Gefühlte Begriffe als **Erklärung** behalten, im Code/Doku aber bei den **existierenden
  Namen** bleiben (sonst zwei konkurrierende Namensräume).
- Als Vermutung markierte Sätze bleiben Vermutung — **nicht in Code härten**.
- **Colourmesh, Hitfeld, Package-Versionierung** sind bisher **Vertrag/Absicht**
  (Runtime/BAK, Panel 9–12), nicht laufender Code.

## 4. Die eine Konsequenz für die Workspace-Ausrichtung

> Der Workspace ist das **Kompositions- und Commit-Gate** für Pakete, verankert auf der
> Boundary. Er ist **nicht** die Sichtbarkeits-, Auswahl- oder Versionierungsinstanz —
> das ist der Versionen-Face/Sensus-Core-Layer.

- **F1/F2/F3 sind damit richtig ausgerichtet** (sie produzieren Paket-Dateien am
  Boundary-Anker).
- **Nicht** in den Workspace bauen: Versionsauswahl, Sichtbarkeits-Toggles, „welche R gilt".

## 5. Antwort auf „Gehören Representationen in den Workspace?"

**Gespalten:**

- **Geboren** im Workspace (Komposition Boundary + Katalog + Wegnetz → `data/representations/`).
- **Regiert** nicht vom Workspace: aktiv/sichtbar/historisch/experimentell entscheidet die
  **Versionen-Face / Sensus-Core-Kette**.

→ *Representationen liegen im Workspace, ihre Sichtbarkeit/Version gehört ihm nicht.*

## 6. Wozu die Boundary da ist (Engine-Regel, Vorform — gehört später ausgebaut zu Punkt 4)

1. **Anker / Identität**: einzige Stelle mit den exakten Koordinaten; Katalog & Wegnetz
   referenzieren per `geometry_id` (Mitgliedschaft = „zeigt auf denselben Kopf").
2. **Gatekeeper**: trennt POIs innen/außen, kappt das Wegnetz (Crop), erzeugt Gates.
3. **Hitfeld / Darstellung**: Repräsentationsfläche zur Laufzeit (Umriss zeichnen, Refresh,
   Geofencing).

## 7. Verortung zum MVP-Lichtenberg

Dieser Zwischenstand klärt **Punkt 2** (Workspace-Ausrichtung) und liefert die Vorform für
**Punkt 4** (Boundary-Engine-Regeln). Die offenen Leitfragen (Panel-Inventur,
Sensus-Core-Verdrahtung) bleiben für den späteren Bauplan (**Punkt 6**) markiert — nicht jetzt.

---

## Anhang — die sechs Intentionen (Rahmen bis MVP-Lichtenberg)

1. Gedanken validiert/geordnet als Annotation ZWISCHENSTAND ablegen. *(dieser Stand)*
2. Workspace fertigstellen + grobe Bauskizze aller beteiligten/fehlenden Panels bis MVP-Lichtenberg.
3. Drawer hochfunktional machen — eigene Zeichenwerkzeuge aus der Urversion der SCIM.
4. Klare Engine-Regeln formulieren (u. a. wozu die Boundary da ist — siehe §6).
5. UI/UX der Ziel-App MVP-Lichtenberg.
6. Detaillierter SCIM-Bauplan gemäß Punkt 2: was in welchem Panel geschieht, wie verdrahtet,
   wie die Technik auf der UI sichtbar/dokumentiert wird.

**Arbeitsreihenfolge (Operator-Entscheid):** A Punkt 1 darstellen → B als `.md` + Annotation
ablegen → C Workspace soweit abschließen → D konzentriert am Drawer weiter (mit etwaigen
Workspace-Konsolidierungen). Motto: *mehr Klarheit für den Workspace, mehr Klarheit für den
Drawer-Workflow.*
