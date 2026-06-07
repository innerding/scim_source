import { useState, useRef, useEffect } from 'react';
import type { Role } from './RoleContext';
import logoBaseRaw from '../../assets/logo-base.svg?raw';
import logoHexRaw from '../../assets/logo-hex.svg?raw';
import {
  isPasskeySupported, getStoredPasskey, tryPasskeyLogin,
  registerPasskey, clearPasskey,
} from './passkey';

interface Props {
  onAuth: (role: Role, name: string) => void;
}

const USERS: Record<string, { code: string; role: Role }> = {
  'dietmar': { code: import.meta.env.VITE_CODE_OPERATOR ?? '', role: 'operator' },
  'michael moser': { code: import.meta.env.VITE_CODE_ANALYST  ?? '', role: 'analyst'  },
};

// Merkbarer Wiederherstellungs-Code — IMMER gültig (UX-Gate, keine Krypto-Sperre;
// das JS-Bundle lädt ohnehin). Verhindert Aussperrer; der Env-Code bleibt zusätzlich
// gültig. Normalisiert (Groß/Klein + Satzzeichen egal): „full visibility" == „FULL-VISIBILITY".
const RECOVERY_CODE = 'FULL-VISIBILITY';
const normCode = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
function codeMatches(envCode: string, typed: string): boolean {
  const t = normCode(typed);
  if (t === normCode(RECOVERY_CODE)) return true;
  return !!envCode && t === normCode(envCode);
}

type Phase = 'idle' | 'confirming' | 'fading';

const HEX_ORIGIN = '29.1% 59.1%';

const CSS = `
  @keyframes scim-bob {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }
  @keyframes scim-pulse {
    0%, 100% { opacity: 0.75; }
    50%      { opacity: 1; }
  }
  @keyframes scim-wave-blue {
    from { background-position: left center;  }
    to   { background-position: right center; }
  }
  @keyframes scim-wave-amber {
    from { background-position: right center; }
    to   { background-position: left center;  }
  }
  .scim-input::placeholder { color: rgba(150,140,255,0.30); }
  .scim-input:focus { border-color: rgba(65,50,195,0.65) !important; outline: none; }
`;

// ─── Colour helpers ───────────────────────────────────────────────────────────

const MAX_WAVE = 9 * 1.8; // waveAmplitude × sum of sine layer weights ≈ 16.2

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

/** Map waveY → blue (valley) to amber (crest), with per-segment opacity. */
function waveColor(wy: number, near: number): string {
  const t = clamp01((wy + MAX_WAVE) / (2 * MAX_WAVE));
  const r = Math.round(lerp(55,  245, t));
  const g = Math.round(lerp(40,  158, t));
  const b = Math.round(lerp(180,  11, t));
  const a = lerp(0.20, 0.92, near).toFixed(2);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── Empty-Sea mesh ───────────────────────────────────────────────────────────

const S = {
  cols: 42, rows: 34, cellSize: 118, waveAmplitude: 9,
  focalLength: 1060, screenLift: 0.58,
  orbitRadius: 1560, orbitHeight: 430, orbitSpeed: 0.055,
};

const EUROPE = [
  [5.7,46.0],[6.2,45.6],[8.5,45.5],[11.6,45.7],[14.4,46.0],
  [17.8,47.2],[20.0,49.0],[19.4,50.9],[15.0,51.2],[11.0,50.8],
  [8.1,49.6],[5.5,47.6],
];
const GEO = { lonMin:5.0, lonMax:20.5, latMin:45.4, latMax:51.2 };

type Vec3 = { x:number; y:number; z:number };
function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y*b.z - a.z*b.y, y: a.z*b.x - a.x*b.z, z: a.x*b.y - a.y*b.x };
}
function dot(a: Vec3, b: Vec3) { return a.x*b.x + a.y*b.y + a.z*b.z; }
function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x:v.x/l, y:v.y/l, z:v.z/l };
}

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

interface WorldPt { x:number; y:number; z:number; inEurope:boolean; }
interface ScreenPt { x:number; y:number; near:number; wy:number; inEurope:boolean; }

function latticeWorld(row: number, col: number, t: number): WorldPt {
  const cell = S.cellSize;
  const triH = cell * 0.866;
  const geo = geoFromLattice(row, col);
  const x = (col - S.cols / 2) * cell + (row % 2 ? cell / 2 : 0);
  const z = (row - 6) * triH;
  return { x, y: waveY(x, z, t), z, inEurope: inEurope(geo.lon, geo.lat) };
}

function buildBasis(camera: { eye:Vec3; target:Vec3 }) {
  const forward = norm({ x: camera.target.x - camera.eye.x, y: camera.target.y - camera.eye.y, z: camera.target.z - camera.eye.z });
  const right = norm(cross(forward, { x:0, y:1, z:0 }));
  const up = norm(cross(right, forward));
  return { forward, right, up };
}

function project(world: WorldPt, camera: { eye:Vec3; target:Vec3 }, w: number, h: number): ScreenPt | null {
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

function renderEmptySea(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Background — deep blue-black gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0,    '#000510');
  bg.addColorStop(0.56, '#010a1e');
  bg.addColorStop(1,    '#000510');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle central glow
  const glow = ctx.createRadialGradient(w*0.5, h*0.44, 0, w*0.5, h*0.46, Math.max(w, h)*0.62);
  glow.addColorStop(0,    'rgba(65,50,195,0.07)');
  glow.addColorStop(0.34, 'rgba(65,50,195,0.025)');
  glow.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Camera
  const orbit = t * S.orbitSpeed;
  const cx = 0, cz = 1690;
  const camera = {
    eye: {
      x: cx + Math.cos(orbit) * S.orbitRadius,
      y: S.orbitHeight + Math.sin(t * 0.62) * 10,
      z: cz + Math.sin(orbit) * S.orbitRadius,
    },
    target: { x: cx, y: 6, z: cz },
  };

  // Build mesh
  const mesh: (ScreenPt | null)[][] = [];
  for (let row = 0; row < S.rows; row++) {
    mesh[row] = [];
    for (let col = 0; col < S.cols; col++) {
      mesh[row][col] = project(latticeWorld(row, col, t), camera, w, h);
    }
  }

  // Draw edges — colour per wave height
  ctx.save();
  ctx.lineCap = 'round';
  for (let row = 0; row < S.rows; row++) {
    for (let col = 0; col < S.cols; col++) {
      const a = mesh[row][col];
      if (!a) continue;
      const drawEdge = (b: ScreenPt | null) => {
        if (!b || !a.inEurope || !b.inEurope) return;
        const near = (a.near + b.near) * 0.5;
        const wy   = (a.wy   + b.wy)   * 0.5;
        ctx.strokeStyle = waveColor(wy, near);
        ctx.lineWidth   = lerp(0.5, 1.5, near);
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

  // Draw vertices
  for (const row of mesh) {
    for (const pt of row) {
      if (!pt || pt.x < -30 || pt.x > w + 30 || pt.y < -30 || pt.y > h + 30) continue;
      ctx.fillStyle = waveColor(pt.wy, pt.near);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, lerp(0.35, 1.65, pt.near), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

// Pre-encode SVG data URLs so mask-image never needs an HTTP request
// (avoids CORS / CSP issues on Cloudflare Pages entirely)
const LOGO_BASE_MASK = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoBaseRaw)}")`;
const LOGO_HEX_MASK  = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoHexRaw)}")`;

export default function IntroScreen({ onAuth }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [hexRot, setHexRot] = useState(0);
  const [panelVisible, setPanelVisible] = useState(false);
  const [offerRegister, setOfferRegister] = useState<{ role: Role; userName: string } | null>(null);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const passkeyAttempted = useRef(false);
  const hasStoredPasskey = isPasskeySupported() && getStoredPasskey() !== null;
  const flashLevelRef = useRef(0);
  const flashActive   = useRef(true);
  const logoRef       = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Lightning effect ──────────────────────────────────────────────────────
  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    const rafs: number[] = [];

    function flash(peak: number, riseMs: number, decayMs: number) {
      if (!flashActive.current) return;
      const start = performance.now();
      const holdMs = 25;
      const total = riseMs + holdMs + decayMs;

      function tick(now: number) {
        const elapsed = now - start;
        let level: number;
        if (elapsed < riseMs) {
          level = (elapsed / riseMs) * peak;
        } else if (elapsed < riseMs + holdMs) {
          level = peak;
        } else {
          const t = (elapsed - riseMs - holdMs) / decayMs;
          level = peak * Math.max(0, 1 - t);
        }
        flashLevelRef.current = level;
        // Sync invert filter on logo
        if (logoRef.current) {
          logoRef.current.style.filter = level > 0.01 ? `invert(${level.toFixed(3)})` : '';
        }
        if (elapsed < total) {
          rafs.push(requestAnimationFrame(tick));
        } else {
          flashLevelRef.current = 0;
          if (logoRef.current) logoRef.current.style.filter = '';
        }
      }
      rafs.push(requestAnimationFrame(tick));
    }

    function scheduleStorm() {
      if (!flashActive.current) return;
      const pause = 1800 + Math.random() * 3700;
      const t = setTimeout(() => {
        if (!flashActive.current) return;
        const r = Math.random();
        const count = r < 0.60 ? 1 : r < 0.90 ? 2 : 3;
        let offset = 0;
        for (let i = 0; i < count; i++) {
          const peak  = 0.50 + Math.random() * 0.38;
          const rise  = 35  + Math.random() * 55;
          const decay = 220 + Math.random() * 380;
          const t2 = setTimeout(() => flash(peak, rise, decay), offset);
          ids.push(t2);
          offset += rise + decay + 60 + Math.random() * 100;
        }
        scheduleStorm();
      }, pause);
      ids.push(t);
    }

    const t0 = setTimeout(scheduleStorm, 1200);
    ids.push(t0);
    return () => { ids.forEach(clearTimeout); rafs.forEach(cancelAnimationFrame); };
  }, []);

  // Stop lightning when panel opens
  useEffect(() => {
    if (panelVisible) {
      flashActive.current = false;
      flashLevelRef.current = 0;
      if (logoRef.current) logoRef.current.style.filter = '';
    }
  }, [panelVisible]);

  // ── Canvas animation ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf: number;
    let t0: number | null = null;
    const paint = (now: number) => {
      if (t0 === null) t0 = now;
      const t = (now - t0) / 1000;
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width  = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderEmptySea(ctx, w, h, t);
        // Invert pass — difference blend with white inverts all canvas colours
        const fl = flashLevelRef.current;
        if (fl > 0.005) {
          ctx.save();
          ctx.globalCompositeOperation = 'difference';
          ctx.globalAlpha = fl;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, []);

  const canSubmit = name.trim().length > 0 && code.trim().length > 0 && phase === 'idle';

  const runSuccessAnimation = (role: Role, userName: string) => {
    setError(null);
    setPhase('confirming');
    [1, 2, 3, 4].forEach((i) => {
      setTimeout(() => setHexRot(i * 60), 620 + i * 180);
    });
    const spinEnd = 620 + 4 * 180;
    setTimeout(() => setPhase('fading'), spinEnd);
    setTimeout(() => onAuth(role, userName), spinEnd + 520);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const userKey = name.trim().toLowerCase();
    const user = USERS[userKey];
    if (!user || !codeMatches(user.code, code)) {
      setError('Unbekannter Nutzer oder falscher Code');
      return;
    }
    if (isPasskeySupported() && getStoredPasskey() === null) {
      setError(null);
      setOfferRegister({ role: user.role, userName: userKey });
      return;
    }
    runSuccessAnimation(user.role, userKey);
  };

  // Auto-Passkey-Versuch sobald das Panel geöffnet wird (nur wenn registriert)
  useEffect(() => {
    if (!panelVisible || passkeyAttempted.current) return;
    if (!hasStoredPasskey) return;
    passkeyAttempted.current = true;
    setPasskeyBusy(true);
    tryPasskeyLogin().then((res) => {
      setPasskeyBusy(false);
      if (res) runSuccessAnimation(res.role, res.userName);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelVisible]);

  const handleRegisterAndEnter = async () => {
    if (!offerRegister) return;
    setPasskeyBusy(true);
    const ok = await registerPasskey(offerRegister.role, offerRegister.userName);
    setPasskeyBusy(false);
    if (!ok) {
      setError('Touch ID nicht eingerichtet — Login dennoch erfolgreich');
    }
    const role = offerRegister.role;
    const userName = offerRegister.userName;
    setOfferRegister(null);
    runSuccessAnimation(role, userName);
  };

  const handleSkipRegister = () => {
    if (!offerRegister) return;
    const role = offerRegister.role;
    const userName = offerRegister.userName;
    setOfferRegister(null);
    runSuccessAnimation(role, userName);
  };

  const handleRetryPasskey = () => {
    if (!hasStoredPasskey) return;
    setPasskeyBusy(true);
    tryPasskeyLogin().then((res) => {
      setPasskeyBusy(false);
      if (res) runSuccessAnimation(res.role, res.userName);
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(65,50,195,0.08)',
    border: '1px solid rgba(65,50,195,0.28)',
    borderRadius: 5, padding: '9px 12px',
    color: '#e8e6ff', fontSize: 13, outline: 'none',
    fontFamily: 'system-ui, sans-serif', marginBottom: 12,
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'fading' ? 0 : 1,
      transition: phase === 'fading' ? 'opacity 520ms ease-in' : 'none',
    }}>
      <style>{CSS}</style>

      {/* Canvas — coloured Empty Sea mesh */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
      }} />

      {/* Logo composition — click reveals access panel */}
      <div
        ref={logoRef}
        onClick={() => setPanelVisible(true)}
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 14, marginBottom: 44,
          animation: 'scim-bob 3s ease-in-out infinite',
          cursor: panelVisible ? 'default' : 'pointer',
        }}
      >
        {/* SVG logos — coloured via CSS mask + gradient background */}
        <div style={{ position: 'relative', width: 438, height: 123 }}>

          {/* logo-base: SCIM3 wordmark — blue dominant, amber wave */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(90deg, rgba(65,50,195,0.90) 0%, rgba(65,50,195,0.90) 20%, rgba(245,158,11,0.92) 50%, rgba(65,50,195,0.90) 80%, rgba(65,50,195,0.90) 100%)',
            backgroundSize: '200% 100%',
            WebkitMaskImage: LOGO_BASE_MASK,
            maskImage: LOGO_BASE_MASK,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskMode: 'alpha',
            maskMode: 'alpha',
            animation: 'scim-wave-blue 7s ease-in-out infinite alternate',
          } as React.CSSProperties} />

          {/* logo-hex: hexagonal mark — same gradient, with rotation + pulse */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(90deg, rgba(65,50,195,0.90) 0%, rgba(65,50,195,0.90) 20%, rgba(245,158,11,0.92) 50%, rgba(65,50,195,0.90) 80%, rgba(65,50,195,0.90) 100%)',
            backgroundSize: '200% 100%',
            WebkitMaskImage: LOGO_HEX_MASK,
            maskImage: LOGO_HEX_MASK,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskMode: 'alpha',
            maskMode: 'alpha',
            transformOrigin: HEX_ORIGIN,
            transform: `rotate(${hexRot}deg)`,
            transition: hexRot > 0 ? 'transform 180ms ease-in-out' : 'none',
            animation: `scim-wave-blue 7s ease-in-out infinite alternate${phase === 'idle' ? ', scim-pulse 5200ms 3000ms ease-in-out infinite' : ''}`,
          } as React.CSSProperties} />
        </div>

      </div>

      {/* Access panel — appears on logo click */}
      <div style={{
        position: 'relative', zIndex: 1, width: 320,
        opacity: panelVisible ? 1 : 0,
        transform: panelVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        pointerEvents: panelVisible ? 'auto' : 'none',
        background: 'rgba(4,8,28,0.80)',
        border: '1px solid rgba(65,50,195,0.30)',
        borderRadius: 10, padding: '28px 32px',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        boxShadow: '0 12px 48px rgba(0,0,60,0.70), inset 0 1px 0 rgba(65,50,195,0.12)',
      }}>
        <div style={{
          fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 22,
          fontFamily: 'monospace', color: 'rgba(245,158,11,0.55)',
        }}>
          Zugang — SCIM3 V0.2
        </div>

        {offerRegister ? (
          <>
            <div style={{
              fontSize: 12, color: '#e8e6ff', marginBottom: 18, lineHeight: 1.5,
              fontFamily: 'system-ui, sans-serif',
            }}>
              Touch ID auf diesem Gerät einrichten? Beim nächsten Besuch genügt
              dann der Fingerabdruck.
            </div>
            {error && (
              <div style={{
                fontSize: 11, color: 'rgba(245,158,11,0.85)', marginBottom: 14,
                textAlign: 'center', fontFamily: 'system-ui',
              }}>
                {error}
              </div>
            )}
            <button
              onClick={handleRegisterAndEnter}
              disabled={passkeyBusy}
              style={{
                width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 500,
                background: 'rgba(65,50,195,0.88)', color: '#e8e6ff',
                border: '1px solid rgba(65,50,195,0.70)',
                borderRadius: 5, cursor: passkeyBusy ? 'wait' : 'pointer',
                fontFamily: 'system-ui, sans-serif', letterSpacing: '0.06em',
                marginBottom: 8,
              }}
            >
              Touch ID einrichten & eintreten
            </button>
            <button
              onClick={handleSkipRegister}
              disabled={passkeyBusy}
              style={{
                width: '100%', padding: '8px 0', fontSize: 12,
                background: 'transparent', color: 'rgba(150,140,255,0.65)',
                border: '1px solid rgba(65,50,195,0.20)', borderRadius: 5,
                cursor: passkeyBusy ? 'wait' : 'pointer',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Überspringen
            </button>
          </>
        ) : (
          <>
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
              autoComplete="off"
              className="scim-input"
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Code"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
              autoComplete="off"
              className="scim-input"
              style={{ ...inputStyle, marginBottom: error ? 8 : 18 }}
            />

            {error && (
              <div style={{
                fontSize: 11, color: 'rgba(245,158,11,0.85)', marginBottom: 14,
                textAlign: 'center', fontFamily: 'system-ui',
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 500,
                background: canSubmit ? 'rgba(65,50,195,0.88)' : 'rgba(65,50,195,0.10)',
                color: canSubmit ? '#e8e6ff' : 'rgba(150,140,255,0.25)',
                border: `1px solid ${canSubmit ? 'rgba(65,50,195,0.70)' : 'rgba(65,50,195,0.14)'}`,
                borderRadius: 5,
                cursor: canSubmit ? 'pointer' : 'default',
                transition: 'background 0.18s, color 0.18s, border-color 0.18s',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.06em',
              }}
            >
              Eintreten
            </button>

            {hasStoredPasskey && (
              <button
                onClick={handleRetryPasskey}
                disabled={passkeyBusy}
                style={{
                  width: '100%', padding: '8px 0', marginTop: 10, fontSize: 12,
                  background: 'transparent', color: 'rgba(150,140,255,0.75)',
                  border: '1px solid rgba(65,50,195,0.25)', borderRadius: 5,
                  cursor: passkeyBusy ? 'wait' : 'pointer',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {passkeyBusy ? 'Warte auf Touch ID …' : '👆  Mit Touch ID anmelden'}
              </button>
            )}
            {hasStoredPasskey && (
              <button
                onClick={() => { clearPasskey(); passkeyAttempted.current = true; location.reload(); }}
                style={{
                  width: '100%', padding: '4px 0', marginTop: 6, fontSize: 10,
                  background: 'transparent', color: 'rgba(150,140,255,0.35)',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                Passkey auf diesem Gerät vergessen
              </button>
            )}
          </>
        )}
      </div>

      {/* Version tag */}
      <div style={{
        position: 'absolute', bottom: 20, right: 24, zIndex: 1,
        fontSize: 10, color: 'rgba(65,50,195,0.30)',
        fontFamily: 'monospace', letterSpacing: '0.06em',
      }}>
        SML-2 · client-only auth
      </div>
    </div>
  );
}
