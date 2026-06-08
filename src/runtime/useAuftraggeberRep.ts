// Auftraggeber-Rep-Resolver — robust, nie leer: löst die aktuell betrachtete
// Representation aus dem Inspector-Asset, fällt sonst auf Lichtenberg/erste zurück.
// Geteilt von PanelWorkspace-Views UND dem globalen Footer (heilt source=<xy>).
import type { Representation } from '../scim/workspace/workspace.types';
import { REPRESENTATIONS, geometryById } from '../scim/workspace/workspace.registry';
import { useInspectorAsset } from './repContext';
import { slugify } from './router';

export function useAuftraggeberRep(): Representation {
  const asset = useInspectorAsset();
  const demoRep = REPRESENTATIONS.find((r) => /lichtenberg/i.test(r.id) || /lichtenberg/i.test(r.name)) ?? REPRESENTATIONS[0];
  if (asset?.kind === 'representation') {
    const r = REPRESENTATIONS.find((x) => x.id === asset.id);
    if (r) return r;
  }
  if (asset?.kind === 'geometry') {
    const r = REPRESENTATIONS.find((x) => x.geometry_id === asset.id);
    if (r) return r;
  }
  // Katalog-Asset (z.B. von einem Editor-Draft gebunden): die Rep mit diesem
  // Katalog finden → ihre Region treibt Thresholds. So folgt die Farb-Säule auch
  // einem katalog-gebundenen Draft (gleiche Region wie die committete Rep).
  if (asset?.kind === 'catalog') {
    const r = REPRESENTATIONS.find((x) => x.catalog_id === asset.id);
    if (r) return r;
  }
  return demoRep;
}

/**
 * Region-Slug der PUBLIZIERTEN Rep — exakt wie buildOriginBundle ihn bildet.
 * EINE Quelle für Farb-Tuning (P01) UND Vorschau UND Publish → kein Schlüssel-
 * Mismatch mehr (vorher: P01 = Inspector-Region, Bundle = Auftraggeber-Region).
 */
export function useColourRegionSlug(): string {
  const rep = useAuftraggeberRep();
  const geo = rep.geometry_id ? geometryById(rep.geometry_id) : undefined;
  return slugify(geo?.region ?? '') || 'default';
}
