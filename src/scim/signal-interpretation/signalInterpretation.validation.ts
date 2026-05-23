import type {
  SignalInterpretationState,
  SignalInterpretationValidationResult,
  SignalInterpretationIssue,
} from './signalInterpretation.types';

function err(code: string, message: string, field?: string): SignalInterpretationIssue {
  return { code, message, severity: 'error', field };
}

function warn(code: string, message: string, field?: string): SignalInterpretationIssue {
  return { code, message, severity: 'warning', field };
}

export function validateSignalInterpretation(
  state: SignalInterpretationState,
): SignalInterpretationValidationResult {
  const errors: SignalInterpretationIssue[] = [];
  const warnings: SignalInterpretationIssue[] = [];

  // ── Schwellenwert-Konsistenz ──────────────────────────────────────────────
  const { min_throughput_for_flow, max_throughput_for_accumulation } = state.thresholds;

  if (max_throughput_for_accumulation >= min_throughput_for_flow) {
    errors.push(err(
      'SI_THRESHOLD_OVERLAP',
      `max_throughput_for_accumulation (${max_throughput_for_accumulation}) muss kleiner sein als ` +
      `min_throughput_for_flow (${min_throughput_for_flow}) — sonst gibt es keine ambiguous-Zone.`,
      'thresholds',
    ));
  }

  // ── Leerer Punkt-Set ──────────────────────────────────────────────────────
  if (state.classified_points.length === 0) {
    warnings.push(warn(
      'SI_NO_POINTS',
      'Keine klassifizierten Signalpunkte vorhanden. Telco-Daten fehlen möglicherweise.',
    ));
  }

  // ── Summary-Konsistenz ────────────────────────────────────────────────────
  const actualFlow = state.classified_points.filter(p => p.category === 'flow').length;
  const actualAcc  = state.classified_points.filter(p => p.category === 'accumulation').length;
  const actualAmb  = state.classified_points.filter(p => p.category === 'ambiguous').length;
  const actualForced = state.classified_points.filter(p => p.forced_by_zone_id).length;

  if (actualFlow !== state.summary.flow_count) {
    errors.push(err('SI_SUMMARY_FLOW_MISMATCH',
      `summary.flow_count (${state.summary.flow_count}) stimmt nicht mit tatsächlicher Anzahl (${actualFlow}) überein.`,
      'summary.flow_count'));
  }
  if (actualAcc !== state.summary.accumulation_count) {
    errors.push(err('SI_SUMMARY_ACC_MISMATCH',
      `summary.accumulation_count (${state.summary.accumulation_count}) stimmt nicht mit tatsächlicher Anzahl (${actualAcc}) überein.`,
      'summary.accumulation_count'));
  }
  if (actualAmb !== state.summary.ambiguous_count) {
    errors.push(err('SI_SUMMARY_AMB_MISMATCH',
      `summary.ambiguous_count (${state.summary.ambiguous_count}) stimmt nicht mit tatsächlicher Anzahl (${actualAmb}) überein.`,
      'summary.ambiguous_count'));
  }
  if (actualForced !== state.summary.forced_by_zone_count) {
    errors.push(err('SI_SUMMARY_FORCED_MISMATCH',
      `summary.forced_by_zone_count (${state.summary.forced_by_zone_count}) stimmt nicht mit tatsächlicher Anzahl (${actualForced}) überein.`,
      'summary.forced_by_zone_count'));
  }

  // ── Hoher Accumulation-Anteil ─────────────────────────────────────────────
  if (state.classified_points.length > 0) {
    const accRatio = actualAcc / state.classified_points.length;
    if (accRatio > 0.7) {
      warnings.push(warn(
        'SI_HIGH_ACCUMULATION_RATIO',
        `${Math.round(accRatio * 100)}% der Signalpunkte sind als accumulation klassifiziert. ` +
        'Operator-Zonen oder Schwellenwerte prüfen.',
      ));
    }

    // ── Hoher Ambiguous-Anteil ────────────────────────────────────────────
    const ambRatio = actualAmb / state.classified_points.length;
    if (ambRatio > 0.5) {
      warnings.push(warn(
        'SI_HIGH_AMBIGUOUS_RATIO',
        `${Math.round(ambRatio * 100)}% der Signalpunkte sind ambiguous. ` +
        'Telco-Signalqualität möglicherweise unzureichend.',
      ));
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}
