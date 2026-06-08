// Operator-Pathworks — der Operator PRODUZIERT keine Representation (das tut er,
// wenn überhaupt, in der Editor-Rolle). Sein Panel handelt nur: EINREICHUNGEN
// (zum Committen) + COMMITTETE Representations. Kein Bau-Werkzeug.
//
// (Der Nation→Region→Rep-Baum ist hier noch flach — kommt mit dem Operator-Index.)
import { useMemo, useState } from 'react';
import { useRole, useModeSwitch, useUserName } from '../RoleContext';
import { actorFrom, repsForActor, withdrawRep, setRepPlacement, knownPlacements } from '../../pathworks/localStore';
import { commitDraftToRepo, isDraftCommittable, type CommitDraftResult } from '../../pathworks/commitDraft';
import { getDraft } from '../../workspace/draftStore';
import { useDeliveredVersions, type Delivered } from '../../../runtime/useDelivered';
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
  // Phase 1: „ausgeliefert vM" je committeter Rep (Origin-Bundle in R2). Graceful.
  const delivered = useDeliveredVersions(committed.map((r) => r.id));

  const placements = useMemo(() => knownPlacements(), []);
  const onCommit = async (rep: RepView) => {
    const d = getDraft(rep.id);
    if (!d) return;
    setBusyId(rep.id); setMsg(null);
    const today = new Date().toISOString().slice(0, 10);
    // Verortung (Editor gesetzt, Operator bis hier änderbar) wandert in die Geometrie.
    const res = await commitDraftToRepo(d, today, { nation: rep.nationLabel, region: rep.regionLabel });
    setBusyId(null); setMsg(res);
    if (res.ok) setTick((t) => t + 1);   // Draft ist weg → aus den Einreichungen raus
  };
  const onReturn = (rep: RepView) => {
    if (withdrawRep(rep.id, actorFrom(userName, activeMode))) setTick((t) => t + 1);
  };
  const onPlace = (rep: RepView, nation: string, region: string) => {
    setRepPlacement(rep.id, nation, region);
    setTick((t) => t + 1);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      <datalist id="pw-op-nations">{placements.nations.map((n) => <option key={n} value={n} />)}</datalist>
      <datalist id="pw-op-regions">{placements.regions.map((r) => <option key={r} value={r} />)}</datalist>
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
                {/* Verortung — bis zum Commit änderbar (Operator-Hoheit). */}
                {(() => {
                  const nationVal = rep.nationLabel ?? '';
                  const regionVal = rep.regionLabel && rep.regionLabel !== '—' ? rep.regionLabel : '';
                  return live ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 10.5, color: '#718096', whiteSpace: 'nowrap' }}>gehört zu:</span>
                      <input list="pw-op-nations" placeholder="Nation" value={nationVal}
                        onChange={(e) => onPlace(rep, e.target.value, regionVal)}
                        style={{ flex: 1, fontSize: 11.5, padding: '4px 8px', borderRadius: 5, border: '1px solid #cbd5e0' }} />
                      <input list="pw-op-regions" placeholder="Region" value={regionVal}
                        onChange={(e) => onPlace(rep, nationVal, e.target.value)}
                        style={{ flex: 1, fontSize: 11.5, padding: '4px 8px', borderRadius: 5, border: '1px solid #cbd5e0' }} />
                    </div>
                  ) : (
                    <div style={{ fontSize: 10.5, color: '#718096' }}>gehört zu: {nationVal || '—'} · {regionVal || '—'}</div>
                  );
                })()}
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

      {/* Committete Representations — Nation → Region → Rep (Akkordeon) */}
      <SectionTitle label="Committete Representations" count={committed.length} hint="Nation → Region → Rep. Eingefroren & versioniert." />
      {committed.length === 0 ? (
        <Empty text="Noch keine committete Representation." />
      ) : (
        <RepTree reps={committed} delivered={delivered} />
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

// ─── Nation → Region → Rep (Akkordeon) ──────────────────────────────────────
interface RegionNode { region: string; reps: RepView[]; }
interface NationNode { nation: string; regions: RegionNode[]; }

function buildTree(reps: RepView[]): NationNode[] {
  const byNation = new Map<string, Map<string, RepView[]>>();
  for (const r of reps) {
    const nation = r.nationLabel || '— ohne Nation';
    const region = r.regionLabel || '— ohne Region';
    if (!byNation.has(nation)) byNation.set(nation, new Map());
    const byRegion = byNation.get(nation)!;
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region)!.push(r);
  }
  return [...byNation.entries()].map(([nation, byRegion]) => ({
    nation,
    regions: [...byRegion.entries()].map(([region, rs]) => ({ region, reps: rs })),
  }));
}

const committedBadge: React.CSSProperties = {
  fontSize: 9.5, fontFamily: 'monospace', padding: '1px 7px', borderRadius: 999,
  border: '1px solid #9ae6b4', background: '#f0fff4', color: '#22543d', fontWeight: 700,
};

function VersionLine({ rep, delivered }: { rep: RepView; delivered?: Delivered }) {
  // Quell-Version (committet) vs. Auslieferungs-Version (in R2). Diff = liegt daneben.
  const src = rep.currentVersion;
  const dvRaw = delivered?.version ?? null;
  const dvNum = typeof dvRaw === 'number' ? dvRaw : (typeof dvRaw === 'string' ? parseInt(dvRaw.replace(/^v/i, ''), 10) : NaN);
  const out = delivered?.published && dvRaw != null ? `v${dvRaw}` : '—';
  const behind = delivered?.published && Number.isFinite(dvNum) && src > dvNum;
  const ahead = !delivered?.published; // committet, aber nichts ausgeliefert
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontFamily: 'monospace' }}>
      <span style={{ color: '#4a5568' }}>Quelle <strong>v{src}</strong></span>
      <span style={{ color: '#cbd5e0' }}>·</span>
      <span style={{ color: out === '—' ? '#a0aec0' : '#276749' }}>ausgeliefert <strong>{out}</strong></span>
      {(behind || ahead) && (
        <span style={{
          padding: '0 6px', borderRadius: 999, border: '1px solid #fbd38d',
          background: '#fffaf0', color: '#c05621', fontWeight: 700,
        }}>{ahead ? 'nicht ausgeliefert' : `${src - dvNum} ungeliefert`}</span>
      )}
    </div>
  );
}

function CommittedRow({ rep, delivered }: { rep: RepView; delivered?: Delivered }) {
  return (
    <div style={{
      border: '1px solid #9ae6b4', background: '#f0fff4', borderRadius: 8, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      {repHead(rep, <span style={committedBadge}>committet v{rep.currentVersion}</span>)}
      {partRow(rep)}
      <VersionLine rep={rep} delivered={delivered} />
    </div>
  );
}

function Caret({ label, count, open, onClick, level }: {
  label: string; count: number; open: boolean; onClick: () => void; level: 0 | 1;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7, width: '100%', textAlign: 'left',
      cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: 6,
      background: level === 0 ? '#edf2f7' : '#f7fafc', padding: '6px 10px', fontFamily: 'system-ui, sans-serif',
    }}>
      <span style={{ fontSize: 10, color: '#718096', width: 10 }}>{open ? '▾' : '▸'}</span>
      <span style={{ fontSize: level === 0 ? 12.5 : 12, fontWeight: 700, color: '#2d3748' }}>{level === 0 ? '🏳 ' : '◎ '}{label}</span>
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#a0aec0' }}>{count}</span>
    </button>
  );
}

function BindingGroup({ label, reps, delivered }: { label: string; reps: RepView[]; delivered: Record<string, Delivered> }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {reps.map((rep) => <CommittedRow key={rep.id} rep={rep} delivered={delivered[rep.id]} />)}
      </div>
    </div>
  );
}

function RepTree({ reps, delivered }: { reps: RepView[]; delivered: Record<string, Delivered> }) {
  const tree = useMemo(() => buildTree(reps), [reps]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const open = (k: string) => !collapsed.has(k);
  const toggle = (k: string) => setCollapsed((s) => {
    const n = new Set(s);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {tree.map((nat) => {
        const nk = `n:${nat.nation}`;
        const repCount = nat.regions.reduce((s, r) => s + r.reps.length, 0);
        return (
          <div key={nk}>
            <Caret label={nat.nation} count={repCount} open={open(nk)} onClick={() => toggle(nk)} level={0} />
            {open(nk) && (
              <div style={{ marginLeft: 14, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {nat.regions.map((reg) => {
                  const rk = `${nk}/r:${reg.region}`;
                  const regional = reg.reps.filter((x) => x.binding === 'regional');
                  const unbound = reg.reps.filter((x) => x.binding === 'unbound');
                  return (
                    <div key={rk}>
                      <Caret label={reg.region} count={reg.reps.length} open={open(rk)} onClick={() => toggle(rk)} level={1} />
                      {open(rk) && (
                        <div style={{ marginLeft: 14, marginTop: 5, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {regional.length > 0 && <BindingGroup label="regional gebunden" reps={regional} delivered={delivered} />}
                          {unbound.length > 0 && <BindingGroup label="ohne regionale Bindung" reps={unbound} delivered={delivered} />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  fontSize: 11, padding: '5px 12px', borderRadius: 5, border: '1px solid #cbd5e0',
  background: '#fff', color: '#4a5568', cursor: 'pointer', fontWeight: 600,
};
