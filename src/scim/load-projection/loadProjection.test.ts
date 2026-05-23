import { describe, it, expect } from 'vitest';
import { mockLoadProjectionState, mockLoadProjectionStateFiltered } from './loadProjection.mock';
import { validateLoadProjection } from './loadProjection.validation';
import { applyLoadProjectionToContext } from './loadProjection.context';
import { mockGraphState } from '../graph/graph.mock';
import { mockExtractionState } from '../extraction/extraction.mock';
import { mockSignalInterpretationState } from '../signal-interpretation/signalInterpretation.mock';
import { makeEmptyContext } from '../context/scimContext.types';

// ── 30.1 Gültiger Mock ────────────────────────────────────────────────────────

describe('LoadProjection – 30.1 valid mock passes validation', () => {
  it('mock state is valid (ohne SignalInterpretation)', () => {
    const result = validateLoadProjection(mockLoadProjectionState, mockGraphState, mockExtractionState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('filtered mock state is valid (mit SignalInterpretation)', () => {
    const result = validateLoadProjection(
      mockLoadProjectionStateFiltered,
      mockGraphState,
      mockExtractionState,
      mockSignalInterpretationState,
    );
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('filtered mock has excluded_accumulation_point_count > 0', () => {
    expect(mockLoadProjectionStateFiltered.metrics.excluded_accumulation_point_count).toBeGreaterThan(0);
    expect(mockLoadProjectionStateFiltered.signal_interpretation_id).toBeDefined();
  });

  it('filtered mock scores are all signal_filtered = true', () => {
    expect(
      mockLoadProjectionStateFiltered.edge_load_scores.every(s => s.signal_filtered),
    ).toBe(true);
  });
});

// ── 30.2 Graph missing ────────────────────────────────────────────────────────

describe('LoadProjection – 30.2 graph missing', () => {
  it('produces LP_GRAPH_MISSING', () => {
    const result = validateLoadProjection(mockLoadProjectionState, undefined, mockExtractionState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LP_GRAPH_MISSING')).toBe(true);
  });
});

// ── 30.3 Extraction missing ───────────────────────────────────────────────────

describe('LoadProjection – 30.3 extraction missing', () => {
  it('produces LP_EXTRACTION_MISSING', () => {
    const result = validateLoadProjection(mockLoadProjectionState, mockGraphState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LP_EXTRACTION_MISSING')).toBe(true);
  });
});

// ── 30.4 No edge scores ───────────────────────────────────────────────────────

describe('LoadProjection – 30.4 no edge scores', () => {
  it('produces LP_NO_EDGE_SCORES', () => {
    const state = { ...mockLoadProjectionState, edge_load_scores: [] };
    const result = validateLoadProjection(state, mockGraphState, mockExtractionState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LP_NO_EDGE_SCORES')).toBe(true);
  });
});

// ── 30.5 Load score out of range ──────────────────────────────────────────────

describe('LoadProjection – 30.5 load score out of range', () => {
  it('produces LP_LOAD_SCORE_OUT_OF_RANGE', () => {
    const state = {
      ...mockLoadProjectionState,
      edge_load_scores: [
        { ...mockLoadProjectionState.edge_load_scores[0], normalized_load_score: -0.1 },
      ],
    };
    const result = validateLoadProjection(state, mockGraphState, mockExtractionState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LP_LOAD_SCORE_OUT_OF_RANGE')).toBe(true);
  });
});

// ── 30.6 Context protection ───────────────────────────────────────────────────

describe('LoadProjection – 30.6 context protection', () => {
  it('writes only load_model', () => {
    const context = makeEmptyContext();
    const updated = applyLoadProjectionToContext(context, mockLoadProjectionState);
    expect(updated.graph).toBe(context.graph);
    expect(updated.load_model).toBe(mockLoadProjectionState);
  });
});

// ── 30.7 Invalid status blocks apply ─────────────────────────────────────────

describe('LoadProjection – 30.7 invalid status blocks apply', () => {
  it('throws when status is load_projection_invalid', () => {
    const state = { ...mockLoadProjectionState, status: 'load_projection_invalid' as const };
    expect(() => applyLoadProjectionToContext(makeEmptyContext(), state)).toThrow();
  });
});

// ── 30.8 Signal-Interpretation fehlt ─────────────────────────────────────────

describe('LoadProjection – 30.8 signal interpretation missing', () => {
  it('warns when no SignalInterpretation passed', () => {
    const result = validateLoadProjection(
      mockLoadProjectionState,
      mockGraphState,
      mockExtractionState,
      undefined,  // kein SignalInterpretation
    );
    expect(result.warnings.some(w => w.code === 'LP_SIGNAL_INTERPRETATION_MISSING')).toBe(true);
  });

  it('no warning when SignalInterpretation is present', () => {
    const result = validateLoadProjection(
      mockLoadProjectionStateFiltered,
      mockGraphState,
      mockExtractionState,
      mockSignalInterpretationState,
    );
    expect(result.warnings.some(w => w.code === 'LP_SIGNAL_INTERPRETATION_MISSING')).toBe(false);
  });
});

// ── 30.9 Hohe Ausschlussquote ─────────────────────────────────────────────────

describe('LoadProjection – 30.9 high exclusion rate warning', () => {
  it('warns when >50% of signal points are accumulation', () => {
    const manyAccumulation = {
      ...mockSignalInterpretationState,
      summary: {
        ...mockSignalInterpretationState.summary,
        flow_count: 1,
        accumulation_count: 8,
        ambiguous_count: 1,
      },
      classified_points: mockSignalInterpretationState.classified_points, // Anzahl egal für Warnung
    };
    // Wir konstruieren einen State mit passender summary
    const result = validateLoadProjection(
      mockLoadProjectionStateFiltered,
      mockGraphState,
      mockExtractionState,
      manyAccumulation,
    );
    expect(result.warnings.some(w => w.code === 'LP_HIGH_EXCLUSION_RATE')).toBe(true);
  });
});

// ── 30.10 Keine flow-Signale ──────────────────────────────────────────────────

describe('LoadProjection – 30.10 no flow signals blocks', () => {
  it('blocks when all points are accumulation', () => {
    const allAccumulation = {
      ...mockSignalInterpretationState,
      classified_points: mockSignalInterpretationState.classified_points,
      summary: {
        flow_count: 0,
        accumulation_count: 4,
        ambiguous_count: 0,
        forced_by_zone_count: 2,
      },
    };
    const result = validateLoadProjection(
      mockLoadProjectionStateFiltered,
      mockGraphState,
      mockExtractionState,
      allAccumulation,
    );
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LP_NO_FLOW_SIGNALS')).toBe(true);
  });
});
