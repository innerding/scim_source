import type { PanelDescriptor } from '../panelRegistry';
import type { ScimPipelineResult } from '../../pipeline/scimPipeline.types';
import {
  P05Result, P06Result, P07Result, P08Result,
  P09Result, P10Result, P11Result, P12Result,
} from './PanelResultContent';

interface Props {
  panel: PanelDescriptor;
  result: ScimPipelineResult;
}

// Generic fallback for user_form panels — they show a simple context dump
function GenericResult({ panel, result }: Props) {
  const ctx = result.success ? result.context as unknown as Record<string, unknown> : null;
  const raw = ctx?.[panel.contextKey];

  if (!result.success) {
    return (
      <div style={{
        background: '#fff5f5', border: '1px solid #fed7d7',
        borderRadius: 6, padding: '12px 16px', fontSize: 12, color: '#c53030',
        fontFamily: 'system-ui, sans-serif',
      }}>
        Pipeline fehlgeschlagen bei: <strong>{result.failed_at_step ?? 'unbekannt'}</strong>
      </div>
    );
  }

  if (!raw || typeof raw !== 'object') {
    return (
      <div style={{
        background: '#f7fafc', border: '1px solid #e2e8f0',
        borderRadius: 6, padding: '12px 16px', fontSize: 12, color: '#718096',
        fontFamily: 'system-ui, sans-serif',
      }}>
        Kein Ergebnis für <code>{panel.contextKey}</code> im Pipeline-Kontext.
      </div>
    );
  }

  const entries = Object.entries(raw as Record<string, unknown>)
    .filter(([k]) => k !== 'status');

  return (
    <div>
      <div style={{ fontSize: 11, color: '#a0aec0', fontFamily: 'monospace', marginBottom: 8 }}>
        context['{panel.contextKey}']
      </div>
      {entries.map(([k, v]) => (
        <div key={k} style={{
          display: 'flex', gap: 8, padding: '4px 0',
          borderBottom: '1px solid #edf2f7', fontSize: 12,
          fontFamily: 'monospace',
        }}>
          <span style={{ color: '#718096', minWidth: 200, flexShrink: 0 }}>{k}</span>
          <span style={{ color: '#2d3748', wordBreak: 'break-all' }}>
            {typeof v === 'object' ? JSON.stringify(v).slice(0, 80) : String(v ?? '—')}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PanelResult({ panel, result }: Props) {
  switch (panel.id) {
    case 'P05': return <P05Result result={result} />;
    case 'P06': return <P06Result result={result} />;
    case 'P07': return <P07Result result={result} />;
    case 'P08': return <P08Result result={result} />;
    case 'P09': return <P09Result result={result} />;
    case 'P10': return <P10Result result={result} />;
    case 'P11': return <P11Result result={result} />;
    case 'P12': return <P12Result result={result} />;
    default:    return <GenericResult panel={panel} result={result} />;
  }
}
