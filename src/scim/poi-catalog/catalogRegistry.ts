// Catalog-Registry: alle data/<id>_pois_plan.md via Vite-Glob als String
// einlesen und auf Wunsch parsen. Vermeidet Hardcoding pro Region in den
// Konsumenten (Workspace, ScimMap, Wizard, Katalog).
//
// Die Plan-mds liegen im Repo und werden zur Build-Zeit eingebacken. Neue
// Kataloge committen + Auto-Build + Reload = automatisch verfuegbar.

import { parsePoiCatalog } from './poiCatalog.parser';
import type { PoiCatalogState } from './poiCatalog.types';

const planFiles = import.meta.glob<string>(
  '../../../data/*_pois_plan.md',
  { eager: true, query: '?raw', import: 'default' },
);

function idFromPath(path: string): string {
  // '/path/data/gruenberg_pois_plan.md' -> 'gruenberg'
  const file = path.split('/').pop() ?? '';
  return file.replace(/_pois_plan\.md$/i, '');
}

function nameFromId(id: string): string {
  // Heuristik: deutsche Region-Namen restaurieren (gruenberg -> Grünberg).
  const map: Record<string, string> = {
    gruenberg: 'Grünberg',
    lichtenberg: 'Lichtenberg',
  };
  return map[id] ?? (id.charAt(0).toUpperCase() + id.slice(1));
}

export interface CatalogRegistryEntry {
  id: string;
  name: string;
  md: string;
  sourcePath: string;
}

export const CATALOG_REGISTRY: CatalogRegistryEntry[] = Object.entries(planFiles)
  .map(([path, md]) => {
    const id = idFromPath(path);
    return {
      id,
      name: nameFromId(id),
      md,
      sourcePath: `data/${id}_pois_plan.md`,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'de'));

export function catalogEntryById(id: string): CatalogRegistryEntry | undefined {
  return CATALOG_REGISTRY.find((c) => c.id === id);
}

/**
 * Parse einen Katalog auf Wunsch. Wird nicht eager geparst, um den
 * Initial-Bundle schlank zu halten — Konsumenten triggern parsen je
 * nach Bedarf, Memoization machen sie selbst (z.B. via useMemo).
 */
export function parseCatalogById(id: string): PoiCatalogState | null {
  const entry = catalogEntryById(id);
  if (!entry) return null;
  return parsePoiCatalog(entry.md, {
    region_id: entry.id,
    region_name: entry.name,
    source_path: entry.sourcePath,
  });
}
