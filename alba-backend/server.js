require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Falta STRIPE_SECRET_KEY en tu archivo .env');
  process.exit(1);
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // aquí puedes servir el HTML si lo pones en /public

// Catálogo del lado del servidor: los precios NUNCA se confían desde el navegador.
// Los montos están en centavos (unidad mínima de MXN), igual que exige Stripe.
const PRODUCTS = {
  1: { name: 'Jabón de avena y miel', amount: 8900 },
  2: { name: 'Gel de baño cítrico', amount: 11900 },
  3: { name: 'Desodorante natural de coco', amount: 9500 },
  4: { name: 'Shampoo sólido de romero', amount: 14500 },
  5: { name: 'Acondicionador de argán', amount: 13500 },
  6: { name: 'Cepillo de cerdas suaves', amount: 7900 },
  7: { name: 'Limpiador facial de té verde', amount: 15900 },
  8: { name: 'Exfoliante facial de arcilla', amount: 17500 },
  9: { name: 'Crema hidratante ligera', amount: 18900 },
  10: { name: 'Pasta dental de menta y carbón', amount: 6500 },
  11: { name: 'Cepillo de dientes de bambú', amount: 4900 },
  12: { name: 'Enjuague bucal herbal', amount: 9900 },
  13: { name: 'Shampoo suave para bebé', amount: 11500 },
  14: { name: 'Loción corporal para bebé', amount: 12900 },
};

const FREE_SHIPPING_THRESHOLD = 49900; // $499.00 MXN en centavos
const SHIPPING_COST = 9900; // $99.00 MXN en centavos

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body; // [{ id: 1, qty: 2 }, ...]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío.' });
    }

    let subtotal = 0;
    const line_items = items.map(({ id, qty }) => {
      const product = PRODUCTS[id];
      const quantity = Number(qty);

      if (!product) throw new Error(`El producto ${id} no existe.`);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error(`Cantidad inválida para el producto ${id}.`);
      }

      subtotal += product.amount * quantity;

      return {
        price_data: {
          currency: 'mxn',
          product_data: { name: product.name },
          unit_amount: product.amount,
        },
        quantity,
      };
    });

    // Envío calculado en servidor según el subtotal real
    if (subtotal < FREE_SHIPPING_THRESHOLD) {
      line_items.push({
        price_data: {
          currency: 'mxn',
          product_data: { name: 'Envío estándar' },
          unit_amount: SHIPPING_COST,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${process.env.CLIENT_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creando la sesión de pago:', err.message);
    res.status(400).json({ error: err.message || 'No se pudo iniciar el pago.' });
  }
});

// Endpoint opcional para confirmar el estado de un pedido en tu propia página de éxito
app.get('/order-status/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({ status: session.payment_status, amount_total: session.amount_total });
  } catch (err) {
    res.status(404).json({ error: 'Sesión no encontrada.' });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Servidor de pagos de Alba escuchando en el puerto ${PORT}`);
});
