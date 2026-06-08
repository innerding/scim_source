// P01 · Thresholds — Default-Kaskade mit Rollen-Maske (Schritt B).
//
// Säulen (links→rechts): Rep-Editor-Rep · Reg-Editor-Reg · Representation · Region · Global.
// Die letzten drei sind die OPERATOR-Säulen (sein Master), die ersten zwei die EDITOR-Säulen.
//
// Zwei Achsen:
//  · Sicht (activeMode/Tab) → welche Säulen, welche abgedimmt.
//  · Wirkung (echtes Login == Tab-Eigentümer && nicht Review) → live vs. Sandbox.
// Drei Säulen-Zustände: live (interaktiv + speichert) · sandbox (interaktiv, folgenlos) ·
// dimmed (abgedimmt + tot, „technischer Ursprung").
//
// NICHT-BRECHEND: Region schreibt weiter in den regionSlug-Key (Live-Pipeline). Alle anderen
// Säulen sind eigene Keys, noch nicht von der Pipeline gelesen.

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadColourSettings, saveColourSettings, isColourCustomized, COLOUR_SETTINGS_EVENT, evenBorders, type ColourSettings } from '../../sensus/colourSettings';
import { useColourRegionSlug } from '../../../runtime/useAuftraggeberRep';
import { useModeSwitch, type Role } from '../RoleContext';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

const PV_H = 220;
const GAP = 0.02;
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

// ── Eine Säule: Verlauf-Editor + Farb-Liste ───────────────────────────────────
function ThresholdColumn({ title, settings, onChange, onReset, resetLabel, coupling, dimmed = false, editable = 'full' }: {
  title: string;
  settings: ColourSettings;
  onChange: (patch: Partial<ColourSettings>) => void;
  onReset?: () => void;                 // eltern-bezogenes Zurücksetzen (Default der nächsthöheren Instanz)
  resetLabel?: string;
  coupling?: { coupled: boolean; onCouple: () => void };
  dimmed?: boolean;                    // abgedimmt + tot (technischer Ursprung)
  editable?: 'full' | 'borders';       // 'borders' = kein +Farbe / kein × / kein Mittelschieber
}) {
  const s = settings;
  const n = s.stops.length;
  const full = editable === 'full';

  const [tweenB, setTweenB] = useState<number[] | null>(null);
  const [dragB, setDragB] = useState<number[] | null>(null);
  const [leftDrag, setLeftDrag] = useState<number | null>(null);
  const rafRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);
  const leftDragging = useRef(false);
  const dndIdx = useRef<number | null>(null);

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
  const resetEven = () => { (onReset ?? (() => onChange({ borders: evenBorders(n), middleField: null })))(); setTweenB(null); setDragB(null); };
  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const stops = s.stops.slice();
    const [m] = stops.splice(from, 1); stops.splice(to, 0, m);
    onChange({ stops });
  };

  const order = Array.from({ length: n }, (_, k) => n - 1 - k);

  return (
    <div style={{ flexShrink: 0, opacity: dimmed ? 0.32 : 1, pointerEvents: dimmed ? 'none' : 'auto', filter: dimmed ? 'grayscale(0.5)' : undefined, transition: 'opacity 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, minHeight: 20 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', whiteSpace: 'nowrap' }}>{title}</span>
        {coupling && (
          coupling.coupled
            ? <span style={{ fontSize: 9.5, color: '#2f855a', fontFamily: 'monospace' }}>🔗 an Global</span>
            : <button onClick={coupling.onCouple} title="wieder an Global koppeln (spiegelt Global)"
                style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#f7fafc', color: '#718096', cursor: 'pointer' }}>🔗 koppeln</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', height: PV_H }}>
            {/* LINKS · Schritt 1 (Mittelschieber) — nur bei voller Editierbarkeit */}
            <div style={{ position: 'relative', width: full ? 22 : 6, height: PV_H }}>
              {full && (
                <div
                  onPointerDown={onLeftDown} onPointerMove={onLeftMove} onPointerUp={onLeftUp}
                  title="ziehen: Feld zur Mitte wählen"
                  style={{ position: 'absolute', left: 0, right: 1, top: `calc(${(1 - (leftDrag ?? 0.5)) * 100}% - 7px)`, height: 14, display: 'flex', alignItems: 'center', cursor: 'ns-resize', touchAction: 'none' }}
                >
                  <div style={{ flex: 1, height: leftDragging.current ? 3 : 2, background: '#1a365d', borderRadius: 1 }} />
                </div>
              )}
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
          <span style={{ fontSize: 8.5, color: '#a0aec0' }}>{full ? 'Mitte · Grenzen' : 'Grenzen'}</span>
          <button onClick={resetEven} title={onReset ? 'auf den Default der nächsthöheren Instanz zurücksetzen' : 'gleichverteilen'} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#f7fafc', color: '#718096', cursor: 'pointer' }}>↺ {resetLabel ?? 'zurücksetzen'}</button>
        </div>

        <div style={{ width: 118 }}>
          <div style={{ fontSize: 8.5, color: '#a0aec0', marginBottom: 2 }}>↑ oben = Last 1</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {order.map((i) => {
              const isMid = s.middleField === i;
              return (
                <div
                  key={i}
                  draggable={full}
                  onDragStart={() => { if (full) dndIdx.current = i; }}
                  onDragOver={(e) => { if (full) e.preventDefault(); }}
                  onDrop={() => { if (full && dndIdx.current != null) reorder(dndIdx.current, i); dndIdx.current = null; }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px', borderRadius: 4, cursor: full ? 'grab' : 'default', background: isMid ? '#ebf8ff' : '#fff', border: '1px solid ' + (isMid ? '#bee3f8' : '#edf2f7') }}
                >
                  {full && <span style={{ color: '#cbd5e0', fontSize: 12, cursor: 'grab' }}>⠿</span>}
                  <input type="color" value={toHex(s.stops[i])} disabled={!full} onChange={(e) => setStop(i, e.target.value)} style={{ width: 28, height: 22, border: 'none', background: 'none', cursor: full ? 'pointer' : 'default' }} />
                  {isMid && <span style={{ fontSize: 9, color: '#2b6cb0' }}>Mitte</span>}
                  {full && n > 2 && (
                    <button onClick={() => removeStop(i)} style={{ marginLeft: 'auto', fontSize: 12, border: 'none', background: 'none', color: '#a0aec0', cursor: 'pointer' }}>×</button>
                  )}
                </div>
              );
            })}
            {full && n < 6 && (
              <button onClick={addStop} style={{ marginTop: 2, alignSelf: 'flex-start', width: 28, height: 26, borderRadius: 4, border: '1px dashed #cbd5e0', background: '#f7fafc', color: '#4a5568', cursor: 'pointer', fontSize: 16 }}>+</button>
            )}
          </div>
          <div style={{ fontSize: 8.5, color: '#a0aec0', marginTop: 2 }}>↓ unten = Last 0</div>
        </div>
      </div>
    </div>
  );
}

// ── Kaskade: Säulen, Keys, Rollen-Maske ───────────────────────────────────────
type Col = 'rep_editor' | 'reg_editor' | 'representation' | 'region' | 'global';

const TITLE: Record<Col, string> = {
  rep_editor: 'Rep-Editor-Rep', reg_editor: 'Reg-Editor-Reg',
  representation: 'Representation', region: 'Region', global: 'Global',
};
const COL_EDITABLE: Record<Col, 'full' | 'borders'> = {
  rep_editor: 'borders', reg_editor: 'borders', representation: 'full', region: 'full', global: 'full',
};
// „Zurücksetzen" adoptiert den Default der nächsthöheren Instanz (nicht gleichverteilen).
// Editor-Säulen ← Operator-Default; Operator Region/Representation ← Global; Global = Root.
const COL_PARENT: Record<Col, Col | null> = {
  rep_editor: 'representation', reg_editor: 'region',
  representation: 'global', region: 'global', global: null,
};

const coupleKey = (k: string) => `scim3_couple_${k || 'default'}`;
const loadCoupled = (k: string) => { try { return localStorage.getItem(coupleKey(k)) === '1'; } catch { return false; } };
const saveCoupled = (k: string, v: boolean) => { try { localStorage.setItem(coupleKey(k), v ? '1' : '0'); } catch { /* */ } };

const GLOBAL_KEY = '__global__';

// Sicht je activeMode: welche Säulen, welche abgedimmt.
function viewColumns(activeMode: Role): { col: Col; dimmed: boolean }[] {
  if (activeMode === 'regio_editor') return [
    { col: 'rep_editor', dimmed: false }, { col: 'reg_editor', dimmed: false },
    { col: 'representation', dimmed: true }, { col: 'region', dimmed: true },
  ];
  // operator + analyst: voller Master-Blick (Editor-Säulen als abgedimmte Ursprungs-Geister)
  return [
    { col: 'rep_editor', dimmed: true }, { col: 'reg_editor', dimmed: true },
    { col: 'representation', dimmed: false }, { col: 'region', dimmed: false }, { col: 'global', dimmed: false },
  ];
}

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
  const mode = useModeSwitch();
  const activeMode: Role = mode?.activeMode ?? 'operator';   // Sicht (Tab)
  const realRole: Role = mode?.real ?? 'operator';           // Login (Effekt-Gate)
  // Tab live nur, wenn das echte Login den Tab besitzt — und Review ist immer Sandbox.
  const tabLive = realRole === activeMode && activeMode !== 'analyst';

  const KEY: Record<Col, string> = {
    rep_editor: `__rep_editor__${regionSlug || 'default'}`,
    reg_editor: `__reg_editor__${regionSlug || 'default'}`,
    representation: `__rep__${regionSlug || 'default'}`,
    region: regionSlug || 'default',
    global: GLOBAL_KEY,
  };

  // Eine uncustomisierte Säule startet von der aktuellen Region (kohärenter Start).
  const seed = useCallback((k: string) => isColourCustomized(k) ? loadColourSettings(k) : loadColourSettings(regionSlug), [regionSlug]);
  const loadAll = useCallback((): Record<Col, ColourSettings> => ({
    rep_editor: seed(KEY.rep_editor), reg_editor: seed(KEY.reg_editor),
    representation: seed(KEY.representation), region: loadColourSettings(regionSlug), global: seed(GLOBAL_KEY),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [regionSlug, seed]);

  const [vals, setVals] = useState<Record<Col, ColourSettings>>(loadAll);
  const [regionCoupled, setRegionCoupled] = useState<boolean>(() => loadCoupled(KEY.region));
  const [repCoupled, setRepCoupled] = useState<boolean>(() => loadCoupled(KEY.representation));

  useEffect(() => {
    setVals(loadAll());
    setRegionCoupled(loadCoupled(KEY.region));
    setRepCoupled(loadCoupled(KEY.representation));
    if (!isColourCustomized(GLOBAL_KEY)) saveColourSettings(GLOBAL_KEY, loadColourSettings(regionSlug));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionSlug]);

  // Live-Pipeline-Sync: andere Schreiber der Region-Settings spiegeln.
  useEffect(() => {
    const onEvt = (e: Event) => {
      const d = (e as CustomEvent).detail as { regionSlug?: string; settings?: ColourSettings } | undefined;
      if (!d || d.regionSlug !== (regionSlug || 'default') || !d.settings) return;
      setVals((p) => ({ ...p, region: d.settings! }));
    };
    window.addEventListener(COLOUR_SETTINGS_EVENT, onEvt);
    return () => window.removeEventListener(COLOUR_SETTINGS_EVENT, onEvt);
  }, [regionSlug]);

  // Änderung an Säule `col`. persist = live (sonst Sandbox = nur lokaler State).
  const change = useCallback((col: Col, patch: Partial<ColourSettings>, persist: boolean) => {
    setVals((p) => ({ ...p, [col]: { ...p[col], ...patch } }));
    if (!persist) return;
    const next = { ...loadColourSettings(KEY[col]), ...patch };
    saveColourSettings(KEY[col], next);
    // Editieren von Region/Representation → entkoppelt.
    if (col === 'region' && loadCoupled(KEY.region)) { saveCoupled(KEY.region, false); setRegionCoupled(false); }
    if (col === 'representation' && loadCoupled(KEY.representation)) { saveCoupled(KEY.representation, false); setRepCoupled(false); }
    // Global ändern → in gekoppelte Kinder durchschreiben (Write-through).
    if (col === 'global') {
      if (loadCoupled(KEY.region)) { saveColourSettings(KEY.region, next); setVals((p) => ({ ...p, region: next })); }
      if (loadCoupled(KEY.representation)) { saveColourSettings(KEY.representation, next); setVals((p) => ({ ...p, representation: next })); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionSlug]);

  // Zurücksetzen: Default der nächsthöheren Instanz übernehmen (Global = gleichverteilen).
  const resetCol = (col: Col, live: boolean) => {
    const p = COL_PARENT[col];
    if (!p) { change(col, { borders: evenBorders(vals[col].stops.length), middleField: null }, live); return; }
    const par = vals[p];
    change(col, { stops: par.stops.slice(), borders: par.borders.slice(), middleField: par.middleField }, live);
  };

  const coupleTo = (col: 'region' | 'representation') => {
    const g = loadColourSettings(GLOBAL_KEY);
    saveColourSettings(KEY[col], g); setVals((p) => ({ ...p, [col]: g }));
    saveCoupled(KEY[col], true);
    if (col === 'region') setRegionCoupled(true); else setRepCoupled(true);
  };

  const cols = viewColumns(activeMode);

  // Wrap + Abdimm = Operator-only; in regio_editor-Sicht ausgeblendet.
  const showWrapAbdimm = activeMode !== 'regio_editor';
  const wrapLive = tabLive && activeMode === 'operator';
  const region = vals.region;
  const vj = region.verjuengung;
  const setVj = (p: Partial<typeof vj>) => change('region', { verjuengung: { ...vj, ...p } }, wrapLive);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <AnthemCycleBadge />
        {!tabLive && activeMode !== 'operator' && (
          <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#a0aec0', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 6px' }}>
            {activeMode === 'analyst' ? 'Review · Sandbox (folgenlos)' : 'Vorschau · Sandbox (folgenlos)'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 6 }}>
        {cols.map(({ col, dimmed }) => {
          const live = tabLive && !dimmed;
          const coupling = (!dimmed && live && (col === 'region' || col === 'representation'))
            ? { coupled: col === 'region' ? regionCoupled : repCoupled, onCouple: () => coupleTo(col) }
            : undefined;
          return (
            <ThresholdColumn
              key={col}
              title={TITLE[col]}
              settings={vals[col]}
              dimmed={dimmed}
              editable={COL_EDITABLE[col]}
              coupling={coupling}
              onChange={(patch) => change(col, patch, live)}
              onReset={() => resetCol(col, live)}
              resetLabel={COL_PARENT[col] ? 'auf Default' : 'gleichverteilen'}
            />
          );
        })}
      </div>

      {showWrapAbdimm && (
        <>
          <div style={{ marginTop: 18, borderTop: '1px solid #edf2f7', paddingTop: 12, opacity: wrapLive ? 1 : 0.7 }}>
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

          <div style={{ marginTop: 18, borderTop: '1px solid #edf2f7', paddingTop: 12, opacity: wrapLive ? 1 : 0.7 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 4 }}>Abdimm-Schwelle <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· Mesh · überlastete Strecken entdrängen</span></div>
            <label style={{ fontSize: 11, color: '#4a5568', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <input type="checkbox" checked={region.degradier != null} onChange={(e) => change('region', { degradier: e.target.checked ? 0.6 : null }, wrapLive)} /> aktiv
            </label>
            {region.degradier != null && (
              <input type="range" min={0} max={1} step={0.01} value={region.degradier} onChange={(e) => change('region', { degradier: parseFloat(e.target.value) }, wrapLive)} style={{ width: 200, accentColor: '#2b6cb0' }} />
            )}
          </div>
        </>
      )}
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
