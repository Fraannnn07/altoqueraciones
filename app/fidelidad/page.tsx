import type { Metadata } from "next";
import { META_SELLOS, PREMIO } from "@/lib/fidelidad/config";
import AltaForm from "./AltaForm";

export const metadata: Metadata = {
  title: "Tarjeta de sellos | Al Toque Raciones",
  description: `Cada compra suma un sello. Con ${META_SELLOS} sellos: ${PREMIO}.`,
};

export default function FidelidadPage() {
  const ejemplo = Math.min(3, META_SELLOS - 1);
  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-8">
      <div className="overflow-hidden rounded-3xl bg-brand-forest shadow-lg">
        <p className="px-5 pt-4 font-display text-sm font-bold text-brand-cream">Al Toque Raciones</p>
        <img
          src={`/api/wallet/strip/${META_SELLOS}/${ejemplo}/`}
          alt={`Ejemplo: tarjeta con ${ejemplo} de ${META_SELLOS} sellos`}
          className="mt-3 block w-full"
          width={1032}
          height={336}
        />
        <p className="px-5 py-4 text-sm text-brand-cream/90">Así se ve en el Wallet de tu celular</p>
      </div>

      <h1 className="mt-8 font-display text-3xl font-bold leading-tight text-brand-forest-dark">
        Cada compra suma una huella
      </h1>
      <p className="mt-3 text-base leading-relaxed text-gray-700">
        Con {META_SELLOS} huellas te llevás {PREMIO}. La tarjeta queda guardada en Apple Wallet o Google Wallet,
        así que no hay cartón que perder.
      </p>

      <AltaForm />

      <p className="mt-4 text-sm text-gray-500">
        ¿Ya tenés tarjeta? Poné el mismo celular y la recuperás con tus sellos.
      </p>
    </div>
  );
}
