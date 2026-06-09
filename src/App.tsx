import { useState, useEffect } from 'react';
import ScimMap from './scim/ui/ScimMap';
import Navigator from './scim/ui/Navigator';
import PanelWorkspace from './scim/ui/PanelWorkspace';
import { useScimPipeline } from './scim/ui/useScimPipeline';
import IntroScreen from './scim/ui/IntroScreen';
import { RoleContext, UserNameContext, ModeSwitchContext, ROLE_ORDER, isEditorRole } from './scim/ui/RoleContext';
import type { Role } from './scim/ui/RoleContext';
import type { TabId } from './scim/ui/panelRegistry';
import RepresentBuildManualModal from './scim/ui/RepresentBuildManualModal';
import EditorManualModal from './scim/ui/EditorManualModal';
import SandboxFrame from './scim/ui/SandboxFrame';
import { RepresentationProvider } from './runtime/repContext';
import { WorkspaceNavProvider } from './scim/ui/workspaceNav';
import Scim3Footer from './scim/ui/Scim3Footer';

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [preview, setPreview] = useState<Role | null>(null);   // Diode-Vorschau (effektive Rolle)
  const [activeMode, setActiveModeState] = useState<Role | null>(null);   // aktiver Tab (entkoppelt)
  const result = useScimPipeline();
  // Seed vor dem Login (zeigt eh die Intro); der Login setzt die Landung dann
  // rollen-basiert (Editor → Pathworks Hub, Operator/Analyst → V03 · Puls).
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
  // Einstiegshilfe: bei den ersten 2 Anmeldungen automatisch das passende Manual
  // öffnen — Analyst → voller Atlas, Editoren → Editor-Handbuch. Operator unberührt.
  // Eigener Zähler je Manual-Art (localStorage).
  useEffect(() => {
    if (!role) return;
    const key = role === 'analyst' ? 'scim3_manual_seen'
      : isEditorRole(role) ? 'scim3_editor_manual_seen' : null;
    if (!key) return;
    try {
      const seen = Number(localStorage.getItem(key) || '0');
      if (seen < 2) {
        setShowManual(true);
        localStorage.setItem(key, String(seen + 1));
      }
    } catch { /* noop */ }
  }, [role]);
  // Beim Sprung in den Geometry-Editor optional die zu oeffnende Boundary mitgeben.
  const [pendingGeometryId, setPendingGeometryId] = useState<string | null>(null);
  // Beim Sprung ins Katalog-Panel optional die zu oeffnende Katalog-Region mitgeben.
  const [pendingCatalogId, setPendingCatalogId] = useState<string | null>(null);

  // Wrapper: wenn Panel wechselt, Default-Tab setzen. Pro Panel überschreibbar
  // (P11 öffnet auf Transfer, V03 auf Puls); ein explizit übergebener Tab gewinnt
  // immer (z.B. Footer-Presence → V03 t1).
  const DEFAULT_TAB: Record<string, TabId> = { P11: 'transfer', V03: 't5', P06: 't1' };
  const goTo = (id: string, tab?: TabId) => {
    setActiveId(id);
    setActiveTab(tab ?? DEFAULT_TAB[id] ?? 'input');
  };

  const toggleMap = () => setMapCollapsed((c) => {
    if (c) setMapEverOpened(true); // beim Öffnen einmalig scharfschalten
    return !c;
  });

  if (role === null) {
    // Login-Landung rollen-basiert: Editoren → Pathworks Hub (ihre Heimat),
    // Operator/Analyst → V03 · Puls (der Wahrheitskreislauf, hot path).
    return <IntroScreen onAuth={(r, n) => {
      setUserName(n); setRole(r);
      if (isEditorRole(r)) { setActiveId('workspace'); setActiveTab('input'); }
      else { setActiveId('V03'); setActiveTab('t5'); }
    }} />;
  }

  // Vorschau nur für Kaskaden-Rollen (Operator/Analyst); echte Editor-Logins (reg/rep) sind terminal.
  const inCascade = ROLE_ORDER.indexOf(role) >= 0;
  const effectiveRole: Role =
    inCascade && preview && ROLE_ORDER.indexOf(preview) >= ROLE_ORDER.indexOf(role) ? preview : role;
  // Diode durchklicken: eine Stufe abwärts, am Ende zurück zur echten Rolle.
  const cycleMode = () => {
    if (!inCascade) return;
    const allowed = ROLE_ORDER.slice(ROLE_ORDER.indexOf(role));   // Rollen ab der eigenen abwärts
    if (allowed.length <= 1) return;
    const next = allowed[(allowed.indexOf(effectiveRole) + 1) % allowed.length];
    setPreview(next === role ? null : next);
    setActiveModeState(null);
  };
  // Gezielt die Diode setzen (nur abwärts in der Kaskade erlaubt).
  const setMode = (target: Role) => {
    if (!inCascade || ROLE_ORDER.indexOf(target) < ROLE_ORDER.indexOf(role)) return;
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

  // Sandbox = aktive Ansicht ist NICHT live (folgenlos): Analyst-Sicht oder eine
  // Vorschau nach unten. Live nur, wenn das echte Login den aktiven Modus besitzt
  // und es nicht Analyst ist — sonst Sandbox (→ Amber-Mode-Rahmen).
  const isSandbox = !(role === resolvedActiveMode && resolvedActiveMode !== 'analyst');

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
        {showManual && (isEditorRole(role)
          ? <EditorManualModal onClose={() => setShowManual(false)} />
          : <RepresentBuildManualModal onClose={() => setShowManual(false)} />)}
        {isSandbox && <SandboxFrame />}
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
