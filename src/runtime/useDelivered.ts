// Phase 1 — die „ausgeliefert"-Zahl je Rep: was wirklich auf den Geräten liegt
// (Origin-Bundle in R2, `GET /api/origin/:repId` → version/bundlePublished).
// Gegenstück zur Quell-Version (rep.version). Graceful: Worker nicht erreichbar
// oder nicht konfiguriert → leere Map (kein Alarm, Anzeige fällt auf „—").

import { useEffect, useState } from 'react';
import { fetchOriginMeta, anthemReadConfigured } from './anthemApi';

export interface Delivered {
  version: number | string | null;
  published: boolean;
  uploadedAt: string | null;
}

export function useDeliveredVersions(repIds: string[]): Record<string, Delivered> {
  const [map, setMap] = useState<Record<string, Delivered>>({});
  const key = repIds.slice().sort().join(',');
  useEffect(() => {
    if (!anthemReadConfigured() || repIds.length === 0) return;
    let alive = true;
    void (async () => {
      const entries = await Promise.all(repIds.map(async (id) => {
        try {
          const m = await fetchOriginMeta(id);
          return [id, {
            version: m.version ?? null,
            published: !!m.bundlePublished,
            uploadedAt: m.bundleUploadedAt ?? null,
          }] as const;
        } catch {
          return [id, { version: null, published: false, uploadedAt: null }] as const;
        }
      }));
      if (alive) setMap(Object.fromEntries(entries));
    })();
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return map;
}
