// Editor-Pathworks-Face — das „Home" des Editors: eine schmale, scoped Liste
// „meine Reps". KEIN Nation→Region→Rep-Baum (das ist die Last des Operators) —
// nur das, was der Editor braucht: pro Rep Name · Art · Zustand · Version + die
// vier Facetten-Badges + Aktionen (Senden zur Review / Zurückziehen, Werkzeuge
// öffnen). Liest über die Naht (localStore.repsForActor) aus den echten Daten.
//
// Die Gestalt: die Representation IST der Tetraeder; dieser Face ist die Spine,
// die anderen drei Faces (Drawer/Katalog/Thresholds) sind die Werkzeuge an der
// gewählten Rep. Die echte Rep-BINDUNG (gewählte Rep treibt die Werkzeuge) ist
// der nächste Schritt — heute öffnen die Werkzeug-Knöpfe die Panels.
import { useMemo, useState } from 'react';
import { useRole, useModeSwitch, useUserName } from '../RoleContext';
import { actorFrom, repsForActor, submitRep, withdrawRep } from '../../pathworks/localStore';
import type { RepView } from '../../pathworks/pathworks.types';

interface Props { onJumpTo: (panelId: string) => void; }

const STATE_META: Record<RepView['state'], { label: string; bg: string; fg: string; bd: string }> = {
  local:     { label: 'lokal',      bg: '#edf2f7', fg: '#4a5568', bd: '#cbd5e0' },
  submitted: { label: 'eingereicht', bg: '#fffaf0', fg: '#c05621', bd: '#fbd38d' },
  committed: { label: 'committet',   bg: '#f0fff4', fg: '#22543d', bd: '#9ae6b4' },
};

function PartBadge({ on, label }: { on: boolean; label: string }) {
  return (
    <span style={{
      fontSize: 9.5, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 4,
      border: `1px solid ${on ? '#bee3f8' : '#e2e8f0'}`,
      background: on ? '#ebf8ff' : '#f7fafc', color: on ? '#2b6cb0' : '#a0aec0',
    }}>{on ? '●' : '○'} {label}</span>
  );
}

function RepCard({ rep, onJumpTo, onChanged, live }: {
  rep: RepView; onJumpTo: (id: string) => void; onChanged: () => void; live: boolean;
}) {
  const role = useRole();
  const userName = useUserName();
  const sm = STATE_META[rep.state];
  const committed = rep.state === 'committed';

  const doSubmit = () => { if (submitRep(rep.id, actorFrom(userName, role), Date.now())) onChanged(); };
  const doWithdraw = () => { if (withdrawRep(rep.id, actorFrom(userName, role))) onChanged(); };

  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', background: '#fff',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1a202c' }}>{rep.name}</span>
        <span style={{
          fontSize: 9.5, fontFamily: 'monospace', padding: '1px 7px', borderRadius: 999,
          border: '1px solid #cbd5e0', background: '#f7fafc', color: '#4a5568',
        }}>{rep.binding === 'regional' ? `◎ ${rep.regionLabel}` : '◍ ohne Bindung'}</span>
        <span style={{
          fontSize: 9.5, fontFamily: 'monospace', padding: '1px 7px', borderRadius: 999,
          border: `1px solid ${sm.bd}`, background: sm.bg, color: sm.fg, fontWeight: 700,
        }}>{sm.label}{committed ? ` v${rep.currentVersion}` : ''}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <PartBadge on={rep.parts.geometry} label="Umriss" />
        <PartBadge on={rep.parts.wegnetz} label="Wegnetz" />
        <PartBadge on={rep.parts.catalog} label="Katalog" />
        <PartBadge on={rep.parts.thresholds} label="Farbe" />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Werkzeuge der Rep (die drei anderen Tetraeder-Faces). Rep-Bindung folgt. */}
        <button onClick={() => onJumpTo('geometry_editor')} style={toolBtn}>◇ Drawer</button>
        <button onClick={() => onJumpTo('catalog')} style={toolBtn}>☰ Katalog</button>
        <button onClick={() => onJumpTo('P01')} style={toolBtn}>⚙ Thresholds</button>
        <span style={{ flex: 1 }} />
        {committed ? (
          <span style={{ fontSize: 10.5, color: '#718096', fontStyle: 'italic' }}>nur lesbar — Ändern = neuer Draft</span>
        ) : !live ? (
          <span style={{ fontSize: 10.5, color: '#c05621', fontStyle: 'italic' }}>Sandbox</span>
        ) : rep.state === 'submitted' ? (
          <button onClick={doWithdraw} style={{ ...actBtn, borderColor: '#cbd5e0', background: '#fff', color: '#4a5568' }}>↩ Zurückziehen</button>
        ) : (
          <button onClick={doSubmit} style={{ ...actBtn, borderColor: '#dd6b20', background: '#dd6b20', color: '#fff' }}>⤴ Senden zur Review</button>
        )}
      </div>
    </div>
  );
}

const toolBtn: React.CSSProperties = {
  fontSize: 11, padding: '4px 10px', borderRadius: 5, border: '1px solid #cbd5e0',
  background: '#fff', color: '#2d3748', cursor: 'pointer', fontWeight: 600,
};
const actBtn: React.CSSProperties = {
  fontSize: 11.5, padding: '5px 12px', borderRadius: 5, border: '1px solid', cursor: 'pointer', fontWeight: 700,
};

export default function EditorRepsHome({ onJumpTo }: Props) {
  const role = useRole();
  const mode = useModeSwitch();
  const userName = useUserName();
  const activeMode = mode?.activeMode ?? role;
  const live = (mode?.real ?? role) === activeMode && activeMode !== 'analyst';
  const [tick, setTick] = useState(0);
  const reps = useMemo(() => repsForActor(actorFrom(userName, activeMode)), [userName, activeMode, tick]);

  const drafts = reps.filter((r) => r.state !== 'committed');
  const committed = reps.filter((r) => r.state === 'committed');

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)', borderRadius: 6,
        padding: '14px 18px', marginBottom: 18, color: '#fff',
      }}>
        <div style={{ fontSize: 9, opacity: 0.65, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Pathworks · Editor
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Meine Representations</div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, lineHeight: 1.5 }}>
          Jede Representation ist die Einheit — über sie öffnest du ihre Werkzeuge (Drawer · Katalog · Thresholds).
          Speichern bleibt lokal; mit <strong>Senden zur Review</strong> geht sie an den Operator zum Committen.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {drafts.length === 0 && committed.length === 0 && (
          <div style={{ fontSize: 12, color: '#718096', fontStyle: 'italic', padding: '8px 2px' }}>
            Noch keine Representation. Lege im Drawer eine Boundary an — daraus entsteht dein erster Rep-Draft.
          </div>
        )}
        {drafts.map((r) => (
          <RepCard key={r.id} rep={r} onJumpTo={onJumpTo} onChanged={() => setTick((t) => t + 1)} live={live} />
        ))}
        {committed.length > 0 && (
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>
            Committet (nur lesbar)
          </div>
        )}
        {committed.map((r) => (
          <RepCard key={r.id} rep={r} onJumpTo={onJumpTo} onChanged={() => setTick((t) => t + 1)} live={live} />
        ))}
      </div>
    </div>
  );
}
