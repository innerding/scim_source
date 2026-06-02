import { describe, it, expect } from 'vitest';
import { simSegmentLoads, stretchAverages, normalizeLoads, classifyStretches, loadColour } from './anthemSim';
import type { StretchLoad } from './anthemSim';
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

describe('anthemSim – normalizeLoads (System A3)', () => {
  it('spread 0 = roh (unverändert)', () => {
    expect(normalizeLoads([0.2, 0.4, 0.6], { spread: 0 })).toEqual([0.2, 0.4, 0.6]);
  });

  it('spread 1 = voll relativ (min→0, max→1)', () => {
    const out = normalizeLoads([0.2, 0.4, 0.6], { spread: 1 });
    expect(out[0]).toBeCloseTo(0, 10);
    expect(out[1]).toBeCloseTo(0.5, 10);
    expect(out[2]).toBeCloseTo(1, 10);
  });

  it('spread 0.5 = Blend roh↔normalisiert', () => {
    const out = normalizeLoads([0.2, 0.6], { spread: 0.5 });
    expect(out[0]).toBeCloseTo(0.1, 10);  // 0.2 + (0-0.2)*0.5
    expect(out[1]).toBeCloseTo(0.8, 10);  // 0.6 + (1-0.6)*0.5
  });

  it('floor (Mindest-Rot) hebt den Peak auf floor, wenn Last da ist', () => {
    const out = normalizeLoads([0.1, 0.2, 0.3], { spread: 0, floor: 0.9, minPartial: 0.05 });
    expect(Math.max(...out)).toBeCloseTo(0.9, 10);   // Peak auf floor
    expect(out[0]).toBeCloseTo(0.3, 10);             // proportional mitgehoben (0.1*3)
  });

  it('ruhiges Netz (Peak < minPartial) bleibt kalt — kein Mindest-Rot', () => {
    const out = normalizeLoads([0.01, 0.02], { floor: 0.9, minPartial: 0.05 });
    expect(out).toEqual([0.01, 0.02]);
  });

  it('konstante Last + floor: alle auf floor; leeres Array → []', () => {
    expect(normalizeLoads([0.3, 0.3], { floor: 0.8, minPartial: 0.05 }).every((v) => Math.abs(v - 0.8) < 1e-9)).toBe(true);
    expect(normalizeLoads([])).toEqual([]);
  });
});

describe('anthemSim – classifyStretches (A4)', () => {
  const sl = (id: string, average: number): StretchLoad => ({ id, average, segmentCount: 1 });
  const stretches = [sl('a', 0.2), sl('b', 0.5), sl('c', 0.8)];

  it('normal / degraded / excluded je Ø-Last', () => {
    const out = classifyStretches(stretches, { degradier: 0.4, ausschluss: 0.7 });
    expect(out.map((s) => s.state)).toEqual(['normal', 'degraded', 'excluded']);
  });

  it('Ausschluss schlägt Degradierung; Grenzen inklusive (>=)', () => {
    const out = classifyStretches([sl('x', 0.7), sl('y', 0.4), sl('z', 0.39)], { degradier: 0.4, ausschluss: 0.7 });
    expect(out.map((s) => s.state)).toEqual(['excluded', 'degraded', 'normal']);
  });

  it('undefinierte Schwellen → alles normal', () => {
    expect(classifyStretches(stretches, {}).every((s) => s.state === 'normal')).toBe(true);
  });

  it('nur Ausschluss gesetzt → kein degraded', () => {
    const out = classifyStretches(stretches, { ausschluss: 0.7 });
    expect(out.map((s) => s.state)).toEqual(['normal', 'normal', 'excluded']);
  });

  it('trägt id + average durch', () => {
    const out = classifyStretches([sl('a', 0.8)], { ausschluss: 0.7 });
    expect(out[0]).toEqual({ id: 'a', average: 0.8, state: 'excluded' });
  });
});

describe('anthemSim – loadColour (Colorist)', () => {
  it('bildet 0..1 auf rgb ab, Extremwerte verschieden', () => {
    expect(loadColour(0)).toMatch(/^rgb\(/);
    expect(loadColour(1)).toMatch(/^rgb\(/);
    expect(loadColour(0)).not.toBe(loadColour(1));
  });
});
