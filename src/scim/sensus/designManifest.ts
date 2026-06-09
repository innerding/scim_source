// Design-Manifest — die architektonische Haltung von SCIM3 und der Ziel-App.
// System/Architektur, NICHT Marke/UX (das ist das App-Manifest, appManifest.ts).
// EINE Quelle; gerendert im System-Tab „Manifest". Konsens 2026-06-04.

export const DESIGN_MANIFEST_INTRO =
  'Wie das System gebaut ist — die architektonischen Grundsätze hinter SCIM3 und der Ziel-App. ' +
  'Marke und UX stehen im App-Manifest; hier steht die Haltung der Maschine.';

export interface DesignPrinciple {
  id: string;
  label: string;
  content: string;
}

export const DESIGN_PRINCIPLES: DesignPrinciple[] = [
  {
    id: 'trygon-loop',
    label: 'Trygon-Loop — der Wahrheitskreislauf',
    content:
      'Die Trygon-Loop-Mechanik ist ein Regelkreis im 5-Minuten-Takt: Signalimpuls → Comfort → ' +
      'Route. Er hängt an real gemessener Last (Ground Truth), nicht an Annahmen, und korrigiert ' +
      'sich fortlaufend an der Wirklichkeit.',
  },
  {
    id: 'edge-local',
    label: 'Edge-lokale Intelligenz',
    content:
      'Comforteinstellung und Routenbildung erfolgen lokal am Ziel-Device. Der Regelkreis läuft ' +
      'am Gerät, nicht im Backend.',
  },
  {
    id: 'black-box',
    label: 'Black-Box-Gerät · Datensparsamkeit',
    content:
      'Das Ziel-Device ist für SCIM3 eine Black Box. Es meldet nur: „Ich stehe in Representation X ' +
      'und brauche ihr aktuelles Lastbild." Was es daraus macht — Comfort, Route — entsteht am ' +
      'Gerät und verlässt es nie.',
  },
  {
    id: 'modell-b',
    label: 'Modell B — die App routet selbst',
    content:
      'SCIM3 liefert nur Geometrie (Segment-Graph) und Lastbild (Anthem-Pulse), keine vorgebackenen ' +
      'Routen. Die App baut ihre Linie selbst über den Graph — passend zum Slogan „Geh deinen Weg".',
  },
  {
    id: 'comfort-destillat',
    label: 'Comfort als Destillat — BCK / BAK',
    content:
      'Der Comfort-Slider baut keine Routen. Seine Schiene ist ein Gradient-Balken — das Destillat ' +
      'des Colour-Meshs, die Lastverteilung des Netzes auf eine Achse eingedampft (ein Schauglas). ' +
      'Der Schieber ist eine Schwelle: nach unten gezogen schränkt er das Netz ein — Abschnitte ' +
      'oberhalb der tolerierten Last fallen weg (das ist der Broda Comfort Kernel, BCK). Innerhalb ' +
      'des verbliebenen Netzes deeskaliert der Broda Avoidance Kernel (BAK) die Route in Stufen. ' +
      'Ändert sich die gemessene Last, wandert das Destillat mit — damit der Nutzer die einmal ' +
      'getroffene Comfort-Einstellung behält, gleitet das Schauglas unter einem ruhenden Schieber: ' +
      'die Welt bewegt sich, die Geste bleibt stabil.',
  },
  {
    id: 'auslieferung',
    label: 'Auslieferung — Cloud-only, ohne Desktop-Nabel',
    content:
      'Die Pakete erreichen das Gerät rein aus der Cloud (CF Pages + Worker/R2); nach dem ' +
      'Publizieren besteht keine Verbindung zum Desktop. Shell reist einkompiliert (atomarer ' +
      'Deploy, keine Versions-Schere zwischen App und Shell), Origin als versioniertes R2-Bundle ' +
      '(P11 · transfer), Anthem als flüchtiger Worker-Stream im 5-Min-Takt. Eintritt fürs MVP ist ' +
      'der QR → direkt zur Representation; Launcher und globe-switcher sind additiv (Post-MVP) und ' +
      'ersetzen diesen Pfad nicht. So bleibt der Weg vom Publizieren bis aufs Gerät frei von ' +
      'Umwegen, die der Vollausbau nicht auch nutzt.',
  },
  {
    id: 'versorgungssicherheit',
    label: 'Versorgungssicherheit durch minimale Last',
    content:
      'Weil das laufende Anthem extrem klein ist (~3,3 KB je Representation alle 5 Min, ~5 Byte je ' +
      'Segment, am Beispiel Lichtenberg/648 Segmente gemessen, gzip), bleibt die ' +
      'Live-Versorgung auch bei großem Aufkommen und unter schlechten Netzbedingungen robust. Die ' +
      'wiederkehrende Last ist zu gering, um Kosten, Bandbreite oder Edge-Kapazität zur Skalierungs-' +
      'Wand werden zu lassen — gerade dort, wo Netze unter Menschenmengen einbrechen, kommt das ' +
      'Lastbild noch durch. Und weil Origin lokal auf dem Gerät liegt, übersteht das System sogar ' +
      'kurze Anthem-Aussetzer (Server/Netz kurz weg): das Gerät rechnet Comfort und Route auf dem ' +
      'lokalen Origin + dem letzten Anthem weiter — die Last altert nur, die App bleibt nutzbar.',
  },
];
