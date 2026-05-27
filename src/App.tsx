import { useState } from 'react';
import ScimMap from './scim/ui/ScimMap';
import Navigator from './scim/ui/Navigator';
import PanelWorkspace from './scim/ui/PanelWorkspace';
import { useScimPipeline } from './scim/ui/useScimPipeline';
import IntroScreen from './scim/ui/IntroScreen';
import { RoleContext } from './scim/ui/RoleContext';
import type { Role } from './scim/ui/RoleContext';
import RepresentBuildManualModal from './scim/ui/RepresentBuildManualModal';

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const result = useScimPipeline();
  const [activeId, setActiveId] = useState('P01');
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [showManual, setShowManual] = useState(false);

  if (role === null) {
    return <IntroScreen onAuth={setRole} />;
  }

  return (
    <RoleContext.Provider value={role}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Navigator
          activeId={activeId}
          onSelect={setActiveId}
          onInspectorToggle={() => setMapCollapsed((c) => !c)}
          onManualOpen={() => setShowManual(true)}
        />
        <PanelWorkspace activeId={activeId} result={result} onJumpTo={setActiveId} />
        <div style={{
          flexShrink: 0,
          borderLeft: '1px solid #1a2535',
          width: mapCollapsed ? 0 : 420,
          transition: 'width 200ms ease',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <ScimMap
            result={result}
            onNavigate={(face) => {
              if (face === 'geometry_draw') setActiveId('geometry_editor');
              else if (face === 'catalog_magazination') setActiveId('P02');
              else if (face === 'represent_organisation') setActiveId('workspace');
            }}
          />
        </div>
        {showManual && <RepresentBuildManualModal onClose={() => setShowManual(false)} />}
      </div>
    </RoleContext.Provider>
  );
}
