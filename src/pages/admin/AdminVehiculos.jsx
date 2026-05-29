import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Btn, Field, Input, Spinner, Banner } from '../../components/UI'
import styles from './Admin.module.css'

const EMPTY = { placa:'', seccion:'', clase:'', marca:'', tipo:'', anio:'', km_acumulado:'', km_proximo_service:'' }

export function AdminVehiculos() {
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [form, setForm]           = useState(null) // null=oculto, {}=nuevo, {placa}=editar
  const [saving, setSaving]       = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data, error } = await supabase.from('vehiculos').select('*').order('placa')
    if (error) setError('Error al cargar vehículos')
    else setVehiculos(data ?? [])
    setLoading(false)
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar() {
    if (!form.placa || !form.seccion || !form.marca) { setError('Placa, sección y marca son obligatorios'); return }
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      anio:               parseInt(form.anio) || null,
      km_acumulado:       parseInt(form.km_acumulado) || 0,
      km_proximo_service: parseInt(form.km_proximo_service) || 0,
      activo:             form.activo ?? true,
    }
    const { error } = form._editing
      ? await supabase.from('vehiculos').update(payload).eq('placa', form.placa)
      : await supabase.from('vehiculos').insert(payload)
    if (error) setError('Error al guardar: ' + error.message)
    else { setForm(null); cargar() }
    setSaving(false)
  }

  async function toggleActivo(v) {
    await supabase.from('vehiculos').update({ activo: !v.activo }).eq('placa', v.placa)
    cargar()
  }

  return (
    <>
      {error && <Banner type="error" icon="⚠️">{error}</Banner>}

      {form && (
        <div className={styles.form}>
          <p style={{ fontWeight:600, margin:0 }}>{form._editing ? 'Editar vehículo' : 'Nuevo vehículo'}</p>
          <div className={styles.formRow}>
            <Field label="Placa *"><Input value={form.placa} onChange={e => set('placa', e.target.value)} readOnly={!!form._editing} /></Field>
            <Field label="Sección *"><Input value={form.seccion} onChange={e => set('seccion', e.target.value)} /></Field>
          </div>
          <div className={styles.formRow}>
            <Field label="Marca *"><Input value={form.marca} onChange={e => set('marca', e.target.value)} /></Field>
            <Field label="Tipo"><Input value={form.tipo} onChange={e => set('tipo', e.target.value)} /></Field>
          </div>
          <div className={styles.formRow}>
            <Field label="Clase"><Input value={form.clase} onChange={e => set('clase', e.target.value)} /></Field>
            <Field label="Año"><Input type="number" value={form.anio} onChange={e => set('anio', e.target.value)} /></Field>
          </div>
          <div className={styles.formRow}>
            <Field label="KM acumulado"><Input type="number" value={form.km_acumulado} onChange={e => set('km_acumulado', e.target.value)} /></Field>
            <Field label="KM próximo service"><Input type="number" value={form.km_proximo_service} onChange={e => set('km_proximo_service', e.target.value)} /></Field>
          </div>
          <div className={styles.actions}>
            <Btn variant="secondary" onClick={() => { setForm(null); setError('') }}>Cancelar</Btn>
            <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
          </div>
        </div>
      )}

      <div className={styles.actions} style={{ marginBottom:12 }}>
        <Btn onClick={() => setForm({ ...EMPTY })}>+ Nuevo vehículo</Btn>
      </div>

      {loading ? <Spinner /> : (
        <table className={styles.table}>
          <thead>
            <tr><th>Placa</th><th>Marca / Tipo</th><th>Sección</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {vehiculos.length === 0 && <tr><td colSpan={5} className={styles.empty}>Sin vehículos</td></tr>}
            {vehiculos.map(v => (
              <tr key={v.placa}>
                <td><strong>{v.placa}</strong></td>
                <td>{v.marca} {v.tipo}</td>
                <td>{v.seccion}</td>
                <td>
                  <span className={[styles.tag, v.activo ? styles.tagActive : styles.tagInactive].join(' ')}>
                    {v.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <Btn variant="secondary" onClick={() => setForm({ ...v, _editing: true })}>Editar</Btn>
                    <Btn variant="secondary" onClick={() => toggleActivo(v)}>{v.activo ? 'Desactivar' : 'Activar'}</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}