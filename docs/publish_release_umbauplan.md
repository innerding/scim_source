# Umbauplan — „Vom Commit zur Auslieferung" (Publish/Release/Governance-Schicht)

Entwurf 2026-06-08 (während Pause). Konsolidiert die offenen Threads:
**zwei Versionsnummern · Veröffentlichungsdrossler · Cross-User-Transport ·
Origin-auflösen-Vereinheitlichung**. Noch nicht gebaut — Plan zum Besprechen.

## Leitidee: Commit ≠ Release
Der **Commit** (Pathworks → Repo) ist billig, häufig, die **Quell-Version**.
Das **Release** (Origin-Bundle → R2 → Gerät) ist bewusst, gedrosselt, die
**Auslieferungs-Version**. Dazwischen ein **Release-Gate mit Drossel**. „Origin
auflösen" wird die EINE Resolve-Funktion, die Publish UND Shell-Studio speist.

## Ist-Befund (warum Umbau)
Drei getrennte Pfade, nicht verbunden:
1. **Pathworks-Commit** (neu): Editor/Operator → `commitToRepo` → GitHub
   `data/{geometries,wegnetze,representations}/*.json`. Versionskontrolle + Komposition.
   Konsument: SCIM-Registry. **NICHT** direkt die Runtime.
2. **R2-Publish** (Weg 1): `buildOriginBundle(rep)` → `PUT /api/origin/:repId/bundle`
   → R2. DAS ist die echte Auslieferung (`?rep=`). Knopf „⊕ Origin-Bundle
   veröffentlichen" (TransferView/P11).
3. **„Origin auflösen"** (P07): `buildOriginManifest(rep)` → nur lokales Manifest,
   **kein** Upload.
4. **Shell-Studio**: `buildOriginPackage(rep)` + `produceAnthem(...)` → lokaler
   Test-Stand (ShellNewMonitor), entkoppelt vom Publish.
- **Kernlücke:** Repo-Commit und R2-Publish sind unverbunden; Runtime isst z.T. Mocks.
  Anthem ist NICHT im Bundle (Worker rechnet on-demand aus dem origin-mesh).

## Phasen

### Phase 0 — Origin-Resolve vereinheitlichen (Idee „Origin-auflösen-Button"), klein/lokal
- `buildOriginBundle(rep)` (+ optional Anthem-Snapshot via `produceAnthem`) wird die
  **EINE** Origin-Resolve-Quelle = ein **Referenzpaket**.
- Der „Origin auflösen"-Button (baut heute nur ein Manifest) wird umgebaut auf
  **resolve → Referenzpaket**, mit **zwei Ausgängen**:
  - **automatisch** vom Publish aufgerufen (Publish = resolve + upload),
  - **manuell** → reicht das Referenzpaket an **Shell-Studio** (statt dass das
    Studio selbst `buildOriginPackage` ruft) — das Studio testet gegen GENAU das,
    was publiziert würde; optional ein **Anthem mitschicken**.
- Räumt die Pfad-Doppelung (Weg 1 vs. Weg 2) auf. Kein Server nötig.

### Phase 1 — Zwei Versionsnummern sichtbar machen (Idee „2 Versionsnummern")
- Pro Rep: **Quell-Version** (`rep.version`, aus dem Commit) + **Auslieferungs-Version**
  (aktives R2-Paket, `GET /api/origin/:repId` bzw. V01 status=active).
- Im Operator-Baum + V01: „Quelle vN · ausgeliefert vM"; **Diff hervorheben**
  (N>M = committet, aber noch nicht draußen = „liegt daneben").
- Liest nur, zeigt zusammen. Kein neuer Speicher.

### Phase 2 — Release-Gate + Drossel (Idee „Veröffentlichungsdrossler")
- Operator-Commit erzeugt eine neue **Quell-Version**, aber **nicht** automatisch
  eine Auslieferung.
- **Release-Schritt** (Operator, in V01/Operator-Pathworks): „v7 ausliefern" →
  Origin-Resolve (Phase 0) → Publish (R2) → Auslieferungs-Version = Quell-Version.
- **Drossel** (zeitlich/gebündelt): MVP = manuelles Release-Gate; Ausbau =
  zeitgetaktet (z.B. 1×/Tag) oder Batch. Gewinne: stabile Geräte-Erfahrung,
  weniger R2-Writes/Egress, klarer „jetzt geht's raus"-Moment.
- Damit ist „Commit ≠ Release" echt; die zwei Versionsnummern bekommen Bedeutung.

### Phase 3 — Cross-User-Transport (der große Server-Schritt, ann_105)
- Heute alles localStorage (ein Browser). Editor↔Operator über Geräte braucht eine
  **server-seitige Review-Queue** (Worker + D1/R2): submit/withdraw/commit cross-user.
- Pathworks-Meta (owner/binding/placement/submitted) wandert vom localStorage in den
  Worker. Hängt an ACCESS (server-Code-Prüfung, Identität, Logs).
- Größter Brocken; danach ist die ganze Kette echt mehrbenutzerfähig.

### Phase 4 — Anthem-Referenz im Shell-Studio (Zusatz zu Phase 0)
- Beim manuellen Origin-Resolve optional einen **Anthem-Snapshot** mitschicken →
  Studio testet Origin+Anthem gegen einen realistischen Last-Stand.
- (Anthem bleibt im Betrieb Worker-berechnet; das ist Referenz/Test.)

## Reihenfolge & Risiko
- Empfehlung: **0 → 1 → 2 → (3) → 4.** 0+1+2 sind lokal/klein und liefern sofort
  die **ehrliche Versionierung + Release-Trennung**. 3 ist der Server-Schritt (groß,
  Governance). 4 ist ein kleiner Zusatz.
- **Kernrisiko = Pfad-Konsolidierung:** den Repo-Commit (Pathworks) mit dem
  R2-Publish verbinden. Genau das schließen Phase 0+2: das Release nimmt die
  **committete** Rep → resolve → R2. Eine Resolve-Quelle, klare Trennung Commit/Release.
