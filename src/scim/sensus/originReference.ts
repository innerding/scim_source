// EINE Origin-Resolve-Quelle (Umbauplan Phase 0). Statt drei zerfaserter Pfade
// (Manifest in P07 · Bundle beim Publish · buildOriginPackage im Studio) löst
// `resolveOriginReference` die Rep zu EINEM Referenzpaket auf:
//   • bundle   — genau das, was publiziert wird (origin_bundle_v1)
//   • pkg      — die Mess-/Render-Sicht (originNet) fürs Shell-Studio
//   • manifest — der L0-Anker
//   • anthem   — optional eine Last mitschicken (Studio-Test)
//
// Zwei Ausgänge: AUTOMATISCH vom Publish aufgerufen · MANUELL „Origin auflösen"
// → ans Shell-Studio anbieten. So testet das Studio gegen GENAU den Ship-Payload.

import { useSyncExternalStore } from 'react';
import { buildOriginBundle, buildOriginPackage, type OriginBundle, type OriginPackage } from './originPackage';
import { buildOriginManifest } from './originManifest';
import { produceAnthem } from './anthemProducer';
import type { OriginManifest, AnthemSnapshot } from './packageContract';
import type { Representation } from '../workspace/workspace.types';

export interface OriginReference {
  repId: string;
  repName: string;
  version: number;
  bundle: OriginBundle;          // was publiziert wird
  pkg: OriginPackage;            // Render-/Mess-Sicht (originNet)
  manifest: OriginManifest | null;
  anthem?: AnthemSnapshot;       // optional mitgeschickte Last
  simMin?: number;               // sim-Zeit des Anthem
}

const DEFAULT_SIM_MIN = 13 * 60;

export function resolveOriginReference(
  rep: Representation, opts?: { withAnthem?: boolean; simMin?: number },
): OriginReference {
  const bundle = buildOriginBundle(rep);
  const pkg = buildOriginPackage(rep);
  const manifest = buildOriginManifest(rep);
  const simMin = opts?.simMin ?? DEFAULT_SIM_MIN;
  const anthem = (opts?.withAnthem && pkg.originNet) ? produceAnthem(pkg.originNet, rep.id, simMin) : undefined;
  return {
    repId: rep.id, repName: rep.name, version: rep.version ?? 1,
    bundle, pkg, manifest, anthem, simMin: anthem ? simMin : undefined,
  };
}

// ─── Studio-Referenz-Store (in-memory + Event) ──────────────────────────────
// Die manuell „angebotene" Referenz fürs Shell-Studio. NICHT persistiert (Bundle
// + Assets können groß sein) — lebt für die Sitzung.
const STUDIO_EVENT = 'scim:origin-studio-ref';
let studioRef: OriginReference | null = null;

export function offerToStudio(ref: OriginReference | null): void {
  studioRef = ref;
  try { window.dispatchEvent(new Event(STUDIO_EVENT)); } catch { /* SSR/Tests */ }
}

export function getStudioReference(): OriginReference | null {
  return studioRef;
}

export function useStudioReference(): OriginReference | null {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(STUDIO_EVENT, cb);
      return () => window.removeEventListener(STUDIO_EVENT, cb);
    },
    () => studioRef,
    () => null,
  );
}
