// Operator-Einreichungs-Queue über den SERVER (Phase 3, Cross-User). Zieht die
// Einreichungen vom Worker (egal von welchem Editor-Gerät), erlaubt Verortung
// ändern, Committen (commitDraftToRepo aus dem mitgelieferten Draft-Snapshot →
// danach Einreichung entfernen) und Zurückgeben (Einreichung entfernen).
import { useEffect, useMemo, useState } from 'react';
import {
  fetchSubmissions, withdrawSubmission, pathworksReadConfigured, pathworksConfigured,
  type Submission,
} from '../../../runtime/pathworksApi';
import { commitDraftToRepo, isDraftCommittable } from '../../pathworks/commitDraft';
import { knownPlacements } from '../../pathworks/localStore';

function PartBadge({ on, label }: { on: boolean; label: string }) {
  return (
    <span style={{
      fontSize: 9.5, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 4,
      border: `1px solid ${on ? '#bee3f8' : '#e2e8f0'}`, background: on ? '#ebf8ff' : '#f7fafc', color: on ? '#2b6cb0' : '#a0aec0',
    }}>{on ? '●' : '○'} {label}</span>
  );
}

export default function SubmissionsQueue({ live, onCommitted }: { live: boolean; onCommitted: () => void }) {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);
  // Verortung-Bearbeitung je Einreichung (Operator-Hoheit bis Commit).
  const [place, setPlace] = useState<Record<string, { nation: string; region: string }>>({});
  const placements = useMemo(() => knownPlacements(), []);

  const load = async () => {
    if (!pathworksReadConfigured()) return;
    setLoading(true); setError(null);
    try { setSubs(await fetchSubmissions()); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const placeOf = (s: Submission) => place[s.id] ?? { nation: s.nation ?? '', region: s.region ?? '' };

  const onCommit = async (s: Submission) => {
    setBusyId(s.id); setMsg(null);
    const today = new Date().toISOString().slice(0, 10);
    const p = placeOf(s);
    const res = await commitDraftToRepo(s.draft, today, { nation: p.nation || undefined, region: p.region || undefined });
    if (res.ok) {
      try { await withdrawSubmission(s.id); } catch { /* queue-Eintrag bleibt evtl. */ }
      setMsg({ id: s.id, ok: true, text: res.text });
      await load(); onCommitted();
    } else {
      setMsg({ id: s.id, ok: false, text: res.text });
    }
    setBusyId(null);
  };
  const onReturn = async (s: Submission) => {
    setBusyId(s.id);
    try { await withdrawSubmission(s.id); await load(); }
    catch (e) { setMsg({ id: s.id, ok: false, text: e instanceof Error ? e.message : String(e) }); }
    finally { setBusyId(null); }
  };

  if (!pathworksReadConfigured()) {
    return <div style={{ fontSize: 11.5, color: '#a0aec0', fontStyle: 'italic', padding: '6px 2px 18px' }}>Worker nicht konfiguriert — Einreichungen (Cross-User) nicht verfügbar.</div>;
  }

  return (
    <div style={{ marginBottom: 22 }}>
      <datalist id="sq-nations">{placements.nations.map((n) => <option key={n} value={n} />)}</datalist>
      <datalist id="sq-regions">{placements.regions.map((r) => <option key={r} value={r} />)}</datalist>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#a0aec0' }}>{subs.length} offen</span>
        <button onClick={() => void load()} disabled={loading} style={{ fontSize: 10.5, padding: '2px 9px', borderRadius: 5, border: '1px solid #e2e8f0', background: '#fff', color: '#4a5568', cursor: 'pointer' }}>{loading ? '…' : '↺'}</button>
      </div>
      {error && <div style={{ fontSize: 11.5, color: '#975a16', background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 6, padding: '7px 10px', marginBottom: 10 }}>{error}</div>}
      {subs.length === 0 && !loading ? (
        <div style={{ fontSize: 12, color: '#718096', fontStyle: 'italic', padding: '6px 2px' }}>Keine offenen Einreichungen. Editoren senden ihre Representations hier herein (von jedem Gerät).</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {subs.map((s) => {
            const d = s.draft;
            const committable = isDraftCommittable(d);
            const p = placeOf(s);
            const isBusy = busyId === s.id;
            const m = msg?.id === s.id ? msg : null;
            return (
              <div key={s.id} style={{ border: '1px solid #fbd38d', background: '#fffaf0', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1a202c' }}>{s.name}</span>
                  <span style={{ fontSize: 9.5, fontFamily: 'monospace', padding: '1px 7px', borderRadius: 999, border: '1px solid #cbd5e0', background: '#f7fafc', color: '#4a5568' }}>{s.binding === 'regional' ? '◎ regional' : '◍ ohne Bindung'}</span>
                  <span style={{ fontSize: 10, color: '#718096' }}>von <strong style={{ color: '#4a5568' }}>{s.owner}</strong></span>
                  <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#a0aec0' }}>{new Date(s.submittedAt).toLocaleString('de')}</span>
                  <span style={{ fontSize: 9.5, fontFamily: 'monospace', padding: '1px 7px', borderRadius: 999, border: '1px solid #fbd38d', background: '#fffaf0', color: '#c05621', fontWeight: 700 }}>eingereicht</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <PartBadge on={!!(d.boundary?.length || d.reference?.length)} label="Umriss" />
                  <PartBadge on={!!(d.net_masked || d.net_unmasked)} label="Wegnetz" />
                  <PartBadge on={!!d.catalog_id} label="Katalog" />
                </div>
                {live ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, color: '#718096', whiteSpace: 'nowrap' }}>gehört zu:</span>
                    <input list="sq-nations" placeholder="Nation" value={p.nation} onChange={(e) => setPlace((m2) => ({ ...m2, [s.id]: { nation: e.target.value, region: p.region } }))} style={{ flex: 1, fontSize: 11.5, padding: '4px 8px', borderRadius: 5, border: '1px solid #cbd5e0' }} />
                    <input list="sq-regions" placeholder="Region" value={p.region} onChange={(e) => setPlace((m2) => ({ ...m2, [s.id]: { nation: p.nation, region: e.target.value } }))} style={{ flex: 1, fontSize: 11.5, padding: '4px 8px', borderRadius: 5, border: '1px solid #cbd5e0' }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 10.5, color: '#718096' }}>gehört zu: {p.nation || '—'} · {p.region || '—'}</div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ flex: 1 }} />
                  {!live && <span style={{ fontSize: 10.5, color: '#c05621', fontStyle: 'italic' }}>Sandbox</span>}
                  {live && <button onClick={() => void onReturn(s)} disabled={isBusy} style={ghostBtn}>↩ zurückgeben</button>}
                  {live && (
                    <button onClick={() => void onCommit(s)} disabled={!committable || isBusy}
                      title={committable ? 'Committen + versiegeln (Boundary + Netz + Representation)' : 'Noch nicht committbar (braucht Boundary + maskiertes Netz)'}
                      style={{
                        fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 5,
                        border: `1px solid ${committable ? '#276749' : '#cbd5e0'}`,
                        background: !committable ? '#edf2f7' : isBusy ? '#c6f6d5' : '#276749',
                        color: !committable ? '#a0aec0' : isBusy ? '#22543d' : '#fff', cursor: committable && !isBusy ? 'pointer' : 'default',
                      }}>{isBusy ? 'Committe …' : '⬛ Committen'}</button>
                  )}
                </div>
                {m && <div style={{ fontSize: 10.5, fontFamily: 'monospace', color: m.ok ? '#276749' : '#c05621' }}>{m.ok ? '✓ ' : '✗ '}{m.text}</div>}
              </div>
            );
          })}
        </div>
      )}
      {!pathworksConfigured() && subs.length > 0 && (
        <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 6 }}>Hinweis: ohne Upload-Key sind Committen/Zurückgeben gesperrt.</div>
      )}
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  fontSize: 11, padding: '5px 12px', borderRadius: 5, border: '1px solid #cbd5e0',
  background: '#fff', color: '#4a5568', cursor: 'pointer', fontWeight: 600,
};
