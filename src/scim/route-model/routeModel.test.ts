import { describe, it, expect } from 'vitest';
import { mockRouteModelState } from './routeModel.mock';
import { validateRouteModel } from './routeModel.validation';
import { applyRouteModelToContext } from './routeModel.context';
import { mockMovementModelState } from '../movement-model/movementModel.mock';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('RouteModel – 33.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateRouteModel(mockRouteModelState, mockMovementModelState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('RouteModel – 33.2 movement model missing', () => {
  it('produces ROUTE_MOVEMENT_MODEL_MISSING', () => {
    const result = validateRouteModel(mockRouteModelState, undefined, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'ROUTE_MOVEMENT_MODEL_MISSING')).toBe(true);
  });
});

describe('RouteModel – 33.3 degrade threshold >= exclude threshold', () => {
  it('produces ROUTE_DEGRADE_EXCEEDS_EXCLUDE', () => {
    const state = { ...mockRouteModelState, route_degrade_threshold: 0.9, route_exclude_threshold: 0.8 };
    const result = validateRouteModel(state, mockMovementModelState, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'ROUTE_DEGRADE_EXCEEDS_EXCLUDE')).toBe(true);
  });
});

describe('RouteModel – 33.4 no edge evaluations', () => {
  it('produces ROUTE_NO_EVALUATIONS', () => {
    const state = { ...mockRouteModelState, edge_evaluations: [], metrics: { ...mockRouteModelState.metrics, evaluated_edge_count: 0 } };
    const result = validateRouteModel(state, mockMovementModelState, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'ROUTE_NO_EVALUATIONS')).toBe(true);
  });
});

describe('RouteModel – 33.5 all excluded triggers warning', () => {
  it('produces ROUTE_ALL_EXCLUDED as warning', () => {
    const state = {
      ...mockRouteModelState,
      edge_evaluations: mockRouteModelState.edge_evaluations.map(e => ({ ...e, decision: 'exclude' as const })),
      metrics: { ...mockRouteModelState.metrics, excluded_edge_count: 3, included_edge_count: 0 },
    };
    const result = validateRouteModel(state, mockMovementModelState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'ROUTE_ALL_EXCLUDED')).toBe(true);
  });
});

describe('RouteModel – 33.6 context protection', () => {
  it('writes only route_model', () => {
    const context = makeEmptyContext();
    const updated = applyRouteModelToContext(context, mockRouteModelState);
    expect(updated.movement_model).toBe(context.movement_model);
    expect(updated.route_model).toBe(mockRouteModelState);
  });
});

describe('RouteModel – 33.7 invalid status blocks apply', () => {
  it('throws when status is route_model_invalid', () => {
    const state = { ...mockRouteModelState, status: 'route_model_invalid' as const };
    expect(() => applyRouteModelToContext(makeEmptyContext(), state)).toThrow();
  });
});
