// Boundary-Reveal-Animation (P07-Prep, im Inspector/ScimMap) — das „stille
// Einloggen": ein weißer Invert-Fill liegt über der schon fokussierten Karte;
// im Zentrum wächst die Boundary als Fenster, legt die OSM frei, der weiße Fill
// dimmt aus, der Stroke bleibt. Live über die echte Leaflet-Projektion.
//
// Reine DOM/SVG-Animation als additives Overlay über dem Karten-Container —
// rührt die Leaflet-Layer nicht an. Maßgeblich: docs/anthem_snapshot_spec.md
// (Boundary-Reveal · invertierte Maske).

import L from 'leaflet';

const NS = 'http://www.w3.org/2000/svg';
let seq = 0;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

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

  // Der Stroke der Boundary — bleibt am Ende stehen.
  const stroke = document.createElementNS(NS, 'polygon');
  stroke.setAttribute('points', ptsStr);
  stroke.setAttribute('fill', 'none');
  stroke.setAttribute('stroke', '#0074d9');
  stroke.setAttribute('stroke-width', '1.5');
  stroke.setAttribute('opacity', '0');
  svg.appendChild(stroke);

  container.appendChild(svg);

  // Animation: Loch wächst (0–70%), weißer Fill dimmt aus (40–100%), Stroke
  // blendet ein. Live über requestAnimationFrame.
  const DUR = 2200;
  const t0 = performance.now();
  function frame(now: number) {
    const t = Math.min(1, (now - t0) / DUR);
    const grow = easeOutCubic(Math.min(1, t / 0.7));
    hole.setAttribute('transform',
      `translate(${cx} ${cy}) scale(${grow}) translate(${-cx} ${-cy})`);
    const dim = t < 0.4 ? 1 : Math.max(0, 1 - (t - 0.4) / 0.6);
    fill.setAttribute('opacity', String(dim));
    stroke.setAttribute('opacity', String(Math.min(1, Math.max(0, (t - 0.4) / 0.4))));
    if (t < 1) requestAnimationFrame(frame);
    else setTimeout(() => svg.remove(), 600); // Stroke kurz stehen lassen, dann Overlay räumen (echter L.polygon-Stroke bleibt)
  }
  requestAnimationFrame(frame);
}
