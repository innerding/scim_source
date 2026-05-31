import { describe, it, expect } from 'vitest';
import { buildRoutePath, type PathEdge } from './pathEngine';

// Hilfs-Edge-Bauer.
const edge = (id: number, source: 'primary' | 'connector_candidate', pts: [number, number][]): PathEdge => ({
  id, highway: source === 'primary' ? 'path' : 'service', source, points: pts, tags: {}, inNet: source === 'primary',
});

// Drei Straßen-Ways, die an gemeinsamen Knoten (Kreuzungen) hängen:
//   A(0,0) --w1-- (0,0.001) --w2-- (0,0.002) --w3-- (0,0.003)
// Geteilte Koordinaten = Kreuzungsknoten. A→B über die ganze Kette muss EIN
// Stück über alle drei Ways liefern (der Ursprungsfehler: stoppt bei Kreuzung).
const W1: [number, number][] = [[0, 0], [0, 0.001]];
const W2: [number, number][] = [[0, 0.001], [0, 0.002]];
const W3: [number, number][] = [[0, 0.002], [0, 0.003]];

describe('buildRoutePath — A→B über mehrere Ways', () => {
  const edges = [edge(1, 'connector_candidate', W1), edge(2, 'connector_candidate', W2), edge(3, 'connector_candidate', W3)];

  it('spannt über drei Ways/Kreuzungen ohne Zwischenklicks', () => {
    const r = buildRoutePath(edges, [0, 0], [0, 0.003], []);
    expect(r).not.toBeNull();
    expect(r!.mode).toBe('routed');
    // Start ≈ A, Ende ≈ B, monoton steigender lng.
    expect(r!.points[0][1]).toBeCloseTo(0, 6);
    expect(r!.points[r!.points.length - 1][1]).toBeCloseTo(0.003, 6);
    for (let i = 1; i < r!.points.length; i++) {
      expect(r!.points[i][1]).toBeGreaterThanOrEqual(r!.points[i - 1][1] - 1e-9);
    }
  });

  it('Kurzstrecke: feine Toleranzen routen ein sehr kurzes Stück, default fällt auf gerade zurück', () => {
    const tiny = [edge(7, 'connector_candidate', [[0, 0], [0, 0.00002]])]; // ~2.2 m Way
    const A: [number, number] = [0, 0.000005];
    const B: [number, number] = [0, 0.00001]; // ~0.55 m auseinander auf demselben Segment
    // Default (merge 3 m) lässt den 2,2-m-Way zu einem Knoten kollabieren → gerade.
    expect(buildRoutePath(tiny, A, B, [])!.mode).toBe('straight');
    // Kurzstrecken-Toleranzen: Way bleibt erhalten → echtes Routing.
    expect(buildRoutePath(tiny, A, B, [], { mergeTolMeters: 0.5, minPieceMeters: 0.3 })!.mode).toBe('routed');
  });

  it('A und B auf demselben Way → direkter Zuschnitt', () => {
    const r = buildRoutePath(edges, [0, 0.0002], [0, 0.0008], []);
    expect(r).not.toBeNull();
    expect(r!.mode).toBe('routed');
    expect(r!.points[0][1]).toBeCloseTo(0.0002, 5);
    expect(r!.points[r!.points.length - 1][1]).toBeCloseTo(0.0008, 5);
  });

  it('keine Verbindung (Lücke) → gerades Stück, wenn unter Sanity-Distanz', () => {
    const isolated = [edge(1, 'connector_candidate', W1), edge(3, 'connector_candidate', [[0, 0.0015], [0, 0.0025]])];
    // B nahe genug an A (Luftlinie ~ wenige Meter über die isolierten Stücke hinweg)
    const r = buildRoutePath(isolated, [0, 0], [0, 0.001], [], { maxStraightMeters: 1000 });
    expect(r).not.toBeNull();
  });

  it('verbindet zwei Knie über eine OSM-Strecke, die nicht exakt genodet ist', () => {
    // wayA endet am Knie (0, 0.0010); wayB beginnt am Knie (0, 0.0020).
    // Die Verbindungsstrecke liegt ~2.2 m versetzt (0.00002 lat) — in OSM nicht
    // exakt am Knie genodet. Ohne Toleranz-Merge wäre sie isoliert und A→B
    // würde sie überspringen (gerade Linie). Mit Merge wird sie geroutet.
    const wayA = edge(20, 'connector_candidate', [[0, 0], [0, 0.0010]]);
    const stretch = edge(21, 'connector_candidate', [[0.00002, 0.0010], [0.00002, 0.0020]]);
    const wayB = edge(22, 'connector_candidate', [[0, 0.0020], [0, 0.0030]]);
    const knees = [wayA, stretch, wayB];
    const r = buildRoutePath(knees, [0, 0.0002], [0, 0.0028], []);
    expect(r).not.toBeNull();
    expect(r!.mode).toBe('routed'); // nicht 'straight' — die Strecke wird erreicht
    // Die Route muss durch die versetzte Strecke laufen (lat ~ 0.00002).
    expect(Math.max(...r!.points.map((p) => p[0]))).toBeGreaterThan(0.000015);
  });

  it('Hover-Spur lenkt an einer echten Verzweigung auf den oberen Bogen', () => {
    // Diamant: A→X, dann X→Y direkt (unten, kurz) ODER X→U→Y (oben, länger),
    // dann Y→B. A und B liegen auf den Stummeln, die Verzweigung ist bei X/Y.
    const eA = edge(10, 'connector_candidate', [[0, 0], [0, 0.001]]);                 // A→X
    const lower = edge(11, 'connector_candidate', [[0, 0.001], [0, 0.002]]);          // X→Y (kurz)
    const upA = edge(12, 'connector_candidate', [[0, 0.001], [0.0015, 0.0015]]);      // X→U
    const upB = edge(13, 'connector_candidate', [[0.0015, 0.0015], [0, 0.002]]);      // U→Y
    const eB = edge(14, 'connector_candidate', [[0, 0.002], [0, 0.003]]);             // Y→B
    const dia = [eA, lower, upA, upB, eB];
    const A: [number, number] = [0, 0.0003];
    const B: [number, number] = [0, 0.0027];
    // Ohne Spur → kürzeste durch den unteren Zweig (max lat ~ 0).
    const noTrail = buildRoutePath(dia, A, B, []);
    expect(Math.max(...noTrail!.points.map((p) => p[0]))).toBeLessThan(0.0005);
    // Spur über den oberen Knoten U → oberer Zweig (max lat ~ 0.0015).
    const trail: [number, number][] = [[0, 0.001], [0.0014, 0.0015], [0, 0.002]];
    const withTrail = buildRoutePath(dia, A, B, trail);
    expect(Math.max(...withTrail!.points.map((p) => p[0]))).toBeGreaterThan(0.001);
  });
});
