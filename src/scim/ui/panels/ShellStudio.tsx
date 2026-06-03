// Shell-Studio — Dual-Lane: EINE Funktions-Liste, zwei Lanes.
//   SIM (links/High)  = Oberfläche (Sim-Vorschau im Device-Frame) + SIM-Code, der sie
//                       in SCIM rendert + Design-Notizen. „Was SCIM simuliert."
//   PRODUKTION (rechts/Deep) = der Ziel-App-Code, der WIRKLICH ausgespielt wird —
//                       NICHT live mitcodiert, sondern auf Anforderung generiert
//                       (Footer: Plattform wählen → rechnen → Code je Block + Summe →
//                       Sensus Core Publishing packt). SIM-Code ≠ Produktions-Code.
// Das ist NICHT SCIM3 selbst, sondern was SCIM3 in die Ziel-App bringt.
import { useState, type ReactNode } from 'react';
import { SHELL_FUNCTIONS, TARGET_PLATFORMS, type ShellFunction, type TargetPlatform } from '../../shell-studio/shellStudio';
import { useWorkspaceNav } from '../workspaceNav';
import DeepShellMap from './DeepShellMap';

const FRAME_H = 300;

// Vorschau-Spalte (SIM) — plain, OHNE Device-Frame, gleich hoch wie die Code-Frames.
// Sitzt zwischen den Code-Spalten; darf leer sein (Engine-Funktionen ohne eigenen Screen).
function PlainPreview({ children }: { children: ReactNode }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ fontSize: 9.5, color: '#a0aec0', textAlign: 'center', marginBottom: 3 }}>Vorschau (SIM)</div>
      <div style={{ width: 176, height: FRAME_H, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function FrameLabel({ children, tone }: { children: ReactNode; tone: string }) {
  return <div style={{ fontSize: 9.5, color: tone, textAlign: 'center', marginBottom: 3, fontWeight: 700 }}>{children}</div>;
}

function CodeFrame({ code, w = 300, tone = '#9ecbff' }: { code: string; w?: number; tone?: string }) {
  return (
    <div style={{ width: w, height: FRAME_H, flexShrink: 0, overflow: 'auto', background: '#0d1117', borderRadius: 10, border: '1px solid #1a2535' }}>
      <pre style={{ margin: 0, padding: '10px 12px', fontSize: 11, lineHeight: 1.55, color: tone, fontFamily: 'ui-monospace, Menlo, monospace', whiteSpace: 'pre' }}>{code}</pre>
    </div>
  );
}

function Notes({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div style={{ width: 165, flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tone, marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 15, fontSize: 10.5, color: '#4a5568', lineHeight: 1.45 }}>
        {items.map((t, i) => <li key={i} style={{ marginBottom: 3 }}>{t}</li>)}
      </ul>
    </div>
  );
}

function Surface({ fn }: { fn: ShellFunction }) {
  if (fn.surface === 'map') return <DeepShellMap />;
  if (fn.surface === 'engine') {
    // Engine ohne eigenen Screen → Vorschau bleibt (fast) leer. Der Effekt erscheint
    // in einer Surface-Funktion (colorize z.B. färbt die Wege der Karte).
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 12, textAlign: 'center', fontSize: 10, color: '#cbd5e0', fontStyle: 'italic', lineHeight: 1.4 }}>Engine · kein eigener Screen<br />(Effekt erscheint in einer Surface)</div>;
  }
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 11, color: '#a0aec0', fontStyle: 'italic', padding: 12, textAlign: 'center' }}>Oberfläche folgt</div>;
}

export default function ShellStudio() {
  const { goStation } = useWorkspaceNav();
  const [open, setOpen] = useState<Record<string, boolean>>({ map: true });
  const [targets, setTargets] = useState<Set<TargetPlatform>>(new Set(['web']));
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const toggleTarget = (p: TargetPlatform) => setTargets((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto', marginBottom: 8 }}>
        <div style={{
          display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
          color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
        }}>
          Shell-Studio · <span style={{ color: '#2b6cb0' }}>SIM = Oberfläche + Code</span> | <span style={{ color: '#805ad5' }}>Produktion = Ziel-App-Code (generiert)</span>
        </div>
        <p style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.5, margin: '6px 0 0', maxWidth: 640 }}>
          Was SCIM3 in die Ziel-App bringt — je Funktion ein Block. Links die <strong>SIM</strong> (Vorschau + der Code,
          der sie in SCIM rendert), rechts die <strong>Produktion</strong> (der ausgespielte Ziel-App-Code; nicht live
          codiert, sondern unten <em>auf Anforderung generiert</em>). <strong>SIM-Code ≠ Produktions-Code.</strong>
        </p>
      </div>

      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
        {SHELL_FUNCTIONS.map((fn) => {
          const isOpen = !!open[fn.id];
          return (
            <div key={fn.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
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

              {isOpen && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 12, overflowX: 'auto' }}>
                  {/* SIM-Code (links) */}
                  <div style={{ flexShrink: 0 }}>
                    <FrameLabel tone="#2b6cb0">SIM-Code</FrameLabel>
                    <CodeFrame code={fn.simCode} w={290} />
                  </div>
                  {/* Vorschau-Spalte (plain, ohne Device-Frame) — zwischen den Code-Spalten */}
                  <PlainPreview><Surface fn={fn} /></PlainPreview>
                  {/* Produktions-Code (rechts) */}
                  <div style={{ flexShrink: 0 }}>
                    <FrameLabel tone="#805ad5">Produktion-Code (generiert)</FrameLabel>
                    <CodeFrame
                      w={290}
                      tone="#a0aec0"
                      code={`// Ziel-App-Code (${[...targets].join('+') || '—'})\n// Wird NICHT live codiert.\n// Unten Plattform wählen → „Generieren"\n// → erscheint hier je Block + als Summe.\n//\n// (Generator: Konzept, noch nicht gebaut.)`}
                    />
                  </div>
                  {/* Notizen (ganz rechts, gestapelt) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
                    <Notes title="SIM · Oberfläche" items={fn.highNotes} tone="#2b6cb0" />
                    <Notes title="Produktion · Code-Intent" items={fn.deepNotes} tone="#805ad5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ausspielungs-Footer — ganz unten: Plattform wählen → rechnen → Summe → SCS packt. */}
      <div style={{ flex: '0 0 auto', borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1a365d' }}>Ausspielung:</span>
          {TARGET_PLATFORMS.map((p) => (
            <label key={p.id} style={{ fontSize: 12, color: '#4a5568', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={targets.has(p.id)} onChange={() => toggleTarget(p.id)} /> {p.label}
            </label>
          ))}
          <button
            disabled
            title="Generator = Konzept, noch nicht gebaut"
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 4, border: '1px dashed #cbd5e0', background: '#f7fafc', color: '#a0aec0', cursor: 'not-allowed' }}
          >⚙ Generieren (folgt)</button>
        </div>
        <p style={{ fontSize: 10.5, color: '#a0aec0', fontStyle: 'italic', lineHeight: 1.5, margin: '6px 0 0', maxWidth: 720 }}>
          Konzept (gehalten): Plattform(en) wählen → SCIM <strong>rechnet</strong> den Ziel-App-Code → erscheint je Block
          <strong> und als Summe</strong> → fertig, von <strong>Sensus Core Publishing</strong> anforderbar &amp; packbar.
          Ausbau: Snapshots verschiedener Zoom-Stufen als Storyboard (wenn die Surface App-Inhalt trägt) · echte
          Zwei-Panel-Split-Ansicht + Cosmo-Paar „High+Deep" · Inspector = Bewegtbild der Live-App.
        </p>
      </div>
    </div>
  );
}
