// V01 · Versions-Bibliothek (Mond-Scheibe) — das ARCHIV der veröffentlichten
// Origin-Versionen je Rep + welche aktiv ausgeliefert ist + Rollback („aktivieren v3").
// Gegenstück zum Drossel-Monitor (V03 t4 = Release-Schleuse/Jetzt): hier die Historie.
// Liest den Origin-Pfad (GET /api/origin/:repId/versions) — EINE Quelle mit dem
// Release/Drossel, nicht mehr der alte ScimBundle-Pfad.
import { useEffect, useMemo, useState } from 'react';
import { AppManifestBadge } from '../AppManifestInfo';
import { useRole, useModeSwitch } from '../RoleContext';
import { REPRESENTATIONS, geometryById } from '../../workspace/workspace.registry';
import {
  fetchOriginVersions, activateOriginVersion, anthemReadConfigured, anthemPublishConfigured,
  type OriginVersions,
} from '../../../runtime/anthemApi';
import packagesIcon    from '../../../assets/Packages.svg';
import skgIcon         from '../../../assets/SKG.svg';
import gruenbergIcon   from '../../../assets/Grünberg.svg';
import boehmerwaldIcon from '../../../assets/Böhmerwald.svg';
import lichtenbergIcon from '../../../assets/Lichtenberg.svg';
import salzburgIcon    from '../../../assets/Salzburg.svg';
import gaisbergIcon    from '../../../assets/Gaisberg.svg';

export const REGION_MAP = [
  { id: 'skg', label: 'Salzkammergut', icon: skgIcon, representations: [{ id: 'gruenberg', label: 'Grünberg', icon: gruenbergIcon }] },
  { id: 'böhmerwald', label: 'Böhmerwald', icon: boehmerwaldIcon, representations: [{ id: 'lichtenberg', label: 'Lichtenberg', icon: lichtenbergIcon }] },
  { id: 'salzburg', label: 'Salzburg', icon: salzburgIcon, representations: [{ id: 'gaisberg', label: 'Gaisberg', icon: gaisbergIcon }] },
];

export function representationIcon(representationId: string): string | undefined {
  for (const region of REGION_MAP) {
    const rep = region.representations.find((r) => representationId.toLowerCase().includes(r.id.toLowerCase()));
    if (rep) return rep.icon;
  }
  return undefined;
}

const fmtKB = (n: number) => `${(n / 1024).toFixed(1)} kB`;

export default function V01PackagesPanel() {
  const role = useRole();
  const mode = useModeSwitch();
  const activeMode = mode?.activeMode ?? role;
  const live = (mode?.real ?? role) === activeMode && activeMode !== 'analyst';
  const readConfigured = anthemReadConfigured();
  const canActivate = live && anthemPublishConfigured();

  const repList = useMemo(() => REPRESENTATIONS.map((r) => ({
    id: r.id, name: r.name, region: r.geometry_id ? geometryById(r.geometry_id)?.region : undefined,
  })), []);
  const [data, setData] = useState<Record<string, OriginVersions>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!readConfigured) return;
    setLoading(true); setError(null);
    try {
      const entries = await Promise.all(repList.map(async (r) => {
        try { return [r.id, await fetchOriginVersions(r.id)] as const; }
        catch { return [r.id, { repId: r.id, active: null, versions: [] }] as const; }
      }));
      setData(Object.fromEntries(entries));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onActivate = async (repId: string, version: number) => {
    setBusy(`${repId}#${version}`); setError(null);
    try { await activateOriginVersion(repId, version); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };

  const withVersions = repList.map((r) => ({ ...r, v: data[r.id] })).filter((r) => (r.v?.versions.length ?? 0) > 0);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <img src={packagesIcon} alt="" width={32} height={32} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a365d' }}>Versions-Bibliothek</div>
          <div style={{ fontSize: 11, color: '#718096' }}>Historie der ausgespielten Origin-Versionen · aktiv · Rollback</div>
        </div>
        {role === 'operator' && <span style={{ marginLeft: 'auto' }}><AppManifestBadge /></span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <button onClick={() => void load()} disabled={loading || !readConfigured} style={{
          padding: '9px 22px', fontSize: 13, fontWeight: 700,
          background: loading ? '#bee3f8' : readConfigured ? '#2b6cb0' : '#cbd5e0', color: '#fff',
          border: '1px solid #2b6cb0', borderRadius: 8, cursor: loading || !readConfigured ? 'default' : 'pointer',
          boxShadow: '0 1px 3px rgba(43,108,176,0.25)',
        }}>{loading ? '… lädt' : '↺ Bibliothek laden'}</button>
      </div>

      {!readConfigured && (
        <div style={{ padding: '8px 12px', background: '#feebc8', border: '1px solid #fbd38d', borderRadius: 6, color: '#7b341e', fontSize: 12, marginBottom: 16 }}>
          Worker nicht konfiguriert (VITE_WORKER_URL) — Bibliothek kann nicht geladen werden.
        </div>
      )}
      {error && (
        <div style={{ padding: '8px 12px', background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 6, color: '#975a16', fontSize: 12, marginBottom: 16 }}>{error}</div>
      )}

      {readConfigured && !loading && withVersions.length === 0 && (
        <div style={{ color: '#a0aec0', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
          Noch keine Version veröffentlicht. Im Operator-Baum bzw. Drossel-Monitor „ausliefern" → erscheint hier.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {withVersions.map((r) => {
          const repIcon = representationIcon(r.id);
          const active = r.v?.active ?? null;
          return (
            <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {repIcon && <img src={repIcon} alt="" width={18} height={18} />}
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1a202c' }}>{r.name}</span>
                <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#a0aec0' }}>{r.region ?? '—'}</span>
                <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#a0aec0', marginLeft: 'auto' }}>{r.v?.versions.length} Version(en)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {r.v?.versions.map((ver) => {
                  const isActive = ver.version === active;
                  const isBusy = busy === `${r.id}#${ver.version}`;
                  return (
                    <div key={ver.version} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6,
                      background: isActive ? '#f0fff4' : '#f7fafc', border: `1px solid ${isActive ? '#9ae6b4' : '#edf2f7'}`,
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#2d3748', minWidth: 34 }}>v{ver.version}</span>
                      <span style={{ fontSize: 10.5, color: '#718096' }}>{new Date(ver.uploadedAt).toLocaleString('de')}</span>
                      <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#a0aec0' }}>{fmtKB(ver.bytes)}</span>
                      <span style={{ flex: 1 }} />
                      {isActive ? (
                        <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#276749', background: '#fff', border: '1px solid #9ae6b4', borderRadius: 999, padding: '1px 9px' }}>● aktiv ausgeliefert</span>
                      ) : canActivate ? (
                        <button onClick={() => void onActivate(r.id, ver.version)} disabled={isBusy} title={`v${ver.version} aktiv schalten (Rollback)`} style={{
                          fontSize: 10.5, fontWeight: 700, padding: '3px 11px', borderRadius: 5,
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
        })}
      </div>
    </div>
  );
}
