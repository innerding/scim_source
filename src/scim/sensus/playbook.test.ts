import { describe, it, expect } from 'vitest';
import { arrivalCurve, playbookLoad, type ODFlow } from './playbook';
import type { ResampledNet, LatLng } from '../wegnetz/netResample';

const at = (m: number): LatLng => [48.0 + m / 111195, 14.0];
const net: ResampledNet = {
  stretches: [
    { id: '1.0', points: [at(0), at(10), at(20)] }, // Segmente 1.0#0, 1.0#1
    { id: '2.0', points: [at(0), [48.0, 14.001]] },  // Segment 2.0#0
  ],
  stretchCount: 2, segmentCount: 3, pointCount: 5, geometryBytes: 0, loadArrayBytes: 3, totalMeters: 0,
};

describe('playbook – arrivalCurve (Sonntag: zwei Schwünge + Stundentakt)', () => {
  it('früh/abends kaum was los', () => {
    expect(arrivalCurve(6)).toBeLessThan(0.05);
    expect(arrivalCurve(19)).toBeLessThan(0.15);
    expect(arrivalCurve(20)).toBeLessThan(0.05);
  });
  it('Vormittags-Schwung (8:30–10:30) und Nachmittag (~13:30) sind die Hochzeiten', () => {
    expect(arrivalCurve(9.5)).toBeGreaterThan(0.7);   // Vormittags-Peak
    expect(arrivalCurve(13.5)).toBeGreaterThan(0.5);  // Nachmittags-Schwung
  });
  it('Mittags-Flaute zwischen den Schwüngen', () => {
    expect(arrivalCurve(12)).toBeLessThan(arrivalCurve(9.5));
    expect(arrivalCurve(12)).toBeLessThan(0.4);
  });
  it('Stundentakt: :30 stärker als :00', () => {
    expect(arrivalCurve(9.5)).toBeGreaterThan(arrivalCurve(10.0));
  });
});

describe('playbook – playbookLoad', () => {
  const flows: ODFlow[] = [{ segmentIds: ['1.0#0', '1.0#1'], intensity: 8 }]; // Strom über Strecke 1.0

  it('belastet nur Flow-Segmente; POI-ferne bleiben 0', () => {
    const loads = playbookLoad(net, flows, 9.5);
    expect(loads.length).toBe(3);          // netSegments-Reihenfolge: 1.0#0,1.0#1,2.0#0
    expect(loads[0]).toBeGreaterThan(0);
    expect(loads[1]).toBeGreaterThan(0);
    expect(loads[2]).toBe(0);              // 2.0#0 ohne Flow → kühl
  });

  it('mehr Last im Vormittags-Schwung als in der Mittags-Flaute', () => {
    const peak = playbookLoad(net, flows, 9.5)[0];
    const lull = playbookLoad(net, flows, 12.0)[0];
    expect(peak).toBeGreaterThan(lull);
  });

  it('10 Pers/10 m = rot (load 1); hohe Intensität gedeckelt', () => {
    const full = playbookLoad(net, [{ segmentIds: ['1.0#0'], intensity: 10 }], 9.5, { personsForRed: 10 });
    expect(full[0]).toBeGreaterThan(0.9);
    const over = playbookLoad(net, [{ segmentIds: ['1.0#0'], intensity: 100 }], 9.5, { personsForRed: 10 });
    expect(over[0]).toBe(1); // geclippt
  });

  it('überlappende Flows summieren sich je Segment', () => {
    const two: ODFlow[] = [{ segmentIds: ['1.0#0'], intensity: 4 }, { segmentIds: ['1.0#0'], intensity: 4 }];
    const one: ODFlow[] = [{ segmentIds: ['1.0#0'], intensity: 4 }];
    expect(playbookLoad(net, two, 9.5)[0]).toBeGreaterThan(playbookLoad(net, one, 9.5)[0]);
  });
});
