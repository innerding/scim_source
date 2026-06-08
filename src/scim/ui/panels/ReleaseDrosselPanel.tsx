// V03 · t4 — Release-Drossel: der Aggregat-Monitor der Auslieferung.
// Zeigt die Release-Queue (welche Reps „liegen daneben": Quelle > ausgeliefert),
// die Cadence/Policy und einen Batch-„alle ausliefern". Commit ≠ Release: das
// manuelle Gate IST die Drossel (zeitgetaktet/gebündelt = Ausbau).
import { useMemo, useState } from 'react';
import { REPRESENTATIONS, geometryById } from '../../workspace/workspace.registry';
import { useDeliveredVersions } from '../../../runtime/useDelivered';
import { anthemPublishConfigured } from '../../../runtime/anthemApi';
import { releaseRep } from '../../sensus/release';
import { useRole, useModeSwitch } from '../RoleContext';

interface Row {
  id: string; name: string; region: string;
  source: number; delivered: number | null; published: boolean; uploadedAt: string | null; pending: boolean;
}

function toNum(v: number | string | null): number {
  return typeof v === 'number' ? v : (typeof v === 'string' ? parseInt(v.replace(/^v/i, ''), 10) : NaN);
}

export default function ReleaseDrosselPanel() {
  const role = useRole();
  const mode = useModeSwitch();
  const activeMode = mode?.activeMode ?? role;
  const live = (mode?.real ?? role) === activeMode && activeMode !== 'analyst';
  const configured = anthemPublishConfigured();

  const repIds = useMemo(() => REPRESENTATIONS.map((r) => r.id), []);
  const [nonce, setNonce] = useState(0);
  const delivered = useDeliveredVersions(repIds, nonce);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const rows: Row[] = REPRESENTATIONS.map((r) => {
    const d = delivered[r.id];
    const source = r.version ?? 1;
    const dv = toNum(d?.version ?? null);
    const published = !!d?.published;
    const pending = !published || (Number.isFinite(dv) && source > dv);
    const geo = r.geometry_id ? geometryById(r.geometry_id) : undefined;
    return {
      id: r.id, name: r.name, region: geo?.region ?? '—', source,
      delivered: Number.isFinite(dv) ? dv : null, published, uploadedAt: d?.uploadedAt ?? null, pending,
    };
  });
  const pending = rows.filter((r) => r.pending);
  const lastUploaded = rows.map((r) => r.uploadedAt).filter(Boolean).sort().pop() ?? null;

  const releaseAll = async () => {
    setBusy(true); setLog([]);
    for (const row of pending) {
      const repObj = REPRESENTATIONS.find((r) => r.id === row.id);
      if (!repObj) continue;
      const res = await releaseRep(repObj);
      setLog((l) => [...l, res.ok ? `✓ ${row.name} → ausgeliefert v${res.version}` : `✗ ${row.name}: ${res.error}`]);
    }
    setNonce((n) => n + 1);
    setBusy(false);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, padding: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a365d' }}>Release-Drossel</div>
        <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#a0aec0' }}>Commit ≠ Release</span>
      </div>
      <p style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.5, margin: '0 0 14px' }}>
        Was wirklich rausgegangen ist — und was daneben liegt. Der Commit füllt die <strong>Quell-Version</strong>;
        erst das Release schiebt es auf die Geräte (<strong>Auslieferungs-Version</strong>).
      </p>

      {/* Policy / Cadence */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <Stat label="wartet auf Release" value={String(pending.length)} tone={pending.length ? '#c05621' : '#276749'} />
        <Stat label="Drossel" value="manuell" tone="#2b6cb0" sub="zeitgetaktet folgt" />
        <Stat label="letzte Auslieferung" value={lastUploaded ? new Date(lastUploaded).toLocaleString('de') : '—'} tone="#4a5568" />
      </div>

      {!configured && (
        <div style={{ fontSize: 11.5, color: '#7b341e', background: '#feebc8', border: '1px solid #fbd38d', borderRadius: 6, padding: '7px 10px', marginBottom: 14 }}>
          Worker nicht konfiguriert (VITE_WORKER_URL + VITE_UPLOAD_API_KEY) — „ausgeliefert" bleibt leer, Release ist gesperrt.
        </div>
      )}

      {/* Batch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={releaseAll}
          disabled={!live || !configured || busy || pending.length === 0}
          title={pending.length === 0 ? 'Nichts auszuliefern' : `${pending.length} Rep(s) ausliefern`}
          style={{
            fontSize: 12.5, fontWeight: 700, padding: '7px 16px', borderRadius: 6,
            border: `1px solid ${pending.length && live && configured ? '#2b6cb0' : '#cbd5e0'}`,
            background: busy ? '#bee3f8' : (pending.length && live && configured) ? '#2b6cb0' : '#edf2f7',
            color: (pending.length && live && configured) ? '#fff' : '#a0aec0',
            cursor: (!live || !configured || busy || !pending.length) ? 'default' : 'pointer',
          }}
        >{busy ? '⊕ liefere …' : `⊕ alle ausliefern (${pending.length})`}</button>
        {!live && <span style={{ fontSize: 10.5, color: '#c05621', fontStyle: 'italic' }}>nur Operator (live)</span>}
      </div>

      {/* Queue / Tabelle */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.8fr 0.8fr 1fr', gap: 0, fontSize: 10, fontFamily: 'monospace', color: '#718096', background: '#f7fafc', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <span>Representation</span><span>Region</span><span>Quelle</span><span>ausgeliefert</span><span>Status</span>
        </div>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.8fr 0.8fr 1fr', gap: 0, fontSize: 12, padding: '8px 10px', borderTop: '1px solid #edf2f7', alignItems: 'center', background: r.pending ? '#fffaf0' : '#fff' }}>
            <span style={{ fontWeight: 600, color: '#2d3748' }}>{r.name}</span>
            <span style={{ color: '#718096', fontSize: 11 }}>{r.region}</span>
            <span style={{ fontFamily: 'monospace', color: '#4a5568' }}>v{r.source}</span>
            <span style={{ fontFamily: 'monospace', color: r.published ? '#276749' : '#a0aec0' }}>{r.published && r.delivered != null ? `v${r.delivered}` : '—'}</span>
            <span>
              {r.pending ? (
                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#c05621', background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 999, padding: '1px 7px' }}>
                  {r.published ? `${r.source - (r.delivered ?? 0)} ungeliefert` : 'nicht ausgeliefert'}
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

function Stat({ label, value, tone, sub }: { label: string; value: string; tone: string; sub?: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', minWidth: 120 }}>
      <div style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: tone, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: '#cbd5e0' }}>{sub}</div>}
    </div>
  );
}
