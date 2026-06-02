import { describe, it, expect } from 'vitest';
import { coerceExclusion } from './userExclusion';

describe('userExclusion – coerceExclusion (C1)', () => {
  it('Zahl wird geclampt', () => {
    expect(coerceExclusion(0.7)).toBe(0.7);
    expect(coerceExclusion(5)).toBe(1);
    expect(coerceExclusion(-1)).toBe(0);
  });
  it('null / undefined → null (kein Ausschluss)', () => {
    expect(coerceExclusion(null)).toBeNull();
    expect(coerceExclusion(undefined)).toBeNull();
  });
  it('String (aus localStorage) wird geparst', () => {
    expect(coerceExclusion('0.5')).toBe(0.5);
    expect(coerceExclusion('x')).toBeNull();
  });
  it('NaN/Infinity → null', () => {
    expect(coerceExclusion(NaN)).toBeNull();
    expect(coerceExclusion(Infinity)).toBeNull();
  });
});
