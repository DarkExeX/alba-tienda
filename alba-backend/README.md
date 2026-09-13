# Backend de pagos — Tienda Alba

Servidor en Node.js/Express que crea sesiones reales de **Stripe Checkout**
para la tienda. Los precios se validan en el servidor, nunca se confía en lo
que envía el navegador.

## 1. Requisitos

- Node.js 18 o superior
- Una cuenta en [stripe.com](https://stripe.com) (gratis para modo de prueba)

## 2. Obtener tus claves de Stripe

1. Entra a tu [Dashboard de Stripe](https://dashboard.stripe.com/test/apikeys)
2. Copia la **clave secreta** en modo de prueba (empieza con `sk_test_...`)
3. Nunca la publiques en el frontend ni en un repositorio público — solo va en el backend.

## 3. Instalación

```bash
cd alba-backend
npm install
cp .env.example .env
```

Edita `.env` y pega tu clave:

```
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_AQUI
CLIENT_URL=http://localhost:8080
PORT=4242
```

`CLIENT_URL` debe apuntar a donde sirves el archivo `alba-tienda-higiene.html`
(por ejemplo, si lo abres con `npx serve` en el puerto 8080).

## 4. Ejecutar el servidor

```bash
npm start
```

Verás: `Servidor de pagos de Alba escuchando en el puerto 4242`

## 5. Conectar el frontend

Abre `alba-tienda-higiene.html` y busca esta línea en el `<script>`:

```js
const BACKEND_URL = "http://localhost:4242";
```

- En desarrollo local, déjala así.
- Cuando despliegues el backend (Render, Railway, Fly.io, un VPS, etc.),
  cámbiala por la URL pública de tu servidor, por ejemplo:
  `const BACKEND_URL = "https://alba-backend.onrender.com";`

## 6. Probar un pago

Con el servidor corriendo y el HTML abierto en el navegador:

1. Agrega productos al carrito
2. Abre el carrito y da clic en "Pagar con tarjeta"
3. Se abrirá la página de Stripe Checkout — usa una tarjeta de prueba:
   - Número: `4242 4242 4242 4242`
   - Fecha: cualquier fecha futura
   - CVC: cualquier 3 dígitos
4. Al completar el pago, Stripe te redirige a `success.html`
   (o a `cancel.html` si cancelas)

## 7. Pasar a producción

- Cambia `STRIPE_SECRET_KEY` por tu clave `sk_live_...`
- Sirve el sitio y el backend por HTTPS
- Considera agregar un **webhook** de Stripe (`checkout.session.completed`)
  para marcar pedidos como pagados en tu base de datos de forma confiable,
  en vez de depender solo del redireccionamiento del navegador.
- Agrega tu propia base de datos para guardar pedidos, correos, etc.

## Archivos incluidos

| Archivo         | Qué hace                                          |
|-----------------|----------------------------------------------------|
| `server.js`     | Servidor Express + creación de sesión de Stripe    |
| `package.json`  | Dependencias del proyecto                          |
| `.env.example`  | Plantilla de variables de entorno                  |
| `success.html`  | Página mostrada tras un pago exitoso               |
| `cancel.html`   | Página mostrada si el cliente cancela el pago      |
