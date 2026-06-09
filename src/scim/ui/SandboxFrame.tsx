// SandboxFrame — dauerhafter Mode-Marker: ein zarter Amber-Rahmen ums Viewport +
// kleines „folgenlos"-Label, wenn die aktive Ansicht SANDBOX ist (nicht live).
// Markiert den ZUSTAND (Analyst-Sicht ODER Operator-/Analyst-Vorschau nach unten),
// nicht die Rolle. Rein dekorativ (pointer-events: none).
const AMBER = 'rgba(245,158,11,0.85)';

export default function SandboxFrame() {
  return (
    <div aria-hidden style={{
      position: 'fixed', inset: 0, zIndex: 1200, pointerEvents: 'none',
      border: `3px solid ${AMBER}`, boxShadow: 'inset 0 0 0 1px rgba(245,158,11,0.25)',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 16,
        background: AMBER, color: '#1a1600', borderRadius: '0 0 5px 5px',
        fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
        fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', padding: '2px 10px',
      }}>SANDBOX · FOLGENLOS</div>
    </div>
  );
}
