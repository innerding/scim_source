import { useState } from 'react';
import { usePackagesApi, type PackageEntry } from './usePackagesApi';
import { AppManifestBadge } from '../AppManifestInfo';
import { useRole } from '../RoleContext';
import packagesIcon    from '../../../assets/Packages.svg';
import skgIcon         from '../../../assets/SKG.svg';
import gruenbergIcon   from '../../../assets/Grünberg.svg';
import boehmerwaldIcon from '../../../assets/Böhmerwald.svg';
import lichtenbergIcon from '../../../assets/Lichtenberg.svg';
import salzburgIcon    from '../../../assets/Salzburg.svg';
import gaisbergIcon    from '../../../assets/Gaisberg.svg';

export const REGION_MAP = [
  {
    id: 'skg', label: 'Salzkammergut', icon: skgIcon,
    representations: [
      { id: 'gruenberg',   label: 'Grünberg',    icon: gruenbergIcon },
    ],
  },
  {
    id: 'böhmerwald', label: 'Böhmerwald', icon: boehmerwaldIcon,
    representations: [
      { id: 'lichtenberg', label: 'Lichtenberg', icon: lichtenbergIcon },
    ],
  },
  {
    id: 'salzburg', label: 'Salzburg', icon: salzburgIcon,
    representations: [
      { id: 'gaisberg',    label: 'Gaisberg',    icon: gaisbergIcon },
    ],
  },
];

export function representationIcon(representationId: string): string | undefined {
  for (const region of REGION_MAP) {
    const rep = region.representations.find((r) =>
      representationId.toLowerCase().includes(r.id.toLowerCase())
    );
    if (rep) return rep.icon;
  }
  return undefined;
}

const STATUS_STYLE: Record<PackageEntry['status'], { bg: string; color: string; label: string }> = {
  draft:    { bg: '#ebf8ff', color: '#2b6cb0', label: 'draft' },
  active:   { bg: '#f0fff4', color: '#276749', label: 'aktiv' },
  archived: { bg: '#f7fafc', color: '#718096', label: 'archiviert' },
};

function StatusChip({ status }: { status: PackageEntry['status'] }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 10,
      fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

export default function V01PackagesPanel() {
  const role = useRole();
  const { packages, loading, error, reload, activate, archive, isConfigured } = usePackagesApi();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const handleActivate = async (pkg: PackageEntry) => {
    setBusy(pkg.id); setActionError(null);
    try { await activate(pkg.id); } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(null); }
  };

  const handleArchive = async (pkg: PackageEntry) => {
    setBusy(pkg.id); setActionError(null);
    try { await archive(pkg.id); } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(null); }
  };

  if (!isConfigured) {
    return (
      <div style={{ padding: 24, color: '#718096', fontSize: 13, fontFamily: 'system-ui' }}>
        Worker nicht konfiguriert — VITE_WORKER_URL + VITE_UPLOAD_API_KEY setzen.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <img src={packagesIcon} alt="" width={32} height={32} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a365d' }}>Alle Pakete</div>
          <div style={{ fontSize: 11, color: '#718096' }}>Region · Representation · Version · Status</div>
        </div>
        {role === 'operator' && <AppManifestBadge />}
        <button onClick={() => void reload()} disabled={loading} style={{
          marginLeft: 'auto', padding: '5px 12px', fontSize: 11,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 5,
          cursor: loading ? 'default' : 'pointer', color: '#4a5568',
        }}>
          {loading ? '…' : '↺ Laden'}
        </button>
      </div>

      {(error ?? actionError) && (
        <div style={{ padding: '8px 12px', background: '#fffaf0', border: '1px solid #fbd38d',
          borderRadius: 6, color: '#975a16', fontSize: 12, marginBottom: 16 }}>
          {error ?? actionError}
        </div>
      )}

      {packages.length === 0 && !loading && (
        <div style={{ color: '#a0aec0', fontSize: 13, padding: '20px 0' }}>
          Noch keine Pakete hochgeladen.
        </div>
      )}

      {packages.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Region', 'Representation', 'Version', 'Status', 'Hochgeladen', 'Aktionen'].map((h) => (
                  <th key={h} style={{
                    padding: '6px 10px', textAlign: 'left', fontWeight: 600,
                    color: '#4a5568', fontSize: 11, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
                const repIcon = representationIcon(pkg.representation_id);
                const region  = REGION_MAP.find((r) => r.id === pkg.region_id);
                const isBusy  = busy === pkg.id;
                return (
                  <tr key={pkg.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {region && <img src={region.icon} alt="" width={16} height={16} />}
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#718096' }}>
                          {region?.label ?? pkg.region_id}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {repIcon && <img src={repIcon} alt="" width={16} height={16} />}
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#2d3748' }}>
                          {pkg.representation_id}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{pkg.version}</span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <StatusChip status={pkg.status} />
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: '#718096', fontSize: 11 }}>
                      {new Date(pkg.created_at).toLocaleDateString('de-AT')}
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {pkg.status !== 'active' && (
                          <button onClick={() => void handleActivate(pkg)} disabled={isBusy} style={{
                            padding: '3px 10px', fontSize: 10, fontWeight: 600,
                            background: '#f0fff4', color: '#276749',
                            border: '1px solid #9ae6b4', borderRadius: 4, cursor: 'pointer',
                          }}>
                            {isBusy ? '…' : '▶ Aktivieren'}
                          </button>
                        )}
                        {pkg.status === 'draft' && (
                          <button onClick={() => void handleArchive(pkg)} disabled={isBusy} style={{
                            padding: '3px 10px', fontSize: 10,
                            background: '#f7fafc', color: '#718096',
                            border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer',
                          }}>
                            {isBusy ? '…' : 'Archivieren'}
                          </button>
                        )}
                        <a href={pkg.cdn_url} target="_blank" rel="noreferrer" style={{
                          padding: '3px 10px', fontSize: 10,
                          background: '#ebf8ff', color: '#2b6cb0',
                          border: '1px solid #bee3f8', borderRadius: 4,
                          textDecoration: 'none', display: 'inline-block',
                        }}>↗ CDN</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
