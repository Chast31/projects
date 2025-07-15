// api/webhooks/subscription.js
import { buffer } from 'micro';
import crypto from 'crypto';

// Para Vercel: desactivar el body parser por defecto
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // 1) Leer el body crudo
  const rawBody = (await buffer(req)).toString('utf8');
  // 2) Validar HMAC
  const hmac     = req.headers['x-shopify-hmac-sha256'];
  const secret   = process.env.SHOPIFY_WEBHOOK_SECRET;
  const digest   = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');
  if (digest !== hmac) {
    console.warn('❌ Webhook HMAC inválido');
    return res.status(401).send('Invalid HMAC');
  }

  // 3) Parsear y observar el payload
  const { subscriptionContract } = JSON.parse(rawBody);
  console.log('📬 subscriptionContract:', subscriptionContract);

  // Aquí iría tu lógica de customerUpdate para añadir/quitar tags
  // p.ej. llamar al Admin GraphQL API usando tu token

  // 4) Responder OK a Shopify
  res.status(200).send('OK');
}
