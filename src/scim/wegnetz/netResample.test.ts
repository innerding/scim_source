import { describe, it, expect } from 'vitest';
import { resamplePolyline, distMeters, polylineMeters, type LatLng } from './netResample';

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
