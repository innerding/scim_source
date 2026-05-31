# Wegnetz-Editor — verbindliche Gesamt-Spezifikation

Stand: Konsens-Sammlung 2026 (Drawer-Rückbau). Diese Datei ist die maßgebliche
Quelle für den Umbau. Verwandt: `docs`-Memos + memory `project_drawer_rueckbau`,
`project_loeschen_zeichnen_trennung`, `project_b1_fetch_b2_maske`.

## Menschenlesbar

Zwei Wahrheiten: **OP** (Arbeitsnetz, einziger editierbarer Zustand) und **OSM**
(roher Kandidaten-Pool, nur Quelle).

Aus OP wird ALLES abgeleitet: noden → fast deckungsgleiche Enden fix auf **1 m**
verschweißen → Gelöschtes raus → zusammenhängende Komponenten. **Netz = längste
zusammenhängende Komponente.**

Farben je Strecke:
- **schwarz (net)** — in der längsten Komponente, kein Sackgassen-Arm (Asphalt: weiß + Casing).
- **lila** — trassiert, noch nicht verbunden. Gestrichelt beim Ziehen, solid nach Ablegen; beim Verschmelzen Gradient → schwarz.
- **rot** — alles andere: nicht verbunden ODER Sackgassen-Arm (degree-1-Ende ohne Gate-POI, ganzer Arm bis Knoten ≥ 3).

Gate-POI: POI aus dem Header auf eine Sackgasse ziehen → landet am Endpunkt →
gültiger Ein-/Ausstieg, Arm nicht mehr rot. Normale POIs ab 1 m angebunden;
unverbunden blinken sie.

Zwei Toleranzen: Verschweißen fix 1 m · Treffen/Anklicken großzügig.

Trassieren: Ziehen über OSM = Vorschau (lila gestrichelt), Loslassen = lila solid.
System setzt alle Kreuzungsknoten entlang/an der Trasse selbst:
- Trasse endet/hält auf Linie → Kreuzung (splitten, geteilter Knoten).
- Trasse läuft glatt drüber → Brücke (keine Verbindung); obere Linie (Trasse)
  bekommt Brückenzeichen (links/rechts der unteren Linie je ein kurzer Strich,
  Enden nach außen gehakt).
- OSM × OSM unberührt (Überfliegungen sind schon getrennt).

Aktionen (alle Undo-fähig): Trassieren · Löschen (ein Teilstück) · Alles Rote
löschen (keine Stummel, keine neuen Sackgassen) · Gate-POI setzen.

Anzeige: ein einziges draw(deriveNet(OP)).

NICHT: Schwellen-/Toleranz-Regler · Auto-Brücken/orange · Sackgassen-Sonderpfad ·
zweiter Lösch-Mechanismus · Geoman fürs Netz · Overlay-Mengen · Effekt-Suppe.
Umriss (B1/B2) ist separat (eigener Cursor-Editor).

## Maschinenlesbar

```ts
const WELD_TOL_M = 1;    // FIX: deckungsgleiche Enden + POI-Anbindung verschweißen
const HIT_TOL_M  = 12;   // großzügig: Treffer beim Klicken/Greifen (tunebar)

type LatLng = [number, number];                                  // [lat,lng]
interface OpEdge  { id:number; points:LatLng[]; source:'osm'|'drawn'; asphalt:boolean; }
interface GatePoi { at:LatLng; poiId?:string; }
interface OP      { edges:OpEdge[]; excluded:string[]; gates:GatePoi[]; } // EINZIGE Wahrheit
interface EditorState {
  op:OP; osmPool:OpEdge[];
  undo:OP[];
  boundary:{ b1:LatLng[]|null; b2:LatLng[]|null };
}

type EdgeClass = 'net' | 'red' | 'lila';
interface DerivedEdge  { key:string; points:LatLng[]; klass:EdgeClass; asphalt:boolean; }
interface DerivedPoi   { at:LatLng; connected:boolean; gate:boolean; }
interface BridgeMark   { at:LatLng; overEdgeId:number; }
interface DerivedNet   { edges:DerivedEdge[]; pois:DerivedPoi[]; bridges:BridgeMark[]; redKeys:string[]; }

// deriveNet(op, osmPool?):
//  1. NODEN:
//      - geteilte Koordinate (≤ WELD_TOL_M)                         → Knoten
//      - Trasse ENDET auf fremder Linie (Endpunkt ≤ HIT_TOL_M)      → Linie splitten → Knoten
//      - Trasse läuft MITTEN über fremde Linie                      → KEIN Knoten + BridgeMark
//      - OSM × OSM Geometrie-Kreuzung ohne geteilten Knoten         → KEIN Knoten (Brücke)
//  2. excluded entfernen → Komponenten → NET = längste Komponente
//  3. gateNodes = degree-1-Knoten ≤ WELD_TOL_M an einem op.gates.at
//  4. deadArm(e): Kette zu degree-1-Ende, das KEIN gateNode ist (zurück bis Knoten ≥3)
//  5. lila if drawn && comp≠NET ; red if comp≠NET || deadArm ; net sonst
//  6. POIs: connected = dist(poi,NET) ≤ WELD_TOL_M ; gate = als GatePoi gesetzt

// Aktionen (rein OP→OP; Aufrufer pusht undo):
//  trassieren(op, osmPool, dragPath) ; deleteSegment(op, keyAtHit) ;
//  deleteAllRed(op) ; setGatePoi(op, deadEndAtHit, poi) ; undo(state)

// draw(deriveNet(op)): net schwarz(asphalt weiß+casing) · red rot · lila violett(dashed solang trassiert)
//   bridges → Brückenzeichen ; poi connected normal / !connected blinkt / gate Endpunkt-Marker
//   lila→schwarz Gradient beim Verschmelzen

// NICHT: netLenThresh/gapTol-Regler · Auto-Brücken/orange · Sackgassen-Sonderpfad ·
//        zweiter Lösch-Mechanismus · Geoman fürs Netz · Overlay-Mengen · Effekt-Suppe
```

## Umbauplan (Phasen, Reparatur — nicht Neubau)

Kern bleibt: `netGraph` (Noding/Komponenten) + `pathEngine` (Overpass-Fetch,
buildRoutePath). Vorgehen: neue Logik isoliert + getestet bauen (kein
Verhaltens-Deploy), dann EIN kontrollierter Cutover, dann toten Code löschen.

- ① netModel als Wahrheit — BEGONNEN (deriveNet/Aktionen/Tests). Muss an die
  finale Spec angepasst werden: NET = längste Komponente (statt netLenThresh),
  ganzer Sackgassen-Arm rot, Gate-POIs, fixe 1 m-Verschweißung, Endpunkt-auf-
  Linie-Noding, Fly-over/BridgeMark-Erkennung. Rein + getestet, kein Deploy-Effekt.
- ② Logik-Vervollständigung (Noding inkl. neuer Kreuzungen + Brücken, Gates,
  längste Komponente, Arm-Rot) — pure Module + Tests. Deploy-sicher (ungenutzt).
- ③ CUTOVER: Wegnetz-Tab auf model-getriebenen Kern umstellen — ein draw(deriveNet),
  Aktionen (Trassieren/Löschen/AllesRote/Gate/Undo). Ersetzt renderPath + Overlay-
  States + Modi. EINZIGER verhaltensändernder Deploy; danach testen.
- ④ Boundary-Cursor-Editor (Geoman raus) — separat.
- ⑤ Speicherung = Modell serialisieren.
- Aufräumen: toten Code (alte States/Effekte/Geoman-Netz) erst nach bestätigtem Cutover löschen.
```
