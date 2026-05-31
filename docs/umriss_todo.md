# Umriss-Tab — konkrete Todo-Liste (ab hier abarbeiten)

*Stand 2026-05-31 · gegründet auf drawer_werkzeugleiste_spec (ann_079) + Tool-Header-Gerüst (US1)*

Ziel: eine Boundary (B1/B2) **per Hand** sauber zeichnen/editieren — Voraussetzung für
M1 „gültige Representation". Leitbild: Direktmanipulation statt Modus-Buttons; der
Snap-Toggle existiert schon (Tool-Header, treibt Geoman global).

## Checkliste

- [ ] **UÖ1 · Geoman zähmen.** `addBoundaryControls`: **Rechteck-Button raus**
  (`drawRectangle:false`), Geoman-Default-Toolbar verstecken. Nur Polygon-Zeichnen
  + Editieren bleibt nutzbar. (Weißer-Screen-Falle beachten: kein globales `disable*`
  über programmatische Polygone — `removeControls()` + gezieltes `layer.pm.disable()`.)
- [ ] **UÖ2 · Punkt setzen = Klick.** Im Zeichenmodus jeder Klick ein Stützpunkt; kein
  separater Knopf. **Schließen = Auto-Snap an den Startpunkt** (immer an), sobald der
  letzte Punkt nahe genug am ersten ist.
- [ ] **UÖ3 · Punkt löschen = sehr Long-Press**, mit visuellem Feedback **grün → rot**
  je näher am Löschen. Custom-Geste (ersetzt Geomans removalMode), kein Knopf.
- [ ] **UÖ4 · Vertex-Drag** sicherstellen — Punkt direkt ziehen (Geoman editMode),
  kein Tool-Button.
- [ ] **UÖ5 · Snap im Umriss prüfen.** Der bestehende Snap-Toggle (snapEnabled →
  `setGlobalOptions snappable`) muss beim Zeichnen/Editieren im Umriss-Tab greifen
  (an B1/B2-Punkte + Inspector-Vorlage).
- [ ] **UÖ6 · B1/B2-Sperre in der EBENEN-Leiste.** Zustand „nicht bearbeitbar, aber
  Punkte als Snap-Quelle nutzbar" (Tracen über fixe Referenz). Pro Boundary ein
  Lock-Toggle.
- [ ] **UÖ7 · Linke Tool-Zone aufräumen.** Platzhalter „Umriss-Werkzeuge folgen"
  ersetzen — die wenigen echten Umriss-Controls (v. a. nur das, was nicht Geste ist)
  links einhängen; Vertex-Drag/Löschen sind Gesten ohne Button.

## Bewusst NICHT hier
- Koordinaten-Reduktion/DP, Resampler, Mesh, Telco → Wegnetz/M2-M4 (eigene Pläne).
- B2-aus-B1 + Beschneiden existieren bereits (EBENEN-Leiste).

## Danach
M1 erreicht (gültige Representation per Hand baubar) → weiter mit dem
Representation-/Telco-/Inspector-Plan (S1–S4 / M2) und der Auslieferung (M3/M4).
