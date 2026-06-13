import { useState } from 'react';
import type { TabId } from '../panelRegistry';
import IconForgeSpec from './IconForgeSpec';

// Großer Bär — Icon-Schmiede (BA2). t1·Dubhe = Intro: zeichnet den Großen Wagen
// GROSS als klickbare Legende/Inhaltsverzeichnis (jeder Stern = Name + Tab-
// Funktion, Klick → springt in den Tab) + Sofort-Import-Box. Die übrigen Sterne
// sind Funktions-Gerüste (folgen: Spine t1·t2·t7 zuerst, Canvas später).

interface Star { tab: TabId; name: string; fn: string; x: number; y: number }
const STARS: Star[] = [
  { tab: 'input', name: 'Dubhe',  fn: 'Intro',     x: 48,  y: 44 },
  { tab: 't1',    name: 'Merak',  fn: 'Cleaner',   x: 52,  y: 98 },
  { tab: 't2',    name: 'Phecda', fn: 'Canvas',    x: 116, y: 106 },
  { tab: 't3',    name: 'Megrez', fn: 'Layer',     x: 108, y: 52 },
  { tab: 't4',    name: 'Alioth', fn: 'Werkzeuge', x: 176, y: 58 },
  { tab: 't5',    name: 'Mizar',  fn: 'Vorschau',  x: 244, y: 48 },
  { tab: 't6',    name: 'Alkaid', fn: 'Export',    x: 312, y: 30 },
];
// Schale (0-1-2-3-0) + Deichsel (3-4-5-6)
const LINES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];

function Legend({ activeTab, onJump }: { activeTab: TabId; onJump: (t: TabId) => void }) {
  return (
    <svg viewBox="0 0 348 150" width="100%" style={{ maxWidth: 520, display: 'block', margin: '0 auto' }}>
      {LINES.map(([a, b], i) => (
        <line key={i} x1={STARS[a].x} y1={STARS[a].y} x2={STARS[b].x} y2={STARS[b].y}
          stroke="rgba(226,162,59,0.5)" strokeWidth={1} strokeLinecap="round" />
      ))}
      {STARS.map((s) => {
        const active = s.tab === activeTab;
        return (
          <g key={s.tab} style={{ cursor: 'pointer' }} onClick={() => onJump(s.tab)}>
            <circle cx={s.x} cy={s.y} r={14} fill="transparent" />
            <circle cx={s.x} cy={s.y} r={active ? 4.5 : 3} fill={active ? '#dd9b2e' : '#e2a23b'}
              stroke={active ? '#fff3d6' : 'none'} strokeWidth={1} />
            <text x={s.x} y={s.y + 18} textAnchor="middle" fontSize={9.5} fontWeight={700}
              fill={active ? '#9c6a00' : '#1a365d'} fontFamily="system-ui, sans-serif">{s.name}</text>
            <text x={s.x} y={s.y + 28} textAnchor="middle" fontSize={8} fill="#718096" fontFamily="system-ui, sans-serif">{s.fn}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ImportBox({ onJump }: { onJump: (t: TabId) => void }) {
  const [file, setFile] = useState<{ name: string; svg: string; nodes: number } | null>(null);
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const f = files[0];
    const text = await f.text();
    const nodes = (text.match(/[MLHVCSQTAZmlhvcsqtaz]/g) || []).length; // grobe Knoten-Schätzung
    setFile({ name: f.name, svg: text, nodes });
  };
  return (
    <div style={{ border: '1px dashed #cbd5e0', borderRadius: 8, background: '#fafcff', padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 8 }}>Sofort-Import</div>
      <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
        style={{ display: 'block', padding: '14px', textAlign: 'center', border: '1.5px dashed #b3c2d6', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12.5, color: '#5a6b80' }}>
        SVG / Raster hier ablegen oder klicken
        <input type="file" accept=".svg,image/svg+xml,image/*" style={{ display: 'none' }}
          onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
      </label>
      {file && (
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, flexShrink: 0, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: file.svg }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a365d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            <div style={{ fontSize: 11, color: file.nodes > 60 ? '#c05621' : '#718096', fontFamily: 'monospace' }}>~{file.nodes} Knoten {file.nodes > 60 ? '· über Budget (60)' : ''}</div>
            <button onClick={() => onJump('t1')}
              style={{ marginTop: 6, padding: '4px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #0074d9', background: '#ebf8ff', color: '#0074d9', cursor: 'pointer' }}>
              → Reinigen &amp; Zuordnen (Merak · Cleaner)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 16, marginBottom: 16 };

function Placeholder({ name, fn }: { name: string; fn: string }) {
  return (
    <div style={{ padding: '28px 24px', fontFamily: 'system-ui, sans-serif', color: '#718096' }}>
      <div style={{ display: 'inline-block', padding: '3px 8px', marginBottom: 14, fontSize: 10, fontFamily: 'monospace', color: '#9c6a00', background: '#fff0d6', border: '1px solid #f6c177', borderRadius: 4 }}>
        {name} · {fn} · folgt
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        <strong>{fn}</strong> — diese Funktion wird in BA2 gebaut. Bau-Reihenfolge: zuerst die Spine
        <strong> Dubhe (Intro/Import) · Merak (Cleaner) · Alkaid (Export)</strong>, der Mal-Canvas
        (Phecda) + Layer/Werkzeuge/Vorschau danach.
      </div>
    </div>
  );
}

export default function UrsaMajorPanel({ activeTab, onJump }: { activeTab: TabId; onJump: (t: TabId) => void }) {
  if (activeTab === 'input') {
    return (
      <div style={{ padding: '18px 22px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: '#1a365d', textTransform: 'uppercase', marginBottom: 4 }}>Großer Bär — Inhaltsverzeichnis</div>
          <p style={{ fontSize: 12, color: '#718096', margin: '0 0 8px', lineHeight: 1.5 }}>Die sieben Sterne des Wagens sind die Tabs. Klick einen Stern → springt in seinen Tab.</p>
          <Legend activeTab={activeTab} onJump={onJump} />
        </div>
        <ImportBox onJump={onJump} />
        <details style={{ ...card, marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#1a365d' }}>Baukonzeptnotiz / Gate-Prinzip (Referenz)</summary>
          <div style={{ marginTop: 10 }}><IconForgeSpec /></div>
        </details>
      </div>
    );
  }
  const star = STARS.find((s) => s.tab === activeTab);
  return <Placeholder name={star?.name ?? '—'} fn={star?.fn ?? ''} />;
}
