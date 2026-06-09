// Scim3Wordmark — die SCIM3-Wortmarke EXAKT wie in der Intro (logo-base + logo-hex
// als CSS-Masken über dem Blau→Amber-Wave-Gradient). Wiederverwendbar, höhen-skaliert.
import type { CSSProperties } from 'react';
import logoBaseRaw from '../../assets/logo-base.svg?raw';
import logoHexRaw from '../../assets/logo-hex.svg?raw';

const BASE_MASK = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoBaseRaw)}")`;
const HEX_MASK = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoHexRaw)}")`;
const GRAD = 'linear-gradient(90deg, rgba(65,50,195,0.90) 0%, rgba(65,50,195,0.90) 20%, rgba(245,158,11,0.92) 50%, rgba(65,50,195,0.90) 80%, rgba(65,50,195,0.90) 100%)';
const RATIO = 182.625 / 51.122;   // viewBox der Wortmarke

function layer(mask: string): CSSProperties {
  return {
    position: 'absolute', inset: 0,
    backgroundImage: GRAD, backgroundSize: '200% 100%',
    WebkitMaskImage: mask, maskImage: mask,
    WebkitMaskSize: 'contain', maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center', maskPosition: 'center',
    WebkitMaskMode: 'alpha', maskMode: 'alpha',
    animation: 'scim-wave-blue 7s ease-in-out infinite alternate',
  } as CSSProperties;
}

export default function Scim3Wordmark({ height = 26 }: { height?: number }) {
  return (
    <div style={{ position: 'relative', height, width: height * RATIO, flexShrink: 0 }} aria-label="SCIM3">
      <style>{'@keyframes scim-wave-blue { from { background-position: left center; } to { background-position: right center; } }'}</style>
      <div style={layer(BASE_MASK)} />
      <div style={layer(HEX_MASK)} />
    </div>
  );
}
