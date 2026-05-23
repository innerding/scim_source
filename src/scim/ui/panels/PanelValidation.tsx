import type { PanelDescriptor } from '../panelRegistry';
import type { ScimPipelineResult } from '../../pipeline/scimPipeline.types';

interface Props {
  panel: PanelDescriptor;
  result: ScimPipelineResult;
}

interface AnyIssue {
  code: string;
  severity?: 'error' | 'warning';
  field?: string;
  message: string;
}

interface AnyValidation {
  is_valid: boolean;
  errors: AnyIssue[];
  warnings: AnyIssue[];
  checked_at?: string;
}

/** Extract validation result from pipeline context by panel contextKey. */
function extractValidation(
  result: ScimPipelineResult,
  contextKey: string,
): AnyValidation | null {
  if (!result.success) return null;
  const ctx = result.context as unknown as Record<string, unknown>;

  // Direct key lookup
  const state = ctx[contextKey] as Record<string, unknown> | undefined;
  if (state?.validation) return state.validation as AnyValidation;

  // Some panels cover multiple context keys — try common aliases
  const aliases: Record<string, string[]> = {
    boundary:             ['boundary', 'extracted_data'],
    graph:                ['graph', 'basis_layer'],
    poi_model:            ['poi_model', 'load_model', 'movement_model', 'masking_model',
                           'stay_zone_detector', 'operator_decision', 'step2_activation'],
    route_model:          ['route_model', 'route_layer_model', 'layer_model'],
    sensus_core_package:  ['sensus_core_package'],
    sensus_core_local:    ['sensus_core_local'],
  };

  const keys = aliases[contextKey] ?? [contextKey];
  for (const k of keys) {
    const s = ctx[k] as Record<string, unknown> | undefined;
    if (s?.validation) return s.validation as AnyValidation;
  }
  return null;
}

/** Match a pipeline step result for this panel. */
function findStep(result: ScimPipelineResult, panelId: string) {
  // Step IDs now use P-prefix convention (e.g. 'P09_poi_model').
  // Match any step whose ID starts with the panel ID.
  return result.steps.filter(
    (s) => s.step_id.startsWith(panelId + '_') || s.step_id === panelId,
  );
}

function IssueRow({ issue }: { issue: AnyIssue }) {
  const isErr = issue.severity === 'error' || !issue.severity; // errors may lack severity
  return (
    <div style={{
      padding: '8px 12px', borderRadius: 4, marginBottom: 6,
      background: isErr ? '#fff5f5' : '#fffbeb',
      border: `1px solid ${isErr ? '#fed7d7' : '#fbd38d'}`,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{
          fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
          color: isErr ? '#c53030' : '#975a16',
          background: isErr ? '#fff5f5' : '#fffbeb',
          padding: '1px 5px', borderRadius: 3,
          border: `1px solid ${isErr ? '#fc8181' : '#f6ad55'}`,
        }}>
          {issue.code}
        </span>
        {issue.field && (
          <span style={{ fontSize: 10, color: '#718096', fontFamily: 'monospace' }}>
            {issue.field}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#2d3748', lineHeight: 1.4 }}>
        {issue.message}
      </div>
    </div>
  );
}

export default function PanelValidation({ panel, result }: Props) {
  const validation = extractValidation(result, panel.contextKey);
  const steps = findStep(result, panel.id);

  const totalErrors   = steps.reduce((s, r) => s + r.validation_errors, 0);
  const totalWarnings = steps.reduce((s, r) => s + r.validation_warnings, 0);
  const totalDuration = steps.reduce((s, r) => s + r.duration_ms, 0);

  const allOk = totalErrors === 0 && totalWarnings === 0 && steps.length > 0;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>

      {/* Step summary bar */}
      {steps.length > 0 ? (
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap',
          padding: '8px 12px', borderRadius: 6, marginBottom: 14,
          background: allOk ? '#f0fff4' : (totalErrors > 0 ? '#fff5f5' : '#fffbeb'),
          border: `1px solid ${allOk ? '#9ae6b4' : (totalErrors > 0 ? '#fed7d7' : '#fbd38d')}`,
          fontSize: 12,
        }}>
          <span style={{ color: allOk ? '#276749' : (totalErrors > 0 ? '#c53030' : '#975a16'), fontWeight: 600 }}>
            {allOk ? '✓ Alle Schritte gültig' : totalErrors > 0 ? `✗ ${totalErrors} Fehler` : `△ ${totalWarnings} Warnungen`}
          </span>
          <span style={{ color: '#a0aec0', marginLeft: 'auto', fontFamily: 'monospace', fontSize: 11 }}>
            {steps.map((s) => s.step_id).join(' · ')} · {totalDuration} ms
          </span>
        </div>
      ) : (
        <div style={{
          padding: '8px 12px', borderRadius: 6, marginBottom: 14,
          background: '#f7fafc', border: '1px solid #e2e8f0',
          fontSize: 12, color: '#a0aec0', fontStyle: 'italic',
        }}>
          Noch kein Pipeline-Lauf — kein Schritt-Ergebnis für {panel.id}.
        </div>
      )}

      {/* Issue details from context validation */}
      {validation && (
        <>
          {validation.errors.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#c53030', marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Fehler ({validation.errors.length})
              </div>
              {validation.errors.map((e, i) => <IssueRow key={i} issue={e} />)}
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#975a16', marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Warnungen ({validation.warnings.length})
              </div>
              {validation.warnings.map((w, i) => <IssueRow key={i} issue={{ ...w, severity: 'warning' }} />)}
            </div>
          )}

          {validation.errors.length === 0 && validation.warnings.length === 0 && (
            <div style={{
              fontSize: 12, color: '#276749', padding: '8px 12px',
              background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 5,
            }}>
              ✓ Keine Validierungsprobleme im Kontext-State
            </div>
          )}

          {validation.checked_at && (
            <div style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace', marginTop: 8 }}>
              Geprüft: {new Date(validation.checked_at).toLocaleString('de-AT')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
