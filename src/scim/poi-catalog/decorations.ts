// Deco-Logik lebt in shell-kit (eine Quelle). Dieser Shim hält bestehende
// Importeure aufrecht — Editor und Runtime teilen dieselbe Implementierung.
export {
  extractDecoration,
  extractElevation,
  iconMeta,
  ICONS_META,
  summitLayout,
} from 'shell-kit';
export type {
  DecorationKind,
  DecorationMatch,
  IconMeta,
  SummitLayout,
} from 'shell-kit';
