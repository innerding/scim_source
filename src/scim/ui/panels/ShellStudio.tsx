// Shell-Studio — Dual-Lane: EINE Funktions-Liste, zwei Lanes.
//   SIM (links/High)  = Oberfläche (Sim-Vorschau im Device-Frame) + SIM-Code, der sie
//                       in SCIM rendert + Design-Notizen. „Was SCIM simuliert."
//   PRODUKTION (rechts/Deep) = der Ziel-App-Code, der WIRKLICH ausgespielt wird —
//                       NICHT live mitcodiert, sondern auf Anforderung generiert
//                       (Footer: Plattform wählen → rechnen → Code je Block + Summe →
//                       Sensus Core Publishing packt). SIM-Code ≠ Produktions-Code.
// Das ist NICHT SCIM3 selbst, sondern was SCIM3 in die Ziel-App bringt.
import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react';
import { ComfortSliders } from 'shell-kit';
import { SHELL_FUNCTIONS, TARGET_PLATFORMS, STUB, type ShellFunction, type TargetPlatform } from '../../shell-studio/shellStudio';
import { useWorkspaceNav } from '../workspaceNav';
import { ShellRunBadge } from '../ShellRunInfo';
import { useAuftraggeberRep } from '../../../runtime/useAuftraggeberRep';
import { buildOriginPackage } from '../../sensus/originPackage';
import { produceAnthem, dayPhase } from '../../sensus/anthemProducer';
import { fmtBytes } from '../../sensus/formatBytes';
import { APP_URL, mvpUrl } from '../../../runtime/appUrl';
import ShellNewMonitor from './ShellNewMonitor';

// Test-Stand-Switch (Origin/Anthem): zapft echte Daten der aktiven Rep an.
function HarnessSwitch({ on, label, tone, onClick }: { on: boolean; label: string; tone: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
      fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999,
      border: `1px solid ${on ? tone : '#cbd5e0'}`,
      background: on ? tone : '#fff', color: on ? '#fff' : '#718096',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? '#fff' : '#cbd5e0' }} />
      {label}
    </button>
  );
}
import { colorAt, DEFAULT_SCALE } from 'shell-kit';

// Die echte, veröffentlichte erste Demo der Ziel-App. Surface-Blöcke zeigen SIE
// (inkl. Expand/Collapse/Positionierung) — keine erfundene Nachbildung.
// APP_URL/mvpUrl = EINE Quelle (runtime/appUrl), geteilt mit V03 (App-QR).
// MVP-Lichtenberg: gleiche Domain + ?rep=rep-lichtenberg (lädt das echte Lichtenberg-Origin).
// Demo bleibt der Default (bare URL).
const MVP_URL = mvpUrl('rep-lichtenberg');

const FRAME_H = 649; // Handy-Proportion 390:844 bei fester Breite 300 → 300 × 844/390 ≈ 649
const DEV_W = 300; // feste Breite; FRAME_H folgt der Handy-Proportion 390:844
const DEV_BORDER = 9;
const CONTENT_W = DEV_W - 2 * DEV_BORDER;   // sichtbare Frame-Innenbreite
const CONTENT_H = FRAME_H - 2 * DEV_BORDER;

function FrameLabel({ children, tone }: { children: ReactNode; tone: string }) {
  return <div style={{ fontSize: 9.5, color: tone, textAlign: 'center', marginBottom: 3, fontWeight: 700 }}>{children}</div>;
}

// Spalte 1 · Vorschau — die echte App im Mobile-Device-Frame.
function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <FrameLabel tone="#2b6cb0">Vorschau · diesenpark.com (live)</FrameLabel>
      <div style={{
        width: DEV_W, height: FRAME_H, borderRadius: 28, border: `${DEV_BORDER}px solid #1a202c`,
        background: '#000', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 64, height: 13, background: '#1a202c', borderRadius: '0 0 10px 10px', zIndex: 5 }} />
        <div style={{ width: '100%', height: '100%', background: '#fff', overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
}

// Spalte 3 · Funktions-Visualisierung — rahmenlos, gleich hoch; analytische Sicht der Funktion.
function VizBox({ children }: { children: ReactNode }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <FrameLabel tone="#718096">Funktions-Visualisierung</FrameLabel>
      <div style={{ width: 200, height: FRAME_H, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function CodeFrame({ code, w = 300, tone = '#9ecbff' }: { code: string; w?: number; tone?: string }) {
  return (
    <div style={{ width: w, height: FRAME_H, flexShrink: 0, overflow: 'auto', background: '#0d1117', borderRadius: 10, border: '1px solid #1a2535' }}>
      <pre style={{ margin: 0, padding: '10px 12px', fontSize: 11, lineHeight: 1.55, color: tone, fontFamily: 'ui-monospace, Menlo, monospace', whiteSpace: 'pre' }}>{code}</pre>
    </div>
  );
}

function Notes({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div style={{ width: 165, flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tone, marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 15, fontSize: 10.5, color: '#4a5568', lineHeight: 1.45 }}>
        {items.map((t, i) => <li key={i} style={{ marginBottom: 3 }}>{t}</li>)}
      </ul>
    </div>
  );
}

// Die echte, live laufende Ziel-App im Device-Frame. Sie rendert in echter Mobil-
// Breite (390 px) und wird auf die Frame-Breite herunterskaliert → ganze App sichtbar,
// nicht nur ein Ausschnitt.
function AppIframe({ src }: { src: string }) {
  const VW = 390;
  const scale = CONTENT_W / VW;
  return (
    <iframe
      key={src}
      src={src}
      title="Ziel-App · diesenpark.com"
      loading="lazy"
      style={{
        width: VW, height: CONTENT_H / scale, border: 'none', display: 'block',
        transform: `scale(${scale})`, transformOrigin: 'top left',
      }}
    />
  );
}


// Funktions-Visualisierung „colorize" — der Farb-Schlüssel (Last → Farbe), echte colorize-Fn.
function ColorizeViz() {
  const samples = [0.12, 0.38, 0.62, 0.88];
  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a365d' }}>Auslastung</div>
      <div style={{ height: 16, borderRadius: 3, background: `linear-gradient(to right, ${[0, 0.25, 0.5, 0.75, 1].map((t) => colorAt(t, DEFAULT_SCALE)).join(', ')})` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#a0aec0' }}><span>ruhig</span><span>busy</span></div>
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {samples.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: colorAt(l, DEFAULT_SCALE) }} />
            <span style={{ fontSize: 9, color: '#718096', fontFamily: 'ui-monospace, Menlo, monospace' }}>{l.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Funktions-Visualisierung „reveal" — die vier Phasen des Boundary-Reveals.
function RevealViz() {
  const phases = [
    { n: 1, t: 'weißer Screen', c: '#fff', b: '#e2e8f0' },
    { n: 2, t: 'Fenster wächst (f0.5)', c: '#f7fafc', b: '#cbd5e0' },
    { n: 3, t: 'Fill dimmt aus', c: '#edf2f7', b: '#a0aec0' },
    { n: 4, t: 'Boundary bleibt', c: '#fff', b: '#0074d9' },
  ];
  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a365d' }}>Reveal · Phasen</div>
      {phases.map((p) => (
        <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 4, background: p.c, border: `2px solid ${p.b}` }} />
          <span style={{ fontSize: 10, color: '#4a5568' }}><strong>{p.n}.</strong> {p.t}</span>
        </div>
      ))}
    </div>
  );
}

// Funktions-Visualisierung „gate" — der Gate-Zustand + das Bündeln.
function GateViz() {
  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a365d' }}>Refresh-Gate</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: '#fefcbf', border: '2px solid #d69e2e' }} />
        <span style={{ fontSize: 10, color: '#4a5568' }}>gültig → <strong>blockiert</strong> (halten)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: '#c6f6d5', border: '2px solid #2f855a' }} />
        <span style={{ fontSize: 10, color: '#4a5568' }}>nextAt erreicht → <strong>erlaubt</strong></span>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', background: '#f7fafc', borderRadius: 6, fontSize: 10, color: '#718096', lineHeight: 1.4 }}>
        viele Interaktionen<br />→ höchstens <strong>1 Anforderung</strong> / Fenster
      </div>
    </div>
  );
}

// Funktions-Visualisierung „comfort" — die drei Strecken-Zustände (crossing-gated).
// Comfort-Button: die ECHTE Komponente aus shell-kit (1:1, nicht nachgezeichnet).
// position:absolute der ComfortSliders wird vom relative-Container gerahmt. Nur Move
// (step2Active=false). Interaktiv (Drag aktualisiert den lokalen Wert).
function ComfortViz() {
  const [mv, setMv] = useState(0.5);
  return (
    <div style={{ position: 'relative', height: '100%', padding: 12, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a365d' }}>Comfort-Button · echte UI</div>
      <div style={{ fontSize: 9.5, color: '#718096', lineHeight: 1.4, marginTop: 4, maxWidth: 150 }}>
        1:1 aus <code>shell-kit</code> gerendert (nicht nachgezeichnet). Nur Move — Rest/Rast aus.
      </div>
      <ComfortSliders
        movementValue={mv}
        stayValue={0.5} stayMaxValue={1}
        onMovementChange={setMv} onStayChange={() => {}}
        step2Active={false}
      />
    </div>
  );
}

// Spalte 3 · Funktions-Visualisierung (rahmenlos): analytische Sicht.
function Viz({ fn }: { fn: ShellFunction }) {
  if (fn.viz === 'colorize') return <ColorizeViz />;
  if (fn.viz === 'reveal') return <RevealViz />;
  if (fn.viz === 'gate') return <GateViz />;
  if (fn.viz === 'comfort') return <ComfortViz />;
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 12, textAlign: 'center', fontSize: 10, color: '#cbd5e0', fontStyle: 'italic' }}>—</div>;
}

export default function ShellStudio() {
  const { goStation } = useWorkspaceNav();
  const [open, setOpen] = useState<Record<string, boolean>>({ map: true });
  const [targets, setTargets] = useState<Set<TargetPlatform>>(new Set(['web']));
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const toggleTarget = (p: TargetPlatform) => setTargets((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });

  // Test-Stand: echte Daten der aktiven Rep an die Funktionen anlegen.
  //   Origin → buildOriginPackage (per-Rep, tief) · Anthem → simSegmentLoads (Last).
  // (NICHT der Collector — der ist die über-Rep-Liste.)
  const rep = useAuftraggeberRep();
  const [vorschauMvp, setVorschauMvp] = useState(false); // Vorschau-iframe: Demo (Bestand) ↔ MVP-Lichtenberg
  const [originOn, setOriginOn] = useState(false);
  const [anthemOn, setAnthemOn] = useState(false);
  const [turboHour, setTurboHour] = useState(13); // anthem-sim Zeit (Time/Turbo) — bei echtem Last-Paket weg
  const simMin = turboHour * 60;
  const originPkg = useMemo(() => (originOn || anthemOn) ? buildOriginPackage(rep) : null, [originOn, anthemOn, rep]);
  const loads = useMemo(
    () => (anthemOn && originPkg?.originNet) ? produceAnthem(originPkg.originNet, rep.id, simMin).loads : null,
    [anthemOn, originPkg, rep, simMin],
  );
  const phaseLabel = dayPhase(simMin) > 0.85 ? 'Spitze' : dayPhase(simMin) > 0.5 ? 'Mittag' : dayPhase(simMin) > 0.2 ? 'Rand' : 'ruhig';

  // Scroll-Sync: welcher Block steht gerade neben den Devices? Der Shell-Neu-Monitor
  // baut kumulativ bis dorthin auf. Heute trägt real nur 'colorize' eine Schicht bei;
  // weitere Funktionen klinken sich hier künftig ein.
  const scrollRef = useRef<HTMLDivElement>(null);
  const blockEls = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [spacerH, setSpacerH] = useState(0); // Endraum: damit auch der letzte Block ganz nach oben (neben die Devices) scrollt
  const recompute = () => {
    const root = scrollRef.current;
    if (!root) return;
    const line = root.getBoundingClientRect().top + 64; // Schwelle nahe oben
    let idx = 0;
    blockEls.current.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= line) idx = i; });
    setActiveIdx(idx);
  };
  useEffect(() => { recompute(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const set = () => setSpacerH(root.clientHeight);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);
  // Schicht-Toggles übersteuern den Scroll-Default (undefined = folgt Scroll). Pro Schicht ein Eintrag.
  const [layerOverride, setLayerOverride] = useState<Record<string, boolean | undefined>>({});
  const layerOn = (id: string) => layerOverride[id] ?? (activeIdx >= SHELL_FUNCTIONS.findIndex((f) => f.id === id));
  const colorizeOn = layerOn('colorize');
  const activeLabel = SHELL_FUNCTIONS[activeIdx]?.title;
  // Aus den Block-Markierungen (device) abgeleitet — eine Quelle, keine Hartcode-Listen:
  const builtLayers = SHELL_FUNCTIONS.filter((f) => f.device === 'layer');
  const plannedLayers = SHELL_FUNCTIONS.filter((f) => f.device === 'planned');
  const noneLayers = SHELL_FUNCTIONS.filter((f) => f.device === 'none');

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-block', padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
            color: '#2b6cb0', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 4,
          }}>
            Shell-Studio · <span style={{ color: '#2b6cb0' }}>SIM = Oberfläche + Code</span> | <span style={{ color: '#805ad5' }}>Produktion = Ziel-App-Code (generiert)</span>
          </div>
          <ShellRunBadge />
        </div>
        <p style={{ fontSize: 11.5, color: '#718096', lineHeight: 1.5, margin: '6px 0 0', maxWidth: 640 }}>
          Was SCIM3 in die Ziel-App bringt — je Funktion ein Block. Links die <strong>SIM</strong> (Vorschau + der Code,
          der sie in SCIM rendert), rechts die <strong>Produktion</strong> (der ausgespielte Ziel-App-Code; nicht live
          codiert, sondern unten <em>auf Anforderung generiert</em>). <strong>SIM-Code ≠ Produktions-Code.</strong>
          <br /><strong>Regel:</strong> die <em>Sim-Vorschau</em> (App-iframe) erscheint nur bei <strong>Surfaces</strong>,
          die echten App-Inhalt tragen; <strong>Engines</strong> zeigen Code + Visualisierung + Beschreibung (kein leerer Frame).
        </p>
        {/* Test-Stand: echte Daten der aktiven Rep an die Funktionen anlegen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8, padding: '6px 10px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#718096', letterSpacing: 0.5 }}>TEST-STAND</span>
          <HarnessSwitch on={originOn} label="Origin" tone="#3182ce" onClick={() => setOriginOn((v) => !v)} />
          <HarnessSwitch on={anthemOn} label="Anthem" tone="#38a169" onClick={() => setAnthemOn((v) => !v)} />
          {anthemOn && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title="Time/Turbo — anthem-sim-Zeit (6–20 h). Bei echtem Last-Paket automatisch weg.">
              <span style={{ fontSize: 9, fontWeight: 800, color: '#38a169', letterSpacing: 0.5 }}>TURBO</span>
              <input type="range" min={6} max={20} step={0.5} value={turboHour} onChange={(e) => setTurboHour(+e.target.value)} style={{ width: 88 }} />
              <span style={{ fontSize: 10, color: '#276749', fontFamily: 'monospace', minWidth: 72 }}>{String(Math.floor(turboHour)).padStart(2, '0')}:{turboHour % 1 ? '30' : '00'} · {phaseLabel}</span>
            </span>
          )}
          <span style={{ fontSize: 10.5, color: '#a0aec0', fontFamily: 'monospace' }}>Rep: {rep.name}</span>
          <span style={{ fontSize: 10.5, color: '#4a5568', flex: 1, minWidth: 180 }}>
            {!originOn && !anthemOn && 'aus — Funktionen ohne echte Daten. Einschalten, um mit der aktiven Rep zu arbeiten.'}
            {originOn && originPkg && `Origin: ${originPkg.particles.length} Partikel · ${originPkg.originNet?.segmentCount ?? 0} Segmente · ${fmtBytes(originPkg.totalBytes)}`}
            {originOn && anthemOn && '  ·  '}
            {anthemOn && (loads ? `Anthem: ${loads.length} Last-Werte` : 'Anthem: kein Netz (Wegnetz fehlt?)')}
          </span>
        </div>
      </div>

      <div style={{ flex: '0 0 auto', fontSize: 9.5, color: '#a0aec0', margin: '0 0 6px' }}>
        Block-Rahmen: <b style={{ color: '#e53e3e' }}>rot</b> kein Sim-Inhalt · <b style={{ color: '#3182ce' }}>blau</b> Sim-Inhalt · <b style={{ color: '#38a169' }}>grün</b> Produktions-Code · <b style={{ color: '#805ad5' }}>lila Ring</b> aktiver Block
        <br />Eintritt: <b>ohne Marke</b> = beide (QR + nackt) · <b style={{ color: '#2c7a7b' }}>⤧ nur nackt (URL)</b> = nur über diesenpark.com / Launcher · <b style={{ color: '#2b6cb0' }}>⤧ nur QR</b> = nur per QR-Code
      </div>
      <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', gap: 14 }}>
        {/* LINKS: zwei fixe Devices (Vorschau live · Shell-Neu) — geteilt, nicht pro Block */}
        <div style={{ flex: '0 0 auto', display: 'flex', gap: 12, alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <DeviceFrame><AppIframe src={vorschauMvp ? MVP_URL : APP_URL} /></DeviceFrame>
            {/* Switcher UNTER dem iframe: Demo (Bestand) ↔ MVP-Lichtenberg (neu, ?rep=lichtenberg) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: DEV_W, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f7fafc' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#718096', letterSpacing: 0.4 }}>VORSCHAU</span>
              <button onClick={() => setVorschauMvp(false)} style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${!vorschauMvp ? '#2b6cb0' : '#cbd5e0'}`, background: !vorschauMvp ? '#2b6cb0' : '#fff', color: !vorschauMvp ? '#fff' : '#4a5568' }}>Demo</button>
              <button onClick={() => setVorschauMvp(true)} style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${vorschauMvp ? '#276749' : '#cbd5e0'}`, background: vorschauMvp ? '#38a169' : '#fff', color: vorschauMvp ? '#fff' : '#4a5568' }}>MVP-Lichtenberg</button>
              {vorschauMvp && <span style={{ fontSize: 8.5, color: '#a0aec0', fontStyle: 'italic' }}>füllt sich ab Phase 0</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ShellNewMonitor rep={rep} originOn={originOn} originPkg={originPkg} loads={loads} colorizeOn={colorizeOn} activeLabel={activeLabel} height={FRAME_H} />
            {/* Schicht-Toggles — direkt unter dem Shell-Neu-Device, aus den Block-Markierungen (device) abgeleitet */}
            <div style={{ width: 300, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', background: '#f7fafc' }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#276749', letterSpacing: 0.4, marginBottom: 6 }}>SCHICHTEN · Shell-Neu</div>
              {builtLayers.map((f) => {
                const on = layerOn(f.id);
                const overridden = layerOverride[f.id] != null;
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <HarnessSwitch on={on} label={f.id} tone="#dd6b20" onClick={() => setLayerOverride((o) => ({ ...o, [f.id]: !on }))} />
                    <span style={{ fontSize: 9.5, color: '#a0aec0' }}>{overridden ? 'manuell' : '(folgt Scroll)'}</span>
                    {overridden && (
                      <button onClick={() => setLayerOverride((o) => ({ ...o, [f.id]: undefined }))} title="zurück auf Scroll-Automatik" style={{ fontSize: 9, padding: '1px 6px', borderRadius: 5, cursor: 'pointer', border: '1px solid #cbd5e0', background: '#fff', color: '#718096' }}>auto</button>
                    )}
                  </div>
                );
              })}
              <div style={{ fontSize: 10, color: '#a0aec0', lineHeight: 1.5 }}>
                <span style={{ color: '#718096', fontWeight: 700 }}>folgt:</span> {plannedLayers.map((f) => f.id).join(' · ')}
              </div>
              <div style={{ fontSize: 10, color: '#cbd5e0', lineHeight: 1.5, marginTop: 3 }}>
                <span style={{ fontWeight: 700 }}>kein Device-Beitrag:</span> {noneLayers.map((f) => f.id).join(' · ')}
              </div>
              <div style={{ fontSize: 9.5, color: '#a0aec0', marginTop: 6, fontStyle: 'italic' }}>Origin-Basis (Boundary + Mesh) hängt am Origin-Schalter oben.</div>
            </div>
          </div>
        </div>
        {/* RECHTS: scrollbare Blöcke (ohne eigene Devices) */}
        <div ref={scrollRef} onScroll={recompute} style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
        {SHELL_FUNCTIONS.map((fn, i) => {
          const isOpen = !!open[fn.id];
          const isActive = i === activeIdx;
          // Rahmen-Ampel: rot = kein Sim-Inhalt · blau = Sim-Inhalt · grün = Produktions-Code (sobald Generator). Aktiver Block = lila Ring.
          const frameColor = fn.simCode === STUB ? '#e53e3e' : '#3182ce';
          return (
            <div key={fn.id} ref={(el) => { blockEls.current[i] = el; }} style={{ border: `1px solid ${frameColor}`, borderRadius: 10, marginBottom: 12, overflow: 'hidden', boxShadow: isActive ? '0 0 0 2px #805ad5' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f7fafc', cursor: 'pointer' }} onClick={() => toggle(fn.id)}>
                <span style={{ fontSize: 13, color: '#718096', width: 14 }}>{isOpen ? '▾' : '▸'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a365d' }}>{fn.title}</span>
                {fn.subtitle && <span style={{ fontSize: 10.5, color: '#a0aec0', fontFamily: 'monospace' }}>{fn.subtitle}</span>}
                {fn.entryPath && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '1px 7px', borderRadius: 999,
                    background: fn.entryPath === 'url' ? '#e6fffa' : '#ebf8ff',
                    color: fn.entryPath === 'url' ? '#2c7a7b' : '#2b6cb0',
                    border: `1px solid ${fn.entryPath === 'url' ? '#b2f5ea' : '#bee3f8'}`,
                  }}>
                    {fn.entryPath === 'url' ? '⤧ nur nackt (URL)' : '⤧ nur QR'}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); goStation('P07', 't4'); }}
                  title="Shell · Icon-Assets"
                  style={{ marginLeft: 'auto', fontSize: 10.5, padding: '1px 8px', borderRadius: 999, cursor: 'pointer', border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0' }}
                >⊞ Icon-Assets</button>
              </div>

              {isOpen && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 12, overflowX: 'auto' }}>
                  {/* SIM-Code (Devices stehen fix links — nicht mehr pro Block) */}
                  <div style={{ flexShrink: 0 }}>
                    <FrameLabel tone="#2b6cb0">SIM-Code</FrameLabel>
                    <CodeFrame code={fn.simCode} w={330} />
                  </div>
                  {/* 3 · Funktions-Visualisierung (rahmenlos) */}
                  <VizBox><Viz fn={fn} /></VizBox>
                  {/* 4 · Raum für den zu generierenden Produktions-Code */}
                  <div style={{ flexShrink: 0 }}>
                    <FrameLabel tone="#805ad5">Produktion-Code (generiert)</FrameLabel>
                    <CodeFrame
                      w={330}
                      tone="#a0aec0"
                      code={`// Ziel-App-Code (${[...targets].join('+') || '—'})\n// Wird NICHT live codiert.\n// Unten Plattform wählen → „Generieren"\n// → erscheint hier je Block + als Summe.\n//\n// (Generator: Konzept, noch nicht gebaut.)`}
                    />
                  </div>
                  {/* Notizen (gestapelt) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
                    <Notes title="SIM · Oberfläche" items={fn.highNotes} tone="#2b6cb0" />
                    <Notes title="Produktion · Code-Intent" items={fn.deepNotes} tone="#805ad5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div style={{ height: spacerH }} aria-hidden />
        </div>
      </div>

      {/* Ausspielungs-Footer — ganz unten: Plattform wählen → rechnen → Summe → SCS packt. */}
      <div style={{ flex: '0 0 auto', borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1a365d' }}>Ausspielung:</span>
          {TARGET_PLATFORMS.map((p) => (
            <label key={p.id} style={{ fontSize: 12, color: '#4a5568', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={targets.has(p.id)} onChange={() => toggleTarget(p.id)} /> {p.label}
            </label>
          ))}
          <button
            disabled
            title="Generator = Konzept, noch nicht gebaut"
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 4, border: '1px dashed #cbd5e0', background: '#f7fafc', color: '#a0aec0', cursor: 'not-allowed' }}
          >⚙ Generieren (folgt)</button>
        </div>
        <p style={{ fontSize: 10.5, color: '#a0aec0', fontStyle: 'italic', lineHeight: 1.5, margin: '6px 0 0', maxWidth: 720 }}>
          Konzept (gehalten): Plattform(en) wählen → SCIM <strong>rechnet</strong> den Ziel-App-Code → erscheint je Block
          <strong> und als Summe</strong> → fertig, von <strong>Sensus Core Publishing</strong> anforderbar &amp; packbar.
          Ausbau: Snapshots verschiedener Zoom-Stufen als Storyboard (wenn die Surface App-Inhalt trägt) · echte
          Zwei-Panel-Split-Ansicht + Cosmo-Paar „High+Deep" · Inspector = Bewegtbild der Live-App.
        </p>
      </div>
    </div>
  );
}
