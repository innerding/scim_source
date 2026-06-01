// buildOriginPackage — der erste, kleine Sensus-Core-Resolver.
//
// Nimmt eine committete Representation und löst ihre Origin-particles auf —
// die MITTELfristigen Daten (origin-boundary · origin-net · origin-poi-set ·
// origin-asset-set), die Sensus Core ins Origin-Paket schnürt. Reine Funktion
// über vorhandene Daten; liefert reale Byte-Größen (UTF-8), damit die P11-
// Ansicht echte Zahlen statt Platzhalter zeigt.
//
// Bewusst klein: nur Origin (die auflösbaren Daten). Shell (Engines) und Anthem
// (Laufzeit/Atem) sind kein auflösbares Representations-Datum → später separat.

import type { Representation } from '../workspace/workspace.types';
import { geometryById, wegnetzById } from '../workspace/workspace.registry';
import { parseCatalogById } from '../poi-catalog/catalogRegistry';
import { iconById } from '../poi-catalog/iconRegistry';
import { resolveIcon } from '../poi-catalog/poiCatalog.composite';

export interface OriginParticle {
  id: string;        // 'origin-boundary' …
  label: string;     // Anzeigename
  bytes: number;     // reale UTF-8-Größe
  detail: string;    // z.B. '648 Kanten'
}

export interface OriginPackage {
  repId: string;
  repName: string;
  version: number;
  particles: OriginParticle[];   // die Origin-(mid-)particles
  totalBytes: number;
}

function utf8Bytes(s: string): number {
  return new TextEncoder().encode(s).length;
}

// Löst die Origin-particles einer Representation auf. Fehlende FKs werden
// stillschweigend übersprungen (das Particle erscheint dann nicht).
export function buildOriginPackage(rep: Representation): OriginPackage {
  const particles: OriginParticle[] = [];

  // origin-boundary — der Außenring der Geometrie
  const geo = rep.geometry_id ? geometryById(rep.geometry_id) : undefined;
  if (geo) {
    const ring = geo.polygon ?? [];
    particles.push({
      id: 'origin-boundary', label: 'origin-boundary',
      bytes: utf8Bytes(JSON.stringify(ring)), detail: `${ring.length} Punkte`,
    });
  }

  // origin-net — das gespeicherte Wegnetz (Kanten + Gates)
  const net = rep.wegnetz_id ? wegnetzById(rep.wegnetz_id) : undefined;
  if (net) {
    const edgeCount = Array.isArray(net.edges) ? net.edges.length : 0;
    particles.push({
      id: 'origin-net', label: 'origin-net (wegnetz-sample)',
      bytes: utf8Bytes(JSON.stringify(net)), detail: `${edgeCount} Kanten`,
    });
  }

  // Katalog → origin-poi-set (POI-Daten) + origin-asset-set (Icon-SVGs)
  const cat = rep.catalog_id ? parseCatalogById(rep.catalog_id) : null;
  if (cat) {
    const pois = cat.pois ?? [];
    particles.push({
      id: 'origin-poi-set', label: 'origin-poi-set',
      bytes: utf8Bytes(JSON.stringify(pois)), detail: `${pois.length} POIs`,
    });

    // asset-set: distinkte, aufgelöste Icons → svg_cleaned eingebettet
    const iconIds = new Set<string>();
    for (const p of pois) {
      const { iconId } = resolveIcon(p.icon);
      if (iconById(iconId)) iconIds.add(iconId);
    }
    let assetBytes = 0;
    for (const id of iconIds) {
      const entry = iconById(id);
      if (entry) assetBytes += utf8Bytes(entry.svg_cleaned);
    }
    particles.push({
      id: 'origin-asset-set', label: 'origin-asset-set (Icons eingebettet)',
      bytes: assetBytes, detail: `${iconIds.size} Icons`,
    });
  }

  return {
    repId: rep.id,
    repName: rep.name,
    version: rep.version ?? 1,
    particles,
    totalBytes: particles.reduce((s, p) => s + p.bytes, 0),
  };
}
