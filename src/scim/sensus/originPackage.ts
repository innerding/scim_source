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
import { containerOf } from '../poi-catalog/poiCatalog.containerSystem';
import { resampleNet, type ResampledNet } from '../wegnetz/netResample';

// MVP-Zielsegmentlänge fürs origin-net (Beschluss): 10 m — Geometrie ≈ roh,
// Atem (Load-Array) ~6 kB / 5 Min. 3 m wäre Detail-Untergrenze (Geometrie
// explodiert), 25 m gröber/kleiner. Ein Knopf, falls wir's später drehen.
export const MVP_RESAMPLE_TARGET_METERS = 10;

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
  originNet?: ResampledNet;       // das resampelte Netz (Geometrie + Segment-ids)
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

  // origin-net — das RESAMPELTE Netz (gleich lange Segmente @MVP-Target). Das
  // ausgespielte Netz ist die gesampelte Geometrie, nicht der Drawer-Rohstand;
  // die Segment-ids sind der Index, den das Anthem-Load-Array adressiert.
  const net = rep.wegnetz_id ? wegnetzById(rep.wegnetz_id) : undefined;
  let originNet: ResampledNet | undefined;
  if (net) {
    originNet = resampleNet(net.edges, { targetMeters: MVP_RESAMPLE_TARGET_METERS });
    particles.push({
      id: 'origin-net', label: `origin-net (resampled @${MVP_RESAMPLE_TARGET_METERS} m)`,
      bytes: originNet.geometryBytes,
      detail: `${originNet.segmentCount} Segmente · ${originNet.stretchCount} Strecken`,
    });
  }

  // Katalog → origin-poi-set (POI-Daten) + origin-asset-set (Icon-SVGs)
  const cat = rep.catalog_id ? parseCatalogById(rep.catalog_id) : null;
  if (cat) {
    const pois = cat.pois ?? [];
    // Container-Katalog-Pfad: der Capsuler löst den Container-Schlüssel je POI
    // VORAB auf (Subkategorie → Geometrie + Farbe) und hängt ihn ans poi-set.
    // So bekommt die Deep-Shell-Container-Engine fertig zuordenbare POIs und
    // bleibt generisch — sie benutzt den Capsulator als Vehikel (spart Abgleich).
    const poiSet = pois.map((p) => {
      const c = containerOf(p.subcategory);
      return c ? { ...p, container: { geometry_id: c.geometry_id, color: c.color } } : p;
    });
    const withKey = poiSet.filter((p) => 'container' in p).length;
    particles.push({
      id: 'origin-poi-set', label: 'origin-poi-set',
      bytes: utf8Bytes(JSON.stringify(poiSet)),
      detail: `${pois.length} POIs · ${withKey} mit Container-Schlüssel`,
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
    originNet,
  };
}
