import type { PanelDescriptor } from '../panelRegistry';
import type { ScimPipelineResult } from '../../pipeline/scimPipeline.types';

interface Props {
  panel: PanelDescriptor;
  result: ScimPipelineResult;
}

export default function PanelRaw({ panel, result }: Props) {
  const ctx = result.success ? result.context : null;
  const raw = ctx ? (ctx as unknown as Record<string, unknown>)[panel.contextKey] : null;

  return (
    <pre style={{
      background: '#1a202c',
      color: '#a0aec0',
      borderRadius: 6,
      padding: 16,
      fontSize: 11,
      fontFamily: 'monospace',
      overflowX: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      margin: 0,
    }}>
      {JSON.stringify(raw ?? null, null, 2)}
    </pre>
  );
}
