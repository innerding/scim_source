// Stabile, opake, URL-taugliche Fixstern-Token für POIs.
//
// Format: <verbund>-<representation>-<suffix>, z.B. `skg-gruenberg-k7m4`.
//   verbund        = organisatorischer Zusammenschluss (skg = Salzkammergut)
//   representation = Region-/Representation-id (gruenberg)
//   suffix         = der eigentliche per-POI-Fixstern: kurz, opak, lowercase,
//                    url-safe, EINMALIG vergeben und NIE wiederverwendet.
//
// Der Token ist der Eckstein der POI-Identität: einmal vergeben, nie geändert,
// unabhängig von allen mutablen Attributen (coord, text, icon, cluster dürfen
// wandern). Die Koordinate wird ÜBER den Token nachgeschlagen, nie IM Token
// gespeichert. QR / NFC / Link sind spätere Darstellungen DESSELBEN Tokens.

// base32-Alphabet ohne Verwechsler (kein 0/1/o/l/i) — lowercase, url-safe.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const SUFFIX_LEN = 4;

// Verbund-Zuordnung je Region. Default 'scim', bis ein echter Verbund feststeht.
const VERBUND_BY_REGION: Record<string, string> = {
  gruenberg: 'skg',
};

export function verbundOf(regionId: string): string {
  return VERBUND_BY_REGION[regionId] ?? 'scim';
}

export function tokenPrefix(regionId: string): string {
  return `${verbundOf(regionId)}-${regionId}-`;
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

// Mintet einen neuen, kollisionsfreien Token für die Region. `taken` enthält
// alle bereits vergebenen Token (oder nur deren Suffixe — beide ok, da der
// Vergleich gegen den vollen Token läuft). Wirft nach vielen Fehlversuchen,
// um eine Endlosschleife bei (theoretisch) erschöpftem Raum zu vermeiden.
export function mintToken(regionId: string, taken: Iterable<string>): string {
  const used = new Set<string>(taken);
  const prefix = tokenPrefix(regionId);
  for (let attempt = 0; attempt < 1000; attempt++) {
    const token = `${prefix}${randomSuffix()}`;
    if (!used.has(token)) return token;
  }
  throw new Error(`mintToken: kein freier Token für ${regionId} nach 1000 Versuchen gefunden`);
}
