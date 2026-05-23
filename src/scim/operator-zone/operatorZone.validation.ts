import type {
  OperatorZoneState,
  OperatorDefinedZone,
  OperatorZoneIssue,
  OperatorZoneValidationResult,
} from './operatorZone.types';

const HIGH_ZONE_COUNT_THRESHOLD = 50;

function err(code: string, message: string, field?: string, related_id?: string): OperatorZoneIssue {
  return { code, severity: 'error', field, related_id, message, blocking: true };
}

function warn(code: string, message: string, field?: string, related_id?: string): OperatorZoneIssue {
  return { code, severity: 'warning', field, related_id, message, blocking: false };
}

function isExpired(zone: OperatorDefinedZone, now: Date): boolean {
  return !!zone.valid_until && new Date(zone.valid_until) < now;
}

function isPending(zone: OperatorDefinedZone, now: Date): boolean {
  return !!zone.valid_from && new Date(zone.valid_from) > now;
}


export function validateOperatorZones(
  state: OperatorZoneState,
  nowIso?: string,
): OperatorZoneValidationResult {
  const errors: OperatorZoneIssue[] = [];
  const warnings: OperatorZoneIssue[] = [];
  const now = new Date(nowIso ?? new Date().toISOString());

  let activeCount = 0;
  let expiredCount = 0;

  for (const zone of state.zones) {
    // Radius
    if (zone.radius_meters <= 0) {
      errors.push(err('OZ_RADIUS_INVALID', `Zone '${zone.zone_id}': radius_meters must be > 0.`, 'radius_meters', zone.zone_id));
    }

    // Temporal-Scope braucht Daten
    if ((zone.temporal_scope === 'seasonal' || zone.temporal_scope === 'event')) {
      if (!zone.valid_from || !zone.valid_until) {
        errors.push(err('OZ_TEMPORAL_WITHOUT_DATES', `Zone '${zone.zone_id}': temporal_scope '${zone.temporal_scope}' requires valid_from and valid_until.`, 'temporal_scope', zone.zone_id));
      } else if (new Date(zone.valid_until) <= new Date(zone.valid_from)) {
        errors.push(err('OZ_TEMPORAL_INVALID_RANGE', `Zone '${zone.zone_id}': valid_until must be after valid_from.`, 'valid_until', zone.zone_id));
      }
    }

    // Ablauf-Status
    if (isExpired(zone, now)) {
      expiredCount++;
      warnings.push(warn('OZ_ZONE_EXPIRED', `Zone '${zone.zone_id}' ("${zone.label}") ist abgelaufen (valid_until: ${zone.valid_until}).`, 'valid_until', zone.zone_id));
    } else if (isPending(zone, now)) {
      warnings.push(warn('OZ_ZONE_STARTS_IN_FUTURE', `Zone '${zone.zone_id}' ("${zone.label}") ist noch nicht aktiv (valid_from: ${zone.valid_from}).`, 'valid_from', zone.zone_id));
    } else {
      activeCount++;
    }
  }

  // Konsistenz-Checks auf State-Ebene
  if (Math.abs(state.active_zone_count - activeCount) > 0) {
    warnings.push(warn('OZ_ACTIVE_COUNT_MISMATCH', `active_zone_count ${state.active_zone_count} stimmt nicht mit berechneten ${activeCount} aktiven Zonen überein.`, 'active_zone_count'));
  }

  if (Math.abs(state.expired_zone_count - expiredCount) > 0) {
    warnings.push(warn('OZ_EXPIRED_COUNT_MISMATCH', `expired_zone_count ${state.expired_zone_count} stimmt nicht mit berechneten ${expiredCount} abgelaufenen Zonen überein.`, 'expired_zone_count'));
  }

  // Viele Zonen
  if (state.zones.length > HIGH_ZONE_COUNT_THRESHOLD) {
    warnings.push(warn('OZ_HIGH_ZONE_COUNT', `${state.zones.length} Zonen definiert — Übersichtlichkeit prüfen (Schwellwert: ${HIGH_ZONE_COUNT_THRESHOLD}).`, 'zones'));
  }

  // Nur Operator-Basis
  if (state.operator_only_basis) {
    warnings.push(warn('OZ_OPERATOR_ONLY_BASIS', 'Alle Zonen basieren auf manueller Operator-Einschätzung — keine Signalvalidierung möglich.', 'zones'));
  }

  // Keine Zonen
  if (state.zones.length === 0) {
    warnings.push(warn('OZ_NO_ZONES', 'Keine Operator-Zonen definiert — alle Signale werden als flow behandelt.', 'zones'));
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    checked_at: new Date().toISOString(),
    active_zone_count: activeCount,
    expired_zone_count: expiredCount,
  };
}
