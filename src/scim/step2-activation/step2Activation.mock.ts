import type { Step2ActivationState } from './step2Activation.types';

export const mockStep2ActivationNotTriggered: Step2ActivationState = {
  activation_id: 'act_001',
  trigger: {
    trigger_id: 'trg_001',
    detector_id: 'szd_001',
    jam_count: 0,
    triggering_zone_ids: [],
    triggered_at: '2026-05-23T10:00:00.000Z',
  },
  resulting_classification_mode: 'movement_only',
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-23T10:00:00.000Z',
  },
  status: 'not_triggered',
  created_at: '2026-05-23T10:00:00.000Z',
};

export const mockStep2ActivationConfirmed: Step2ActivationState = {
  activation_id: 'act_002',
  trigger: {
    trigger_id: 'trg_002',
    detector_id: 'szd_001',
    jam_count: 1,
    triggering_zone_ids: ['zone_stau_001'],
    triggered_at: '2026-05-23T11:00:00.000Z',
  },
  decision: {
    result: 'confirmed',
    decided_by: 'operator_a',
    decided_at: '2026-05-23T11:05:00.000Z',
  },
  resulting_classification_mode: 'movement_and_stay',
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-23T11:05:00.000Z',
  },
  status: 'operator_confirmed',
  created_at: '2026-05-23T11:00:00.000Z',
  updated_at: '2026-05-23T11:05:00.000Z',
};

export const mockStep2ActivationAwaiting: Step2ActivationState = {
  activation_id: 'act_003',
  trigger: {
    trigger_id: 'trg_003',
    detector_id: 'szd_001',
    jam_count: 2,
    triggering_zone_ids: ['zone_stau_001', 'zone_stau_002'],
    triggered_at: '2026-05-23T12:00:00.000Z',
  },
  resulting_classification_mode: 'movement_only',
  validation: {
    is_valid: true,
    errors: [],
    warnings: [],
    checked_at: '2026-05-23T12:00:00.000Z',
  },
  status: 'triggered_awaiting_operator',
  created_at: '2026-05-23T12:00:00.000Z',
};
