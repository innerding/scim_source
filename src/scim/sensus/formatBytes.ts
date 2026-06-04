// Eine Quelle für die Byte-Formatierung (gegen Dopplung). Genutzt von P11
// (Pipeline, Sensus-Core-Pakete) und den Sichel-Views (P07/P08).
export function fmtBytes(n: number): string {
  return n < 1024 ? `${n} B`
    : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} kB`
    : `${(n / 1048576).toFixed(2)} MB`;
}
