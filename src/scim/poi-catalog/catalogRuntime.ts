// Laufzeit-Laden des POI-Katalogs (Schritt B).
//
// Der gebündelte ?raw-Import (catalogRegistry / CatalogTab) ist nur noch die
// SAAT: sofort sichtbar, nie leer. Die WAHRHEIT ist die zuletzt nach main
// committete .md — die wird hier zur Laufzeit von GitHub nachgeladen, damit
// „neueste Veröffentlichung" sofort nach Commit greift, ohne auf den Pages-
// Rebuild zu warten und ohne Build-Freeze-Fenster.
//
// Quelle: GitHub Contents-API mit Accept: application/vnd.github.raw — liefert
// die Datei roh, spiegelt Commits in Sekunden (nicht CDN-gecacht), CORS offen,
// ohne Auth (öffentliches Repo, Limit 60 Anfragen/h pro IP — für Operator-
// Reloads reichlich). Bei jedem Fehler: null → Aufrufer bleibt auf der Saat.

const REPO = 'innerding/scim_source';

export type CatalogSource = 'live' | 'bundled' | 'loading';

export async function fetchLatestCatalogMd(regionId: string): Promise<string | null> {
  // regionId ist eine schlichte Kennung (a-z0-9-); kein Pfad-Trickle möglich.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(regionId)) return null;
  const path = `data/${regionId}_pois_plan.md`;
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=main`;
  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/vnd.github.raw' },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const text = await r.text();
    // Plausibilitäts-Mindestcheck: eine POI-Plan-md hat eine Tabelle-1-Sektion.
    if (!/##\s+Tabelle 1\b/.test(text)) return null;
    return text;
  } catch {
    return null;
  }
}
