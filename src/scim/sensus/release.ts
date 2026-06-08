// Release (Phase 2): eine committete Rep ausliefern = Phase-0-Resolve → Bundle
// nach R2 publizieren. Geteilt vom per-Rep-Knopf (Operator-Baum) und vom Batch
// (Release-Drossel V03 t4). „Commit ≠ Release" — ausgelöst nur durch Operator-Klick.

import { resolveOriginReference } from './originReference';
import { publishOriginBundle } from '../../runtime/anthemApi';
import type { Representation } from '../workspace/workspace.types';

export interface ReleaseResult { ok: boolean; version: number; bytes?: number; error?: string; }

export async function releaseRep(rep: Representation, publishedBy?: string): Promise<ReleaseResult> {
  const version = rep.version ?? 1;
  try {
    const res = await publishOriginBundle(rep.id, resolveOriginReference(rep).bundle, publishedBy);
    return { ok: true, version, bytes: res.bytes };
  } catch (e) {
    return { ok: false, version, error: (e as Error).message };
  }
}
