// User-Ausschluss-Schwelle (Umbauplan C1) — runtime/user, NICHT operator.
// Der End-User neutralisiert Strecken über dieser Ø-Last (farblos). In SCIM
// simuliert (P09 Mask). Bewusst getrennt von colourSettings (operator/region):
// das ist eine flüchtige Laufzeit-Größe, später Teil von Anthem.
//
// null = kein Ausschluss. Zahl 0..1 = ab dieser Ø-Last je Strecke neutralisiert.

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const USER_EXCLUSION_EVENT = 'scim:user-exclusion:changed';
const KEY = 'scim3_user_exclusion';

// Reiner, testbarer Kern.
export function coerceExclusion(raw: unknown): number | null {
  if (raw == null) return null;
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : NaN;
  return Number.isFinite(n) ? clamp01(n) : null;
}

export function loadUserExclusion(): number | null {
  try { return coerceExclusion(localStorage.getItem(KEY)); } catch { return null; }
}

export function saveUserExclusion(value: number | null): void {
  const v = coerceExclusion(value);
  try {
    if (v == null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(v));
    window.dispatchEvent(new CustomEvent(USER_EXCLUSION_EVENT, { detail: { value: v } }));
  } catch { /* ignore */ }
}
