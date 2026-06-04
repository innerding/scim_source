// Builder-Clipboard (P07 · High-Shell) — die feinen Ziel-App-UX-Details an einem
// Ort, sichtbar beim Bauen. Quelle (autoritativ): memory/project_ziel_app_ux.md.
// Header = animierter Trygon-Loop, zentriert.
import { TrygonLoopEmblem } from '../TrygonLoopEmblem';

const UX: { t: string; tone: string; items: string[] }[] = [
  { t: 'Manifest & Slogan', tone: '#b7791f', items: [
    '„Geh deinen Weg" — Manifest in drei Worten, schließt Fixrouten aus (kein Routen-Shop).',
    'Das ERSTE, was der User beim Laden konsumiert (im Intro).',
    'Wir sind Comfort-Begleiter: nicht „wähle eine Route", sondern „wir halten dich im Comfort".',
  ] },
  { t: 'POI-Interaktion', tone: '#2b6cb0', items: [
    'short-tap = markieren (KEIN Modal).',
    'long-tap = Detail-Modal: Tagline · Short-Description · Auswahl-Check · Dropdown (Long-Description/Foto).',
    'Keine eigene Wishlist-Fläche — die markierten POIs SIND die Auswahl.',
  ] },
  { t: 'Primärsteuerung', tone: '#2f855a', items: [
    'Der User stellt nur Comfort + Wanderdauer ein (eine Geste statt Menü).',
    'BCK beobachtet, BAK handelt — die App zieht EINE adaptive Linie.',
  ] },
  { t: 'Deeskalations-Kaskade (BAK)', tone: '#6b46c1', items: [
    '1 Ausweichroute (Pfad) → 2 Wegpunkte umgehen (mit Rückfrage!) → 3 Alternativroute (Ziel-POI tauschen, Comfort-Max).',
    'Longpress-Via quer dazu (Wunschpunkt pinnen). Comfort-Rahmen bleibt hart.',
  ] },
  { t: 'Kehrseite (Begehungs-Modus)', tone: '#805ad5', items: [
    'Long-Tap aufs rep-Icon (sitzt über Origin immer links oben → immer erreichbar).',
    'Snapshot friert die UI ein → 3D-Flip um die vertikale Achse nach links → Rückseite.',
    'Rückseite = antiquierte/träge/retro/nostalgische Routenkarte (TVB-Layer), KEIN Slider/Colour-Mesh.',
  ] },
  { t: 'UX-Leitplanken', tone: '#c05621', items: [
    'Treffsicher an-/abwählen, KEINE Zweideutigkeit.',
    'Lieber ein Tooltip oder Autofocus als mehrdeutige UI.',
  ] },
  { t: 'Demo-Wertung', tone: '#718096', items: [
    'Behalten: Uhr / duration (schön).',
    'Das Übelste: die Footer-Funktionen → moderne, sehr einfache Lösung suchen.',
  ] },
  { t: 'Colour-Mesh (Darstellung)', tone: '#dd6b20', items: [
    'Gradients (weiche Verläufe), aber INNERHALB der Strecke — Kreuzungen bleiben HART.',
    'DP bei Zoom-out (Punktreduktion). Mesh darf „atmen" (fließen/unmerklich pulsieren).',
    '= High-Shell Render-Adjustments, getrennt von der colorize-Engine.',
  ] },
  { t: 'Reviewer-Turbo-Slider', tone: '#38a169', items: [
    'Der gated Reviewer rafft die Last selbst (Time-Switcher in der App).',
    'Lebt in anthem-sim — bei echtem Last-Paket automatisch weg.',
  ] },
  { t: 'Guidance (ZULETZT, minimal)', tone: '#553c9a', items: [
    'Decision-Point statt Meter-für-Meter · Landmarken statt Distanz · calm/eyes-free · ehrliche Unsicherheit.',
    'Fehlweg-Warnung braucht OSM-Kreuzungen (nicht im gepruneten Mesh).',
  ] },
];

export default function BuilderClipboard() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760 }}>
      {/* Zentrierter Header mit animiertem Trygon-Loop */}
      <div style={{ textAlign: 'center', paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid #edf2f7' }}>
        <div style={{ display: 'inline-block' }}><TrygonLoopEmblem size={84} withLegend={false} animated /></div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1a365d', marginTop: 4 }}>Builder-Clipboard</div>
        <div style={{ fontSize: 11.5, color: '#718096', marginTop: 2 }}>
          Ziel-App-UX — die feinen Details fürs Bauen · Quelle: <code>project_ziel_app_ux.md</code>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {UX.map((g) => (
          <div key={g.t} style={{ border: `1px solid ${g.tone}30`, borderLeft: `3px solid ${g.tone}`, borderRadius: 8, padding: '10px 13px', background: '#fff' }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: g.tone, marginBottom: 5 }}>{g.t}</div>
            <ul style={{ margin: 0, paddingLeft: 15, fontSize: 11, color: '#4a5568', lineHeight: 1.5 }}>
              {g.items.map((it, i) => <li key={i} style={{ marginBottom: 3 }}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, fontSize: 10.5, color: '#a0aec0', fontStyle: 'italic' }}>
        Lebt in High-Shell (P07), weil hier die App-UI/UX gebaut wird. Backlog/Stand-Details: das Memory-Doc.
      </div>
    </div>
  );
}
