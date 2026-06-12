import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BOT_TOKEN = Deno.env.get('HUMAND_BOT_TOKEN')!
const BASE = 'https://api-prod.humand.co/api/v1/marty'

function ulid() {
  return crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 26)
}

serve(async (req) => {
  const { colaboradorHumandId, ticketId } = await req.json()

  // Paso 1 — abrir canal
  const ch = await fetch(`${BASE}/conversations.open`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${BOT_TOKEN}`,
      'Idempotency-Key': ulid(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ users: [colaboradorHumandId] }),
  }).then(r => r.json())

  if (!ch.ok) return new Response(JSON.stringify({ error: ch }), { status: 500 })

  // Paso 2 — mandar mensaje
  const msg = await fetch(`${BASE}/chat.postMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${BOT_TOKEN}`,
      'Idempotency-Key': ulid(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: ch.channel.id,
      text: `🚗 Tu vehículo llegó a portería. Ingresá a la app para completar los datos de retorno del ticket *${ticketId}*.`,
    }),
  }).then(r => r.json())

  return new Response(JSON.stringify(msg), { status: 200 })
})
