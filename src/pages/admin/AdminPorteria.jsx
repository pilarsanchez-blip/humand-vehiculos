import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { buscarPorteria } from '../../lib/redash'
import { Btn, Field, Input, Spinner, Banner } from '../../components/UI'
import styles from './Admin.module.css'

export function AdminPorteria() {
  const [lista,      setLista]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [form,       setForm]       = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [texto,      setTexto]      = useState('')
  const [buscando,   setBuscando]   = useState(false)
  const [resultados, setResultados] = useState([])
  const [preview,    setPreview]    = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('usuarios_porteria').select('*').order('user_id')
    setLista(data ?? [])
    setLoading(false)
  }

  async function buscar() {
    if (!texto.trim()) return
    setBuscando(true)
    setError('')
    setResultados([])
    setPreview(null)
    try {
      const rows = await buscarPorteria(texto)
      if (rows.length === 0) setError('No se encontraron usuarios')
      else setResultados(rows)
    } catch { setError('Error al buscar usuario') }
    finally { setBuscando(false) }
  }

  async function agregar() {
    if (!preview) return
    setSaving(true)
    const { error } = await supabase.from('usuarios_porteria').upsert({
      user_id: parseInt(preview.codigo),
      rol: 'porteria',
      nombre: preview.nombre,
      activo: true,
    })
    if (error) setError('Error: ' + error.message)
    else { setForm(null); setTexto(''); setPreview(null); setResultados([]); cargar() }
    setSaving(false)
  }

  async function toggleActivo(u) {
    await supabase.from('usuarios_porteria').update({ activo: !u.activo }).eq('user_id', u.user_id)
    cargar()
  }

  return (
    <>
      {error && <Banner type="error" icon="⚠️">{error}</Banner>}

      {form && (
        <div className={styles.form}>
          <p style={{ fontWeight:600, margin:0 }}>Agregar usuario portería</p>
          <Field label="Buscar por nombre o ID">
            <div style={{ display:'flex', gap:8 }}>
              <Input
                value={texto}
                onChange={e => { setTexto(e.target.value); setResultados([]); setPreview(null) }}
                placeholder="Ej: Juan Pérez o 1334023"
                onKeyDown={e => e.key === 'Enter' && buscar()}
              />
              <Btn onClick={buscar} disabled={buscando}>{buscando ? '...' : 'Buscar'}</Btn>
            </div>
          </Field>

          {resultados.length > 0 && !preview && (
            <div style={{ border:'1.5px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
              {resultados.map(r => (
                <div
                  key={r.codigo}
                  onClick={() => { setPreview(r); setResultados([]) }}
                  style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:14 }}
                >
                  <strong>{r.nombre}</strong> <span style={{ color:'var(--text-secondary)', fontSize:12 }}>#{r.codigo}</span>
                </div>
              ))}
            </div>
          )}

          {preview && (
            <Banner type="info" icon="👤">
              {preview.nombre} <span style={{ fontSize:12 }}>#{preview.codigo}</span>
              <span
                onClick={() => { setPreview(null); setTexto('') }}
                style={{ marginLeft:8, cursor:'pointer', textDecoration:'underline', fontSize:12 }}
              >cambiar</span>
            </Banner>
          )}

          <div className={styles.actions}>
            <Btn variant="secondary" onClick={() => { setForm(null); setError(''); setPreview(null); setResultados([]); setTexto('') }}>Cancelar</Btn>
            <Btn onClick={agregar} disabled={saving || !preview}>{saving ? 'Guardando...' : 'Agregar'}</Btn>
          </div>
        </div>
      )}

      <div className={styles.actions} style={{ marginBottom:12 }}>
        <Btn onClick={() => setForm({})}>+ Agregar portero</Btn>
      </div>

      {loading ? <Spinner /> : (
        <table className={styles.table}>
          <thead>
            <tr><th>Nombre</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {lista.length === 0 && <tr><td colSpan={3} className={styles.empty}>Sin usuarios de portería</td></tr>}
            {lista.map(u => (
              <tr key={u.user_id}>
                <td><strong>{u.nombre ?? u.user_id}</strong></td>
                <td>
                  <span className={[styles.tag, u.activo ? styles.tagActive : styles.tagInactive].join(' ')}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <Btn variant="secondary" onClick={() => toggleActivo(u)}>{u.activo ? 'Desactivar' : 'Activar'}</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}