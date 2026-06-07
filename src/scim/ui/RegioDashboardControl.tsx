// RegioDashboardControl — die Navigations-Drehscheibe der 4 Regio-Dashboard-Panels.
// Basiert auf dem Represent-Build-Tetraeder im Dashboard-Modus (keine Bögen, größere
// Faces, Apex = Thresholds statt Sensus-Core-Publishing). Sicheln bleiben (Zusatzfunktion).
//
// Face ↔ Panel:
//   geometry_draw         ↔ geometry_editor (Drawer)
//   catalog_magazination  ↔ catalog (Katalog)
//   represent_organisation↔ workspace (Pathworks Hub)
//   sensus_core_build     ↔ P01 (Thresholds)  ← im Dashboard als „Thresholds" beschriftet
import RepresentBuildTetrahedron from './RepresentBuildTetrahedron';
import type { RepresentBuildFace, RepresentBuildSickle } from './RepresentBuildTetrahedron';

const FACE_TO_PANEL: Record<RepresentBuildFace, string> = {
  geometry_draw: 'geometry_editor',
  catalog_magazination: 'catalog',
  represent_organisation: 'workspace',
  sensus_core_build: 'P01',
};
const PANEL_TO_FACE: Record<string, RepresentBuildFace> = {
  geometry_editor: 'geometry_draw',
  catalog: 'catalog_magazination',
  workspace: 'represent_organisation',
  P01: 'sensus_core_build',
};
// Sichel-Zusatzfunktionen → Zielpanel (Vorschlag): Vorschau · Publish · Versionen.
const SICKLE_TO_PANEL: Record<RepresentBuildSickle, string> = {
  boundary: 'V03',          // Vorschau am Gerät (Monitor/QR)
  engine_prep: 'P11',       // Publish / Transfer (Sensus Core)
  wegnetz_sampling: 'V01',  // Versionen / Verlauf (All-Publications)
};

export default function RegioDashboardControl({
  activeId, onJumpTo, size = 116, variant = 'light', arcsDeco = false,
}: {
  activeId: string;
  onJumpTo: (panelId: string) => void;
  size?: number;
  variant?: 'dark' | 'light';
  arcsDeco?: boolean;   // REP-Manufactur: Bögen als blasse Deko zeigen
}) {
  const activeFace = PANEL_TO_FACE[activeId];
  return (
    <RepresentBuildTetrahedron
      dashboard
      arcsDeco={arcsDeco}
      showLabels
      size={size}
      variant={variant}
      activeFace={activeFace}
      onFaceClick={(f) => {
        const panel = FACE_TO_PANEL[f];
        if (panel) onJumpTo(panel);
      }}
      onSickleClick={(sk) => {
        const panel = SICKLE_TO_PANEL[sk];
        if (panel) onJumpTo(panel);
      }}
    />
  );
}
