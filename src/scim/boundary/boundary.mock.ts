import type { BoundaryState } from './boundary.types';

export const mockBoundaryState: BoundaryState = {
  boundary_id: 'bnd_hochwab_nord_001',
  computed_boundary: {
    boundary_id: 'bnd_hochwab_nord_001',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [14.05, 48.22],
          [14.35, 48.22],
          [14.35, 48.42],
          [14.05, 48.42],
          [14.05, 48.22],
        ],
      ],
    },
    bbox: [14.05, 48.22, 14.35, 48.42],
    center: { type: 'Point', coordinates: [14.20, 48.32] },
    area_sqkm: 380,
    related_region_id: 'reg_lichtenberg',
    computed_at: '2026-05-21T00:01:00.000Z',
    source: 'regio_content_bbox',
  },
  buffer_spec: {
    computed_buffer_meters: 150,
    min_buffer_meters: 150,
    max_buffer_meters: 500,
    max_poi_radius_meters: 50,
    comparison_margin_meters: 25,
    clamped: true,
    clamped_reason: 'below_min',
  },
  poi_count_within: 1,
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:01:00.000Z',
    checked_against_system_adjust_version: 'sys_v1.0.0',
    checked_against_regio_content_version: 'regio_v1.0.0',
  },
  status: 'boundary_valid',
  computed_at: '2026-05-21T00:01:00.000Z',
};
