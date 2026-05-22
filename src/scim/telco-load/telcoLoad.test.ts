import { describe, it, expect } from 'vitest';
import { mockTelcoLoadState } from './telcoLoad.mock';
import { validateTelcoLoad } from './telcoLoad.validation';
import { applyTelcoLoadToContext } from './telcoLoad.context';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('TelcoLoad – 23.1 valid mock passes validation', () => {
  it('mock state is valid with system adjust', () => {
    const result = validateTelcoLoad(mockTelcoLoadState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('TelcoLoad – 23.2 system adjust missing', () => {
  it('produces TELCO_SYSTEM_ADJUST_MISSING', () => {
    const result = validateTelcoLoad(mockTelcoLoadState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'TELCO_SYSTEM_ADJUST_MISSING')).toBe(true);
  });
});

describe('TelcoLoad – 23.3 signal count too low', () => {
  it('produces TELCO_SIGNAL_COUNT_TOO_LOW', () => {
    const state = {
      ...mockTelcoLoadState,
      load_signals: [
        {
          ...mockTelcoLoadState.load_signals[0],
          metrics: {
            ...mockTelcoLoadState.load_signals[0].metrics,
            signal_count: 1,
          },
        },
      ],
    };
    const result = validateTelcoLoad(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'TELCO_SIGNAL_COUNT_TOO_LOW')).toBe(true);
  });
});

describe('TelcoLoad – 23.4 raw signal payload forbidden', () => {
  it('produces TELCO_RAW_SIGNAL_PAYLOAD_FORBIDDEN on signal group', () => {
    const state = {
      ...mockTelcoLoadState,
      load_signals: [
        {
          ...mockTelcoLoadState.load_signals[0],
          privacy: {
            ...mockTelcoLoadState.load_signals[0].privacy,
            raw_signal_payload_present: true as unknown as false,
          },
        },
      ],
    };
    const result = validateTelcoLoad(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'TELCO_RAW_SIGNAL_PAYLOAD_FORBIDDEN')).toBe(true);
  });
});

describe('TelcoLoad – 23.5 expired group usable for runtime', () => {
  it('produces TELCO_GROUP_EXPIRED_RUNTIME_FORBIDDEN', () => {
    const state = {
      ...mockTelcoLoadState,
      load_signals: [
        {
          ...mockTelcoLoadState.load_signals[0],
          validity: {
            ...mockTelcoLoadState.load_signals[0].validity,
            expired: true,
            usable_for_runtime: true,
          },
        },
      ],
    };
    const result = validateTelcoLoad(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'TELCO_GROUP_EXPIRED_RUNTIME_FORBIDDEN')).toBe(true);
  });
});

describe('TelcoLoad – 23.6 privacy check invalid blocks context apply', () => {
  it('throws when privacy_check.is_privacy_valid is false', () => {
    const state = {
      ...mockTelcoLoadState,
      privacy_check: {
        ...mockTelcoLoadState.privacy_check,
        is_privacy_valid: false,
      },
    };
    const context = makeEmptyContext();
    expect(() => applyTelcoLoadToContext(context, state)).toThrow('invalid privacy check');
  });
});

describe('TelcoLoad – 23.7 invalid status blocks context apply', () => {
  it('throws when status is telco_load_invalid', () => {
    const state = { ...mockTelcoLoadState, status: 'telco_load_invalid' as const };
    const context = makeEmptyContext();
    expect(() => applyTelcoLoadToContext(context, state)).toThrow();
  });
});

describe('TelcoLoad – 23.8 context protection', () => {
  it('does not mutate other context keys', () => {
    const context = makeEmptyContext();
    const updated = applyTelcoLoadToContext(context, mockTelcoLoadState);
    expect(updated.system_adjust).toBe(context.system_adjust);
    expect(updated.regio_content).toBe(context.regio_content);
    expect(updated.target_app_ui).toBe(context.target_app_ui);
    expect(updated.telco_load).toBe(mockTelcoLoadState);
  });
});
