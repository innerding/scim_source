import type { OperatorDefinedZone, OperatorZoneState, ZoneMapStyle } from './operatorZone.types';

const styleRestArea: ZoneMapStyle = { icon: 'hut',       color: '#4CAF50', fill_opacity: 0.2, border_opacity: 0.8 };
const styleViewpoint: ZoneMapStyle = { icon: 'binoculars', color: '#2196F3', fill_opacity: 0.2, border_opacity: 0.8 };
const styleEvent: ZoneMapStyle =     { icon: 'flag',       color: '#FF9800', fill_opacity: 0.2, border_opacity: 0.8 };

export const mockZoneRestArea: OperatorDefinedZone = {
  zone_id: 'oz_001',
  label: 'Lichtenberger Hütte',
  center: { type: 'Point', coordinates: [14.521, 47.812] },
  radius_meters: 80,
  semantic_type: 'rest_area',
  temporal_scope: 'permanent',
  classification_basis: 'operator_defined',
  exclude_from_routing: true,
  map_style: styleRestArea,
  created_at: '2026-05-23T09:00:00.000Z',
  created_by: 'operator_a',
};

export const mockZoneViewpoint: OperatorDefinedZone = {
  zone_id: 'oz_002',
  label: 'Aussichtspunkt Hochkogel',
  center: { type: 'Point', coordinates: [14.534, 47.821] },
  radius_meters: 40,
  semantic_type: 'viewpoint',
  temporal_scope: 'permanent',
  classification_basis: 'operator_defined',
  exclude_from_routing: true,
  map_style: styleViewpoint,
  created_at: '2026-05-23T09:05:00.000Z',
  created_by: 'operator_a',
};

export const mockZoneEventArea: OperatorDefinedZone = {
  zone_id: 'oz_003',
  label: 'Almfest Pfingsten',
  center: { type: 'Point', coordinates: [14.528, 47.808] },
  radius_meters: 120,
  semantic_type: 'event_area',
  temporal_scope: 'event',
  valid_from: '2026-06-06T00:00:00.000Z',
  valid_until: '2026-06-08T23:59:59.000Z',
  classification_basis: 'operator_defined',
  exclude_from_routing: true,
  map_style: styleEvent,
  created_at: '2026-05-23T09:10:00.000Z',
  created_by: 'operator_a',
};

export const mockZoneExpired: OperatorDefinedZone = {
  zone_id: 'oz_004',
  label: 'Konzert Almwiese (abgelaufen)',
  center: { type: 'Point', coordinates: [14.515, 47.805] },
  radius_meters: 60,
  semantic_type: 'event_area',
  temporal_scope: 'event',
  valid_from: '2026-04-01T00:00:00.000Z',
  valid_until: '2026-04-01T23:59:59.000Z',
  classification_basis: 'operator_defined',
  exclude_from_routing: true,
  map_style: styleEvent,
  created_at: '2026-03-20T08:00:00.000Z',
  created_by: 'operator_a',
};

export const mockOperatorZoneState: OperatorZoneState = {
  zone_set_id: 'ozs_001',
  zones: [mockZoneRestArea, mockZoneViewpoint, mockZoneEventArea],
  active_zone_count: 2,    // rest_area + viewpoint (event noch nicht aktiv)
  expired_zone_count: 0,
  pending_zone_count: 1,   // event noch in der Zukunft
  operator_only_basis: true,
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-23T09:15:00.000Z',
    active_zone_count: 2,
    expired_zone_count: 0,
  },
  status: 'operator_zone_valid',
  evaluated_at: '2026-05-23T09:15:00.000Z',
};

export const mockOperatorZoneStateWithExpired: OperatorZoneState = {
  ...mockOperatorZoneState,
  zone_set_id: 'ozs_002',
  zones: [mockZoneRestArea, mockZoneViewpoint, mockZoneEventArea, mockZoneExpired],
  expired_zone_count: 1,
};
