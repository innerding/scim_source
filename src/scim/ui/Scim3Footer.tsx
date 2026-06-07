// Globaler SCIM3-Footer — dünne Status-Leiste am unteren Rand. Zeigt zwei Lichter:
//  · „Operator online" (du bist eingeloggt, role gesetzt)
//  · presence-origin (read-only Worker-Poll der Auftraggeber-Rep): ist gerade eine
//    Ziel-App präsent? Eigentümer/Detail = V03 · Publishing-Monitor (t1).
// Macht die sonst unsichtbare Presence global greifbar (Anthem-Pulse).
import { useContext, useEffect, useState } from 'react';
import { UserNameContext, type Role } from './RoleContext';
import { clearPasskey } from './passkey';
import { useWorkspaceNav } from './workspaceNav';
import { useAuftraggeberRep } from '../../runtime/useAuftraggeberRep';
import { fetchPresence, anthemReadConfigured, postEditorPresence, fetchEditorPresence, type PresenceStatus, type EditorPresence } from '../../runtime/anthemApi';

const POLL_MS = 15000;
const HEARTBEAT_MS = 30000;

// Editor-Rollen — Anzeige + Farbe (Operator grün · Analyst blau).
const ROLE_META: Record<string, { label: string; color: string }> = {
  operator: { label: 'Operator', color: '#48bb78' },
  analyst:  { label: 'Analyst',  color: '#4299e1' },
};
const EDITOR_ROLE_ORDER: Role[] = ['operator', 'analyst'];

export default function Scim3Footer({ realRole, preview, onPreviewChange }: {
  realRole: Role;
  preview: Role | null;
  onPreviewChange: (r: Role | null) => void;
}) {
  // Presence/Lichter hängen an der ECHTEN Rolle (nicht an der Vorschau-Rolle).
  const role = realRole;
  const userName = useContext(UserNameContext);
  const rep = useAuftraggeberRep();
  const { goStation } = useWorkspaceNav();
  const configured = anthemReadConfigured();
  const [status, setStatus] = useState<PresenceStatus | null>(null);
  const [errored, setErrored] = useState(false);
  const [editorPresence, setEditorPresence] = useState<EditorPresence | null>(null);
  const [editorErrored, setEditorErrored] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);   // Drop-up: Ansicht-Rolle wählen

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

  // Heartbeat: eigene Rolle als „im System" melden (Mehrbenutzer-Presence).
  useEffect(() => {
    if (!configured || !role || !userName) return;   // ohne Namen keine Presence/Dauer
    let alive = true;
    const beat = () => { if (alive) postEditorPresence(role, userName).catch(() => {}); };
    beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    return () => { alive = false; clearInterval(id); };
  }, [configured, role, userName]);

  // Poll: welche Editor-Rollen sind gerade im System.
  useEffect(() => {
    if (!configured) return;
    let alive = true;
    const tick = () => {
      fetchEditorPresence()
        .then((e) => { if (alive) { setEditorPresence(e); setEditorErrored(false); } })
        .catch(() => { if (alive) setEditorErrored(true); });
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, [configured]);

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
      {/* Mehrbenutzer-Presence: jede Editor-Rolle, die gerade im System ist (eigene
          immer dabei). Operator grün · Analyst blau. */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }} title="Editor-Rollen im System (Dauer nur bei Namen)">
        {EDITOR_ROLE_ORDER
          .filter((r) => r === role || (editorPresence?.roles[r]?.present ?? false))
          .map((r) => {
            const m = ROLE_META[r] ?? { label: r, color: '#48bb78' };
            const rp = editorPresence?.roles[r];
            // Name: eigene Rolle = eigener Login-Name; andere = aus dem Worker.
            const nm = r === role ? userName : (rp?.name ?? '');
            const dur = rp?.durationMin ?? 0;
            const detail = nm ? <span style={{ color: '#718096' }}> · {nm}{dur > 0 ? ` · ${dur} min` : ''}</span> : null;

            // Eigene Rolle + Operator → klickbar: Drop-up zur Ansicht-Rollenwahl.
            // (Operator darf jede Rolle annehmen; Presence bleibt echt = Operator.)
            if (r === role && realRole === 'operator') {
              return (
                <span key={r} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <button
                    onClick={() => setRoleMenuOpen((o) => !o)}
                    title="Ansicht-Rolle wählen (hinauf/hinunter)"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                      background: 'transparent', border: 'none', font: 'inherit', color: '#a0aec0', padding: 0,
                    }}
                  >
                    <span style={{ color: m.color }}>●</span>
                    {m.label}{detail}
                    {preview && (
                      <span style={{ color: '#dd6b20', fontWeight: 700 }}> · 👁 {(ROLE_META[preview]?.label ?? preview)}-Sicht</span>
                    )}
                    <span style={{ color: '#4a5568' }}> ▴</span>
                  </button>
                  {roleMenuOpen && (
                    <>
                      <div onClick={() => setRoleMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                      <div style={{
                        position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, zIndex: 50,
                        background: '#16202e', border: '1px solid #2d3748', borderRadius: 6, padding: 4,
                        minWidth: 150, boxShadow: '0 -8px 24px rgba(0,0,0,0.45)',
                      }}>
                        <div style={{ fontSize: 9, color: '#718096', padding: '2px 8px 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ansicht als …</div>
                        {EDITOR_ROLE_ORDER.map((rr) => {
                          const rm = ROLE_META[rr] ?? { label: rr, color: '#48bb78' };
                          const active = (preview ?? realRole) === rr;
                          return (
                            <button
                              key={rr}
                              onClick={() => { onPreviewChange(rr === realRole ? null : rr); setRoleMenuOpen(false); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 7, width: '100%', textAlign: 'left',
                                cursor: 'pointer', background: active ? '#1e3a5f' : 'transparent', border: 'none',
                                borderRadius: 4, color: '#cbd5e0', font: 'inherit', fontSize: 11, padding: '4px 8px',
                              }}
                            >
                              <span style={{ color: rm.color }}>●</span>
                              {rm.label}{rr === realRole ? ' (voll)' : ''}
                              <span style={{ marginLeft: 'auto', color: '#63b3ed' }}>{active ? '✓' : ''}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </span>
              );
            }
            return (
              <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: m.color }}>●</span>
                {m.label}{detail}
              </span>
            );
          })}
        {(!configured || editorErrored) && <span style={{ color: '#718096', fontSize: 10 }}>· lokal</span>}
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
      {/* Abmelden + Passkey zurücksetzen → frischer Name+Code-Login (Name wird neu
          gespeichert; danach trägt auch der Fingerprint den Namen). */}
      <button
        onClick={() => {
          if (window.confirm('Abmelden & Passkey zurücksetzen? Beim nächsten Login Name + Code eingeben — danach wieder per Fingerprint (mit Namen).')) {
            clearPasskey();
            window.location.reload();
          }
        }}
        title="Abmelden & Passkey zurücksetzen — neu mit Name + Code einloggen"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          background: 'transparent', border: '1px solid #2d3748', borderRadius: 4,
          font: 'inherit', fontSize: 10, color: '#718096', padding: '1px 7px',
        }}
      >
        ⎋ abmelden
      </button>
    </div>
  );
}
