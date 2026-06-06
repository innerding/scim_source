// P01 · Thresholds — Skalen-Form (vertikal) + Farbsorten (horizontal), gespeist aus dem
// EINEN Skalen-Modell (shell-kit/scale). Die Oberfläche ist eine Kopie dieses Modells.
//
// Blöcke:
//   1. Skalen-Form (vertikal): Spreizung (Mitte/oben-het/unten-het) + Verjüngung (unten/oben)
//   2. Farbsorten (horizontal): 2–6 Farb-Stops
//   3. Vorschau: Live-Säule (colorAt/posForLoad) + Wrap-Umschalter (Comfort vs Mesh)
//
// Schreibt die neuen colourSettings-Felder (Stufe 2). Wirkung auf Mesh/Comfort = Stufe 4/5.

import { useCallback, useEffect, useState } from 'react';
import { loadColourSettings, saveColourSettings, COLOUR_SETTINGS_EVENT, type ColourSettings } from '../../sensus/colourSettings';
import { useInspectorView } from '../../../runtime/repContext';
import { slugify } from '../../../runtime/router';
import { colorAt, posForLoad, loadForPos, type ScaleSpec } from 'shell-kit';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

// ── vertikaler Slider (rotierter horizontaler Range — robust cross-browser) ──
function VSlider({ label, value, onChange, min = 0, max = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 46 }}>
      <div style={{ width: 28, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input
          type="range" min={min} max={max} step={0.01} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ width: 110, transform: 'rotate(-90deg)', accentColor: '#2b6cb0' }}
        />
      </div>
      <span style={{ fontSize: 9, color: '#4a5568', fontFamily: 'ui-monospace, Menlo, monospace' }}>{value.toFixed(2)}</span>
      <span style={{ fontSize: 9.5, color: '#1a365d', textAlign: 'center', lineHeight: 1.15 }}>{label}</span>
    </div>
  );
}

// ── Vorschau-Säule: Farbe je Position (mit/ohne Wrap) + Last-Ticks ──
function Preview({ spec, useWrap }: { spec: ScaleSpec; useWrap: boolean }) {
  const N = 40;
  const segs = Array.from({ length: N }, (_, i) => {
    const p = (N - 1 - i) / (N - 1);                  // oben = 1
    // Farbe an Display-Position p = colorAt(loadForPos(p)) — über exportierte Fns:
    return { p, color: colorAt(loadForPos(p, spec, useWrap), spec) };
  });
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ t, pos: posForLoad(t, spec, useWrap) }));
  return (
    <div style={{ position: 'relative', width: 40, height: 180, borderRadius: 4, overflow: 'hidden', border: '1px solid #cbd5e0' }}>
      {segs.map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(i / N) * 100}%`, height: `${100 / N + 0.5}%`, background: s.color }} />
      ))}
      {ticks.map((tk) => (
        <div key={tk.t} style={{ position: 'absolute', left: 0, right: 0, bottom: `${tk.pos * 100}%`, height: 0, borderTop: '1px solid rgba(0,0,0,0.45)' }}>
          <span style={{ position: 'absolute', right: 1, bottom: 0, fontSize: 7.5, color: 'rgba(0,0,0,0.6)' }}>{tk.t}</span>
        </div>
      ))}
    </div>
  );
}

export default function ThresholdsView() {
  const view = useInspectorView();
  const regionSlug = slugify(view?.geometry?.region ?? '') || 'default';
  const [s, setS] = useState<ColourSettings>(() => loadColourSettings(regionSlug));
  useEffect(() => { setS(loadColourSettings(regionSlug)); }, [regionSlug]);

  const update = useCallback((patch: Partial<ColourSettings>) => {
    const next = { ...loadColourSettings(regionSlug), ...patch };
    saveColourSettings(regionSlug, next);
    setS(next);
  }, [regionSlug]);

  useEffect(() => {
    const onEvt = (e: Event) => {
      const d = (e as CustomEvent).detail as { regionSlug?: string; settings?: ColourSettings } | undefined;
      if (!d || d.regionSlug !== (regionSlug || 'default') || !d.settings) return;
      setS(d.settings);
    };
    window.addEventListener(COLOUR_SETTINGS_EVENT, onEvt);
    return () => window.removeEventListener(COLOUR_SETTINGS_EVENT, onEvt);
  }, [regionSlug]);

  const [wrap, setWrap] = useState(true);
  const spec: ScaleSpec = { stops: s.stops, spreizung: s.spreizung, verjuengung: s.verjuengung };

  const sp = s.spreizung, vj = s.verjuengung;
  const setSp = (p: Partial<typeof sp>) => update({ spreizung: { ...sp, ...p } });
  const setVj = (p: Partial<typeof vj>) => update({ verjuengung: { ...vj, ...p } });

  const setStop = (i: number, color: string) => {
    const stops = s.stops.slice(); stops[i] = color; update({ stops });
  };
  const addStop = () => { if (s.stops.length < 6) update({ stops: [...s.stops, s.stops[s.stops.length - 1]] }); };
  const removeStop = (i: number) => { if (s.stops.length > 2) update({ stops: s.stops.filter((_, j) => j !== i) }); };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace', color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4 }}>
          P01 · Thresholds · Skalen-Modell · Region „{regionSlug}"
        </span>
        <AnthemCycleBadge />
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {/* Skalen-Form (vertikal) */}
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 6 }}>Skalen-Form <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· vertikal</span></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <VSlider label="Mitte" value={sp.mitte} onChange={(v) => setSp({ mitte: v })} />
            <VSlider label="oben het" value={sp.obenHet} onChange={(v) => setSp({ obenHet: v })} />
            <VSlider label="unten het" value={sp.untenHet} onChange={(v) => setSp({ untenHet: v })} />
            <div style={{ width: 1, alignSelf: 'stretch', background: '#e2e8f0', margin: '0 4px' }} />
            <VSlider label="Verj. oben" value={vj.oben} onChange={(v) => setVj({ oben: v })} />
            <VSlider label="Verj. unten" value={vj.unten} onChange={(v) => setVj({ unten: v })} />
          </div>
        </div>

        {/* Vorschau — rechts neben den Slidern */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Preview spec={spec} useWrap={wrap} />
          <label style={{ fontSize: 9.5, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} /> Wrap (Comfort)
          </label>
        </div>
      </div>

      {/* Farbsorten (horizontal) */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 6 }}>Farbsorten <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· horizontal · {s.stops.length}/6</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {s.stops.map((c, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <input type="color" value={toHex(c)} onChange={(e) => setStop(i, e.target.value)} style={{ width: 34, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
              {s.stops.length > 2 && (
                <button onClick={() => removeStop(i)} style={{ fontSize: 10, border: 'none', background: 'none', color: '#a0aec0', cursor: 'pointer' }}>×</button>
              )}
            </div>
          ))}
          {s.stops.length < 6 && (
            <button onClick={addStop} style={{ width: 28, height: 28, borderRadius: 4, border: '1px dashed #cbd5e0', background: '#f7fafc', color: '#4a5568', cursor: 'pointer', fontSize: 16 }}>+</button>
          )}
        </div>
      </div>

      {/* degradier bleibt (Mesh-Verhalten, kein Skalen-Form) */}
      <div style={{ marginTop: 16, borderTop: '1px solid #edf2f7', paddingTop: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Abdimm-Schwelle <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· Mesh · überlastete Strecken entdrängen</span></div>
        <label style={{ fontSize: 11, color: '#4a5568', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <input type="checkbox" checked={s.degradier != null} onChange={(e) => update({ degradier: e.target.checked ? 0.6 : null })} /> aktiv
        </label>
        {s.degradier != null && (
          <input type="range" min={0} max={1} step={0.01} value={s.degradier} onChange={(e) => update({ degradier: parseFloat(e.target.value) })} style={{ width: 200, accentColor: '#2b6cb0' }} />
        )}
      </div>
    </div>
  );
}

// input[type=color] braucht #rrggbb — rgb()/Kurzform konvertieren.
function toHex(c: string): string {
  const s = c.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) return '#' + s.slice(1).split('').map((x) => x + x).join('');
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(',').map((x) => Math.max(0, Math.min(255, Math.round(parseFloat(x)))));
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  return '#888888';
}
