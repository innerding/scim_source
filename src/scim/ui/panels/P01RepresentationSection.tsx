import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import QRCode from 'qrcode';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

const RUNTIME_URL = 'https://diesenpark.com';

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

  const STORAGE_KEY = 'scim3_representation';

  const loadStored = (): { name: string; polygon: LatLng[] | null } => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { name: 'Lichtenberg', polygon: null };
  };

  const stored = loadStored();
  const [name, setName] = useState(stored.name);
  const [polygon, setPolygon] = useState<LatLng[] | null>(stored.polygon);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current?.({ name, polygon });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, polygon })); } catch { /* ignore */ }
  }, [name, polygon]);

  useEffect(() => {
    if (!name.trim() || !polygon) { setQrDataUrl(null); return; }
    const url = `${RUNTIME_URL}?r=${encodeURIComponent(name.trim())}`;
    QRCode.toDataURL(url, { width: 180, margin: 1, color: { dark: '#1a202c', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
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

    // Restore saved polygon
    const initial = loadStored();
    if (initial.polygon && initial.polygon.length >= 3) {
      const latlngs = initial.polygon.map(([lat, lng]) => [lat, lng] as [number, number]);
      const poly = L.polygon(latlngs, { color: '#0074d9' }).addTo(map);
      layerRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [30, 30] });
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          placeholder="z.B. Lichtenberg"
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
          <span style={{ color: '#a0aec0' }}>Kein Polygon definiert — QR-Code erscheint nach dem Zeichnen</span>
        )}
      </div>

      {/* QR Code */}
      {qrDataUrl && (
        <div style={{
          marginTop: 16,
          padding: '14px 16px',
          background: '#f7fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <img src={qrDataUrl} alt="QR Code" style={{ width: 90, height: 90, flexShrink: 0, borderRadius: 4 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#2d3748', marginBottom: 4 }}>
              Runtime-Link für „{name}"
            </div>
            <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.5 }}>
              QR-Code scannen öffnet die Sensus-Core Runtime.<br />
              Falls keine PWA installiert ist, wird sie beim ersten Aufruf angeboten.
            </div>
            <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 6, fontFamily: 'monospace' }}>
              {RUNTIME_URL}?r={encodeURIComponent(name.trim())}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
