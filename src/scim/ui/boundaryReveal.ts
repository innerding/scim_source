// Boundary-Reveal-Animation (P07-Prep, im Inspector/ScimMap) — das „stille
// Einloggen". Ablauf (sequenziell):
//   1. Fenster-Zoom: weißer Invert-Fill liegt über der schon fokussierten Karte;
//      im Zentrum wächst die Boundary als Fenster und legt die OSM frei, während
//      der weiße Fill ausdimmt. (Bewusst langsam, f0.5.)
//   2. Warten bis der Fill ganz ausgeblendet ist.
//   3. Dann die Boundary an einem Punkt beginnen und einmal herum bis zum
//      Startpunkt nachzeichnen — in derselben Geschwindigkeit wie der Fenster-Zoom.
//
// Reine DOM/SVG-Animation als additives Overlay über dem Karten-Container —
// rührt die Leaflet-Layer nicht an. Maßgeblich: docs/anthem_snapshot_spec.md.

import L from 'leaflet';

const NS = 'http://www.w3.org/2000/svg';
let seq = 0;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Geschwindigkeit: Fenster-Zoom um f0.5 verlangsamt (vorher ~1500 ms → ~3000 ms);
// das Nachzeichnen läuft in derselben Dauer (= dieselbe Pace).
const GROW_MS = 3000;
const DRAW_MS = 3000;

export function playBoundaryReveal(
  container: HTMLElement, map: L.Map, ringLatLng: [number, number][],
): void {
  const w = container.clientWidth, h = container.clientHeight;
  if (!w || !h || ringLatLng.length < 3) return;

  // Vorherige Reveal-Overlays entfernen (Re-Trigger).
  container.querySelectorAll('[data-boundary-reveal]').forEach((n) => n.remove());

  // Ring in Container-Pixel projizieren (Standbild zu Spielbeginn).
  const pts = ringLatLng.map(([lat, lon]) => {
    const p = map.latLngToContainerPoint(L.latLng(lat, lon));
    return [p.x, p.y] as [number, number];
  });
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const ptsStr = pts.map((p) => `${p[0]},${p[1]}`).join(' ');
  const pathD = `M ${pts.map((p) => `${p[0]} ${p[1]}`).join(' L ')} Z`;
  const id = `brmask-${seq++}`;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('data-boundary-reveal', '1');
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  Object.assign(svg.style, {
    position: 'absolute', top: '0', left: '0', pointerEvents: 'none', zIndex: '650',
  } as CSSStyleDeclaration);

  // Maske: weiß = sichtbarer Fill, schwarz = Loch (Boundary-Fenster).
  const defs = document.createElementNS(NS, 'defs');
  const mask = document.createElementNS(NS, 'mask');
  mask.setAttribute('id', id);
  const maskBg = document.createElementNS(NS, 'rect');
  maskBg.setAttribute('width', String(w)); maskBg.setAttribute('height', String(h));
  maskBg.setAttribute('fill', 'white');
  const hole = document.createElementNS(NS, 'polygon');
  hole.setAttribute('points', ptsStr);
  hole.setAttribute('fill', 'black');
  mask.appendChild(maskBg); mask.appendChild(hole);
  defs.appendChild(mask); svg.appendChild(defs);

  // Weißer Invert-Fill mit dem wachsenden Loch.
  const fill = document.createElementNS(NS, 'rect');
  fill.setAttribute('width', String(w)); fill.setAttribute('height', String(h));
  fill.setAttribute('fill', '#ffffff');
  fill.setAttribute('mask', `url(#${id})`);
  svg.appendChild(fill);

  // Der Boundary-Stroke als Pfad — wird in Phase 3 gezeichnet, bleibt dann stehen.
  const stroke = document.createElementNS(NS, 'path');
  stroke.setAttribute('d', pathD);
  stroke.setAttribute('fill', 'none');
  stroke.setAttribute('stroke', '#0074d9');
  stroke.setAttribute('stroke-width', '1.5');
  stroke.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(stroke);

  container.appendChild(svg);

  // Pfadlänge erst nach dem Einhängen abrufbar; mit Dash „aufrollen".
  const len = stroke.getTotalLength();
  stroke.style.strokeDasharray = String(len);
  stroke.style.strokeDashoffset = String(len);

  // ── Phase 1+2: Fenster-Zoom + Ausdimmen (langsam), endet wenn Fill = 0 ──
  const t0 = performance.now();
  function grow(now: number) {
    const t = Math.min(1, (now - t0) / GROW_MS);
    hole.setAttribute('transform',
      `translate(${cx} ${cy}) scale(${easeOutCubic(t)}) translate(${-cx} ${-cy})`);
    fill.setAttribute('opacity', String(1 - t));
    if (t < 1) { requestAnimationFrame(grow); }
    else { fill.setAttribute('opacity', '0'); requestAnimationFrame(draw); }
  }

  // ── Phase 3: Boundary von einem Punkt bis zum Startpunkt nachzeichnen ──
  let drawStart = 0;
  function draw(now: number) {
    if (!drawStart) drawStart = now;
    const t = Math.min(1, (now - drawStart) / DRAW_MS);
    stroke.style.strokeDashoffset = String(len * (1 - t));
    if (t < 1) { requestAnimationFrame(draw); }
    else { setTimeout(() => svg.remove(), 1200); } // kurz stehen lassen, dann räumen (L.polygon-Stroke bleibt)
  }

  requestAnimationFrame(grow);
}
