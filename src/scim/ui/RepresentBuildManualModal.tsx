// Manual-Modal — zeigt docs/represent_build.md als preformatierten Text.
// Wird vom Bogen-Segment 'manual' des Tetraeders im Navigator geoeffnet.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Vite ?raw-Import liefert string
import manualMd from '../../../docs/represent_build.md?raw';

interface Props {
  onClose: () => void;
}

export default function RepresentBuildManualModal({ onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 6, width: 'min(820px, 92vw)',
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{
          padding: '12px 18px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a365d' }}>
              Represent Build — Manual
            </div>
            <div style={{ fontSize: 10, color: '#718096', marginTop: 2, fontFamily: 'monospace' }}>
              docs/represent_build.md
            </div>
          </div>
          <button onClick={onClose} style={{
            fontSize: 12, padding: '5px 14px', cursor: 'pointer',
            border: '1px solid #cbd5e0', background: 'white', borderRadius: 4,
          }}>Schließen</button>
        </div>
        <pre style={{
          flex: 1, overflow: 'auto', padding: '16px 22px', margin: 0,
          fontSize: 12, lineHeight: 1.55,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#2d3748', whiteSpace: 'pre-wrap', wordBreak: 'normal',
        }}>{manualMd as string}</pre>
      </div>
    </div>
  );
}
