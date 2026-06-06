// P01 · Thresholds — Felder-/Grenzen-Modell (einfaches Denken).
// Die Skala = Farb-Felder, getrennt durch Grenzen (Load-Positionen 0..1).
// Der farbige Verlauf ist nur ANSICHT dieser Positionen.
//
// SCHRITT 1 (hier gebaut): Marker beliebig setzen → „✓ Check" zentriert diesen
//   Punkt auf die Mitte (Load 0.5); alle Felder darunter teilen sich die untere,
//   alle darüber die obere Hälfte (rechnerische Verschiebung der Positionen). Die
//   Farben wandern mit (keine Umfärbung). „✎ ändern" löst den Marker wieder.
//
// SCHRITT 2 (später): zwei Live-Schieber justieren die Grenzen je Hälfte direkt.

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadColourSettings, saveColourSettings, COLOUR_SETTINGS_EVENT, evenPositions, type ColourSettings } from '../../sensus/colourSettings';
import { useInspectorView } from '../../../runtime/repContext';
import { slugify } from '../../../runtime/router';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

const PV_H = 200;            // Säulen-Höhe (px)
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// CSS-Verlauf aus Stops + Positionen (unten = Load 0 → „to top").
function gradientCss(stops: string[], positions: number[]): string {
  const parts = stops.map((c, i) => `${c} ${(positions[i] * 100).toFixed(2)}%`);
  return `linear-gradient(to top, ${parts.join(', ')})`;
}

// Zentriert den Punkt m: Positionen < m → [0,0.5], > m → [0.5,1].
function centerPositions(p: number[], m: number): number[] {
  const mm = Math.min(0.98, Math.max(0.02, m));
  return p.map((x) => (x <= mm ? (x * 0.5) / mm : 0.5 + ((x - mm) * 0.5) / (1 - mm)));
}

// ── zarter vertikaler Wrap-Slider (Comfort-only) ──────────────────────────────
function VSlider({ label, value, onChange, accent = '#805ad5' }: {
  label: string; value: number; onChange: (v: number) => void; accent?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 48 }}>
      <div style={{ width: 28, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input type="range" min={0} max={1} step={0.01} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ width: 96, transform: 'rotate(-90deg)', accentColor: accent }} />
      </div>
      <span style={{ fontSize: 9, color: '#4a5568', fontFamily: 'ui-monospace, Menlo, monospace' }}>{value.toFixed(2)}</span>
      <span style={{ fontSize: 9.5, color: '#1a365d' }}>{label}</span>
    </div>
  );
}

export default function ThresholdsView() {
  const view = useInspectorView();
  const regionSlug = slugify(view?.geometry?.region ?? '') || 'default';
  const [s, setS] = useState<ColourSettings>(() => loadColourSettings(regionSlug));

  // Schritt-1-Zustand
  const [checked, setChecked] = useState(false);
  const [marker, setMarker] = useState(0.5);          // Marker-Load (im Justier-Modus)
  const [tweenPos, setTweenPos] = useState<number[] | null>(null); // animierte Anzeige-Positionen
  const rafRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);

  useEffect(() => {
    setS(loadColourSettings(regionSlug)); setChecked(false); setMarker(0.5); setTweenPos(null);
  }, [regionSlug]);

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

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const animateTo = (from: number[], to: number[]) => {
    cancelAnimationFrame(rafRef.current);
    const start = performance.now(), dur = 420;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);                 // easeOutCubic
      setTweenPos(from.map((f, i) => f + (to[i] - f) * e));
      if (k < 1) rafRef.current = requestAnimationFrame(step);
      else setTweenPos(null);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const toggleCheck = () => {
    if (!checked) {
      const from = s.positions.slice();
      const to = centerPositions(s.positions, marker);
      update({ positions: to });
      setChecked(true); setMarker(0.5);
      animateTo(from, to);
    } else {
      setChecked(false); setMarker(0.5);
    }
  };

  // Marker per Zeiger setzen (nur im Justier-Modus)
  const pointToLoad = (clientY: number) => {
    const r = barRef.current?.getBoundingClientRect(); if (!r) return marker;
    return clamp01(1 - (clientY - r.top) / r.height);
  };
  const onBarDown = (e: React.PointerEvent) => {
    if (checked) return;
    dragRef.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setMarker(pointToLoad(e.clientY));
  };
  const onBarMove = (e: React.PointerEvent) => { if (dragRef.current && !checked) setMarker(pointToLoad(e.clientY)); };
  const onBarUp = (e: React.PointerEvent) => { dragRef.current = false; try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ } };

  const displayPos = tweenPos ?? s.positions;
  const markerY = checked ? 0.5 : marker;

  const setStop = (i: number, color: string) => { const stops = s.stops.slice(); stops[i] = color; update({ stops }); };
  const addStop = () => {
    if (s.stops.length >= 6) return;
    const stops = [...s.stops, s.stops[s.stops.length - 1]];
    update({ stops, positions: evenPositions(stops.length) });   // Felder neu gleichverteilen
    setChecked(false); setMarker(0.5);
  };
  const removeStop = (i: number) => {
    if (s.stops.length <= 2) return;
    const stops = s.stops.filter((_, j) => j !== i);
    update({ stops, positions: evenPositions(stops.length) });
    setChecked(false); setMarker(0.5);
  };
  const resetEven = () => { update({ positions: evenPositions(s.stops.length) }); setChecked(false); setMarker(0.5); };

  const vj = s.verjuengung;
  const setVj = (p: Partial<typeof vj>) => update({ verjuengung: { ...vj, ...p } });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace', color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4 }}>
          P01 · Thresholds · Felder-Modell · Region „{regionSlug}"
        </span>
        <AnthemCycleBadge />
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 2 }}>
        Schritt 1 · Mitte zentrieren <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· Felder + Grenzen</span>
      </div>
      <div style={{ fontSize: 10, color: '#718096', marginBottom: 10, maxWidth: 380 }}>
        Marker auf dem Verlauf setzen → <strong>„✓ Check"</strong> zentriert diesen Punkt auf die Mitte.
        Felder darunter/darüber teilen sich je die untere/obere Hälfte — die Farben wandern mit.
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Verlauf-Säule mit Marker */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            ref={barRef}
            onPointerDown={onBarDown} onPointerMove={onBarMove} onPointerUp={onBarUp}
            style={{ position: 'relative', width: 44, height: PV_H, borderRadius: 5, border: '1px solid #cbd5e0', background: gradientCss(s.stops, displayPos), cursor: checked ? 'default' : 'ns-resize', touchAction: 'none' }}
          >
            <div style={{ position: 'absolute', left: -4, right: -4, top: `${(1 - markerY) * 100}%`, height: 0, borderTop: checked ? '2px solid rgba(255,255,255,0.97)' : '2px dashed rgba(255,255,255,0.97)', boxShadow: '0 0 0 0.7px rgba(0,0,0,0.55)', transition: tweenPos ? 'top 0.42s ease' : 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={toggleCheck}
              style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 600,
                border: '1px solid ' + (checked ? '#2b6cb0' : '#dd6b20'),
                background: checked ? '#ebf8ff' : '#dd6b20', color: checked ? '#2b6cb0' : '#fff' }}
            >{checked ? '✎ ändern' : '✓ Check'}</button>
          </div>
          <button onClick={resetEven} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#f7fafc', color: '#718096', cursor: 'pointer' }}>↺ gleichverteilen</button>
        </div>

        {/* Farbsorten + Positionen */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 6 }}>Farben <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· {s.stops.length}/6 · unten → oben</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {s.stops.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={toHex(c)} onChange={(e) => setStop(i, e.target.value)} style={{ width: 30, height: 24, border: 'none', background: 'none', cursor: 'pointer' }} />
                <span style={{ fontSize: 9.5, color: '#a0aec0', fontFamily: 'ui-monospace, Menlo, monospace', width: 64 }}>Pos {(s.positions[i] * 100).toFixed(0)}%</span>
                {s.stops.length > 2 && (
                  <button onClick={() => removeStop(i)} style={{ fontSize: 12, border: 'none', background: 'none', color: '#a0aec0', cursor: 'pointer' }}>×</button>
                )}
              </div>
            ))}
            {s.stops.length < 6 && (
              <button onClick={addStop} style={{ marginTop: 2, alignSelf: 'flex-start', width: 28, height: 26, borderRadius: 4, border: '1px dashed #cbd5e0', background: '#f7fafc', color: '#4a5568', cursor: 'pointer', fontSize: 16 }}>+</button>
            )}
          </div>
        </div>
      </div>

      {/* Wrap — NUR Comfort-Button */}
      <div style={{ marginTop: 18, borderTop: '1px solid #edf2f7', paddingTop: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 2 }}>
          Wrap <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· nur Comfort-Button</span>
        </div>
        <div style={{ fontSize: 10, color: '#718096', marginBottom: 8, maxWidth: 380 }}>
          Staucht die Enden der <strong>Comfort-Anzeige</strong> (subjektiv). Das <strong>Mesh bleibt objektiv</strong>.
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <VSlider label="unten" value={vj.unten} onChange={(v) => setVj({ unten: v })} />
          <VSlider label="oben" value={vj.oben} onChange={(v) => setVj({ oben: v })} />
        </div>
      </div>

      {/* degradier */}
      <div style={{ marginTop: 18, borderTop: '1px solid #edf2f7', paddingTop: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Abdimm-Schwelle <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· Mesh · überlastete Strecken entdrängen</span></div>
        <label style={{ fontSize: 11, color: '#4a5568', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <input type="checkbox" checked={s.degradier != null} onChange={(e) => update({ degradier: e.target.checked ? 0.6 : null })} /> aktiv
        </label>
        {s.degradier != null && (
          <input type="range" min={0} max={1} step={0.01} value={s.degradier} onChange={(e) => update({ degradier: parseFloat(e.target.value) })} style={{ width: 200, accentColor: '#2b6cb0' }} />
        )}
      </div>

      {/* Bauplan-Notiz */}
      <div style={{ marginTop: 16, padding: '8px 10px', fontSize: 10.5, lineHeight: 1.5, color: '#744210', background: '#fffaf0', border: '1px solid #feebc8', borderRadius: 6 }}>
        <strong>Bauplan:</strong> Schritt 2 (folgt) — zwei Live-Schieber justieren die Grenzen je Hälfte direkt.
        Mesh liest künftig <strong>positions</strong> (statt spreizung); Pflege später im Regio-Dashboard,
        Werte in die Representation zurückgeschrieben (Kapsel). Siehe docs/thresholds_umbauplan.md.
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
