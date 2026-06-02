import { describe, it, expect } from 'vitest';
import { heatColor, colorize, shapeLoad, PALETTES, DEFAULT_PALETTE } from './loadColour';

describe('loadColour – shapeLoad (Last-Beugung)', () => {
  it('Defaults (spectrum 0.5, bias 0) = Identität', () => {
    for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) expect(shapeLoad(t)).toBeCloseTo(t, 10);
  });
  it('bias verschiebt (heißer/kühler)', () => {
    expect(shapeLoad(0.5, { bias: 0.5 })).toBeCloseTo(0.75, 10);
    expect(shapeLoad(0.5, { bias: -0.5 })).toBeCloseTo(0.25, 10);
  });
  it('spectrum: aggressiv heizt früher, ruhig später', () => {
    expect(shapeLoad(0.25, { spectrum: 1 })).toBeCloseTo(0.5, 10);
    expect(shapeLoad(0.5, { spectrum: 0 })).toBeCloseTo(0.25, 10);
  });
  it('clampt außerhalb [0,1]', () => {
    expect(shapeLoad(-1)).toBe(0);
    expect(shapeLoad(2)).toBe(1);
  });
});

describe('loadColour – colorize (Paletten, #1)', () => {
  it('Palette heat = heatColor (rückwärtskompatibel)', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) expect(colorize(t, { palette: 'heat' })).toBe(heatColor(t));
  });
  it('Default-Palette ist green_violet (≠ heat)', () => {
    expect(DEFAULT_PALETTE).toBe('green_violet');
    expect(colorize(0.2)).not.toBe(colorize(0.2, { palette: 'heat' }));
  });
  it('drei Paletten vorhanden, jede gibt rgb', () => {
    for (const id of Object.keys(PALETTES) as Array<keyof typeof PALETTES>) {
      expect(colorize(0.5, { palette: id })).toMatch(/^rgb\(/);
    }
  });
  it('bleibt stetig (keine Bandung): kleine Last-Änderung → kleine Farbänderung', () => {
    const rgb = (s: string) => s.match(/\d+/g)!.map(Number);
    const a = rgb(colorize(0.49)), b = rgb(colorize(0.51));
    expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(60);
  });
  it('unbekannte Palette → Default', () => {
    // @ts-expect-error absichtlich ungültig
    expect(colorize(0.3, { palette: 'müll' })).toBe(colorize(0.3));
  });
});
