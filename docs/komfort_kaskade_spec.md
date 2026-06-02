# Komfort-Kaskade — BAK-Routing-Spec (verbindlich)

**Status:** Design-Konsens 2026-06-02. Stufe 1 + 3 (Basis) gebaut, Stufe 2 +
Comfort-Maximierung offen. Diese Spec ist maßgeblich für den Umbau.

**Einordnung:** Konkrete Ausformulierung des **BAK = Broda Avoidance Kernel**
(„out of your comfort", siehe `runtime_mvp.md`, Bonus-Sektion). Der BAK *handelt*,
wenn der Komfort kippt — und zwar als **Vermeidungs-Kaskade**: er meidet zuerst
volle Strecken, dann Wegpunkte, zuletzt verschiebt er das Ziel.

> Hinweis: BCK in `runtime_mvp.md` ist als „Body Comfort Kernel" geführt —
> Schreibweise (Broda Comfort Kernel?) noch zu bestätigen.

---

## Prinzip: eine harte Konstante, eine monotone Vermeidungsleiter

- **Hart & unverhandelbar:** der **Comfort-Rahmen** (User-Schwelle aus `loa` /
  P09 Mask). Keine Stufe verlässt ihn je.
- **Fix im MVP:** der **Standort** (Ausgangspunkt). Unveränderlich.
- **Eskalation:** jede Stufe lockert *genau eine weitere* Sache, um im Comfort
  zu bleiben. Erst wenn eine Stufe nichts comfortables findet, eskaliert der BAK
  zur nächsten. Das ist die Kaskade.

---

## Termini (eingefroren)

| Terminus | Bedeutung |
|---|---|
| **Standort** | Ausgangspunkt der Route. Fix im MVP. |
| **Ziel-POI** | Das eigentliche Ziel der Route (der neue Leit-Terminus). |
| **POI-Targets am Weg** | Wegpunkte zwischen Standort und Ziel-POI; in Stufe 2 optional fallenlassbar. |
| **Comfort-Rahmen** | Die User-Ausschluss-Schwelle. Hart. |
| **Ausweichroute** | Gleiches Ziel-POI, gleiche Wegpunkte — nur der **Pfad** ändert sich (meidet volle Strecken). |
| **Alternativroute** | Das **Ziel-POI selbst** wird getauscht gegen ein anderes, comfort-erreichbares. |

---

## Die Kaskade

| Stufe | Bleibt fest | Gelockert | Aktion | Status |
|---|---|---|---|---|
| **0 · Direktroute** | Standort · Ziel-POI · Wegpunkte · Pfad | — | normale Route, Comfort-Check | ✅ S4 |
| **1 · Ausweichroute** | Standort · Ziel-POI · Wegpunkte | **Pfad** | route um volle Strecken herum (`reroute`, meidet überschrittene Kanten) | ✅ S5 |
| **2 · Wegpunkte umgehen** | Standort · Ziel-POI | **POI-Targets am Weg** | wenn kein comfort-Pfad zum Ziel-POI existiert: **System fragt** „Darf ich POIs am Weg umgehen?" → lässt Wegpunkte fallen | ⬜ neu |
| **3 · Alternativroute** | Standort | **Ziel-POI** | wenn auch das scheitert: Ziel-POI tauschen gegen ein comfort-erreichbares (siehe Comfort-Maximierung) | ◐ S6 (Basis da) |

**Eskalations-Regel:** Stufe N+1 wird nur betreten, wenn Stufe N im Comfort-Rahmen
**kein** Ergebnis liefert. Stufe 2 ist die einzige mit **expliziter Rückfrage**
(Umgehen ist ein Verzicht auf gewünschte Wegpunkte — das entscheidet der User).

---

## Stufe 3 · Zielwahl = Comfort-Maximierung (entschieden)

Bei der Alternativroute wählt das System das Ziel **nicht** beliebig, sondern
maximiert den Ausflug im Comfort-Rahmen:

> Aus den angewählten POIs nimmt das System automatisch **das am weitesten
> entfernte, das NOCH comfortabel erreichbar ist.**

- Kein Ziel angewählt → Kandidatenmenge = alle erreichbaren Katalog-POIs.
- Mehrere angewählt → das entfernteste comfort-erreichbare wird Ziel-POI; der
  Rest kann zu Via-Wegpunkten werden (Longpress, s.u.).
- „Entfernung" = Routenlänge auf dem Netz (nicht Luftlinie), damit der Comfort-
  Check konsistent bleibt.

---

## Longpress · manuelle Übersteuerung (quer zur Kaskade)

**Longpress auf ein POI** pinnt es als **Via-Punkt** auf die Route — beliebige
POIs dürfen so erzwungen auf dem Weg liegen. Das ist die manuelle Hand am
Steuer, unabhängig von der automatischen Kaskade. Comfort-Rahmen bleibt auch
hier hart: liegt ein erzwungener Via-Punkt nur über voller Strecke erreichbar,
meldet das System es (statt still zu brechen).

---

## Bau-Reihenfolge

1. **Stufe 2** — Wegpunkt-Umgehung mit Rückfrage (`reroute` ohne Wegpunkt-Zwang
   + Bestätigungs-Dialog im P09-Move-Befund).
2. **Stufe 3 · Comfort-Maximierung** — `routeFromBusTo` erweitern: über
   Kandidaten-POIs iterieren, je Comfort prüfen, das entfernteste comfortable
   wählen.
3. **Longpress-Via** — Via-Punkt-Liste im `testRoute`-Store + Marker-Longpress
   in `ScimMap`.

**Berührte Dateien (bestehend):** `src/scim/sensus/playbook.ts` (Routing-Engine),
`src/scim/sensus/testRoute.ts` (Store), `src/scim/ui/ScimMap.tsx` (Klick/Render),
`src/scim/ui/panels/TestRouteControl.tsx` (Befund + Rückfrage).
