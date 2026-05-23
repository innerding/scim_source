import { describe, it, expect } from 'vitest';
import { mockOperatorDecisionState, mockOperatorDecisionPending } from './operatorDecision.mock';
import { validateOperatorDecision } from './operatorDecision.validation';
import { applyOperatorDecisionToContext } from './operatorDecision.context';
import { mockStayZoneDetectorState } from '../stay-zone-detector/stayZoneDetector.mock';
import { makeEmptyContext } from '../context/scimContext.types';

// ── 38.1 Valid mock ───────────────────────────────────────────────────────────

describe('OperatorDecision – 38.1 valid mock passes validation', () => {
  it('completed mock is valid', () => {
    const result = validateOperatorDecision(mockOperatorDecisionState, mockStayZoneDetectorState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ── 38.2 Detector missing / mismatch ─────────────────────────────────────────

describe('OperatorDecision – 38.2 detector checks', () => {
  it('blocks when detector is missing', () => {
    const result = validateOperatorDecision(mockOperatorDecisionState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'OPDEC_DETECTOR_MISSING')).toBe(true);
  });

  it('blocks when detector_id does not match', () => {
    const wrongDetector = { ...mockStayZoneDetectorState, detector_id: 'szd_other' };
    const result = validateOperatorDecision(mockOperatorDecisionState, wrongDetector);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'OPDEC_DETECTOR_ID_MISMATCH')).toBe(true);
  });
});

// ── 38.3 Tab 2: Überlappungsmeldung ──────────────────────────────────────────

describe('OperatorDecision – 38.3 overlap resolutions', () => {
  it('blocks when overlap resolution has fewer than 2 zone_ids', () => {
    const state = {
      ...mockOperatorDecisionState,
      overlap_resolutions: [
        { ...mockOperatorDecisionState.overlap_resolutions[0], zone_ids: ['zone_001'] },
      ],
    };
    const result = validateOperatorDecision(state, mockStayZoneDetectorState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'OPDEC_OVERLAP_TOO_FEW_ZONES')).toBe(true);
  });

  it('blocks when freflaeche_defined but no geometry', () => {
    const state = {
      ...mockOperatorDecisionState,
      overlap_resolutions: [
        { ...mockOperatorDecisionState.overlap_resolutions[0], freflaeche_geometry: undefined },
      ],
    };
    const result = validateOperatorDecision(state, mockStayZoneDetectorState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'OPDEC_FREFLAECHE_MISSING')).toBe(true);
  });
});

// ── 38.4 Tab 3: Off-path-Zone ─────────────────────────────────────────────────

describe('OperatorDecision – 38.4 off-path decisions', () => {
  it('warns when off-path decision is pending', () => {
    const state = {
      ...mockOperatorDecisionState,
      off_path_decisions: [
        { ...mockOperatorDecisionState.off_path_decisions[0], result: 'pending' as const },
      ],
    };
    const result = validateOperatorDecision(state, mockStayZoneDetectorState);
    expect(result.warnings.some(w => w.code === 'OPDEC_OFF_PATH_PENDING')).toBe(true);
  });

  it('warns when overridden_included without override_reason', () => {
    const state = {
      ...mockOperatorDecisionState,
      off_path_decisions: [
        { ...mockOperatorDecisionState.off_path_decisions[0], result: 'overridden_included' as const },
      ],
    };
    const result = validateOperatorDecision(state, mockStayZoneDetectorState);
    expect(result.warnings.some(w => w.code === 'OPDEC_OFF_PATH_OVERRIDE_NO_REASON')).toBe(true);
  });
});

// ── 38.5 Tab 4: Stau-Schnittmodell ───────────────────────────────────────────

describe('OperatorDecision – 38.5 stau commits', () => {
  it('warns when step2 active but no stau_commits present', () => {
    const state = {
      ...mockOperatorDecisionState,
      prerequisites: { ...mockOperatorDecisionState.prerequisites, step2_activation_condition_met: true },
      stau_commits: [],
    };
    const result = validateOperatorDecision(state, mockStayZoneDetectorState);
    expect(result.warnings.some(w => w.code === 'OPDEC_STAU_COMMIT_MISSING')).toBe(true);
  });

  it('warns when stau commit is pending', () => {
    const result = validateOperatorDecision(mockOperatorDecisionPending, mockStayZoneDetectorState);
    expect(result.warnings.some(w => w.code === 'OPDEC_STAU_PENDING')).toBe(true);
  });

  it('warns when rejected without rejection_reason', () => {
    const state = {
      ...mockOperatorDecisionPending,
      stau_commits: [
        { ...mockOperatorDecisionPending.stau_commits[0], result: 'rejected' as const },
      ],
    };
    const result = validateOperatorDecision(state, mockStayZoneDetectorState);
    expect(result.warnings.some(w => w.code === 'OPDEC_STAU_REJECTED_NO_REASON')).toBe(true);
  });
});

// ── 38.6 Context ─────────────────────────────────────────────────────────────

describe('OperatorDecision – 38.6 context apply', () => {
  it('writes operator_decision to context', () => {
    const ctx = makeEmptyContext();
    const updated = applyOperatorDecisionToContext(ctx, mockOperatorDecisionState);
    expect(updated.operator_decision).toBe(mockOperatorDecisionState);
  });

  it('does not mutate other context keys', () => {
    const ctx = { ...makeEmptyContext(), stay_zone_detector: { status: 'stay_zone_valid' } };
    const updated = applyOperatorDecisionToContext(ctx, mockOperatorDecisionState);
    expect(updated.stay_zone_detector).toBe(ctx.stay_zone_detector);
  });

  it('throws when status is operator_decision_invalid', () => {
    const invalid = { ...mockOperatorDecisionState, status: 'operator_decision_invalid' as const };
    expect(() => applyOperatorDecisionToContext(makeEmptyContext(), invalid)).toThrow();
  });
});
