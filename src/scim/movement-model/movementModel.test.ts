import { describe, it, expect } from 'vitest';
import { mockMovementModelState } from './movementModel.mock';
import { validateMovementModel } from './movementModel.validation';
import { applyMovementModelToContext } from './movementModel.context';
import { mockGraphState } from '../graph/graph.mock';
import { mockLoadProjectionState } from '../load-projection/loadProjection.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('MovementModel – 31.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateMovementModel(mockMovementModelState, mockGraphState, mockLoadProjectionState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('MovementModel – 31.2 graph missing', () => {
  it('produces MM_GRAPH_MISSING', () => {
    const result = validateMovementModel(mockMovementModelState, undefined, mockLoadProjectionState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'MM_GRAPH_MISSING')).toBe(true);
  });
});

describe('MovementModel – 31.3 load projection missing', () => {
  it('produces MM_LOAD_PROJECTION_MISSING', () => {
    const result = validateMovementModel(mockMovementModelState, mockGraphState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'MM_LOAD_PROJECTION_MISSING')).toBe(true);
  });
});

describe('MovementModel – 31.4 ratio sum invalid', () => {
  it('produces MM_RATIO_SUM_INVALID', () => {
    const state = {
      ...mockMovementModelState,
      edge_movement_states: [
        { ...mockMovementModelState.edge_movement_states[0], movement_ratio: 0.9, stillness_ratio: 0.5 },
      ],
    };
    const result = validateMovementModel(state, mockGraphState, mockLoadProjectionState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'MM_RATIO_SUM_INVALID')).toBe(true);
  });
});

describe('MovementModel – 31.5 all static triggers warning', () => {
  it('produces MM_ALL_STATIC as warning', () => {
    const state = {
      ...mockMovementModelState,
      edge_movement_states: mockMovementModelState.edge_movement_states.map(e => ({
        ...e,
        movement_class: 'static' as const,
      })),
    };
    const result = validateMovementModel(state, mockGraphState, mockLoadProjectionState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'MM_ALL_STATIC')).toBe(true);
  });
});

describe('MovementModel – 31.6 context protection', () => {
  it('writes only movement_model', () => {
    const context = makeEmptyContext();
    const updated = applyMovementModelToContext(context, mockMovementModelState);
    expect(updated.load_model).toBe(context.load_model);
    expect(updated.movement_model).toBe(mockMovementModelState);
  });
});

describe('MovementModel – 31.7 invalid status blocks apply', () => {
  it('throws when status is movement_model_invalid', () => {
    const state = { ...mockMovementModelState, status: 'movement_model_invalid' as const };
    expect(() => applyMovementModelToContext(makeEmptyContext(), state)).toThrow();
  });
});
