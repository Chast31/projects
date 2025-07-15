// api/webhooks/subscription.js

import crypto from 'crypto'

// Desactiva el body parser de Next/Vercel
export const config = { api: { bodyParser: false } }

// Helper para leer el raw body sin librerías externas
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()    // Aquí devolvemos “405 Method Not Allowed”
  }

  // 1) Leer el body crudo
  const rawBody = (await getRawBody(req)).toString('utf8')

  // 2) Validar HMAC
  const hmacHeader = req.headers['x-shopify-hmac-sha256']
  const secret     = process.env.SHOPIFY_WEBHOOK_SECRET
  const hash       = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64')

  if (hash !== hmacHeader) {
    console.warn('❌ HMAC inválido')
    return res.status(401).send('Invalid HMAC')
  }

  // 3) Parsear el payload
  const { subscriptionContract } = JSON.parse(rawBody)
  console.log('📬 recibí subscriptionContract:', subscriptionContract)

  // TODO: Llama aquí al Admin API para añadir/quitar el tag
  // por ejemplo, si subscriptionContract.status === 'ACTIVE' -> tagga al customer

  // 4) Avisa a Shopify que todo OK
  res.status(200).send('OK')
}
