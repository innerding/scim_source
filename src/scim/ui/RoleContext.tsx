import { createContext, useContext } from 'react';

// regio_editor = der KOMBINIERTE Editor-Modus (Operator-Vorschau, Split-Diode lila/orange,
// sieht beide Editor-Säulen). reg_editor (lila) / rep_editor (orange) = echte Editor-Logins
// mit getrennten Rechten (Reg nur Region, Rep nur Representation).
export type Role = 'operator' | 'analyst' | 'regio_editor' | 'reg_editor' | 'rep_editor';

// Operator-Vorschau-Kaskade (Footer-Diode): Operator→Analyst→kombinierter Editor.
// reg_editor/rep_editor sind echte Logins und NICHT Teil dieser Kaskade (terminal).
export const ROLE_ORDER: Role[] = ['operator', 'analyst', 'regio_editor'];

// Editor-Rollen (eigene Werkbank, reduzierter Navigator, Editor-Säulen).
export function isEditorRole(r: Role): boolean {
  return r === 'regio_editor' || r === 'reg_editor' || r === 'rep_editor';
}

export const RoleContext = createContext<Role>('operator');

export function useRole(): Role {
  return useContext(RoleContext);
}

// Modus-Umschalter: aktuelle (effektive) Rolle, echte Rolle und „durchklicken".
// Klick schaltet den Modus eine Stufe abwärts; am Ende zurück zur echten Rolle.
export interface ModeSwitch {
  real: Role;
  effective: Role;          // = Diode: Rolle/Zugriff (steuert Tab-Verfügbarkeit + Nav)
  cycle: () => void;        // Footer: Diode eine Stufe abwärts (Ansicht setzt sich zurück)
  set: (r: Role) => void;   // gezielt die Diode setzen (nur abwärts in der Kaskade)
  activeMode: Role;         // = aktiver Tab/Ansicht (entkoppelt von der Diode)
  setActiveMode: (r: Role) => void;   // Tab wählen — ändert NICHT die Diode
}
export const ModeSwitchContext = createContext<ModeSwitch | null>(null);
export function useModeSwitch(): ModeSwitch | null {
  return useContext(ModeSwitchContext);
}

// Login-Name der aktuellen Sitzung (für die Mehrbenutzer-Presence/Dauer-Kopplung).
// Leer = kein Name → keine Dauer-Anzeige.
export const UserNameContext = createContext<string>('');

export function useUserName(): string {
  return useContext(UserNameContext);
}
