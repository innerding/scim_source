// Anthem-Kreislauf — das geteilte Info-Modal (eine Quelle) + ein kleiner ⓘ-Knopf,
// der in jedem beteiligten Panel/Tab sitzt. Statt dass jeder Tab eine ähnliche
// Beschreibung trägt, verweist er hierher. Inhalt kommt aus sensus/anthemCycle.ts.
//
// Schnelle Rückkehr ohne einfahrendes Drawer: weil der ⓘ-Knopf in JEDER Station
// sitzt, ist nach einem Station-Sprung das Modal wieder einen Klick entfernt — und
// es markiert „du bist hier".
import { useEffect, useState } from 'react';
import type { TabId } from './panelRegistry';
import { useWorkspaceNav } from './workspaceNav';
import { ANTHEM_STATIONS, ANTHEM_INTRO, STATION_STATUS_META } from '../sensus/anthemCycle';

export function AnthemCycleBadge({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Anthem-Kreislauf — Stationen, Funktion & Status"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
          fontSize: compact ? 10.5 : 11, fontFamily: 'system-ui, sans-serif',
          padding: compact ? '1px 7px' : '2px 9px', borderRadius: 999,
          border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0',
        }}
      >
        <span aria-hidden>ⓘ</span> Anthem-Kreislauf
      </button>
      {open && <AnthemCycleModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AnthemCycleModal({ onClose }: { onClose: () => void }) {
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
          background: '#fff', borderRadius: 12, maxWidth: 720, width: '100%', maxHeight: '88vh',
          overflowY: 'auto', boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
          fontFamily: 'system-ui, sans-serif', padding: '20px 22px',
        }}
      >
        {/* Kopf */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a365d' }}>ⓘ Anthem-Kreislauf</div>
          <button onClick={onClose} style={{
            cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f7fafc', borderRadius: 6,
            fontSize: 12, padding: '3px 9px', color: '#4a5568',
          }}>schließen ✕</button>
        </div>

        {/* Was ist der Anthem-Kreislauf */}
        <p style={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.6, margin: '0 0 14px' }}>{ANTHEM_INTRO}</p>

        {/* Legende */}
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#718096', marginBottom: 10 }}>
          {(['done', 'partial', 'open'] as const).map((s) => (
            <span key={s}><span style={{ color: STATION_STATUS_META[s].color, fontWeight: 700 }}>{STATION_STATUS_META[s].icon}</span> {STATION_STATUS_META[s].label}</span>
          ))}
        </div>

        {/* Stationen-Checkliste */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          {ANTHEM_STATIONS.map((st) => {
            const meta = STATION_STATUS_META[st.status];
            const here = isHere(st.panelId, st.tabId);
            const clickable = !!st.panelId;
            return (
              <div
                key={st.n}
                onClick={() => jump(st.panelId, st.tabId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 11px',
                  borderTop: st.n === 1 ? 'none' : '1px solid #edf2f7',
                  background: here ? '#ebf8ff' : '#fff',
                  cursor: clickable ? 'pointer' : 'default',
                }}
              >
                <span style={{ color: meta.color, fontWeight: 800, width: 14, textAlign: 'center' }}>{meta.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2d3748', minWidth: 96 }}>{st.word}</span>
                <span style={{ fontSize: 11.5, color: '#4a5568', flex: 1 }}>{st.title}</span>
                <span style={{ fontSize: 10.5, color: '#a0aec0', fontFamily: 'ui-monospace, Menlo, monospace' }}>
                  {st.home}{here ? ' · du bist hier' : clickable ? ' ›' : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Lineare Kette */}
        <div style={{ fontSize: 11.5, fontFamily: 'ui-monospace, Menlo, monospace', color: '#4a5568', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 11px', marginBottom: 16, lineHeight: 1.9 }}>
          {ANTHEM_STATIONS.map((st, i) => (
            <span key={st.n}>
              <span
                onClick={() => jump(st.panelId, st.tabId)}
                style={{ color: STATION_STATUS_META[st.status].color, fontWeight: 700, cursor: st.panelId ? 'pointer' : 'default' }}
              >{st.word}</span>
              {i < ANTHEM_STATIONS.length - 1 ? <span style={{ color: '#cbd5e0' }}> ▸ </span> : <span style={{ color: '#cbd5e0' }}> ↻</span>}
            </span>
          ))}
        </div>

        {/* Je Station: Funktion in Sätzen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ANTHEM_STATIONS.map((st) => {
            const meta = STATION_STATUS_META[st.status];
            return (
              <div key={st.n} style={{ display: 'flex', gap: 10 }}>
                <span style={{ color: meta.color, fontWeight: 800, width: 14, textAlign: 'center', flexShrink: 0 }}>{meta.icon}</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#2d3748' }}>
                    {st.n}. {st.title} <span style={{ color: '#a0aec0', fontWeight: 500 }}>· {st.word}</span>
                    {st.panelId && (
                      <button onClick={() => jump(st.panelId, st.tabId)} style={{
                        marginLeft: 8, cursor: 'pointer', fontSize: 10, padding: '0 7px', borderRadius: 999,
                        border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0',
                      }}>öffnen ›</button>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.55, marginTop: 2 }}>{st.blurb}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
