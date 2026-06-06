// „Der Ausschluss des Users" (Umbauplan C1) — Runtime-Sim im P09-Mask-Tab.
// Der User setzt eine Ø-Last-Schwelle; Strecken darüber werden später (Phase D)
// farblos neutralisiert. (Alte colorize-Legende ausgemustert, Stufe 6.)

import { useState } from 'react';
import { loadUserExclusion, saveUserExclusion } from '../../sensus/userExclusion';

export default function UserExclusionControl() {
  const [val, setVal] = useState<number | null>(() => loadUserExclusion());

  const update = (v: number | null) => { setVal(v); saveUserExclusion(v); };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 440, marginTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>Der Ausschluss des Users</div>
      <div style={{ fontSize: 11, color: '#718096', margin: '2px 0 8px', lineHeight: 1.45 }}>
        Runtime/User (hier simuliert): ab dieser <strong>Ø-Last je Strecke</strong> werden Routen/POIs
        <strong> neutralisiert</strong> (farblos) — anders als die Operator-Degradierung, die nur entdrängt.
      </div>
      <label style={{ fontSize: 11, color: '#4a5568', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
        <input type="checkbox" checked={val != null}
          onChange={(e) => update(e.target.checked ? 0.7 : null)} /> aktiv
      </label>
      {val != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="range" min={0} max={1} step={0.01} value={val}
            onChange={(e) => update(parseFloat(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#4a5568', width: 42, textAlign: 'right' }}>
            {val.toFixed(2)}
          </span>
        </div>
      )}
      <div style={{ fontSize: 10.5, color: '#a0aec0', marginTop: 8 }}>
        Das eigentliche Neutralisieren je Strecke kommt in Phase D (Render-Integration).
      </div>
    </div>
  );
}
