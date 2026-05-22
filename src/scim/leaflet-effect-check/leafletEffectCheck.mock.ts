import type { LeafletEffectCheckState } from './leafletEffectCheck.types';

export const mockLeafletEffectCheckState: LeafletEffectCheckState = {
  check_id: 'lec_001',
  package_id: 'pkg_hochwab_001',
  view_id: 'view_hochwab_001',
  render_result: {
    route_layer_rendered: true,
    poi_layer_rendered: true,
    visible_segment_count: 3,
    visible_poi_count: 1,
    render_duration_ms: 42,
    any_layer_error: false,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:17:00.000Z',
    checked_against_package_id: 'pkg_hochwab_001',
  },
  status: 'effect_check_ok',
  checked_at: '2026-05-21T00:17:00.000Z',
};
