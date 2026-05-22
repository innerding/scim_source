import { describe, it, expect } from 'vitest';
import { mockTargetAppUiState } from './targetAppUi.mock';
import { validateTargetAppUi } from './targetAppUi.validation';
import { applyTargetAppUiToContext } from './targetAppUi.context';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { mockRegioContentState } from '../regio-content/regioContent.mock';
import { makeEmptyContext } from '../context/scimContext.types';
import type { TargetAppUiState, VisibleLayerConfig } from './targetAppUi.types';

function clone(overrides: Partial<TargetAppUiState>): TargetAppUiState {
  return { ...mockTargetAppUiState, ...overrides };
}

// ── Valid mock ────────────────────────────────────────────────────────────────

describe('TargetAppUi validation — valid mock', () => {
  it('mock state passes validation', () => {
    const result = validateTargetAppUi(mockTargetAppUiState, mockSystemAdjustState, mockRegioContentState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(mockTargetAppUiState.status).toBe('target_app_ui_valid');
  });
});

// ── System-Adjust missing ─────────────────────────────────────────────────────

describe('TargetAppUi validation — system_adjust missing', () => {
  it('blocks when system_adjust is undefined', () => {
    const result = validateTargetAppUi(mockTargetAppUiState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'TAPP_SYSTEM_ADJUST_MISSING')).toBe(true);
  });
});

// ── Raw layer visible forbidden ───────────────────────────────────────────────

describe('TargetAppUi validation — raw layer visible', () => {
  it('blocks raw_signals layer marked as sensus_core_visible', () => {
    const badLayer: VisibleLayerConfig = {
      layer_id: 'layer_raw',
      layer_type: 'raw_signals',
      label: 'Raw',
      enabled_by_default: false,
      user_toggle_allowed: false,
      visibility: 'sensus_core_visible',
      data_class: 'raw_signal',
      reduction_required: false,
    };
    const state = clone({ visible_layers: [...mockTargetAppUiState.visible_layers, badLayer] });
    const result = validateTargetAppUi(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'TAPP_RAW_LAYER_VISIBLE_FORBIDDEN')).toBe(true);
  });
});

// ── Debug layer visible forbidden ─────────────────────────────────────────────

describe('TargetAppUi validation — debug layer visible', () => {
  it('blocks debug_graph layer as sensus_core_visible', () => {
    const layers = mockTargetAppUiState.visible_layers.map((l) =>
      l.layer_type === 'debug_graph' ? { ...l, visibility: 'sensus_core_visible' as const } : l,
    );
    const state = clone({ visible_layers: layers });
    const result = validateTargetAppUi(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'TAPP_DEBUG_LAYER_VISIBLE_FORBIDDEN')).toBe(true);
  });
});

// ── Multiple default route modes ──────────────────────────────────────────────

describe('TargetAppUi validation — multiple default route modes', () => {
  it('blocks multiple default_selected route modes', () => {
    const state = clone({
      available_route_modes: mockTargetAppUiState.available_route_modes.map((m) => ({
        ...m,
        default_selected: true,
      })),
    });
    const result = validateTargetAppUi(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'TAPP_MULTIPLE_DEFAULT_ROUTE_MODES')).toBe(true);
  });
});

// ── Reduction profile violations ──────────────────────────────────────────────

describe('TargetAppUi validation — reduction profile', () => {
  it('blocks when remove_raw_signals is not true', () => {
    const state = clone({
      reduction_profile: {
        ...mockTargetAppUiState.reduction_profile,
        remove_raw_signals: false as unknown as true,
      },
    });
    const result = validateTargetAppUi(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'TAPP_RAW_SIGNALS_NOT_REMOVED')).toBe(true);
  });

  it('blocks forbidden data class in allowed_output_data_classes', () => {
    const state = clone({
      reduction_profile: {
        ...mockTargetAppUiState.reduction_profile,
        allowed_output_data_classes: ['debug'],
      },
    });
    const result = validateTargetAppUi(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'TAPP_FORBIDDEN_OUTPUT_DATA_CLASS')).toBe(true);
  });
});

// ── Release blocked ───────────────────────────────────────────────────────────

describe('TargetAppUi validation — release not released', () => {
  it('blocks when release_status is draft', () => {
    const state = clone({
      release: { ...mockTargetAppUiState.release, release_status: 'draft' },
    });
    const result = validateTargetAppUi(state, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'TAPP_RELEASE_NOT_RELEASED')).toBe(true);
  });
});

// ── Context protection ────────────────────────────────────────────────────────

describe('TargetAppUi context apply', () => {
  it('writes only target_app_ui and leaves other context keys intact', () => {
    const sa = { status: 'system_adjust_valid' };
    const regio = { status: 'regio_content_valid' };
    const ctx = { ...makeEmptyContext(), system_adjust: sa, regio_content: regio };
    const ctxAfter = applyTargetAppUiToContext(ctx, mockTargetAppUiState);
    expect(ctxAfter.target_app_ui).toBe(mockTargetAppUiState);
    expect(ctxAfter.system_adjust).toBe(sa);
    expect(ctxAfter.regio_content).toBe(regio);
  });

  it('throws if status is not valid', () => {
    const state = clone({ status: 'target_app_ui_invalid' });
    expect(() => applyTargetAppUiToContext(makeEmptyContext(), state)).toThrow();
  });
});
