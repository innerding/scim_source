// P06 Simulation-Tab — Szenario-basierter Synthetik-Signal-Generator.
// Vorher: Teil von P04 TelcoLoad. Nach der Trennung (Mai 2026, siehe ann_064)
// hier zu Hause, weil die Simulation den Klassifikator (P06) testet, nicht
// den Real-Signal-Eingang (P04).
//
// Die Werte werden lokal manipuliert (Sandbox); ein Pipeline-Neustart waere
// noetig, damit die Engine die simulierten Werte tatsaechlich verarbeitet
// (analog zum frueheren P04-Verhalten — Persistenz folgt in SML-4).

import { useState } from 'react';
import type { TelcoLoadState } from '../../telco-load/telcoLoad.types';
import { mockTelcoLoadState } from '../../telco-load/telcoLoad.mock';

interface Props {
  state?: TelcoLoadState;
}

// ─── Scenario-Definitionen ────────────────────────────────────────────────────

interface Scenario {
  id: string;
  label: string;
  description: string;
  icon: string;
  baseScores: {
    normalized_load_score: number;
    density_score: number;
    movement_ratio: number;
    stillness_ratio: number;
    confidence_score: number;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: 'off_season',
    label: 'Nebensaison',
    icon: '🌿',
    description: 'Wenig Betrieb, kaum Bewegung. Typisch: Herbst/Winter außerhalb von Feiertagen.',
    baseScores: {
      normalized_load_score: 0.18,
      density_score: 0.22,
      movement_ratio: 0.60,
      stillness_ratio: 0.40,
      confidence_score: 0.75,
    },
  },
  {
    id: 'normal',
    label: 'Normalbetrieb',
    icon: '☀️',
    description: 'Durchschnittlicher Sommertag. Basis-Kalibrierung für Schwellenwerte.',
    baseScores: {
      normalized_load_score: 0.52,
      density_score: 0.58,
      movement_ratio: 0.72,
      stillness_ratio: 0.28,
      confidence_score: 0.85,
    },
  },
  {
    id: 'peak',
    label: 'Spitzenlast',
    icon: '🔥',
    description: 'Schönes Wochenende in der Hochsaison. Prüft ob Degradierungs-Schwellen greifen.',
    baseScores: {
      normalized_load_score: 0.78,
      density_score: 0.82,
      movement_ratio: 0.80,
      stillness_ratio: 0.20,
      confidence_score: 0.90,
    },
  },
  {
    id: 'event',
    label: 'Veranstaltung',
    icon: '🎉',
    description: 'Großveranstaltung (Rennen, Festival). Hohe Dichte, viel Stillstand an POIs.',
    baseScores: {
      normalized_load_score: 0.91,
      density_score: 0.95,
      movement_ratio: 0.35,
      stillness_ratio: 0.65,
      confidence_score: 0.88,
    },
  },
];

// ─── Hilfskomponenten ─────────────────────────────────────────────────────────

function ScoreBar({ value, color = '#0074d9' }: { value: number; color?: string }) {
  return (
    <div style={{
      height: 6, borderRadius: 3, background: '#edf2f7',
      overflow: 'hidden', flex: 1,
    }}>
      <div style={{
        height: '100%', width: `${Math.min(value * 100, 100)}%`,
        background: color, borderRadius: 3, transition: 'width 0.3s ease',
      }} />
    </div>
  );
}

function scoreColor(v: number): string {
  if (v < 0.4) return '#2ecc40';
  if (v < 0.65) return '#ffdc00';
  if (v < 0.80) return '#ff851b';
  return '#ff4136';
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: '#4a5568',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '16px 0 6px', borderBottom: '1px solid #e2e8f0', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

// ─── Szenario-Anwendung ───────────────────────────────────────────────────────

function applyScenario(scenario: Scenario, intensity: number, base: TelcoLoadState): TelcoLoadState {
  // intensity 0..1 skaliert jeden Score linear um die Szenario-Basis:
  // 0 = 50% der Basis, 1 = 150% der Basis, 0.5 = Basis selbst
  const scale = 0.5 + intensity;
  const clamp = (v: number) => Math.min(Math.max(v, 0), 1);

  const bs = scenario.baseScores;
  const movRatio = clamp(bs.movement_ratio * scale);
  const stillRatio = clamp(1 - movRatio);
  const loadScore = clamp(bs.normalized_load_score * scale);
  const densScore = clamp(bs.density_score * scale);

  return {
    ...base,
    source: 'mock',
    load_signals: base.load_signals.map((sg) => ({
      ...sg,
      metrics: {
        ...sg.metrics,
        normalized_load_score: Number(
          sg.signal_type === 'stillness_indicator'
            ? clamp(loadScore * 1.1).toFixed(2)
            : loadScore.toFixed(2)
        ),
        density_score: Number(densScore.toFixed(2)),
        movement_ratio: Number(
          sg.signal_type === 'stillness_indicator'
            ? clamp(bs.movement_ratio * 0.5 * scale).toFixed(2)
            : movRatio.toFixed(2)
        ),
        stillness_ratio: Number(
          sg.signal_type === 'stillness_indicator'
            ? clamp(bs.stillness_ratio * 1.3 * scale).toFixed(2)
            : stillRatio.toFixed(2)
        ),
        confidence_score: Number(clamp(bs.confidence_score).toFixed(2)),
      },
    })),
    signal_quality: {
      ...base.signal_quality,
      overall_quality:
        loadScore > 0.85 ? 'medium' :
        loadScore > 0.60 ? 'high' : 'high',
    },
  };
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function P06SimulationForm({ state }: Props) {
  const base = state ?? mockTelcoLoadState;
  const [activeScenario, setActiveScenario] = useState<string>('normal');
  const [intensity, setIntensity] = useState<number>(0.5);
  const [_simState, setSimState] = useState<TelcoLoadState>(base);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const scenario = SCENARIOS.find((s) => s.id === activeScenario) ?? SCENARIOS[1];
  const simulated = applyScenario(scenario, intensity, base);

  const handleSelect = (id: string) => {
    setActiveScenario(id);
    const s = SCENARIOS.find((sc) => sc.id === id) ?? SCENARIOS[1];
    setSimState(applyScenario(s, intensity, base));
    setDirty(true);
    setSaved(false);
  };

  const handleIntensity = (v: number) => {
    setIntensity(v);
    setSimState(applyScenario(scenario, v, base));
    setDirty(true);
    setSaved(false);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 580 }}>

      {/* Header */}
      <div style={{
        padding: '8px 12px', borderRadius: 6, marginBottom: 14,
        background: '#fffbeb', border: '1px solid #f6e05e',
        fontSize: 12, color: '#975a16',
      }}>
        Sandbox für die Pattern-Klassifikation: synthetische Telco-Lastwerte
        erzeugen, ohne reale Quelle. Speist den Klassifikator (P06) zum Testen.
      </div>

      {/* Scenario cards */}
      <SectionTitle>Szenario</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {SCENARIOS.map((s) => {
          const active = s.id === activeScenario;
          return (
            <div
              key={s.id}
              onClick={() => handleSelect(s.id)}
              style={{
                padding: '10px 14px', borderRadius: 7, cursor: 'pointer',
                background: active ? '#ebf8ff' : '#f7fafc',
                border: `2px solid ${active ? '#0074d9' : '#e2e8f0'}`,
                transition: 'all 0.12s',
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: active ? '#2b6cb0' : '#2d3748' }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: '#718096', marginTop: 2, lineHeight: 1.4 }}>
                {s.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Intensity slider */}
      <SectionTitle>Globale Intensität</SectionTitle>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: '#718096' }}>Skaliert alle Signal-Scores des Szenarios</span>
          <span style={{ fontFamily: 'monospace', color: '#2d3748', fontWeight: 600 }}>
            {intensity < 0.25 ? '× 0.5 — sehr gering' :
             intensity < 0.45 ? '× 0.75 — gering' :
             intensity < 0.55 ? '× 1.0 — Szenario-Basis' :
             intensity < 0.75 ? '× 1.25 — erhöht' :
             '× 1.5 — maximal'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#a0aec0', width: 48 }}>gering</span>
          <input
            type="range" min={0} max={1} step={0.01} value={intensity}
            onChange={(e) => handleIntensity(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#0074d9' }}
          />
          <span style={{ fontSize: 11, color: '#a0aec0', width: 48, textAlign: 'right' }}>maximal</span>
        </div>
      </div>

      {/* Signal preview */}
      <SectionTitle>Signal-Vorschau ({simulated.load_signals.length} Gruppen)</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {simulated.load_signals.map((sg) => {
          const load = sg.metrics.normalized_load_score ?? 0;
          const mov = sg.metrics.movement_ratio ?? 0;
          const still = sg.metrics.stillness_ratio ?? 0;
          const col = scoreColor(load);
          return (
            <div key={sg.signal_group_id} style={{
              background: '#f7fafc', border: '1px solid #e2e8f0',
              borderLeft: `3px solid ${col}`,
              borderRadius: 6, padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#2d3748', fontFamily: 'monospace' }}>
                  {sg.signal_group_id}
                </span>
                <span style={{ fontSize: 11, color: '#718096' }}>
                  {sg.signal_type.replace(/_/g, ' ')} · {sg.aggregation_unit.replace(/_/g, ' ')}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ color: '#718096', width: 130, flexShrink: 0 }}>Belastungs-Score</span>
                  <ScoreBar value={load} color={col} />
                  <span style={{ fontFamily: 'monospace', color: col, width: 36, textAlign: 'right', fontWeight: 600 }}>
                    {load.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ color: '#718096', width: 130, flexShrink: 0 }}>Bewegung</span>
                  <ScoreBar value={mov} color="#4299e1" />
                  <span style={{ fontFamily: 'monospace', color: '#4a5568', width: 36, textAlign: 'right' }}>
                    {Math.round(mov * 100)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ color: '#718096', width: 130, flexShrink: 0 }}>Stillstand</span>
                  <ScoreBar value={still} color="#9f7aea" />
                  <span style={{ fontFamily: 'monospace', color: '#4a5568', width: 36, textAlign: 'right' }}>
                    {Math.round(still * 100)}%
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 2, fontSize: 10, color: '#a0aec0', fontFamily: 'monospace' }}>
                  <span>Signale: {sg.metrics.signal_count}</span>
                  <span>Geräte: {sg.metrics.distinct_device_count ?? '—'}</span>
                  <span>Konfidenz: {((sg.metrics.confidence_score ?? 0) * 100).toFixed(0)}%</span>
                  {sg.approximate_center && (
                    <span>
                      [{sg.approximate_center.coordinates[1].toFixed(3)}, {sg.approximate_center.coordinates[0].toFixed(3)}]
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Button bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0',
      }}>
        <button
          onClick={() => {
            setSaved(true);
            setDirty(false);
            // Transmitter-Pulse: Tetraeder-Bogensegmente rotieren kurz in
            // Input-Stellung (siehe ann_066). Sichtbares Feedback, dass das
            // Sandbox-Signal angenommen wurde.
            window.dispatchEvent(
              new CustomEvent('scim:transmitter:pulse', { detail: { duration: 1500 } }),
            );
          }}
          disabled={!dirty}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 600,
            background: dirty ? '#0074d9' : '#e2e8f0',
            color: dirty ? '#fff' : '#a0aec0',
            border: 'none', borderRadius: 5, cursor: dirty ? 'pointer' : 'default',
          }}
        >
          In Klassifikator schieben
        </button>
        {saved && (
          <span style={{ fontSize: 12, color: '#38a169' }}>
            ✓ Sandbox-Lauf vorgemerkt (SML-2: Pipeline-Neustart nötig für Wirkung)
          </span>
        )}
        {dirty && !saved && (
          <span style={{ fontSize: 11, color: '#dd6b20' }}>● Nicht übernommen</span>
        )}
      </div>
    </div>
  );
}
