// P01 · Thresholds — Felder-/Grenzen-Modell. Die Wahrheit sind die GRENZEN
// (Load-Positionen 0..1), die N Farb-Felder trennen; der Verlauf ist nur Ansicht.
//
// SCHRITT 1: Klick auf ein Feld macht es zum Mittelfeld → es rückt in die Mitte
//   (Load 0.5); Felder darunter teilen sich die untere, darüber die obere Hälfte
//   (gleichmäßig, je nach Anzahl). Animiert.
// SCHRITT 2: an jeder inneren Feldgrenze ein Schieber, der die GRENZE verschiebt
//   (die zwei angrenzenden Felder ändern ihre Größe). Live, direkt.
// Dazu: Farb-Liste in Verlauf-Richtung (oben = Last 1), Felder per Drag&Drop
//   umsortierbar. Wrap bleibt Comfort-only.

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadColourSettings, saveColourSettings, COLOUR_SETTINGS_EVENT, evenBorders, type ColourSettings } from '../../sensus/colourSettings';
import { useInspectorView } from '../../../runtime/repContext';
import { slugify } from '../../../runtime/router';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

const PV_H = 220;
const GAP = 0.02;                                       // Mindestabstand zwischen Grenzen
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Feld i = [L_i, R_i]; L_0=0, R_{N-1}=1, innere Grenzen = borders.
const fieldLo = (b: number[], i: number) => (i === 0 ? 0 : b[i - 1]);
const fieldHi = (b: number[], i: number, n: number) => (i === n - 1 ? 1 : b[i]);
const fieldCenter = (b: number[], i: number, n: number) => (fieldLo(b, i) + fieldHi(b, i, n)) / 2;

// CSS-Verlauf: Farbe je Feld an dessen Mitte; Enden voll (unten = Last 0 → „to top").
function gradientCss(stops: string[], borders: number[]): string {
  const n = stops.length;
  const parts = [`${stops[0]} 0%`];
  for (let i = 0; i < n; i++) parts.push(`${stops[i]} ${(fieldCenter(borders, i, n) * 100).toFixed(2)}%`);
  parts.push(`${stops[n - 1]} 100%`);
  return `linear-gradient(to top, ${parts.join(', ')})`;
}

// Schritt 1: Grenzen so setzen, dass Feld c mittig (0.5) liegt; je Seite gleich groß.
function centerFieldBorders(n: number, c: number): number[] {
  const out: number[] = [];
  const unitLow = 0.5 / (c + 0.5);                      // c Felder + halbes Feld c unten
  const unitHigh = 0.5 / (0.5 + (n - 1 - c));           // halbes Feld c + (n-1-c) Felder oben
  for (let i = 0; i <= n - 2; i++) {
    if (i < c) out.push((i + 1) * unitLow);             // untere Grenzen
    else if (i === c) out.push(0.5 + 0.5 * unitHigh);   // Oberkante des Mittelfelds
    else out.push(0.5 + (0.5 + (i - c)) * unitHigh);    // obere Grenzen
  }
  return out.map((x) => Math.min(0.999, Math.max(0.001, x)));
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

  const [tweenB, setTweenB] = useState<number[] | null>(null);   // Schritt-1-Animation
  const [dragB, setDragB] = useState<number[] | null>(null);     // Schritt-2-Live-Drag
  const rafRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);                   // Grenz-Drag-Index
  const dndIdx = useRef<number | null>(null);                    // Drag&Drop-Reorder-Index

  useEffect(() => { setS(loadColourSettings(regionSlug)); setTweenB(null); setDragB(null); }, [regionSlug]);

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

  const n = s.stops.length;
  const borders = dragB ?? tweenB ?? s.borders;

  const animateTo = (from: number[], to: number[]) => {
    cancelAnimationFrame(rafRef.current);
    const start = performance.now(), dur = 420;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setTweenB(from.map((f, i) => f + (to[i] - f) * e));
      if (k < 1) rafRef.current = requestAnimationFrame(step);
      else setTweenB(null);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  // Schritt 1: Feld c → Mitte
  const centerField = (c: number) => {
    const from = s.borders.slice();
    const to = centerFieldBorders(n, c);
    update({ borders: to });
    animateTo(from, to);
  };
  const onBarClick = (e: React.MouseEvent) => {
    if (dragIdx.current != null) return;                // war ein Grenz-Drag
    const r = barRef.current?.getBoundingClientRect(); if (!r) return;
    const load = clamp01(1 - (e.clientY - r.top) / r.height);
    let c = n - 1;
    for (let i = 0; i < n; i++) { if (load < fieldHi(s.borders, i, n)) { c = i; break; } }
    centerField(c);
  };

  // Schritt 2: Grenze i ziehen
  const loadAt = (clientY: number) => {
    const r = barRef.current?.getBoundingClientRect(); if (!r) return 0.5;
    return clamp01(1 - (clientY - r.top) / r.height);
  };
  const onBorderDown = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragIdx.current = i; setDragB(s.borders.slice());
  };
  const onBorderMove = (i: number) => (e: React.PointerEvent) => {
    if (dragIdx.current !== i) return;
    const lo = (i === 0 ? 0 : s.borders[i - 1]) + GAP;
    const hi = (i === n - 2 ? 1 : s.borders[i + 1]) - GAP;
    const v = Math.min(hi, Math.max(lo, loadAt(e.clientY)));
    const nb = (dragB ?? s.borders).slice(); nb[i] = v; setDragB(nb);
  };
  const onBorderUp = (i: number) => (e: React.PointerEvent) => {
    if (dragIdx.current !== i) return;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
    if (dragB) update({ borders: dragB });
    setDragB(null);
    setTimeout(() => { dragIdx.current = null; }, 0);   // Klick-Zentrieren nicht auslösen
  };

  // Farben
  const setStop = (i: number, color: string) => { const stops = s.stops.slice(); stops[i] = color; update({ stops }); };
  const addStop = () => {
    if (n >= 6) return;
    const stops = [...s.stops, s.stops[n - 1]];
    update({ stops, borders: evenBorders(stops.length) });
    setTweenB(null); setDragB(null);
  };
  const removeStop = (i: number) => {
    if (n <= 2) return;
    const stops = s.stops.filter((_, j) => j !== i);
    update({ stops, borders: evenBorders(stops.length) });
    setTweenB(null); setDragB(null);
  };
  const resetEven = () => { update({ borders: evenBorders(n) }); setTweenB(null); setDragB(null); };

  // Drag&Drop-Reorder (Felder umsortieren; Grenzen/Größen bleiben slot-basiert)
  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const stops = s.stops.slice();
    const [m] = stops.splice(from, 1); stops.splice(to, 0, m);
    update({ stops });
  };

  const vj = s.verjuengung;
  const setVj = (p: Partial<typeof vj>) => update({ verjuengung: { ...vj, ...p } });

  // Liste in Verlauf-Richtung: oben = Last 1 = letzter Stop
  const order = Array.from({ length: n }, (_, k) => n - 1 - k);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace', color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4 }}>
          P01 · Thresholds · Felder-Modell · Region „{regionSlug}"
        </span>
        <AnthemCycleBadge />
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 2 }}>
        Felder & Grenzen <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· Klick = Mittelfeld · Grenz-Griffe ziehen</span>
      </div>
      <div style={{ fontSize: 10, color: '#718096', marginBottom: 10, maxWidth: 420 }}>
        <strong>Schritt 1:</strong> Klick auf ein Feld → es rückt in die Mitte. <strong>Schritt 2:</strong> die
        weißen <strong>Grenz-Griffe</strong> ziehen verschiebt die Grenze; die angrenzenden Felder ändern ihre Größe.
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {/* Verlauf-Säule: klickbare Felder + Grenz-Griffe + Mitte-Referenz */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            ref={barRef}
            onClick={onBarClick}
            title="Feld anklicken = in die Mitte rücken"
            style={{ position: 'relative', width: 46, height: PV_H, borderRadius: 5, border: '1px solid #cbd5e0', background: gradientCss(s.stops, borders), cursor: 'pointer' }}
          >
            {/* Mitte-Referenz */}
            <div style={{ position: 'absolute', left: -3, right: -3, top: '50%', height: 0, borderTop: '2px solid rgba(0,0,0,0.5)', boxShadow: '0 0 0 0.6px rgba(255,255,255,0.8)' }} />
            {/* Grenz-Griffe (Schritt 2) */}
            {borders.map((b, i) => (
              <div
                key={i}
                onPointerDown={onBorderDown(i)} onPointerMove={onBorderMove(i)} onPointerUp={onBorderUp(i)}
                title={`Grenze ${i + 1}: ${(b * 100).toFixed(0)}%`}
                style={{ position: 'absolute', left: -7, right: -7, top: `calc(${(1 - b) * 100}% - 7px)`, height: 14, display: 'flex', alignItems: 'center', cursor: 'ns-resize', touchAction: 'none' }}
              >
                <div style={{ flex: 1, height: dragIdx.current === i ? 4 : 3, background: '#ffffff', boxShadow: '0 0 0 1px rgba(0,0,0,0.45)', borderRadius: 2 }} />
              </div>
            ))}
          </div>
          <span style={{ fontSize: 8.5, color: '#a0aec0' }}>oben = Last 1</span>
          <button onClick={resetEven} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#f7fafc', color: '#718096', cursor: 'pointer' }}>↺ gleichverteilen</button>
        </div>

        {/* Farb-Felder: Verlauf-Richtung, Drag&Drop, je Feld zur Mitte */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 6 }}>Felder <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· {n}/6 · ziehen zum Umsortieren</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {order.map((i) => (
              <div
                key={i}
                draggable
                onDragStart={() => { dndIdx.current = i; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dndIdx.current != null) reorder(dndIdx.current, i); dndIdx.current = null; }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px', borderRadius: 4, cursor: 'grab', background: '#fff', border: '1px solid #edf2f7' }}
              >
                <span style={{ color: '#cbd5e0', fontSize: 12, cursor: 'grab' }}>⠿</span>
                <input type="color" value={toHex(s.stops[i])} onChange={(e) => setStop(i, e.target.value)} style={{ width: 30, height: 24, border: 'none', background: 'none', cursor: 'pointer' }} />
                <button onClick={() => centerField(i)} title="dieses Feld in die Mitte rücken" style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, border: '1px solid #cbd5e0', background: '#fff', color: '#2b6cb0', cursor: 'pointer' }}>⊙ Mitte</button>
                {n > 2 && (
                  <button onClick={() => removeStop(i)} style={{ marginLeft: 'auto', fontSize: 12, border: 'none', background: 'none', color: '#a0aec0', cursor: 'pointer' }}>×</button>
                )}
              </div>
            ))}
            {n < 6 && (
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
        <strong>Bauplan:</strong> Mesh liest künftig <strong>borders</strong> (statt spreizung) — Wiring folgt.
        Pflege später im Regio-Dashboard, Werte in die Representation zurückgeschrieben (Kapsel).
        Siehe docs/thresholds_umbauplan.md.
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
