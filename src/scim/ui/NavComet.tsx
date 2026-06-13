// Komet — das flüchtige Experiment (Quanten-Filter).
//
// Fliegt periodisch aus einer Ecke über die Kosmologie, zieht einen Schweif,
// verglüht vor dem Mond und zerstäubt als Funkenregen. NICHT in der Cosmo-
// Controls-Liste — nur am Himmel, nur im Vorbeiflug erreichbar. Das IST die
// Aussage: ein Experiment in Vorbereitung, das man fangen muss, solange es
// vorbeizieht. „Gnadenfenster": im Flug UND kurz im Verglühen klickbar.
//
// Bedeutung (vage, Vorbereitung): ein schneller Filter, der das ungeordnete
// Feld aus presence-origin/runtime/transmission-Anforderungen auf eine Eingangs-
// und Ausgangslinie legt und Ordnung VORSCHLÄGT — Aktion & Verantwortung bleiben
// bei SCIM3. Flüchtig, weil Experiment.

const SPARKS = [
  { dx: -40, dy: 60 }, { dx: -22, dy: 84 }, { dx: -8, dy: 54 }, { dx: 10, dy: 80 },
  { dx: 26, dy: 58 }, { dx: 40, dy: 72 }, { dx: 4, dy: 94 }, { dx: -28, dy: 44 },
  { dx: 18, dy: 38 }, { dx: -14, dy: 100 }, { dx: 32, dy: 96 }, { dx: -2, dy: 70 },
];

export default function NavComet({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 430, pointerEvents: 'none', zIndex: 8, overflow: 'visible' }}>
      {/* Komet: Schweif + Kopf in einem Wrapper, der entlang der Bahn fliegt. */}
      <div
        className="scim-comet"
        onClick={() => onSelect('comet')}
        title="Komet — Quanten-Filter (Experiment)"
        style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'auto', cursor: 'pointer' }}
      >
        {/* großzügige unsichtbare Fangfläche um den Kopf */}
        <div style={{ position: 'absolute', left: -13, top: -13, width: 26, height: 26, borderRadius: '50%' }} />
        {/* Schweif — tapernder Streif. Dreht sich beim Durchflug von führend
            (vor-sich-her) auf nachziehend (hinter-sich-her); verblasst vor dem
            Verglühen, damit die Explosion nur der Kopf-Blitz ist. */}
        <div className="scim-comet-tail" style={{
          position: 'absolute', left: -36, top: -3, width: 36, height: 6, borderRadius: 3,
          background: 'linear-gradient(to left, rgba(190,225,255,0.9), rgba(190,225,255,0))',
        }} />
        {/* Kopf — heller Kern + Hof */}
        <div style={{ position: 'absolute', left: -7, top: -7, width: 14, height: 14, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,240,255,0.55), rgba(220,240,255,0))' }} />
        <div style={{ position: 'absolute', left: -2.5, top: -2.5, width: 5, height: 5, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px 1px rgba(200,230,255,0.9)' }} />
      </div>

      {/* Funkenregen am Verglüh-Punkt */}
      <div style={{ position: 'absolute', left: 104, top: 206, width: 0, height: 0 }}>
        {SPARKS.map((s, i) => (
          <div key={i} className="scim-spark" style={{
            position: 'absolute', width: 3.6, height: 3.6, borderRadius: '50%',
            background: 'rgba(220,240,255,0.95)',
            // @ts-expect-error CSS custom props
            '--dx': `${s.dx}px`, '--dy': `${s.dy}px`,
            animationDelay: `${(i % 4) * 90}ms`,
          }} />
        ))}
      </div>

      <style>{`
        /* Wrapper: gleichmäßiger Flug entlang EINER glatten Strecke (kein
           Zwischen-Knick → kein Ruck), Schweif konstant nachziehend (rotate -66°,
           kein Schwenk). Anflug wächst (scale 0.5→1, „kommt auf uns zu"); 3×-Blitz. */
        @keyframes scim-comet-fly {
          0%   { transform: translate(196px, 6px) rotate(114deg) scale(0.5); opacity: 0; }
          8%   { opacity: 1; }
          30%  { transform: translate(108px, 202px) rotate(114deg) scale(1); opacity: 1; }
          32%  { transform: translate(107px, 205px) rotate(114deg) scale(4.5); opacity: 1; }
          36%  { transform: translate(105px, 209px) rotate(114deg) scale(0.12); opacity: 0; }
          37%  { transform: translate(330px, -70px) scale(0.12); opacity: 0; }
          100% { transform: translate(330px, -70px) scale(0.12); opacity: 0; }
        }
        .scim-comet { animation: scim-comet-fly 15s linear infinite; }
        /* Schweif NACHZIEHEND (rotate 114° am Wrapper). Kurz beim Anflug, voll über
           die Sternenscheibe, dann ZIEHT er sich in den Kopf zurück (scaleX→0,
           Ursprung = Kopf-Ende), sobald der Komet die Scheibe verlässt — weg, bevor
           er explodiert. */
        @keyframes scim-comet-tail {
          0%   { opacity: 0; transform: scaleX(0.15); }
          8%   { opacity: 1; transform: scaleX(0.55); }
          22%  { transform: scaleX(1); }
          25%  { transform: scaleX(1); }
          31%  { opacity: 1; transform: scaleX(0.06); }
          32%  { opacity: 0; transform: scaleX(0.04); }
          100% { opacity: 0; transform: scaleX(0.04); }
        }
        .scim-comet-tail { animation: scim-comet-tail 15s linear infinite; transform-origin: 100% 50%; }
        /* Funkenregen — ~0.5× schneller. */
        @keyframes scim-spark {
          0%, 31% { opacity: 0; transform: translate(0,0); }
          34%     { opacity: 1; }
          41%     { opacity: 0; transform: translate(var(--dx,0), var(--dy,30px)); }
          100%    { opacity: 0; transform: translate(var(--dx,0), var(--dy,30px)); }
        }
        .scim-spark { animation: scim-spark 15s linear infinite; }
      `}</style>
    </div>
  );
}
