// Top-level ErrorBoundary — fängt einen Render-/Lifecycle-Crash ab, damit statt
// eines weißen Screens ein lesbarer Hinweis + Auswege erscheinen (Ansicht
// zurücksetzen / neu laden). Die Kosmologie bleibt nicht blank stehen.
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('SCIM3 crash:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#03050f', color: '#e0eeff', fontFamily: 'system-ui, sans-serif', zIndex: 99999,
      }}>
        <div style={{ maxWidth: 440, padding: '26px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#f59e0b', letterSpacing: '0.06em', marginBottom: 10 }}>
            SCIM3 — UNERWARTETER FEHLER
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(224,238,255,0.82)', margin: '0 0 6px' }}>
            Eine Ansicht ist abgestürzt. Deine Arbeit liegt im Browser-Speicher und ist nicht verloren.
          </p>
          <pre style={{
            fontSize: 11, fontFamily: 'ui-monospace, Menlo, monospace', color: '#fca5a5',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: '8px 10px', margin: '12px 0 16px', textAlign: 'left',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 120, overflow: 'auto',
          }}>{error.message}</pre>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => this.setState({ error: null })}
              style={{
                fontSize: 12.5, fontWeight: 700, padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
                background: 'transparent', color: '#e0eeff', border: '1px solid rgba(255,255,255,0.22)',
              }}
            >↺ Ansicht zurücksetzen</button>
            <button
              onClick={() => window.location.reload()}
              style={{
                fontSize: 12.5, fontWeight: 700, padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
                background: '#2b6cb0', color: '#fff', border: '1px solid #2b6cb0',
              }}
            >⟳ neu laden</button>
          </div>
        </div>
      </div>
    );
  }
}
