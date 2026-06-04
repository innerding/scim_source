// System-Manifest „Shell & Katalog — zwei Takte".
// Architektur wie das Design-Manifest (designManifest.ts), hier mit Fokus auf die
// Trennung von Render-Mechanik (Shell, langsam/versioniert) und Katalog (live).
// EINE Quelle; gerendert im System-Tab „Manifest". Konsens 2026-06-04.

export const SHELL_KATALOG_MANIFEST_INTRO =
  'Warum Render-Mechanik und Katalog getrennt gebaut werden: zwei verschiedene ' +
  'Änderungs-Takte auf zwei Schienen. Der Code-Takt (Shell) ist langsam und ' +
  'versioniert, der Daten-Takt (Katalog) ist live. So blockieren sie sich nie.';

export interface ShellKatalogPrinciple {
  id: string;
  label: string;
  content: string;
}

export const SHELL_KATALOG_PRINCIPLES: ShellKatalogPrinciple[] = [
  {
    id: 'zwei-takte',
    label: 'Zwei Takte, zwei Schienen',
    content:
      'Eine Maschine, gespeist aus einer lebenden Quelle. Die Container-/Cluster-/' +
      'POI-Kategorie-Visualisierung (Shell-Mechanik) ändert sich langsam — höchstens ' +
      'monatlich — und wird versioniert. Der Katalog ist live und ständig aktuell. ' +
      'Code-Takt und Daten-Takt laufen auf eigenen Schienen.',
  },
  {
    id: 'referenzieren',
    label: 'Referenzieren statt kopieren',
    content:
      'Der Render-Kern ist EINE Quelle — eine versionsfixierte Bibliothek (per git-Tag ' +
      'eingebunden), die Operator, Dashboards und Ziel-App teilen. Editor und Runtime ' +
      'sind nur dünne Adapter um denselben Kern; Assets (Icons/Glyphen) werden ' +
      'hereingereicht (Dependency-Inversion). Es gibt nie einen zweiten, von Hand ' +
      'gepflegten Render-Pfad.',
  },
  {
    id: 'herkunft',
    label: 'Herkunft — aus dem Katalog gehoben',
    content:
      'Die Mechanik entstand im Katalog (anfangs inline im Katalog-Tab, dann als ' +
      'Composite-Modul). Jetzt ist ihr generischer Kern in den Shell-Bereich gehoben. ' +
      'Der Katalog bleibt ihr erster Referenzierer, ist aber nicht mehr ihr Besitzer.',
  },
  {
    id: 'dashboards-daten',
    label: 'Dashboards & Daten',
    content:
      'Dashboards arbeiten auf dem aktuellen Katalog und geben ausschließlich ' +
      'Origin-POI-Daten aus — nie Shell-Code. Die Ziel-App füllt diese aufgelösten ' +
      'Origin-Daten in die generischen Container des Shell-Pakets.',
  },
];
