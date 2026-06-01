import { describe, it, expect } from 'vitest';
import { simSegmentLoads, loadColour } from './anthemSim';
import type { ResampledNet } from '../wegnetz/netResample';

const net = (): ResampledNet => ({
  stretches: [
    { id: '1.0', points: [[48.0, 14.0], [48.0001, 14.0], [48.0002, 14.0]] }, // 2 Segmente
    { id: '2.0', points: [[48.0, 14.001], [48.0, 14.002]] },                  // 1 Segment
  ],
  stretchCount: 2, segmentCount: 3, pointCount: 5,
  geometryBytes: 0, loadArrayBytes: 3, totalMeters: 0,
});

describe('anthemSim – simSegmentLoads', () => {
  it('ein Last-Wert je Segment, alle in [0,1]', () => {
    const loads = simSegmentLoads(net());
    expect(loads.length).toBe(3); // = segmentCount
    for (const l of loads) {
      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThanOrEqual(1);
    }
  });

  it('deterministisch (gleiches Netz → gleiche Lasten)', () => {
    expect(simSegmentLoads(net())).toEqual(simSegmentLoads(net()));
  });
});

describe('anthemSim – loadColour (Colorist)', () => {
  it('bildet 0..1 auf rgb ab, Extremwerte verschieden', () => {
    expect(loadColour(0)).toMatch(/^rgb\(/);
    expect(loadColour(1)).toMatch(/^rgb\(/);
    expect(loadColour(0)).not.toBe(loadColour(1));
  });
});
