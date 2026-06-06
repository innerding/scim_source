// P01 · Thresholds — Skalen-Modell, gespeist aus dem EINEN shell-kit/scale.
// Die Oberfläche ist eine Kopie dieses Modells.
//
// Blöcke:
//   1. Skalen-Säule: Last-Achse (objektiv, wie Mesh), gefärbt über colorAt. Darauf
//      DREI Mitten-Griffe (Pivots): unten/Mitte/oben. Sie stellen die ANSICHT ein,
//      auf der sich die Last verteilt — bestimmen Mesh UND Comfort.
//   2. Farbsorten (horizontal): 2–6 Farb-Stops.
//   3. Wrap (nur Comfort-Button): staucht die Comfort-Anzeige. Fasst das Mesh NIE an.
//
// Schreibt die colourSettings-Felder. Wirkung auf Mesh/Comfort = Stufe 4/5.

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadColourSettings, saveColourSettings, COLOUR_SETTINGS_EVENT, type ColourSettings } from '../../sensus/colourSettings';
import { useInspectorView } from '../../../runtime/repContext';
import { slugify } from '../../../runtime/router';
import { colorAt, type ScaleSpec } from 'shell-kit';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

const COL_H = 230;            // Säulen-Höhe (px)
const COL_W = 46;             // Säulen-Breite (px)
const GAP = 0.03;             // Mindestabstand zwischen Pivots (Last)

type PivotKey = 'unten' | 'mitte' | 'oben';

// ── Skalen-Säule mit drei Mitten-Griffen ──────────────────────────────────────
// Last-Achse: unten = Last 0, oben = Last 1. Hintergrund = colorAt (= Mesh-Sicht).
// Griffe sitzen auf ihrem Last-Wert; Ziehen verschiebt den Pivot.
function ScaleColumn({ spec, onChange }: {
  spec: ScaleSpec;
  onChange: (p: Partial<ScaleSpec['spreizung']>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<PivotKey | null>(null);
  const sp = spec.spreizung;
  const N = 60;

  const bounds = (key: PivotKey): [number, number] => {
    if (key === 'unten') return [0.02, sp.mitte - GAP];
    if (key === 'mitte') return [sp.unten + GAP, sp.oben - GAP];
    return [sp.mitte + GAP, 0.98];                       // oben
  };

  const onMove = useCallback((key: PivotKey, clientY: number) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const raw = 1 - (clientY - r.top) / r.height;        // oben = 1
    const [lo, hi] = bounds(key);
    onChange({ [key]: Math.max(lo, Math.min(hi, raw)) });
  }, [onChange, sp.mitte, sp.oben, sp.unten]);

  const pivot = (key: PivotKey, val: number, label: string) => {
    const topPct = (1 - val) * 100;
    const active = drag === key;
    return (
      <div
        key={key}
        onPointerDown={(e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); setDrag(key); }}
        onPointerMove={(e) => { if (drag === key) onMove(key, e.clientY); }}
        onPointerUp={(e) => { (e.target as HTMLElement).releasePointerCapture(e.pointerId); setDrag(null); }}
        style={{
          position: 'absolute', left: -7, right: -7, top: `calc(${topPct}% - 9px)`, height: 18,
          display: 'flex', alignItems: 'center', cursor: 'ns-resize', touchAction: 'none',
        }}
      >
        <div style={{
          flex: 1, height: active ? 4 : 3, background: '#1a202c',
          boxShadow: '0 0 0 1px #fff', borderRadius: 2,
        }} />
        <div style={{
          position: 'absolute', left: '100%', marginLeft: 6, whiteSpace: 'nowrap',
          fontSize: 9.5, lineHeight: 1.1, color: active ? '#1a365d' : '#4a5568',
          fontWeight: active ? 700 : 500,
        }}>
          {label}<br /><span style={{ fontFamily: 'ui-monospace, Menlo, monospace', color: '#a0aec0' }}>{val.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div ref={ref} style={{ position: 'relative', width: COL_W, height: COL_H, borderRadius: 5, overflow: 'visible', border: '1px solid #cbd5e0' }}>
        {/* Farb-Hintergrund (Last-Achse, oben = 1) */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 4, overflow: 'hidden' }}>
          {Array.from({ length: N }, (_, i) => {
            const load = (N - 1 - i) / (N - 1);
            return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(i / N) * 100}%`, height: `${100 / N + 0.6}%`, background: colorAt(load, spec) }} />;
          })}
        </div>
        {pivot('oben', sp.oben, 'oben')}
        {pivot('mitte', sp.mitte, 'Mitte')}
        {pivot('unten', sp.unten, 'unten')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: COL_H, fontSize: 8.5, color: '#a0aec0', paddingTop: 1 }}>
        <span>Last 1</span><span>0</span>
      </div>
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

      {/* Skalen-Säule + drei Mitten-Griffe */}
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 2 }}>
        Skalen-Säule <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· Last → Farbe · drei Mitten-Griffe</span>
      </div>
      <div style={{ fontSize: 10, color: '#718096', marginBottom: 10, maxWidth: 360 }}>
        Stellt die <strong>Ansicht</strong> ein, auf der sich die Last verteilt — gilt für <strong>Mesh und Comfort</strong>.
        Mitte = globale Mitte; oben/unten = Mitte ihres Bereichs.
      </div>
      <ScaleColumn spec={spec} onChange={setSp} />

      {/* Farbsorten (horizontal) */}
      <div style={{ marginTop: 18 }}>
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

      {/* Wrap — NUR Comfort-Button (subjektiv, fasst Mesh nie an) */}
      <div style={{ marginTop: 18, borderTop: '1px solid #edf2f7', paddingTop: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 2 }}>
          Wrap <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· nur Comfort-Button</span>
        </div>
        <div style={{ fontSize: 10, color: '#718096', marginBottom: 8, maxWidth: 360 }}>
          Staucht die Enden der <strong>Comfort-Anzeige</strong>, damit der Schieber nicht „knallt".
          Subjektiv — das <strong>Mesh bleibt objektiv</strong> (jedes 10-m-Segment zeigt die echte Last).
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <WrapSlider label="unten" value={vj.unten} onChange={(v) => setVj({ unten: v })} />
          <WrapSlider label="oben" value={vj.oben} onChange={(v) => setVj({ oben: v })} />
        </div>
      </div>

      {/* degradier bleibt (Mesh-Verhalten) */}
      <div style={{ marginTop: 18, borderTop: '1px solid #edf2f7', paddingTop: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Abdimm-Schwelle <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· Mesh · überlastete Strecken entdrängen</span></div>
        <label style={{ fontSize: 11, color: '#4a5568', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <input type="checkbox" checked={s.degradier != null} onChange={(e) => update({ degradier: e.target.checked ? 0.6 : null })} /> aktiv
        </label>
        {s.degradier != null && (
          <input type="range" min={0} max={1} step={0.01} value={s.degradier} onChange={(e) => update({ degradier: parseFloat(e.target.value) })} style={{ width: 200, accentColor: '#2b6cb0' }} />
        )}
      </div>

      {/* Bauplan-Notiz — wie das künftig in Relation zu „Sperren" laufen kann */}
      <div style={{ marginTop: 16, padding: '8px 10px', fontSize: 10.5, lineHeight: 1.5, color: '#744210', background: '#fffaf0', border: '1px solid #feebc8', borderRadius: 6 }}>
        <strong>Bauplan (Pflege-Pfad, künftig):</strong> Heute wird hier (Shell-Studio) justiert →
        über <strong>Origin publizieren</strong>. Später wandert die Pflege in ein
        <strong> Regio-Dashboard</strong> — ein <strong>direkter Pfad, ähnlich „Sperren setzen"</strong>.
        Dabei gilt die bestehende Schichtung: <strong>Spreizung/Normalisierung</strong> kann
        <strong> live über Anthem</strong> (5-Min-Takt, wie Sperren) wirken; <strong>Farb-Stops</strong>
        reisen über <strong>Origin</strong> (Bundle-Publish). Verbindliche Werte werden in die
        <strong> Representation zurückgeschrieben</strong> (Kapsel, versioniert). Der ScaleSpec ist
        der gemeinsame Vertrag — Editor (P01/Dashboard) und Propagation (Origin/Anthem) sind
        austauschbar. Siehe docs/thresholds_umbauplan.md.
      </div>
    </div>
  );
}

// vertikaler Wrap-Slider (rotierter Range — robust cross-browser)
function WrapSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 46 }}>
      <div style={{ width: 28, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input type="range" min={0} max={1} step={0.01} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ width: 96, transform: 'rotate(-90deg)', accentColor: '#2b6cb0' }} />
      </div>
      <span style={{ fontSize: 9, color: '#4a5568', fontFamily: 'ui-monospace, Menlo, monospace' }}>{value.toFixed(2)}</span>
      <span style={{ fontSize: 9.5, color: '#1a365d' }}>{label}</span>
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
