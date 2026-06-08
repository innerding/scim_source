// Pathworks Cross-User (Phase 3): die Einreichungs-Queue über den Server (Worker/R2),
// damit Editor (Gerät A) und Operator (Gerät B) wirklich getrennt arbeiten.
// Editor reicht einen Draft-Snapshot ein → Server; Operator zieht/committet/entfernt.
// Auth = UPLOAD_API_KEY (UX-Gate, wie der Rest); „owner" = angegebener Login-Name.

import type { Draft } from '../scim/workspace/draftStore';

const WORKER_URL     = import.meta.env.VITE_WORKER_URL     as string | undefined;
const UPLOAD_API_KEY = import.meta.env.VITE_UPLOAD_API_KEY as string | undefined;

export const pathworksConfigured = () => !!(WORKER_URL && UPLOAD_API_KEY);
export const pathworksReadConfigured = () => !!WORKER_URL;

export interface Submission {
  id: string;
  repId: string;
  name: string;
  owner: string;
  binding: 'regional' | 'unbound';
  nation?: string;
  region?: string;
  draft: Draft;
  submittedAt: string;
}

export type SubmissionInput = Omit<Submission, 'id' | 'submittedAt'>;

/** Editor reicht einen Draft-Snapshot zur Review ein (auth). Liefert die Server-Id. */
export async function submitToReview(input: SubmissionInput): Promise<string> {
  const res = await fetch(`${WORKER_URL}/api/pathworks/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Scim-Key': UPLOAD_API_KEY ?? '' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const j = await res.json() as { id: string };
  return j.id;
}

/** Operator zieht die Einreichungs-Queue (read-only). */
export async function fetchSubmissions(): Promise<Submission[]> {
  const res = await fetch(`${WORKER_URL}/api/pathworks/submissions`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<Submission[]>;
}

/** Einreichung entfernen — zurückziehen oder nach Commit (auth). */
export async function withdrawSubmission(id: string): Promise<void> {
  const res = await fetch(`${WORKER_URL}/api/pathworks/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Scim-Key': UPLOAD_API_KEY ?? '' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}
