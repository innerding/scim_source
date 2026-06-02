import { describe, it, expect } from 'vitest';
import { heatColor, colorize, shapeLoad } from './loadColour';

describe('loadColour – colorize (A2)', () => {
  it('Defaults (spectrum 0.5, bias 0) = heatColor (rückwärtskompatibel)', () => {
    for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
      expect(colorize(t)).toBe(heatColor(t));
      expect(shapeLoad(t)).toBeCloseTo(t, 10);
    }
  });

  it('bias verschiebt die Skala (heißer), stetig — kein Sprung', () => {
    // bias +0.5 ⇒ +0.25 auf die Last
    expect(shapeLoad(0.5, { bias: 0.5 })).toBeCloseTo(0.75, 10);
    expect(colorize(0.5, { bias: 0.5 })).toBe(heatColor(0.75));
    // bias −0.5 ⇒ −0.25
    expect(shapeLoad(0.5, { bias: -0.5 })).toBeCloseTo(0.25, 10);
  });

  it('spectrum: aggressiv heizt früher, ruhig später', () => {
    // aggressiv (1): Gamma 0.5 ⇒ 0.25^0.5 = 0.5
    expect(shapeLoad(0.25, { spectrum: 1 })).toBeCloseTo(0.5, 10);
    // ruhig (0): Gamma 2 ⇒ 0.5^2 = 0.25
    expect(shapeLoad(0.5, { spectrum: 0 })).toBeCloseTo(0.25, 10);
  });

  it('bleibt stetig (keine Bandung): kleine Last-Änderung → kleine Farbänderung', () => {
    const rgb = (s: string) => s.match(/\d+/g)!.map(Number);
    const a = rgb(colorize(0.49)), b = rgb(colorize(0.51));
    const dist = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    expect(dist).toBeLessThan(40); // sanfter Übergang, kein Farbsprung
  });

  it('clampt außerhalb [0,1]', () => {
    expect(shapeLoad(-1)).toBe(0);
    expect(shapeLoad(2)).toBe(1);
    expect(colorize(-1)).toBe(heatColor(0));
    expect(colorize(2)).toBe(heatColor(1));
  });
});
