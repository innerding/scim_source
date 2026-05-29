// Commit-Bridge — Browser-Client fuer Worker /api/commit.
//
// Schreibt eine Wahrheit direkt nach main im Repo, ohne dass der Operator
// ueber Terminal gehen muss. Whitelist liegt im Worker (data/geometries/*.json,
// data/representations/*.json, data/*_pois_plan.md) — Browser-seitig kein
// Pfad-Check, dafuer eindeutige Fehlermeldungen vom Worker.
//
// Auth via VITE_UPLOAD_API_KEY (gleicher Schluessel wie Bundle-Upload).

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined;
const UPLOAD_KEY = import.meta.env.VITE_UPLOAD_API_KEY as string | undefined;

export interface CommitRequest {
  path: string;       // relativ zur Repo-Wurzel, z. B. 'data/geometries/lichtenberg.json'
  content: string;    // Datei-Inhalt als UTF-8-Text
  message: string;    // Commit-Message
}

export interface CommitSuccess {
  ok: true;
  path: string;
  commit_sha: string;
  commit_url: string;
  file_url: string;
  was_update: boolean;
}

export interface CommitFailure {
  ok: false;
  error: string;
  status: number;
}

export type CommitResult = CommitSuccess | CommitFailure;

export async function commitToRepo(req: CommitRequest): Promise<CommitResult> {
  if (!WORKER_URL) {
    return { ok: false, error: 'VITE_WORKER_URL nicht gesetzt', status: 0 };
  }
  if (!UPLOAD_KEY) {
    return { ok: false, error: 'VITE_UPLOAD_API_KEY nicht gesetzt', status: 0 };
  }

  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/api/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Scim-Key': UPLOAD_KEY,
      },
      body: JSON.stringify(req),
    });
  } catch (e) {
    return { ok: false, error: `Netzwerkfehler: ${(e as Error).message}`, status: 0 };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: `Antwort nicht JSON (HTTP ${response.status})`, status: response.status };
  }

  if (!response.ok) {
    const err = (data as { error?: string }).error ?? `HTTP ${response.status}`;
    return { ok: false, error: err, status: response.status };
  }

  return data as CommitSuccess;
}
