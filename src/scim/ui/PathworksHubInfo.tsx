// pathworks-hub-clipboard — die i-Pill (Badge ⓘ + Modal) des Pathworks-Hub-Arbeitstisches.
// Pendant zu build-clipboard. Hält die offenen Notizen rund um die Drehscheibe
// „Pathworks (Hub)" (vormals Workspace): bewusst NICHT gebaute Knöpfe, Default-Verhalten,
// Anschlusspunkte für den Umbau. Operator-only-Gating in der Pill selbst.
import { useEffect, useState } from 'react';
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
