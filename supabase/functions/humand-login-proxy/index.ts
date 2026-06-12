import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { employeeInternalId, password } = await req.json()
    console.log('login intento:', employeeInternalId)

    // Paso 1 — login
    const loginRes = await fetch('https://api-prod.humand.co/api/v1/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeInternalId, instanceId: 7723, password }),
    })
    const loginData = await loginRes.json()
    if (!loginRes.ok) {
      return new Response(JSON.stringify(loginData), {
        status: loginRes.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const token = loginData.token

    // Paso 2 — traer segmentaciones
    const userRes = await fetch('https://api-prod.humand.co/api/v1/users/' + employeeInternalId, {
      headers: { 'Authorization': 'Bearer ' + token },
    })
    const userData = await userRes.json()
    console.log('segmentations:', JSON.stringify(userData.segmentations))

    const segmentaciones = userData.segmentations ?? []
    const seccionNombres = segmentaciones.map((s) => s.item).filter(Boolean)
    const seccion = seccionNombres[0] ?? ''

    // Paso 3 — buscar seccionIds en Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: mapData, error: mapError } = await supabase
      .from('vehiculo_segmentacion_map')
      .select('segmentation_item_id, seccion_spreadsheet')
      .in('seccion_spreadsheet', seccionNombres)

    console.log('mapData:', JSON.stringify(mapData), 'mapError:', JSON.stringify(mapError))

    const seccionIds = (mapData ?? []).map((r) => r.segmentation_item_id)

    return new Response(JSON.stringify({ ...loginData, seccionIds, seccion }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.log('ERROR:', e.message)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
