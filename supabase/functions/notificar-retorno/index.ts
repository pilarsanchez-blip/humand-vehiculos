import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BOT_TOKEN = Deno.env.get('HUMAND_BOT_TOKEN')!
const BASE = 'https://api-prod.humand.co/api/v1/marty'

function ulid() {
  return crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 26)
}

serve(async (req) => {
  try {
    const { colaboradorId, ticketId } = await req.json()

    if (!colaboradorId) {
      return new Response(JSON.stringify({ error: 'colaboradorId requerido' }), { status: 400 })
    }

    const ch = await fetch(`${BASE}/conversations.open`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${BOT_TOKEN}`,
        'Idempotency-Key': ulid(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ users: [colaboradorId] }),
    }).then(r => r.json())

    if (!ch.ok) {
      return new Response(JSON.stringify({ error: 'conversations.open fallo', detail: ch }), { status: 500 })
    }

    const msg = await fetch(`${BASE}/chat.postMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${BOT_TOKEN}`,
        'Idempotency-Key': ulid(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: ch.channel.id,
        text: 'Tu vehiculo llego a porteria. Ingresa a la app para completar los datos de retorno del ticket ' + ticketId + '.',
      }),
    }).then(r => r.json())

    return new Response(JSON.stringify(msg), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})
