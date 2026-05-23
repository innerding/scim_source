import { describe, it, expect } from 'vitest';
import { mockGraphState } from './graph.mock';
import { validateGraph } from './graph.validation';
import { applyGraphToContext } from './graph.context';
import { mockBoundaryState } from '../boundary/boundary.mock';
import { mockExtractionState } from '../extraction/extraction.mock';
import { mockSystemAdjustState } from '../system-adjust/systemAdjust.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('Graph – 27.1 valid mock passes validation', () => {
  it('mock state is valid with boundary, extraction and system adjust', () => {
    const result = validateGraph(mockGraphState, mockBoundaryState, mockExtractionState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Graph – 27.2 boundary missing', () => {
  it('produces GRAPH_BOUNDARY_MISSING', () => {
    const result = validateGraph(mockGraphState, undefined);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'GRAPH_BOUNDARY_MISSING')).toBe(true);
  });
});

describe('Graph – 27.3 boundary invalid status', () => {
  it('produces GRAPH_BOUNDARY_INVALID', () => {
    const boundary = { ...mockBoundaryState, status: 'boundary_error' as const };
    const result = validateGraph(mockGraphState, boundary);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'GRAPH_BOUNDARY_INVALID')).toBe(true);
  });
});

describe('Graph – 27.4 no nodes', () => {
  it('produces GRAPH_NO_NODES', () => {
    const state = { ...mockGraphState, nodes: [], metrics: { ...mockGraphState.metrics, node_count: 0 } };
    const result = validateGraph(state, mockBoundaryState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'GRAPH_NO_NODES')).toBe(true);
  });
});

describe('Graph – 27.5 no edges', () => {
  it('produces GRAPH_NO_EDGES', () => {
    const state = { ...mockGraphState, edges: [], metrics: { ...mockGraphState.metrics, edge_count: 0 } };
    const result = validateGraph(state, mockBoundaryState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'GRAPH_NO_EDGES')).toBe(true);
  });
});

describe('Graph – 27.6 edge below min length', () => {
  it('produces GRAPH_EDGE_BELOW_MIN_LENGTH', () => {
    const state = {
      ...mockGraphState,
      edges: [
        { ...mockGraphState.edges[0], length_meters: 10 },
        ...mockGraphState.edges.slice(1),
      ],
    };
    const result = validateGraph(state, mockBoundaryState, undefined, mockSystemAdjustState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'GRAPH_EDGE_BELOW_MIN_LENGTH')).toBe(true);
  });
});

describe('Graph – 27.7 disconnected graph triggers warning', () => {
  it('produces GRAPH_DISCONNECTED as warning (not error)', () => {
    const state = {
      ...mockGraphState,
      metrics: { ...mockGraphState.metrics, connected_components: 3 },
    };
    const result = validateGraph(state, mockBoundaryState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'GRAPH_DISCONNECTED')).toBe(true);
  });
});

describe('Graph – 27.8 context protection', () => {
  it('does not mutate other context keys', () => {
    const context = makeEmptyContext();
    const updated = applyGraphToContext(context, mockGraphState);
    expect(updated.boundary).toBe(context.boundary);
    expect(updated.graph).toBe(mockGraphState);
  });
});

describe('Graph – 27.9 invalid status blocks context apply', () => {
  it('throws when status is graph_invalid', () => {
    const state = { ...mockGraphState, status: 'graph_invalid' as const };
    expect(() => applyGraphToContext(makeEmptyContext(), state)).toThrow();
  });
});

// ── 27.10 Stay-Boundary Nodes ─────────────────────────────────────────────────

describe('Graph – 27.10 stay-boundary nodes', () => {
  it('mock has a stay_boundary node with stay_zone_id and semantic_role', () => {
    const stayNode = mockGraphState.nodes.find(n => n.node_type === 'stay_boundary');
    expect(stayNode).toBeDefined();
    expect(stayNode?.stay_zone_id).toBe('zone_001');
    expect(stayNode?.semantic_role).toBe('zone_boundary');
  });

  it('mock passes validation with stay_boundary node', () => {
    const result = validateGraph(mockGraphState, mockBoundaryState, mockExtractionState, mockSystemAdjustState);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'GRAPH_STAY_NODE_MISSING_ZONE_ID')).toBe(false);
  });

  it('warns when stay_boundary node has no stay_zone_id', () => {
    const state = {
      ...mockGraphState,
      nodes: [
        ...mockGraphState.nodes.filter(n => n.node_type !== 'stay_boundary'),
        {
          node_id: 'n_bad',
          geometry: { type: 'Point' as const, coordinates: [15.22, 47.65] },
          node_type: 'stay_boundary' as const,
          connected_edge_ids: ['e_002'],
        },
      ],
    };
    const result = validateGraph(state, mockBoundaryState);
    expect(result.warnings.some(w => w.code === 'GRAPH_STAY_NODE_MISSING_ZONE_ID')).toBe(true);
  });

  it('warns when entry_exit node has no stay_zone_id', () => {
    const state = {
      ...mockGraphState,
      nodes: [
        ...mockGraphState.nodes,
        {
          node_id: 'n_entry',
          geometry: { type: 'Point' as const, coordinates: [15.20, 47.64] },
          node_type: 'entry_exit' as const,
          connected_edge_ids: ['e_001'],
        },
      ],
    };
    const result = validateGraph(state, mockBoundaryState);
    expect(result.warnings.some(w => w.code === 'GRAPH_STAY_NODE_MISSING_ZONE_ID')).toBe(true);
  });
});
