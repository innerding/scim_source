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

// ─── Inspector-Asset ──────────────────────────────────────────────────────────
// Welches *Workspace-Objekt* der Operator gerade im Inspector (ScimMap) sehen
// will. Im Gegensatz zu inspectorView (immer eine volle R mit Geometry, von
// DrawerPanel/P02 als Editier-Bezug genutzt) darf das hier auch ein Katalog
// allein (nur POIs) oder eine Boundary allein sein. Rein operator-lokal, nur
// ScimMap liest es. URL wird nicht angefasst.
export type InspectorAssetKind = 'representation' | 'geometry' | 'catalog';
export interface InspectorAsset {
  kind: InspectorAssetKind;
  id: string;
}

export interface RepresentationContextValue {
  // ─── Runtime-Schicht ─────────────────────────────────────────────────
  // Was die Endnutzer-App zeigt. Default-Quelle fuer alle Anschauer.
  active: ActiveRepresentation | null;
  /** Setze aktive R per Representation-ID. Aktualisiert URL via pushState. */
  setActiveRepresentation: (repId: string) => void;
  /** Setze zurueck, navigiere zu '/'. */
  clearActiveRepresentation: () => void;

  // ─── Operator-Schicht ────────────────────────────────────────────────
  // Was der Operator gerade *anschaut* — darf von active abweichen
  // (Compare-Modus, Referenz fuer den Editor). Null = follow active.
  // URL wird NICHT angefasst, das hier ist Operator-lokal.
  inspectorView: ActiveRepresentation | null;
  /** Set: id = follow eine bestimmte R; null = follow active. */
  setInspectorView: (repId: string | null) => void;
  /** Effektive Sicht: inspectorView wenn gesetzt, sonst active. */
  effectiveInspector: ActiveRepresentation | null;

  // ─── Inspector-Asset (Workspace-Auge) ────────────────────────────────
  // Welches Workspace-Objekt der Inspector roh anzeigen soll (Katalog →
  // nur POIs; Boundary → nur Umriss; Representation → alles). Null = nichts
  // erzwingen (Inspector folgt seiner Default-Logik).
  inspectorAsset: InspectorAsset | null;
  /** Setze das anzuzeigende Asset, oder null zum Loesen. */
  setInspectorAsset: (asset: InspectorAsset | null) => void;

  /** Vollstaendige Registry, hilfreich fuer Listen-Panels und Dropdowns. */
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

function buildView(repId: string): ActiveRepresentation | null {
  const rep = REPRESENTATIONS.find((r) => r.id === repId);
  if (!rep) return null;
  const geo = GEOMETRIES.find((g) => g.id === rep.geometry_id);
  if (!geo) return null;
  return { representation: rep, geometry: geo };
}

export function RepresentationProvider({ children }: RepresentationProviderProps) {
  const [active, setActive] = useState<ActiveRepresentation | null>(() => resolveCurrent());
  const [inspectorView, setInspectorViewState] = useState<ActiveRepresentation | null>(null);
  // Inspector-Default beim Start: die letzte Representation (zuletzt in der
  // Registry) — damit der Inspector nicht leer startet.
  const [inspectorAsset, setInspectorAsset] = useState<InspectorAsset | null>(
    () => REPRESENTATIONS.length > 0
      ? { kind: 'representation', id: REPRESENTATIONS[REPRESENTATIONS.length - 1].id }
      : null,
  );

  // Browser-Back/Forward synchronisieren
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onPop = () => setActive(resolveCurrent());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setActiveRepresentation = useCallback((repId: string) => {
    const next = buildView(repId);
    if (!next) return;
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

  const setInspectorView = useCallback((repId: string | null) => {
    if (repId === null) {
      setInspectorViewState(null);
      return;
    }
    setInspectorViewState(buildView(repId));
  }, []);

  const effectiveInspector = inspectorView ?? active;

  const value = useMemo<RepresentationContextValue>(() => ({
    active,
    setActiveRepresentation,
    clearActiveRepresentation,
    inspectorView,
    setInspectorView,
    effectiveInspector,
    inspectorAsset,
    setInspectorAsset,
    registry: { representations: REPRESENTATIONS, geometries: GEOMETRIES },
  }), [
    active, setActiveRepresentation, clearActiveRepresentation,
    inspectorView, setInspectorView, effectiveInspector,
    inspectorAsset, setInspectorAsset,
  ]);

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

/**
 * Lese-Hook fuer die *Operator-Sicht* — was im Inspector / als Bezugspunkt
 * gezeigt werden soll. Faellt automatisch auf active zurueck, wenn der
 * Operator keinen Compare-Modus aktiviert hat.
 */
export function useInspectorView(): ActiveRepresentation | null {
  return useRepresentationContext().effectiveInspector;
}

/**
 * Lese-Hook fuer das im Workspace per Auge gewaehlte Inspector-Asset
 * (Katalog / Boundary / Representation). Null = kein Asset erzwungen.
 */
export function useInspectorAsset(): InspectorAsset | null {
  return useRepresentationContext().inspectorAsset;
}
