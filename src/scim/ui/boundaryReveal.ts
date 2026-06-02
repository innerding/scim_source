// Boundary-Reveal-Animation (P07-Prep, im Inspector/ScimMap) — das „stille
// Einloggen". Ablauf (sequenziell):
//   1. Fenster-Zoom: weißer Invert-Fill liegt über der schon fokussierten Karte;
//      im Zentrum wächst die Boundary als Fenster und legt die OSM frei.
//      KEIN Ausdimmen während des Zooms. (Bewusst langsam, f0.5.)
//   2. Danach: der weiße Fill blendet aus — und gleichzeitig blendet die Boundary
//      (unanimiert, nur Opazität) ein und bleibt stehen.
//
// Reine DOM/SVG-Animation als additives Overlay über dem Karten-Container —
// rührt die Leaflet-Layer nicht an. Maßgeblich: docs/anthem_snapshot_spec.md.

import L from 'leaflet';

const NS = 'http://www.w3.org/2000/svg';
let seq = 0;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Geschwindigkeit: Fenster-Zoom um f0.5 verlangsamt (~3000 ms); danach das
// Ausblenden + Boundary-Einblenden in einer ruhigen Phase.
const GROW_MS = 3000;
const DIM_MS = 1400;

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

  // Der Boundary-Stroke (unanimiert) — blendet in Phase 2 nur über Opazität ein.
  const stroke = document.createElementNS(NS, 'polygon');
  stroke.setAttribute('points', ptsStr);
  stroke.setAttribute('fill', 'none');
  stroke.setAttribute('stroke', '#0074d9');
  stroke.setAttribute('stroke-width', '1.5');
  stroke.setAttribute('stroke-linejoin', 'round');
  stroke.setAttribute('opacity', '0');
  svg.appendChild(stroke);

  container.appendChild(svg);

  // ── Phase 1: Fenster-Zoom (langsam), KEIN Ausdimmen ──
  const t0 = performance.now();
  function grow(now: number) {
    const t = Math.min(1, (now - t0) / GROW_MS);
    hole.setAttribute('transform',
      `translate(${cx} ${cy}) scale(${easeOutCubic(t)}) translate(${-cx} ${-cy})`);
    if (t < 1) { requestAnimationFrame(grow); }
    else { requestAnimationFrame(dim); }
  }

  // ── Phase 2: weißer Fill aus, Boundary ein (beide nur Opazität) ──
  let dimStart = 0;
  function dim(now: number) {
    if (!dimStart) dimStart = now;
    const t = Math.min(1, (now - dimStart) / DIM_MS);
    fill.setAttribute('opacity', String(1 - t));
    stroke.setAttribute('opacity', String(t));
    if (t < 1) { requestAnimationFrame(dim); }
    else { fill.setAttribute('opacity', '0'); stroke.setAttribute('opacity', '1'); setTimeout(() => svg.remove(), 1200); }
  }

  requestAnimationFrame(grow);
}
