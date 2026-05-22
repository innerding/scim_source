/**
 * SCIM3 Bundle Worker
 *
 * Endpoints:
 *   POST /bundle          — Bundle hochladen, gibt { url, id, expires_at } zurück
 *   GET  /bundle/:id      — Bundle abrufen (öffentlich, für Ziel-App)
 *   OPTIONS /*            — CORS-Preflight
 *
 * Auth:
 *   POST benötigt Header  X-Scim-Key: <UPLOAD_API_KEY>
 *   GET  ist öffentlich (Bundle ist bereits privacy-verifiziert)
 *
 * Storage:
 *   Cloudflare KV, TTL 30 Tage
 */

export interface Env {
  BUNDLES: KVNamespace;
  UPLOAD_API_KEY: string;
}

const BUNDLE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 Tage

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // ── POST /bundle — Bundle hochladen ──────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/bundle') {
      // Auth
      const key = request.headers.get('X-Scim-Key');
      if (!env.UPLOAD_API_KEY || key !== env.UPLOAD_API_KEY) {
        return err('Unauthorized', 401);
      }

      // JSON parsen
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return err('Invalid JSON body', 400);
      }

      // Minimale Validierung: muss schema-Feld haben
      if (typeof body !== 'object' || body === null ||
          (body as Record<string, unknown>)['schema'] !== 'scim3_bundle_v1') {
        return err('Not a valid scim3_bundle_v1', 422);
      }

      // Speichern
      const id = crypto.randomUUID();
      await env.BUNDLES.put(id, JSON.stringify(body), {
        expirationTtl: BUNDLE_TTL_SECONDS,
      });

      const bundleUrl  = `${url.origin}/bundle/${id}`;
      const expiresAt  = new Date(Date.now() + BUNDLE_TTL_SECONDS * 1000).toISOString();

      return json({ url: bundleUrl, id, expires_at: expiresAt });
    }

    // ── GET /bundle/:id — Bundle abrufen ─────────────────────────────────────
    if (request.method === 'GET' && url.pathname.startsWith('/bundle/')) {
      const id = url.pathname.slice('/bundle/'.length);
      if (!id) return err('Missing bundle id', 400);

      const data = await env.BUNDLES.get(id);
      if (!data) return err('Bundle not found or expired', 404);

      return new Response(data, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type':        'application/json',
          'Cache-Control':       'public, max-age=300',
          'Content-Disposition': `attachment; filename="scim3_bundle_${id.slice(0, 8)}.json"`,
        },
      });
    }

    return err('Not found', 404);
  },
} satisfies ExportedHandler<Env>;
