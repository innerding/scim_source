import type { PanelDescriptor } from '../panelRegistry';
import type { ScimPipelineResult } from '../../pipeline/scimPipeline.types';

interface Props {
  panel: PanelDescriptor;
  result: ScimPipelineResult;
}

export default function PanelValidation({ panel, result }: Props) {
  const stepResult = result.steps.find(
    (s) => s.step_id.toLowerCase().includes(panel.contextKey.replace(/_/g, ''))
      || s.step_id.toLowerCase().includes(panel.id.toLowerCase()),
  );

  const errorCount = stepResult?.validation_errors ?? 0;
  const warnCount = stepResult?.validation_warnings ?? 0;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      {errorCount === 0 && warnCount === 0 && (
        <div style={{
          background: '#f0fff4', border: '1px solid #9ae6b4',
          borderRadius: 6, padding: '12px 16px', color: '#276749',
        }}>
          ✓ Keine Validierungsprobleme
          {!stepResult && (
            <span style={{ color: '#a0aec0', fontSize: 11, marginLeft: 8 }}>
              (kein Schritt-Ergebnis gefunden)
            </span>
          )}
        </div>
      )}

      {errorCount > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            background: '#fff5f5', border: '1px solid #fed7d7',
            borderRadius: 6, padding: '12px 16px', color: '#c53030', fontSize: 12,
          }}>
            ✗ {errorCount} Fehler gefunden
          </div>
        </div>
      )}

      {warnCount > 0 && (
        <div style={{
          background: '#fffaf0', border: '1px solid #fbd38d',
          borderRadius: 6, padding: '12px 16px', color: '#c05621', fontSize: 12,
        }}>
          △ {warnCount} Warnungen
        </div>
      )}

      {stepResult && (
        <div style={{ marginTop: 12, fontSize: 11, fontFamily: 'monospace', color: '#a0aec0' }}>
          Schritt: {stepResult.step_id} · Dauer: {stepResult.duration_ms}ms
        </div>
      )}
    </div>
  );
}
