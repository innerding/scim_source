// RegionHeaderMesh — animierter Colour-Mesh-Hintergrund für die Region-Dashboard-
// Header (Anlehnung an die SCIM3-Intro „Empty Sea"). Links kleinteilig, rechts
// großteilig (nichtlineare Spalten-Verteilung), wellen-versetzt, in Amber↔Violett.
// Dunkler Empty-Sea-Grund (kein Himmel), füllt den Header.
import { useEffect, useRef } from 'react';

const COLS = 30;
const ROW_GAP = 22;   // feste Pixel-Zeilenhöhe → Mesh wird NICHT in der Höhe gestreckt,
                      // bei kleinerem Header wird einfach beschnitten (statt gestaucht).

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
      // Empty-Sea-Grund (deckend, dunkel)
      ctx.fillStyle = '#03050f';
      ctx.fillRect(0, 0, W, H);

      // Zeilen mit FESTER Pixel-Höhe (ROW_GAP), vertikal zentriert + 1 Zeile Überhang.
      // → keine Höhen-Streckung; bei niedrigem Header wird beschnitten.
      const ROWS = Math.max(3, Math.ceil(H / ROW_GAP) + 2);
      const y0 = (H - (ROWS - 1) * ROW_GAP) / 2;
      const pts: { x: number; y: number; u: number }[][] = [];
      for (let r = 0; r < ROWS; r++) {
        pts[r] = [];
        for (let c = 0; c < COLS; c++) {
          const u = colU(c);
          const x = u * W;
          const baseY = y0 + r * ROW_GAP;
          const amp = 1.4 + u * 5;                        // rechts gröbere/höhere Wellen (px-fest)
          const wy = Math.sin(u * 9 - t * 1.1 + r * 0.6) * amp
                   + Math.sin(u * 20 - t * 1.7) * (0.8 + u * 1.8);
          pts[r][c] = { x, y: baseY + wy, u };
        }
      }

      const edge = (a: { x: number; y: number; u: number }, b?: { x: number; y: number; u: number }) => {
        if (!b) return;
        const wv = (Math.sin(a.u * 9 - t * 1.1) + 1) / 2;       // 0..1 Amber↔Violett (gedämpft/dunkler)
        const rr = Math.round(176 + (96 - 176) * wv);
        const gg = Math.round(108 + (40 - 108) * wv);
        const bb = Math.round(20 + (170 - 20) * wv);
        const alpha = 0.34 + 0.5 * (1 - a.u);                   // links dichter/heller, weniger transparent
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${alpha})`;
        ctx.lineWidth = 0.6 + (1 - a.u) * 0.5;
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
