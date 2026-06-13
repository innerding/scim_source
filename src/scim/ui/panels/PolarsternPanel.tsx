import { useMemo, useState } from 'react';
import type { TabId } from '../panelRegistry';
import type { FontModel, FontMetrics } from '../../typeface';
import { DEFAULT_FONT, renderText } from '../../typeface';

// Schrift-Panel — Editor über dem reinen Stroke-Font-Modell (src/scim/typeface).
// Justiert live Metriken, Gewichte, Kursiv und zeigt Vorschau/Export. Angetrieben
// von Platzhalter-Glyphen, bis die echten aus Illustrator eingefüttert sind.

const LS_KEY = 'scim3.polarstern.draft';

function loadFont(): FontModel {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as FontModel;
  } catch { /* ignore */ }
  return DEFAULT_FONT;
}

function saveFont(f: FontModel) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(f)); } catch { /* ignore */ }
}

// ── shared bits ────────────────────────────────────────────────────────────────

function Svg({ markup, color = '#1a365d', style }: { markup: string; color?: string; style?: React.CSSProperties }) {
  return <span style={{ color, lineHeight: 0, display: 'inline-block', ...style }} dangerouslySetInnerHTML={{ __html: markup }} />;
}

function Slider({
  label, value, min, max, step = 1, onChange, suffix,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#4a5568', fontFamily: 'system-ui, sans-serif' }}>
      <span style={{ width: 130, flexShrink: 0 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1 }} />
      <span style={{ width: 54, textAlign: 'right', fontFamily: 'monospace', color: '#1a365d' }}>
        {value}{suffix ?? ''}
      </span>
    </label>
  );
}

const card: React.CSSProperties = {
  border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 16, marginBottom: 16,
};
const h: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: '#1a365d',
  textTransform: 'uppercase', marginBottom: 10, fontFamily: 'system-ui, sans-serif',
};

// ── Tab: Glyphen ─────────────────────────────────────────────────────────────

function GlyphsTab({ font }: { font: FontModel }) {
  const keys = Object.keys(font.glyphs);
  const drawn = keys.filter((k) => font.glyphs[k].d).length;
  const tokenFor = useMemo(() => {
    const inv: Record<string, string> = {};
    for (const [tok, ch] of Object.entries(font.tokens)) inv[ch] = tok;
    return inv;
  }, [font.tokens]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={card}>
        <div style={h}>Gezeichnete Glyphen</div>
        <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 4 }}>
          <strong style={{ color: '#1a365d', fontSize: 20 }}>{drawn}</strong>
          <span style={{ marginLeft: 8 }}>von ~70 Ziel-Glyphen (A–Z, a–z, 0–9, ÄÖÜß, Satzzeichen).</span>
        </div>
        <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.6 }}>
          Versalien (A–Z + Ä Ö Ü) sind die echten, in Illustrator gezeichneten
          Mittellinien (Box-Höhe 130, <code>#000</code>-Stroke → <code>currentColor</code>).
          Offen: Gemeine (a–z), Ziffern, ß, Satzzeichen. Hilfslinien:
          Versalhöhe · x-Höhe (gestrichelt) · Grundlinie.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10 }}>
        {keys.map((k) => {
          const g = font.glyphs[k];
          const { svg } = renderText(font, k, { size: 78, showGuides: true, weight: font.weights[1]?.stroke ?? 8 });
          const display = k === ' ' ? '␣' : k;
          const tok = tokenFor[k];
          return (
            <div key={k} style={{ ...card, padding: 8, marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafcff', borderRadius: 4, width: '100%' }}>
                {g.d ? <Svg markup={svg} /> : <span style={{ color: '#a0aec0', fontSize: 11 }}>leer</span>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a365d', fontFamily: 'monospace' }}>{display}</div>
              <div style={{ fontSize: 10, color: '#718096', fontFamily: 'monospace' }}>
                {tok ? `${tok} · ` : ''}adv {g.advance}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Vorschau ────────────────────────────────────────────────────────────

function PreviewTab({ font }: { font: FontModel }) {
  const [text, setText] = useState('POLARSTERN');
  const heaviest = font.weights[font.weights.length - 1]?.stroke ?? font.metrics.maxStroke;
  const lightest = font.weights[0]?.stroke ?? 4;
  const [weight, setWeight] = useState(font.weights[1]?.stroke ?? 8);
  const [size, setSize] = useState(96);
  const [italic, setItalic] = useState(false);
  const [dark, setDark] = useState(false);

  const { svg, missing } = renderText(font, text, { weight, size, italic });
  const nearest = [...font.weights].sort((a, b) => Math.abs(a.stroke - weight) - Math.abs(b.stroke - weight))[0];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={card}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Testwort…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 14,
            border: '1px solid #cbd5e0', borderRadius: 6, marginBottom: 14, fontFamily: 'system-ui, sans-serif' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Slider label="Gewicht (stroke)" value={weight} min={lightest} max={heaviest} onChange={setWeight} suffix="px" />
          <Slider label="Größe" value={size} min={24} max={180} onChange={setSize} suffix="px" />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, color: '#4a5568' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={italic} onChange={(e) => setItalic(e.target.checked)} /> Kursiv ({font.italicSkewDeg}°)
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> dunkler Hintergrund
            </label>
            <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: '#718096' }}>≈ {nearest?.name}</span>
          </div>
        </div>
      </div>

      <div style={{ ...card, background: dark ? '#0d1520' : '#fff', minHeight: 160,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', overflowX: 'auto' }}>
        <Svg markup={svg} color={dark ? '#e0eeff' : '#1a365d'} />
      </div>

      {missing.length > 0 && (
        <div style={{ ...card, marginBottom: 0, borderColor: '#feb2b2', background: '#fff5f5' }}>
          <div style={{ fontSize: 12, color: '#c53030' }}>
            Noch nicht gezeichnet (Platzhalter-Kästchen):{' '}
            <span style={{ fontFamily: 'monospace' }}>{missing.map((c) => (c === ' ' ? '␣' : c)).join(' ')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Metriken ────────────────────────────────────────────────────────────

function MetricsTab({ font, setFont }: { font: FontModel; setFont: (f: FontModel) => void }) {
  const m = font.metrics;
  const setM = (patch: Partial<FontMetrics>) => setFont({ ...font, metrics: { ...m, ...patch } });
  const margin = m.maxStroke / 2;
  const clipTop = m.accentY < margin;
  const clipBottom = m.boxHeight - m.descenderY < margin;

  const { svg } = renderText(font, 'Hä no', { size: 150, showGuides: true, weight: m.maxStroke });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafcff' }}>
        <Svg markup={svg} />
      </div>

      <div style={card}>
        <div style={h}>Box-Höhe</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[100, 120].map((bh) => (
            <button key={bh} onClick={() => setM({ boxHeight: bh })}
              style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
                border: '1px solid ' + (m.boxHeight === bh ? '#0074d9' : '#cbd5e0'),
                background: m.boxHeight === bh ? '#ebf8ff' : '#fff',
                color: m.boxHeight === bh ? '#0074d9' : '#4a5568', fontWeight: m.boxHeight === bh ? 700 : 400 }}>
              {bh} {bh === 120 ? '(empfohlen)' : ''}
            </button>
          ))}
        </div>
        <Slider label="boxHeight" value={m.boxHeight} min={80} max={160} onChange={(v) => setM({ boxHeight: v })} />
        <div style={{ fontSize: 11, color: '#718096', marginTop: 6 }}>
          120 → kräftige Caps + Umlaut-Akzentzone; 100 → kompakter, Caps müssen kürzer.
        </div>
      </div>

      <div style={card}>
        <div style={h}>Vertikale Linien (y, von oben)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Slider label="Akzent-Linie" value={m.accentY} min={0} max={m.capY} onChange={(v) => setM({ accentY: v })} />
          <Slider label="Versalhöhe (cap)" value={m.capY} min={m.accentY} max={m.xHeightY} onChange={(v) => setM({ capY: v })} />
          <Slider label="x-Höhe" value={m.xHeightY} min={m.capY} max={m.baselineY} onChange={(v) => setM({ xHeightY: v })} />
          <Slider label="Grundlinie" value={m.baselineY} min={m.xHeightY} max={m.descenderY} onChange={(v) => setM({ baselineY: v })} />
          <Slider label="Unterlänge" value={m.descenderY} min={m.baselineY} max={m.boxHeight} onChange={(v) => setM({ descenderY: v })} />
        </div>
      </div>

      <div style={card}>
        <div style={h}>Strich & Seitenband</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Slider label="max Stroke" value={m.maxStroke} min={6} max={24} onChange={(v) => setM({ maxStroke: v })} suffix="px" />
          <Slider label="Seitenband" value={m.sideBearing} min={0} max={24} onChange={(v) => setM({ sideBearing: v })} />
          <Slider label="Kursiv-Winkel" value={font.italicSkewDeg} min={0} max={16} onChange={(v) => setFont({ ...font, italicSkewDeg: v })} suffix="°" />
        </div>
        {(clipTop || clipBottom) && (
          <div style={{ marginTop: 10, fontSize: 11, color: '#c53030', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6, padding: '6px 10px' }}>
            ⚠ Rand &lt; maxStroke/2 ({margin}px) — das schwerste Gewicht clippt
            {clipTop ? ' oben' : ''}{clipTop && clipBottom ? ' und' : ''}{clipBottom ? ' unten' : ''}.
          </div>
        )}
      </div>

      <div style={card}>
        <div style={h}>Gewichte</div>
        {font.weights.map((w, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <input value={w.name} onChange={(e) => {
              const ws = font.weights.slice(); ws[i] = { ...ws[i], name: e.target.value }; setFont({ ...font, weights: ws });
            }} style={{ flex: 1, padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e0', borderRadius: 5 }} />
            <input type="number" value={w.stroke} min={1} max={m.maxStroke} onChange={(e) => {
              const ws = font.weights.slice(); ws[i] = { ...ws[i], stroke: Number(e.target.value) }; setFont({ ...font, weights: ws });
            }} style={{ width: 70, padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e0', borderRadius: 5, fontFamily: 'monospace' }} />
            <button onClick={() => setFont({ ...font, weights: font.weights.filter((_, j) => j !== i) })}
              style={{ border: 'none', background: 'transparent', color: '#c53030', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        ))}
        <button onClick={() => setFont({ ...font, weights: [...font.weights, { name: 'Neu', stroke: m.maxStroke }] })}
          style={{ marginTop: 4, padding: '5px 12px', fontSize: 12, border: '1px dashed #cbd5e0', borderRadius: 6, background: '#fff', color: '#4a5568', cursor: 'pointer' }}>
          + Gewicht
        </button>
      </div>
    </div>
  );
}

// ── Tab: Font-JSON ───────────────────────────────────────────────────────────

function JsonTab({ font, setFont }: { font: FontModel; setFont: (f: FontModel) => void }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(font, null, 2);
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ ...card, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, fontSize: 12, color: '#4a5568' }}>
          Export-Manifest — reist später als Glyph-DATEN mit der Shell (kein Webfont).
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
          style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6, border: '1px solid #0074d9', background: '#ebf8ff', color: '#0074d9', cursor: 'pointer' }}>
          {copied ? '✓ kopiert' : 'Kopieren'}
        </button>
        <button onClick={() => { if (confirm('Auf Default-Schrift zurücksetzen? Lokale Änderungen gehen verloren.')) setFont(DEFAULT_FONT); }}
          style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e0', background: '#fff', color: '#c53030', cursor: 'pointer' }}>
          Zurücksetzen
        </button>
      </div>
      <pre style={{ ...card, marginBottom: 0, fontSize: 11, fontFamily: 'monospace', color: '#2d3748', overflowX: 'auto', lineHeight: 1.5, maxHeight: 480 }}>
        {json}
      </pre>
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────

export default function PolarsternPanel({ activeTab }: { activeTab: TabId }) {
  const [font, setFontState] = useState<FontModel>(loadFont);
  const setFont = (f: FontModel) => { setFontState(f); saveFont(f); };

  switch (activeTab) {
    case 'input':      return <GlyphsTab font={font} />;
    case 'result':     return <PreviewTab font={font} />;
    case 'validation': return <MetricsTab font={font} setFont={setFont} />;
    case 'raw':        return <JsonTab font={font} setFont={setFont} />;
    default:           return null;
  }
}
