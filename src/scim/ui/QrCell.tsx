// Geteilte QR-Zelle — QR-Bild + URL + Kopier-Knopf. EINE Quelle, genutzt von
// V03 (Active-Monitor) und P11/TransferView (App-QR direkt am Publish-Ort).
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function QrCell({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 120, margin: 1,
      color: { dark: '#000', light: '#fff' } }).then(setDataUrl);
  }, [url]);

  const copy = () => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {dataUrl
        ? <img src={dataUrl} alt="QR" width={80} height={80}
            style={{ border: '1px solid #e2e8f0', borderRadius: 4, flexShrink: 0 }} />
        : <div style={{ width: 80, height: 80, background: '#f7fafc', borderRadius: 4, flexShrink: 0 }} />
      }
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5568',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: 220, marginBottom: 6 }}>
          {url}
        </div>
        <button onClick={copy} style={{
          padding: '3px 10px', fontSize: 10,
          background: copied ? '#38a169' : '#fff',
          color: copied ? '#fff' : '#4a5568',
          border: `1px solid ${copied ? '#38a169' : '#e2e8f0'}`,
          borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
        }}>
          {copied ? '✓ Kopiert' : 'Kopieren'}
        </button>
      </div>
    </div>
  );
}
