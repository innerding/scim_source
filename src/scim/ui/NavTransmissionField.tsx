// Transmissionsfeld zwischen Mond (Logo-Hex) und Tetraeder.
// Triangulaerer Mesh-Ausschnitt aus der Empty Sea — Apex oben, Basis unten,
// 4-fache Subdivision pro Seite => 15 Knoten, 30 Kanten, 16 Sub-Dreiecke.
// Knoten wackeln vertikal nach derselben Wellenfunktion wie die Empty Sea,
// aber mit deutlich kleinerer Amplitude (Blatt im Wind, kein Meer).
// Siehe ann_059 / ann_060 in AiInterfacePanel.tsx fuer die Kosmologie.

import { useEffect, useMemo, useRef } from 'react';

// ─── Geometrie ────────────────────────────────────────────────────────────────

const N = 4;                              // Subdivisionsgrad pro Seite
const VB_WIDTH = 180;
const VB_HEIGHT = 36;

const APEX = { x: VB_WIDTH / 2, y: 0 };           // oben
const BL   = { x: 0,            y: VB_HEIGHT };    // unten links
const BR   = { x: VB_WIDTH,     y: VB_HEIGHT };    // unten rechts

interface MeshNode {
  baseX: number;
  baseY: number;
}

interface MeshEdge {
  a: number;
  b: number;
}

function buildMesh(): { nodes: MeshNode[]; edges: MeshEdge[] } {
  const nodes: MeshNode[] = [];
  const idxOf = new Map<string, number>();

  // Knoten in baryzentrischen Koordinaten (i+j+k = N)
  for (let i = N; i >= 0; i--) {
    for (let j = N - i; j >= 0; j--) {
      const k = N - i - j;
      const baseX = (i * APEX.x + j * BL.x + k * BR.x) / N;
      const baseY = (i * APEX.y + j * BL.y + k * BR.y) / N;
      idxOf.set(`${i},${j},${k}`, nodes.length);
      nodes.push({ baseX, baseY });
    }
  }

  // Kanten: drei Richtungen, dedupliziert ueber "other > here"
  const edges: MeshEdge[] = [];
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N - i; j++) {
      const k = N - i - j;
      const here = idxOf.get(`${i},${j},${k}`) ?? -1;
      const consider = (di: number, dj: number, dk: number) => {
        const other = idxOf.get(`${i + di},${j + dj},${k + dk}`) ?? -1;
        if (other > here) edges.push({ a: here, b: other });
      };
      if (j > 0) consider(0, -1, 1);    // gleiche Reihe (gleiches i)
      if (i > 0) consider(-1, 0, 1);    // linke Diagonale (gleiches j)
      if (i > 0) consider(-1, 1, 0);    // rechte Diagonale (gleiches k)
    }
  }

  return { nodes, edges };
}

// ─── Wellenfunktion ───────────────────────────────────────────────────────────
// Drei ueberlagerte Sinus-Wellen, gleiche Struktur wie Empty Sea, aber kleinere
// Amplitude und etwas hoehere Frequenz, damit das Blatt-im-Wind-Gefuehl bleibt.

const WAVE_AMP = 1.4;     // in viewBox-Einheiten (~ Pixel)

function waveDy(x: number, y: number, t: number): number {
  return (
    Math.sin(x * 0.060 + t)         * WAVE_AMP +
    Math.sin(y * 0.080 - t * 0.80)  * WAVE_AMP * 0.52 +
    Math.sin((x + y) * 0.040 + t * 0.47) * WAVE_AMP * 0.28
  );
}

// ─── Komponente ───────────────────────────────────────────────────────────────

export default function NavTransmissionField() {
  const { nodes, edges } = useMemo(() => buildMesh(), []);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();

    const tick = () => {
      const t = (performance.now() - t0) / 1000;

      // Knotenpositionen einmal pro Frame berechnen
      const px = new Float32Array(nodes.length);
      const py = new Float32Array(nodes.length);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        px[i] = n.baseX;
        py[i] = n.baseY + waveDy(n.baseX, n.baseY, t);
      }

      // Linien-DOM direkt mutieren — kein React-Re-Render
      for (let i = 0; i < edges.length; i++) {
        const el = lineRefs.current[i];
        if (!el) continue;
        const e = edges[i];
        el.setAttribute('x1', px[e.a].toFixed(2));
        el.setAttribute('y1', py[e.a].toFixed(2));
        el.setAttribute('x2', px[e.b].toFixed(2));
        el.setAttribute('y2', py[e.b].toFixed(2));
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nodes, edges]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 0,                 // nimmt keinen Flow-Platz — der Tetraeder darunter ruehrt sich nicht
      pointerEvents: 'none',     // Klicks gehen durch zur Reader-Hitbox
      flexShrink: 0,
    }}>
      <svg
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 36,            // genau die Luecke, die die Manual+Reader-Zeile per translateY(36) freigibt
          overflow: 'visible',
          display: 'block',
        }}
      >
        {edges.map((e, idx) => {
          const a = nodes[e.a];
          const b = nodes[e.b];
          return (
            <line
              key={idx}
              ref={(el) => { lineRefs.current[idx] = el; }}
              x1={a.baseX}
              y1={a.baseY}
              x2={b.baseX}
              y2={b.baseY}
              stroke="rgba(255,255,255,0.42)"
              strokeWidth={0.4}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
}
