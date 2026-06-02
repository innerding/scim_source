// Test-Route-Control (Umbauplan #2 · S4b) — Heimat P09 Move (BAK). Würfelt eine
// Testperson-Route (Bus→Attraktor) und zeigt den Comfort-Befund: überschreitet
// die Route zur Sim-Zeit die Comfort-Schwelle (= User-Ausschluss, P09 Mask)?
// Das Routing/Highlight macht ScimMap; hier nur Auslöser + Report.

import { useEffect, useReducer } from 'react';
import { requestTestRoute, getTestRoute, getTestComfort, subscribeTestRoute } from '../../sensus/testRoute';

export default function TestRouteControl() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => subscribeTestRoute(force), []);

  const route = getTestRoute();
  const comfort = getTestComfort();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 440, marginTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>Test-Route (BAK)</div>
      <div style={{ fontSize: 11, color: '#718096', margin: '2px 0 8px', lineHeight: 1.45 }}>
        Würfelt eine Bus→Attraktor-Route und prüft sie zur Sim-Zeit gegen die
        Comfort-Schwelle (= User-Ausschluss, P09 Mask). „Last (sim)" muss an sein.
      </div>
      <button onClick={() => requestTestRoute()} style={{
        fontSize: 12, padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
        border: '1px solid #2b6cb0', background: '#ebf8ff', color: '#1a365d', fontWeight: 600,
      }}>🎲 Test-Route würfeln</button>

      <div style={{ marginTop: 10, fontSize: 12 }}>
        {route ? (
          <div style={{ color: '#2d3748' }}>Route: <strong>{route.from}</strong> → <strong>{route.to}</strong></div>
        ) : (
          <div style={{ color: '#a0aec0' }}>— keine Route (ggf. „Last (sim)" einschalten)</div>
        )}
        {comfort ? (
          comfort.ok ? (
            <div style={{ color: '#276749', marginTop: 4 }}>✓ comfortabel auf allen {comfort.routeStretchIds.length} Strecken</div>
          ) : (
            <div style={{ color: '#c53030', marginTop: 4 }}>
              ⚠ überschreitet auf <strong>{comfort.exceeding.length}/{comfort.routeStretchIds.length}</strong> Strecken — Ausweichroute (S5) folgt
            </div>
          )
        ) : (
          route && <div style={{ color: '#a0aec0', marginTop: 4 }}>kein Comfort-Befund (Comfort-Schwelle in P09 Mask setzen + „Last (sim)" an)</div>
        )}
      </div>
    </div>
  );
}
