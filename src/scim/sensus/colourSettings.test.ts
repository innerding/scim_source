import { describe, it, expect } from 'vitest';
import { coerceSettings, DEFAULT_COLOUR_SETTINGS } from './colourSettings';

describe('colourSettings – coerceSettings', () => {
  it('leeres/ungültiges Objekt → Defaults', () => {
    expect(coerceSettings({})).toEqual(DEFAULT_COLOUR_SETTINGS);
    expect(coerceSettings(undefined)).toEqual(DEFAULT_COLOUR_SETTINGS);
    expect(coerceSettings('müll')).toEqual(DEFAULT_COLOUR_SETTINGS);
    expect(coerceSettings(42)).toEqual(DEFAULT_COLOUR_SETTINGS);
  });

  it('clampt spread/floor in ihren Bereich', () => {
    const s = coerceSettings({ spread: -1, floor: 2 });
    expect(s.spread).toBe(0);
    expect(s.floor).toBe(1);
  });

  it('degradier: Zahl wird geclampt, sonst null (aus)', () => {
    expect(coerceSettings({ degradier: 0.6 }).degradier).toBe(0.6);
    expect(coerceSettings({ degradier: 5 }).degradier).toBe(1);
    expect(coerceSettings({ degradier: null }).degradier).toBeNull();
    expect(coerceSettings({ degradier: 'x' }).degradier).toBeNull();
    expect(coerceSettings({}).degradier).toBeNull();
  });

  it('NaN/Infinity fallen auf Default zurück', () => {
    const s = coerceSettings({ spread: NaN, floor: Infinity });
    expect(s.spread).toBe(0);
    expect(s.floor).toBe(0);
  });

  it('Felder-Modell: stops/borders/middleField übernommen + validiert', () => {
    const s = coerceSettings({ stops: ['#2ecc40', '#ff2d2d'], borders: [0.5], middleField: 0 });
    expect(s.stops).toEqual(['#2ecc40', '#ff2d2d']);
    expect(s.borders).toEqual([0.5]);
    expect(s.middleField).toBe(0);
  });
});
