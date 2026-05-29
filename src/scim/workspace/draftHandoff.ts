// Draft-Lifecycle Drawer↔Workspace (Umbauplan E).
//
// Der Drawer committet eine Representation NICHT mehr selbst ins Repo, sondern
// uebergibt einen Snapshot (Boundary + Masken-Boundary + abgeleitetes Wegnetz +
// Gate-Knoten) an den Workspace. Der Workspace ist das atomare Verbund-Commit-
// Gate (Umbauplan F) — er buendelt Boundary, Katalog-Bindung und Wegnetz in
// EINEM Schritt.
//
// Bewusst ein EIGENER localStorage-Key, getrennt vom Live-Editier-Draft
// (scim3_geometry_draft): die Uebergabe ist ein expliziter Schnappschuss zum
// Uebergabe-Zeitpunkt und darf nicht von der laufenden Auto-Speicherung des
// Drawers ueberschrieben werden.

import type { Position } from 'geojson';
import type { PathEdge, GateNode } from '../regio-content/pathEngine';

export const HANDOFF_KEY = 'scim3_represent_handoff';

export interface HandoffNet {
  gebiet: string;          // Inspector-R-Geometry-id, fuer die das Netz gebaut wurde
  gebietName: string;
  edges: PathEdge[];       // nur Netz-Kanten (inNet); gekappt, falls maskiert
  gates: GateNode[];       // inner-/outer-gate-Knoten (leer wenn nicht maskiert)
  cropped: boolean;        // wurde mit der Slot-2-Maske zugeschnitten?
  primaryCount: number;
  connectorCount: number;
}

export interface RepresentHandoff {
  name: string;
  region: string;
  boundaryPolygon: Position[];          // Slot 1 — die finale/editierbare Boundary
  maskPolygon: Position[] | null;       // Slot 2 — die Masken-Boundary (optional)
  net: HandoffNet | null;               // abgeleitetes Wegnetz (optional)
  handedOffAt: number;
}

export function saveHandoff(h: RepresentHandoff): void {
  try { localStorage.setItem(HANDOFF_KEY, JSON.stringify(h)); } catch { /* ignore */ }
}

export function loadHandoff(): RepresentHandoff | null {
  try {
    const raw = localStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const h = JSON.parse(raw) as RepresentHandoff;
    if (!h.boundaryPolygon || h.boundaryPolygon.length < 3) return null;
    return h;
  } catch { return null; }
}

export function clearHandoff(): void {
  try { localStorage.removeItem(HANDOFF_KEY); } catch { /* ignore */ }
}
