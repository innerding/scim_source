import { useState } from 'react';
import type { SignalInterpretationState } from '../../signal-interpretation/signalInterpretation.types';

interface Props {
  state?: SignalInterpretationState;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: '#4a5568',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '16px 0 6px',
      borderBottom: '1px solid #e2e8f0',
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function ThresholdSlider({
  label, value, min, max, step, onChange, helpText,
}: {
  label: string; value: number; min: number; max: number;
  step: number; onChange: (v: number) => void; helpText?: string;
}) {
  const [inputVal, setInputVal] = useState(String(value));

  const commit = (raw: string) => {
    const n = parseFloat(raw);
    if (!isNaN(n) && n >= min && n <= max) {
      onChange(n);
      setInputVal(String(n));
    } else {
      setInputVal(String(value));
    }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <label style={{ fontSize: 12, color: '#2d3748', fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: 10, color: '#a0aec0', fontFamily: 'monospace' }}>
          {min}–{max}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => { onChange(parseFloat(e.target.value)); setInputVal(e.target.value); }}
          style={{ flex: 1, accentColor: '#0074d9' }}
        />
        <input
          type="number"
          min={min} max={max} step={step}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
          style={{
            width: 60, padding: '3px 6px', fontSize: 12, fontFamily: 'monospace',
            border: '1px solid #cbd5e0', borderRadius: 4, textAlign: 'right',
            color: '#2d3748', background: '#fff',
          }}
        />
      </div>
      {helpText && (
        <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>{helpText}</div>
      )}
    </div>
  );
}

// ─── Visualisierung der drei Zonen ───────────────────────────────────────────

function ThresholdBand({
  minFlow, maxAcc,
}: { minFlow: number; maxAcc: number }) {
  // Darstellung des Durchsatz-Achse 0..1 mit den drei Zonen
  const accEnd   = Math.min(maxAcc, 1) * 100;
  const flowStart = Math.min(minFlow, 1) * 100;
  const ambW = Math.max(0, flowStart - accEnd);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: '#718096', marginBottom: 6 }}>
        Durchsatz-Achse (0 → 1): Klassifikationszonen
      </div>
      <div style={{ position: 'relative', height: 28, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
        {/* accumulation zone */}
        <div style={{
          width: `${accEnd}%`, background: '#fed7d7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#c53030', fontWeight: 600, minWidth: accEnd > 5 ? 0 : undefined,
        }}>
          {accEnd > 8 ? 'Aufenthalt' : ''}
        </div>
        {/* ambiguous zone */}
        <div style={{
          width: `${ambW}%`, background: '#fefcbf',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#975a16', fontWeight: 600,
        }}>
          {ambW > 8 ? 'Ambig.' : ''}
        </div>
        {/* flow zone */}
        <div style={{
          flex: 1, background: '#c6f6d5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#276749', fontWeight: 600,
        }}>
          {(100 - flowStart) > 8 ? 'Flow' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#a0aec0', marginTop: 2 }}>
        <span>0</span>
        <span style={{ position: 'absolute', left: `${accEnd}%`, fontSize: 10, color: '#c53030' }}>
          {maxAcc.toFixed(2)}
        </span>
        <span style={{ position: 'absolute', left: `${flowStart}%`, fontSize: 10, color: '#276749' }}>
          {minFlow.toFixed(2)}
        </span>
        <span>1</span>
      </div>
    </div>
  );
}

// ─── Hauptformular ────────────────────────────────────────────────────────────

const DEFAULTS = {
  min_throughput_for_flow: 0.60,
  max_throughput_for_accumulation: 0.30,
  min_density_for_accumulation: 0.50,
};

export default function P06SignalInterpretationForm({ state }: Props) {
  const active = state?.thresholds ?? DEFAULTS;

  const [thresholds, setThresholds] = useState({ ...active });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof thresholds, v: number) => {
    setThresholds((t) => ({ ...t, [k]: v }));
    setDirty(true);
    setSaved(false);
  };

  const overlap = thresholds.max_throughput_for_accumulation >= thresholds.min_throughput_for_flow;
  const noAmbiguous = thresholds.max_throughput_for_accumulation >= thresholds.min_throughput_for_flow - 0.01;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 520 }}>

      {/* Status */}
      <div style={{
        padding: '8px 12px', borderRadius: 6, marginBottom: 14,
        background: state ? '#f0fff4' : '#f7fafc',
        border: `1px solid ${state ? '#9ae6b4' : '#e2e8f0'}`,
        fontSize: 12, color: state ? '#276749' : '#718096',
      }}>
        {state
          ? <>✓ Letzter Lauf: <code style={{ fontSize: 11 }}>{state.interpretation_id}</code> —{' '}
              {state.classified_points.length} Punkte klassifiziert</>
          : 'Noch kein Pipeline-Lauf — Schwellenwerte gelten beim nächsten Ausführen.'}
      </div>

      {/* Threshold band visualization */}
      <SectionTitle>Klassifikationszonen (Durchsatz)</SectionTitle>
      <div style={{ position: 'relative', marginBottom: 4 }}>
        <ThresholdBand
          minFlow={thresholds.min_throughput_for_flow}
          maxAcc={thresholds.max_throughput_for_accumulation}
        />
      </div>

      {/* Overlap warning */}
      {overlap && (
        <div style={{
          fontSize: 11, color: '#c53030', padding: '6px 10px',
          background: '#fff5f5', border: '1px solid #fed7d7',
          borderRadius: 4, marginBottom: 10,
        }}>
          ⚠ Überlappung: max_accumulation ({thresholds.max_throughput_for_accumulation.toFixed(2)}) ≥ min_flow ({thresholds.min_throughput_for_flow.toFixed(2)}) — keine ambigue Zone, Aufenthalt überschreibt Flow.
        </div>
      )}

      {/* Threshold sliders */}
      <SectionTitle>Schwellenwerte</SectionTitle>

      <ThresholdSlider
        label="Min. Durchsatz für Flow-Klassifikation"
        value={thresholds.min_throughput_for_flow}
        min={0.1} max={1.0} step={0.05}
        helpText="Signalpunkte mit Durchsatz ≥ diesem Wert → flow"
        onChange={(v) => set('min_throughput_for_flow', v)}
      />
      <ThresholdSlider
        label="Max. Durchsatz für Aufenthalts-Klassifikation"
        value={thresholds.max_throughput_for_accumulation}
        min={0.0} max={0.9} step={0.05}
        helpText="Signalpunkte mit Durchsatz ≤ diesem Wert (und Dichte ≥ min) → accumulation"
        onChange={(v) => set('max_throughput_for_accumulation', v)}
      />
      <ThresholdSlider
        label="Min. Gerätedichte für Aufenthalts-Klassifikation"
        value={thresholds.min_density_for_accumulation}
        min={0.0} max={1.0} step={0.05}
        helpText="Mindestdichte-Score zusätzlich zum Durchsatz-Kriterium"
        onChange={(v) => set('min_density_for_accumulation', v)}
      />

      {/* Active-values readout (from last run) */}
      {state && (
        <>
          <SectionTitle>Beim letzten Lauf verwendet</SectionTitle>
          {(['min_throughput_for_flow', 'max_throughput_for_accumulation', 'min_density_for_accumulation'] as const).map((k) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, padding: '4px 0', color: '#4a5568',
            }}>
              <span style={{ color: '#718096' }}>{k}</span>
              <span style={{ fontFamily: 'monospace' }}>{state.thresholds[k]}</span>
            </div>
          ))}
        </>
      )}

      {/* Info box */}
      <div style={{
        fontSize: 11, color: '#718096', padding: '8px 12px',
        background: '#f7fafc', border: '1px solid #e2e8f0',
        borderRadius: 4, marginTop: 14, lineHeight: 1.5,
      }}>
        <strong>Ambigue Zone:</strong> Signalpunkte zwischen max_accumulation und min_flow
        {noAmbiguous
          ? ' — derzeit kein Spielraum (Schwellenwerte überlappen oder berühren sich).'
          : ` — Durchsatz ${thresholds.max_throughput_for_accumulation.toFixed(2)}–${thresholds.min_throughput_for_flow.toFixed(2)} → ambiguous.`}
      </div>

      {/* Button bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 20, paddingTop: 14, borderTop: '1px solid #e2e8f0',
      }}>
        <button
          onClick={() => { console.log('P06 Schwellenwerte:', thresholds); setSaved(true); setDirty(false); }}
          disabled={!dirty || overlap}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 600,
            background: dirty && !overlap ? '#0074d9' : '#e2e8f0',
            color: dirty && !overlap ? '#fff' : '#a0aec0',
            border: 'none', borderRadius: 5,
            cursor: dirty && !overlap ? 'pointer' : 'default',
          }}
        >
          Übernehmen
        </button>
        <button
          onClick={() => { setThresholds({ ...active }); setDirty(false); setSaved(false); }}
          style={{
            padding: '8px 16px', fontSize: 12,
            background: 'transparent', color: '#718096',
            border: '1px solid #cbd5e0', borderRadius: 5, cursor: 'pointer',
          }}
        >
          Zurücksetzen
        </button>
        {saved && <span style={{ fontSize: 12, color: '#38a169' }}>✓ Übernommen (nächster Pipeline-Lauf)</span>}
        {dirty && !saved && <span style={{ fontSize: 11, color: '#dd6b20' }}>● Ungespeichert</span>}
      </div>
    </div>
  );
}
