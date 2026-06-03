// Shell-Studio — die Dual-Lane-Ansicht: EINE Funktions-Liste, in zwei Lanes gerendert.
// High (links) = Oberfläche im Device-Frame + Design-Notizen · Deep (rechts) = der
// ausgespielte Code im Code-Frame + Code-Notizen. Je Funktion ein Block, per Drop-Down
// expandierbar; beide Lanes teilen Zeile & Expand-Zustand → Frames stehen gegenüber.
// Das ist NICHT SCIM3 selbst, sondern was SCIM3 in die Ziel-App bringt.
import { useState, type ReactNode } from 'react';
import { SHELL_FUNCTIONS, type ShellFunction } from '../../shell-studio/shellStudio';
import { useWorkspaceNav } from '../workspaceNav';
import DeepShellMap from './DeepShellMap';

const FRAME_H = 360;

// Mobile-Device-Mockup um die Oberfläche.
function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{
      width: 184, height: FRAME_H, flexShrink: 0, borderRadius: 26, border: '8px solid #1a202c',
      background: '#000', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 58, height: 13, background: '#1a202c', borderRadius: '0 0 9px 9px', zIndex: 5 }} />
      <div style={{ width: '100%', height: '100%', background: '#fff' }}>{children}</div>
    </div>
  );
}

function CodeFrame({ code }: { code: string }) {
  return (
    <div style={{ width: 380, height: FRAME_H, flexShrink: 0, overflow: 'auto', background: '#0d1117', borderRadius: 10, border: '1px solid #1a2535' }}>
      <pre style={{ margin: 0, padding: '10px 12px', fontSize: 11, lineHeight: 1.55, color: '#9ecbff', fontFamily: 'ui-monospace, Menlo, monospace', whiteSpace: 'pre' }}>{code}</pre>
    </div>
  );
}

function Notes({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div style={{ width: 200, flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tone, marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 15, fontSize: 11, color: '#4a5568', lineHeight: 1.5 }}>
        {items.map((t, i) => <li key={i} style={{ marginBottom: 3 }}>{t}</li>)}
      </ul>
    </div>
  );
}

function Surface({ fn }: { fn: ShellFunction }) {
  if (fn.surface === 'map') return <DeepShellMap />;
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 11, color: '#a0aec0', fontStyle: 'italic', padding: 12, textAlign: 'center' }}>Oberfläche folgt</div>;
}

export default function ShellStudio() {
  const { goStation } = useWorkspaceNav();
  const [open, setOpen] = useState<Record<string, boolean>>({ map: true });
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto', marginBottom: 8 }}>
        <div style={{
          display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
          color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
        }}>
          Shell-Studio · Dual-Lane · <span style={{ color: '#2b6cb0' }}>High = Oberfläche</span> | <span style={{ color: '#805ad5' }}>Deep = Code</span>
        </div>
        <p style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.5, margin: '6px 0 0', maxWidth: 620 }}>
          Was SCIM3 in die Ziel-App bringt — je Funktion ein Block: links die Oberfläche (Device-Frame), rechts der
          ausgespielte Code; daneben die Notizen. Frames stehen gegenüber. Am Ende: Paket/Bindung in Sensus Core Publishing.
        </p>
      </div>

      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
        {SHELL_FUNCTIONS.map((fn) => {
          const isOpen = !!open[fn.id];
          return (
            <div key={fn.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
              {/* Block-Kopf */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f7fafc', cursor: 'pointer' }} onClick={() => toggle(fn.id)}>
                <span style={{ fontSize: 13, color: '#718096', width: 14 }}>{isOpen ? '▾' : '▸'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>{fn.title}</span>
                {fn.subtitle && <span style={{ fontSize: 10.5, color: '#a0aec0', fontFamily: 'monospace' }}>{fn.subtitle}</span>}
                <button
                  onClick={(e) => { e.stopPropagation(); goStation('P07', 't4'); }}
                  title="Shell · Icon-Assets"
                  style={{ marginLeft: 'auto', fontSize: 10.5, padding: '1px 8px', borderRadius: 999, cursor: 'pointer', border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0' }}
                >⊞ Icon-Assets</button>
              </div>

              {/* Dual-Lane-Inhalt */}
              {isOpen && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px', overflowX: 'auto' }}>
                  {/* High-Lane */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
                    <DeviceFrame><Surface fn={fn} /></DeviceFrame>
                    <Notes title="High · Oberfläche" items={fn.highNotes} tone="#2b6cb0" />
                  </div>
                  <div style={{ width: 1, alignSelf: 'stretch', background: '#e2e8f0', flexShrink: 0 }} />
                  {/* Deep-Lane */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
                    <CodeFrame code={fn.code} />
                    <Notes title="Deep · Code" items={fn.deepNotes} tone="#805ad5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
