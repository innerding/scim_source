/**
 * SCIM3 Package Worker
 *
 * Endpoints:
 *   PUT    /api/packages/upload          — Package in R2 + D1 hochladen
 *   GET    /api/packages                 — alle Einträge (filter: region_id, status)
 *   POST   /api/packages/:id/activate    — Version aktivieren, bisherige archivieren
 *   DELETE /api/packages/:id             — Version archivieren
 *   GET    /api/packages/active/:region  — aktive Version einer Region
 *   PUT    /api/origin/:repId/net        — Origin-Netz veröffentlichen (für Anthem-Compute)
 *   GET    /api/origin/:repId            — Origin-Schicht-Status (read-only): published, stretches, bytes, uploadedAt
 *   POST   /api/anthem/:repId/presence   — App klopft: Presence-Session + erster Snapshot
 *   GET    /api/anthem/:repId/presence   — Presence-Status (read-only): present, firstSeen, lastSeen, durationMin
 *   GET    /api/anthem/:repId            — Worker rechnet aktuellen Anthem-Snapshot (presence-gegated)
 *   OPTIONS /*                           — CORS-Preflight
 *
 * Auth:
 *   PUT / POST / DELETE benötigen Header  X-Scim-Key: <UPLOAD_API_KEY>
 *   GET ist öffentlich
 *
 * Query params (PUT):
 *   ?overwrite=true   — Key in R2 überschreiben wenn bereits vorhanden (Standard: 409)
 */

// Geteilte Producer-Engine (EINE Quelle, auch vom Editor genutzt) — „Worker rechnet
// selbst": aus dem veröffentlichten Origin-Netz + (Sim-)Zeit → AnthemSnapshot.
import { produceAnthem } from '../../src/scim/sensus/anthemProducer';
import type { SegmentedNet, NormalizeParams } from '../../src/scim/sensus/anthemSim';

// Veröffentlichtes Origin-Netz: Geometrie + (optional) die mitgelieferten Load-
// Thresholds, damit der Worker bit-gleich zum Editor normalisiert.
type PublishedNet = SegmentedNet & { norm?: NormalizeParams };

const CDN_BASE      = 'https://cdn.diesenpark.com';
const PACKAGES_PATH = 'packages';
const KEY_PATTERN   = /^[a-z0-9][a-z0-9_-]*$/i;
const PRESENCE_TTL_MS = 2 * 60 * 60 * 1000; // 2 h-Hysterese (Anthem-Lebenszyklus)

// (Sim-)Zeit in Minuten: expliziter ?t= Override (Sim/Turbo), sonst echte
// Tageszeit (UTC) ins Fenster 6–20 h geklemmt. Die echte App hat keinen Turbo.
function simMinFromUrl(url: URL): number {
  const t = url.searchParams.get('t');
  if (t != null && t !== '') { const n = Number(t); if (Number.isFinite(n)) return Math.max(0, n); }
  const d = new Date();
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
  return Math.min(20 * 60, Math.max(6 * 60, mins));
}

async function readOriginNet(env: Env, repId: string): Promise<PublishedNet | null> {
  const obj = await env.PACKAGES.get(`origin/${repId}/net.json`);
  if (!obj) return null;
  return await obj.json() as PublishedNet;
}

interface PresenceRec { firstSeen?: string; lastSeen: string }

async function readPresence(env: Env, repId: string): Promise<PresenceRec | null> {
  const obj = await env.PACKAGES.get(`presence/${repId}.json`);
  if (!obj) return null;
  return await obj.json() as PresenceRec;
}

function isWarm(presence: PresenceRec | null): boolean {
  return !!presence && (Date.now() - Date.parse(presence.lastSeen)) <= PRESENCE_TTL_MS;
}

function sessionDurationMin(p: PresenceRec): number {
  if (!p.firstSeen) return 0;
  return Math.max(0, Math.round((Date.parse(p.lastSeen) - Date.parse(p.firstSeen)) / 60000));
}

export interface Env {
  PACKAGES: R2Bucket;
  DB: D1Database;
  UPLOAD_API_KEY: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO?: string;   // default: innerding/scim_source
}

// ── Commit-Bridge ───────────────────────────────────────────────────────────
//
// Operator schreibt Wahrheiten direkt aus dem Browser ins Repo:
//   - data/geometries/<id>.json
//   - data/wegnetze/<id>.json
//   - data/representations/<id>.json
//   - data/<region>_pois_plan.md
//
// Worker ist der Vermittler: authentifiziert via X-Scim-Key, autorisiert die
// Pfad-Whitelist, ruft GitHub Contents API mit PAT (GITHUB_TOKEN). Commit
// landet direkt auf main; CF Pages Auto-Build greift danach.

const DEFAULT_REPO = 'innerding/scim_source';
const COMMIT_PATH_WHITELIST: RegExp[] = [
  /^data\/geometries\/[a-z0-9][a-z0-9_-]*\.json$/,
  /^data\/wegnetze\/[a-z0-9][a-z0-9_-]*\.json$/,
  /^data\/representations\/[a-z0-9][a-z0-9_-]*\.json$/,
  /^data\/[a-z0-9][a-z0-9_-]*_pois_plan\.md$/,
];

function isAllowedCommitPath(p: string): boolean {
  return COMMIT_PATH_WHITELIST.some((re) => re.test(p));
}

interface CommitBody {
  path: string;
  content: string;
  message: string;
}

async function githubGetSha(repo: string, path: string, token: string): Promise<string | null> {
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=main`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'scim3-bundle-worker',
    },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub GET failed: ${r.status} ${await r.text()}`);
  const data = await r.json() as { sha?: string };
  return data.sha ?? null;
}

interface GithubPutResult {
  commit?: { sha?: string; html_url?: string };
  content?: { html_url?: string; sha?: string };
}

async function githubPutFile(
  repo: string, path: string, contentBase64: string, message: string,
  sha: string | null, token: string,
): Promise<GithubPutResult> {
  const body: Record<string, unknown> = {
    message,
    content: contentBase64,
    branch: 'main',
  };
  if (sha) body['sha'] = sha;

  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'scim3-bundle-worker',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    throw new Error(`GitHub PUT failed: ${r.status} ${await r.text()}`);
  }
  return await r.json() as GithubPutResult;
}

function utf8ToBase64(s: string): string {
  // Workers-Runtime: TextEncoder ist standard. btoa() vertraegt nur ASCII.
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

interface PackageRow {
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

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Scim-Key',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function err(message: string, status: number): Response {
  return json({ error: message }, status);
}

function checkAuth(request: Request, env: Env): boolean {
  const key = request.headers.get('X-Scim-Key');
  return !!(env.UPLOAD_API_KEY && key === env.UPLOAD_API_KEY);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const { pathname } = url;

    // ── PUT /api/packages/upload ─────────────────────────────────────────────
    if (request.method === 'PUT' && pathname === '/api/packages/upload') {
      if (!checkAuth(request, env)) return err('Unauthorized', 401);

      let body: Record<string, unknown>;
      try {
        body = await request.json() as Record<string, unknown>;
      } catch {
        return err('Invalid JSON body', 400);
      }

      if (body['schema'] !== 'scim3_bundle_v1') {
        return err('Missing or invalid "schema" field — expected "scim3_bundle_v1"', 422);
      }

      const packageKey = body['key'];
      if (typeof packageKey !== 'string' || !KEY_PATTERN.test(packageKey)) {
        return err('Missing or invalid "key" field (alphanumeric, _ and - only)', 422);
      }

      const regionId         = body['region_id'] ?? (body['region'] as Record<string, unknown>)?.['id'];
      const representationId = body['representation_id'] ?? (body['representation'] as Record<string, unknown>)?.['id'] ?? regionId;
      const packageId        = body['package_id'];
      const releaseId        = body['release_id'];
      if (!regionId || !packageId || !releaseId) {
        return err('Missing required fields: region_id, package_id, release_id', 422);
      }

      // Version aus Key ableiten (letztes Segment nach _)
      const versionMatch = packageKey.match(/_?(v\d+)$/i);
      const version = versionMatch ? versionMatch[1].toLowerCase() : 'v1';

      const r2Key    = `${PACKAGES_PATH}/${packageKey}.json`;
      const overwrite = url.searchParams.get('overwrite') === 'true';

      if (!overwrite) {
        const existing = await env.PACKAGES.head(r2Key);
        if (existing !== null) {
          return err(`Key "${packageKey}" already exists. Use ?overwrite=true to replace.`, 409);
        }
      }

      await env.PACKAGES.put(r2Key, JSON.stringify(body), {
        httpMetadata: {
          contentType: 'application/json',
          cacheControl: 'public, max-age=300',
        },
      });

      const cdnUrl    = `${CDN_BASE}/${r2Key}`;
      const id        = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      await env.DB.prepare(`
        INSERT OR REPLACE INTO packages
          (id, region_id, representation_id, version, key, cdn_url, status, package_id, release_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)
      `).bind(id, String(regionId), String(representationId), version, packageKey, cdnUrl,
               String(packageId), String(releaseId), createdAt).run();

      return json({ url: cdnUrl, key: packageKey, id, status: 'draft' });
    }

    // ── GET /api/packages ────────────────────────────────────────────────────
    if (request.method === 'GET' && pathname === '/api/packages') {
      const regionId         = url.searchParams.get('region_id');
      const representationId = url.searchParams.get('representation_id');
      const status           = url.searchParams.get('status');

      let query = 'SELECT * FROM packages WHERE 1=1';
      const params: string[] = [];

      if (regionId)         { query += ' AND region_id = ?';         params.push(regionId); }
      if (representationId) { query += ' AND representation_id = ?'; params.push(representationId); }
      if (status)           { query += ' AND status = ?';            params.push(status); }
      query += ' ORDER BY created_at DESC';

      const result = await env.DB.prepare(query).bind(...params).all<PackageRow>();
      return json(result.results);
    }

    // ── GET /api/packages/active/:region_id ─────────────────────────────────
    if (request.method === 'GET' && pathname.startsWith('/api/packages/active/')) {
      const regionId = pathname.slice('/api/packages/active/'.length);
      if (!regionId) return err('Missing region_id', 400);

      const row = await env.DB.prepare(
        'SELECT * FROM packages WHERE region_id = ? AND status = ?'
      ).bind(regionId, 'active').first<PackageRow>();

      if (!row) return err(`No active package for region "${regionId}"`, 404);
      return json(row);
    }

    // ── POST /api/packages/:id/activate ─────────────────────────────────────
    if (request.method === 'POST' && pathname.match(/^\/api\/packages\/[^/]+\/activate$/)) {
      if (!checkAuth(request, env)) return err('Unauthorized', 401);

      const id = pathname.split('/')[3];
      const row = await env.DB.prepare(
        'SELECT * FROM packages WHERE id = ?'
      ).bind(id).first<PackageRow>();

      if (!row) return err('Package not found', 404);

      const now = new Date().toISOString();

      // Bisherige aktive Version archivieren
      await env.DB.prepare(
        'UPDATE packages SET status = ? WHERE region_id = ? AND status = ?'
      ).bind('archived', row.region_id, 'active').run();

      // Diese Version aktivieren
      await env.DB.prepare(
        'UPDATE packages SET status = ?, activated_at = ? WHERE id = ?'
      ).bind('active', now, id).run();

      const updated = await env.DB.prepare(
        'SELECT * FROM packages WHERE id = ?'
      ).bind(id).first<PackageRow>();

      return json(updated);
    }

    // ── DELETE /api/packages/:id ─────────────────────────────────────────────
    if (request.method === 'DELETE' && pathname.match(/^\/api\/packages\/[^/]+$/)) {
      if (!checkAuth(request, env)) return err('Unauthorized', 401);

      const id = pathname.split('/')[3];
      const row = await env.DB.prepare(
        'SELECT * FROM packages WHERE id = ?'
      ).bind(id).first<PackageRow>();

      if (!row) return err('Package not found', 404);
      if (row.status === 'active') return err('Active package cannot be archived directly — activate another version first', 409);

      await env.DB.prepare(
        'UPDATE packages SET status = ? WHERE id = ?'
      ).bind('archived', id).run();

      return json({ id, status: 'archived' });
    }

    // ── POST /api/commit ─────────────────────────────────────────────────────
    //
    // Commit-Bridge: schreibt eine Wahrheit aus dem Browser direkt nach
    // data/ im Repo. Pfad-Whitelist verhindert Schreibrechte ausserhalb.
    if (request.method === 'POST' && pathname === '/api/commit') {
      if (!checkAuth(request, env)) return err('Unauthorized', 401);
      if (!env.GITHUB_TOKEN) return err('Server missing GITHUB_TOKEN secret', 500);

      let body: CommitBody;
      try {
        body = await request.json() as CommitBody;
      } catch {
        return err('Invalid JSON body', 400);
      }

      const { path, content, message } = body;
      if (typeof path !== 'string' || !path) return err('Missing "path"', 422);
      if (typeof content !== 'string')        return err('Missing "content"', 422);
      if (typeof message !== 'string' || !message) return err('Missing "message"', 422);
      if (!isAllowedCommitPath(path)) {
        return err(
          `Path "${path}" is not in the commit whitelist (data/geometries/*.json, data/wegnetze/*.json, data/representations/*.json, data/*_pois_plan.md)`,
          403,
        );
      }

      const repo = env.GITHUB_REPO || DEFAULT_REPO;

      try {
        const existingSha = await githubGetSha(repo, path, env.GITHUB_TOKEN);
        const result = await githubPutFile(
          repo, path, utf8ToBase64(content), message, existingSha, env.GITHUB_TOKEN,
        );
        return json({
          ok: true,
          path,
          commit_sha: result.commit?.sha,
          commit_url: result.commit?.html_url,
          file_url: result.content?.html_url,
          file_sha: result.content?.sha,
          was_update: existingSha !== null,
        });
      } catch (e) {
        return err((e as Error).message, 502);
      }
    }

    // ── PUT /api/origin/:repId/net ───────────────────────────────────────────
    // SCIM veröffentlicht das resampelte Origin-Netz (Station „adressieren"),
    // damit der Worker den Anthem selbst rechnen kann. Body = ResampledNet.
    if (request.method === 'PUT' && pathname.match(/^\/api\/origin\/[^/]+\/net$/)) {
      if (!checkAuth(request, env)) return err('Unauthorized', 401);
      const repId = pathname.split('/')[3];
      if (!KEY_PATTERN.test(repId)) return err('Invalid repId', 422);

      let body: unknown;
      try { body = await request.json(); } catch { return err('Invalid JSON body', 400); }
      const stretches = (body as { stretches?: unknown })?.stretches;
      if (!Array.isArray(stretches)) return err('Expected ResampledNet with stretches[]', 422);

      const netJson = JSON.stringify(body);
      await env.PACKAGES.put(`origin/${repId}/net.json`, netJson, {
        httpMetadata: { contentType: 'application/json', cacheControl: 'public, max-age=3600' },
      });
      // Kleines Meta-Objekt für den Publishing-Monitor (V03 t2): ohne das ganze Netz
      // zu laden, weiß der Monitor „veröffentlicht · N Strecken · Größe · wann".
      const meta = { stretches: stretches.length, bytes: netJson.length, uploadedAt: new Date().toISOString() };
      await env.PACKAGES.put(`origin/${repId}/meta.json`, JSON.stringify(meta), {
        httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' },
      });
      return json({ ok: true, repId, ...meta });
    }

    // ── GET /api/origin/:repId ───────────────────────────────────────────────
    // Read-only fürs Publishing-Monitor (V03 t2): ist die Origin-/Anthem-Schicht
    // veröffentlicht (N Strecken · Größe · wann)? Kein Key nötig.
    if (request.method === 'GET' && pathname.match(/^\/api\/origin\/[^/]+$/)) {
      const repId = pathname.split('/')[3];
      if (!KEY_PATTERN.test(repId)) return err('Invalid repId', 422);
      const anthemEndpoint = `/api/anthem/${repId}`;
      const metaObj = await env.PACKAGES.get(`origin/${repId}/meta.json`);
      if (metaObj) {
        const m = await metaObj.json() as { stretches: number; bytes: number; uploadedAt: string };
        return json({ repId, published: true, ...m, anthemEndpoint });
      }
      // Fallback: Netz da, aber (älter) ohne meta → Größe via head.
      const head = await env.PACKAGES.head(`origin/${repId}/net.json`);
      if (head) return json({ repId, published: true, stretches: null, bytes: head.size, uploadedAt: null, anthemEndpoint });
      return json({ repId, published: false, stretches: null, bytes: null, uploadedAt: null, anthemEndpoint });
    }

    // ── POST /api/anthem/:repId/presence ─────────────────────────────────────
    // Die App „klopft" (Station „klopfen"): registriert Presence (startet/erneuert
    // die 2 h-Hysterese) und bekommt sofort den ersten Snapshot zurück.
    if (request.method === 'POST' && pathname.match(/^\/api\/anthem\/[^/]+\/presence$/)) {
      const repId = pathname.split('/')[3];
      if (!KEY_PATTERN.test(repId)) return err('Invalid repId', 422);

      // Session-Logik: läuft die Presence noch warm (Lücke ≤ TTL), bleibt firstSeen
      // erhalten → Dauer wächst; sonst neue Session ab jetzt.
      const lastSeen = new Date().toISOString();
      const prev = await readPresence(env, repId);
      const continues = !!prev && prev.firstSeen != null && isWarm(prev);
      const firstSeen = continues ? prev!.firstSeen! : lastSeen;
      await env.PACKAGES.put(`presence/${repId}.json`, JSON.stringify({ firstSeen, lastSeen }), {
        httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' },
      });

      const net = await readOriginNet(env, repId);
      if (!net) return err(`No published origin-net for "${repId}" — PUT /api/origin/${repId}/net first.`, 404);
      const snapshot = produceAnthem(net, repId, simMinFromUrl(url), net.norm ?? {});
      return json({ ok: true, repId, firstSeen, lastSeen, snapshot });
    }

    // ── GET /api/anthem/:repId/presence ──────────────────────────────────────
    // Read-only fürs Publishing-Monitor (V03 t1) + den globalen Footer: wer ist
    // gerade präsent (date/time/duration). Kein Key nötig.
    if (request.method === 'GET' && pathname.match(/^\/api\/anthem\/[^/]+\/presence$/)) {
      const repId = pathname.split('/')[3];
      if (!KEY_PATTERN.test(repId)) return err('Invalid repId', 422);
      const p = await readPresence(env, repId);
      if (!p) return json({ repId, present: false, firstSeen: null, lastSeen: null, durationMin: 0 });
      return json({
        repId, present: isWarm(p),
        firstSeen: p.firstSeen ?? null, lastSeen: p.lastSeen, durationMin: sessionDurationMin(p),
      });
    }

    // ── GET /api/anthem/:repId ───────────────────────────────────────────────
    // „Worker rechnet selbst" (Station „senden"): aktueller Snapshot aus Origin-
    // Netz + (Sim-)Zeit. Presence-gegated: kalt, wenn niemand seit 2 h geklopft hat.
    if (request.method === 'GET' && pathname.match(/^\/api\/anthem\/[^/]+$/)) {
      const repId = pathname.split('/')[3];
      if (!KEY_PATTERN.test(repId)) return err('Invalid repId', 422);

      if (!isWarm(await readPresence(env, repId))) {
        return err(`Cold — no presence within 2 h. POST /api/anthem/${repId}/presence first.`, 425);
      }
      const net = await readOriginNet(env, repId);
      if (!net) return err(`No published origin-net for "${repId}".`, 404);
      return json(produceAnthem(net, repId, simMinFromUrl(url), net.norm ?? {}));
    }

    return err('Not found', 404);
  },
} satisfies ExportedHandler<Env>;
