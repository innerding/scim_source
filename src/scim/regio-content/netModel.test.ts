import { describe, it, expect } from 'vitest';
import {
  deriveNet, addDrawnEdge, deleteAllRed, setGatePoi, toggleGatePoi, emptyModel,
  type NetModel, type ModelEdge, type LatLng,
} from './netModel';

const DRAWN = 1_000_000_000_000;
const osm = (id: number, pts: LatLng[]): ModelEdge => ({ id, points: pts, source: 'osm', asphalt: false });
const model = (edges: ModelEdge[], extra: Partial<NetModel> = {}): NetModel => ({ ...emptyModel(), edges, ...extra });

// Dreieck-Schleife: alle Knoten degree 2 → Netz, keine Sackgasse.
const X: LatLng = [0, 0];
const Y: LatLng = [0, 0.0020];
const Z: LatLng = [0.0015, 0.0010];
const triangle = (): ModelEdge[] => [osm(1, [X, Y]), osm(2, [Y, Z]), osm(3, [Z, X])];

describe('netModel — Netz = längste Komponente', () => {
  it('alleinige Schleife ist Netz', () => {
    const d = deriveNet(model(triangle()));
    expect(d.edges.length).toBe(3);
    expect(d.edges.every((e) => e.klass === 'net')).toBe(true);
    expect(d.redKeys).toEqual([]);
  });

  it('kleinere zweite Komponente ist rot (nicht die längste)', () => {
    const stub = osm(9, [[0.05, 0.05], [0.05, 0.0505]]); // kurz, weit weg
    const d = deriveNet(model([...triangle(), stub]));
    expect(d.edges.filter((e) => e.wayId === 9).every((e) => e.klass === 'red')).toBe(true);
    expect(d.edges.filter((e) => e.wayId !== 9).every((e) => e.klass === 'net')).toBe(true);
  });
});

describe('netModel — Sackgassen-Arm', () => {
  const arm = osm(4, [X, [-0.0006, 0]]); // Arm aus Knoten X heraus, Spitze degree-1
  it('Arm an verbundenem Netz ist rot (ganzer Arm)', () => {
    const d = deriveNet(model([...triangle(), arm]));
    const armEdges = d.edges.filter((e) => e.wayId === 4);
    expect(armEdges.length).toBeGreaterThan(0);
    expect(armEdges.every((e) => e.klass === 'red')).toBe(true);
    // Dreieck-Kern bleibt Netz.
    expect(d.edges.filter((e) => e.wayId <= 3).every((e) => e.klass === 'net')).toBe(true);
  });

  it('deadEnds listet die rote Spitze; toggleGatePoi setzt und entfernt', () => {
    const tip: LatLng = [-0.0006, 0];
    const m0 = model([...triangle(), arm]);
    expect(deriveNet(m0).deadEnds.some((p) => Math.abs(p[0] - tip[0]) < 1e-6)).toBe(true);
    const m1 = toggleGatePoi(m0, tip);        // setzen
    expect(deriveNet(m1).edges.filter((e) => e.wayId === 4).every((e) => e.klass === 'net')).toBe(true);
    const m2 = toggleGatePoi(m1, tip);        // entfernen
    expect(deriveNet(m2).edges.filter((e) => e.wayId === 4).every((e) => e.klass === 'red')).toBe(true);
  });

  it('Gate-POI an der Spitze macht den Arm gültig (net)', () => {
    const m = setGatePoi(model([...triangle(), arm]), [-0.0006, 0]);
    const d = deriveNet(m);
    expect(d.edges.filter((e) => e.wayId === 4).every((e) => e.klass === 'net')).toBe(true);
    expect(d.pois.find((p) => p.gate)).toBeTruthy();
  });
});

describe('netModel — deleteAllRed', () => {
  it('entfernt rote Teilstücke, Netz bleibt', () => {
    const stub = osm(9, [[0.05, 0.05], [0.05, 0.0505]]);
    const d = deriveNet(deleteAllRed(model([...triangle(), stub])));
    expect(d.redKeys).toEqual([]);
    expect(d.edges.some((e) => e.wayId === 9)).toBe(false);
    expect(d.edges.every((e) => e.klass === 'net')).toBe(true);
  });
});

describe('netModel — Trassieren (lila / verschmelzen)', () => {
  it('isoliert gezeichnet = lila', () => {
    const d = deriveNet(addDrawnEdge(model(triangle()), [[0.08, 0.08], [0.08, 0.0802]]));
    const drawn = d.edges.filter((e) => e.wayId >= DRAWN);
    expect(drawn.length).toBeGreaterThan(0);
    expect(drawn.every((e) => e.klass === 'lila')).toBe(true);
  });

  it('Sehne zwischen zwei Dreieck-Knoten = verschmolzen (net)', () => {
    const d = deriveNet(addDrawnEdge(model(triangle()), [X, Y]));
    expect(d.edges.filter((e) => e.wayId >= DRAWN).every((e) => e.klass === 'net')).toBe(true);
  });
});

describe('netModel — Endpunkt-auf-Linie-Noding', () => {
  it('Trasse, die auf Linienmitten endet, verbindet (splittet die Linien)', () => {
    const midXY: LatLng = [0, 0.0010];
    const midYZ: LatLng = [0.00075, 0.0015];
    const m = addDrawnEdge(model(triangle()), [midXY, midYZ]);
    const d = deriveNet(m);
    // Trasse ist verbunden → net, nicht lila.
    expect(d.edges.filter((e) => e.wayId >= DRAWN).every((e) => e.klass === 'net')).toBe(true);
    // X-Y (id 1) wurde am Mittelpunkt gesplittet → mehr als ein Teilstück.
    expect(d.edges.filter((e) => e.wayId === 1).length).toBeGreaterThan(1);
  });
});

describe('netModel — KEIN Brückenzeichen an Kreuzungen', () => {
  it('Trasse durch einen geteilten T-Knoten erzeugt keine Brücke', () => {
    const o1 = osm(1, [[0, 0], [0, 0.0010], [0, 0.0020]]);      // Hauptlinie mit Knoten M
    const o2 = osm(2, [[0, 0.0010], [0.0006, 0.0010]]);          // Stich an M → T-Kreuzung
    // Trasse folgt der Hauptlinie und läuft DURCH M (M ist auch Trassen-Stützpunkt).
    const m = addDrawnEdge(model([o1, o2]), [[0, 0.0002], [0, 0.0010], [0, 0.0018]]);
    const d = deriveNet(m);
    expect(d.bridges.length).toBe(0);
  });
});

describe('netModel — Fly-over (Brücke, keine Verbindung)', () => {
  it('Trasse quer über eine Linie ohne dort zu enden → BridgeMark, bleibt getrennt', () => {
    // X-Y liegt auf lat 0 (lng 0..0.0020). Trasse kreuzt bei (0, 0.0010), endet aber ±55 m entfernt.
    const m = addDrawnEdge(model(triangle()), [[-0.0005, 0.0010], [0.0005, 0.0010]]);
    const d = deriveNet(m);
    expect(d.bridges.length).toBeGreaterThan(0);
    expect(d.bridges.some((b) => Math.abs(b.at[0]) < 1e-6 && Math.abs(b.at[1] - 0.0010) < 1e-6)).toBe(true);
    // Trasse hat keinen Knoten an der Kreuzung → eigene Komponente → lila.
    expect(d.edges.filter((e) => e.wayId >= DRAWN).every((e) => e.klass === 'lila')).toBe(true);
  });
});
