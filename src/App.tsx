import { useState, useEffect } from 'react';
import ScimMap from './scim/ui/ScimMap';
import Navigator from './scim/ui/Navigator';
import PanelWorkspace from './scim/ui/PanelWorkspace';
import { useScimPipeline } from './scim/ui/useScimPipeline';
import IntroScreen from './scim/ui/IntroScreen';
import { RoleContext, UserNameContext, ModeSwitchContext, ROLE_ORDER } from './scim/ui/RoleContext';
import type { Role } from './scim/ui/RoleContext';
import type { TabId } from './scim/ui/panelRegistry';
import RepresentBuildManualModal from './scim/ui/RepresentBuildManualModal';
import { RepresentationProvider } from './runtime/repContext';
import { WorkspaceNavProvider } from './scim/ui/workspaceNav';
import Scim3Footer from './scim/ui/Scim3Footer';

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [preview, setPreview] = useState<Role | null>(null);   // Diode-Vorschau (effektive Rolle)
  const [activeMode, setActiveModeState] = useState<Role | null>(null);   // aktiver Tab (entkoppelt)
  const result = useScimPipeline();
  // Default-Panel: zuletzt geöffnetes (gemerkt), sonst Pathworks (Hub) — nicht mehr P01.
  const [activeId, setActiveId] = useState<string>(() => {
    try { return localStorage.getItem('scim3_last_panel') || 'workspace'; } catch { return 'workspace'; }
  });
  useEffect(() => { try { localStorage.setItem('scim3_last_panel', activeId); } catch { /* noop */ } }, [activeId]);
  const [activeTab, setActiveTab] = useState<TabId>('input');
  // Inspector startet eingeklappt → ScimMap wird NICHT beim Start gemountet
  // (kein Off-screen-Rechnen beim Kaltstart). Aber: nach dem 1. Öffnen bleibt sie
  // gemountet (mapEverOpened) und wird nur per CSS versteckt → Wiederöffnen ohne
  // Leaflet-Neuaufbau/Verzögerung. Öffnen via Navigator-Trapez.
  const [mapCollapsed, setMapCollapsed] = useState(true);
  const [mapEverOpened, setMapEverOpened] = useState(false);
  const [showManual, setShowManual] = useState(false);
  // Analyst-Geste: bei den ersten 2 Anmeldungen eines Analysten das Usage-Manual
  // automatisch öffnen (Einstiegshilfe). Zähler in localStorage; Operator unberührt.
  useEffect(() => {
    if (role !== 'analyst') return;
    try {
      const seen = Number(localStorage.getItem('scim3_manual_seen') || '0');
      if (seen < 2) {
        setShowManual(true);
        localStorage.setItem('scim3_manual_seen', String(seen + 1));
      }
    } catch { /* noop */ }
  }, [role]);
  // Beim Sprung in den Geometry-Editor optional die zu oeffnende Boundary mitgeben.
  const [pendingGeometryId, setPendingGeometryId] = useState<string | null>(null);
  // Beim Sprung ins Katalog-Panel optional die zu oeffnende Katalog-Region mitgeben.
  const [pendingCatalogId, setPendingCatalogId] = useState<string | null>(null);

  // Wrapper: wenn Panel wechselt, default-Tab 'input' setzen
  const goTo = (id: string, tab: TabId = 'input') => {
    setActiveId(id);
    setActiveTab(tab);
  };

  const toggleMap = () => setMapCollapsed((c) => {
    if (c) setMapEverOpened(true); // beim Öffnen einmalig scharfschalten
    return !c;
  });

  if (role === null) {
    return <IntroScreen onAuth={(r, n) => { setUserName(n); setRole(r); }} />;
  }

  // Effektive Rolle: man darf nur ABWÄRTS in der Kaskade vorschauen (Operator→Analyst→Rep-Editor).
  const effectiveRole: Role =
    preview && ROLE_ORDER.indexOf(preview) >= ROLE_ORDER.indexOf(role) ? preview : role;
  // Diode durchklicken: eine Stufe abwärts, am Ende zurück zur echten Rolle.
  // Diode-Wechsel setzt die Ansicht (activeMode) auf die neue Diode-Rolle zurück.
  const cycleMode = () => {
    const allowed = ROLE_ORDER.slice(ROLE_ORDER.indexOf(role));   // Rollen ab der eigenen abwärts
    if (allowed.length <= 1) return;                              // Rep-Editor kann nicht wechseln
    const next = allowed[(allowed.indexOf(effectiveRole) + 1) % allowed.length];
    setPreview(next === role ? null : next);
    setActiveModeState(null);
  };
  // Gezielt die Diode setzen (nur abwärts in der Kaskade erlaubt).
  const setMode = (target: Role) => {
    if (ROLE_ORDER.indexOf(target) < ROLE_ORDER.indexOf(role)) return;
    setPreview(target === role ? null : target);
    setActiveModeState(null);
  };
  // Aktiver Tab/Ansicht — entkoppelt von der Diode; nur innerhalb des Verfügbaren
  // (Index ≥ Diode). Fällt auf die Diode-Rolle zurück, wenn nicht (mehr) verfügbar.
  const effIdx = ROLE_ORDER.indexOf(effectiveRole);
  const resolvedActiveMode: Role =
    activeMode && ROLE_ORDER.indexOf(activeMode) >= effIdx ? activeMode : effectiveRole;
  const setActiveMode = (target: Role) => {
    if (ROLE_ORDER.indexOf(target) < effIdx) return;             // nicht verfügbar
    setActiveModeState(target === effectiveRole ? null : target);
  };

  return (
    <RoleContext.Provider value={effectiveRole}>
     <ModeSwitchContext.Provider value={{ real: role, effective: effectiveRole, cycle: cycleMode, set: setMode, activeMode: resolvedActiveMode, setActiveMode }}>
     <UserNameContext.Provider value={userName}>
     <RepresentationProvider>
      <WorkspaceNavProvider value={{ goStation: goTo, activeId, activeTab }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flex: '1 1 auto', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
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
          {mapEverOpened && (
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
          )}
        </div>
        {showManual && <RepresentBuildManualModal onClose={() => setShowManual(false)} />}
      </div>
      <Scim3Footer realRole={role} />
      </div>
      </WorkspaceNavProvider>
     </RepresentationProvider>
     </UserNameContext.Provider>
     </ModeSwitchContext.Provider>
    </RoleContext.Provider>
  );
}
