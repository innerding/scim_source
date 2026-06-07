// shell-run — das geteilte Info-Modal (eine Quelle) + ein kleiner ⓘ-Badge, der in
// jedem Shell-bauenden Panel/Tab sitzt. Pendant zu AnthemCycleInfo. Inhalt kommt
// aus sensus/shellRun.ts. Linear (Strecke) statt zyklisch (Pulse).
import { useEffect, useState } from 'react';
import type { TabId } from './panelRegistry';
import { useWorkspaceNav } from './workspaceNav';
import { useRole } from './RoleContext';
import {
  SHELL_RUN_STEPS, SHELL_RUN_INTRO, KIND_META, STATION_STATUS_META,
  LADE_KASKADE, LADE_KASKADE_MVP,
} from '../sensus/shellRun';

export function ShellRunBadge({ compact = false }: { compact?: boolean }) {
  const role = useRole();
  const [open, setOpen] = useState(false);
  if (role !== 'operator') return null;   // i-Pill operator-only (Sub-Komposit gesperrt)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="shell-run — Funktionen, Reihenfolge, Art & Status der linearen Shell-Strecke"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
          fontSize: compact ? 10.5 : 11, fontFamily: 'system-ui, sans-serif',
          padding: compact ? '1px 7px' : '2px 9px', borderRadius: 999,
          border: '1px solid #d6bcfa', background: '#faf5ff', color: '#6b46c1',
        }}
      >
        <span aria-hidden>ⓘ</span> shell-run
      </button>
      {open && <ShellRunModal onClose={() => setOpen(false)} />}
    </>
  );
}

function ShellRunModal({ onClose }: { onClose: () => void }) {
  const { goStation, activeId, activeTab } = useWorkspaceNav();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const jump = (panelId?: string, tabId?: string) => {
    if (!panelId) return;
    goStation(panelId, tabId as TabId | undefined);
    onClose();
  };
  const isHere = (panelId?: string, tabId?: string) =>
    !!panelId && panelId === activeId && (!tabId || tabId === activeTab);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,35,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12, maxWidth: 760, width: '100%', maxHeight: '88vh',
          overflowY: 'auto', boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
          fontFamily: 'system-ui, sans-serif', padding: '20px 22px',
        }}
      >
        {/* Kopf */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#44337a' }}>ⓘ shell-run</div>
          <button onClick={onClose} style={{
            cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f7fafc', borderRadius: 6,
            fontSize: 12, padding: '3px 9px', color: '#4a5568',
          }}>schließen ✕</button>
        </div>

        {/* Was ist shell-run */}
        <p style={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.6, margin: '0 0 14px' }}>{SHELL_RUN_INTRO}</p>

        {/* Legende: Art + Status */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, color: '#718096', marginBottom: 10 }}>
          {(Object.keys(KIND_META) as (keyof typeof KIND_META)[]).map((k) => (
            <span key={k}><span style={{ color: KIND_META[k].color, fontWeight: 700 }}>{KIND_META[k].icon}</span> {KIND_META[k].label}</span>
          ))}
          <span style={{ color: '#cbd5e0' }}>|</span>
          {(['done', 'partial', 'open'] as const).map((s) => (
            <span key={s}><span style={{ color: STATION_STATUS_META[s].color, fontWeight: 700 }}>{STATION_STATUS_META[s].icon}</span> {STATION_STATUS_META[s].label}</span>
          ))}
        </div>

        {/* Lineare Kette */}
        <div style={{ fontSize: 11.5, fontFamily: 'ui-monospace, Menlo, monospace', color: '#4a5568', background: '#faf5ff', border: '1px solid #e9d8fd', borderRadius: 8, padding: '9px 11px', marginBottom: 16, lineHeight: 1.9 }}>
          {SHELL_RUN_STEPS.map((st, i) => (
            <span key={st.n}>
              <span
                onClick={() => jump(st.panelId, st.tabId)}
                style={{ color: STATION_STATUS_META[st.status].color, fontWeight: 700, cursor: st.panelId ? 'pointer' : 'default' }}
              >{st.word}</span>
              {i < SHELL_RUN_STEPS.length - 1 ? <span style={{ color: '#cbd5e0' }}> ▸ </span> : <span style={{ color: '#b83280' }}> ⏩</span>}
            </span>
          ))}
        </div>

        {/* Strecken-Checkliste */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          {SHELL_RUN_STEPS.map((st) => {
            const meta = STATION_STATUS_META[st.status];
            const kind = KIND_META[st.kind];
            const here = isHere(st.panelId, st.tabId);
            const clickable = !!st.panelId;
            return (
              <div
                key={st.n}
                onClick={() => jump(st.panelId, st.tabId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 11px',
                  borderTop: st.n === 1 ? 'none' : '1px solid #edf2f7',
                  background: here ? '#faf5ff' : '#fff',
                  cursor: clickable ? 'pointer' : 'default',
                }}
              >
                <span style={{ color: meta.color, fontWeight: 800, width: 14, textAlign: 'center' }}>{meta.icon}</span>
                <span style={{ color: kind.color, fontWeight: 700, width: 16, textAlign: 'center' }} title={kind.label}>{kind.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2d3748', minWidth: 120 }}>{st.word}</span>
                <span style={{ fontSize: 11.5, color: '#4a5568', flex: 1 }}>{st.title}</span>
                <span style={{ fontSize: 10.5, color: '#a0aec0', fontFamily: 'ui-monospace, Menlo, monospace' }}>
                  {st.home}{here ? ' · du bist hier' : clickable ? ' ›' : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Je Schritt: Funktion in Sätzen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          {SHELL_RUN_STEPS.map((st) => {
            const meta = STATION_STATUS_META[st.status];
            const kind = KIND_META[st.kind];
            return (
              <div key={st.n} style={{ display: 'flex', gap: 10 }}>
                <span style={{ color: meta.color, fontWeight: 800, width: 14, textAlign: 'center', flexShrink: 0 }}>{meta.icon}</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#2d3748' }}>
                    {st.n}. {st.title}{' '}
                    <span style={{ color: kind.color, fontWeight: 600 }}>{kind.icon} {kind.label}</span>
                    {st.panelId && (
                      <button onClick={() => jump(st.panelId, st.tabId)} style={{
                        marginLeft: 8, cursor: 'pointer', fontSize: 10, padding: '0 7px', borderRadius: 999,
                        border: '1px solid #d6bcfa', background: '#faf5ff', color: '#6b46c1',
                      }}>öffnen ›</button>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.55, marginTop: 2 }}>{st.blurb}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lade-Kaskade (Lade-Ende) */}
        <div style={{ borderTop: '2px solid #e9d8fd', paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#44337a', marginBottom: 4 }}>Lade-Kaskade <span style={{ fontWeight: 500, color: '#a0aec0', fontSize: 11 }}>· Lade-Ende (Spiegel zur Deploy-Reihenfolge)</span></div>
          <p style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.55, margin: '0 0 8px' }}>
            Was die Shell auf dem Gerät der Reihe nach lädt, um das Upload-Erlebnis zu machen — getrieben vom Lade-Kaskade-Treiber. Dieselbe Sequenz wie die Deploy-Reihenfolge, nur am Konsum-Ende.
          </p>
          <div style={{ fontSize: 11.5, fontFamily: 'ui-monospace, Menlo, monospace', color: '#4a5568', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 11px', lineHeight: 1.7 }}>
            {LADE_KASKADE.map((s) => (
              <div key={s.n} style={{ opacity: s.mvpOut ? 0.55 : 1 }}>
                <strong>{s.n} · {s.word}</strong> — {s.note}{s.mvpOut ? '  [entfällt im MVP]' : ''}
              </div>
            ))}
            <div style={{ marginTop: 6, color: '#c05621' }}>{LADE_KASKADE_MVP}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
