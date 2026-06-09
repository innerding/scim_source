// IntroSea — die „Empty Sea" der SCIM3-Intro, 1:1 als wiederverwendbare Fläche.
// 3D-projiziertes, animiertes Europa-Mesh (blau→amber). Als Panel-Hintergrund
// großflächig hinter den Inhalt legbar.
//   transparentBg=true → ohne den opaken dunklen Grund/Glow (überlagert helle Panels).
//   transparentBg=false → voller Intro-Look inkl. dunklem Grund.
import { useEffect, useRef } from 'react';

const MAX_WAVE = 9 * 1.8;
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function waveColor(wy: number, near: number): string {
  const t = clamp01((wy + MAX_WAVE) / (2 * MAX_WAVE));
  const r = Math.round(lerp(55, 245, t));
  const g = Math.round(lerp(40, 158, t));
  const b = Math.round(lerp(180, 11, t));
  const a = lerp(0.20, 0.92, near).toFixed(2);
  return `rgba(${r},${g},${b},${a})`;
}

const S = {
  cols: 42, rows: 34, cellSize: 118, waveAmplitude: 9,
  focalLength: 1060, screenLift: 0.58,
  orbitRadius: 1560, orbitHeight: 430, orbitSpeed: 0.055,
};

const EUROPE = [
  [5.7, 46.0], [6.2, 45.6], [8.5, 45.5], [11.6, 45.7], [14.4, 46.0],
  [17.8, 47.2], [20.0, 49.0], [19.4, 50.9], [15.0, 51.2], [11.0, 50.8],
  [8.1, 49.6], [5.5, 47.6],
];
const GEO = { lonMin: 5.0, lonMax: 20.5, latMin: 45.4, latMax: 51.2 };

type Vec3 = { x: number; y: number; z: number };
const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const norm = (v: Vec3): Vec3 => { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; };

function waveY(x: number, z: number, t: number) {
  return (
    Math.sin(x * 0.010 + t) * S.waveAmplitude +
    Math.sin(z * 0.014 - t * 0.8) * S.waveAmplitude * 0.52 +
    Math.sin((x + z) * 0.006 + t * 0.47) * S.waveAmplitude * 0.28
  );
}

function inEurope(lon: number, lat: number): boolean {
  const p = EUROPE;
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if (((p[i][1] > lat) !== (p[j][1] > lat)) &&
        lon < ((p[j][0] - p[i][0]) * (lat - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) {
      inside = !inside;
    }
  }
  return inside;
}

function geoFromLattice(row: number, col: number) {
  return {
    lon: GEO.lonMin + (col / Math.max(1, S.cols - 1)) * (GEO.lonMax - GEO.lonMin),
    lat: GEO.latMax - (row / Math.max(1, S.rows - 1)) * (GEO.latMax - GEO.latMin),
  };
}

interface WorldPt { x: number; y: number; z: number; inEurope: boolean }
interface ScreenPt { x: number; y: number; near: number; wy: number; inEurope: boolean }

function latticeWorld(row: number, col: number, t: number): WorldPt {
  const cell = S.cellSize;
  const triH = cell * 0.866;
  const geo = geoFromLattice(row, col);
  const x = (col - S.cols / 2) * cell + (row % 2 ? cell / 2 : 0);
  const z = (row - 6) * triH;
  return { x, y: waveY(x, z, t), z, inEurope: inEurope(geo.lon, geo.lat) };
}

function buildBasis(camera: { eye: Vec3; target: Vec3 }) {
  const forward = norm({ x: camera.target.x - camera.eye.x, y: camera.target.y - camera.eye.y, z: camera.target.z - camera.eye.z });
  const right = norm(cross(forward, { x: 0, y: 1, z: 0 }));
  const up = norm(cross(right, forward));
  return { forward, right, up };
}

function project(world: WorldPt, camera: { eye: Vec3; target: Vec3 }, w: number, h: number): ScreenPt | null {
  const basis = buildBasis(camera);
  const rel = { x: world.x - camera.eye.x, y: world.y - camera.eye.y, z: world.z - camera.eye.z };
  const camZ = dot(rel, basis.forward);
  if (camZ <= 1) return null;
  const scale = S.focalLength / camZ;
  return {
    x: w * 0.5 + dot(rel, basis.right) * scale,
    y: h * S.screenLift - dot(rel, basis.up) * scale,
    near: clamp01(1 - camZ / 4200),
    wy: world.y,
    inEurope: world.inEurope,
  };
}

function renderEmptySea(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, transparentBg: boolean) {
  if (transparentBg) {
    ctx.clearRect(0, 0, w, h);
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#000510');
    bg.addColorStop(0.56, '#010a1e');
    bg.addColorStop(1, '#000510');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.44, 0, w * 0.5, h * 0.46, Math.max(w, h) * 0.62);
    glow.addColorStop(0, 'rgba(65,50,195,0.07)');
    glow.addColorStop(0.34, 'rgba(65,50,195,0.025)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  const orbit = t * S.orbitSpeed;
  const cx = 0, cz = 1690;
  const camera = {
    eye: { x: cx + Math.cos(orbit) * S.orbitRadius, y: S.orbitHeight + Math.sin(t * 0.62) * 10, z: cz + Math.sin(orbit) * S.orbitRadius },
    target: { x: cx, y: 6, z: cz },
  };

  const mesh: (ScreenPt | null)[][] = [];
  for (let row = 0; row < S.rows; row++) {
    mesh[row] = [];
    for (let col = 0; col < S.cols; col++) mesh[row][col] = project(latticeWorld(row, col, t), camera, w, h);
  }

  ctx.save();
  ctx.lineCap = 'round';
  for (let row = 0; row < S.rows; row++) {
    for (let col = 0; col < S.cols; col++) {
      const a = mesh[row][col];
      if (!a) continue;
      const drawEdge = (b: ScreenPt | null) => {
        if (!b || !a.inEurope || !b.inEurope) return;
        const near = (a.near + b.near) * 0.5;
        const wy = (a.wy + b.wy) * 0.5;
        ctx.strokeStyle = waveColor(wy, near);
        ctx.lineWidth = lerp(0.5, 1.5, near);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      };
      drawEdge(mesh[row][col + 1]);
      if (row < S.rows - 1) {
        drawEdge(mesh[row + 1][col]);
        drawEdge(row % 2 === 0 ? mesh[row + 1][col - 1] : mesh[row + 1][col + 1]);
      }
    }
  }
  for (const row of mesh) {
    for (const pt of row) {
      if (!pt || !pt.inEurope || pt.x < -30 || pt.x > w + 30 || pt.y < -30 || pt.y > h + 30) continue;
      ctx.fillStyle = waveColor(pt.wy, pt.near);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, lerp(0.35, 1.65, pt.near), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export default function IntroSea({ transparentBg = false, opacity = 1 }: { transparentBg?: boolean; opacity?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0, t = 0;
    const resize = () => {
      const r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    const paint = () => {
      t += 0.016;
      renderEmptySea(ctx, W, H, t, transparentBg);
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [transparentBg]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none', opacity }}
    />
  );
}
