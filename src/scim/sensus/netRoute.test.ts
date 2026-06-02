import { describe, it, expect } from 'vitest';
import { netSegments, coveredSegmentIds, distToPath } from './netRoute';
import type { ResampledNet, LatLng } from '../wegnetz/netResample';

const M = 1 / 111195; // ~1 m Breitengrad
const at = (m: number): LatLng => [48.0 + m * M, 14.0]; // Nord-Süd-Linie

const net: ResampledNet = {
  stretches: [
    { id: '1.0', points: [at(0), at(10), at(20)] }, // 2 Segmente
    { id: '2.0', points: [at(0), [48.0, 14.001]] },  // 1 Segment (nach Osten)
  ],
  stretchCount: 2, segmentCount: 3, pointCount: 5,
  geometryBytes: 0, loadArrayBytes: 3, totalMeters: 0,
};

describe('netRoute – netSegments (S1)', () => {
  it('flache Segment-Liste mit ids + Mitte', () => {
    const segs = netSegments(net);
    expect(segs.map((s) => s.id)).toEqual(['1.0#0', '1.0#1', '2.0#0']);
    expect(segs[0].mid[0]).toBeCloseTo(at(5)[0], 9); // Mitte des ersten Segments
  });
});

describe('netRoute – coveredSegmentIds (S1)', () => {
  const segs = netSegments(net);

  it('Pfad entlang Strecke 1.0 überdeckt deren Segmente', () => {
    const path = [at(0), at(20)]; // deckt 1.0#0 und 1.0#1
    const covered = coveredSegmentIds(segs, path, 8).sort();
    expect(covered).toEqual(['1.0#0', '1.0#1']);
  });

  it('Pfad weit weg überdeckt nichts', () => {
    const far = [[49.0, 15.0], [49.0, 15.001]] as LatLng[];
    expect(coveredSegmentIds(segs, far, 8)).toEqual([]);
  });

  it('Toleranz greift: ~5 m Parallel-Versatz noch überdeckt, ~50 m nicht', () => {
    const lngOff = (m: number) => 14.0 + m / (111320 * Math.cos(48 * Math.PI / 180));
    const near = [[48.0 + 0 * M, lngOff(5)], [48.0 + 20 * M, lngOff(5)]] as LatLng[];
    const farish = [[48.0 + 0 * M, lngOff(50)], [48.0 + 20 * M, lngOff(50)]] as LatLng[];
    expect(coveredSegmentIds(segs, near, 8)).toContain('1.0#0');
    expect(coveredSegmentIds(segs, farish, 8)).not.toContain('1.0#0');
  });

  it('distToPath: Punkt auf der Linie ≈ 0', () => {
    expect(distToPath(at(5), [at(0), at(20)])).toBeLessThan(0.5);
  });
});
