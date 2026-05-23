import type { LoadProjectionState } from './loadProjection.types';

/** Normaler State ohne Signal-Filterung (Rückwärtskompatibilität). */
export const mockLoadProjectionState: LoadProjectionState = {
  load_projection_id: 'lp_001',
  graph_id: 'graph_hochwab_001',
  extraction_id: 'ext_001',
  edge_load_scores: [
    {
      edge_id: 'e_001',
      normalized_load_score: 0.58,
      load_class: 'moderate',
      contributing_signal_group_ids: ['sg_001'],
      confidence_score: 0.82,
      method: 'signal_to_edge',
      privacy_masked: false,
      signal_filtered: false,
    },
    {
      edge_id: 'e_002',
      normalized_load_score: 0.42,
      load_class: 'moderate',
      contributing_signal_group_ids: ['sg_001'],
      confidence_score: 0.78,
      method: 'signal_to_edge',
      privacy_masked: false,
      signal_filtered: false,
    },
    {
      edge_id: 'e_003',
      normalized_load_score: 0.18,
      load_class: 'quiet',
      contributing_signal_group_ids: [],
      confidence_score: 0.55,
      method: 'default_fallback',
      privacy_masked: false,
      signal_filtered: false,
    },
  ],
  metrics: {
    projected_edge_count: 3,
    masked_edge_count: 0,
    unprojected_edge_count: 0,
    avg_load_score: 0.39,
    max_load_score: 0.58,
    excluded_accumulation_point_count: 0,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:06:00.000Z',
    checked_against_graph_id: 'graph_hochwab_001',
    checked_against_extraction_id: 'ext_001',
  },
  status: 'load_projection_valid',
  projected_at: '2026-05-21T00:06:00.000Z',
};

/**
 * State mit aktiver Signal-Filterung:
 * 2 accumulation-Punkte wurden ausgeschlossen.
 * Scores sind dadurch niedriger als ohne Filterung.
 */
export const mockLoadProjectionStateFiltered: LoadProjectionState = {
  load_projection_id: 'lp_002',
  graph_id: 'graph_hochwab_001',
  extraction_id: 'ext_001',
  signal_interpretation_id: 'si_20260523_001',
  edge_load_scores: [
    {
      edge_id: 'e_001',
      normalized_load_score: 0.44,   // niedriger als ohne Filterung
      load_class: 'moderate',
      contributing_signal_group_ids: ['sg_001'],
      confidence_score: 0.80,
      method: 'signal_to_edge',
      privacy_masked: false,
      signal_filtered: true,
    },
    {
      edge_id: 'e_002',
      normalized_load_score: 0.31,
      load_class: 'moderate',
      contributing_signal_group_ids: ['sg_001'],
      confidence_score: 0.75,
      method: 'signal_to_edge',
      privacy_masked: false,
      signal_filtered: true,
    },
    {
      edge_id: 'e_003',
      normalized_load_score: 0.18,
      load_class: 'quiet',
      contributing_signal_group_ids: [],
      confidence_score: 0.55,
      method: 'default_fallback',
      privacy_masked: false,
      signal_filtered: true,
    },
  ],
  metrics: {
    projected_edge_count: 3,
    masked_edge_count: 0,
    unprojected_edge_count: 0,
    avg_load_score: 0.31,
    max_load_score: 0.44,
    excluded_accumulation_point_count: 2,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-23T12:00:00.000Z',
    checked_against_graph_id: 'graph_hochwab_001',
    checked_against_extraction_id: 'ext_001',
  },
  status: 'load_projection_valid',
  projected_at: '2026-05-23T12:00:00.000Z',
};
