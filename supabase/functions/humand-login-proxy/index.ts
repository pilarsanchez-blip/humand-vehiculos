import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const { employeeInternalId, password } = await req.json()

  const res = await fetch('https://api-prod.humand.co/api/v1/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeInternalId, instanceId: 7723, password }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})