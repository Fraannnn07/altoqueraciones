import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { esUuid } from "@/lib/fidelidad/db";

export const dynamic = "force-dynamic";

// Es lo que va dentro del QR de la tarjeta (la del Wallet y la de /fidelidad/). Si lo abre el admin (por ejemplo
// con la cámara común del celular del local), va a la tarjeta en el panel para sellar; cualquier otro, a
// /fidelidad/, donde el cliente ve su tarjeta o entra con su celular y código.
export default async function QrTarjetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!esUuid(id)) notFound();
  redirect((await isAdmin()) ? `/admin/fidelidad/${id}/` : "/fidelidad/");
}
