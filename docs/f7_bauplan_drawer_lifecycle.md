# F7-Bauplan (Neufassung) — Drawer-Zwei-Schichten, Speichern & Workspace-Commit

*Stand 2026-05-30 · ersetzt die Erstfassung · Annotation `ann_077`*

## Tragendes Prinzip

> **Die finale Boundary entsteht aus dem Netz, nicht umgekehrt.**
> B1/unmaskiertes Netz = OSM-Stufe (roh). B2/maskiertes Netz = unsere Stufe
> (künftiges Colour-Mesh). Der Commit behält die verfeinerte Stufe und wirft die
> rohe weg. Der Draft hält den Rohzustand; der Commit friert ein (Backend).

## Modell — zwei Schichten je Draft

| Schicht | Boundary | Wegnetz | Reife-Farbe | am Commit |
|---|---|---|---|---|
| **Arbeit** | B1 (Referenz) | `net_unmasked` (OSM-roh) | gelb / orange | **stirbt** |
| **Final** | B2 (= Maske) | `net_masked` (zugeschnitten) | **rot** | **wird committet** |

- **gelb** = `net_unmasked` da, kein Katalog
- **orange** = + Katalog
- **rot** = `net_masked` existiert → **committbar** (nur rot ist im Workspace committbar)

## Drei getrennte Aktionen

- **Beschneiden-Toggle** (Drawer, Wegnetz-Tab): an → `net_masked` **erzeugen** (Crop von `net_unmasked` mit B2) + anzeigen; zurück → `net_masked` **löschen**, `net_unmasked` anzeigen. Reversibel, rein lokal, persistiert nichts.
- **Speichern** (Drawer): friert den **aktuellen** Zustand → maskiert gespeichert = **rot** (beide Netze im Draft), sonst gelb/orange. Draft bleibt editierbar.
- **Commit** (Workspace): nur bei **rot** → behält B2 + `net_masked` + Representation; **tötet B1 + `net_unmasked`**. Backend-Crop ist im `net_masked` bereits enthalten. Überschreibbar bei erneutem Commit.

## Farb-Zustände der B2 (Start-Styling — live anpassbar)

| Zustand | Wo | Stroke |
|---|---|---|
| aktiv maskiert (im Drawer am Arbeiten) | Umriss / Wegnetz | dashed-blau / rot-schraffiert |
| gespeichert (roter Draft, in Ruhe) | nach „Speichern" / Workspace | **solid blau** |
| committet | Workspace-Kartenframe | solid blau |

Übergänge: Öffnen eines roten Drafts → aktiv (dashed-blau/rot-schraffiert);
Speichern → solid blau; ohne Commit erneut öffnen → wieder aktiv.
**Hinweis:** die genauen Strokes sind cosmetic und werden am Bildschirm feingetunt,
nicht in Worten festgenagelt.

## Daten-Modell (`draftStore`)

```
Draft {
  reference (B1)      // OSM-grobe Boundary; stirbt am Commit
  boundary  (B2)      // finale Maske; wird committet
  net_unmasked        // OSM-roh; stirbt am Commit
  net_masked          // zugeschnitten; wird committet
  catalog_id
}
```
Reife-Farbe (gelb/orange/rot) leitet sich aus (reference/boundary, catalog_id, net_masked) ab.

## Bau-Schritte (gestaffelt, je deploybar)

1. **Fundament — `draftStore` (Daten, null Optik):** `net` → `net_unmasked` + `net_masked`; 3-Farben-Logik (gelb/orange/rot). *Zuerst, weil Drawer + Workspace darauf lesen/schreiben.*
2. **Drawer:** Beschneiden-Toggle (erzeugt/löscht `net_masked` + Anzeige), echter **Speichern**-Button (persistiert aktuellen Zustand inkl. Netze), redundante Buttons raus (Übergeben + „Ready for Commit"). B2-Strokes nach Start-Styling, dann live tunen.
3. **Workspace:** Pipeline zeigt 3 Farben; **Commit nur bei rot** → B2 + `net_masked` + Representation; B1 + `net_unmasked` fallen weg; Kartenframe rot→blau. Alte Übergabe-Karte + F1/F2/F3 + Handoff (`scim3:represent_handoff`) raus.

**Reihenfolge-Begründung:** der Drawer ist der Produzent roter Drafts, der Workspace
der Verbraucher — Commit erst sinnvoll, wenn der Drawer rot erzeugen kann.

## Was wegfällt
- Auto-Speichern → **explizites Speichern**.
- Alte „An Workspace übergeben"-Karte + Handoff.
- Einzel-Buttons F1/F2/F3 → **ein** Commit.
- Der „Ready for Commit"-Morph (war ein Irrweg).
- Der destruktive Crop-Button im Drawer (Crop ist Backend, am Commit).
