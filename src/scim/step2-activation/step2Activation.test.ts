import { describe, it, expect } from 'vitest';
import {
  mockStep2ActivationNotTriggered,
  mockStep2ActivationConfirmed,
  mockStep2ActivationAwaiting,
} from './step2Activation.mock';
import { validateStep2Activation } from './step2Activation.validation';
import { applyStep2ActivationToContext } from './step2Activation.context';
import { makeEmptyContext } from '../context/scimContext.types';

// ── 39.1 Valid mocks ──────────────────────────────────────────────────────────

describe('Step2Activation – 39.1 valid mocks pass validation', () => {
  it('not_triggered mock is valid', () => {
    const result = validateStep2Activation(mockStep2ActivationNotTriggered);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('operator_confirmed mock is valid', () => {
    const result = validateStep2Activation(mockStep2ActivationConfirmed);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('awaiting mock is valid but has warning', () => {
    const result = validateStep2Activation(mockStep2ActivationAwaiting);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'S2A_AWAITING_OPERATOR')).toBe(true);
  });
});

// ── 39.2 Trigger-Konsistenz ───────────────────────────────────────────────────

describe('Step2Activation – 39.2 trigger consistency', () => {
  it('blocks when jam_count 0 but status is triggered', () => {
    const state = {
      ...mockStep2ActivationAwaiting,
      trigger: { ...mockStep2ActivationAwaiting.trigger, jam_count: 0 },
    };
    const result = validateStep2Activation(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'S2A_NO_JAM_BUT_TRIGGERED')).toBe(true);
  });

  it('blocks when jam_count > 0 but triggering_zone_ids is empty', () => {
    const state = {
      ...mockStep2ActivationAwaiting,
      trigger: { ...mockStep2ActivationAwaiting.trigger, triggering_zone_ids: [] },
    };
    const result = validateStep2Activation(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'S2A_JAM_ZONES_MISSING')).toBe(true);
  });
});

// ── 39.3 Entscheidungs-Konsistenz ─────────────────────────────────────────────

describe('Step2Activation – 39.3 decision consistency', () => {
  it('blocks when confirmed but mode is movement_only', () => {
    const state = {
      ...mockStep2ActivationConfirmed,
      resulting_classification_mode: 'movement_only' as const,
    };
    const result = validateStep2Activation(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'S2A_CONFIRMED_MODE_MISMATCH')).toBe(true);
  });

  it('blocks when confirmed but no decision recorded', () => {
    const state = { ...mockStep2ActivationConfirmed, decision: undefined };
    const result = validateStep2Activation(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'S2A_CONFIRMED_NO_DECISION')).toBe(true);
  });

  it('blocks when rejected but mode is movement_and_stay', () => {
    const state = {
      ...mockStep2ActivationConfirmed,
      status: 'operator_rejected' as const,
      resulting_classification_mode: 'movement_and_stay' as const,
    };
    const result = validateStep2Activation(state);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'S2A_REJECTED_MODE_MISMATCH')).toBe(true);
  });

  it('warns when deferred without defer_until', () => {
    const state = {
      ...mockStep2ActivationAwaiting,
      status: 'operator_deferred' as const,
      decision: { result: 'deferred' as const, decided_by: 'operator_a', decided_at: '2026-05-23T12:10:00.000Z' },
    };
    const result = validateStep2Activation(state);
    expect(result.warnings.some(w => w.code === 'S2A_DEFERRED_NO_DATE')).toBe(true);
  });

  it('warns when rejected without rejection_reason', () => {
    const state = {
      ...mockStep2ActivationAwaiting,
      status: 'operator_rejected' as const,
      decision: { result: 'rejected' as const, decided_by: 'operator_a', decided_at: '2026-05-23T12:10:00.000Z' },
    };
    const result = validateStep2Activation(state);
    expect(result.warnings.some(w => w.code === 'S2A_REJECTED_NO_REASON')).toBe(true);
  });
});

// ── 39.4 Context ─────────────────────────────────────────────────────────────

describe('Step2Activation – 39.4 context apply', () => {
  it('writes step2_activation and updates classification_mode', () => {
    const ctx = makeEmptyContext();
    const updated = applyStep2ActivationToContext(ctx, mockStep2ActivationConfirmed);
    expect(updated.step2_activation).toBe(mockStep2ActivationConfirmed);
    expect(updated.classification_mode).toBe('movement_and_stay');
  });

  it('keeps movement_only when not confirmed', () => {
    const ctx = makeEmptyContext();
    const updated = applyStep2ActivationToContext(ctx, mockStep2ActivationNotTriggered);
    expect(updated.classification_mode).toBe('movement_only');
  });

  it('does not mutate other context keys', () => {
    const ctx = { ...makeEmptyContext(), system_adjust: { status: 'system_adjust_valid' } };
    const updated = applyStep2ActivationToContext(ctx, mockStep2ActivationConfirmed);
    expect(updated.system_adjust).toBe(ctx.system_adjust);
  });

  it('throws when status is step2_activation_invalid', () => {
    const invalid = { ...mockStep2ActivationConfirmed, status: 'step2_activation_invalid' as const };
    expect(() => applyStep2ActivationToContext(makeEmptyContext(), invalid)).toThrow();
  });
});
