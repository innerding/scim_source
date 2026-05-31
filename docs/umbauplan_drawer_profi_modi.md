# Um-/Ausbauplan — Drawer: Profi-Dropdown + ~6 Haupt-Werkzeuge

*Stand 2026-05-31 · baut auf `project_drawer_modi_konsolidierung` + `project_wegnetz_ziel`*

## Ziel & Prinzip

Die Wegnetz-Leiste hat heute ~7 Sektionen mit Dutzenden Reglern. Ziel: **ca. 6
Haupt-Werkzeuge** decken den Arbeits-Flow, **immer nur eines aktiv**; alle
selten gebrauchten Default-/Hintergrund-Einstellungen wandern in ein
**expandable Profi-Dropdown** (eingeklappt). Nordstern bleibt: schnell ein
sackgassenfreies Netz, einzige degree-1-Enden = POIs.

„Ein Werkzeug aktiv" macht Karten-Klicks eindeutig (löst nebenbei das
Anwahl-Stabilitätsproblem an Way-Stößen).

## Die Haupt-Werkzeuge (Flow-Reihenfolge)

| # | Werkzeug | Regler / Aktion | Status |
|---|----------|-----------------|--------|
| 1 | **Anwenden** | OSM laden (Boundary → Overpass → Render) | da |
| 2 | **Netz** | Netz-Schwelle (Länge) → schwarz/grün | da (E2) |
| 3 | **Verbinden** | Verschmelzen-Toleranz (auto) + manuelle Verbindung Wanderwegpunkt→Wanderwegpunkt | auto da (E3); manuell = neu |
| 4 | **Sackgassen** | rot anzeigen · MVP unkompliziert entfernen · blau behalten/später | rot/blau da; entfernen = neu |
| 5 | **Wege/Straßen** | lila Anwahl (T2) + Klick-Toleranz + unkomplizierte Abwahl | da (T2); Toleranz/Stöße = Schliff |
| 6 | **Normalisieren** | abschließendes Verschmelzen (E5): backen → neu noden → POIs re-anchoren → Sackgassen prunen. Einmalige Aktion (Button), kein Regler-Modus | neu (E5) |
| 7 | **Maskieren** | B2 beschneiden → Gate-POIs (Randstummel werden POIs) | da |

**Reihenfolge-Regel:** Normalisieren (6) MUSS vor Maskieren (7) laufen — die
Gate-Erkennung beim Maskieren arbeitet auf der Netz-Topologie; sie braucht das
endgültige, gebackene Netz, sonst werden Gates auf einem noch transienten Stand
gesetzt.

## Profi-Dropdown (expandable, eingeklappt — „einmal pro Gebiet")

Reine Umlagerung der bestehenden Sektionen, **kein Funktionsverlust**:
- Primäre Weg-Klassen + bridleway (tri-state)
- Konnektoren: Neben-/Landstraße Max-Längen
- Ausschlüsse: foot=no, access=private, access=no
- Anker: Snap-Schwelle, POI-Ausnahme-Distanz
- Diagnose: Lücken markieren

## Umbauschritte (klein, je deploybar)

- **US1 · Leisten-Gerüst:** kompakte Werkzeug-Reihe (6 Buttons), immer einer
  aktiv; darunter ein Bereich, der nur die Regler/Aktion des aktiven Werkzeugs
  zeigt. Reiner Rahmen, noch ohne Umlagerung.
- **US2 · Profi-Dropdown:** expandable Section am Ende; die heutigen Sektionen
  (Klassen, Konnektoren, Ausschlüsse, Anker, Diagnose) hineinverschieben. Nur
  Umlagerung — Funktion 1:1.
- **US3 · Regler einsortieren:** Netz-Schwelle → Werkzeug 2; Verschmelzen/Lücken
  → 3; Sackgassen-rot/blau + T2 → 4/5; Maskieren-Toggle → 6. Bestehender State
  bleibt, nur Verdrahtung an die aktiven Werkzeuge.
- **US4 · Abwahl vereinheitlichen:** in jedem Werkzeug „zweiter Klick aufs eigene
  Element entfernt"; konsistente Tooltips.

## NICHT in diesem Plan (eigene Ausbauten)

- **Werkzeug 3 manuell (Zwei-Punkt-Verbindung Wanderwegpunkt→Wanderwegpunkt):**
  neue Snap-Interaktion — eigener Schritt.
- **Werkzeug 6 Normalisieren (E5) + Persistenz:** mit `project_netz_normalisierung`
  zusammenlegen — backen, re-anchoren, prunen, persistieren. Im Flow fix vor
  Maskieren verortet, aber eigener Bau-Ausbau.
- **Anwahl-Stabilität an Stößen** (`project_wegnetz_befunde`): Klick-Toleranz +
  Ways über Stöße zusammenfassen — Schliff in Werkzeug 5.
