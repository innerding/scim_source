import { useState } from 'react';
import type { RouteModelState } from '../../route-model/routeModel.types';
import type { RouteLayerModelState, ScoreClassStyle } from '../../route-layer-model/routeLayerModel.types';

interface Props {
  routeModel?: RouteModelState;
  routeLayerModel?: RouteLayerModelState;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: '#4a5568',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '14px 0 6px', borderBottom: '1px solid #e2e8f0', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function ThresholdSlider({
  label, value, min = 0, max = 1, step = 0.01,
  helpText, warningIf, onChange,
}: {
  label: string; value: number; min?: number; max?: number; step?: number;
  helpText?: string; warningIf?: (v: number) => string | null;
  onChange: (v: number) => void;
}) {
  const warning = warningIf?.(value);
  const color = warning ? '#dd6b20' : '#0074d9';

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: '#2d3748' }}>{label}</label>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color, fontWeight: 600 }}>
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: color }}
      />
      {helpText && <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>{helpText}</div>}
      {warning && (
        <div style={{
          fontSize: 11, color: '#c05621', background: '#fffaf0',
          border: '1px solid #fbd38d', borderRadius: 4, padding: '3px 8px', marginTop: 4,
        }}>
          △ {warning}
        </div>
      )}
    </div>
  );
}

// ─── Score class style row ────────────────────────────────────────────────────

const CLASS_LABELS: Record<string, string> = {
  green:   'Ruhig (green)',
  yellow:  'Mäßig (yellow)',
  orange:  'Belastet (orange)',
  red:     'Stark belastet (red)',
  blocked: 'Gesperrt (blocked)',
  unknown: 'Unbekannt',
};

function StyleRow({
  style, onChange,
}: {
  style: ScoreClassStyle;
  onChange: (s: ScoreClassStyle) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px', borderRadius: 5, marginBottom: 5,
      background: '#f7fafc', border: '1px solid #e2e8f0',
    }}>
      {/* Color swatch */}
      <div style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        background: style.color, border: '1px solid rgba(0,0,0,0.12)',
      }} />

      {/* Label */}
      <span style={{ fontSize: 12, color: '#2d3748', minWidth: 160, flexShrink: 0 }}>
        {CLASS_LABELS[style.score_class] ?? style.score_class}
      </span>

      {/* Opacity slider */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: '#a0aec0' }}>Deckkraft</span>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#4a5568' }}>
            {(style.opacity * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range" min={0} max={1} step={0.05} value={style.opacity}
          onChange={(e) => onChange({ ...style, opacity: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: style.color }}
        />
      </div>

      {/* Weight (line thickness) */}
      <div style={{ width: 80, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: '#a0aec0' }}>Stärke</span>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#4a5568' }}>
            {style.weight}px
          </span>
        </div>
        <input
          type="range" min={1} max={8} step={0.5} value={style.weight}
          onChange={(e) => onChange({ ...style, weight: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: '#718096' }}
        />
      </div>
    </div>
  );
}

// ─── Default styles (used when no pipeline result yet) ────────────────────────

const DEFAULT_STYLES: ScoreClassStyle[] = [
  { score_class: 'green',   color: '#2ecc40', opacity: 0.85, weight: 3 },
  { score_class: 'yellow',  color: '#ffdc00', opacity: 0.85, weight: 3 },
  { score_class: 'orange',  color: '#ff851b', opacity: 0.85, weight: 3.5 },
  { score_class: 'red',     color: '#ff4136', opacity: 0.85, weight: 4 },
  { score_class: 'blocked', color: '#b10dc9', opacity: 0.70, weight: 2, dash_pattern: '4 4' },
];

// ─── Main form ────────────────────────────────────────────────────────────────

export default function P08RouteLayerForm({ routeModel, routeLayerModel }: Props) {
  const initDegrade = routeModel?.route_degrade_threshold ?? 0.65;
  const initExclude = routeModel?.route_exclude_threshold ?? 0.90;
  const initStyles = routeLayerModel?.score_class_styles ?? DEFAULT_STYLES;

  const [degrade, setDegrade] = useState(initDegrade);
  const [exclude, setExclude] = useState(initExclude);
  const [styles, setStyles] = useState<ScoreClassStyle[]>([...initStyles]);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const mark = () => { setDirty(true); setSaved(false); };

  const updateStyle = (idx: number, s: ScoreClassStyle) => {
    setStyles((prev) => prev.map((x, i) => i === idx ? s : x));
    mark();
  };

  const handleReset = () => {
    setDegrade(initDegrade);
    setExclude(initExclude);
    setStyles([...initStyles]);
    setDirty(false);
    setSaved(false);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>

      <div style={{
        background: '#ebf8ff', border: '1px solid #bee3f8',
        borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#2b6cb0', marginBottom: 16,
      }}>
        <strong>semi_auto:</strong> Diese Werte überschreiben die P01-Defaults für
        die Darstellung. Die Pipeline-Berechnung selbst nutzt weiterhin P01/P02-Werte.
      </div>

      {/* Score thresholds */}
      <SectionTitle>Score-Schwellenwerte</SectionTitle>

      <ThresholdSlider
        label="Degradier-Schwelle"
        value={degrade}
        helpText="Kanten mit Score ≥ diesem Wert werden orange/rot dargestellt"
        warningIf={(v) =>
          v >= exclude ? 'Degradier-Schwelle muss kleiner sein als Ausschluss-Schwelle' : null
        }
        onChange={(v) => { setDegrade(v); mark(); }}
      />

      <ThresholdSlider
        label="Ausschluss-Schwelle"
        value={exclude}
        helpText="Kanten mit Score ≥ diesem Wert werden ausgeblendet (blocked)"
        warningIf={(v) =>
          v <= degrade ? 'Ausschluss-Schwelle muss größer sein als Degradier-Schwelle' : null
        }
        onChange={(v) => { setExclude(v); mark(); }}
      />

      {/* Visual preview of threshold zones */}
      <div style={{ marginBottom: 16, position: 'relative', height: 24 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${degrade * 100}%`, background: 'linear-gradient(to right, #2ecc40, #ffdc00)' }} />
          <div style={{ width: `${(exclude - degrade) * 100}%`, background: 'linear-gradient(to right, #ff851b, #ff4136)' }} />
          <div style={{ flex: 1, background: '#b10dc9', opacity: 0.7 }} />
        </div>
        <div style={{
          position: 'absolute', left: `${degrade * 100}%`, top: 0, bottom: 0,
          width: 2, background: '#2d3748',
        }} />
        <div style={{
          position: 'absolute', left: `${exclude * 100}%`, top: 0, bottom: 0,
          width: 2, background: '#2d3748',
        }} />
        <div style={{
          position: 'absolute', bottom: -16, left: `${degrade * 100}%`,
          transform: 'translateX(-50%)',
          fontSize: 9, fontFamily: 'monospace', color: '#4a5568',
        }}>
          {degrade.toFixed(2)}
        </div>
        <div style={{
          position: 'absolute', bottom: -16, left: `${exclude * 100}%`,
          transform: 'translateX(-50%)',
          fontSize: 9, fontFamily: 'monospace', color: '#4a5568',
        }}>
          {exclude.toFixed(2)}
        </div>
      </div>
      <div style={{ height: 20 }} />

      {/* Layer styles */}
      <SectionTitle>Layer-Darstellung</SectionTitle>
      <div style={{ fontSize: 11, color: '#a0aec0', marginBottom: 8 }}>
        Deckkraft und Linienstärke pro Score-Klasse.
      </div>
      {styles.map((s, i) => (
        <StyleRow key={s.score_class} style={s} onChange={(ns) => updateStyle(i, ns)} />
      ))}

      {/* Button bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0',
      }}>
        <button
          onClick={() => { setSaved(true); setDirty(false); }}
          disabled={!dirty}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 600,
            background: dirty ? '#0074d9' : '#e2e8f0',
            color: dirty ? '#fff' : '#a0aec0',
            border: 'none', borderRadius: 5, cursor: dirty ? 'pointer' : 'default',
          }}
        >
          Übernehmen
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '8px 16px', fontSize: 12, background: 'transparent',
            color: '#718096', border: '1px solid #cbd5e0', borderRadius: 5, cursor: 'pointer',
          }}
        >
          Zurücksetzen
        </button>
        {saved && <span style={{ fontSize: 12, color: '#38a169' }}>✓ Übernommen (SML-2: kein persistenter State)</span>}
        {dirty && !saved && <span style={{ fontSize: 11, color: '#dd6b20' }}>● Nicht übernommen</span>}
      </div>
    </div>
  );
}
