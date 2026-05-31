import { describe, it, expect } from 'vitest';
import {
  deriveNet, addDrawnEdge, deleteAllRed, deleteKeys, emptyModel,
  type NetModel, type ModelEdge,
} from './netModel';

const osm = (id: number, pts: [number, number][]): ModelEdge => ({ id, points: pts, source: 'osm', asphalt: false });

// Dreieck (Schleife) — alle Knoten degree 2, Umfang ~620 m ≥ Schwelle → Netz.
const X: [number, number] = [0, 0];
const Y: [number, number] = [0, 0.0020];
const Z: [number, number] = [0.0015, 0.0010];
const triangle = (): ModelEdge[] => [
  osm(1, [X, Y]), osm(2, [Y, Z]), osm(3, [Z, X]),
];
// Isolierter kurzer Stub, weit weg → eigene Komponente < Schwelle → nicht im Netz.
const stub = osm(9, [[0.05, 0.05], [0.05, 0.0502]]);

const model = (edges: ModelEdge[]): NetModel => ({ ...emptyModel(), edges });

describe('netModel.deriveNet', () => {
  it('Dreieck = Netz (schwarz), kein Rot', () => {
    const d = deriveNet(model(triangle()));
    expect(d.edges.length).toBe(3);
    expect(d.edges.every((e) => e.klass === 'net')).toBe(true);
    expect(d.redKeys).toEqual([]);
    expect(d.netMeters).toBeGreaterThan(300);
  });

  it('isolierter Stub = rot (nicht im Netz), landet in redKeys', () => {
    const d = deriveNet(model([...triangle(), stub]));
    const stubEdges = d.edges.filter((e) => e.wayId === 9);
    expect(stubEdges.length).toBeGreaterThan(0);
    expect(stubEdges.every((e) => e.klass === 'red')).toBe(true);
    for (const e of stubEdges) expect(d.redKeys).toContain(e.key);
    // Das Dreieck bleibt Netz.
    expect(d.edges.filter((e) => e.wayId !== 9).every((e) => e.klass === 'net')).toBe(true);
  });
});

describe('netModel.deleteAllRed', () => {
  it('entfernt alle roten Teilstücke, lässt das Netz stehen', () => {
    const m = deleteAllRed(model([...triangle(), stub]));
    const d = deriveNet(m);
    expect(d.redKeys).toEqual([]);
    expect(d.edges.every((e) => e.klass === 'net')).toBe(true);
    // Der Stub ist jetzt ausgeschlossen.
    expect(d.edges.some((e) => e.wayId === 9)).toBe(false);
  });
});

describe('netModel.addDrawnEdge — lila bis verschmolzen', () => {
  it('isoliert gezeichnet = lila', () => {
    const m = addDrawnEdge(model(triangle()), [[0.08, 0.08], [0.08, 0.0802]], false);
    const d = deriveNet(m);
    const drawn = d.edges.filter((e) => e.wayId >= 1_000_000_000_000);
    expect(drawn.length).toBeGreaterThan(0);
    expect(drawn.every((e) => e.klass === 'lila')).toBe(true);
  });

  it('mit dem Netz verbunden gezeichnet = verschmolzen (net, nicht lila)', () => {
    // Sehne X→Y: beide Endpunkte sind Dreieck-Knoten → kein Sackgassen-Ende.
    const m = addDrawnEdge(model(triangle()), [X, Y], false);
    const d = deriveNet(m);
    const drawn = d.edges.filter((e) => e.wayId >= 1_000_000_000_000);
    expect(drawn.length).toBeGreaterThan(0);
    expect(drawn.every((e) => e.klass === 'net')).toBe(true);
  });
});

describe('netModel.deleteKeys', () => {
  it('schließt ein Teilstück aus', () => {
    const d0 = deriveNet(model(triangle()));
    const key = d0.edges[0].key;
    const d1 = deriveNet(deleteKeys(model(triangle()), [key]));
    expect(d1.edges.some((e) => e.key === key)).toBe(false);
  });
});
