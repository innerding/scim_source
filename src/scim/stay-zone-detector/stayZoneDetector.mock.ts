import type { StayZoneDetectorState } from './stayZoneDetector.types';

export const mockStayZoneDetectorState: StayZoneDetectorState = {
  detector_id: 'szd_001',
  movement_model_id: 'mm_001',
  detected_zones: [
    {
      zone_id: 'zone_001',
      center: { type: 'Point', coordinates: [15.225, 47.651] },
      radius_meters: 35,
      classification: 'rast',
      throughput_ratio: 0.62,
      confidence_score: 0.78,
      edge_ids_within_radius: ['e_003'],
      is_off_path: false,
      overlap_conflict: false,
      operator_status: 'pending',
    },
  ],
  jam_count: 0,
  rast_count: 1,
  overlap_conflicts: [],
  step2_activation_condition_met: false,
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:08:00.000Z',
  },
  status: 'stay_zone_valid',
  computed_at: '2026-05-21T00:08:00.000Z',
};

export const mockStayZoneDetectorSkipped: StayZoneDetectorState = {
  detector_id: 'szd_skipped',
  movement_model_id: 'mm_001',
  detected_zones: [],
  jam_count: 0,
  rast_count: 0,
  overlap_conflicts: [],
  step2_activation_condition_met: false,
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-21T00:08:00.000Z',
  },
  status: 'stay_zone_skipped',
  computed_at: '2026-05-21T00:08:00.000Z',
};
