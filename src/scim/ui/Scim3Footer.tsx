// Globaler SCIM3-Footer — dünne Status-Leiste am unteren Rand. Zeigt zwei Lichter:
//  · „Operator online" (du bist eingeloggt, role gesetzt)
//  · presence-origin (read-only Worker-Poll der Auftraggeber-Rep): ist gerade eine
//    Ziel-App präsent? Eigentümer/Detail = V03 · Publishing-Monitor (t1).
// Macht die sonst unsichtbare Presence global greifbar (Anthem-Pulse).
import { useContext, useEffect, useState } from 'react';
import { RoleContext } from './RoleContext';
import { useWorkspaceNav } from './workspaceNav';
import { useAuftraggeberRep } from '../../runtime/useAuftraggeberRep';
import { fetchPresence, anthemReadConfigured, type PresenceStatus } from '../../runtime/anthemApi';

const POLL_MS = 15000;

export default function Scim3Footer() {
  const role = useContext(RoleContext);
  const rep = useAuftraggeberRep();
  const { goStation } = useWorkspaceNav();
  const configured = anthemReadConfigured();
  const [status, setStatus] = useState<PresenceStatus | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let alive = true;
    const tick = () => {
      fetchPresence(rep.id)
        .then((s) => { if (alive) { setStatus(s); setErrored(false); } })
        .catch(() => { if (alive) { setErrored(true); setStatus(null); } });
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, [rep.id, configured]);

  const present = status?.present ?? false;
  const t = status?.lastSeen ? new Date(status.lastSeen) : null;
  const hhmm = t ? `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` : '';

  let dot = '–', color = '#4a5568', text = 'Worker n.k.';
  if (configured) {
    if (errored) { dot = '⚠'; color = '#dd6b20'; text = 'Worker nicht erreichbar'; }
    else if (present) { dot = '●'; color = '#48bb78'; text = `presence-origin · „${rep.name}" · ${hhmm} · ${status?.durationMin ?? 0} min`; }
    else { dot = '○'; color = '#718096'; text = `kalt · „${rep.name}"`; }
  }

  return (
    <div style={{
      flex: '0 0 auto', height: 26, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 12px', background: '#0f1722', borderTop: '1px solid #1a2535',
      fontFamily: 'system-ui, sans-serif', fontSize: 11, color: '#a0aec0', userSelect: 'none',
    }}>
      <span style={{ fontWeight: 700, letterSpacing: 0.5, color: '#cbd5e0' }}>SCIM3</span>
      <span title="Operator ist eingeloggt">
        <span style={{ color: role ? '#48bb78' : '#718096' }}>●</span>{' '}
        {role ? 'Operator online' : 'kein Operator'}
      </span>
      <button
        onClick={() => goStation('V03', 't1')}
        title="Publishing-Monitor öffnen (V03 · Presence-Origin)"
        style={{
          marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          background: 'transparent', border: 'none', font: 'inherit', color: '#a0aec0', padding: 0,
        }}
      >
        <span style={{ color, fontSize: 12 }}>{dot}</span>
        <span>{text}</span>
        <span style={{ color: '#4a5568' }}>· V03 ›</span>
      </button>
    </div>
  );
}
