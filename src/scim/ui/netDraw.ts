// netDraw — die EINE Zeichenfunktion des Wegnetz-Editors: draw(deriveNet(OP)).
//
// Rein darstellend: nimmt eine Leaflet-LayerGroup + DerivedNet und zeichnet
// net/red/lila + Brückenzeichen + POIs. Keine Modell-Logik, kein State.
// Klick-Verhalten kommt ausschließlich über onSegmentClick (Lösch-Werkzeug);
// alles andere ist nur Anzeige.

import L from 'leaflet';
import type { DerivedNet, LatLng } from '../regio-content/netModel';

const COLOR = {
  net: '#1a202c',     // schwarz
  red: '#e53e3e',     // rot
  lila: '#9333ea',    // violett
  casing: '#1a202c',  // Asphalt-Einfassung
  asphaltCore: '#ffffff',
  bridge: '#1a202c',
};

const M_LAT = 110540;
const mLngAt = (lat: number): number => 111320 * Math.cos((lat * Math.PI) / 180);

// Platzhalter-Farbe je Kategorie (Bucket-Präfix der Katalog-Subcategory + Gate).
function categoryColor(category?: string): string {
  if (!category) return '#1a365d';
  if (category === 'gate') return '#2f855a';
  if (category.startsWith('Transport')) return '#2b6cb0';
  if (category.startsWith('Service')) return '#dd6b20';
  if (category.startsWith('Regenerate')) return '#319795';
  if (category.startsWith('Points')) return '#805ad5';
  if (category.startsWith('Square')) return '#4a5568';
  if (category.startsWith('Help')) return '#e53e3e';
  return '#1a365d';
}

export interface DrawNetOptions {
  /** Lösch-Werkzeug aktiv → Teilstücke klickbar; Klick liefert den Key. */
  onSegmentClick?: (key: string) => void;
  /** Trassier-/Lösch-Hinweis im Tooltip. */
  pickTooltip?: string;
  /** Gate-Werkzeug aktiv → rote Sackgassen-Spitzen als Ringe markieren. */
  showDeadEnds?: boolean;
}

// Brückenzeichen: an der Überfliegung zwei kurze Striche quer zur oberen Linie
// (Trasse), je einer links/rechts der unteren Linie, Enden nach außen gehakt.
function drawBridgeMark(layer: L.LayerGroup, at: LatLng, dir: [number, number]): void {
  // dir = Richtung der oberen Linie (Einheitsvektor in lat/lng-Metern-Raum).
  const mLng = mLngAt(at[0]);
  // Einheits-Tangente (entlang Trasse) und -Normale (quer dazu) in Metern.
  const tx = dir[1] * mLng; const ty = dir[0] * M_LAT;
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl; const uy = ty / tl;           // entlang Trasse
  const nx = -uy; const ny = ux;                     // quer
  const toLL = (mx: number, my: number): LatLng => [at[0] + my / M_LAT, at[1] + mx / mLng];
  const CAP = 4;    // halbe Caplänge (m) quer
  const OFF = 3;    // Abstand der zwei Caps entlang der Trasse (m)
  const HOOK = 2;   // Hakenlänge nach außen (m)
  for (const s of [-1, 1]) {
    const cx = ux * OFF * s; const cy = uy * OFF * s;       // Cap-Mittelpunkt entlang Trasse
    const a = toLL(cx + nx * CAP, cy + ny * CAP);
    const b = toLL(cx - nx * CAP, cy - ny * CAP);
    // Haken an beiden Enden nach außen (entlang Trasse, weg von der Kreuzung).
    const hookA = toLL(cx + nx * CAP + ux * HOOK * s, cy + ny * CAP + uy * HOOK * s);
    const hookB = toLL(cx - nx * CAP + ux * HOOK * s, cy - ny * CAP + uy * HOOK * s);
    L.polyline([hookA, a, b, hookB], { color: COLOR.bridge, weight: 2, opacity: 0.9, interactive: false }).addTo(layer);
  }
}

export function drawNet(layer: L.LayerGroup, net: DerivedNet, opts: DrawNetOptions = {}): void {
  layer.clearLayers();

  // 1) Strecken nach Klasse. Asphalt-Netz: weißer Kern in schwarzer Einfassung.
  for (const e of net.edges) {
    if (e.klass === 'net' && e.asphalt) {
      L.polyline(e.points, { color: COLOR.casing, weight: 5.5, opacity: 0.95, interactive: false }).addTo(layer);
      const core = L.polyline(e.points, { color: COLOR.asphaltCore, weight: 2, opacity: 1 });
      if (opts.onSegmentClick) { core.on('click', (ev) => { L.DomEvent.stop(ev); opts.onSegmentClick!(e.key); }); if (opts.pickTooltip) core.bindTooltip(opts.pickTooltip, { sticky: true, direction: 'right', offset: [12, 0], opacity: 0.9 }); }
      else core.options.interactive = false;
      core.addTo(layer);
      continue;
    }
    const color = e.klass === 'red' ? COLOR.red : e.klass === 'lila' ? COLOR.lila : COLOR.net;
    const pl = L.polyline(e.points, {
      color, weight: e.klass === 'net' ? 3 : 2.5, opacity: 0.95,
      // nosm (freie Gerade über einen Platz) → gestrichelt, damit man sie später
      // bewusst ein-/ausschließen kann.
      ...(e.nosm ? { dashArray: '6 6' } : {}),
    });
    if (opts.onSegmentClick) {
      pl.on('click', (ev) => { L.DomEvent.stop(ev); opts.onSegmentClick!(e.key); });
      if (opts.pickTooltip) pl.bindTooltip(opts.pickTooltip, { sticky: true, direction: 'right', offset: [12, 0], opacity: 0.9 });
    } else {
      pl.options.interactive = false;
    }
    pl.addTo(layer);
  }

  // 2) Brückenzeichen an jeder Fly-over-Markierung (obere Linie = Trasse).
  for (const b of net.bridges) {
    const upper = net.edges.find((e) => e.wayId === b.overEdgeId);
    let dir: [number, number] = [0, 1];
    if (upper) {
      // Richtung aus dem Trassen-Segment, das dem Punkt am nächsten liegt.
      const pts = upper.points;
      let best = Infinity;
      for (let i = 0; i + 1 < pts.length; i++) {
        const mid: LatLng = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
        const d = (mid[0] - b.at[0]) ** 2 + (mid[1] - b.at[1]) ** 2;
        if (d < best) { best = d; dir = [pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]]; }
      }
    }
    drawBridgeMark(layer, b.at, dir);
  }

  // 2b) Gate-Werkzeug: rote Sackgassen-Spitzen als anklickbare Ringe markieren.
  if (opts.showDeadEnds) {
    for (const at of net.deadEnds) {
      L.circleMarker(at, { radius: 6, color: COLOR.red, weight: 2, fillColor: '#fff', fillOpacity: 0.9, interactive: false }).addTo(layer);
    }
  }

  // 3) POIs: verbunden = ruhig, unverbunden = blinkt, Gate = eigener Marker.
  for (const p of net.pois) {
    const col = categoryColor(p.category);
    const marker = L.circleMarker(p.at, {
      radius: 6,
      color: col,
      weight: 2,
      fillColor: p.connected ? col : '#fff',
      fillOpacity: p.connected ? 0.85 : 0.95,
      className: p.connected ? undefined : 'poi-blink',
      interactive: false,
    });
    if (p.gate && p.tagline) {
      marker.options.interactive = true; // damit der Hover-Tooltip greift
      marker.bindTooltip(p.tagline, { direction: 'top', offset: [0, -8], opacity: 0.9, className: 'gate-label' });
    }
    marker.addTo(layer);
  }
}
