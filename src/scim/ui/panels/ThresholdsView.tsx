// P01 · Thresholds — Default-Kaskade (Schritt A): drei Säulen Representation · Region ·
// Global, jede eine eigenständige Editor-Komponente (ThresholdColumn). Kopplung von
// Region und Representation direkt an Global (flach): gekoppelt = spiegelt Global und
// folgt dessen Änderungen; Editieren entkoppelt; „an Global koppeln" schnappt zurück.
//
// NICHT-BRECHEND: die Region-Säule schreibt weiter in den bestehenden Region-Storage-
// Key (regionSlug), den die Live-Pipeline (Mesh/Runtime) liest. Global + Representation
// sind neue Keys, noch nicht von der Pipeline gelesen (Wiring folgt in späteren Schritten).
//
// Rollen-Maske + Effekt-Gate (Sandbox) kommen in Schritt B; hier ist alles operator-live.

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadColourSettings, saveColourSettings, isColourCustomized, COLOUR_SETTINGS_EVENT, evenBorders, type ColourSettings } from '../../sensus/colourSettings';
import { useColourRegionSlug } from '../../../runtime/useAuftraggeberRep';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

const PV_H = 220;
const GAP = 0.02;                                       // Mindestabstand zwischen Grenzen
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const fieldHi = (b: number[], i: number, n: number) => (i === n - 1 ? 1 : b[i]);
const fieldLo = (b: number[], i: number) => (i === 0 ? 0 : b[i - 1]);
const fieldCenter = (b: number[], i: number, n: number) => (fieldLo(b, i) + fieldHi(b, i, n)) / 2;

function gradientCss(stops: string[], borders: number[]): string {
  const n = stops.length;
  const parts = [`${stops[0]} 0%`];
  for (let i = 0; i < n; i++) parts.push(`${stops[i]} ${(fieldCenter(borders, i, n) * 100).toFixed(2)}%`);
  parts.push(`${stops[n - 1]} 100%`);
  return `linear-gradient(to top, ${parts.join(', ')})`;
}

function centerFieldBorders(n: number, c: number): number[] {
  c = Math.max(0, Math.min(n - 1, c));
  const half = 1 / (2 * n);
  const lo = 0.5 - half, hi = 0.5 + half;
  const below = c, above = n - 1 - c;
  const out: number[] = [];
  for (let i = 0; i <= n - 2; i++) {
    if (i < c) out.push(below > 0 ? (i + 1) * (lo / below) : lo);
    else if (i === c) out.push(hi);
    else out.push(above > 0 ? hi + (i - c) * ((1 - hi) / above) : hi);
  }
  return out.map((x) => Math.min(0.999, Math.max(0.001, x)));
}

// ── Eine Säule: Verlauf-Editor (Mitte/Grenzen) + Farb-Liste ───────────────────
function ThresholdColumn({ title, settings, onChange, coupling, headerExtra }: {
  title: string;
  settings: ColourSettings;
  onChange: (patch: Partial<ColourSettings>) => void;
  coupling?: { coupled: boolean; onCouple: () => void };
  headerExtra?: React.ReactNode;
}) {
  const s = settings;
  const n = s.stops.length;

  const [tweenB, setTweenB] = useState<number[] | null>(null);
  const [dragB, setDragB] = useState<number[] | null>(null);
  const [leftDrag, setLeftDrag] = useState<number | null>(null);
  const rafRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);
  const leftDragging = useRef(false);
  const dndIdx = useRef<number | null>(null);

  // Bei Settings-Wechsel von außen (Kopplung/Region-Wechsel) Live-Drag verwerfen.
  useEffect(() => { setTweenB(null); setDragB(null); }, [settings]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

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

  const loadAt = (clientY: number) => {
    const r = barRef.current?.getBoundingClientRect(); if (!r) return 0.5;
    return clamp01(1 - (clientY - r.top) / r.height);
  };

  const centerField = (c: number) => {
    const from = s.borders.slice();
    const to = centerFieldBorders(n, c);
    onChange({ borders: to, middleField: c });
    animateTo(from, to);
  };
  const onLeftDown = (e: React.PointerEvent) => {
    e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId);
    leftDragging.current = true; setLeftDrag(loadAt(e.clientY));
  };
  const onLeftMove = (e: React.PointerEvent) => { if (leftDragging.current) setLeftDrag(loadAt(e.clientY)); };
  const onLeftUp = (e: React.PointerEvent) => {
    if (!leftDragging.current) return;
    leftDragging.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
    const L = leftDrag ?? 0.5;
    let c = n - 1;
    for (let i = 0; i < n; i++) { if (L < fieldHi(s.borders, i, n)) { c = i; break; } }
    setLeftDrag(null);
    centerField(c);
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
    if (dragB) onChange({ borders: dragB });
    setDragB(null);
    setTimeout(() => { dragIdx.current = null; }, 0);
  };

  const onMidDown = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragIdx.current = i; setDragB(s.borders.slice());
  };
  const onMidMove = (e: React.PointerEvent) => {
    if (dragIdx.current == null || s.middleField == null) return;
    const mid = s.middleField, lowI = mid - 1, hiI = mid;
    const below = lowI - 1 >= 0 ? s.borders[lowI - 1] : 0;
    const above = hiI + 1 <= n - 2 ? s.borders[hiI + 1] : 1;
    let h = Math.abs(loadAt(e.clientY) - 0.5);
    h = Math.max(0.005, Math.min(h, 0.5 - below - GAP, above - 0.5 - GAP));
    const nb = (dragB ?? s.borders).slice();
    nb[lowI] = 0.5 - h; nb[hiI] = 0.5 + h;
    setDragB(nb);
  };
  const onMidUp = (e: React.PointerEvent) => {
    if (dragIdx.current == null) return;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
    if (dragB) onChange({ borders: dragB });
    setDragB(null);
    setTimeout(() => { dragIdx.current = null; }, 0);
  };

  const setStop = (i: number, color: string) => { const stops = s.stops.slice(); stops[i] = color; onChange({ stops }); };
  const addStop = () => {
    if (n >= 6) return;
    const stops = [...s.stops, s.stops[n - 1]];
    onChange({ stops, borders: evenBorders(stops.length), middleField: null });
    setTweenB(null); setDragB(null);
  };
  const removeStop = (i: number) => {
    if (n <= 2) return;
    const stops = s.stops.filter((_, j) => j !== i);
    onChange({ stops, borders: evenBorders(stops.length), middleField: null });
    setTweenB(null); setDragB(null);
  };
  const resetEven = () => { onChange({ borders: evenBorders(n), middleField: null }); setTweenB(null); setDragB(null); };
  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const stops = s.stops.slice();
    const [m] = stops.splice(from, 1); stops.splice(to, 0, m);
    onChange({ stops });
  };

  const order = Array.from({ length: n }, (_, k) => n - 1 - k);

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Säulen-Kopf: Titel + Kopplungs-Schalter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, minHeight: 20 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d' }}>{title}</span>
        {coupling && (
          coupling.coupled
            ? <span style={{ fontSize: 9.5, color: '#2f855a', fontFamily: 'monospace' }}>🔗 an Global</span>
            : <button onClick={coupling.onCouple} title="wieder an Global koppeln (spiegelt Global)"
                style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#f7fafc', color: '#718096', cursor: 'pointer' }}>🔗 an Global koppeln</button>
        )}
        {headerExtra}
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Verlauf-Fenster */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', height: PV_H }}>
            <div style={{ position: 'relative', width: 22, height: PV_H }}>
              <div
                onPointerDown={onLeftDown} onPointerMove={onLeftMove} onPointerUp={onLeftUp}
                title="ziehen: Feld zur Mitte wählen"
                style={{ position: 'absolute', left: 0, right: 1, top: `calc(${(1 - (leftDrag ?? 0.5)) * 100}% - 7px)`, height: 14, display: 'flex', alignItems: 'center', cursor: 'ns-resize', touchAction: 'none' }}
              >
                <div style={{ flex: 1, height: leftDragging.current ? 3 : 2, background: '#1a365d', borderRadius: 1 }} />
              </div>
            </div>

            <div ref={barRef} style={{ position: 'relative', width: 46, height: PV_H, borderRadius: 4, border: '1px solid #cbd5e0', background: gradientCss(s.stops, borders) }} />

            <div style={{ position: 'relative', width: 22, height: PV_H }}>
              {borders.map((b, i) => {
                const mid = s.middleField;
                const isMidPair = mid != null && mid - 1 >= 0 && mid <= n - 2 && (i === mid - 1 || i === mid);
                const down = isMidPair ? onMidDown(i) : onBorderDown(i);
                const move = isMidPair ? onMidMove : onBorderMove(i);
                const up = isMidPair ? onMidUp : onBorderUp(i);
                return (
                  <div
                    key={i}
                    onPointerDown={down} onPointerMove={move} onPointerUp={up}
                    title={isMidPair ? 'Mittelfeld-Größe (bleibt zentriert)' : `Grenze ${i + 1}: ${(b * 100).toFixed(0)}%`}
                    style={{ position: 'absolute', left: 1, right: 0, top: `calc(${(1 - b) * 100}% - 7px)`, height: 14, display: 'flex', alignItems: 'center', cursor: 'ns-resize', touchAction: 'none' }}
                  >
                    <div style={{ flex: 1, height: dragIdx.current === i ? 3 : 2, background: isMidPair ? '#2b6cb0' : '#1a365d', borderRadius: 1 }} />
                  </div>
                );
              })}
            </div>
          </div>
          <span style={{ fontSize: 8.5, color: '#a0aec0' }}>Mitte · Grenzen</span>
          <button onClick={resetEven} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#f7fafc', color: '#718096', cursor: 'pointer' }}>↺ zurücksetzen</button>
        </div>

        {/* Farb-Felder */}
        <div style={{ width: 118 }}>
          <div style={{ fontSize: 8.5, color: '#a0aec0', marginBottom: 2 }}>↑ oben = Last 1</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {order.map((i) => {
              const isMid = s.middleField === i;
              return (
                <div
                  key={i}
                  draggable
                  onDragStart={() => { dndIdx.current = i; }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dndIdx.current != null) reorder(dndIdx.current, i); dndIdx.current = null; }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px', borderRadius: 4, cursor: 'grab', background: isMid ? '#ebf8ff' : '#fff', border: '1px solid ' + (isMid ? '#bee3f8' : '#edf2f7') }}
                >
                  <span style={{ color: '#cbd5e0', fontSize: 12, cursor: 'grab' }}>⠿</span>
                  <input type="color" value={toHex(s.stops[i])} onChange={(e) => setStop(i, e.target.value)} style={{ width: 28, height: 22, border: 'none', background: 'none', cursor: 'pointer' }} />
                  {isMid && <span style={{ fontSize: 9, color: '#2b6cb0' }}>Mitte</span>}
                  {n > 2 && (
                    <button onClick={() => removeStop(i)} style={{ marginLeft: 'auto', fontSize: 12, border: 'none', background: 'none', color: '#a0aec0', cursor: 'pointer' }}>×</button>
                  )}
                </div>
              );
            })}
            {n < 6 && (
              <button onClick={addStop} style={{ marginTop: 2, alignSelf: 'flex-start', width: 28, height: 26, borderRadius: 4, border: '1px dashed #cbd5e0', background: '#f7fafc', color: '#4a5568', cursor: 'pointer', fontSize: 16 }}>+</button>
            )}
          </div>
          <div style={{ fontSize: 8.5, color: '#a0aec0', marginTop: 2 }}>↓ unten = Last 0</div>
        </div>
      </div>
    </div>
  );
}

// ── Kopplungs-Flag (gekoppelt = spiegelt Global + folgt dessen Änderungen) ────
const coupleKey = (k: string) => `scim3_couple_${k || 'default'}`;
const loadCoupled = (k: string) => { try { return localStorage.getItem(coupleKey(k)) === '1'; } catch { return false; } };
const saveCoupled = (k: string, v: boolean) => { try { localStorage.setItem(coupleKey(k), v ? '1' : '0'); } catch { /* */ } };

const GLOBAL_KEY = '__global__';

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
  const regionSlug = useColourRegionSlug();
  const repKey = `__rep__${regionSlug || 'default'}`;

  // Global startet von der aktuellen Region (einmalig, solange Global nie gesetzt wurde) —
  // damit nichts manuell nachgebaut werden muss.
  const [globalS, setGlobalS] = useState<ColourSettings>(() =>
    isColourCustomized(GLOBAL_KEY) ? loadColourSettings(GLOBAL_KEY) : loadColourSettings(regionSlug));
  useEffect(() => {
    if (!isColourCustomized(GLOBAL_KEY)) saveColourSettings(GLOBAL_KEY, loadColourSettings(regionSlug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [regionS, setRegionS] = useState<ColourSettings>(() => loadColourSettings(regionSlug));
  const [repS, setRepS] = useState<ColourSettings>(() => loadColourSettings(repKey));
  const [regionCoupled, setRegionCoupled] = useState<boolean>(() => loadCoupled(regionSlug));
  const [repCoupled, setRepCoupled] = useState<boolean>(() => loadCoupled(repKey));

  // Region-/Rep-Wechsel: neu laden.
  useEffect(() => {
    setRegionS(loadColourSettings(regionSlug));
    setRepS(loadColourSettings(repKey));
    setRegionCoupled(loadCoupled(regionSlug));
    setRepCoupled(loadCoupled(repKey));
  }, [regionSlug, repKey]);

  // Live-Pipeline-Sync: andere Schreiber der Region-Settings spiegeln.
  useEffect(() => {
    const onEvt = (e: Event) => {
      const d = (e as CustomEvent).detail as { regionSlug?: string; settings?: ColourSettings } | undefined;
      if (!d || d.regionSlug !== (regionSlug || 'default') || !d.settings) return;
      setRegionS(d.settings);
    };
    window.addEventListener(COLOUR_SETTINGS_EVENT, onEvt);
    return () => window.removeEventListener(COLOUR_SETTINGS_EVENT, onEvt);
  }, [regionSlug]);

  // Global ändern: in gekoppelte Kinder durchschreiben (Write-through → Pipeline bleibt korrekt).
  const updateGlobal = useCallback((patch: Partial<ColourSettings>) => {
    const next = { ...loadColourSettings(GLOBAL_KEY), ...patch };
    saveColourSettings(GLOBAL_KEY, next); setGlobalS(next);
    if (loadCoupled(regionSlug)) { saveColourSettings(regionSlug, next); setRegionS(next); }
    if (loadCoupled(repKey))     { saveColourSettings(repKey, next);     setRepS(next); }
  }, [regionSlug, repKey]);

  // Region/Rep editieren → entkoppelt automatisch.
  const updateRegion = useCallback((patch: Partial<ColourSettings>) => {
    const next = { ...loadColourSettings(regionSlug), ...patch };
    saveColourSettings(regionSlug, next); setRegionS(next);
    if (loadCoupled(regionSlug)) { saveCoupled(regionSlug, false); setRegionCoupled(false); }
  }, [regionSlug]);
  const updateRep = useCallback((patch: Partial<ColourSettings>) => {
    const next = { ...loadColourSettings(repKey), ...patch };
    saveColourSettings(repKey, next); setRepS(next);
    if (loadCoupled(repKey)) { saveCoupled(repKey, false); setRepCoupled(false); }
  }, [repKey]);

  // „an Global koppeln": Global → Säule spiegeln + Flag setzen.
  const coupleRegion = () => { const g = loadColourSettings(GLOBAL_KEY); saveColourSettings(regionSlug, g); setRegionS(g); saveCoupled(regionSlug, true); setRegionCoupled(true); };
  const coupleRep = () => { const g = loadColourSettings(GLOBAL_KEY); saveColourSettings(repKey, g); setRepS(g); saveCoupled(repKey, true); setRepCoupled(true); };

  // Wrap + Abdimm bleiben (vorerst) auf der Region (Live-Scope).
  const vj = regionS.verjuengung;
  const setVj = (p: Partial<typeof vj>) => updateRegion({ verjuengung: { ...vj, ...p } });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <AnthemCycleBadge />
      </div>

      {/* Default-Kaskade: Representation · Region · Global (Ergebnis links, global rechts) */}
      <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 6 }}>
        <ThresholdColumn title="Representation" settings={repS}    onChange={updateRep}    coupling={{ coupled: repCoupled,    onCouple: coupleRep }} />
        <ThresholdColumn title="Region"         settings={regionS} onChange={updateRegion} coupling={{ coupled: regionCoupled, onCouple: coupleRegion }} />
        <ThresholdColumn title="Global"         settings={globalS} onChange={updateGlobal} />
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

      {/* Abdimm-Schwelle */}
      <div style={{ marginTop: 18, borderTop: '1px solid #edf2f7', paddingTop: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Abdimm-Schwelle <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· Mesh · überlastete Strecken entdrängen</span></div>
        <label style={{ fontSize: 11, color: '#4a5568', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <input type="checkbox" checked={regionS.degradier != null} onChange={(e) => updateRegion({ degradier: e.target.checked ? 0.6 : null })} /> aktiv
        </label>
        {regionS.degradier != null && (
          <input type="range" min={0} max={1} step={0.01} value={regionS.degradier} onChange={(e) => updateRegion({ degradier: parseFloat(e.target.value) })} style={{ width: 200, accentColor: '#2b6cb0' }} />
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
