/**
 * SCIM3 Package Worker
 *
 * Endpoints:
 *   PUT    /api/packages/upload          — Package in R2 + D1 hochladen
 *   GET    /api/packages                 — alle Einträge (filter: region_id, status)
 *   POST   /api/packages/:id/activate    — Version aktivieren, bisherige archivieren
 *   DELETE /api/packages/:id             — Version archivieren
 *   GET    /api/packages/active/:region  — aktive Version einer Region
 *   OPTIONS /*                           — CORS-Preflight
 *
 * Auth:
 *   PUT / POST / DELETE benötigen Header  X-Scim-Key: <UPLOAD_API_KEY>
 *   GET ist öffentlich
 *
 * Query params (PUT):
 *   ?overwrite=true   — Key in R2 überschreiben wenn bereits vorhanden (Standard: 409)
 */

const CDN_BASE      = 'https://cdn.diesenpark.com';
const PACKAGES_PATH = 'packages';
const KEY_PATTERN   = /^[a-z0-9][a-z0-9_-]*$/i;

export interface Env {
  PACKAGES: R2Bucket;
  DB: D1Database;
  UPLOAD_API_KEY: string;
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

    return err('Not found', 404);
  },
} satisfies ExportedHandler<Env>;
