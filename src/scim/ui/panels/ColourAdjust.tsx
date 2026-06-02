// Adjust-Inhalt der Farb-Stationen P01/P02/P04 (Umbauplan B2). Jede Station
// zeigt den DURCHGEHENDEN colorize-Gradienten (§2a) als Live-Vorschau/Legende +
// ihre Regler mit Beschreibung; Schwellen erscheinen als aufgesetzte Marker,
// nie als Schnitt. Persistiert pro Region via colourSettings.

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { loadColourSettings, saveColourSettings, type ColourSettings } from '../../sensus/colourSettings';
import { useInspectorView } from '../../../runtime/repContext';
import { slugify } from '../../../runtime/router';
import { ColourGradientBar, type GradientMarker } from './ColourGradientBar';

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

const PANEL_TITLE: Record<string, string> = {
  P01: 'Der ehrliche Spiegel',
  P02: 'Die regionale Handschrift',
  P04: 'Das Grund-Spektrum',
};

function Field({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a365d' }}>{title}</div>
      <div style={{ fontSize: 11, color: '#718096', margin: '2px 0 6px', lineHeight: 1.45 }}>{desc}</div>
      {children}
    </div>
  );
}

function Slider({ value, min, max, step = 0.01, onChange, fmt }: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} style={{ flex: 1 }} />
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#4a5568', width: 52, textAlign: 'right' }}>
        {fmt ? fmt(value) : value.toFixed(2)}
      </span>
    </div>
  );
}

export default function ColourAdjust({ panelId }: { panelId: string }) {
  const view = useInspectorView();
  const regionSlug = slugify(view?.geometry?.region ?? '') || 'default';
  const [s, setS] = useState<ColourSettings>(() => loadColourSettings(regionSlug));
  useEffect(() => { setS(loadColourSettings(regionSlug)); }, [regionSlug]);

  const update = (patch: Partial<ColourSettings>) => {
    setS((prev) => { const next = { ...prev, ...patch }; saveColourSettings(regionSlug, next); return next; });
  };

  // Vorschau-Palette = Spektrum + (Bias + Safety). spread/floor wirken auf die
  // Last-Verteilung (live), nicht auf die statische 0..1-Skala → als Marker/Note.
  const effBias = clamp(s.bias + s.safety, -1, 1);
  const markers: GradientMarker[] = [];
  if (panelId === 'P01' && s.floor > 0) markers.push({ at: s.floor, label: 'Mindest-Rot', color: '#fbb6ce' });
  if (panelId === 'P02' && s.degradier != null) markers.push({ at: s.degradier, label: 'Degradier', color: '#e2e8f0' });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 440 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>{PANEL_TITLE[panelId] ?? 'Farbe'}</div>
      <div style={{ fontSize: 10.5, color: '#a0aec0', margin: '2px 0 10px' }}>
        Region „{regionSlug}" · durchgehender Gradient, Schwellen als Marker (§2a)
      </div>
      <div style={{ marginBottom: 16 }}>
        <ColourGradientBar spectrum={s.spectrum} bias={effBias} markers={markers} />
      </div>

      {panelId === 'P04' && (
        <Field title="Spektrum-Charakter" desc="Wie früh die Last ins Heiße kippt — ruhig (spät) ↔ aggressiv (früh). Das Grund-Farbschema der Region.">
          <Slider value={s.spectrum} min={0} max={1} onChange={(v) => update({ spectrum: v })}
            fmt={(v) => (v < 0.34 ? 'ruhig' : v > 0.66 ? 'aggressiv' : 'linear')} />
        </Field>
      )}

      {panelId === 'P02' && (
        <>
          <Field title="Tendenz-Bias" desc="Verschiebt den Gesamteindruck der Region kühler (grün) oder heißer (rot).">
            <Slider value={s.bias} min={-1} max={1} onChange={(v) => update({ bias: v })}
              fmt={(v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2))} />
          </Field>
          <Field title="Safety-Default" desc="Zusätzliche Aggressivität, solange keine Gesperren setzbar sind — vorsichtshalber heißer.">
            <Slider value={s.safety} min={0} max={1} onChange={(v) => update({ safety: v })} />
          </Field>
          <Field title="Degradier-Schwelle" desc="Ab dieser Ø-Last einer Strecke werden Routen/POIs visuell entdrängt (behalten Farbe). Operator-seitig.">
            <label style={{ fontSize: 11, color: '#4a5568', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <input type="checkbox" checked={s.degradier != null}
                onChange={(e) => update({ degradier: e.target.checked ? 0.6 : null })} /> aktiv
            </label>
            {s.degradier != null && (
              <Slider value={s.degradier} min={0} max={1} onChange={(v) => update({ degradier: v })} />
            )}
          </Field>
        </>
      )}

      {panelId === 'P01' && (
        <>
          <Field title="Normalisierung (Spreizung)" desc="Spannt den Verlauf über den eigenen Bereich — nicht alles rot/blau, Reps vergleichbar (relativ statt absolut).">
            <Slider value={s.spread} min={0} max={1} onChange={(v) => update({ spread: v })}
              fmt={(v) => (v < 0.05 ? 'absolut' : v > 0.95 ? 'relativ' : v.toFixed(2))} />
          </Field>
          <Field title="Mindest-Rot-Floor" desc="Hat das Netz Last, erreicht der Peak mindestens diesen Wert — etwas Rot ist immer da. Ein ruhiges Netz bleibt kalt.">
            <Slider value={s.floor} min={0} max={1} onChange={(v) => update({ floor: v })} />
          </Field>
        </>
      )}
    </div>
  );
}
