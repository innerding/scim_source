// Leichter Navigations-Kontext: erlaubt beliebigen Panel-Views, zu einer Station
// (Panel + Tab) zu springen und die eigene Position zu kennen („du bist hier").
// Wird in App.tsx mit goTo() befüllt. Ermöglicht die Station-Shortcuts im
// Anthem-Pulse-Modal, ohne Props durch jede View zu fädeln.
import { createContext, useContext } from 'react';
import type { TabId } from './panelRegistry';

export type WorkspaceNav = {
  goStation: (panelId: string, tab?: TabId) => void;
  activeId: string;
  activeTab: TabId;
};

const Ctx = createContext<WorkspaceNav | null>(null);
export const WorkspaceNavProvider = Ctx.Provider;

export function useWorkspaceNav(): WorkspaceNav {
  return useContext(Ctx) ?? { goStation: () => {}, activeId: '', activeTab: 'input' as TabId };
}
