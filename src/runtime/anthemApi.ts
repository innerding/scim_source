// Anthem-API — der SCIM-seitige Draht zum Worker (Phase 2b, „senden"-Station).
// Spiegelt das Muster von usePackagesApi: WORKER_URL + UPLOAD_API_KEY aus Env.
// Publish (PUT origin-net) ist auth-gegated; klopfen/lesen sind öffentlich.

const WORKER_URL     = import.meta.env.VITE_WORKER_URL     as string | undefined;
const UPLOAD_API_KEY = import.meta.env.VITE_UPLOAD_API_KEY as string | undefined;

/** Publish braucht URL + Key; klopfen/lesen nur die URL. */
export const anthemPublishConfigured = () => !!(WORKER_URL && UPLOAD_API_KEY);
export const anthemReadConfigured    = () => !!WORKER_URL;

/** Origin-Netz (minimal: stretches[{id,points}]) nach R2 veröffentlichen. */
export async function publishOriginNet(repId: string, net: { stretches: Array<{ id: string; points: [number, number][] }> }) {
  const res = await fetch(`${WORKER_URL}/api/origin/${repId}/net`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Scim-Key': UPLOAD_API_KEY ?? '' },
    body: JSON.stringify(net),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<{ ok: boolean; repId: string; stretches: number }>;
}

/** Die App „klopft": Presence registrieren + ersten Snapshot zurückbekommen. */
export async function knockPresence(repId: string, t?: number) {
  const qs = t != null ? `?t=${Math.round(t)}` : '';
  const res = await fetch(`${WORKER_URL}/api/anthem/${repId}/presence${qs}`, { method: 'POST' });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<{ ok: boolean; repId: string; lastSeen: string; snapshot: unknown }>;
}

export interface OriginMeta {
  repId: string;
  published: boolean;
  stretches: number | null;
  bytes: number | null;
  uploadedAt: string | null;
  anthemEndpoint: string;
}

/** Origin-/Anthem-Schicht-Status lesen (read-only) — für V03 t2 (Active-Monitor). */
export async function fetchOriginMeta(repId: string): Promise<OriginMeta> {
  const res = await fetch(`${WORKER_URL}/api/origin/${repId}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<OriginMeta>;
}

export interface PresenceStatus {
  repId: string;
  present: boolean;
  firstSeen: string | null;
  lastSeen: string | null;
  durationMin: number;
}

/** Presence-Status lesen (read-only, kein Key) — für V03 t1 + den Footer. */
export async function fetchPresence(repId: string): Promise<PresenceStatus> {
  const res = await fetch(`${WORKER_URL}/api/anthem/${repId}/presence`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<PresenceStatus>;
}

/** Aktuellen Snapshot ziehen (presence-gegated; 425 wenn kalt). */
export async function fetchAnthem(repId: string, t?: number) {
  const qs = t != null ? `?t=${Math.round(t)}` : '';
  const res = await fetch(`${WORKER_URL}/api/anthem/${repId}${qs}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}
