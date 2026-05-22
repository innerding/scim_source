import type { BasisLayerState } from './basisLayer.types';

export const mockBasisLayerState: BasisLayerState = {
  basis_layer_id: 'bl_hochwab_001',
  boundary_id: 'bnd_hochwab_nord_001',
  graph_id: 'graph_hochwab_001',
  tile_layers: [
    {
      tile_layer_id: 'tl_osm_base',
      layer_type: 'osm_base',
      tile_url_template: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      min_zoom: 8,
      max_zoom: 18,
      attribution: '© OpenStreetMap contributors',
      opacity: 1.0,
      visible: true,
      z_index: 0,
    },
    {
      tile_layer_id: 'tl_hillshade',
      layer_type: 'hillshade',
      tile_url_template: 'https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png',
      min_zoom: 8,
      max_zoom: 16,
      attribution: '© SRTM Hillshading',
      opacity: 0.5,
      visible: true,
      z_index: 1,
    },
  ],
  viewport: {
    center: { type: 'Point', coordinates: [15.2, 47.65] },
    bbox: [14.998, 47.498, 15.402, 47.802],
    default_zoom: 13,
    min_zoom: 10,
    max_zoom: 17,
  },
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:04:00.000Z',
    checked_against_boundary_id: 'bnd_hochwab_nord_001',
    checked_against_graph_id: 'graph_hochwab_001',
  },
  status: 'basis_layer_valid',
  built_at: '2026-05-21T00:04:00.000Z',
};
