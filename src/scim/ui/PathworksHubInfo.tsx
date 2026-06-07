// pathworks-hub-clipboard — die i-Pill (Badge ⓘ + Modal) des Pathworks-Hub-Arbeitstisches.
// Pendant zu build-clipboard. Hält die offenen Notizen rund um die Drehscheibe
// „Pathworks (Hub)" (vormals Workspace): bewusst NICHT gebaute Knöpfe, Default-Verhalten,
// Anschlusspunkte für den Umbau. Operator-only-Gating in der Pill selbst.
import { useEffect, useRef, useState } from 'react';
import { useRole } from './RoleContext';

export function PathworksHubBadge({ compact = false }: { compact?: boolean }) {
  const role = useRole();
  const [open, setOpen] = useState(false);
  if (role !== 'operator') return null;   // i-Pill operator-only (Sub-Komposit gesperrt)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="pathworks-hub-clipboard — offene Notizen zur Drehscheibe"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
          fontSize: compact ? 10.5 : 11, fontFamily: 'system-ui, sans-serif',
          padding: compact ? '1px 7px' : '2px 9px', borderRadius: 999,
          border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0',
        }}
      >
        <span aria-hidden>ⓘ</span> pathworks-hub-clipboard
      </button>
      {open && <PathworksHubModal onClose={() => setOpen(false)} />}
    </>
  );
}

function Note({ tag, title, children }: { tag: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '11px 13px', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <span style={{
          fontSize: 9.5, fontFamily: 'monospace', fontWeight: 700, color: '#2b6cb0',
          background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4, padding: '1px 6px',
        }}>{tag}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2d3748' }}>{title}</span>
      </div>
      <div style={{ fontSize: 11.5, color: '#4a5568', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export function PathworksHubClipboard() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
          color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
        }}>pathworks-hub-clipboard</span>
      </div>
      <p style={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.6, margin: '0 0 14px' }}>
        Arbeitstisch der Drehscheibe <strong>„Pathworks (Hub)"</strong> (vormals Workspace).
        Hält fest, was bewusst <em>noch nicht</em> gebaut ist, wie sich das Panel verhält und
        wo der große Umbau anschließen kann.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Note tag="STUB" title="»+ neuer Katalog« — absichtlich tot">
          Der Knopf ist hart <code>disabled</code>, sein Klick macht nichts (Tooltip „noch nicht
          gebaut"). Bewusst <strong>nicht</strong> aktiv gestellt: ein echter Katalog-Anlege-Flow
          (Name/Region → leerer Katalog) ist ein eigenes Arbeitspaket, kein Text-Korrektur-Batch.
          Erst bauen, wenn wir den Flow wirklich wollen.
        </Note>
        <Note tag="OK" title="»+ neue Representation« — funktioniert">
          Öffnet den <code>RepresentationWizard</code> (Geometry + Katalog + Name → Representation).
          Grau nur, solange es keine gezeichnete Boundary gibt (<code>GEOMETRIES.length === 0</code>).
          Das ist gewollt, kein Defekt.
        </Note>
        <Note tag="DEFAULT" title="Start-Panel & Persistenz">
          Default ist nicht mehr P01: beim Start öffnet das <em>zuletzt geöffnete</em> Panel
          (<code>localStorage „scim3_last_panel"</code>), sonst Pathworks. Für Analysten öffnet sich
          bei den ersten beiden Sitzungen automatisch das Usage-Manual (<code>scim3_manual_seen</code>).
        </Note>
        <Note tag="ANSCHLUSS" title="Wo der Umbau andockt">
          Pathworks ist die geplante Nation→Region→Rep-Drehscheibe (siehe ann_106 „Pathworks Hub").
          Fundament = versioniertes Representation-Artefakt; die Repr-Bildungs-Panels
          (Thresholds/Workspace/Drawer/Katalog) wandern perspektivisch in ein Regio-Dashboard
          unter diesenpark.at. Reihenfolge: erst Umbau + Pathworks, dann Rollen/Logs/Governance.
        </Note>
      </div>
    </div>
  );
}

// Floating-Variante: KEIN gedimmter Backdrop, das Panel dahinter bleibt voll
// bedienbar (nur die Karte selbst fängt Klicks). Per Titelleiste verschiebbar.
export function PathworksHubFloating({ onClose }: { onClose: () => void }) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(16, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 470),
    y: 96,
  }));
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 120, e.clientX - dragRef.current.ox)),
        y: Math.max(8, Math.min(window.innerHeight - 60, e.clientY - dragRef.current.oy)),
      });
    };
    const up = () => { dragRef.current = null; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    dragRef.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
    document.body.style.userSelect = 'none';
  };

  return (
    <div style={{
      position: 'fixed', left: pos.x, top: pos.y, zIndex: 900,
      width: 440, maxHeight: '78vh', display: 'flex', flexDirection: 'column',
      background: '#fff', border: '1px solid #cbd5e0', borderRadius: 10,
      boxShadow: '0 14px 44px rgba(15,23,35,0.30)', overflow: 'hidden',
    }}>
      <div
        onMouseDown={startDrag}
        style={{
          flexShrink: 0, cursor: 'grab', userSelect: 'none',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px 7px 12px', background: '#0d1520',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <span aria-hidden style={{ fontSize: 12, opacity: 0.7 }}>⠿</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' }}>
          pathworks-hub-clipboard
        </span>
        <button onClick={onClose} title="schließen" style={{
          marginLeft: 'auto', cursor: 'pointer', border: '1px solid #2a3a50',
          background: 'transparent', color: 'rgba(255,255,255,0.7)', borderRadius: 5,
          fontSize: 12, padding: '1px 7px',
        }}>✕</button>
      </div>
      <div style={{ overflowY: 'auto', padding: '12px 14px 16px' }}>
        <PathworksHubClipboard />
      </div>
    </div>
  );
}

// ── Infoblatt-Clipboard ─────────────────────────────────────────────────────
// Ein echtes Klemmbrett mit 3 leicht gefächerten A4-Blättern (Operator · Analyst ·
// Regio-Editor-Basis). Die Blätter sind Hitboxen: Klick fächert das gewählte nach
// vorn. X rechts oben schließt. Non-modal & verschiebbar (Hintergrund bedienbar).
// Gedacht als späteres Hilfe-Panel für Regio-Editoren.

const OP = '#b7791f';   // Farbe für operator-only Zusatztexte

function RegioSheet() {
  return (
    <div style={{ fontSize: 10.8, color: '#2d3748', lineHeight: 1.62 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#1a202c' }}>Was ist der Pathworks&nbsp;Hub?</h3>
      <p style={{ margin: '0 0 9px' }}>
        Der <strong>Pathworks&nbsp;Hub</strong> ist die Drehscheibe, an der eine <strong>Region</strong> zu
        einer auslieferbaren <strong>Representation</strong> zusammenläuft — der Sache, die später
        als App auf dem Gerät landet.
      </p>
      <p style={{ margin: '0 0 9px' }}>
        Drei Bausteine treffen hier zusammen:
      </p>
      <ul style={{ margin: '0 0 9px', paddingLeft: 18 }}>
        <li><strong>Boundary</strong> — der gezeichnete Umriss der Region (Geometrie).</li>
        <li><strong>Katalog</strong> — die Points of Interest der Region.</li>
        <li><strong>Schwellen &amp; Farben</strong> — wie Auslastung auf Farbe abgebildet wird.</li>
      </ul>
      <p style={{ margin: '0 0 9px' }}>
        Aus ihnen entsteht — <strong>benannt und versioniert</strong> — eine Representation. Der Hub
        baut nichts heimlich: jede Representation wird hier <em>bewusst komponiert</em>.
      </p>
      <p style={{ margin: 0, fontSize: 10, color: '#718096' }}>
        Künftig hängt jede Region in einem Baum <em>Nation → Region → Rep</em>. Als Regio-Editor
        pflegst du den Inhalt genau einer Region.
      </p>
    </div>
  );
}

function AnalystSheet() {
  return (
    <div style={{ fontSize: 10.8, color: '#2d3748', lineHeight: 1.62 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#1a202c' }}>Der Hub für Analyst:innen</h3>
      <p style={{ margin: '0 0 9px' }}>
        Du siehst den Hub als <strong>Übersicht</strong>: Geometrien, Kataloge und Representations
        einer Region — und wie sie zusammengesetzt sind.
      </p>
      <p style={{ margin: '0 0 9px' }}>
        Der Hub ist für dich <strong>read-only</strong>. Du kannst nachvollziehen, auf welchem Stand
        eine Representation ist, ohne in die Produktion einzugreifen — ideal zum <em>Prüfen</em> und
        <em>Verstehen</em>.
      </p>
      <p style={{ margin: 0, fontSize: 10, color: '#718096' }}>
        Die Basis-Erklärung (Blatt „Regio-Editor") gilt unverändert auch für dich — sie ist das
        Fundament, auf dem die Operator-Funktionen aufsetzen.
      </p>
    </div>
  );
}

function OperatorSheet() {
  return (
    <div style={{ fontSize: 10.8, color: '#2d3748', lineHeight: 1.62 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#1a202c' }}>Der Hub für Operator</h3>
      <p style={{ margin: '0 0 9px' }}>
        Die Basis gilt (Blatt „Regio-Editor"): drei Bausteine → benannte, versionierte Representation.
        <span style={{ color: OP }}> Zusätzlich komponierst <strong>du</strong> hier aktiv:</span>
      </p>
      <ul style={{ margin: '0 0 9px', paddingLeft: 18, color: OP }}>
        <li><strong>»&nbsp;+ neue Representation&nbsp;«</strong> öffnet den Wizard (Geometrie + Katalog + Name).</li>
        <li><strong>»&nbsp;+ neuer Katalog&nbsp;«</strong> ist bewusst noch <strong>nicht</strong> gebaut.</li>
        <li>Drafts werden <strong>benannt gespeichert</strong> — kein stiller Autospeicher.</li>
      </ul>
      <p style={{ margin: '0 0 6px', fontSize: 10.5, color: OP, fontWeight: 600 }}>
        Was dir zuletzt noch abgeht:
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, color: OP, fontSize: 10.3 }}>
        <li>der Katalog-Anlege-Flow (»&nbsp;+ neuer Katalog&nbsp;«),</li>
        <li>die Auslagerung der Repr-Panels ins Regio-Dashboard (Roadmap ann_106),</li>
        <li>Versionierung &amp; Governance (Rollen/Logs) — kommt nach dem Umbau.</li>
      </ul>
    </div>
  );
}

const INFO_VERSIONS: { key: string; label: string; color: string; body: React.ReactNode }[] = [
  { key: 'operator', label: 'OPERATOR',      color: OP,        body: <OperatorSheet /> },
  { key: 'analyst',  label: 'ANALYST',       color: '#2b6cb0', body: <AnalystSheet /> },
  { key: 'regio',    label: 'REGIO-EDITOR',  color: '#2f855a', body: <RegioSheet /> },
];

function useDragPos(initX: number, initY: number) {
  const [pos, setPos] = useState(() => ({ x: initX, y: initY }));
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 120, e.clientX - dragRef.current.ox)),
        y: Math.max(8, Math.min(window.innerHeight - 60, e.clientY - dragRef.current.oy)),
      });
    };
    const up = () => { dragRef.current = null; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);
  const startDrag = (e: React.MouseEvent) => {
    dragRef.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
    document.body.style.userSelect = 'none';
  };
  return { pos, startDrag };
}

export function PathworksInfoClipboard({ onClose }: { onClose: () => void }) {
  const { pos, startDrag } = useDragPos(
    Math.max(16, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 470), 96,
  );
  const [active, setActive] = useState(0);
  const SHEET_W = 290, SHEET_H = 408;

  return (
    <div style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 901, width: 372 }}>
      {/* Klemmbrett (Hartfaser) */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(150deg, #c69a63 0%, #b0824a 100%)',
        borderRadius: 12, padding: '26px 16px 18px',
        boxShadow: '0 16px 46px rgba(15,23,35,0.32), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}>
        {/* Klemme */}
        <div onMouseDown={startDrag} style={{
          position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
          width: 96, height: 30, cursor: 'grab', zIndex: 40,
          background: 'linear-gradient(180deg, #e8edf2 0%, #aab4bf 55%, #cfd6dd 100%)',
          borderRadius: 6, boxShadow: '0 3px 7px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 46, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.22)' }} />
        </div>
        {/* Schließen */}
        <button onClick={onClose} title="schließen" style={{
          position: 'absolute', top: 6, right: 8, zIndex: 50, cursor: 'pointer',
          width: 22, height: 22, borderRadius: 5, border: '1px solid rgba(0,0,0,0.25)',
          background: 'rgba(255,255,255,0.85)', color: '#3b2f1c', fontSize: 13, lineHeight: 1,
        }}>✕</button>

        {/* Blätter-Fächer */}
        <div style={{ position: 'relative', height: SHEET_H, marginLeft: 'auto', marginRight: 'auto' }}>
          {INFO_VERSIONS.map((v, i) => {
            const off = i - active;
            const isA = i === active;
            return (
              <div
                key={v.key}
                onClick={() => setActive(i)}
                title={isA ? v.label : `zu „${v.label}" blättern`}
                style={{
                  position: 'absolute', top: 0, left: '50%', width: SHEET_W, height: SHEET_H,
                  marginLeft: -SHEET_W / 2,
                  transformOrigin: 'top center',
                  transform: `rotate(${off * 5}deg)`,
                  zIndex: 30 - Math.abs(off),
                  background: '#fff', borderRadius: 3,
                  boxShadow: isA ? '0 6px 16px rgba(0,0,0,0.28)' : '0 3px 9px rgba(0,0,0,0.22)',
                  cursor: isA ? 'default' : 'pointer',
                  overflow: 'hidden', transition: 'transform 180ms ease, box-shadow 180ms ease',
                }}
              >
                {/* obere Klemm-Lasche (unter der Klemme) */}
                <div style={{ height: 16, background: '#f1f3f5', borderBottom: '1px solid #e6e9ec' }} />
                {/* Inhalt nur auf dem aktiven Blatt */}
                {isA && (
                  <div style={{ position: 'absolute', top: 16, left: 0, right: 0, bottom: 22, overflowY: 'auto', padding: '12px 14px' }}>
                    {v.body}
                  </div>
                )}
                {/* Farbiger Audience-Streifen am Fuß = sichtbarer Hitbox-Reiter */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 22,
                  background: v.color, color: '#fff',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'monospace',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isA ? 1 : 0.92,
                }}>{v.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>
          Infoblatt · Blätter klicken zum Umblättern
        </div>
      </div>
    </div>
  );
}

function PathworksHubModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,35,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12, maxWidth: 760, width: '100%', maxHeight: '88vh',
          overflowY: 'auto', boxShadow: '0 18px 60px rgba(0,0,0,0.35)', padding: '14px 18px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose} style={{
            cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f7fafc', borderRadius: 6,
            fontSize: 12, padding: '3px 9px', color: '#4a5568', fontFamily: 'system-ui, sans-serif',
          }}>schließen ✕</button>
        </div>
        <PathworksHubClipboard />
      </div>
    </div>
  );
}
