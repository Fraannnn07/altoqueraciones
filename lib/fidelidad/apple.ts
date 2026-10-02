import "server-only";
import http2 from "node:http2";
import { PKPass } from "passkit-generator";
import { ASSETS_APPLE } from "./assets";
import { META_SELLOS, NEGOCIO, PREMIO, SITE_URL, WHATSAPP, estadoTexto, urlTarjeta } from "./config";
import { db, type Tarjeta } from "./db";
import { stripPng } from "./strip";

const b64 = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable ${name}`);
  return Buffer.from(v, "base64");
};

export const PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID ?? "";
export const appleConfigurado = () =>
  Boolean(PASS_TYPE_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_PASS_CERT_B64 && process.env.APPLE_PASS_KEY_B64 && process.env.APPLE_WWDR_B64);

const certificados = () => ({
  wwdr: b64("APPLE_WWDR_B64"),
  signerCert: b64("APPLE_PASS_CERT_B64"),
  signerKey: b64("APPLE_PASS_KEY_B64"),
  signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSPHRASE || undefined,
});

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
};

export async function generarPase(t: Tarjeta): Promise<Buffer> {
  const sellos = Math.min(t.stamps, META_SELLOS);

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_ID,
    teamIdentifier: process.env.APPLE_TEAM_ID,
    serialNumber: t.id,
    authenticationToken: t.apple_auth_token,
    webServiceURL: `${SITE_URL}/api/wallet/apple`,
    organizationName: NEGOCIO,
    description: `Tarjeta de sellos ${NEGOCIO}`,
    logoText: NEGOCIO,
    backgroundColor: rgb("#134b32"),
    foregroundColor: rgb("#f9f6ee"),
    labelColor: rgb("#f5891f"),
    sharingProhibited: true,
    barcodes: [{ format: "PKBarcodeFormatQR", message: urlTarjeta(t.id), messageEncoding: "iso-8859-1", altText: t.code }],
    storeCard: {
      headerFields: [{ key: "sellos", label: "SELLOS", value: `${sellos}/${META_SELLOS}` }],
      secondaryFields: [
        { key: "estado", label: "TU TARJETA", value: estadoTexto(sellos), changeMessage: "%@" },
      ],
      auxiliaryFields: [{ key: "premio", label: "PREMIO", value: PREMIO }],
      backFields: [
        {
          key: "como",
          label: "Cómo funciona",
          value: `Cada compra suma un sello. Con ${META_SELLOS} sellos te ganás: ${PREMIO}. Mostrá este código al pagar o al recibir tu pedido.`,
        },
        { key: "cliente", label: "Cliente", value: t.name },
        { key: "codigo", label: "Tu código", value: t.code },
        { key: "web", label: "Pedí online", value: SITE_URL, attributedValue: `<a href="${SITE_URL}">altoqueraciones.com</a>` },
        ...(WHATSAPP
          ? [{ key: "wa", label: "WhatsApp", value: `+${WHATSAPP}`, attributedValue: `<a href="https://wa.me/${WHATSAPP}">Escribinos</a>` }]
          : []),
      ],
    },
  };

  const buffers: Record<string, Buffer> = { "pass.json": Buffer.from(JSON.stringify(passJson)) };
  for (const [nombre, data] of Object.entries(ASSETS_APPLE)) buffers[nombre] = Buffer.from(data, "base64");
  buffers["strip.png"] = await stripPng(sellos, META_SELLOS, 375, 123);
  buffers["strip@2x.png"] = await stripPng(sellos, META_SELLOS, 750, 246);
  buffers["strip@3x.png"] = await stripPng(sellos, META_SELLOS, 1125, 369);

  const pase = new PKPass(buffers, certificados());
  return pase.getAsBuffer();
}

/** Avisa a los iPhone que tienen el pase que hay una versión nueva. */
export async function notificarApple(t: Tarjeta): Promise<void> {
  if (!appleConfigurado()) return;
  const { data } = await db()
    .from("apple_wallet_registrations")
    .select("device_library_id, push_token")
    .eq("serial_number", t.id);
  if (!data?.length) return;

  const { signerCert, signerKey, signerKeyPassphrase } = certificados();
  const cliente = http2.connect("https://api.push.apple.com", {
    cert: signerCert,
    key: signerKey,
    passphrase: signerKeyPassphrase,
  });
  cliente.on("error", (e) => console.error("[apns]", e));

  const muertos: string[] = [];
  await Promise.all(
    data.map(
      (r) =>
        new Promise<void>((resolve) => {
          const req = cliente.request({
            ":method": "POST",
            ":path": `/3/device/${r.push_token}`,
            "apns-topic": PASS_TYPE_ID,
            "content-type": "application/json",
          });
          req.setTimeout(8000, () => req.close());
          req.on("response", (h) => {
            const status = Number(h[":status"]);
            if (status === 410) muertos.push(r.device_library_id); // el usuario borró el pase
            else if (status !== 200) console.error("[apns] status", status);
          });
          req.on("close", () => resolve());
          req.on("error", () => resolve());
          req.end("{}");
        })
    )
  );
  cliente.close();

  if (muertos.length) {
    await db().from("apple_wallet_registrations").delete().eq("serial_number", t.id).in("device_library_id", muertos);
  }
}
