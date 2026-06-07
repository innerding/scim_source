// RegionHeaderMesh — animierter Colour-Mesh-Hintergrund für die Region-Dashboard-
// Header (Anlehnung an die SCIM3-Intro „Empty Sea"). Links kleinteilig, rechts
// großteilig (nichtlineare Spalten-Verteilung), wellen-versetzt, in Amber↔Violett.
// Dunkler Empty-Sea-Grund (kein Himmel), füllt den Header.
import { useEffect, useRef } from 'react';

const COLS = 30;
const ROWS = 6;

// Spalten dichter links: u = (c/N)^p → kleine Schritte links, große rechts.
const colU = (c: number) => Math.pow(c / (COLS - 1), 1.8);

export default function RegionHeaderMesh() {
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
      t += 0.016;
      // Empty-Sea-Grund
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#03050f');
      bg.addColorStop(0.5, '#070d22');
      bg.addColorStop(1, '#03050f');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Gitter aufbauen (etwas über die Header-Höhe hinaus → „größere Ausdehnung")
      const top = -0.18 * H, bot = 1.18 * H;
      const pts: { x: number; y: number; u: number }[][] = [];
      for (let r = 0; r < ROWS; r++) {
        pts[r] = [];
        for (let c = 0; c < COLS; c++) {
          const u = colU(c);
          const x = u * W;
          const baseY = top + (bot - top) * (r / (ROWS - 1));
          const amp = 1.6 + u * 7;                       // rechts gröbere/höhere Wellen
          const wy = Math.sin(u * 9 - t * 1.1 + r * 0.6) * amp
                   + Math.sin(u * 20 - t * 1.7) * (1 + u * 2.4);
          pts[r][c] = { x, y: baseY + wy, u };
        }
      }

      const edge = (a: { x: number; y: number; u: number }, b?: { x: number; y: number; u: number }) => {
        if (!b) return;
        const wv = (Math.sin(a.u * 9 - t * 1.1) + 1) / 2;       // 0..1 Amber↔Violett
        const rr = Math.round(245 + (124 - 245) * wv);
        const gg = Math.round(158 + (58 - 158) * wv);
        const bb = Math.round(11 + (237 - 11) * wv);
        const alpha = 0.16 + 0.42 * (1 - a.u);                  // links dichter/heller
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${alpha})`;
        ctx.lineWidth = 0.55 + (1 - a.u) * 0.5;
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

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}
