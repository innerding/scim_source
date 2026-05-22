import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

type LatLng = [number, number];

export interface RepresentationValue {
  name: string;
  polygon: LatLng[] | null;
}

interface Props {
  onChange?: (v: RepresentationValue) => void;
}

export function P01RepresentationSection({ onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.Layer | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [name, setName] = useState('Hochschwab');
  const [polygon, setPolygon] = useState<LatLng[] | null>(null);

  useEffect(() => {
    onChangeRef.current?.({ name, polygon });
  }, [name, polygon]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [47.6, 15.1],
      zoom: 9,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      opacity: 0.65,
    }).addTo(map);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map as any).pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    });

    map.on('pm:create', (e: L.LeafletEvent) => {
      if (layerRef.current) map.removeLayer(layerRef.current);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = (e as any).layer as L.Polygon;
      layerRef.current = layer;
      const geo = layer.toGeoJSON();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ring = (geo.geometry as any).coordinates[0] as [number, number][];
      setPolygon(ring.map(([lng, lat]) => [lat, lng]));
    });

    map.on('pm:remove', () => {
      layerRef.current = null;
      setPolygon(null);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  return (
    <div>
      {/* Name */}
      <div style={{ marginBottom: 14 }}>
        <label style={{
          fontSize: 12, color: '#2d3748', fontWeight: 500,
          display: 'block', marginBottom: 4,
        }}>
          Name der Representation
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Hochschwab"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '6px 10px', fontSize: 13,
            border: '1px solid #cbd5e0', borderRadius: 4,
            color: '#2d3748', background: '#fff',
            fontFamily: 'system-ui, sans-serif',
          }}
        />
      </div>

      {/* Map instruction */}
      <div style={{ fontSize: 11, color: '#718096', marginBottom: 6 }}>
        Gebiet einzeichnen: Polygon- oder Rechteck-Werkzeug (links oben in der Karte) auswählen und Fläche aufziehen.
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        style={{
          height: 360,
          borderRadius: 6,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      />

      {/* Status */}
      <div style={{ marginTop: 8, fontSize: 11, fontFamily: 'monospace' }}>
        {polygon ? (
          <span style={{ color: '#38a169' }}>
            ✓ Polygon gesetzt — {polygon.length - 1} Punkte
          </span>
        ) : (
          <span style={{ color: '#a0aec0' }}>Kein Polygon definiert</span>
        )}
      </div>
    </div>
  );
}
