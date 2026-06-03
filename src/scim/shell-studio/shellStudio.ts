// Shell-Studio — die Funktions-Registry. Jede Funktion = EIN Block, in zwei Lanes
// dargestellt: High (Oberfläche, was der User sieht, im Device-Frame + Design-Notizen)
// und Deep (der ausgespielte Code + Code-Notizen). EINE Liste, zwei Lanes → die Frames
// stehen automatisch gegenüber. Inhalt wächst Funktion für Funktion.

export interface ShellFunction {
  id: string;
  title: string;
  subtitle?: string;
  /** Surface-Renderer-Schlüssel (im Studio per switch auf id aufgelöst). */
  surface: 'map' | 'placeholder';
  /** High · Design-Notizen: so kann es sein · bewährt · Fallback · Ausbau. */
  highNotes: string[];
  /** Deep · Code-Notizen: schneller weil · Budget weil · erneuert weil. */
  deepNotes: string[];
  /** Deep · der ausgespielte Code (Auszug). */
  code: string;
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
      'Leaflet einmal mounten + ResizeObserver → invalidateSize — sonst grauer Ausschnitt im Frame.',
      'preferCanvas:true → schneller bei vielen Segmenten, spart Render-Budget.',
      'fitBounds auf die Origin-Boundary statt fixem Zoom — passt sich jeder Rep an.',
    ],
    code: `const map = L.map(el, { zoomControl: true, preferCanvas: true });

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
];
