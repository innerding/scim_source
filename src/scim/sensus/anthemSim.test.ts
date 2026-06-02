import { describe, it, expect } from 'vitest';
import { simSegmentLoads, stretchAverages, loadColour } from './anthemSim';
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

describe('anthemSim – stretchAverages', () => {
  it('mittelt je Strecke über ihre Segmente (in Reihenfolge)', () => {
    // net(): Strecke 1.0 hat 2 Segmente, Strecke 2.0 hat 1 Segment.
    const avg = stretchAverages(net(), [0.2, 0.4, 0.8]);
    expect(avg.map((a) => a.id)).toEqual(['1.0', '2.0']);
    expect(avg.map((a) => a.segmentCount)).toEqual([2, 1]);
    expect(avg[0].average).toBeCloseTo(0.3, 10); // (0.2+0.4)/2
    expect(avg[1].average).toBeCloseTo(0.8, 10);
  });

  it('mit echten Sim-Lasten: ein Eintrag je Strecke, Ø in [0,1]', () => {
    const n = net();
    const avg = stretchAverages(n, simSegmentLoads(n));
    expect(avg.length).toBe(n.stretches.length);
    for (const a of avg) {
      expect(a.average).toBeGreaterThanOrEqual(0);
      expect(a.average).toBeLessThanOrEqual(1);
    }
  });

  it('entartete Strecke (1 Punkt) → segmentCount 0, average 0, verschiebt idx nicht', () => {
    const degenerate: ResampledNet = {
      ...net(),
      stretches: [{ id: 'd', points: [[48, 14]] }, { id: 'e', points: [[48, 14], [48.001, 14]] }],
    };
    const avg = stretchAverages(degenerate, [0.5]); // nur 1 Segment (Strecke e)
    expect(avg[0]).toEqual({ id: 'd', average: 0, segmentCount: 0 });
    expect(avg[1]).toEqual({ id: 'e', average: 0.5, segmentCount: 1 });
  });
});

describe('anthemSim – loadColour (Colorist)', () => {
  it('bildet 0..1 auf rgb ab, Extremwerte verschieden', () => {
    expect(loadColour(0)).toMatch(/^rgb\(/);
    expect(loadColour(1)).toMatch(/^rgb\(/);
    expect(loadColour(0)).not.toBe(loadColour(1));
  });
});
