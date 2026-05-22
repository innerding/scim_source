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

  if (role === null) {
    return <IntroScreen onAuth={setRole} />;
  }

  return (
    <RoleContext.Provider value={role}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Navigator activeId={activeId} onSelect={setActiveId} />
        <PanelWorkspace activeId={activeId} result={result} />
        <div style={{ width: 420, flexShrink: 0, position: 'relative', borderLeft: '1px solid #1a2535' }}>
          <ScimMap result={result} />
        </div>
      </div>
    </RoleContext.Provider>
  );
}
