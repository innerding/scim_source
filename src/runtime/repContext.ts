// RepresentationContext — globale aktive Representation fuer die Runtime.
//
// Schritt 3 von 4 fuer den R-Konsumenten (siehe ann_067 / docs/runtime_mvp.md).
//
// Wozu:
//   Der Router (Schritt 2) ist pure. Diese Datei verkabelt ihn mit
//   `window.location`, haelt die aktive R im React-State und stellt sie ueber
//   einen Hook bereit. Konsumenten (ScimMap, spaeter Wishlist, Guidance, …)
//   abonnieren `useActiveRepresentation()`.
//
// Verhalten:
//   - Beim Mount: pathname parsen + Match versuchen
//   - popstate (Browser-Back/Forward): erneut parsen
//   - setActiveRepresentation(repId): pushState + State setzen
//   - clearActiveRepresentation(): zurueck auf '/'
//
// Keine UI hier — nur Provider + Hook. Kein Side-Effect ausser
// History-Manipulation und popstate-Listener.

import {
  createContext, createElement, useCallback, useContext, useEffect, useMemo,
  useState, type ReactNode,
} from 'react';

import {
  GEOMETRIES, REPRESENTATIONS,
} from '../scim/workspace/workspace.registry';
import type { BoundaryGeometry, Representation } from '../scim/workspace/workspace.types';
import { resolveRuntimeUrl, slugify } from './router';

// ─── Shape ──────────────────────────────────────────────────────────────────

export interface ActiveRepresentation {
  representation: Representation;
  geometry: BoundaryGeometry;
}

export interface RepresentationContextValue {
  active: ActiveRepresentation | null;
  /** Setze aktive R per Representation-ID. Aktualisiert URL via pushState. */
  setActiveRepresentation: (repId: string) => void;
  /** Setze zurueck, navigiere zu '/'. */
  clearActiveRepresentation: () => void;
  /** Vollstaendige Registry, hilfreich fuer Listen-Panels. */
  registry: {
    representations: Representation[];
    geometries: BoundaryGeometry[];
  };
}

// ─── Context ────────────────────────────────────────────────────────────────

const RepresentationContext = createContext<RepresentationContextValue | null>(null);

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolveCurrent(): ActiveRepresentation | null {
  if (typeof window === 'undefined') return null;
  return resolveRuntimeUrl(window.location.pathname, REPRESENTATIONS, GEOMETRIES);
}

function pathnameForRep(active: ActiveRepresentation): string {
  const region = slugify(active.geometry.region ?? '');
  const rep = slugify(active.representation.name) || slugify(active.representation.geometry_id);
  if (!region || !rep) return '/';
  return `/${region}/${rep}`;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export interface RepresentationProviderProps {
  children: ReactNode;
}

export function RepresentationProvider({ children }: RepresentationProviderProps) {
  const [active, setActive] = useState<ActiveRepresentation | null>(() => resolveCurrent());

  // Browser-Back/Forward synchronisieren
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onPop = () => setActive(resolveCurrent());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setActiveRepresentation = useCallback((repId: string) => {
    const rep = REPRESENTATIONS.find((r) => r.id === repId);
    if (!rep) return;
    const geo = GEOMETRIES.find((g) => g.id === rep.geometry_id);
    if (!geo) return;
    const next: ActiveRepresentation = { representation: rep, geometry: geo };
    const nextPath = pathnameForRep(next);
    if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setActive(next);
  }, []);

  const clearActiveRepresentation = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setActive(null);
  }, []);

  const value = useMemo<RepresentationContextValue>(() => ({
    active,
    setActiveRepresentation,
    clearActiveRepresentation,
    registry: { representations: REPRESENTATIONS, geometries: GEOMETRIES },
  }), [active, setActiveRepresentation, clearActiveRepresentation]);

  return createElement(RepresentationContext.Provider, { value }, children);
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Liefert den vollen Context. Wirft, wenn ausserhalb eines Providers benutzt
 * — verhindert stille Bugs bei vergessener Provider-Verkabelung.
 */
export function useRepresentationContext(): RepresentationContextValue {
  const ctx = useContext(RepresentationContext);
  if (!ctx) {
    throw new Error(
      'useRepresentationContext muss innerhalb eines <RepresentationProvider> aufgerufen werden.',
    );
  }
  return ctx;
}

/**
 * Bequemer Lese-Hook fuer Konsumenten, die nur die aktive R brauchen.
 * Null bedeutet: keine R aktiv (Landing-Zustand).
 */
export function useActiveRepresentation(): ActiveRepresentation | null {
  return useRepresentationContext().active;
}
