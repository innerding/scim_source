// App-Manifest — die App-Spec für Marke & UX, an die sich jede Version hält.
// Dritter Spec neben shell-run (Bau-Strecke) und Anthem-Reigen (Atem): der
// Manifest-Spec. EINE Quelle; per ⓘ-Badge/Modal beheimatet in V01 (Mond-Scheibe,
// Versions-Bibliothek). Wortlaut = Entwurf v1, jederzeit feilbar (eine Datei).
// Konsens 2026-06-03. Hintergrund: project_ziel_app_ux.md.

export const APP_SLOGAN = 'Geh deinen Weg';

export const APP_MANIFEST_INTRO =
  'Das Manifest der App — die App-Spec, an die sich jede Version hält. Wir sind KEIN Routen-' +
  'Shop. Wir sind ein Comfort-Begleiter: Der User stellt nur Comfort und Wanderdauer ein, die ' +
  'App zieht EINE Linie und biegt sie live um, wenn es voll wird. Der Slogan ist das Erste, was ' +
  'beim Laden erscheint — und die letzte Instanz bei jeder UX-Entscheidung: „Geh deinen Weg".';

// Der Kontrast in einem Satz je Seite.
export const MANIFEST_CONTRAST = {
  others: 'Routen-Shop — „hier sind drei Wege, wähle einen".',
  us: 'Comfort-Begleiter — „sag, wie ruhig und wie lang; wir führen dich live durch den Trubel".',
};

export interface ManifestPrinciple {
  n: number;
  title: string;
  line: string;
}

export const MANIFEST_PRINCIPLES: ManifestPrinciple[] = [
  { n: 1, title: 'Geh deinen Weg.', line: 'Wir geben dir keine fertige Route. Du gehst deinen — wir halten ihn frei. Keine Fixrouten.' },
  { n: 2, title: 'Eine Geste statt Menü.', line: 'Du stellst nur Comfort und Wanderdauer ein. Den Weg zieht und pflegt die App.' },
  { n: 3, title: 'Wir weichen dem Andrang aus.', line: 'Live, als Deeskalations-Leiter: erst den Pfad, dann Stopps, zuletzt das Ziel — nie deinen Comfort-Rahmen.' },
  { n: 4, title: 'Treffsicher, nie zweideutig.', line: 'Antippen heißt wählen. Wo es eng wird: ein Tooltip, ein Autofocus — kein Rätsel.' },
  { n: 5, title: 'Wir sagen auch Nein.', line: 'Auch dem Tourismusverband. Was dem Konzept widerspricht — eine Fixroute aufs Aug — bauen wir nicht.' },
  { n: 6, title: 'Du bleibst anonym.', line: 'Kein Account-Theater, keine Standort-Pflicht. Presence ist anonym — nur „jemand ist in Region X".' },
];
