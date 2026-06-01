import { describe, it, expect } from 'vitest';
import { resamplePolyline, resampleNet, catmullRomSpline, distMeters, polylineMeters, type LatLng } from './netResample';
import type { PathEdge } from '../regio-content/pathEngine';

// Reiner Nord-Süd-Verlauf (lng konstant): 1 m ≈ 1/111194.9° Breitengrad,
// unabhängig vom Breitengrad → exakte Längenkontrolle für die Tests.
const M = 1 / 111194.9;
const at = (meters: number): LatLng => [48.0 + meters * M, 14.0];

describe('netResample – resamplePolyline', () => {
  it('teilt eine ~10 m-Strecke bei target 3 in 3 gleiche Segmente (4 Punkte)', () => {
    const r = resamplePolyline([at(0), at(10)], { targetMeters: 3 });
    expect(r.segmentCount).toBe(3);
    expect(r.points.length).toBe(4);
    expect(r.totalMeters).toBeCloseTo(10, 1);
    expect(r.segmentMeters).toBeCloseTo(10 / 3, 2);
    // alle Segmente gleich lang
    for (let i = 1; i < r.points.length; i++) {
      expect(distMeters(r.points[i - 1], r.points[i])).toBeCloseTo(10 / 3, 1);
    }
  });

  it('erhält Endpunkte exakt und lng konstant', () => {
    const r = resamplePolyline([at(0), at(10)], { targetMeters: 3 });
    expect(r.points[0]).toEqual(at(0));
    expect(r.points[r.points.length - 1]).toEqual(at(10));
    for (const p of r.points) expect(p[1]).toBeCloseTo(14.0, 10);
  });

  it('erhält die Gesamtlänge (Summe der Segmente ≈ total)', () => {
    const r = resamplePolyline([at(0), at(10)], { targetMeters: 3 });
    expect(polylineMeters(r.points)).toBeCloseTo(r.totalMeters, 4);
  });

  it('target 6 → 2 Segmente à 5 m', () => {
    const r = resamplePolyline([at(0), at(10)], { targetMeters: 6 });
    expect(r.segmentCount).toBe(2);
    expect(r.segmentMeters).toBeCloseTo(5, 1);
  });

  it('Mindestlänge: ~8 m bei target 3 → 2 Segmente (nicht 3), je ≥ 3 m', () => {
    const r = resamplePolyline([at(0), at(8)], { targetMeters: 3, minMeters: 3 });
    expect(r.segmentCount).toBe(2);
    expect(r.segmentMeters).toBeGreaterThanOrEqual(3);
  });

  it('Strecke kürzer als min bleibt 1 Segment', () => {
    const r = resamplePolyline([at(0), at(2)], { targetMeters: 3, minMeters: 3 });
    expect(r.segmentCount).toBe(1);
    expect(r.points.length).toBe(2);
  });

  it('mehrteilige Polyline: gleiche Segmente, Endpunkte erhalten', () => {
    const line = [at(0), at(4), at(9), at(15)]; // ~15 m mit Zwischenpunkten
    const r = resamplePolyline(line, { targetMeters: 3 });
    expect(r.segmentCount).toBe(5); // round(15/3)=5, floor(15/3)=5
    expect(r.points[0]).toEqual(at(0));
    expect(r.points[r.points.length - 1]).toEqual(at(15));
    for (let i = 1; i < r.points.length; i++) {
      expect(distMeters(r.points[i - 1], r.points[i])).toBeCloseTo(15 / 5, 1);
    }
  });

  it('entartet: ein Punkt → 0 Segmente; zwei identische → 1 Segment, 0 m', () => {
    expect(resamplePolyline([at(0)], { targetMeters: 3 }).segmentCount).toBe(0);
    const dup = resamplePolyline([at(0), at(0)], { targetMeters: 3 });
    expect(dup.segmentCount).toBe(1);
    expect(dup.totalMeters).toBe(0);
  });
});

describe('netResample – resampleNet (Kreuzungs-Split)', () => {
  const mLat = 1 / 111194.9;
  const mLng = 1 / 74485; // ~1 m in Längengrad bei lat 48
  const X: LatLng = [48.0, 14.0]; // gemeinsamer Kreuzungspunkt (identische Koords!)
  const edge = (id: number, points: LatLng[]): PathEdge => ({
    id, highway: 'path', source: 'primary', points, tags: {}, inNet: true,
  });

  // edgeA verläuft N–S DURCH X (X ist Innenpunkt); edgeB geht von X nach Osten.
  const edgeA = edge(1, [[48.0 - 10 * mLat, 14.0], X, [48.0 + 10 * mLat, 14.0]]);
  const edgeB = edge(2, [X, [48.0, 14.0 + 8 * mLng]]);

  it('splittet an der Kreuzung → 3 Strecken, ids korrekt', () => {
    const net = resampleNet([edgeA, edgeB], { targetMeters: 3 });
    expect(net.stretchCount).toBe(3);
    const ids = net.stretches.map((s) => s.id).sort();
    expect(ids).toEqual(['1.0', '1.1', '2.0']);
  });

  it('Kreuzung bleibt exakt erhalten (Endpunkt beider edgeA-Stücke)', () => {
    const net = resampleNet([edgeA, edgeB], { targetMeters: 3 });
    const p0 = net.stretches.find((s) => s.id === '1.0')!;
    const p1 = net.stretches.find((s) => s.id === '1.1')!;
    expect(p0.points[p0.points.length - 1][0]).toBeCloseTo(48.0, 5);
    expect(p0.points[p0.points.length - 1][1]).toBeCloseTo(14.0, 5);
    expect(p1.points[0][0]).toBeCloseTo(48.0, 5);
    expect(p1.points[0][1]).toBeCloseTo(14.0, 5);
  });

  it('Kennzahlen: loadArrayBytes = segmentCount, geometryBytes > 0', () => {
    const net = resampleNet([edgeA, edgeB], { targetMeters: 3 });
    expect(net.segmentCount).toBeGreaterThan(0);
    expect(net.loadArrayBytes).toBe(net.segmentCount);
    expect(net.geometryBytes).toBeGreaterThan(0);
  });
});

describe('netResample – catmullRomSpline', () => {
  const M = 1 / 111194.9;
  const at = (m: number): LatLng => [48.0 + m * M, 14.0];

  it('Endpunkte exakt erhalten (Kreuzungen scharf)', () => {
    const sp = catmullRomSpline([[48, 14], [48.001, 14.0005], [48.002, 14.0]], 4);
    expect(sp[0]).toEqual([48, 14]);
    expect(sp[sp.length - 1][0]).toBeCloseTo(48.002, 9);
    expect(sp[sp.length - 1][1]).toBeCloseTo(14.0, 9);
  });

  it('verdichtet nur fürs Rendern (length = 1 + (n-1)*samples)', () => {
    const sp = catmullRomSpline([[48, 14], [48.001, 14.0005], [48.002, 14.0]], 4);
    expect(sp.length).toBe(1 + 2 * 4);
  });

  it('gerade Linie bleibt gerade (lng konstant)', () => {
    const sp = catmullRomSpline([at(0), at(5), at(10)], 4);
    for (const p of sp) expect(p[1]).toBeCloseTo(14.0, 9);
  });

  it('< 3 Punkte unverändert', () => {
    expect(catmullRomSpline([[48, 14], [48.001, 14]], 4)).toEqual([[48, 14], [48.001, 14]]);
  });
});
