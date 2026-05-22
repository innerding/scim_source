import { createContext, useContext } from 'react';

export type Role = 'operator' | 'analyst';

export const RoleContext = createContext<Role>('operator');

export function useRole(): Role {
  return useContext(RoleContext);
}
