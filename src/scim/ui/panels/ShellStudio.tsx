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
import { colorize } from '../../sensus/loadColour';
import { ColourGradientBar } from './ColourGradientBar';

// Die echte, veröffentlichte erste Demo der Ziel-App. Surface-Blöcke zeigen SIE
// (inkl. Expand/Collapse/Positionierung) — keine erfundene Nachbildung.
const APP_URL = 'https://diesenpark.com';

const FRAME_H = 460;
const DEV_W = 230;
const DEV_BORDER = 9;
const CONTENT_W = DEV_W - 2 * DEV_BORDER;   // sichtbare Frame-Innenbreite
const CONTENT_H = FRAME_H - 2 * DEV_BORDER;

function FrameLabel({ children, tone }: { children: ReactNode; tone: string }) {
  return <div style={{ fontSize: 9.5, color: tone, textAlign: 'center', marginBottom: 3, fontWeight: 700 }}>{children}</div>;
}

// Spalte 1 · Vorschau — die echte App im Mobile-Device-Frame.
function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <FrameLabel tone="#2b6cb0">Vorschau · diesenpark.com (live)</FrameLabel>
      <div style={{
        width: DEV_W, height: FRAME_H, borderRadius: 28, border: `${DEV_BORDER}px solid #1a202c`,
        background: '#000', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 64, height: 13, background: '#1a202c', borderRadius: '0 0 10px 10px', zIndex: 5 }} />
        <div style={{ width: '100%', height: '100%', background: '#fff', overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
}

// Spalte 3 · Funktions-Visualisierung — rahmenlos, gleich hoch; analytische Sicht der Funktion.
function VizBox({ children }: { children: ReactNode }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <FrameLabel tone="#718096">Funktions-Visualisierung</FrameLabel>
      <div style={{ width: 200, height: FRAME_H, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden' }}>{children}</div>
    </div>
  );
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

// Die echte, live laufende Ziel-App im Device-Frame. Sie rendert in echter Mobil-
// Breite (390 px) und wird auf die Frame-Breite herunterskaliert → ganze App sichtbar,
// nicht nur ein Ausschnitt.
function AppIframe() {
  const VW = 390;
  const scale = CONTENT_W / VW;
  return (
    <iframe
      src={APP_URL}
      title="Ziel-App · diesenpark.com"
      loading="lazy"
      style={{
        width: VW, height: CONTENT_H / scale, border: 'none', display: 'block',
        transform: `scale(${scale})`, transformOrigin: 'top left',
      }}
    />
  );
}

// Spalte 1 · Vorschau (im Device-Frame): die ECHTE App. Surface-Funktionen zeigen sie;
// Engine-Funktionen haben keinen Screen (bleiben leer).
function Surface({ fn }: { fn: ShellFunction }) {
  if (fn.surface === 'map' || fn.surface === 'intro' || fn.surface === 'comfort') return <AppIframe />;
  if (fn.surface === 'engine') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 12, textAlign: 'center', fontSize: 10, color: '#cbd5e0', fontStyle: 'italic', lineHeight: 1.4 }}>Engine · kein eigener Screen<br />(Effekt erscheint in einer Surface)</div>;
  }
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 11, color: '#a0aec0', fontStyle: 'italic', padding: 12, textAlign: 'center' }}>Oberfläche folgt</div>;
}

// Funktions-Visualisierung „colorize" — der Farb-Schlüssel (Last → Farbe), echte colorize-Fn.
function ColorizeViz() {
  const samples = [0.12, 0.38, 0.62, 0.88];
  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a365d' }}>Auslastung</div>
      <ColourGradientBar palette="green_violet" height={16} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#a0aec0' }}><span>ruhig</span><span>busy</span></div>
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {samples.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: colorize(l) }} />
            <span style={{ fontSize: 9, color: '#718096', fontFamily: 'ui-monospace, Menlo, monospace' }}>{l.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Funktions-Visualisierung „reveal" — die vier Phasen des Boundary-Reveals.
function RevealViz() {
  const phases = [
    { n: 1, t: 'weißer Screen', c: '#fff', b: '#e2e8f0' },
    { n: 2, t: 'Fenster wächst (f0.5)', c: '#f7fafc', b: '#cbd5e0' },
    { n: 3, t: 'Fill dimmt aus', c: '#edf2f7', b: '#a0aec0' },
    { n: 4, t: 'Boundary bleibt', c: '#fff', b: '#0074d9' },
  ];
  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a365d' }}>Reveal · Phasen</div>
      {phases.map((p) => (
        <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 4, background: p.c, border: `2px solid ${p.b}` }} />
          <span style={{ fontSize: 10, color: '#4a5568' }}><strong>{p.n}.</strong> {p.t}</span>
        </div>
      ))}
    </div>
  );
}

// Funktions-Visualisierung „gate" — der Gate-Zustand + das Bündeln.
function GateViz() {
  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a365d' }}>Refresh-Gate</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: '#fefcbf', border: '2px solid #d69e2e' }} />
        <span style={{ fontSize: 10, color: '#4a5568' }}>gültig → <strong>blockiert</strong> (halten)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: '#c6f6d5', border: '2px solid #2f855a' }} />
        <span style={{ fontSize: 10, color: '#4a5568' }}>nextAt erreicht → <strong>erlaubt</strong></span>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', background: '#f7fafc', borderRadius: 6, fontSize: 10, color: '#718096', lineHeight: 1.4 }}>
        viele Interaktionen<br />→ höchstens <strong>1 Anforderung</strong> / Fenster
      </div>
    </div>
  );
}

// Funktions-Visualisierung „comfort" — die drei Strecken-Zustände (crossing-gated).
function ComfortViz() {
  const rows = [
    { c: '#2f855a', label: 'normal · unter Schwelle' },
    { c: '#d69e2e', label: 'degraded · Operator-Schwelle' },
    { c: '#a0aec0', label: 'excluded · Move-Schwelle (User)' },
  ];
  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a365d' }}>Klassifikation je Strecke</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 6, borderRadius: 3, background: r.c, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#4a5568' }}>{r.label}</span>
        </div>
      ))}
      <div style={{ marginTop: 4, fontSize: 9.5, color: '#718096', lineHeight: 1.4 }}>Ø-Last je Kreuzung→Kreuzung; Move-Slider setzt die Ausschluss-Schwelle.</div>
    </div>
  );
}

// Spalte 3 · Funktions-Visualisierung (rahmenlos): analytische Sicht.
function Viz({ fn }: { fn: ShellFunction }) {
  if (fn.viz === 'colorize') return <ColorizeViz />;
  if (fn.viz === 'reveal') return <RevealViz />;
  if (fn.viz === 'gate') return <GateViz />;
  if (fn.viz === 'comfort') return <ComfortViz />;
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 12, textAlign: 'center', fontSize: 10, color: '#cbd5e0', fontStyle: 'italic' }}>—</div>;
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
                  {/* 1 · Sim-Vorschau (Device-Frame) — der echte App-Screen */}
                  <DeviceFrame><Surface fn={fn} /></DeviceFrame>
                  {/* 2 · SIM-Code */}
                  <div style={{ flexShrink: 0 }}>
                    <FrameLabel tone="#2b6cb0">SIM-Code</FrameLabel>
                    <CodeFrame code={fn.simCode} w={330} />
                  </div>
                  {/* 3 · Funktions-Visualisierung (rahmenlos) */}
                  <VizBox><Viz fn={fn} /></VizBox>
                  {/* 4 · Raum für den zu generierenden Produktions-Code */}
                  <div style={{ flexShrink: 0 }}>
                    <FrameLabel tone="#805ad5">Produktion-Code (generiert)</FrameLabel>
                    <CodeFrame
                      w={330}
                      tone="#a0aec0"
                      code={`// Ziel-App-Code (${[...targets].join('+') || '—'})\n// Wird NICHT live codiert.\n// Unten Plattform wählen → „Generieren"\n// → erscheint hier je Block + als Summe.\n//\n// (Generator: Konzept, noch nicht gebaut.)`}
                    />
                  </div>
                  {/* Notizen (gestapelt) */}
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
