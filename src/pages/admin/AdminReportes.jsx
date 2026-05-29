import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Btn, Field, Input, Spinner, Banner } from '../../components/UI'
import styles from './Admin.module.css'

export function AdminReportes() {
  const [desde, setDesde]   = useState('')
  const [hasta, setHasta]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function descargar() {
    if (!desde || !hasta) { setError('Seleccioná rango de fechas'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .gte('ts_solicitud', new Date(desde).toISOString())
        .lte('ts_solicitud', new Date(hasta + 'T23:59:59').toISOString())
        .order('ts_solicitud', { ascending: false })

      if (error) throw error

      const csv = toCSV(data)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `reporte_vehiculos_${desde}_${hasta}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Error al generar reporte')
    } finally {
      setLoading(false)
    }
  }

  function toCSV(rows) {
    if (!rows.length) return 'Sin datos'
    const cols = Object.keys(rows[0])
    const header = cols.join(',')
    const body   = rows.map(r =>
      cols.map(c => {
        const v = r[c] ?? ''
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : v
      }).join(',')
    ).join('\n')
    return header + '\n' + body
  }

  return (
    <div className={styles.form}>
      <p style={{ fontWeight:600, margin:0 }}>Descargar reporte de tickets</p>
      {error && <Banner type="error" icon="⚠️">{error}</Banner>}
      <div className={styles.formRow}>
        <Field label="Desde"><Input type="date" value={desde} onChange={e => setDesde(e.target.value)} /></Field>
        <Field label="Hasta"><Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></Field>
      </div>
      {loading ? <Spinner /> : (
        <Btn onClick={descargar}>⬇ Descargar CSV</Btn>
      )}
    </div>
  )
}