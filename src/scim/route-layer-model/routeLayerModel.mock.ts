import type { RouteLayerModelState, ScoreClassStyle } from './routeLayerModel.types';

const scoreClassStyles: ScoreClassStyle[] = [
  { score_class: 'green',   color: '#22c55e', opacity: 0.85, weight: 4 },
  { score_class: 'yellow',  color: '#eab308', opacity: 0.85, weight: 4 },
  { score_class: 'orange',  color: '#f97316', opacity: 0.85, weight: 4 },
  { score_class: 'red',     color: '#ef4444', opacity: 0.9,  weight: 5 },
  { score_class: 'blocked', color: '#6b7280', opacity: 0.6,  weight: 3, dash_pattern: '4 4' },
  { score_class: 'unknown', color: '#9ca3af', opacity: 0.5,  weight: 3 },
];

const styleFor = (cls: ScoreClassStyle['score_class']): ScoreClassStyle =>
  scoreClassStyles.find(s => s.score_class === cls)!;

export const mockRouteLayerModelState: RouteLayerModelState = {
  route_layer_model_id: 'rlm_001',
  route_model_id: 'route_model_001',
  segments: [
    {
      segment_id: 'seg_e_001',
      edge_id: 'e_001',
      score_class: 'yellow',
      decision: 'include',
      style: styleFor('yellow'),
      visible: true,
    },
    {
      segment_id: 'seg_e_002',
      edge_id: 'e_002',
      score_class: 'green',
      decision: 'include',
      style: styleFor('green'),
      visible: true,
    },
    {
      segment_id: 'seg_e_003',
      edge_id: 'e_003',
      score_class: 'green',
      decision: 'include',
      style: styleFor('green'),
      visible: true,
    },
  ],
  score_class_styles: scoreClassStyles,
  visible_segment_count: 3,
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:10:00.000Z',
    checked_against_route_model_id: 'route_model_001',
  },
  status: 'route_layer_model_valid',
  built_at: '2026-05-21T00:10:00.000Z',
};
