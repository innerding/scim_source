import { useState } from 'react';
import { usePackagesApi, type PackageEntry } from './usePackagesApi';
import { REGION_MAP } from './V01PackagesPanel';
import packageIcon     from '../../../assets/Package.svg';
import packageOpenIcon from '../../../assets/Package-open.svg';

const STATUS_STYLE: Record<PackageEntry['status'], { bg: string; color: string; label: string }> = {
  draft:    { bg: '#ebf8ff', color: '#2b6cb0', label: 'draft' },
  active:   { bg: '#f0fff4', color: '#276749', label: 'aktiv' },
  archived: { bg: '#f7fafc', color: '#718096', label: 'archiviert' },
};

function VersionCard({
  pkg, onActivate, onArchive, busy,
}: {
  pkg: PackageEntry;
  onActivate: () => void;
  onArchive: () => void;
  busy: boolean;
}) {
  const s = STATUS_STYLE[pkg.status];
  const isActive = pkg.status === 'active';
  return (
    <div style={{
      border: `1px solid ${isActive ? '#9ae6b4' : '#e2e8f0'}`,
      borderRadius: 8,
      background: isActive ? '#f0fff4' : '#fff',
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <img
        src={isActive ? packageOpenIcon : packageIcon}
        alt="" width={24} height={24}
        style={{ flexShrink: 0, opacity: pkg.status === 'archived' ? 0.4 : 1 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#2d3748' }}>
            {pkg.version}
          </span>
          <span style={{
            padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600,
            background: s.bg, color: s.color,
          }}>
            {s.label}
          </span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#718096',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pkg.cdn_url}
        </div>
        <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 3 }}>
          {new Date(pkg.created_at).toLocaleDateString('de-AT')}
          {pkg.activated_at && ` · aktiviert ${new Date(pkg.activated_at).toLocaleDateString('de-AT')}`}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        {!isActive && (
          <button onClick={onActivate} disabled={busy} style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 600,
            background: '#f0fff4', color: '#276749',
            border: '1px solid #9ae6b4', borderRadius: 5, cursor: 'pointer',
          }}>
            {busy ? '…' : '▶ Aktivieren'}
          </button>
        )}
        {pkg.status === 'draft' && (
          <button onClick={onArchive} disabled={busy} style={{
            padding: '5px 12px', fontSize: 11,
            background: '#f7fafc', color: '#718096',
            border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer',
          }}>
            Archivieren
          </button>
        )}
        <a href={pkg.cdn_url} target="_blank" rel="noreferrer" style={{
          padding: '5px 12px', fontSize: 11, textAlign: 'center',
          background: '#ebf8ff', color: '#2b6cb0',
          border: '1px solid #bee3f8', borderRadius: 5, textDecoration: 'none',
        }}>↗ CDN</a>
      </div>
    </div>
  );
}

function RepresentationSection({
  repId, repLabel, repIcon, regionId, activate, archive,
}: {
  repId: string; repLabel: string; repIcon: string; regionId: string;
  activate: (id: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
}) {
  const { packages, loading, error } = usePackagesApi(regionId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const repPackages = packages.filter((p) =>
    p.representation_id.toLowerCase().includes(repId.toLowerCase())
  );

  const handleActivate = async (id: string) => {
    setBusy(id); setActionError(null);
    try { await activate(id); } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(null); }
  };

  const handleArchive = async (id: string) => {
    setBusy(id); setActionError(null);
    try { await archive(id); } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(null); }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <img src={repIcon} alt="" width={20} height={20} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{repLabel}</span>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#a0aec0' }}>
          {repPackages.length} {repPackages.length === 1 ? 'Version' : 'Versionen'}
        </span>
        {loading && <span style={{ fontSize: 10, color: '#a0aec0' }}>…</span>}
      </div>
      {(error ?? actionError) && (
        <div style={{ padding: '6px 10px', background: '#fff5f5', border: '1px solid #feb2b2',
          borderRadius: 5, color: '#c53030', fontSize: 11, marginBottom: 8 }}>
          {error ?? actionError}
        </div>
      )}
      {repPackages.length === 0 && !loading && (
        <div style={{ color: '#a0aec0', fontSize: 12, paddingLeft: 28 }}>Keine Pakete.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {repPackages.map((pkg) => (
          <VersionCard
            key={pkg.id}
            pkg={pkg}
            busy={busy === pkg.id}
            onActivate={() => void handleActivate(pkg.id)}
            onArchive={() => void handleArchive(pkg.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function V02RegionDetailPanel() {
  const [selectedRegionId, setSelectedRegionId] = useState(REGION_MAP[0].id);
  const { activate, archive, isConfigured } = usePackagesApi(selectedRegionId);
  const region = REGION_MAP.find((r) => r.id === selectedRegionId) ?? REGION_MAP[0];

  if (!isConfigured) {
    return (
      <div style={{ padding: 24, color: '#718096', fontSize: 13, fontFamily: 'system-ui' }}>
        Worker nicht konfiguriert — VITE_WORKER_URL + VITE_UPLOAD_API_KEY setzen.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Region-Auswahl */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {REGION_MAP.map((r) => {
          const isSelected = r.id === selectedRegionId;
          return (
            <button key={r.id} onClick={() => setSelectedRegionId(r.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', fontSize: 12,
              background: isSelected ? '#1e3a5f' : '#fff',
              color: isSelected ? '#e0eeff' : '#4a5568',
              border: `1px solid ${isSelected ? '#1e3a5f' : '#e2e8f0'}`,
              borderRadius: 20, cursor: 'pointer',
            }}>
              <img src={r.icon} alt="" width={16} height={16} />
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Representations der gewählten Region */}
      {region.representations.map((rep) => (
        <RepresentationSection
          key={rep.id}
          repId={rep.id}
          repLabel={rep.label}
          repIcon={rep.icon}
          regionId={region.id}
          activate={activate}
          archive={archive}
        />
      ))}
    </div>
  );
}
