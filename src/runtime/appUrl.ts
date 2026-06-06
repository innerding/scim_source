// EINE Quelle der publizierten Ziel-App-URL (inkl. Zugangs-Gate ?k=…).
// Genutzt von ShellStudio (Live-Vorschau) und V03 (App-QR). Das Gate entriegelt das
// AccessGate der Runtime (sensus-core-runtime/AccessGate); per QR reist es mit, sodass
// ein fremdes User-Device die App ohne Passphrase-Eingabe öffnet.
//
// Override per VITE_APP_URL (z.B. Staging); Default = produktive diesenpark.com.

const DEFAULT_APP_URL = 'https://diesenpark.com/?k=geh-deinen-weg';

export const APP_URL: string =
  ((import.meta.env.VITE_APP_URL as string | undefined)?.trim() || DEFAULT_APP_URL).replace(/&$/, '');

// Direkt-Eintritt in eine Representation (QR → direkt zur Rep, ohne Launcher).
export const mvpUrl = (repId: string): string => `${APP_URL}&rep=${encodeURIComponent(repId)}`;
