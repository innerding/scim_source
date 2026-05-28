// Tiefen-Tetraeder (Substrat-Tetraeder der Bipyramide, siehe ann_060).
//
// Punkt-nach-unten stehend, langsam rotierend um die vertikale Achse.
// Drei sichtbare Side-Faces sind klickbar und toggeln je eine Navigator-
// Sektion (Package Pipeline, Runtime Builder, Versionen). Stroke-Farben
// folgen der Familie des oberen Tetraeders (RepresentBuildTetrahedron),
// damit die Bipyramide visuell zusammengehoert.
//
// Funktion: Fokus-Instrument. Die Klick-Events sind reine Section-Toggles
// — sie navigieren nicht zu einem Panel, sondern oeffnen/schliessen die
// zugehoerige Liste im Navigator. Siehe ann_051 / ann_068.

import { useEffect, useRef, useState } from 'react';

export type DepthFaceSection = 'package_pipeline' | 'runtime_builder' | 'versionen';

interface Props {
  /** IDs der heute offenen Sektionen — pro Face wird daraus der Aktiv-Stand. */
  openSections: ReadonlySet<string>;
  /** Toggle-Callback fuer eine Section-ID. */
  onToggleSection: (id: DepthFaceSection) => void;
  size?: number;
}

// 3D-Geometrie — Punkt-nach-unten Tetraeder, normalisiert
const TOP_R = 30;       // Radius des oberen Dreiecks
const APEX_Y = 50;      // Apex liegt y = +APEX_Y unter dem oberen Dreieck

// Leichter Tilt nach unten, damit die obere Flaeche als Ellipse sichtbar ist
// und die Bipyramide raeumlich wirkt (statt collapsed-zu-Linie wie reine Ortho).
const TILT_DEG = 18;
const TILT_RAD = (TILT_DEG * Math.PI) / 180;
const COS_T = Math.cos(TILT_RAD);
const SIN_T = Math.sin(TILT_RAD);

function tilt(p: { x: number; y: number; z: number }) {
  return {
    x: p.x,
    y: p.y * COS_T - p.z * SIN_T,
    z: p.y * SIN_T + p.z * COS_T,
  };
}

// Side-Face-Index -> Sektion. Face 0 = top0..top1, Face 1 = top1..top2, Face 2 = top2..top0.
const FACE_TO_SECTION: Record<number, DepthFaceSection> = {
  0: 'package_pipeline',
  1: 'runtime_builder',
  2: 'versionen',
};

// Farbfamilie identisch zum oberen Tetraeder (RepresentBuildTetrahedron, dark).
const STROKE_INACTIVE = '#2d4a6a';
const STROKE_ACTIVE   = '#63b3ed';
const FILL_ACTIVE     = '#2b6cb0';

const SPEED_DEG_PER_SEC = 18;   // 20 s pro vollem Umlauf

export default function NavDepthTetraeder({ openSections, onToggleSection, size = 130 }: Props) {
  const [rotation, setRotation] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setRotation((prev) => (prev + dt * SPEED_DEG_PER_SEC) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Aktueller Vertex-Stand
  const θ = (rotation * Math.PI) / 180;
  const tops = [0, 120, 240].map((base) => {
    const a = θ + (base * Math.PI) / 180;
    return tilt({
      x: Math.cos(a) * TOP_R,
      y: 0,
      z: Math.sin(a) * TOP_R,
    });
  });
  const apex = tilt({ x: 0, y: APEX_Y, z: 0 });

  // 4 Flaechen: top (visuelle Basis) + 3 sides (klickbar)
  const faces = [
    {
      key: 'top',
      vertices: [tops[0], tops[1], tops[2]],
      sectionId: null as DepthFaceSection | null,
    },
    {
      key: 'side-0',
      vertices: [apex, tops[0], tops[1]],
      sectionId: FACE_TO_SECTION[0],
    },
    {
      key: 'side-1',
      vertices: [apex, tops[1], tops[2]],
      sectionId: FACE_TO_SECTION[1],
    },
    {
      key: 'side-2',
      vertices: [apex, tops[2], tops[0]],
      sectionId: FACE_TO_SECTION[2],
    },
  ];

  // Back-to-front fuer korrekte Tiefen-Reihenfolge
  const sorted = faces
    .map((f) => ({
      ...f,
      centroidZ: f.vertices.reduce((s, v) => s + v.z, 0) / f.vertices.length,
    }))
    .sort((a, b) => a.centroidZ - b.centroidZ);

  const polyPoints = (verts: typeof tops) =>
    verts.map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -15 100 75"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {sorted.map((f) => {
        const isActive = f.sectionId !== null && openSections.has(f.sectionId);
        const clickable = f.sectionId !== null;
        return (
          <polygon
            key={f.key}
            points={polyPoints(f.vertices)}
            fill={isActive ? FILL_ACTIVE : 'none'}
            stroke={isActive ? STROKE_ACTIVE : STROKE_INACTIVE}
            strokeWidth={isActive ? 1.0 : 0.8}
            strokeLinejoin="round"
            onClick={clickable && f.sectionId ? () => onToggleSection(f.sectionId!) : undefined}
            style={{
              cursor: clickable ? 'pointer' : 'default',
              opacity: isActive ? 1 : 0.85,
            }}
            className={isActive ? 'rb-active-tile' : undefined}
          >
            <title>
              {f.sectionId === 'package_pipeline' ? 'Package Pipeline (Sektion togglen)' :
               f.sectionId === 'runtime_builder'  ? 'Runtime Builder (Sektion togglen)' :
               f.sectionId === 'versionen'        ? 'Versionen (Sektion togglen)' :
               'Tetraeder-Basis (Substrat)'}
            </title>
          </polygon>
        );
      })}
    </svg>
  );
}
