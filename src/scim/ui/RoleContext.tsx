import { createContext, useContext } from 'react';

export type Role = 'operator' | 'analyst' | 'regio_editor';

export const RoleContext = createContext<Role>('operator');

export function useRole(): Role {
  return useContext(RoleContext);
}

// Login-Name der aktuellen Sitzung (für die Mehrbenutzer-Presence/Dauer-Kopplung).
// Leer = kein Name → keine Dauer-Anzeige.
export const UserNameContext = createContext<string>('');

export function useUserName(): string {
  return useContext(UserNameContext);
}
