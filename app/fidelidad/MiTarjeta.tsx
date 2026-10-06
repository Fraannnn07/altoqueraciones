import { headers } from "next/headers";
import QRCode from "qrcode";
import { appleConfigurado } from "@/lib/fidelidad/apple";
import { PREMIO, urlTarjeta } from "@/lib/fidelidad/config";
import type { Tarjeta } from "@/lib/fidelidad/db";
import { googleConfigurado } from "@/lib/fidelidad/google";
import { tarjetaPublica } from "@/lib/fidelidad/publica";
import { salirAction } from "./actions";

/** La tarjeta del cliente que entró con su celular y código. */
export default async function MiTarjeta({ tarjeta: t }: { tarjeta: Tarjeta }) {
  const p = tarjetaPublica(t);

  const qr = await QRCode.toString(urlTarjeta(t.id), {
    type: "svg",
    margin: 1,
    color: { dark: "#0d3a26", light: "#ffffff" },
  });

  const ua = (await headers()).get("user-agent") ?? "";
  const esAndroid = /android/i.test(ua);
  const apple = appleConfigurado() && (
    <a
      key="apple"
      href={`/api/wallet/apple/pass/${t.id}/`}
      className="flex h-14 items-center justify-center rounded-2xl bg-black font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/30"
    >
      Agregar a Apple Wallet
    </a>
  );
  const google = googleConfigurado() && (
    <a
      key="google"
      href={`/api/wallet/google/${t.id}/`}
      className="flex h-14 items-center justify-center rounded-2xl bg-black font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/30"
    >
      Agregar a Google Wallet
    </a>
  );

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-8">
      <h1 className="font-display text-2xl font-bold text-brand-forest-dark">Hola {p.name}</h1>
      <p className="mt-1 text-gray-700">Esta es tu tarjeta de sellos. Cada compra suma una huella.</p>

      <div className="mt-5 overflow-hidden rounded-3xl bg-brand-forest text-brand-cream shadow-lg">
        <div className="flex items-baseline justify-between px-5 pt-4">
          <p className="font-display text-sm font-bold">Al Toque Raciones</p>
          <p className="font-display text-2xl font-bold">
            {p.stamps}/{p.meta}
          </p>
        </div>
        <img
          src={`/api/wallet/strip/${p.meta}/${p.stamps}/`}
          alt={`${p.stamps} de ${p.meta} sellos`}
          className="mt-3 block w-full"
          width={1032}
          height={336}
        />
        <div className="px-5 py-4">
          <p className={`font-display text-lg font-bold ${p.premioListo ? "text-brand-orange" : ""}`}>{p.estado}</p>
          <p className="mt-1 text-sm text-brand-cream/80">Premio: {PREMIO}</p>
        </div>
      </div>

      {apple || google ? (
        <>
          <h2 className="mt-8 font-display text-xl font-bold text-brand-forest-dark">Guardala en tu celular</h2>
          <p className="mt-1 text-gray-700">Los sellos nuevos aparecen solos en la tarjeta del Wallet.</p>
          <div className="mt-4 grid gap-3">{esAndroid ? [google, apple] : [apple, google]}</div>
        </>
      ) : null}

      <div className="mt-8 flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-sm">
        <div className="w-48" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="mt-3 font-display text-lg font-bold tracking-wide text-gray-900">{p.code}</p>
        <p className="mt-1 text-sm text-gray-600">Mostrá este código al pagar o al recibir tu pedido.</p>
      </div>

      <form action={salirAction} className="mt-8 text-center">
        <button type="submit" className="text-sm font-semibold text-gray-500 underline-offset-4 hover:underline">
          Salir de mi tarjeta
        </button>
      </form>
    </div>
  );
}
