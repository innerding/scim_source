// BAP · BCK · BAK — das Innovations-Loop-Emblem. Dreieck (drei Broda-Funktionen) +
// Kürzel an den Ecken + Blitz-im-Kreis (Innovation/Puls) + Loop-Ring (der Kreislauf).
//   BAP = Broda-Anthem-Pulse  (misst die Last — Voraussetzung)
//   BCK = Broda Comfort Kernel (beobachtet den Comfort)
//   BAK = Broda Avoidance Kernel (handelt: Deeskalation)
// Reine Grafik-Lösung (Naming via Bild). Konsens 2026-06-04.

const C = {
  bap: '#b7791f', // amber — Puls
  bck: '#2f855a', // grün — Comfort
  bak: '#6b46c1', // violett — Avoidance
};

export function BrodaLoopEmblem({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 124" aria-label="BAP·BCK·BAK Innovations-Loop">
      {/* Loop-Ring (der Kreislauf) */}
      <circle cx="60" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3 5" />

      {/* Dreieck der drei Broda-Funktionen */}
      <polygon points="60,22 24,92 96,92" fill="none" stroke="#cbd5e0" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Ecken-Knoten */}
      <circle cx="60" cy="22" r="6" fill={C.bap} />
      <circle cx="24" cy="92" r="6" fill={C.bck} />
      <circle cx="96" cy="92" r="6" fill={C.bak} />

      {/* Kürzel an den Ecken */}
      <text x="60" y="13" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.bap} fontFamily="system-ui, sans-serif">BAP</text>
      <text x="16" y="110" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.bck} fontFamily="system-ui, sans-serif">BCK</text>
      <text x="104" y="110" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.bak} fontFamily="system-ui, sans-serif">BAK</text>

      {/* Zentrum: Blitz (Innovation), umschlossen von einem Kreis */}
      <circle cx="60" cy="66" r="18" fill="#fffaf0" stroke={C.bap} strokeWidth="2" />
      <path d="M63 54 L52 68 L59 68 L57 80 L70 64 L62 64 Z" fill={C.bap} stroke={C.bap} strokeWidth="0.5" strokeLinejoin="round" />
    </svg>
  );
}
