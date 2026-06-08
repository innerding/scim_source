// Operator-Pathworks — der Operator PRODUZIERT keine Representation (das tut er,
// wenn überhaupt, in der Editor-Rolle). Sein Panel handelt nur: EINREICHUNGEN
// (zum Committen) + COMMITTETE Representations. Kein Bau-Werkzeug.
//
// (Der Nation→Region→Rep-Baum ist hier noch flach — kommt mit dem Operator-Index.)
import { useMemo, useState } from 'react';
import { useRole, useModeSwitch, useUserName } from '../RoleContext';
import { actorFrom, repsForActor } from '../../pathworks/localStore';
import { useOriginVersionsMap } from '../../../runtime/useDelivered';
import { type OriginVersions } from '../../../runtime/anthemApi';
import { REPRESENTATIONS } from '../../workspace/workspace.registry';
import { useRepresentationContext } from '../../../runtime/repContext';
import { releaseRep } from '../../sensus/release';
import { anthemPublishConfigured } from '../../../runtime/anthemApi';
import SubmissionsQueue from './SubmissionsQueue';
import type { RepView } from '../../pathworks/pathworks.types';

export interface ReleaseState { busyId: string | null; msg: { id: string; ok: boolean; text: string } | null; canRelease: boolean; onRelease: (rep: RepView) => void; }

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

  const reps = useMemo(() => repsForActor(actorFrom(userName, activeMode)), [userName, activeMode]);
  const committed = reps.filter((r) => r.state === 'committed');
  // Phase 1: „ausgeliefert vM" je committeter Rep (Origin-Bundle in R2). Graceful.
  const [deliveredNonce, setDeliveredNonce] = useState(0);
  const lib = useOriginVersionsMap(committed.map((r) => r.id), deliveredNonce);

  // Phase 2 — RELEASE (Commit ≠ Release): „ausliefern" wählt die Rep als Auftraggeber,
  // löst Phase-0-Resolve auf und publiziert das Bundle nach R2. Danach springt die
  // „ausgeliefert"-Version nach. Manuelles Gate = die Drossel (zeitgetaktet folgt).
  const { setInspectorAsset } = useRepresentationContext();
  const [releaseBusy, setReleaseBusy] = useState<string | null>(null);
  const [releaseMsg, setReleaseMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);
  const onRelease = async (rep: RepView) => {
    const repObj = REPRESENTATIONS.find((r) => r.id === rep.id);
    if (!repObj) return;
    setInspectorAsset({ kind: 'representation', id: rep.id });   // Auftraggeber = genau diese Rep
    setReleaseBusy(rep.id); setReleaseMsg(null);
    const res = await releaseRep(repObj);
    setReleaseMsg({
      id: rep.id, ok: res.ok,
      text: res.ok ? `ausgeliefert v${res.version} · ${((res.bytes ?? 0) / 1024).toFixed(1)} kB` : (res.error ?? 'Fehler'),
    });
    if (res.ok) setDeliveredNonce((n) => n + 1);   // „ausgeliefert" neu holen
    setReleaseBusy(null);
  };
  const release: ReleaseState = { busyId: releaseBusy, msg: releaseMsg, canRelease: live && anthemPublishConfigured(), onRelease };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      {/* Einreichungen — Cross-User über den Server (Phase 3) */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>Einreichungen</div>
        <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.4 }}>Zur Prüfung & zum Committen eingereicht — von jedem Editor-Gerät.</div>
      </div>
      <SubmissionsQueue live={live} onCommitted={() => setDeliveredNonce((n) => n + 1)} />

      {/* Committete Representations — Nation → Region → Rep (Akkordeon) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <SectionTitle label="Committete Representations" count={committed.length} hint="Nation → Region → Rep. Eingefroren & versioniert. »ausliefern« = Release (Commit ≠ Release) — manuelles Gate (Drossel)." />
        </div>
        {(() => {
          const pend = committed.filter((r) => verState(r, lib[r.id]).needsUpload).length;
          return pend > 0 ? (
            <button onClick={() => onJumpTo('V03')} title="Aggregat-Sicht: Release-Drossel (V03)"
              style={{
                fontSize: 10.5, fontWeight: 700, fontFamily: 'monospace', padding: '4px 10px', borderRadius: 999,
                border: '1px solid #fbd38d', background: '#fffaf0', color: '#c05621', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>● {pend} ungeliefert → Drossel</button>
          ) : null;
        })()}
      </div>
      {committed.length === 0 ? (
        <Empty text="Noch keine committete Representation." />
      ) : (
        <RepTree reps={committed} lib={lib} release={release} />
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

// Quelle (committet) · aktiv (live in R2) · latest (hochgeladen). Drei Zustände:
// ungeliefert (Quelle>latest) · gestaged (latest>aktiv, wartet aufs Fenster) · aktuell.
function verState(rep: RepView, v?: OriginVersions) {
  const source = rep.currentVersion;
  const active = v?.active ?? null;
  const latest = (v?.versions ?? []).reduce<number | null>((a, x) => Math.max(a ?? 0, x.version), (v?.versions?.length ? 0 : null));
  const needsUpload = source > (latest ?? 0);
  const staged = latest != null && active != null && latest > active;
  return { source, active, latest, needsUpload, staged };
}

function VersionLine({ rep, v }: { rep: RepView; v?: OriginVersions }) {
  const { source, active, needsUpload, staged, latest } = verState(rep, v);
  const out = active != null ? `v${active}` : '—';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontFamily: 'monospace' }}>
      <span style={{ color: '#4a5568' }}>Quelle <strong>v{source}</strong></span>
      <span style={{ color: '#cbd5e0' }}>·</span>
      <span style={{ color: out === '—' ? '#a0aec0' : '#276749' }}>ausgeliefert <strong>{out}</strong></span>
      {needsUpload ? (
        <span style={{ padding: '0 6px', borderRadius: 999, border: '1px solid #fbd38d', background: '#fffaf0', color: '#c05621', fontWeight: 700 }}>
          {active != null ? `${source - active} ungeliefert` : 'nicht ausgeliefert'}
        </span>
      ) : staged ? (
        <span style={{ padding: '0 6px', borderRadius: 999, border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0', fontWeight: 700 }}>
          ● v{latest} gestaged
        </span>
      ) : null}
    </div>
  );
}

function CommittedRow({ rep, v, release }: { rep: RepView; v?: OriginVersions; release: ReleaseState }) {
  const { source, needsUpload, staged } = verState(rep, v);
  const busy = release.busyId === rep.id;
  const msg = release.msg?.id === rep.id ? release.msg : null;
  return (
    <div style={{
      border: '1px solid #9ae6b4', background: '#f0fff4', borderRadius: 8, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      {repHead(rep, <span style={committedBadge}>committet v{rep.currentVersion}</span>)}
      {partRow(rep)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <VersionLine rep={rep} v={v} />
        <span style={{ flex: 1 }} />
        {release.canRelease && (
          <button
            onClick={() => release.onRelease(rep)}
            disabled={busy || !needsUpload}
            title={needsUpload ? 'Release: dieses Bundle nach R2 ausliefern (bzw. stagen, je Drossel)' : staged ? 'Hochgeladen — wartet aufs Drossel-Fenster' : 'Aktuelle Version ist bereits ausgeliefert'}
            style={{
              fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 5,
              border: `1px solid ${needsUpload ? '#2b6cb0' : '#cbd5e0'}`,
              background: busy ? '#bee3f8' : needsUpload ? '#2b6cb0' : '#edf2f7',
              color: needsUpload ? '#fff' : '#a0aec0', cursor: busy || !needsUpload ? 'default' : 'pointer',
            }}
          >{busy ? '⊕ liefere …' : needsUpload ? `⊕ ausliefern v${source}` : staged ? '✓ gestaged' : '✓ ausgeliefert'}</button>
        )}
      </div>
      {msg && (
        <div style={{ fontSize: 10.5, fontFamily: 'monospace', color: msg.ok ? '#276749' : '#c05621' }}>
          {msg.ok ? '✓ ' : '✗ '}{msg.text}
        </div>
      )}
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

function BindingGroup({ label, reps, lib, release }: { label: string; reps: RepView[]; lib: Record<string, OriginVersions>; release: ReleaseState }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {reps.map((rep) => <CommittedRow key={rep.id} rep={rep} v={lib[rep.id]} release={release} />)}
      </div>
    </div>
  );
}

function RepTree({ reps, lib, release }: { reps: RepView[]; lib: Record<string, OriginVersions>; release: ReleaseState }) {
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
                          {regional.length > 0 && <BindingGroup label="regional gebunden" reps={regional} lib={lib} release={release} />}
                          {unbound.length > 0 && <BindingGroup label="ohne regionale Bindung" reps={unbound} lib={lib} release={release} />}
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

