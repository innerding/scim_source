// Zeitraffer-Control (Umbauplan #2 · S3) — Heimat P06 Transmitter. Setzt die
// Sim-Zeit und das Turbo-Tempo; aus jedem 5-Min-Schritt bildet der Transmitter
// das Last-Signal → das Colour-Mesh (Inspector „Last (sim)") animiert mit.

import { useEffect, useReducer } from 'react';
import {
  getSimHour, getSimSpeed, setSimHour, setSimSpeed, subscribeSimClock, SIM_CLOCK,
} from '../../sensus/simClock';

function fmt(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export default function SimClockControl() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => subscribeSimClock(force), []);

  const hour = getSimHour();
  const speed = getSimSpeed();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 440, marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>Zeitraffer (Sim-Uhr)</div>
      <div style={{ fontSize: 11, color: '#718096', margin: '2px 0 8px', lineHeight: 1.45 }}>
        Time-Turbo des 5-Min-Signals: setzt die Sim-Zeit; aus jedem 5-Min-Schritt
        bildet der Transmitter das Last-Signal → das Colour-Mesh animiert.
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: '#2b6cb0', marginBottom: 8 }}>
        {fmt(hour)} <span style={{ fontSize: 11, color: '#a0aec0', fontWeight: 400 }}>
          · Tempo {speed} Sim-Min/s {speed === 0 ? '(Pause)' : ''}
        </span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 2 }}>Zeit (6:00–20:00, 0.5 h)</div>
        <input type="range" min={SIM_CLOCK.MIN} max={SIM_CLOCK.MAX} step={0.5} value={hour}
          onChange={(e) => setSimHour(parseFloat(e.target.value))} style={{ width: '100%' }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 2 }}>Tempo (0 = Pause)</div>
        <input type="range" min={0} max={120} step={5} value={speed}
          onChange={(e) => setSimSpeed(parseFloat(e.target.value))} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
