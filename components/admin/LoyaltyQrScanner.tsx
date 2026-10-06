'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Scanner = { stop: () => Promise<void> };

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Lee el QR de la tarjeta del cliente (la del Wallet o la de /fidelidad/) y abre esa tarjeta en el admin. */
export function LoyaltyQrScanner() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scanner = useRef<Scanner | null>(null);

  useEffect(() => () => void scanner.current?.stop().catch(() => {}), []);

  function open(text: string) {
    const uuid = text.match(UUID)?.[0];
    const code = text.match(/ATR-[A-Z0-9]{6}/i)?.[0];
    if (uuid) router.push(`/admin/fidelidad/${uuid}/`);
    else if (code) router.push(`/admin/fidelidad/?q=${encodeURIComponent(code)}`);
    else setError('Ese QR no es de una tarjeta de sellos.');
  }

  async function start() {
    setError('');
    setScanning(true);
    const { Html5Qrcode } = await import('html5-qrcode');
    const reader = new Html5Qrcode('lector-qr');
    scanner.current = reader;
    try {
      await reader.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (text) => {
          await reader.stop().catch(() => {});
          setScanning(false);
          open(text);
        },
        () => {},
      );
    } catch {
      setScanning(false);
      setError('No se pudo abrir la cámara. Revisá el permiso del navegador.');
    }
  }

  async function stop() {
    await scanner.current?.stop().catch(() => {});
    setScanning(false);
  }

  return (
    <div>
      <div id="lector-qr" className={`overflow-hidden rounded-2xl bg-black ${scanning ? 'mb-3' : 'hidden'}`} />
      {scanning ? (
        <button type="button" onClick={stop} className="w-full py-2 text-sm font-semibold text-gray-600">
          Cerrar cámara
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          className="h-14 w-full rounded-2xl bg-brand-forest font-display text-lg font-bold text-brand-cream transition hover:bg-brand-forest-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green/40"
        >
          Escanear tarjeta
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
