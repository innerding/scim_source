// Tiefen-Tetraeder (Substrat-Tetraeder der Bipyramide, siehe ann_060).
//
// Punkt-nach-unten, langsam rotierend. Drei Side-Faces dienen als
// Section-Toggle (siehe ann_051 / ann_068):
//
//   Face 0 (top0 -> top1)  ->  Sektion "Package Pipeline"
//   Face 1 (top1 -> top2)  ->  Sektion "Runtime Builder"
//   Face 2 (top2 -> top0)  ->  Sektion "Versionen"
//
// Verhalten:
//
//   Ruhe (kein Hover):
//     Rotation laeuft mit SPEED_DEG_PER_SEC. Offene Sektionen erkennt
//     man am Stroke ihrer Face (heller Farbton, dickere Strichstaerke).
//     Pulse-Klasse fuer das Atmen der Open-Faces.
//
//   Hover:
//     Sobald die Maus ueber dem Tetraeder ist, faedelt die Rotation in
//     einen Ease-Out auf den naechsten Voll-Frontal-Winkel einer Face
//     ein und steht dort still. Nur diese Face ist klickbar.
//
//   Klick (nur auf locked Face):
//     toggelt die zugehoerige Sektion (Auf -> Zu, Zu -> Auf).
//
//   Hover-Verlassen:
//     Rotation resumiert vom aktuellen Winkel weiter.

import { useEffect, useRef, useState } from 'react';

export type DepthFaceSection = 'package_pipeline' | 'runtime_builder' | 'versionen';

interface Props {
  /** IDs der offenen Sektionen — pro Face wird daraus der Stroke-Stand. */
  openSections: ReadonlySet<string>;
  /** Toggle-Callback fuer eine Section-ID. */
  onToggleSection: (id: DepthFaceSection) => void;
  size?: number;
}

// 3D-Geometrie — Punkt-nach-unten Tetraeder, normalisiert
const TOP_R = 30;
const APEX_Y = 50;
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

// Side-Face-Index -> Sektion. Face i = (apex, top[i], top[(i+1) % 3]).
const FACE_TO_SECTION: Record<number, DepthFaceSection> = {
  0: 'package_pipeline',
  1: 'runtime_builder',
  2: 'versionen',
};

// Der Voll-Frontal-Winkel pro Face (in Grad). Empirisch: die Face zeigt
// am stillsten zur Kamera, wenn der Mittel-Azimut zwischen ihren beiden
// Top-Vertices auf +90 Grad (Kamera-Richtung) faellt. Mid-Azimuts der
// 3 Faces (0..2): 60, 180, 300. Daraus folgen die theta-Loesungen:
//   Face 0: theta = 30
//   Face 1: theta = 270
//   Face 2: theta = 150
const FACE_FULL_ANGLES: Record<number, number> = { 0: 30, 1: 270, 2: 150 };

const STROKE_INACTIVE  = '#2d4a6a';
const STROKE_OPEN      = '#63b3ed';
const STROKE_W_NORMAL  = 0.8;
const STROKE_W_OPEN    = 1.0;

const SPEED_DEG_PER_SEC = 18;
const LOCK_DURATION_MS  = 700;

interface HoverState {
  startTime: number;
  startAngle: number;
  targetAngle: number;
  faceIdx: number;
}

function nextFaceLock(currentTheta: number): HoverState {
  let bestDelta = Infinity;
  let bestFace = 0;
  for (let i = 0; i < 3; i++) {
    const full = FACE_FULL_ANGLES[i];
    let delta = (((full - currentTheta) % 360) + 360) % 360;
    if (delta < 5) delta = 360;  // direkt davor: nochmal eine Runde drehen
    if (delta < bestDelta) {
      bestDelta = delta;
      bestFace = i;
    }
  }
  return {
    startTime: performance.now(),
    startAngle: currentTheta,
    targetAngle: currentTheta + bestDelta,
    faceIdx: bestFace,
  };
}

export default function NavDepthTetraeder({ openSections, onToggleSection, size = 208 }: Props) {
  const [rotation, setRotation] = useState(0);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const rotationRef = useRef(0);

  // Animations-Loop
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      if (hover) {
        const elapsed = now - hover.startTime;
        if (elapsed >= LOCK_DURATION_MS) {
          rotationRef.current = hover.targetAngle % 360;
          setRotation(rotationRef.current);
          if (!isLocked) setIsLocked(true);
        } else {
          const t = elapsed / LOCK_DURATION_MS;
          const easeOut = 1 - Math.pow(1 - t, 3);
          const angle = hover.startAngle + (hover.targetAngle - hover.startAngle) * easeOut;
          rotationRef.current = angle % 360;
          setRotation(rotationRef.current);
        }
      } else {
        const dt = (now - last) / 1000;
        rotationRef.current = (rotationRef.current + dt * SPEED_DEG_PER_SEC) % 360;
        setRotation(rotationRef.current);
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hover, isLocked]);

  const onMouseEnter = () => {
    if (hover) return;
    setHover(nextFaceLock(rotationRef.current));
    setIsLocked(false);
  };
  const onMouseLeave = () => {
    setHover(null);
    setIsLocked(false);
  };

  // Vertex-Positions je aktuellem Winkel
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

  const faces = [
    { key: 'top',    vertices: [tops[0], tops[1], tops[2]], sectionId: null as DepthFaceSection | null, faceIdx: -1 },
    { key: 'side-0', vertices: [apex, tops[0], tops[1]],     sectionId: FACE_TO_SECTION[0],              faceIdx: 0 },
    { key: 'side-1', vertices: [apex, tops[1], tops[2]],     sectionId: FACE_TO_SECTION[1],              faceIdx: 1 },
    { key: 'side-2', vertices: [apex, tops[2], tops[0]],     sectionId: FACE_TO_SECTION[2],              faceIdx: 2 },
  ];

  const sorted = faces
    .map((f) => ({ ...f, centroidZ: f.vertices.reduce((s, v) => s + v.z, 0) / f.vertices.length }))
    .sort((a, b) => a.centroidZ - b.centroidZ);

  const polyPoints = (verts: typeof tops) =>
    verts.map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');

  const lockedFaceIdx = isLocked && hover ? hover.faceIdx : null;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ display: 'inline-block', lineHeight: 0 }}
    >
    <svg
      width={size}
      height={size}
      viewBox="-50 -15 100 75"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {sorted.map((f) => {
        const isOpenFace = f.sectionId !== null && openSections.has(f.sectionId);
        const isLockedFace = f.faceIdx === lockedFaceIdx;
        const clickable = isLockedFace && f.sectionId !== null;
        return (
          <polygon
            key={f.key}
            points={polyPoints(f.vertices)}
            fill="none"
            stroke={isOpenFace ? STROKE_OPEN : STROKE_INACTIVE}
            strokeWidth={isOpenFace ? STROKE_W_OPEN : STROKE_W_NORMAL}
            strokeLinejoin="round"
            onClick={clickable && f.sectionId ? () => onToggleSection(f.sectionId!) : undefined}
            style={{
              cursor: clickable ? 'pointer' : 'default',
              opacity: isOpenFace ? 1 : 0.85,
              pointerEvents: clickable ? 'all' : 'none',
              transition: 'stroke 200ms ease-out, stroke-width 200ms ease-out',
            }}
            className={isOpenFace ? 'rb-active-tile' : undefined}
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
    </div>
  );
}
