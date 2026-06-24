# Al Toque Raciones — Tienda online (guía de puesta en marcha)

Este sitio pasó de ser HTML estático a una **tienda con carrito, pago por MercadoPago,
aviso al WhatsApp del dueño y panel de administración**, todo sobre Vercel + Supabase.

## Cómo funciona (resumen)

1. El cliente entra a **`/catalogo.html`**, que ahora carga los productos desde la base de datos
   (`/api/products`), arma un **carrito** y completa sus datos.
2. Al pagar, se crea el pedido (estado `pending`) y se lo manda a **MercadoPago** (`/api/checkout`).
3. Cuando MercadoPago confirma el pago, llama a **`/api/mp-webhook`**, que marca el pedido como
   `paid` y **envía el aviso al WhatsApp +598 98 623 158** (WhatsApp Cloud API).
4. Vos administrás todo desde **`/admin.html`**: cambiar precios, dar de baja productos y ver el
   **histórico de pedidos**.

---

## Paso 1 — Base de datos (Supabase)

1. Creá una cuenta en https://supabase.com y un **proyecto nuevo**.
2. Andá a **SQL Editor → New query**, pegá el contenido de [`db/schema.sql`](db/schema.sql) y dale **Run**.
   Esto crea las tablas `products`, `orders`, `order_items` y **carga los ~95 productos actuales**.
3. En **Project Settings → API** copiá:
   - `Project URL` → variable `SUPABASE_URL`
   - clave **`service_role`** → variable `SUPABASE_SERVICE_ROLE_KEY` (¡es secreta!)

## Paso 2 — MercadoPago

1. Entrá a https://www.mercadopago.com.uy/developers con tu cuenta de **vendedor**.
2. Creá una aplicación y copiá el **Access Token**:
   - Para probar: el de **TEST** (y creá usuarios de prueba comprador/vendedor).
   - Para producción: el de **PROD**.
3. Guardalo en la variable `MP_ACCESS_TOKEN`.

## Paso 3 — WhatsApp Cloud API (aviso de pedidos)

1. En https://developers.facebook.com creá una app de tipo **Business** y agregá el producto **WhatsApp**.
2. En **WhatsApp → API Setup** vas a tener:
   - un **token de acceso** → `WHATSAPP_TOKEN`
   - el **Phone number ID** del número remitente → `WHATSAPP_PHONE_NUMBER_ID`
3. `OWNER_WHATSAPP=59898623158` es el número que **recibe** el aviso (el tuyo).
4. Importante: el número *remitente* lo da Meta (no es tu WhatsApp personal). Para empezar podés usar
   el número de prueba que ofrece Meta y agregar `59898623158` como destinatario autorizado.
5. **Nota:** fuera de la ventana de 24 hs, Meta exige enviar **plantillas aprobadas**. Si te pasa que
   no llegan los avisos, creá una plantilla simple (1 variable de cuerpo) y poné su nombre en
   `WHATSAPP_TEMPLATE_NAME`. Sin esa variable, el sistema manda texto libre (sirve para pruebas).

## Paso 4 — Admin

- Elegí una contraseña y ponela en `ADMIN_PASSWORD`. Con esa entrás a `/admin.html`.

## Paso 5 — Cargar variables en Vercel

En tu proyecto de Vercel: **Settings → Environment Variables**, agregá todas las del
archivo [`.env.example`](.env.example) con tus valores reales. Poné también
`SITE_URL=https://altoqueraciones.com` (tu dominio público).

> Vercel detecta la carpeta `/api` automáticamente y instala las dependencias del `package.json`.
> No hace falta configurar build.

---

## Probar en local

```bash
npm install
npm i -g vercel          # si no lo tenés
vercel link              # vincular al proyecto
vercel env pull .env.local   # baja las variables, o copiá .env.example a .env.local
vercel dev               # levanta el sitio + las funciones /api en http://localhost:3000
```

- `http://localhost:3000/api/products` debe devolver el JSON de productos.
- `http://localhost:3000/catalogo.html` debe mostrar la tienda con botones "Agregar al carrito".
- `http://localhost:3000/admin.html` → entrás con `ADMIN_PASSWORD`.

> Ojo: el **webhook de MercadoPago** necesita una URL pública. En local no llega; probá el flujo de
> pago completo recién en el deploy de Vercel (o con un túnel tipo `ngrok` apuntando a `SITE_URL`).

## Checklist de prueba end-to-end (en Vercel, con credenciales TEST de MercadoPago)

1. Editar un precio en `/admin.html` y dar de baja un producto → recargar `/catalogo.html` y verificar.
2. Armar un carrito → "Pagar con MercadoPago" → pagar en el sandbox.
3. Verificar que el pedido queda **`paid`** en `/admin.html` (pestaña Pedidos).
4. Verificar que llegó el **mensaje de WhatsApp** al número del dueño.
5. Pasar las credenciales a PROD cuando todo funcione.

---

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `db/schema.sql` | Crea tablas y carga los productos iniciales |
| `api/products.js` | Lista pública de productos activos |
| `api/checkout.js` | Crea el pedido y la preferencia de MercadoPago |
| `api/mp-webhook.js` | Confirma el pago y dispara el WhatsApp |
| `api/admin/products.js` | Alta/baja/edición de productos (protegido) |
| `api/admin/orders.js` | Histórico de pedidos (protegido) |
| `tienda.js` / `tienda.css` | Catálogo dinámico + carrito + checkout (en `catalogo.html`) |
| `admin.html` | Panel de administración |
| `gracias.html` | Página de retorno tras el pago |
