import { useState, useEffect, useCallback } from 'react';

export interface PackageEntry {
  id: string;
  region_id: string;
  representation_id: string;
  version: string;
  key: string;
  cdn_url: string;
  status: 'draft' | 'active' | 'archived';
  package_id: string;
  release_id: string;
  note: string | null;
  created_at: string;
  activated_at: string | null;
}

const WORKER_URL     = import.meta.env.VITE_WORKER_URL     as string | undefined;
const UPLOAD_API_KEY = import.meta.env.VITE_UPLOAD_API_KEY as string | undefined;

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Scim-Key':   UPLOAD_API_KEY ?? '',
  };
}

export function usePackagesApi(regionId?: string) {
  const [packages, setPackages]   = useState<PackageEntry[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const isConfigured = !!(WORKER_URL && UPLOAD_API_KEY);

  const load = useCallback(async () => {
    if (!isConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const qs  = regionId ? `?region_id=${encodeURIComponent(regionId)}` : '';
      const res = await fetch(`${WORKER_URL}/api/packages${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPackages(await res.json() as PackageEntry[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [isConfigured, regionId]);

  useEffect(() => { void load(); }, [load]);

  const activate = useCallback(async (id: string) => {
    if (!isConfigured) return;
    const res = await fetch(`${WORKER_URL}/api/packages/${id}/activate`, {
      method: 'POST', headers: authHeaders(),
    });
    if (!res.ok) {
      const body = await res.json() as { error: string };
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    await load();
  }, [isConfigured, load]);

  const archive = useCallback(async (id: string) => {
    if (!isConfigured) return;
    const res = await fetch(`${WORKER_URL}/api/packages/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    if (!res.ok) {
      const body = await res.json() as { error: string };
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    await load();
  }, [isConfigured, load]);

  return { packages, loading, error, reload: load, activate, archive, isConfigured };
}
