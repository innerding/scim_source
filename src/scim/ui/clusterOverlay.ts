// Dynamischer, zoom-abhaengiger Cluster-Ghost fuer die Inspector-Karte.
//
// Verhalten (User-Spec 2026-05-31, siehe memory project-cluster-ghost-map):
//  - Solange die Mitglieder eines Clusters getrennt liegen → einzelne Icons,
//    kein Ghost, kein Ring.
//  - Naehern sich zwei Entitaeten bis auf ~Icon-Breite (Zentren < ANNOUNCE),
//    blendet ein blasser Hexagon-Ring (~33 % Deckkraft) als *Ankuendigung*
//    ueber die beteiligten Icons.
//  - Ueberlappen zwei Icons tatsaechlich (Zentren < SWALLOW), entsteht der
//    *Ghost*: ein eigenes POI (Cluster-Container + Cluster-Icon), das die
//    geschluckten Mitglieder ersetzt. Mit jedem weiteren geschluckten Icon
//    waechst der Ghost ein wenig.
//
// Alles in Pixeln gerechnet → muss bei jedem zoomend/moveend neu laufen.

import L from 'leaflet';
import type { CatalogPoi } from '../poi-catalog/poiCatalog.types';
import { poiCompositeSvg, buildContainerSvgString } from '../poi-catalog/poiCatalog.composite';
import { geometryOf } from '../poi-catalog/poiCatalog.containerSystem';

const ICON = 30;            // Render-Groesse eines Einzel-Icons (px), wie ScimMap POI_SIZE
const SWALLOW = ICON;       // Zentren naeher als das → Icons ueberlappen → Ghost
const ANNOUNCE = ICON * 2;  // Zentren naeher als das → Ankuendigungs-Ring
const GHOST_MIN = 34;
const GHOST_MAX = 56;
const HEX_COLOR = '#ff00ff';

interface Entity {
  x: number;
  y: number;
  members: CatalogPoi[];
}

function markerHtml(svg: string, size: number, opacity = 1): string {
  return `<div style="width:${size}px;height:${size}px;line-height:0;` +
    (opacity < 1 ? `opacity:${opacity};` : 'filter:drop-shadow(0 1px 2px rgba(0,0,0,.55));') +
    `">${svg}</div>`;
}

function placeMarker(
  layer: L.LayerGroup, latlng: L.LatLng, html: string, size: number,
  opts: { interactive?: boolean; z?: number; tooltip?: string } = {},
): void {
  const m = L.marker(latlng, {
    icon: L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
    interactive: opts.interactive ?? true,
    zIndexOffset: opts.z ?? 0,
  });
  if (opts.tooltip) m.bindTooltip(opts.tooltip);
  m.addTo(layer);
}

// Greedy: solange zwei Entitaeten naeher als SWALLOW liegen, zu einer
// (flaechengewichteten) Ghost-Entitaet verschmelzen.
function mergeOverlapping(start: Entity[]): Entity[] {
  let ents = start;
  let merged = true;
  while (merged) {
    merged = false;
    outer:
    for (let i = 0; i < ents.length; i++) {
      for (let j = i + 1; j < ents.length; j++) {
        const d = Math.hypot(ents[i].x - ents[j].x, ents[i].y - ents[j].y);
        if (d < SWALLOW) {
          const a = ents[i], b = ents[j];
          const na = a.members.length, nb = b.members.length;
          const fused: Entity = {
            x: (a.x * na + b.x * nb) / (na + nb),
            y: (a.y * na + b.y * nb) / (na + nb),
            members: [...a.members, ...b.members],
          };
          ents = ents.filter((_, k) => k !== i && k !== j);
          ents.push(fused);
          merged = true;
          break outer;
        }
      }
    }
  }
  return ents;
}

export function renderClusterPois(
  map: L.Map,
  layer: L.LayerGroup,
  members: CatalogPoi[],
  ghostByCluster: Map<string, CatalogPoi>,
  showIcons: boolean,
): void {
  layer.clearLayers();

  const byCluster = new Map<string, CatalogPoi[]>();
  for (const m of members) {
    if (!m.cluster) continue;
    const list = byCluster.get(m.cluster);
    if (list) list.push(m); else byCluster.set(m.cluster, [m]);
  }

  const hexGeo = geometryOf('geo_special_hexagon_ring');

  for (const [clusterName, ms] of byCluster) {
    const ents = mergeOverlapping(ms.map((m) => {
      const p = map.latLngToLayerPoint([m.coord[1], m.coord[0]]);
      return { x: p.x, y: p.y, members: [m] };
    }));
    const ghostPoi = ghostByCluster.get(clusterName);

    for (const e of ents) {
      const latlng = map.layerPointToLatLng(L.point(e.x, e.y));
      if (e.members.length >= 2) {
        // Ghost: Cluster-Container + Cluster-Icon, waechst mit der Anzahl.
        const size = Math.min(GHOST_MAX, GHOST_MIN + (e.members.length - 2) * 5);
        const svg = poiCompositeSvg(showIcons && ghostPoi ? ghostPoi.icon : '', ghostPoi?.text ?? '', 'Cluster', size) ?? '';
        const names = e.members.map((m) => m.text).join(' · ');
        placeMarker(layer, latlng, markerHtml(svg, size), size, {
          z: 1000,
          tooltip: `<strong>${ghostPoi?.text ?? clusterName}</strong><br/>` +
            `<span style="color:#718096">${e.members.length} POIs</span><br/><em>${names}</em>`,
        });
      } else {
        const m = e.members[0];
        const svg = poiCompositeSvg(showIcons ? m.icon : '', m.text, m.subcategory, ICON);
        if (!svg) continue;
        placeMarker(layer, latlng, markerHtml(svg, ICON), ICON, {
          tooltip: `<strong>${m.text}</strong><br/><span style="color:#718096">${m.subcategory}</span>`,
        });
      }
    }

    // Ankuendigung: blasser Hexagon-Ring ueber Paare, die sich naehern
    // (Zentren < ANNOUNCE), aber noch nicht verschmolzen sind (>= SWALLOW).
    if (hexGeo) {
      for (let i = 0; i < ents.length; i++) {
        for (let j = i + 1; j < ents.length; j++) {
          const d = Math.hypot(ents[i].x - ents[j].x, ents[i].y - ents[j].y);
          if (d >= SWALLOW && d < ANNOUNCE) {
            const cx = (ents[i].x + ents[j].x) / 2;
            const cy = (ents[i].y + ents[j].y) / 2;
            const latlng = map.layerPointToLatLng(L.point(cx, cy));
            const ringSize = Math.min(GHOST_MAX + 18, d + ICON);
            const ringInner = buildContainerSvgString(hexGeo, HEX_COLOR).replace('fill="none"', `fill="${HEX_COLOR}"`);
            const ringSvg = `<svg viewBox="0 0 48 48" width="${ringSize}" height="${ringSize}">${ringInner}</svg>`;
            placeMarker(layer, latlng, markerHtml(ringSvg, ringSize, 0.33), ringSize, { interactive: false, z: 500 });
          }
        }
      }
    }
  }
}
