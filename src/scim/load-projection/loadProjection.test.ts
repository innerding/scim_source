import { describe, it, expect } from 'vitest';
import { mockLoadProjectionState } from './loadProjection.mock';
import { validateLoadProjection } from './loadProjection.validation';
import { applyLoadProjectionToContext } from './loadProjection.context';
import { mockGraphState } from '../graph/graph.mock';
import { mockExtractionState } from '../extraction/extraction.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('LoadProjection – 30.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateLoadProjection(mockLoadProjectionState, mockGraphState, mockExtractionState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('LoadProjection – 30.2 graph missing', () => {
  it('produces LP_GRAPH_MISSING', () => {
    const result = validateLoadProjection(mockLoadProjectionState, undefined, mockExtractionState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LP_GRAPH_MISSING')).toBe(true);
  });
});

describe('LoadProjection – 30.3 extraction missing', () => {
  it('produces LP_EXTRACTION_MISSING', () => {
    const result = validateLoadProjection(mockLoadProjectionState, mockGraphState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LP_EXTRACTION_MISSING')).toBe(true);
  });
});

describe('LoadProjection – 30.4 no edge scores', () => {
  it('produces LP_NO_EDGE_SCORES', () => {
    const state = { ...mockLoadProjectionState, edge_load_scores: [] };
    const result = validateLoadProjection(state, mockGraphState, mockExtractionState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LP_NO_EDGE_SCORES')).toBe(true);
  });
});

describe('LoadProjection – 30.5 load score out of range', () => {
  it('produces LP_LOAD_SCORE_OUT_OF_RANGE', () => {
    const state = {
      ...mockLoadProjectionState,
      edge_load_scores: [{ ...mockLoadProjectionState.edge_load_scores[0], normalized_load_score: -0.1 }],
    };
    const result = validateLoadProjection(state, mockGraphState, mockExtractionState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LP_LOAD_SCORE_OUT_OF_RANGE')).toBe(true);
  });
});

describe('LoadProjection – 30.6 context protection', () => {
  it('writes only load_model', () => {
    const context = makeEmptyContext();
    const updated = applyLoadProjectionToContext(context, mockLoadProjectionState);
    expect(updated.graph).toBe(context.graph);
    expect(updated.load_model).toBe(mockLoadProjectionState);
  });
});

describe('LoadProjection – 30.7 invalid status blocks apply', () => {
  it('throws when status is load_projection_invalid', () => {
    const state = { ...mockLoadProjectionState, status: 'load_projection_invalid' as const };
    expect(() => applyLoadProjectionToContext(makeEmptyContext(), state)).toThrow();
  });
});
