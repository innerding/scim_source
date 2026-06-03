// Auftraggeber-Rep-Resolver — robust, nie leer: löst die aktuell betrachtete
// Representation aus dem Inspector-Asset, fällt sonst auf Lichtenberg/erste zurück.
// Geteilt von PanelWorkspace-Views UND dem globalen Footer (heilt source=<xy>).
import type { Representation } from '../scim/workspace/workspace.types';
import { REPRESENTATIONS } from '../scim/workspace/workspace.registry';
import { useInspectorAsset } from './repContext';

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
  return demoRep;
}
