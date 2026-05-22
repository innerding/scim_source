import type { LeafletBasisCheckState } from './leafletBasisCheck.types';

export const mockLeafletBasisCheckState: LeafletBasisCheckState = {
  check_id: 'lbc_001',
  basis_layer_id: 'bl_hochwab_001',
  graph_id: 'graph_hochwab_001',
  check_result: {
    basis_layer_available: true,
    graph_available: true,
    viewport_valid: true,
    tile_layers_count: 2,
    overall_ready: true,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:13:00.000Z',
    checked_against_basis_layer_id: 'bl_hochwab_001',
  },
  status: 'leaflet_basis_ok',
  checked_at: '2026-05-21T00:13:00.000Z',
};
