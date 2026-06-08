// V02 · Regions & Representations (Mond-Auswuchs) — die REGIONALE Sicht der
// Versions-Bibliothek: Region wählen → je Rep ihre Origin-Versions-Historie +
// aktiv + Rollback. Gleiche Quelle wie V01 (Origin-Pfad), nur regional gefiltert.
import { useEffect, useMemo, useState } from 'react';
import { REGION_MAP } from './V01PackagesPanel';
import { REPRESENTATIONS } from '../../workspace/workspace.registry';
import { useRole, useModeSwitch } from '../RoleContext';
import {
  fetchOriginVersions, activateOriginVersion, anthemReadConfigured, anthemPublishConfigured,
  type OriginVersions,
} from '../../../runtime/anthemApi';
import packageIcon     from '../../../assets/Package.svg';
import packageOpenIcon from '../../../assets/Package-open.svg';

const fmtKB = (n: number) => `${(n / 1024).toFixed(1)} kB`;

// REGION_MAP-Rep (z.B. 'lichtenberg') → echte Representation (z.B. 'rep-lichtenberg').
function resolveRepId(shortId: string): string | null {
  const m = REPRESENTATIONS.find((r) =>
    r.id.toLowerCase().includes(shortId.toLowerCase()) || r.name.toLowerCase().includes(shortId.toLowerCase()));
  return m?.id ?? null;
}

function RepVersionsSection({ repId, repLabel, repIcon, canActivate }: {
  repId: string | null; repLabel: string; repIcon: string; canActivate: boolean;
}) {
  const [data, setData] = useState<OriginVersions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    if (!repId || !anthemReadConfigured()) return;
    setLoading(true); setError(null);
    try { setData(await fetchOriginVersions(repId)); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [repId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onActivate = async (version: number) => {
    if (!repId) return;
    setBusy(version); setError(null);
    try { await activateOriginVersion(repId, version); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };

  const versions = data?.versions ?? [];
  const active = data?.active ?? null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <img src={repIcon} alt="" width={20} height={20} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{repLabel}</span>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#a0aec0' }}>
          {versions.length} {versions.length === 1 ? 'Version' : 'Versionen'}
        </span>
        {loading && <span style={{ fontSize: 10, color: '#a0aec0' }}>…</span>}
      </div>
      {error && (
        <div style={{ padding: '6px 10px', background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 5, color: '#975a16', fontSize: 11, marginBottom: 8 }}>{error}</div>
      )}
      {versions.length === 0 && !loading && (
        <div style={{ color: '#a0aec0', fontSize: 12, paddingLeft: 28 }}>Keine Version veröffentlicht.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {versions.map((ver) => {
          const isActive = ver.version === active;
          const isBusy = busy === ver.version;
          return (
            <div key={ver.version} style={{
              border: `1px solid ${isActive ? '#9ae6b4' : '#e2e8f0'}`, borderRadius: 8,
              background: isActive ? '#f0fff4' : '#fff', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <img src={isActive ? packageOpenIcon : packageIcon} alt="" width={22} height={22} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#2d3748', minWidth: 34 }}>v{ver.version}</span>
              <span style={{ fontSize: 10.5, color: '#718096' }}>{new Date(ver.uploadedAt).toLocaleString('de')}</span>
              <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#a0aec0' }}>{fmtKB(ver.bytes)}</span>
              <span style={{ flex: 1 }} />
              {isActive ? (
                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#276749', background: '#fff', border: '1px solid #9ae6b4', borderRadius: 999, padding: '2px 10px' }}>● aktiv ausgeliefert</span>
              ) : canActivate ? (
                <button onClick={() => void onActivate(ver.version)} disabled={isBusy} title={`v${ver.version} aktiv schalten (Rollback)`} style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 5,
                  background: '#fff', color: '#2b6cb0', border: '1px solid #bee3f8', cursor: isBusy ? 'default' : 'pointer',
                }}>{isBusy ? '…' : '↺ aktivieren'}</button>
              ) : (
                <span style={{ fontSize: 10, color: '#cbd5e0', fontFamily: 'monospace' }}>inaktiv</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function V02RegionDetailPanel() {
  const role = useRole();
  const mode = useModeSwitch();
  const activeMode = mode?.activeMode ?? role;
  const live = (mode?.real ?? role) === activeMode && activeMode !== 'analyst';
  const canActivate = live && anthemPublishConfigured();

  const [selectedRegionId, setSelectedRegionId] = useState(REGION_MAP[0].id);
  const region = useMemo(() => REGION_MAP.find((r) => r.id === selectedRegionId) ?? REGION_MAP[0], [selectedRegionId]);

  // Region-Sync mit den Mond-Auswüchsen (ann_051) — unverändert.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scim:v02:region-changed', { detail: selectedRegionId }));
  }, [selectedRegionId]);
  useEffect(() => {
    const onSet = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string' && REGION_MAP.some((r) => r.id === detail)) setSelectedRegionId(detail);
    };
    window.addEventListener('scim:v02:select-region', onSet);
    return () => window.removeEventListener('scim:v02:select-region', onSet);
  }, []);

  if (!anthemReadConfigured()) {
    return (
      <div style={{ padding: 24, color: '#718096', fontSize: 13, fontFamily: 'system-ui' }}>
        Worker nicht konfiguriert (VITE_WORKER_URL) — Versions-Historie kann nicht geladen werden.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {REGION_MAP.map((r) => {
          const isSelected = r.id === selectedRegionId;
          return (
            <button key={r.id} onClick={() => setSelectedRegionId(r.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', fontSize: 12,
              background: isSelected ? '#1e3a5f' : '#fff', color: isSelected ? '#e0eeff' : '#4a5568',
              border: `1px solid ${isSelected ? '#1e3a5f' : '#e2e8f0'}`, borderRadius: 20, cursor: 'pointer',
            }}>
              <img src={r.icon} alt="" width={16} height={16} />
              {r.label}
            </button>
          );
        })}
      </div>

      {region.representations.map((rep) => (
        <RepVersionsSection
          key={rep.id}
          repId={resolveRepId(rep.id)}
          repLabel={rep.label}
          repIcon={rep.icon}
          canActivate={canActivate}
        />
      ))}
    </div>
  );
}
