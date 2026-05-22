import type { SensusCoreViewState } from './sensusCoreView.types';

export const mockSensusCoreViewState: SensusCoreViewState = {
  view_id: 'view_hochwab_001',
  package_id: 'pkg_hochwab_001',
  active_layers: [
    { layer_id: 'layer_osm_base',    visible: true,  opacity: 1.0 },
    { layer_id: 'layer_route_score', visible: true,  opacity: 0.85 },
    { layer_id: 'layer_poi_load',    visible: true,  opacity: 0.9 },
    { layer_id: 'layer_movement_flow', visible: false, opacity: 0.7 },
  ],
  viewport_center: { type: 'Point', coordinates: [15.2, 47.65] },
  viewport_zoom: 13,
  interaction: {},
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:16:00.000Z',
    checked_against_package_id: 'pkg_hochwab_001',
  },
  status: 'view_active',
  initialized_at: '2026-05-21T00:16:00.000Z',
  last_updated_at: '2026-05-21T00:16:00.000Z',
};
