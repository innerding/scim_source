// §2a-konformer Gradient-Balken: zeigt die DURCHGEHENDE colorize-Skala (viele
// Stops → stetig, nie gebändert) und legt Schwellen als aufgesetzte Marker
// darüber. Der Balken ist zugleich die Legende. NIE den Gradienten schneiden.

import { colorize, type PaletteId } from '../../sensus/loadColour';

export interface GradientMarker {
  at: number;        // Position 0..1 auf dem Gradienten
  label: string;
  color?: string;    // Marker-Farbe (Default weiß)
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function ColourGradientBar({
  palette, spectrum = 0.5, bias = 0, markers = [], height = 22,
}: {
  palette?: PaletteId;
  spectrum?: number;
  bias?: number;
  markers?: GradientMarker[];
  height?: number;
}) {
  const N = 24; // viele Stops → stetiger Verlauf, kein Band
  const stops = Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N;
    return `${colorize(t, { palette, spectrum, bias })} ${(t * 100).toFixed(1)}%`;
  }).join(', ');

  return (
    <div style={{
      position: 'relative', height, borderRadius: 4,
      background: `linear-gradient(to right, ${stops})`,
      border: '1px solid #2d4a6a',
    }}>
      {markers.map((m, i) => (
        <div
          key={i}
          title={`${m.label} · ${Math.round(clamp01(m.at) * 100)}%`}
          style={{
            position: 'absolute', left: `${clamp01(m.at) * 100}%`, top: -3, bottom: -3,
            width: 2, marginLeft: -1, background: m.color ?? '#ffffff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.6)',
          }}
        />
      ))}
    </div>
  );
}
