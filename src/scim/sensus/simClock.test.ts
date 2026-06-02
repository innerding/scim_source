import { describe, it, expect } from 'vitest';
import { nextHour, coerceSpeed, snapshotMin, SIM_CLOCK } from './simClock';

describe('simClock – nextHour (Snapshot-Schritt, umlaufend)', () => {
  it('addiert den Schritt (Default 5 Min)', () => {
    expect(nextHour(9.5)).toBeCloseTo(9.5 + 5 / 60, 9);
    expect(nextHour(9.5, 60)).toBeCloseTo(10.5, 9); // Stundenschritt
  });
  it('läuft am Tagesende auf den Start um', () => {
    expect(nextHour(SIM_CLOCK.MAX)).toBe(SIM_CLOCK.MIN);
    expect(nextHour(19.5)).toBeCloseTo(19.5 + 5 / 60, 9);
  });
});

describe('simClock – snapshotMin (Turbo-Vergröberung)', () => {
  it('Pause/lahm → 5 Min, Turbo → gröber bis Stundenschritte', () => {
    expect(snapshotMin(0)).toBe(5);
    expect(snapshotMin(40)).toBe(5);   // 40/8=5 → ≥5
    expect(snapshotMin(60)).toBe(10);  // 7.5 → 10
    expect(snapshotMin(120)).toBe(20); // 15 → 20
    expect(snapshotMin(1000)).toBe(60); // gedeckelt = Stundenschritt
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
