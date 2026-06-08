// Anthem-API — der SCIM-seitige Draht zum Worker (Phase 2b, „senden"-Station).
// Spiegelt das Muster von usePackagesApi: WORKER_URL + UPLOAD_API_KEY aus Env.
// Publish (PUT origin-mesh) ist auth-gegated; klopfen/lesen sind öffentlich.

const WORKER_URL     = import.meta.env.VITE_WORKER_URL     as string | undefined;
const UPLOAD_API_KEY = import.meta.env.VITE_UPLOAD_API_KEY as string | undefined;

/** Publish braucht URL + Key; klopfen/lesen nur die URL. */
export const anthemPublishConfigured = () => !!(WORKER_URL && UPLOAD_API_KEY);
export const anthemReadConfigured    = () => !!WORKER_URL;

/** Origin-Mesh (minimal: stretches[{id,points}]) + Load-Thresholds nach R2 veröffentlichen. */
export async function publishOriginMesh(repId: string, net: { stretches: Array<{ id: string; points: [number, number][] }>; norm?: { spread: number; floor: number } }) {
  const res = await fetch(`${WORKER_URL}/api/origin/${repId}/mesh`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Scim-Key': UPLOAD_API_KEY ?? '' },
    body: JSON.stringify(net),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<{ ok: boolean; repId: string; stretches: number }>;
}

/** Volles Origin-Bundle (boundary+net+poi-set+asset-set) nach R2 veröffentlichen — P11-CTA „ausspielen". */
export async function publishOriginBundle(repId: string, bundle: unknown) {
  const res = await fetch(`${WORKER_URL}/api/origin/${repId}/bundle`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Scim-Key': UPLOAD_API_KEY ?? '' },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<{ ok: boolean; repId: string; bytes: number; uploadedAt: string }>;
}

// ── Versions-Bibliothek (V01) — Historie + aktiv + Rollback ──────────────────
export interface OriginVersionEntry { version: number; uploadedAt: string; bytes: number; }
export interface OriginVersions { repId: string; active: number | null; versions: OriginVersionEntry[]; }

/** Versions-Historie einer Rep (alle veröffentlichten Versionen + welche aktiv). Read-only. */
export async function fetchOriginVersions(repId: string): Promise<OriginVersions> {
  const res = await fetch(`${WORKER_URL}/api/origin/${repId}/versions`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<OriginVersions>;
}

/** Eine (ältere) Version wieder aktiv schalten = Rollback. Auth-gegated. */
export async function activateOriginVersion(repId: string, version: number): Promise<void> {
  const res = await fetch(`${WORKER_URL}/api/origin/${repId}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Scim-Key': UPLOAD_API_KEY ?? '' },
    body: JSON.stringify({ version }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

/** regio-asset (Region-/Rep-Icon) in die Cloud (R2) publizieren — für Launcher/Collector. */
export async function publishRegioAsset(id: string, svg: string) {
  const res = await fetch(`${WORKER_URL}/api/regio-assets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/svg+xml', 'X-Scim-Key': UPLOAD_API_KEY ?? '' },
    body: svg,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<{ ok: boolean; id: string }>;
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
  // Auslieferungs-Version + Bundle-Status (Phase 1: „ausgeliefert vM"). Älterer
  // Worker ohne diese Felder → undefined (graceful).
  version?: number | string | null;
  bundlePublished?: boolean;
  bundleUploadedAt?: string | null;
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

// ── Editor-Presence (Mehrbenutzer) ──────────────────────────────────────────
export type EditorRolePresence = { present: boolean; name: string | null; lastSeen: string | null; durationMin: number };
export interface EditorPresence { roles: Record<string, EditorRolePresence> }

/** Heartbeat: die eigene Editor-Rolle (+ Login-Name) als „im System" melden.
 *  Ohne Namen wird die Presence nicht gemeldet — Dauer ist an einen Namen gekoppelt. */
export async function postEditorPresence(role: string, name: string): Promise<void> {
  if (!name) return;   // kein Name → keine Presence/Dauer
  const res = await fetch(`${WORKER_URL}/api/editor/presence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, name }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

/** Welche Editor-Rollen sind gerade im System (read-only). */
export async function fetchEditorPresence(): Promise<EditorPresence> {
  const res = await fetch(`${WORKER_URL}/api/editor/presence`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<EditorPresence>;
}

/** Aktuellen Snapshot ziehen (presence-gegated; 425 wenn kalt). */
export async function fetchAnthem(repId: string, t?: number) {
  const qs = t != null ? `?t=${Math.round(t)}` : '';
  const res = await fetch(`${WORKER_URL}/api/anthem/${repId}${qs}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}
