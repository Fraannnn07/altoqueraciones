# Tarjeta de sellos – Al Toque Raciones

Tarjeta de fidelización con huellitas que vive en Apple Wallet y Google Wallet. Cada compra suma un sello y el pase se actualiza solo en el celular del cliente.

## Cómo funciona

1. **El admin asigna la tarjeta.** En `/admin/` (misma contraseña del panel de productos) → **Fidelidad** → **Asignar tarjeta nueva**: nombre y celular del cliente. Se crea la tarjeta y un código de acceso de 6 caracteres que se muestra una sola vez (en la base queda solo el hash). Con **Enviar por WhatsApp** le llega al cliente un link que ya trae su celular y su código.
2. **El cliente entra a su tarjeta** en `altoqueraciones.com/fidelidad/` con su celular y el código. La sesión dura 180 días en ese navegador. No hay alta abierta: sin código no se puede ver ninguna tarjeta.
3. **Sellar:** en el admin, **Fidelidad** → **Escanear tarjeta** (lee el QR de la tarjeta del cliente) o buscar por nombre, celular o código `ATR-…` y tocar **Sumar sello**. También sirve la cámara común del celular: el QR abre `/fidelidad/<id>/`, que manda al admin a la tarjeta en el panel y a cualquier otro a `/fidelidad/`.
4. Al completar la tarjeta aparece **Canjear premio**, que la reinicia. Cada sello, resta y canje queda en el historial de la tarjeta.
5. **Código perdido:** desde la tarjeta en el admin, **Generar código nuevo**. El anterior deja de funcionar y se cierra la sesión del cliente. Después de 8 intentos fallidos seguidos la tarjeta queda bloqueada 15 minutos (generar un código nuevo la desbloquea).
6. **Google Wallet / Apple Wallet (opcional, hoy sin configurar):** cuando estén las variables, el cliente ve los botones en su tarjeta y el admin tiene el link de Google Wallet en la ficha de cada tarjeta para mandárselo.

**El cartel del mostrador (`cartel-qr-mostrador.png`) quedó desactualizado:** dice "escaneá y guardá tu tarjeta en Apple Wallet o Google Wallet", pero ahora la tarjeta la asigna el local. Hay que rehacerlo antes de imprimirlo.

## 1. Copiar archivos

Copiá todo en la raíz del proyecto (si usás `src/`, poné `app/`, `lib/` y `proxy.ts` dentro de `src/`):

```
app/fidelidad/…                  ingreso del cliente y su tarjeta
app/admin/fidelidad/…            panel del admin (asignar, sellar, códigos)
app/api/wallet/…                 Apple Wallet, Google Wallet e imagen de sellos
lib/fidelidad/…                  lógica
public/wallet/google-logo.png    logo para Google Wallet
proxy.ts                         ver punto 3
supabase/migrations/…sql         tablas
```

Los imports usan `@/lib/...`. Si tu alias `@` apunta a otro lado, ajustalo.

## 2. Dependencias

```bash
npm i passkit-generator sharp qrcode html5-qrcode
npm i -D @types/qrcode
```

## 3. next.config (importante)

Tu web tiene `trailingSlash: true`, que redirige `/api/x` a `/api/x/`. Apple Wallet llama sin barra final y no sigue redirecciones, así que las actualizaciones no llegarían. Agregá esta línea en `next.config`:

```ts
skipTrailingSlashRedirect: true,
```

El `proxy.ts` incluido sigue agregando la barra en todas las páginas (para Google es igual que antes) y deja tranquilas las rutas `/api`. **Si ya tenés un `proxy.ts` o `middleware.ts`, juntá la lógica en uno solo.**

## 4. Base de datos (Supabase)

Corré `supabase/migrations/20261001000000_fidelidad.sql` en el SQL Editor de Supabase. Crea `loyalty_cards`, `loyalty_events` (historial de cada sello) y `apple_wallet_registrations`, con RLS activado y sin acceso público. Después corré `supabase/migrations/20261006000000_fidelidad_login.sql` (código de acceso del cliente y bloqueo por intentos fallidos).

## 5. Apple Wallet (USD 99/año, Apple Developer Program)

No hace falta Mac. En Windows usá Git Bash (trae openssl).

1. En developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → **+** → **Pass Type IDs**. Creá `pass.com.altoqueraciones.sellos`.
2. Generá la clave y el pedido de certificado:
   ```bash
   openssl genrsa -out pass.key 2048
   openssl req -new -key pass.key -out pass.csr -subj "/emailAddress=TU@MAIL.com/CN=Al Toque Raciones/C=UY"
   ```
3. En el Pass Type ID → **Create Certificate** → subí `pass.csr` → descargá `pass.cer`.
4. Convertí ese certificado y bajá el intermedio de Apple (WWDR G4):
   ```bash
   openssl x509 -inform DER -in pass.cer -out pass.pem
   curl -O https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
   openssl x509 -inform DER -in AppleWWDRCAG4.cer -out wwdr.pem
   ```
5. Pasá los tres a base64 para las variables de entorno:
   ```bash
   base64 -w0 pass.pem; echo
   base64 -w0 pass.key; echo
   base64 -w0 wwdr.pem; echo
   ```
   En PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("pass.pem"))`
6. Tu Team ID está en developer.apple.com → Membership.

El certificado del pase vence al año: cuando renueves, cambiá `APPLE_PASS_CERT_B64`.

## 6. Google Wallet (gratis)

1. Entrá a pay.google.com/business/console → **Google Wallet API** → creá la cuenta de emisor. Copiá el **Issuer ID**.
2. En console.cloud.google.com: creá un proyecto → habilitá **Google Wallet API** → IAM → Cuentas de servicio → creá una → Claves → **Agregar clave JSON**.
3. Volvé a la consola de Google Wallet → **Usuarios** → invitá el mail de la cuenta de servicio (`...@...iam.gserviceaccount.com`) como Desarrollador.
4. Pasá el JSON a base64 (`base64 -w0 clave.json`) para `GOOGLE_WALLET_SA_B64`.
5. Mientras la cuenta esté en modo demo, solo pueden guardar el pase los Gmail que agregues como usuarios de prueba. Cuando funcione, pedí **acceso de publicación** desde la misma consola (te piden capturas del pase).

## 7. Variables de entorno en Vercel

Ver `.env.example`. Cargalas en Vercel → Settings → Environment Variables (Production) y hacé redeploy.

## 8. Probar

```bash
# Tiene que dar 200, no 308:
curl -i -X POST https://altoqueraciones.com/api/wallet/apple/v1/log -H "content-type: application/json" -d '{"logs":["prueba"]}'
# Imagen de sellos:
https://altoqueraciones.com/api/wallet/strip/6/3/
```

Después: asignate una tarjeta desde `/admin/fidelidad/`, entrá con el código en `/fidelidad/`, guardala en el Wallet, escaneala desde el admin y sumá un sello. En 5 a 30 segundos el pase se actualiza.

## Ajustes rápidos

- Cantidad de sellos: `FIDELIDAD_SELLOS_META` (1 a 10; de 7 en adelante se dibujan en dos filas).
- Premio: `FIDELIDAD_PREMIO`.
- Colores del pase: `lib/fidelidad/apple.ts` (Apple) y `COLORES` en `lib/fidelidad/config.ts`.
- Historial: la tabla `loyalty_events` guarda cada sello, resta y canje con fecha.

Si cambiás la meta con tarjetas a medio llenar, quedan con los sellos que tenían y la nueva meta.
- El cartel del mostrador dice "6 huellas" y "10% de descuento": si cambiás meta o premio, hay que regenerarlo.
