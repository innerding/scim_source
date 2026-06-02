// Test-Route-Control (Umbauplan #2 · S4b) — Heimat P09 Move (BAK). Würfelt eine
// Testperson-Route (Bus→Attraktor) und zeigt den Comfort-Befund: überschreitet
// die Route zur Sim-Zeit die Comfort-Schwelle (= User-Ausschluss, P09 Mask)?
// Das Routing/Highlight macht ScimMap; hier nur Auslöser + Report.

import { useEffect, useReducer } from 'react';
import { requestTestRoute, getTestRoute, getTestComfort, getTestAlt, getTestAltComfort, subscribeTestRoute,
  getDestPoi, getRouteDest, getDestComfort, getDestAlt, getDestAltComfort, clearAltRoute } from '../../sensus/testRoute';

export default function TestRouteControl() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => subscribeTestRoute(force), []);

  const route = getTestRoute();
  const comfort = getTestComfort();
  const alt = getTestAlt();
  const altComfort = getTestAltComfort();
  // S6: Alternativroute zu einem frei angeklickten POI.
  const destPoi = getDestPoi();
  const routeDest = getRouteDest();
  const destComfort = getDestComfort();
  const destAlt = getDestAlt();
  const destAltComfort = getDestAltComfort();

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
            <>
              <div style={{ color: '#c53030', marginTop: 4 }}>
                ⚠ überschreitet auf <strong>{comfort.exceeding.length}/{comfort.routeStretchIds.length}</strong> Strecken (rot)
              </div>
              {alt ? (
                <div style={{ color: '#2f855a', marginTop: 2 }}>
                  ↳ <strong style={{ color: '#2f855a' }}>Ausweichroute</strong> (grün) {altComfort?.ok ? '— comfortabel ✓' : `— noch ${altComfort?.exceeding.length ?? '?'} Strecke(n) über Comfort`}
                </div>
              ) : (
                <div style={{ color: '#a0aec0', marginTop: 2 }}>↳ keine Ausweichroute — Strecke unvermeidbar</div>
              )}
            </>
          )
        ) : (
          route && <div style={{ color: '#a0aec0', marginTop: 4 }}>kein Comfort-Befund (Comfort-Schwelle in P09 Mask setzen + „Last (sim)" an)</div>
        )}
      </div>

      {/* S6: Alternativroute — Klick auf ein POI auf der Karte. */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #e2e8f0', fontSize: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#553c9a' }}>Alternativroute</div>
        {destPoi ? (
          <>
            <div style={{ color: '#2d3748', marginTop: 4 }}>
              Ziel: <strong>{destPoi.label}</strong>
              <button onClick={() => clearAltRoute()} style={{
                marginLeft: 8, fontSize: 10, padding: '1px 6px', borderRadius: 3, cursor: 'pointer',
                border: '1px solid #cbd5e0', background: '#f7fafc', color: '#718096',
              }}>✕ zurücksetzen</button>
            </div>
            {routeDest ? (
              <>
                <div style={{ color: '#2d3748', marginTop: 2 }}>
                  Route (violett): <strong>{routeDest.from}</strong> → <strong>{routeDest.to}</strong>
                </div>
                {destComfort && (
                  destComfort.ok ? (
                    <div style={{ color: '#276749', marginTop: 4 }}>✓ comfortabel auf allen {destComfort.routeStretchIds.length} Strecken</div>
                  ) : (
                    <>
                      <div style={{ color: '#c53030', marginTop: 4 }}>
                        ⚠ überschreitet auf <strong>{destComfort.exceeding.length}/{destComfort.routeStretchIds.length}</strong> Strecken (rot)
                      </div>
                      {destAlt ? (
                        <div style={{ color: '#2f855a', marginTop: 2 }}>
                          ↳ <strong style={{ color: '#2f855a' }}>Ausweichroute</strong> (grün) {destAltComfort?.ok ? '— comfortabel ✓' : `— noch ${destAltComfort?.exceeding.length ?? '?'} Strecke(n) über Comfort`}
                        </div>
                      ) : (
                        <div style={{ color: '#a0aec0', marginTop: 2 }}>↳ keine Ausweichroute — Strecke unvermeidbar</div>
                      )}
                    </>
                  )
                )}
              </>
            ) : (
              <div style={{ color: '#a0aec0', marginTop: 4 }}>— keine Route zum Ziel (ggf. „Last (sim)" einschalten)</div>
            )}
          </>
        ) : (
          <div style={{ color: '#a0aec0', marginTop: 4, lineHeight: 1.45 }}>
            Klicke ein beliebiges POI auf der Karte an → es wird eine comfort-bewusste Route dorthin gebildet.
          </div>
        )}
      </div>
    </div>
  );
}
