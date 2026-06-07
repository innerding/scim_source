import type { Role } from './RoleContext';

// Client-only Passkey-Schicht. Speichert credentialId + Rolle in localStorage.
// Kein Server, keine Krypto-Verifikation — dient als UX-Gate, gleichwertig
// zum bestehenden Code-Eingabe-Gate. Fallback auf Code bleibt immer möglich.

const STORAGE_KEY = 'scim_passkey_v1';
const RP_NAME = 'SCIM3';

interface StoredPasskey {
  credentialId: string;
  role: Role;
  userName?: string;
}

function b64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomChallenge(): ArrayBuffer {
  const buf = new Uint8Array(new ArrayBuffer(32));
  crypto.getRandomValues(buf);
  return buf.buffer as ArrayBuffer;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

export function isPasskeySupported(): boolean {
  return typeof window !== 'undefined'
    && typeof window.PublicKeyCredential !== 'undefined'
    && typeof navigator.credentials?.create === 'function';
}

export function getStoredPasskey(): StoredPasskey | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPasskey;
    if (!parsed.credentialId || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPasskey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function registerPasskey(role: Role, userName: string): Promise<boolean> {
  if (!isPasskeySupported()) return false;
  const userIdBytes = new Uint8Array(new ArrayBuffer(16));
  crypto.getRandomValues(userIdBytes);
  const userId = userIdBytes.buffer as ArrayBuffer;
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: RP_NAME },
        user: {
          id: userId,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
        attestation: 'none',
      },
    }) as PublicKeyCredential | null;
    if (!cred) return false;
    const stored: StoredPasskey = {
      credentialId: b64urlEncode(cred.rawId),
      role,
      userName,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

export async function tryPasskeyLogin(): Promise<{ role: Role; userName: string } | null> {
  if (!isPasskeySupported()) return null;
  const stored = getStoredPasskey();
  if (!stored) return null;
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [{
          type: 'public-key',
          id: toArrayBuffer(b64urlDecode(stored.credentialId)),
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60_000,
      },
    });
    if (!assertion) return null;
    return { role: stored.role, userName: stored.userName ?? '' };
  } catch {
    return null;
  }
}
