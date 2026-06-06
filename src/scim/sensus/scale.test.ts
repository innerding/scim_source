import { describe, it, expect } from 'vitest';
import { posForLoad, loadForPos, colorAt, colorFromStops, DEFAULT_SCALE, type ScaleSpec } from 'shell-kit';

const SPECS: ScaleSpec[] = [
  DEFAULT_SCALE,
  { stops: ['#2ecc40', '#ff2d2d'], spreizung: { mitte: 0.3, oben: 0.6, unten: 0.1 }, verjuengung: { unten: 0.5, oben: 0.9 } },
  { stops: ['#0099ff', '#00d4aa', '#c084fc', '#ec4899'], spreizung: { mitte: 0.7, oben: 0.9, unten: 0.4 }, verjuengung: { unten: 0, oben: 0 } },
];

describe('scale — Invertierbarkeit', () => {
  for (const [i, s] of SPECS.entries()) {
    for (const wrap of [false, true]) {
      it(`spec ${i} wrap=${wrap}: loadForPos(posForLoad(x)) ≈ x`, () => {
        for (let x = 0; x <= 1.0001; x += 0.1) {
          const back = loadForPos(posForLoad(x, s, wrap), s, wrap);
          expect(back).toBeCloseTo(x, 4);
        }
      });
    }
  }
});

describe('scale — Monotonie', () => {
  for (const [i, s] of SPECS.entries()) {
    it(`spec ${i}: posForLoad ist streng monoton steigend`, () => {
      let prev = -1;
      for (let x = 0; x <= 1.0001; x += 0.05) {
        const p = posForLoad(x, s, true);
        expect(p).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = p;
      }
    });
  }
});

describe('scale — Farbe', () => {
  it('colorFromStops trifft Endpunkte', () => {
    expect(colorFromStops(['#2ecc40', '#ff2d2d'], 0)).toBe('rgb(46,204,64)');
    expect(colorFromStops(['#2ecc40', '#ff2d2d'], 1)).toBe('rgb(255,45,45)');
  });
  it('colorAt liefert gültige rgb()-Farbe', () => {
    expect(colorAt(0.5, DEFAULT_SCALE)).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });
});
