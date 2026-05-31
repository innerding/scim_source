import { useState } from 'react';
import ScimMap from './scim/ui/ScimMap';
import Navigator from './scim/ui/Navigator';
import PanelWorkspace from './scim/ui/PanelWorkspace';
import { useScimPipeline } from './scim/ui/useScimPipeline';
import IntroScreen from './scim/ui/IntroScreen';
import { RoleContext } from './scim/ui/RoleContext';
import type { Role } from './scim/ui/RoleContext';
import type { TabId } from './scim/ui/panelRegistry';
import RepresentBuildManualModal from './scim/ui/RepresentBuildManualModal';
import { RepresentationProvider } from './runtime/repContext';

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const result = useScimPipeline();
  const [activeId, setActiveId] = useState('P01');
  const [activeTab, setActiveTab] = useState<TabId>('input');
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [showManual, setShowManual] = useState(false);
  // Beim Sprung in den Geometry-Editor optional die zu oeffnende Boundary mitgeben.
  const [pendingGeometryId, setPendingGeometryId] = useState<string | null>(null);
  // Beim Sprung ins Katalog-Panel optional die zu oeffnende Katalog-Region mitgeben.
  const [pendingCatalogId, setPendingCatalogId] = useState<string | null>(null);

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
     <RepresentationProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <Navigator
          activeId={activeId}
          activeTab={activeTab}
          onSelect={(id) => goTo(id)}
          onGoTo={goTo}
          onInspectorToggle={toggleMap}
          inspectorActive={!mapCollapsed}
          onManualOpen={() => setShowManual(true)}
        />
        <PanelWorkspace
          activeId={activeId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          result={result}
          onJumpTo={(id, arg) => {
            if (id === 'catalog' && arg) setPendingCatalogId(arg);
            else if (arg) setPendingGeometryId(arg);
            goTo(id);
          }}
          openGeometryId={pendingGeometryId}
          onGeometryConsumed={() => setPendingGeometryId(null)}
          openCatalogId={pendingCatalogId}
          onCatalogConsumed={() => setPendingCatalogId(null)}
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
        {showManual && <RepresentBuildManualModal onClose={() => setShowManual(false)} />}
      </div>
     </RepresentationProvider>
    </RoleContext.Provider>
  );
}
