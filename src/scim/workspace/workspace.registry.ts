// Workspace-Registry: laedt zur Build-Zeit alle Geometrien und Representations
// aus den data/-Verzeichnissen ueber Vite-Glob.
//
// Geometry-Files: data/geometries/*.json (GeoJSON Feature)
// Representation-Files: data/representations/*.json (SCIM-Wrapper)

import type {
  BoundaryGeometry, BoundaryGeometryFile, Representation, RepresentationFile,
  WegnetzFile,
} from './workspace.types';

// ─── Geometrien ─────────────────────────────────────────────────────────────

const geometryModules = import.meta.glob<BoundaryGeometryFile>(
  '../../../data/geometries/*.json',
  { eager: true, import: 'default' },
);

function fileStem(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1].replace(/\.json$/i, '');
}

function buildGeometry(id: string, file: BoundaryGeometryFile): BoundaryGeometry {
  // Outer-Ring extrahieren (erstes Element der coordinates-Array)
  const outerRing = file.geometry?.coordinates?.[0] ?? [];
  return {
    id,
    name: file.properties?.name ?? id,
    region: file.properties?.region,
    nation: file.properties?.nation,
    source: file.properties?.source,
    drawn_at: file.properties?.drawn_at,
    note: file.properties?.note,
    polygon: outerRing,
    raw: file,
  };
}

export const GEOMETRIES: BoundaryGeometry[] = Object.entries(geometryModules)
  .map(([path, file]) => buildGeometry(fileStem(path), file))
  .sort((a, b) => a.name.localeCompare(b.name, 'de'));

export function geometryById(id: string): BoundaryGeometry | undefined {
  return GEOMETRIES.find((g) => g.id === id);
}

// ─── Representations ────────────────────────────────────────────────────────

const representationModules = import.meta.glob<RepresentationFile>(
  '../../../data/representations/*.json',
  { eager: true, import: 'default' },
);

export const REPRESENTATIONS: Representation[] = Object.entries(representationModules)
  .map(([, file]) => file)
  .sort((a, b) => a.name.localeCompare(b.name, 'de'));

export function representationById(id: string): Representation | undefined {
  return REPRESENTATIONS.find((r) => r.id === id);
}

// ─── Wegnetze ───────────────────────────────────────────────────────────────
// Das gespeicherte Wegnetz (edges + gates) einer Representation. Wird im
// Inspector fuer den Routen/Edges-Layer gebraucht.

const wegnetzModules = import.meta.glob<WegnetzFile>(
  '../../../data/wegnetze/*.json',
  { eager: true, import: 'default' },
);

export const WEGNETZE: WegnetzFile[] = Object.entries(wegnetzModules)
  .map(([, file]) => file);

export function wegnetzById(id: string): WegnetzFile | undefined {
  return WEGNETZE.find((w) => w.id === id);
}
