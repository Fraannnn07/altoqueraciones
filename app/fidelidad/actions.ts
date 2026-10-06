"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE_CLIENTE,
  LARGO_CODIGO,
  SESION_CLIENTE_SEGUNDOS,
  normalizarCodigo,
  tokenSesion,
  verificarIngreso,
} from "@/lib/fidelidad/acceso";
import { normalizarTelefono } from "@/lib/fidelidad/db";

export type EstadoIngreso = { error?: string };

const opcionesCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/fidelidad",
};

export async function ingresarAction(_prev: EstadoIngreso, formData: FormData): Promise<EstadoIngreso> {
  const phone = normalizarTelefono(String(formData.get("tel") ?? ""));
  const codigo = normalizarCodigo(String(formData.get("codigo") ?? ""));
  if (!phone) return { error: "Revisá el celular: tiene que ser tipo 099 123 456." };
  if (codigo.length !== LARGO_CODIGO) {
    return { error: `El código tiene ${LARGO_CODIGO} letras y números. Está en el WhatsApp que te mandamos.` };
  }

  const r = await verificarIngreso(phone, codigo);
  if (!r.ok) {
    // Frena un poco los intentos por fuerza bruta.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: r.error };
  }

  const token = tokenSesion(r.tarjeta);
  if (!token) return { error: "No pudimos abrir tu tarjeta. Probá de nuevo en un rato." };
  (await cookies()).set(COOKIE_CLIENTE, token, { ...opcionesCookie, maxAge: SESION_CLIENTE_SEGUNDOS });
  redirect("/fidelidad/");
}

export async function salirAction() {
  (await cookies()).set(COOKIE_CLIENTE, "", { ...opcionesCookie, maxAge: 0 });
  redirect("/fidelidad/");
}
