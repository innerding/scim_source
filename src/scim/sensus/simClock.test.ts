import { describe, it, expect } from 'vitest';
import { nextHour, coerceSpeed, SIM_CLOCK } from './simClock';

describe('simClock – nextHour (5-Min-Schritt, umlaufend)', () => {
  it('addiert 5 Sim-Min (= 5/60 h)', () => {
    expect(nextHour(9.5)).toBeCloseTo(9.5 + 5 / 60, 9);
  });
  it('läuft am Tagesende auf den Start um', () => {
    expect(nextHour(SIM_CLOCK.MAX)).toBe(SIM_CLOCK.MIN);
    expect(nextHour(19.5)).toBeCloseTo(19.5 + 5 / 60, 9); // mitten am Tag: kein Umlauf
  });
});

describe('simClock – coerceSpeed', () => {
  it('clampt auf ≥ 0, ungültig → 0', () => {
    expect(coerceSpeed(60)).toBe(60);
    expect(coerceSpeed(-5)).toBe(0);
    expect(coerceSpeed(NaN)).toBe(0);
    expect(coerceSpeed('x')).toBe(0);
    expect(coerceSpeed(undefined)).toBe(0);
  });
});
