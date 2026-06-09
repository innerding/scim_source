// SeaBrandung — eine zarte, graue Variation des Intro-„Empty Sea": ein dünnes
// Wellen-Mesh, am UNTEREN Panelrand verankert, das wie eine leise Brandung wirkt.
// Anders als RegionHeaderMesh (bunt, oben, im Header): transparent, schwarz/grau,
// nach oben ausblendend. Rein dekorativ (pointer-events: none).
import { useEffect, useRef } from 'react';

const COLS = 28;
const ROW_GAP = 15;   // feste Pixel-Zeilenhöhe (keine Höhen-Streckung)

interface P { x: number; y: number; vr: number }

export default function SeaBrandung({ height = 56 }: { height?: number }) {
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

    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, W, H);

      // Zeilen vom unteren Rand nach oben gestapelt + 1 Überhang.
      const ROWS = Math.max(3, Math.ceil(H / ROW_GAP) + 1);
      const pts: P[][] = [];
      for (let r = 0; r < ROWS; r++) {
        pts[r] = [];
        for (let c = 0; c < COLS; c++) {
          const u = c / (COLS - 1);
          const x = u * W;
          const baseY = H - r * ROW_GAP;                  // von unten nach oben
          const amp = 1.2 + (1 - u) * 3;                  // links etwas gröbere Wellen
          const wy = Math.sin(u * 8 - t * 1.1 + r * 0.5) * amp
                   + Math.sin(u * 18 - t * 1.6) * 1.0;
          pts[r][c] = { x, y: baseY + wy, vr: r / ROWS };
        }
      }

      const edge = (a: P, b?: P) => {
        if (!b) return;
        const fade = 1 - a.vr;                            // unten kräftiger, oben aus
        const alpha = 0.10 + 0.30 * fade;                 // zart, aber sichtbar
        // Hellblau wie das Intro-„Empty Sea", nur einfarbig.
        ctx.strokeStyle = `rgba(125,179,232,${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      };

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const p = pts[r][c];
          edge(p, pts[r][c + 1]);
          if (r < ROWS - 1) {
            edge(p, pts[r + 1][c]);
            edge(p, pts[r + 1][c + 1]);
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height,
        pointerEvents: 'none', zIndex: 2, display: 'block',
      }}
    />
  );
}
