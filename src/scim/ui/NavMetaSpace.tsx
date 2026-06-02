// Meta-Space — grobe Felsbrocken (Mondlandschaft) unter dem Substrat-Tetraeder.
// „Der Grund": das dunkle Substrat-Geröll, aus dem Boundaries geschnitten werden
// und in das Pakete als Sediment zurücksinken. Rein dekorativ (vorerst), im Stil
// der Mond-Auswüchse — grobe Brocken in Kreisgröße. Siehe docs/begriffs_karte.md.

// Grobe, unregelmäßige Brocken (handgesetzte Polygone), entlang einer Geröll-Bank.
const ROCKS: string[] = [
  '11,31 12,23 17,19 24,20 27,26 26,33 20,36 14,35',
  '32,31 34,21 41,16 50,17 56,23 56,30 51,36 42,38 35,35',
  '62,34 63,27 67,24 73,27 74,32 70,37 64,37',
  '79,31 81,22 88,18 95,21 99,27 96,33 89,36 82,35',
  '103,35 104,29 109,26 113,30 113,36 108,38 104,37',
];

export default function NavMetaSpace() {
  return (
    <svg viewBox="0 0 124 42" width="100%" style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      {ROCKS.map((pts, i) => (
        <polygon key={i} points={pts}
          fill="#1b2330" stroke="#3a485d" strokeWidth={0.5} strokeLinejoin="round" />
      ))}
    </svg>
  );
}
