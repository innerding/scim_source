// Editor-Adapter: die Cluster-Render-Mechanik lebt in shell-kit (eine Quelle,
// app/cluster.ts). Hier nur das „Honorieren" — Komposition via poiCompositeSvg aus
// der data/-Registry. Signatur unverändert, ScimMap ruft wie bisher.
import type L from 'leaflet';
import type { CatalogPoi } from '../poi-catalog/poiCatalog.types';
import { poiCompositeSvg } from '../poi-catalog/poiCatalog.composite';
import { renderClusterPois as coreRender, type ClusterMember, type ClusterGhost } from 'shell-kit/cluster';

export function renderClusterPois(
  map: L.Map,
  layer: L.LayerGroup,
  members: CatalogPoi[],
  ghostByCluster: Map<string, CatalogPoi>,
  showIcons: boolean,
): void {
  const m: ClusterMember[] = members.map((p) => ({
    cluster: p.cluster,
    coord: p.coord,
    text: p.text,
    subcategory: p.subcategory,
    renderSvg: (size) => poiCompositeSvg(showIcons ? p.icon : '', p.text, p.subcategory, size) ?? '',
  }));
  const g = new Map<string, ClusterGhost>();
  for (const [name, gp] of ghostByCluster) {
    g.set(name, {
      text: gp.text,
      renderSvg: (size) => poiCompositeSvg(showIcons ? gp.icon : '', gp.text, 'Cluster', size) ?? '',
    });
  }
  coreRender(map, layer, m, g);
}
