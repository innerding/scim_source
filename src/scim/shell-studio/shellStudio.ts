// Shell-Studio — die Funktions-Registry. Jede Funktion = EIN Block, in zwei Lanes:
//   · SIM (High): die Oberfläche (Sim-Vorschau im Device-Frame) + der SIM-Code, der
//     sie in SCIM rendert + Design-Notizen. „Was wir simulieren."
//   · PRODUKTION (Deep): der Ziel-App-Code, der wirklich ausgespielt wird — NICHT live
//     mitcodiert, sondern auf Anforderung GENERIERT (Plattform wählen → SCIM rechnet →
//     Code je Block + Summe → von Sensus Core Publishing anforderbar/packbar).
// SIM-Code ≠ Produktions-Code (nativer App-Store-Code kann ganz anders aussehen).
// EINE Liste, zwei Lanes → die Frames stehen gegenüber. Inhalt wächst je Funktion.

export type TargetPlatform = 'web' | 'android' | 'ios';

export const TARGET_PLATFORMS: { id: TargetPlatform; label: string }[] = [
  { id: 'web', label: 'Web' },
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
];

export interface ShellFunction {
  id: string;
  title: string;
  subtitle?: string;
  /** Surface-Renderer-Schlüssel (im Studio per switch auf id aufgelöst). */
  surface: 'map' | 'colorize' | 'placeholder';
  /** High · Design-Notizen zur Oberfläche: so kann es sein · bewährt · Fallback · Ausbau. */
  highNotes: string[];
  /** Deep · Notizen zum Produktions-Code: was er tun muss · schneller weil · Budget · erneuert weil. */
  deepNotes: string[];
  /** High · der SIM-Code, der die Oberfläche in SCIM rendert (Auszug). */
  simCode: string;
}

export const SHELL_FUNCTIONS: ShellFunction[] = [
  {
    id: 'map',
    title: 'Karte',
    subtitle: 'Leaflet + OSM',
    surface: 'map',
    highNotes: [
      'Vollbild-Karte; endet vor der Home-Indicator-Zone (iOS-Geste durchlassen).',
      'Fallback: keine Tiles erreichbar → heller Hintergrund + Boundary-Umriss.',
      'Ausbau: Dark-Tiles als Stil-Variante (Mesh-Look) umschaltbar.',
    ],
    deepNotes: [
      'Produktion kann nativ rendern (Android/iOS Map-SDK) — SIM-Leaflet ist nur Vorschau.',
      'preferCanvas/invalidateSize sind SIM-Belange; nativ entfallen sie.',
      'fitBounds auf die Origin-Boundary bleibt plattformübergreifend gleich gemeint.',
    ],
    simCode: `const map = L.map(el, { zoomControl: true, preferCanvas: true });

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap', maxZoom: 19,
}).addTo(map);

// auf die Origin-Boundary fokussieren
const ring = origin.boundary;            // [lon, lat][]
const poly = L.polygon(
  ring.map(([lon, lat]) => [lat, lon]),
).addTo(map);
map.fitBounds(poly.getBounds(), { padding: [24, 24] });

// im Device-Frame: bei Größenwechsel neu vermessen
new ResizeObserver(() => map.invalidateSize()).observe(el);`,
  },
  {
    id: 'colorize',
    title: 'Colorize',
    subtitle: 'Last → Farbe',
    surface: 'colorize',
    highNotes: [
      'Durchgehender Gradient ruhig → busy; Schwellen NUR als Marker, nie geschnitten (§2a).',
      'Default-Palette green_violet (stetig); umschaltbar heat / calm.',
      'Stellschrauben: spectrum (0 langsam heiß … 1 aggressiv) · bias (regional kühler/heißer).',
    ],
    deepNotes: [
      'Läuft APP-seitig auf den [0..1]-loads des Anthem — die App färbt selbst (Anthem trägt KEINE Farbe).',
      'Palette/spectrum/bias kommen aus den Origin-colour-settings (mit der Rep ausgeliefert).',
      'Reine Funktion, kein State → nativ 1:1 portierbar (gleiche Mathematik je Segment).',
    ],
    simCode: `// Last [0..1] → Farbe. Durchgehender Gradient (Schwellen als Marker, nie Schnitt).
const lerp = (a, b, t) => a + (b - a) * t;

function rampColor(stops, t) {            // lin. Interpolation zwischen Farb-Stops
  const u = clamp01(t);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (u <= b.at) {
      const f = (u - a.at) / (b.at - a.at || 1);
      return \`rgb(\${lerp(a.color[0], b.color[0], f)|0}, …)\`;
    }
  }
}

// Last STETIG beugen (spectrum/bias), dann auf die Palette mappen
function shapeLoad(load, { spectrum = 0.5, bias = 0 } = {}) {
  const gamma = Math.pow(2, 1 - 2 * clamp01(spectrum));
  return clamp01(Math.pow(clamp01(load), gamma) + bias * 0.5);
}

export function colorize(load, { palette = 'green_violet', spectrum, bias } = {}) {
  const stops = PALETTES[palette].stops;  // ruhig → busy
  return rampColor(stops, shapeLoad(load, { spectrum, bias }));
}

// app-seitig je Segment:
seg.color = colorize(anthem.loads[i], origin.colourSettings);`,
  },
];
