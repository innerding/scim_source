import { useState } from 'react';
import type { UserTolerances, PreferredDifficulty } from '../../sensus-core-local/sensusCoreLocal.types';

interface Props {
  enabled?: boolean;
  tolerances?: UserTolerances;
}

const DEFAULT_TOLERANCES: UserTolerances = {
  route_load_tolerance: 0.7,
  preferred_difficulty: 'any',
  prefer_quiet_pois: false,
  max_acceptable_load_score: 0.9,
};

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

function Toggle({ label, checked, onChange, sub }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; sub?: string;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '8px 10px', borderRadius: 5, marginBottom: 6, cursor: 'pointer',
        background: checked ? '#f0fff4' : '#f7fafc',
        border: `1px solid ${checked ? '#9ae6b4' : '#e2e8f0'}`,
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#2d3748' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0, marginLeft: 12, marginTop: 2,
        background: checked ? '#38a169' : '#cbd5e0', position: 'relative', transition: 'background 0.12s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.12s', boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
        }} />
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, helpText, onChange }: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; helpText?: string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: '#2d3748' }}>{label}</label>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#4a5568' }}>
          {value.toFixed(2)} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#0074d9' }}
      />
      {helpText && <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>{helpText}</div>}
    </div>
  );
}

export default function P10LocalForm({ enabled: initEnabled, tolerances: initTol }: Props) {
  const [enabled, setEnabled] = useState(initEnabled ?? false);
  const [tol, setTol] = useState<UserTolerances>(initTol ?? DEFAULT_TOLERANCES);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const mark = () => { setDirty(true); setSaved(false); };
  const set = <K extends keyof UserTolerances>(k: K, v: UserTolerances[K]) => {
    setTol((p) => ({ ...p, [k]: v }));
    mark();
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 520 }}>

      {/* Activation toggle */}
      <SectionTitle>Aktivierung</SectionTitle>
      <Toggle
        label="Lokalen Nutzer-Kontext erstellen"
        checked={enabled}
        sub="Erstellt eine lokale Kopie mit nutzerspezifischen Toleranzen (optional, kein Pflicht-Schritt)"
        onChange={(v) => { setEnabled(v); mark(); }}
      />

      {/* Tolerances — only shown when enabled */}
      {enabled && (
        <>
          <SectionTitle>Nutzer-Toleranzen</SectionTitle>
          <div style={{
            background: '#fffbeb', border: '1px solid #f6e05e',
            borderRadius: 5, padding: '7px 12px', fontSize: 11, color: '#975a16', marginBottom: 12,
          }}>
            Diese Werte sind nutzerspezifisch — nicht global für die Pipeline.
            Sie beeinflussen nur den lokalen Sensus-Core-Kontext (P10).
          </div>

          <Slider
            label="Routen-Last-Toleranz"
            value={tol.route_load_tolerance}
            min={0} max={1} step={0.05} unit="score"
            helpText="Wie viel Belastung der Nutzer auf einer Route akzeptiert"
            onChange={(v) => set('route_load_tolerance', v)}
          />
          <Slider
            label="Max. akzeptierter Last-Score"
            value={tol.max_acceptable_load_score}
            min={0} max={1} step={0.05} unit="score"
            helpText="Routen über diesem Score werden dem Nutzer nicht vorgeschlagen"
            onChange={(v) => set('max_acceptable_load_score', v)}
          />

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#2d3748', display: 'block', marginBottom: 6 }}>
              Bevorzugte Schwierigkeit
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['easy', 'moderate', 'difficult', 'any'] as PreferredDifficulty[]).map((d) => {
                const active = tol.preferred_difficulty === d;
                const labels: Record<PreferredDifficulty, string> = {
                  easy: 'Leicht', moderate: 'Mittel', difficult: 'Schwer', any: 'Beliebig',
                };
                return (
                  <button
                    key={d}
                    onClick={() => set('preferred_difficulty', d)}
                    style={{
                      padding: '6px 14px', fontSize: 12, borderRadius: 5, cursor: 'pointer',
                      background: active ? '#0074d9' : '#f7fafc',
                      color: active ? '#fff' : '#4a5568',
                      border: `1px solid ${active ? '#0074d9' : '#cbd5e0'}`,
                      fontWeight: active ? 600 : 400,
                      transition: 'all 0.1s',
                    }}
                  >
                    {labels[d]}
                  </button>
                );
              })}
            </div>
          </div>

          <Toggle
            label="Ruhige POIs bevorzugen"
            checked={tol.prefer_quiet_pois}
            sub="Schlägt POIs mit geringer Aufenthaltsbelastung bevorzugt vor"
            onChange={(v) => set('prefer_quiet_pois', v)}
          />
        </>
      )}

      {/* Not enabled state */}
      {!enabled && (
        <div style={{
          background: '#f7fafc', border: '1px solid #e2e8f0',
          borderRadius: 6, padding: '14px 16px', fontSize: 12, color: '#a0aec0',
          textAlign: 'center', marginTop: 8,
        }}>
          Panel deaktiviert — P09 Package wird ohne lokalen Kontext erstellt.
        </div>
      )}

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
          onClick={() => { setEnabled(initEnabled ?? false); setTol(initTol ?? DEFAULT_TOLERANCES); setDirty(false); setSaved(false); }}
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
