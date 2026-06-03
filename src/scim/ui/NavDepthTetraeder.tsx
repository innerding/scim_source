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

interface Props {
  /** Aktives Panel — hebt die zugeordnete Face hervor. */
  activeId: string;
  /** Klick auf eine Face navigiert zum zugeordneten Panel. */
  onFaceClick: (panelId: string) => void;
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

// Position-basiertes Panel-Mapping fuer die 3 sichtbaren 2D-Regionen — die
// Heimat des Operators (vom Row-Open/Close entbunden). Upper (oben) = AI-Interface,
// Lower-Left = Operator-Zonen (P05), Lower-Right = System.
const REGION_UPPER_PANEL = 'ai_interface';
const REGION_LOWER_LEFT_PANEL = 'P05';
const REGION_LOWER_RIGHT_PANEL = 'system';

// Der Voll-Frontal-Winkel pro Face (in Grad). Empirisch: die Face zeigt
// am stillsten zur Kamera, wenn der Mittel-Azimut zwischen ihren beiden
// Top-Vertices auf +90 Grad (Kamera-Richtung) faellt. Mid-Azimuts der
// 3 Faces (0..2): 60, 180, 300. Daraus folgen die theta-Loesungen:
//   Face 0: theta = 30
//   Face 1: theta = 270
//   Face 2: theta = 150
const FACE_FULL_ANGLES: Record<number, number> = { 0: 30, 1: 270, 2: 150 };

const STROKE_INACTIVE  = '#2d4a6a';
const STROKE_W_NORMAL  = 0.8;

const SPEED_DEG_PER_SEC      = 13.5;   // 18 * 0.75 — 25% langsamer
const LOCK_DURATION_MS       = 700;
const RESUME_RAMP_MS         = 2200;   // sanfter Ease-In nach Hover-Ende
const HOVER_ENTER_DELAY_MS   = 250;    // Maus muss bleiben, sonst keine Reaktion
const HOVER_LEAVE_GRACE_MS   = 100;    // kurzes Wegziehen + Rueckkehr haelt Lock

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

export default function NavDepthTetraeder({ activeId, onFaceClick, size = 208 }: Props) {
  const [rotation, setRotation] = useState(0);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const rotationRef = useRef(0);
  const resumeStartRef = useRef<number | null>(null);  // wann Ease-In-Resume gestartet wurde

  // Animations-Loop. Drei Phasen:
  //   1) hover != null  -> Decelerate (Ease-Out) zum Lock-Winkel
  //   2) resumeStartRef -> Sanfter Ease-In von 0 zurueck auf Basis-Tempo
  //   3) sonst          -> Konstante Rotation mit Basis-Tempo
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
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
      } else if (resumeStartRef.current !== null) {
        const elapsed = now - resumeStartRef.current;
        if (elapsed >= RESUME_RAMP_MS) {
          resumeStartRef.current = null;
          rotationRef.current = (rotationRef.current + dt * SPEED_DEG_PER_SEC) % 360;
        } else {
          const t = elapsed / RESUME_RAMP_MS;
          // Cubic Ease-In — beginnt fast unmerklich, waechst langsam.
          // Kein Sprung von 0 auf Basis-Tempo, sondern Anlauf.
          const speedFactor = t * t * t;
          rotationRef.current = (rotationRef.current + dt * SPEED_DEG_PER_SEC * speedFactor) % 360;
        }
        setRotation(rotationRef.current);
      } else {
        rotationRef.current = (rotationRef.current + dt * SPEED_DEG_PER_SEC) % 360;
        setRotation(rotationRef.current);
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hover, isLocked]);

  // Hover-Debounce + Leave-Grace: der Tetraeder reagiert nicht auf jede
  // Maus-Bewegung, sondern verlangt Aufmerksamkeit (250 ms verweilen) und
  // verzeiht kurzes Wegziehen (500 ms Grace). Damit bleibt er ruhig und
  // wuerdig, statt nervoes jedem Hover hinterherzuhecheln.
  const enterTimerRef = useRef<number | null>(null);
  const leaveTimerRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (enterTimerRef.current !== null) clearTimeout(enterTimerRef.current);
    if (leaveTimerRef.current !== null) clearTimeout(leaveTimerRef.current);
  }, []);

  const onMouseEnter = () => {
    // Maus kommt zurueck waehrend Grace-Period: Lock halten, nichts tun.
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
      return;
    }
    if (hover) return;
    if (enterTimerRef.current !== null) return;
    // Erst nach 250 ms Verweilen die Bremse einleiten.
    enterTimerRef.current = window.setTimeout(() => {
      enterTimerRef.current = null;
      if (hover) return;
      resumeStartRef.current = null;
      setHover(nextFaceLock(rotationRef.current));
      setIsLocked(false);
    }, HOVER_ENTER_DELAY_MS);
  };
  const onMouseLeave = () => {
    // Maus war nur am Vorbeistreichen — nichts war committed.
    if (enterTimerRef.current !== null) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
      return;
    }
    if (!hover) return;
    if (leaveTimerRef.current !== null) return;
    // Grace-Period: 500 ms still stehen lassen. Kommt die Maus in dieser
    // Zeit zurueck, bleibt der Lock. Erst danach Resume-Ramp.
    leaveTimerRef.current = window.setTimeout(() => {
      leaveTimerRef.current = null;
      resumeStartRef.current = performance.now();
      setHover(null);
      setIsLocked(false);
    }, HOVER_LEAVE_GRACE_MS);
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

  // Wireframe: 4 3D-Faces, gesorted back-to-front fuer korrekte Tiefen-
  // Reihenfolge. Keine Section-Faerbung mehr (das uebernimmt die Region-
  // Schicht beim Lock).
  const faces = [
    { key: 'top',    vertices: [tops[0], tops[1], tops[2]] },
    { key: 'side-0', vertices: [apex, tops[0], tops[1]]     },
    { key: 'side-1', vertices: [apex, tops[1], tops[2]]     },
    { key: 'side-2', vertices: [apex, tops[2], tops[0]]     },
  ];
  const sorted = faces
    .map((f) => ({ ...f, centroidZ: f.vertices.reduce((s, v) => s + v.z, 0) / f.vertices.length }))
    .sort((a, b) => a.centroidZ - b.centroidZ);

  const polyPoints = (verts: typeof tops) =>
    verts.map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');

  // Region-Berechnung — nur sinnvoll im Lock-Zustand, weil dort genau eine
  // der drei Top-Vertices als "back" (kleinstes z') in die Mitte projiziert
  // und die anderen zwei links/rechts liegen. Die drei 2D-Regionen sind:
  //   Upper       = (left-Top, right-Top, back-Top)         [die TOP-Face]
  //   Lower-Left  = (apex, left-Top, back-Top)
  //   Lower-Right = (apex, right-Top, back-Top)
  const lockRegions = (() => {
    if (!isLocked) return null;
    // Back-Vertex: niedrigstes z' (= am weitesten von Kamera weg)
    let backIdx = 0;
    for (let i = 1; i < 3; i++) {
      if (tops[i].z < tops[backIdx].z) backIdx = i;
    }
    const otherIdx = [0, 1, 2].filter((i) => i !== backIdx);
    otherIdx.sort((a, b) => tops[a].x - tops[b].x);   // kleineres x = links
    const leftTop  = tops[otherIdx[0]];
    const rightTop = tops[otherIdx[1]];
    const backTop  = tops[backIdx];
    return [
      { vertices: [leftTop, rightTop, backTop], panelId: REGION_UPPER_PANEL,       label: 'AI-Interface (oben)' },
      { vertices: [apex,    leftTop,  backTop], panelId: REGION_LOWER_LEFT_PANEL,  label: 'Operator-Zonen (links)' },
      { vertices: [apex,    rightTop, backTop], panelId: REGION_LOWER_RIGHT_PANEL, label: 'System (rechts)' },
    ];
  })();

  return (
    <div
      style={{
        display: 'inline-block', lineHeight: 0, pointerEvents: 'none',
        // Klicks duerfen keinen Text-Selection-Range in benachbarte Spans
        // ziehen (sonst wird "Cosmo-Controls" blau hinterlegt).
        userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >
    {/* Das SVG liegt (per Wrapper-zIndex:3) ueber dem oberen Tetraeder und malt
        dessen untere Haelfte zu (Bipyramiden-Verdeckung). Es ist selbst
        treffer-frei (pointerEvents:none); Hover/Lock uebernimmt der untere
        Faenger, die loa-Zone oben bleibt dadurch klickbar. onMouseEnter/Leave
        am SVG feuern, sobald der Zeiger einen treffer-aktiven Nachkommen
        (Faenger / Lock-Region) betritt bzw. verlaesst. */}
    <svg
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      width={size}
      height={size}
      viewBox="-50 -15 100 75"
      style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
    >
      {/* Treffer-Faenger fuer Hover/Lock: unterer Bereich (y >= 0), laesst die
          obere Ueberlappungs-Zone (loa-Arc des oberen Tetraeders) frei. */}
      <rect x={-50} y={0} width={100} height={60} fill="transparent" style={{ pointerEvents: 'all' }} />
      {/* Wireframe: 4 3D-Faces in Tiefen-Reihenfolge. Keine Section-Faerbung,
          das uebernimmt die Region-Schicht (siehe unten). */}
      {sorted.map((f) => (
        <polygon
          key={f.key}
          points={polyPoints(f.vertices)}
          fill="none"
          stroke={STROKE_INACTIVE}
          strokeWidth={STROKE_W_NORMAL}
          strokeLinejoin="round"
          style={{ pointerEvents: 'none', opacity: 0.85 }}
        />
      ))}
      {/* Region-Hit-Targets (nur im Lock-Zustand). Drei sichtbare 2D-Regionen
          des Tetraeder-Wireframes, jede zur Sektion gemappt. Tint im Fill,
          wenn die Sektion offen ist; transparent sonst. Klick toggelt. */}
      {lockRegions !== null && lockRegions.map((r) => {
        const isActive = activeId === r.panelId;
        return (
          <polygon
            key={`region-${r.panelId}`}
            points={polyPoints(r.vertices)}
            fill={isActive ? 'rgba(99, 179, 237, 0.28)' : 'transparent'}
            stroke="none"
            onClick={() => onFaceClick(r.panelId)}
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
            className={isActive ? 'rb-active-tile' : undefined}
          >
            <title>{r.label}</title>
          </polygon>
        );
      })}
    </svg>
    </div>
  );
}
