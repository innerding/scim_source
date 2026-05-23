import type { ScimContext } from '../context/scimContext.types';
import type { StayZoneDetectorState } from './stayZoneDetector.types';

export function applyStayZoneDetectorToContext(
  ctx: ScimContext,
  state: StayZoneDetectorState,
): ScimContext {
  if (state.status !== 'stay_zone_valid' && state.status !== 'stay_zone_warning' && state.status !== 'stay_zone_skipped') {
    throw new Error(`StayZoneDetector state is not valid: ${state.status}`);
  }
  return {
    ...ctx,
    stay_zone_detector: state,
    step2_activation_condition_met: state.step2_activation_condition_met,
  };
}
