import { useState } from 'react';
import ScimMap from './scim/ui/ScimMap';
import Navigator from './scim/ui/Navigator';
import PanelWorkspace from './scim/ui/PanelWorkspace';
import { useScimPipeline } from './scim/ui/useScimPipeline';
import IntroScreen from './scim/ui/IntroScreen';
import { RoleContext } from './scim/ui/RoleContext';
import type { Role } from './scim/ui/RoleContext';

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const result = useScimPipeline();
  const [activeId, setActiveId] = useState('P01');
  const [mapCollapsed, setMapCollapsed] = useState(false);

  if (role === null) {
    return <IntroScreen onAuth={setRole} />;
  }

  return (
    <RoleContext.Provider value={role}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Navigator activeId={activeId} onSelect={setActiveId} />
        <PanelWorkspace activeId={activeId} result={result} onJumpTo={setActiveId} />
        <div style={{
          display: 'flex', flexShrink: 0,
          borderLeft: '1px solid #1a2535',
          transition: 'width 200ms ease',
        }}>
          {/* Toggle-Handle, immer sichtbar am linken Rand des Monitor-Bereichs */}
          <button
            onClick={() => setMapCollapsed((c) => !c)}
            title={mapCollapsed ? 'Monitor ausfahren' : 'Monitor einklappen'}
            style={{
              width: 18, background: '#0d1520', color: '#a0aec0',
              border: 'none', borderRight: '1px solid #1a2535',
              cursor: 'pointer', fontSize: 13, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace',
            }}
          >
            {mapCollapsed ? '◂' : '▸'}
          </button>
          <div style={{
            width: mapCollapsed ? 0 : 420,
            transition: 'width 200ms ease',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <ScimMap result={result} />
          </div>
        </div>
      </div>
    </RoleContext.Provider>
  );
}
