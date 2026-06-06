// P01 · Thresholds — Skalen-Modell, gespeist aus dem EINEN shell-kit/scale.
// Die Oberfläche ist eine Kopie dieses Modells.
//
// Blöcke:
//   1. Skalen-Form: Vorschau-Säule (Last → Farbe, wie Mesh) + drei ZARTE Schieber.
//      Mitte = globaler Pivot: frei ziehen → mit „Check" übernehmen → justiert sich ein.
//      oben/unten = Anteil ihrer Hälfte (relativ zur Mitte), wirken live.
//   2. Farbsorten (horizontal): 2–6 Farb-Stops.
//   3. Wrap (nur Comfort-Button): subjektiv. Fasst das Mesh NIE an.
//
// Schreibt die colourSettings-Felder. Wirkung auf Mesh/Comfort = Stufe 4/5.

import { useCallback, useEffect, useState } from 'react';
import { loadColourSettings, saveColourSettings, COLOUR_SETTINGS_EVENT, type ColourSettings } from '../../sensus/colourSettings';
import { useInspectorView } from '../../../runtime/repContext';
import { slugify } from '../../../runtime/router';
import { colorAt, type ScaleSpec } from 'shell-kit';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

// ── zarter vertikaler Slider (rotierter Range — robust cross-browser) ──────────
function VSlider({ label, value, onChange, accent = '#2b6cb0' }: {
  label: string; value: number; onChange: (v: number) => void; accent?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 48 }}>
      <div style={{ width: 28, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input type="range" min={0} max={1} step={0.01} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ width: 150, transform: 'rotate(-90deg)', accentColor: accent }} />
      </div>
      <span style={{ fontSize: 9, color: '#4a5568', fontFamily: 'ui-monospace, Menlo, monospace' }}>{value.toFixed(2)}</span>
      <span style={{ fontSize: 9.5, color: '#1a365d', textAlign: 'center', lineHeight: 1.15 }}>{label}</span>
    </div>
  );
}

// ── Vorschau-Säule (read-only): Last-Achse, Farbe = colorAt (= Mesh-Sicht) ─────
function Preview({ spec, mitte }: { spec: ScaleSpec; mitte: number }) {
  const N = 56;
  return (
    <div style={{ position: 'relative', width: 38, height: 170, borderRadius: 4, overflow: 'hidden', border: '1px solid #cbd5e0' }}>
      {Array.from({ length: N }, (_, i) => {
        const load = (N - 1 - i) / (N - 1);
        return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(i / N) * 100}%`, height: `${100 / N + 0.6}%`, background: colorAt(load, spec) }} />;
      })}
      {/* Mitte-Marke (zeigt den Pivot der Vorschau) */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: `${(1 - mitte) * 100}%`, height: 0, borderTop: '1px dashed rgba(255,255,255,0.9)', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.4)' }} />
    </div>
  );
}

export default function ThresholdsView() {
  const view = useInspectorView();
  const regionSlug = slugify(view?.geometry?.region ?? '') || 'default';
  const [s, setS] = useState<ColourSettings>(() => loadColourSettings(regionSlug));
  const [mitteDraft, setMitteDraft] = useState(s.spreizung.mitte);

  useEffect(() => {
    const next = loadColourSettings(regionSlug);
    setS(next); setMitteDraft(next.spreizung.mitte);
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
      setS(d.settings); setMitteDraft(d.settings.spreizung.mitte);
    };
    window.addEventListener(COLOUR_SETTINGS_EVENT, onEvt);
    return () => window.removeEventListener(COLOUR_SETTINGS_EVENT, onEvt);
  }, [regionSlug]);

  const sp = s.spreizung, vj = s.verjuengung;
  const setSp = (p: Partial<typeof sp>) => update({ spreizung: { ...sp, ...p } });
  const setVj = (p: Partial<typeof vj>) => update({ verjuengung: { ...vj, ...p } });

  // Vorschau folgt dem (noch nicht bestätigten) Mitte-Entwurf live.
  const spec: ScaleSpec = { stops: s.stops, spreizung: { ...sp, mitte: mitteDraft }, verjuengung: vj };
  const mitteDirty = Math.abs(mitteDraft - sp.mitte) > 0.001;
  const commitMitte = () => setSp({ mitte: mitteDraft });

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

      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a365d', marginBottom: 2 }}>
        Skalen-Form <span style={{ fontWeight: 400, fontSize: 10.5, color: '#a0aec0' }}>· Ansicht, auf der sich die Last verteilt (Mesh + Comfort)</span>
      </div>
      <div style={{ fontSize: 10, color: '#718096', marginBottom: 10, maxWidth: 380 }}>
        <strong>Mitte</strong> = globale Mitte: frei ziehen, dann <strong>„Check"</strong> übernimmt sie.
        <strong> oben/unten</strong> = Mitte ihres Teils (relativ), wirken sofort.
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Vorschau-Säule */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 4 }}>
          <Preview spec={spec} mitte={mitteDraft} />
          <span style={{ fontSize: 8.5, color: '#a0aec0' }}>Last → Farbe</span>
        </div>

        {/* drei zarte Schieber */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <VSlider label="unten" value={sp.unten} onChange={(v) => setSp({ unten: v })} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <VSlider label="Mitte" value={mitteDraft} onChange={setMitteDraft} accent={mitteDirty ? '#dd6b20' : '#2b6cb0'} />
            <button
              onClick={commitMitte}
              disabled={!mitteDirty}
              style={{
                marginTop: 4, fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: mitteDirty ? 'pointer' : 'default',
                border: '1px solid ' + (mitteDirty ? '#dd6b20' : '#e2e8f0'),
                background: mitteDirty ? '#dd6b20' : '#f7fafc', color: mitteDirty ? '#fff' : '#a0aec0',
              }}
            >✓ Check</button>
          </div>
          <VSlider label="oben" value={sp.oben} onChange={(v) => setSp({ oben: v })} />
        </div>
      </div>

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
        <div style={{ fontSize: 10, color: '#718096', marginBottom: 8, maxWidth: 380 }}>
          Staucht die Enden der <strong>Comfort-Anzeige</strong>, damit der Schieber nicht „knallt".
          Subjektiv — das <strong>Mesh bleibt objektiv</strong> (jedes 10-m-Segment zeigt die echte Last).
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <VSlider label="unten" value={vj.unten} onChange={(v) => setVj({ unten: v })} accent="#805ad5" />
          <VSlider label="oben" value={vj.oben} onChange={(v) => setVj({ oben: v })} accent="#805ad5" />
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
