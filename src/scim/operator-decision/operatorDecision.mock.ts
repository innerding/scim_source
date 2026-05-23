import type { OperatorDecisionState } from './operatorDecision.types';

export const mockOperatorDecisionState: OperatorDecisionState = {
  decision_id: 'opdec_001',
  detector_id: 'szd_001',
  prerequisites: {
    jam_detected: false,
    step2_activation_condition_met: false,
    detector_id: 'szd_001',
  },
  overlap_resolutions: [
    {
      resolution_id: 'res_001',
      zone_ids: ['zone_001', 'zone_002'],
      method: 'freflaeche_defined',
      freflaeche_geometry: {
        type: 'Polygon',
        coordinates: [[[15.21, 47.64], [15.22, 47.64], [15.22, 47.65], [15.21, 47.65], [15.21, 47.64]]],
      },
      resolved_at: '2026-05-23T08:00:00.000Z',
      resolved_by: 'operator_a',
    },
  ],
  off_path_decisions: [
    {
      decision_id: 'off_001',
      zone_id: 'zone_003',
      result: 'confirmed_excluded',
      decided_at: '2026-05-23T08:05:00.000Z',
      decided_by: 'operator_a',
    },
  ],
  stau_commits: [],
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-23T08:10:00.000Z',
    checked_against_detector_id: 'szd_001',
  },
  status: 'completed',
  created_at: '2026-05-23T08:00:00.000Z',
  updated_at: '2026-05-23T08:10:00.000Z',
};

export const mockOperatorDecisionPending: OperatorDecisionState = {
  decision_id: 'opdec_002',
  detector_id: 'szd_001',
  prerequisites: {
    jam_detected: true,
    step2_activation_condition_met: true,
    detector_id: 'szd_001',
  },
  overlap_resolutions: [],
  off_path_decisions: [],
  stau_commits: [
    {
      commit_id: 'sc_001',
      zone_id: 'zone_stau_001',
      result: 'pending',
    },
  ],
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-23T09:00:00.000Z',
    checked_against_detector_id: 'szd_001',
  },
  status: 'awaiting_input',
  created_at: '2026-05-23T09:00:00.000Z',
};
