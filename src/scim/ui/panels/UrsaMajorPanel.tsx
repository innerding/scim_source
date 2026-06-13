import { useMemo, useState } from 'react';
import type { TabId } from '../panelRegistry';
import IconForgeSpec from './IconForgeSpec';
import { cleanIconSvg } from '../../poi-catalog/svgCleaner';

// Großer Bär — Icon-Schmiede (BA2). Spine t1·t2·t7:
//   t1·Dubhe  = Intro: klickbare Wagen-Legende + Sofort-Import.
//   t2·Merak  = Cleaner/Routing/Schutt: Import → cleanIconSvg → Ziel wählen →
//               Übernehmen (Download) oder In Schutt.
// Geteilter Zustand (pending Import · Schutt) liegt im Panel, über die Tabs hinweg.

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
const LINES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];

interface Asset { name: string; svg: string }

const TARGETS = [
  { key: 'draco', label: 'Draco · data/icons', folder: 'data/icons' },
  { key: 'cepheus', label: 'Cepheus · data/icons-scim', folder: 'data/icons-scim' },
  { key: 'kleiner', label: 'Kleiner Bär · Glyph', folder: '(Glyph-Profil → Kleiner Bär)' },
] as const;

const card: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 16, marginBottom: 16 };
// Knoten-Schätzung: NUR Pfad-Befehlsbuchstaben innerhalb der d="…"-Attribute
// (nicht im übrigen SVG-Text wie Attributnamen).
const nodeCount = (svg: string) => {
  const ds = (svg.match(/\sd="([^"]*)"/g) || []).join(' ');
  return (ds.match(/[MLHVCSQTAZmlhvcsqtaz]/g) || []).length;
};

function download(name: string, svg: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name.endsWith('.svg') ? name : `${name}.svg`;
  a.click(); URL.revokeObjectURL(url);
}

// ── t1 · Legende ─────────────────────────────────────────────────────────────
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
            <circle cx={s.x} cy={s.y} r={active ? 4.5 : 3} fill={active ? '#dd9b2e' : '#e2a23b'} stroke={active ? '#fff3d6' : 'none'} strokeWidth={1} />
            <text x={s.x} y={s.y + 18} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={active ? '#9c6a00' : '#1a365d'} fontFamily="system-ui, sans-serif">{s.name}</text>
            <text x={s.x} y={s.y + 28} textAnchor="middle" fontSize={8} fill="#718096" fontFamily="system-ui, sans-serif">{s.fn}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DropZone({ onAsset, hint }: { onAsset: (a: Asset) => void; hint: string }) {
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const f = files[0];
    onAsset({ name: f.name, svg: await f.text() });
  };
  return (
    <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
      style={{ display: 'block', padding: '14px', textAlign: 'center', border: '1.5px dashed #b3c2d6', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12.5, color: '#5a6b80' }}>
      {hint}
      <input type="file" accept=".svg,image/svg+xml,image/*" style={{ display: 'none' }} onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
    </label>
  );
}

function IconPreviewBox({ svg, size = 56 }: { svg: string; size?: number }) {
  return <div style={{ width: size, height: size, flexShrink: 0, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d3748' }}
    dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ── t2 · Cleaner / Routing / Schutt ──────────────────────────────────────────
function CleanerTab({ pending, setPending, schutt, setSchutt }: {
  pending: Asset | null; setPending: (a: Asset | null) => void;
  schutt: Asset[]; setSchutt: (fn: (s: Asset[]) => Asset[]) => void;
}) {
  const [target, setTarget] = useState<typeof TARGETS[number]['key']>('draco');
  const result = useMemo(() => (pending ? cleanIconSvg(pending.svg) : null), [pending]);
  const tgt = TARGETS.find((t) => t.key === target)!;

  return (
    <div style={{ padding: '18px 22px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'inline-block', padding: '3px 9px', marginBottom: 12, fontSize: 10, fontFamily: 'monospace', color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4 }}>
        Merak · Cleaner / Routing / Schutt
      </div>

      {!pending && (
        <div style={card}>
          <div style={{ fontSize: 12.5, color: '#4a5568', marginBottom: 10 }}>Kein Import. Leg eine SVG in <strong>Dubhe · Intro</strong> ab — oder direkt hier:</div>
          <DropZone hint="SVG hier ablegen oder klicken" onAsset={setPending} />
        </div>
      )}

      {pending && result && (() => {
        const nBefore = nodeCount(pending.svg), nAfter = nodeCount(result.cleaned);
        const over = nAfter > 60;
        return (
          <>
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>{pending.name}</div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <IconPreviewBox svg={pending.svg} />
                  <div style={{ fontSize: 9.5, color: '#a0aec0', marginTop: 3 }}>roh · ~{nBefore}</div>
                </div>
                <div style={{ fontSize: 18, color: '#cbd5e0' }}>→</div>
                <div style={{ textAlign: 'center' }}>
                  <IconPreviewBox svg={result.cleaned} />
                  <div style={{ fontSize: 9.5, color: over ? '#c05621' : '#2f855a', marginTop: 3, fontFamily: 'monospace' }}>gecleant · ~{nAfter} {over ? '· über 60!' : '✓'}</div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', marginBottom: 4 }}>Cleaner-Änderungen ({result.changes.length})</div>
                  {result.changes.length ? (
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#718096', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto' }}>
                      {result.changes.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  ) : <div style={{ fontSize: 11, color: '#a0aec0' }}>nichts zu ändern — schon konventionskonform.</div>}
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 8 }}>Ziel zuordnen</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {TARGETS.map((t) => (
                  <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#4a5568', cursor: 'pointer' }}>
                    <input type="radio" name="cleaner-target" checked={target === t.key} onChange={() => setTarget(t.key)} />
                    {t.label}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => { download(pending.name, result.cleaned); setPending(null); }}
                  style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6, border: '1px solid #2f855a', background: '#f0fff4', color: '#22543d', cursor: 'pointer', fontWeight: 600 }}>
                  Übernehmen → {tgt.folder} (Download)
                </button>
                <button onClick={() => { setSchutt((s) => [pending, ...s]); setPending(null); }}
                  style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e0', background: '#fff', color: '#c05621', cursor: 'pointer' }}>
                  In Schutt
                </button>
              </div>
              {target === 'kleiner' && <div style={{ fontSize: 10.5, color: '#9c6a00', marginTop: 6 }}>Glyph-Profil: die heruntergeladene SVG im <strong>Kleinen Bären · Polaris</strong> importieren (Mittellinie + advance).</div>}
            </div>
          </>
        );
      })()}

      {/* Schutt-Container */}
      <div style={{ ...card, background: '#f7fafc', borderStyle: 'dashed' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4a5568', marginBottom: 8 }}>🗑 Schutt-Container ({schutt.length})</div>
        {schutt.length === 0 ? (
          <div style={{ fontSize: 11.5, color: '#a0aec0' }}>Leer. Verworfene/ersetzte Assets landen hier — wiederherstellbar.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {schutt.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 8, padding: 6, background: '#fff' }}>
                <IconPreviewBox svg={a.svg} size={36} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#4a5568', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                  <button onClick={() => { setSchutt((s) => s.filter((_, j) => j !== i)); setPending(a); }}
                    style={{ marginTop: 3, padding: '2px 8px', fontSize: 10, borderRadius: 4, border: '1px solid #cbd5e0', background: '#fff', color: '#2b6cb0', cursor: 'pointer' }}>
                    wiederherstellen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Placeholder({ name, fn }: { name: string; fn: string }) {
  return (
    <div style={{ padding: '28px 24px', fontFamily: 'system-ui, sans-serif', color: '#718096' }}>
      <div style={{ display: 'inline-block', padding: '3px 8px', marginBottom: 14, fontSize: 10, fontFamily: 'monospace', color: '#9c6a00', background: '#fff0d6', border: '1px solid #f6c177', borderRadius: 4 }}>
        {name} · {fn} · folgt
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        <strong>{fn}</strong> — diese Funktion wird in BA2 gebaut. Spine zuerst: <strong>Dubhe · Merak · Alkaid</strong>;
        der Mal-Canvas (Phecda) + Layer/Werkzeuge/Vorschau danach.
      </div>
    </div>
  );
}

export default function UrsaMajorPanel({ activeTab, onJump }: { activeTab: TabId; onJump: (t: TabId) => void }) {
  const [pending, setPending] = useState<Asset | null>(null);
  const [schutt, setSchutt] = useState<Asset[]>([]);

  if (activeTab === 'input') {
    return (
      <div style={{ padding: '18px 22px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: '#1a365d', textTransform: 'uppercase', marginBottom: 4 }}>Großer Bär — Inhaltsverzeichnis</div>
          <p style={{ fontSize: 12, color: '#718096', margin: '0 0 8px', lineHeight: 1.5 }}>Die sieben Sterne des Wagens sind die Tabs. Klick einen Stern → springt in seinen Tab.</p>
          <Legend activeTab={activeTab} onJump={onJump} />
        </div>
        <div style={{ ...card, borderStyle: 'dashed', borderColor: '#cbd5e0', background: '#fafcff' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', marginBottom: 8 }}>Sofort-Import</div>
          <DropZone hint="SVG / Raster hier ablegen oder klicken" onAsset={setPending} />
          {pending && (
            <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <IconPreviewBox svg={pending.svg} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a365d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.name}</div>
                <div style={{ fontSize: 11, color: nodeCount(pending.svg) > 60 ? '#c05621' : '#718096', fontFamily: 'monospace' }}>~{nodeCount(pending.svg)} Knoten</div>
                <button onClick={() => onJump('t1')} style={{ marginTop: 6, padding: '4px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #0074d9', background: '#ebf8ff', color: '#0074d9', cursor: 'pointer' }}>
                  → Reinigen &amp; Zuordnen (Merak · Cleaner)
                </button>
              </div>
            </div>
          )}
        </div>
        <details style={card}>
          <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#1a365d' }}>Baukonzeptnotiz / Gate-Prinzip (Referenz)</summary>
          <div style={{ marginTop: 10 }}><IconForgeSpec /></div>
        </details>
      </div>
    );
  }
  if (activeTab === 't1') {
    return <CleanerTab pending={pending} setPending={setPending} schutt={schutt} setSchutt={setSchutt} />;
  }
  const star = STARS.find((s) => s.tab === activeTab);
  return <Placeholder name={star?.name ?? '—'} fn={star?.fn ?? ''} />;
}
