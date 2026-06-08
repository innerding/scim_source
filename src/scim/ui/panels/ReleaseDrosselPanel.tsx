// V03 · t4 — Release-Drossel: Aggregat-Monitor + die ZEITLICHE Drossel.
// Commit ≠ Release. Policy: manuell (sofort live) oder täglich @ Fenster (UTC) —
// dann STAGT „ausliefern" nur (Upload), und der Worker-Cron schaltet zur
// Fensterzeit live. Zeigt Queue · Policy · gestaged · letzte Auslieferung · Batch.
import { useEffect, useMemo, useState } from 'react';
import { REPRESENTATIONS, geometryById } from '../../workspace/workspace.registry';
import { useOriginVersionsMap } from '../../../runtime/useDelivered';
import {
  anthemPublishConfigured, anthemReadConfigured,
  fetchReleasePolicy, setReleasePolicy, type ReleasePolicy,
} from '../../../runtime/anthemApi';
import { releaseRep } from '../../sensus/release';
import { useRole, useModeSwitch } from '../RoleContext';

interface Row {
  id: string; name: string; region: string;
  source: number; active: number | null; latest: number | null;
  needsUpload: boolean; staged: boolean;
}

export default function ReleaseDrosselPanel() {
  const role = useRole();
  const mode = useModeSwitch();
  const activeMode = mode?.activeMode ?? role;
  const live = (mode?.real ?? role) === activeMode && activeMode !== 'analyst';
  const configured = anthemPublishConfigured();

  const repIds = useMemo(() => REPRESENTATIONS.map((r) => r.id), []);
  const [nonce, setNonce] = useState(0);
  const lib = useOriginVersionsMap(repIds, nonce);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // Drossel-Policy
  const [policy, setPolicy] = useState<ReleasePolicy>({ mode: 'manual', windowHour: 6 });
  const [policyBusy, setPolicyBusy] = useState(false);
  useEffect(() => {
    if (anthemReadConfigured()) fetchReleasePolicy().then(setPolicy).catch(() => { /* default */ });
  }, [nonce]);
  const savePolicy = async (next: ReleasePolicy) => {
    setPolicyBusy(true);
    try { await setReleasePolicy(next); setPolicy(next); }
    catch (e) { setLog((l) => [...l, `✗ Policy: ${(e as Error).message}`]); }
    finally { setPolicyBusy(false); }
  };

  const rows: Row[] = REPRESENTATIONS.map((r) => {
    const v = lib[r.id];
    const source = r.version ?? 1;
    const active = v?.active ?? null;
    const latest = (v?.versions ?? []).reduce<number | null>((a, x) => Math.max(a ?? 0, x.version), v?.versions?.length ? 0 : null);
    const needsUpload = source > (latest ?? 0);
    const staged = latest != null && (active == null ? false : latest > active);
    const geo = r.geometry_id ? geometryById(r.geometry_id) : undefined;
    return { id: r.id, name: r.name, region: geo?.region ?? '—', source, active, latest, needsUpload, staged };
  });
  const toRelease = rows.filter((r) => r.needsUpload);
  const stagedCount = rows.filter((r) => r.staged).length;

  const nowH = new Date().getUTCHours();
  const inH = policy.mode === 'scheduled' ? ((policy.windowHour - nowH + 24) % 24) : null;

  const releaseAll = async () => {
    setBusy(true); setLog([]);
    for (const row of toRelease) {
      const repObj = REPRESENTATIONS.find((r) => r.id === row.id);
      if (!repObj) continue;
      const res = await releaseRep(repObj);
      const verb = policy.mode === 'scheduled' ? 'gestaged' : 'ausgeliefert';
      setLog((l) => [...l, res.ok ? `✓ ${row.name} → ${verb} v${res.version}` : `✗ ${row.name}: ${res.error}`]);
    }
    setNonce((n) => n + 1);
    setBusy(false);
  };

  const hourOpts = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, padding: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a365d' }}>Release-Drossel</div>
        <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#a0aec0' }}>Commit ≠ Release</span>
      </div>
      <p style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.5, margin: '0 0 14px' }}>
        Was wirklich rausgegangen ist — und was daneben liegt. <strong>manuell</strong>: Release geht sofort live.
        <strong> täglich</strong>: „ausliefern" lädt nur hoch (<em>gestaged</em>); der Cron schaltet zur Fensterzeit live.
      </p>

      {/* Policy / Drossel-Steuerung */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12, padding: '8px 12px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#718096', letterSpacing: 0.5 }}>DROSSEL</span>
        {(['manual', 'scheduled'] as const).map((m) => (
          <button key={m} disabled={!live || !configured || policyBusy}
            onClick={() => savePolicy({ ...policy, mode: m })}
            style={{
              fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999, cursor: live && configured ? 'pointer' : 'default',
              border: `1px solid ${policy.mode === m ? '#2b6cb0' : '#cbd5e0'}`,
              background: policy.mode === m ? '#2b6cb0' : '#fff', color: policy.mode === m ? '#fff' : '#4a5568',
            }}>{m === 'manual' ? 'manuell' : 'täglich'}</button>
        ))}
        {policy.mode === 'scheduled' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#4a5568' }}>
            Fenster
            <select value={policy.windowHour} disabled={!live || !configured || policyBusy}
              onChange={(e) => savePolicy({ ...policy, windowHour: Number(e.target.value) })}
              style={{ fontSize: 11.5, padding: '3px 6px', borderRadius: 5, border: '1px solid #cbd5e0' }}>
              {hourOpts.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
            <span style={{ fontFamily: 'monospace', color: '#a0aec0' }}>UTC{inH != null ? ` · nächstes in ${inH} h` : ''}</span>
          </span>
        )}
        {!live && <span style={{ fontSize: 10, color: '#a0aec0', fontStyle: 'italic', marginLeft: 'auto' }}>nur Operator (live)</span>}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <Stat label="wartet auf Release" value={String(toRelease.length)} tone={toRelease.length ? '#c05621' : '#276749'} />
        <Stat label="gestaged (Fenster)" value={String(stagedCount)} tone={stagedCount ? '#2b6cb0' : '#a0aec0'} />
        <Stat label="Modus" value={policy.mode === 'scheduled' ? `täglich ${String(policy.windowHour).padStart(2, '0')}:00` : 'manuell'} tone="#2b6cb0" />
      </div>

      {!configured && (
        <div style={{ fontSize: 11.5, color: '#7b341e', background: '#feebc8', border: '1px solid #fbd38d', borderRadius: 6, padding: '7px 10px', marginBottom: 14 }}>
          Worker nicht konfiguriert (VITE_WORKER_URL + VITE_UPLOAD_API_KEY) — Release/Policy gesperrt.
        </div>
      )}

      {/* Batch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={releaseAll}
          disabled={!live || !configured || busy || toRelease.length === 0}
          title={toRelease.length === 0 ? 'Nichts auszuliefern' : `${toRelease.length} Rep(s)`}
          style={{
            fontSize: 12.5, fontWeight: 700, padding: '7px 16px', borderRadius: 6,
            border: `1px solid ${toRelease.length && live && configured ? '#2b6cb0' : '#cbd5e0'}`,
            background: busy ? '#bee3f8' : (toRelease.length && live && configured) ? '#2b6cb0' : '#edf2f7',
            color: (toRelease.length && live && configured) ? '#fff' : '#a0aec0',
            cursor: (!live || !configured || busy || !toRelease.length) ? 'default' : 'pointer',
          }}
        >{busy ? '⊕ …' : `⊕ ${policy.mode === 'scheduled' ? 'alle stagen' : 'alle ausliefern'} (${toRelease.length})`}</button>
      </div>

      {/* Queue / Tabelle */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.7fr 0.8fr 1.2fr', gap: 0, fontSize: 10, fontFamily: 'monospace', color: '#718096', background: '#f7fafc', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <span>Representation</span><span>Region</span><span>Quelle</span><span>aktiv</span><span>Status</span>
        </div>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.7fr 0.8fr 1.2fr', gap: 0, fontSize: 12, padding: '8px 10px', borderTop: '1px solid #edf2f7', alignItems: 'center', background: r.needsUpload ? '#fffaf0' : r.staged ? '#ebf8ff' : '#fff' }}>
            <span style={{ fontWeight: 600, color: '#2d3748' }}>{r.name}</span>
            <span style={{ color: '#718096', fontSize: 11 }}>{r.region}</span>
            <span style={{ fontFamily: 'monospace', color: '#4a5568' }}>v{r.source}</span>
            <span style={{ fontFamily: 'monospace', color: r.active != null ? '#276749' : '#a0aec0' }}>{r.active != null ? `v${r.active}` : '—'}</span>
            <span>
              {r.needsUpload ? (
                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#c05621', background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 999, padding: '1px 7px' }}>
                  {r.active != null ? `${r.source - (r.active ?? 0)} ungeliefert` : 'nicht ausgeliefert'}
                </span>
              ) : r.staged ? (
                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 999, padding: '1px 7px' }}>
                  ● v{r.latest} gestaged{policy.mode === 'scheduled' ? ` → ${String(policy.windowHour).padStart(2, '0')}:00` : ''}
                </span>
              ) : (
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#276749' }}>✓ aktuell</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {log.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 11, fontFamily: 'monospace', color: '#4a5568', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', lineHeight: 1.6 }}>
          {log.map((l, i) => <div key={i} style={{ color: l.startsWith('✓') ? '#276749' : '#c05621' }}>{l}</div>)}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', minWidth: 120 }}>
      <div style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: tone, marginTop: 2 }}>{value}</div>
    </div>
  );
}
