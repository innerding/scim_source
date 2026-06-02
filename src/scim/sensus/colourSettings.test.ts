import { describe, it, expect } from 'vitest';
import { coerceSettings, DEFAULT_COLOUR_SETTINGS } from './colourSettings';

describe('colourSettings – coerceSettings (B1)', () => {
  it('leeres/ungültiges Objekt → Defaults', () => {
    expect(coerceSettings({})).toEqual(DEFAULT_COLOUR_SETTINGS);
    expect(coerceSettings(undefined)).toEqual(DEFAULT_COLOUR_SETTINGS);
    expect(coerceSettings('müll')).toEqual(DEFAULT_COLOUR_SETTINGS);
    expect(coerceSettings(42)).toEqual(DEFAULT_COLOUR_SETTINGS);
  });

  it('clampt jeden Wert in seinen Bereich', () => {
    const s = coerceSettings({ spectrum: 5, bias: -3, safety: 9, spread: -1, floor: 2 });
    expect(s.spectrum).toBe(1);
    expect(s.bias).toBe(-1);
    expect(s.safety).toBe(1);
    expect(s.spread).toBe(0);
    expect(s.floor).toBe(1);
  });

  it('gültige Werte gehen durch, Rest Default', () => {
    const s = coerceSettings({ spectrum: 0.3, bias: 0.5 });
    expect(s.spectrum).toBe(0.3);
    expect(s.bias).toBe(0.5);
    expect(s.safety).toBe(0);       // default
    expect(s.degradier).toBeNull(); // default
  });

  it('degradier: Zahl wird geclampt, sonst null (aus)', () => {
    expect(coerceSettings({ degradier: 0.6 }).degradier).toBe(0.6);
    expect(coerceSettings({ degradier: 5 }).degradier).toBe(1);
    expect(coerceSettings({ degradier: null }).degradier).toBeNull();
    expect(coerceSettings({ degradier: 'x' }).degradier).toBeNull();
    expect(coerceSettings({}).degradier).toBeNull();
  });

  it('NaN/Infinity fallen auf Default zurück', () => {
    const s = coerceSettings({ spectrum: NaN, bias: Infinity });
    expect(s.spectrum).toBe(0.5);
    expect(s.bias).toBe(0);
  });
});
