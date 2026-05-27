import { useState } from 'react';
import ScimMap from './scim/ui/ScimMap';
import Navigator from './scim/ui/Navigator';
import PanelWorkspace from './scim/ui/PanelWorkspace';
import { useScimPipeline } from './scim/ui/useScimPipeline';
import IntroScreen from './scim/ui/IntroScreen';
import { RoleContext } from './scim/ui/RoleContext';
import type { Role } from './scim/ui/RoleContext';
import type { TabId } from './scim/ui/panelRegistry';

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const result = useScimPipeline();
  const [activeId, setActiveId] = useState('P01');
  const [activeTab, setActiveTab] = useState<TabId>('input');
  const [mapCollapsed, setMapCollapsed] = useState(false);

  // Wrapper: wenn Panel wechselt, default-Tab 'input' setzen
  const goTo = (id: string, tab: TabId = 'input') => {
    setActiveId(id);
    setActiveTab(tab);
  };

  const toggleMap = () => setMapCollapsed((c) => !c);

  if (role === null) {
    return <IntroScreen onAuth={setRole} />;
  }

  return (
    <RoleContext.Provider value={role}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <Navigator
          activeId={activeId}
          activeTab={activeTab}
          onSelect={(id) => goTo(id)}
          onGoTo={goTo}
        />
        <PanelWorkspace
          activeId={activeId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          result={result}
          onJumpTo={(id) => goTo(id)}
        />
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
            onCollapseToggle={toggleMap}
            onNavigate={(face) => {
              if (face === 'geometry_draw') goTo('geometry_editor');
              else if (face === 'catalog_magazination') goTo('catalog');
              else if (face === 'represent_organisation') goTo('workspace');
              else if (face === 'sensus_core_build') goTo('P11');
            }}
          />
        </div>
        {/* Expand-Handle, sichtbar wenn Map eingeklappt */}
        {mapCollapsed && (
          <button
            onClick={toggleMap}
            title="Inspector einblenden"
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 1000,
              width: 28, height: 28, borderRadius: 4,
              border: '1px solid #2d4a6a', background: '#1a2535',
              color: '#a0aec0', fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >◀</button>
        )}
      </div>
    </RoleContext.Provider>
  );
}
