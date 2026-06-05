# Versionierung — Shell · Origin · Anthem (Spec, noch nicht gebaut)

**Status:** Design-Notiz 2026-06-05. Anlass: eine Katalog-Änderung in Diesenpark →
Origin-Bundle-Publish → App-Refresh zeigte **keine** Aktualisierung. Ursache-Analyse
unten. Dieses Doc legt fest, **was wie versioniert wird**.

**Kernsatz:** Eine Änderung soll eine **neue Version** erzeugen. Die Version ist der
**Cache-Buster** (neue URL/neuer Schlüssel = kein alter Cache) — nicht Cache-Header-Hacks.

---

## 1 · Was versioniert wird — und was nicht

| Paket | Versioniert? | Granularität | Warum |
|---|---|---|---|
| **Shell** | **Ja** | shell-kit git-Tag (`vX.Y.Z`) | Render-/Engine-Code; langsam, load-bearing. Muss reproduzierbar pinbar sein. |
| **Origin** | **Ja** | je **Representation** (`rep.version`) | Die mittelfristigen Daten (boundary · net · poi-set · colour · deco). Ändern sich bei jedem Re-Commit. |
| **Anthem** | **NEIN** | — | Volatile 5-Min-Last (Ground Truth). Ephemer, presence-getaktet, kein „Stand". Eine Version wäre sinnlos — der nächste Snapshot ersetzt sie ohnehin. |

**Merksatz:** *Shell und Origin haben einen „Stand", Anthem hat nur „jetzt".*

---

## 2 · Shell-Versionierung

**Heute (existiert):** shell-kit ist git-getaggt (`v0.30.0`). Editor UND Runtime
pinnen denselben Tag in `package.json` (`github:innerding/shell-kit#v0.30.0`). Ein
Shell-Wechsel = neuer Tag → `npm install` → neuer App-Build/Deploy.

**Das IST schon Shell-Versionierung** — global, über die App-Build-Pin.

**Offen (Soll):** Eine Shell könnte **per Representation** pinbar sein (shell-kit/app
„reist per Rep"). Dann trüge das Origin-Bundle ein Feld `shellVersion: 'v0.30.0'`, und
die Runtime lüde die passende Shell-Version. Das erlaubt:
- alte Reps auf alter Shell halten, neue auf neuer,
- A/B von Shell-Ständen ohne globalen App-Deploy.

**MVP-Haltung:** global gepinnt reicht. Per-Rep-Shell-Pin = Post-MVP, hier nur notiert.

---

## 3 · Origin-Versionierung (der akute Punkt)

### Ist-Stand (codegestützt)
- `Representation.version?: number` existiert (Typ-Kommentar: „Bump je Re-Commit").
- `buildOriginBundle` trägt `rep.version ?? 1` ins Bundle.
- P09 zeigt `v${origin.version}`.
- **ABER:** Niemand erhöht `rep.version` → bleibt ewig `1`.
- Bundle landet flach unter `origin/${repId}/bundle.json` — **kein** Versions-Pfad.
- Worker-GET setzt `Cache-Control: public, max-age=300` → bis 5 Min alter Cache.
- Runtime `fetch(...)` ohne `cache`-Option, `useEffect([repId])` läuft nur beim Mount.
- **Folge:** Publish → Refresh zeigt bis zu 5 Min das alte Bundle; und selbst danach
  gibt es keine Garantie, weil nichts die Version als Cache-Buster nutzt.

### Soll-Kette
```
Katalog-Änderung (Diesenpark)
  → Commit der Representation        → rep.version++   (NEU: Increment fehlt)
  → Origin-Capsuler baut Bundle      → bundle trägt version = n
  → Sensus-Core-Publisher schreibt   → origin/<repId>/v<n>/bundle.json   (NEU: Versions-Pfad)
                                      + origin/<repId>/current.json = { version: n }   (NEU: Manifest)
  → Runtime liest current.json (no-store) → kennt n
  → Runtime holt v<n>/bundle.json   → neue URL = kein alter Cache, garantiert frisch
```

### Bausteine (Soll)
1. **Version-Increment** im Editor — bei **Publish-CTA** (nicht bei jedem Commit;
   publish-getrieben ist sauberer: nur was ausgespielt wird, bekommt eine Origin-Version).
2. **Versionierter Storage** im Worker — `origin/<repId>/v<n>/bundle.json` + ein
   kleines, **uncacheliches** `current.json` (`Cache-Control: no-store`).
3. **Runtime** — erst `current.json` (immer frisch) → dann das versionierte Bundle
   (lange cachebar, weil unveränderlich unter seiner Version).

**Vorteil:** alte Versionen bleiben liegen (Rollback/History), Cache ist nie ein
Problem, und „welcher Stand läuft" ist eindeutig ablesbar.

---

## 4 · Anthem — bewusst NICHT versioniert

Anthem ist der 5-Min-Snapshot (`anthem_snapshot_v1`): koordinatenlose Last je
Segment-Index, presence-getaktet, kalt nach 2 h. Es gibt keinen „Stand", den man
einfrieren oder zurückrollen wollte — der **nächste** Snapshot ist immer maßgeblich.
`nextAtMin` im Snapshot regelt das Refresh-Timing; das ersetzt jede Versionierung.

Die einzige Anthem-„Version" ist das **Schema** (`anthem_snapshot_v1`) — ein
Format-Vertrag, keine Daten-Version.

---

## 5 · Kurzfristig vs. sauber

- **Pflaster (sofort, 10 Min):** Worker-Bundle-GET auf `Cache-Control: no-cache` +
  Runtime-`fetch(..., { cache: 'no-cache' })`. Behebt das unmittelbare Refresh-Problem,
  ist aber keine Architektur.
- **Sauber (eigener Baustein):** der Versions-Pfad + `current.json` oben. Erst dann ist
  „Änderung → neue Version → garantiert frisch" wirklich erfüllt.

**Empfehlung:** Pflaster nur, wenn akut nötig. Sonst direkt den Versions-Baustein —
er ist überschaubar und löst das Problem an der Wurzel.

---

## 6 · Offene Design-Entscheidungen
- Increment bei **Commit** oder bei **Publish**? (Vorschlag: Publish.)
- `rep.version` (eine Zahl) oder Content-Hash als Versions-Schlüssel? (Hash = automatisch,
  kein Vergessen; Zahl = menschenlesbar. Evtl. beides: Zahl + Hash.)
- Per-Rep-Shell-Pin (`shellVersion` im Bundle) — jetzt oder Post-MVP?
- History-Tiefe: alle alten `v<n>` behalten oder die letzten K?
