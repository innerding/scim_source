// V03 · t1 · Presence-Origin — das Call-Log des Publishing-Monitors: wer (welche
// Ziel-App in welcher Representation) ist gerade präsent — date · time · duration.
// Read-only Beobachtung der ausgelieferten Maschine (pollt den Worker). Gegenstück
// zum Producer-seitigen presence-Intake (P04 t1). Anthem-Pulse, Station „klopfen".
import { useEffect, useState } from 'react';
import { REPRESENTATIONS } from '../../workspace/workspace.registry';
import { useRepresentationContext } from '../../../runtime/repContext';
import { useAuftraggeberRep } from '../../../runtime/useAuftraggeberRep';
import { fetchPresence, anthemReadConfigured, type PresenceStatus } from '../../../runtime/anthemApi';
import { AnthemCycleBadge } from '../AnthemCycleInfo';

const POLL_MS = 15000;

function fmtWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function V03PresenceOriginPanel() {
  const rep = useAuftraggeberRep();
  const { setInspectorAsset } = useRepresentationContext();
  const [status, setStatus] = useState<PresenceStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!anthemReadConfigured()) return;
    let alive = true;
    const tick = () => {
      setLoading(true);
      fetchPresence(rep.id)
        .then((s) => { if (alive) { setStatus(s); setErr(null); } })
        .catch((e) => { if (alive) { setErr((e as Error).message); setStatus(null); } })
        .finally(() => { if (alive) setLoading(false); });
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, [rep.id]);

  const present = status?.present ?? false;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
          color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
        }}>
          V03 · t2 · Presence-Origin (Call-Log)
        </div>
        <AnthemCycleBadge />
      </div>
      <p style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.55, margin: '2px 0 12px' }}>
        <strong>Publishing-Monitor · Beobachter</strong> der ausgelieferten Maschine. Dieser Tab beobachtet das
        <strong> presence-origin</strong>-Signal: klopft gerade eine Ziel-App in dieser Representation? Read-only
        Spiegel des Workers (alle {POLL_MS / 1000} s) — das Auslieferungs-seitige Gegenstück zum Intake in
        <strong> P04 · Presence</strong> (Anthem-Pulse, Station „klopfen"). Nebenan <strong>t2 Active-Monitor</strong>:
        was ist installiert + live ausgespielt.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, color: '#1a365d' }}>Representation:</span>
        <select
          value={rep.id}
          onChange={(e) => setInspectorAsset({ kind: 'representation', id: e.target.value })}
          style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #cbd5e0', color: '#1a365d' }}
        >
          {REPRESENTATIONS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        {loading && <span style={{ fontSize: 10.5, color: '#a0aec0' }}>… poll</span>}
      </div>

      {!anthemReadConfigured() ? (
        <div style={{ fontSize: 11.5, color: '#a0aec0', fontStyle: 'italic' }}>
          Worker nicht konfiguriert — VITE_WORKER_URL setzen. (Nach Worker-Deploy zeigt sich hier das Call-Log.)
        </div>
      ) : err ? (
        <div style={{ fontSize: 11.5, fontFamily: 'ui-monospace, Menlo, monospace', color: '#c05621' }}>✗ {err}</div>
      ) : (
        <div style={{
          border: `1px solid ${present ? '#9ae6b4' : '#e2e8f0'}`,
          background: present ? '#f0fff4' : '#f7fafc', borderRadius: 8, padding: '10px 12px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: present ? '#22543d' : '#718096' }}>
            {present ? '● presence-origin — App ist präsent' : '○ kalt — niemand präsent (≤ 2 h)'}
          </div>
          <div style={{ fontSize: 11.5, fontFamily: 'ui-monospace, Menlo, monospace', color: '#4a5568', lineHeight: 1.8, marginTop: 6 }}>
            <div>rep: {rep.id}</div>
            <div>call-start (firstSeen): {fmtWhen(status?.firstSeen ?? null)}</div>
            <div>last-seen: {fmtWhen(status?.lastSeen ?? null)}</div>
            <div>duration: {status?.durationMin ?? 0} min{present ? ' (laufend)' : ''}</div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10.5, color: '#a0aec0', fontStyle: 'italic', marginTop: 10, lineHeight: 1.5 }}>
        Heute: die <em>laufende</em> Session je Rep (firstSeen→lastSeen, 2 h-Hysterese). Ein vollständiger
        Verlauf mehrerer Sessions (Historie) wäre der nächste Ausbau.
      </div>
    </div>
  );
}
