// Stabile, opake, URL-taugliche Fixstern-Token für POIs.
//
// Format: <verbund>-<representation>-<suffix>, z.B. `skg-gruenberg-k7m4`.
//   verbund        = organisatorischer Zusammenschluss (skg = Salzkammergut),
//                    1–4 Zeichen [a-z0-9].
//   representation = Region-/Representation-Slug (gruenberg), 1–12 Zeichen.
//   suffix         = der eigentliche per-POI-Fixstern: 4 Zeichen, opak, lowercase,
//                    url-safe, EINMALIG vergeben und NIE wiederverwendet.
//
// Der Token ist der Eckstein der POI-Identität: einmal vergeben, nie geändert,
// unabhängig von allen mutablen Attributen (coord, text, icon, cluster dürfen
// wandern). Die Koordinate wird ÜBER den Token nachgeschlagen, nie IM Token
// gespeichert. QR / NFC / Link sind spätere Darstellungen DESSELBEN Tokens.
//
// verbund + representation (= das „Präfix") sind pro Representationskatalog in
// der .md-Frontmatter konfigurierbar (Header-Zeile `**Token-Präfix:**`). Eine
// nachträgliche Präfix-Änderung betrifft NUR neu gemintete Tokens — bereits
// vergebene Tokens bleiben unangetastet (sonst bräche die Patch-/URL-Stabilität).

// base32-Alphabet ohne Verwechsler (kein 0/1/o/l/i) — lowercase, url-safe.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const SUFFIX_LEN = 4;

export const VERBUND_MAX_LEN = 4;
export const SLUG_MAX_LEN = 12;

// Verbund-Default je Region, bis ein echter Verbund feststeht.
const VERBUND_BY_REGION: Record<string, string> = {
  gruenberg: 'skg',
};

export function verbundOf(regionId: string): string {
  return VERBUND_BY_REGION[regionId] ?? 'scim';
}

// Eingabe-Säuberung: lowercase, nur [a-z0-9], auf Maximallänge gekappt.
export function sanitizeVerbund(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, VERBUND_MAX_LEN);
}

export function sanitizeSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, SLUG_MAX_LEN);
}

// Baut das Token-Präfix `<verbund>-<slug>-`. Leere Teile fallen auf Defaults
// zurück, damit nie ein kaputtes Präfix (z.B. `--`) entsteht.
export function buildPrefix(verbund: string, slug: string): string {
  const v = sanitizeVerbund(verbund) || 'scim';
  const s = sanitizeSlug(slug) || 'region';
  return `${v}-${s}-`;
}

// Erkennt einen vollständigen Fixstern-Token (verbund-representation-suffix).
// Bewusst tolerant: drei Segmente lowercase-alnum, durch Bindestriche getrennt.
export function isToken(s: string): boolean {
  return /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/.test(s.trim());
}

function randomSuffix(): string {
  let out = '';
  for (let k = 0; k < SUFFIX_LEN; k++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

// Mintet einen neuen, kollisionsfreien Token mit dem gegebenen Präfix
// (`<verbund>-<slug>-`). `taken` enthält alle bereits vergebenen Token. Wirft
// nach vielen Fehlversuchen, um eine Endlosschleife bei (theoretisch)
// erschöpftem Raum zu vermeiden.
export function mintToken(prefix: string, taken: Iterable<string>): string {
  const used = new Set<string>(taken);
  for (let attempt = 0; attempt < 1000; attempt++) {
    const token = `${prefix}${randomSuffix()}`;
    if (!used.has(token)) return token;
  }
  throw new Error(`mintToken: kein freier Token für Präfix "${prefix}" nach 1000 Versuchen gefunden`);
}
