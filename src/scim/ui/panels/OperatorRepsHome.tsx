// Operator-Pathworks — der Operator PRODUZIERT keine Representation (das tut er,
// wenn überhaupt, in der Editor-Rolle). Sein Panel handelt nur: EINREICHUNGEN
// (zum Committen) + COMMITTETE Representations. Kein Bau-Werkzeug.
//
// (Der Nation→Region→Rep-Baum ist hier noch flach — kommt mit dem Operator-Index.)
import { useMemo, useState } from 'react';
import { useRole, useModeSwitch, useUserName } from '../RoleContext';
import { actorFrom, repsForActor, withdrawRep } from '../../pathworks/localStore';
import { commitDraftToRepo, isDraftCommittable, type CommitDraftResult } from '../../pathworks/commitDraft';
import { getDraft } from '../../workspace/draftStore';
import type { RepView } from '../../pathworks/pathworks.types';

function PartBadge({ on, label }: { on: boolean; label: string }) {
  return (
    <span style={{
      fontSize: 9.5, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 4,
      border: `1px solid ${on ? '#bee3f8' : '#e2e8f0'}`,
      background: on ? '#ebf8ff' : '#f7fafc', color: on ? '#2b6cb0' : '#a0aec0',
    }}>{on ? '●' : '○'} {label}</span>
  );
}

const partRow = (rep: RepView) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    <PartBadge on={rep.parts.geometry} label="Umriss" />
    <PartBadge on={rep.parts.wegnetz} label="Wegnetz" />
    <PartBadge on={rep.parts.catalog} label="Katalog" />
    <PartBadge on={rep.parts.thresholds} label="Farbe" />
  </div>
);

function repHead(rep: RepView, extra?: React.ReactNode) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1a202c' }}>{rep.name}</span>
      <span style={{
        fontSize: 9.5, fontFamily: 'monospace', padding: '1px 7px', borderRadius: 999,
        border: '1px solid #cbd5e0', background: '#f7fafc', color: '#4a5568',
      }}>{rep.binding === 'regional' ? `◎ ${rep.regionLabel}` : '◍ ohne Bindung'}</span>
      {rep.owner && (
        <span style={{ fontSize: 10, color: '#718096' }}>von <strong style={{ color: '#4a5568' }}>{rep.owner}</strong></span>
      )}
      {extra}
    </div>
  );
}

export default function OperatorRepsHome({ onJumpTo }: { onJumpTo: (panelId: string, targetId?: string) => void }) {
  const role = useRole();
  const mode = useModeSwitch();
  const userName = useUserName();
  const activeMode = mode?.activeMode ?? role;
  const live = (mode?.real ?? role) === activeMode && activeMode !== 'analyst';   // committen nur live (Operator)
  const [tick, setTick] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<CommitDraftResult | null>(null);

  const reps = useMemo(() => repsForActor(actorFrom(userName, activeMode)), [userName, activeMode, tick]);
  const submissions = reps.filter((r) => r.state === 'submitted');
  const committed = reps.filter((r) => r.state === 'committed');

  const onCommit = async (rep: RepView) => {
    const d = getDraft(rep.id);
    if (!d) return;
    setBusyId(rep.id); setMsg(null);
    const today = new Date().toISOString().slice(0, 10);
    const res = await commitDraftToRepo(d, today);
    setBusyId(null); setMsg(res);
    if (res.ok) setTick((t) => t + 1);   // Draft ist weg → aus den Einreichungen raus
  };
  const onReturn = (rep: RepView) => {
    if (withdrawRep(rep.id, actorFrom(userName, activeMode))) setTick((t) => t + 1);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      {/* Einreichungen */}
      <SectionTitle label="Einreichungen" count={submissions.length} hint="Representations, die zur Prüfung & zum Committen eingereicht sind." />
      {submissions.length === 0 ? (
        <Empty text="Keine offenen Einreichungen. Editoren senden ihre Representations hier herein." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {submissions.map((rep) => {
            const d = getDraft(rep.id);
            const committable = !!d && isDraftCommittable(d);
            return (
              <div key={rep.id} style={{
                border: '1px solid #fbd38d', background: '#fffaf0', borderRadius: 8, padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {repHead(rep, (
                  <span style={{
                    fontSize: 9.5, fontFamily: 'monospace', padding: '1px 7px', borderRadius: 999,
                    border: '1px solid #fbd38d', background: '#fffaf0', color: '#c05621', fontWeight: 700,
                  }}>eingereicht</span>
                ))}
                {partRow(rep)}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => onJumpTo('geometry_editor', rep.id)} style={ghostBtn}>ansehen</button>
                  <span style={{ flex: 1 }} />
                  {live && (
                    <button onClick={() => onReturn(rep)} style={{ ...ghostBtn }}>↩ zurückgeben</button>
                  )}
                  {live && (
                    <button
                      onClick={() => onCommit(rep)}
                      disabled={!committable || busyId === rep.id}
                      title={committable ? 'Committen + versiegeln (Boundary + Netz + Representation)' : 'Noch nicht committbar (braucht Boundary + maskiertes Netz)'}
                      style={{
                        fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 5,
                        border: `1px solid ${committable ? '#276749' : '#cbd5e0'}`,
                        background: !committable ? '#edf2f7' : busyId === rep.id ? '#c6f6d5' : '#276749',
                        color: !committable ? '#a0aec0' : busyId === rep.id ? '#22543d' : '#fff',
                        cursor: committable ? 'pointer' : 'not-allowed',
                      }}
                    >{busyId === rep.id ? 'Committe …' : '⬛ Committen'}</button>
                  )}
                  {!live && <span style={{ fontSize: 10.5, color: '#c05621', fontStyle: 'italic' }}>Sandbox</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {msg && (
        <div style={{
          marginBottom: 20, fontSize: 11, lineHeight: 1.5, padding: '8px 10px', borderRadius: 4,
          background: msg.ok ? '#f0fff4' : '#fff5f5',
          border: `1px solid ${msg.ok ? '#9ae6b4' : '#feb2b2'}`,
          color: msg.ok ? '#22543d' : '#742a2a',
        }}>
          {msg.ok ? '✓ ' : '✗ '}{msg.text}
          {msg.url && (<>{' · '}<a href={msg.url} target="_blank" rel="noreferrer" style={{ color: '#276749' }}>Commit ansehen</a></>)}
        </div>
      )}

      {/* Committete Representations */}
      <SectionTitle label="Committete Representations" count={committed.length} hint="Eingefroren & versioniert. (Nation→Region→Rep-Baum folgt.)" />
      {committed.length === 0 ? (
        <Empty text="Noch keine committete Representation." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {committed.map((rep) => (
            <div key={rep.id} style={{
              border: '1px solid #9ae6b4', background: '#f0fff4', borderRadius: 8, padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {repHead(rep, (
                <span style={{
                  fontSize: 9.5, fontFamily: 'monospace', padding: '1px 7px', borderRadius: 999,
                  border: '1px solid #9ae6b4', background: '#f0fff4', color: '#22543d', fontWeight: 700,
                }}>committet v{rep.currentVersion}</span>
              ))}
              {partRow(rep)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ label, count, hint }: { label: string; count: number; hint: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#a0aec0' }}>{count}</span>
      </div>
      <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.4 }}>{hint}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ fontSize: 12, color: '#718096', fontStyle: 'italic', padding: '6px 2px 18px' }}>{text}</div>;
}

const ghostBtn: React.CSSProperties = {
  fontSize: 11, padding: '5px 12px', borderRadius: 5, border: '1px solid #cbd5e0',
  background: '#fff', color: '#4a5568', cursor: 'pointer', fontWeight: 600,
};
