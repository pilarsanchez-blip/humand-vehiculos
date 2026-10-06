import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTicketsActivos } from '../../lib/tickets'

const REFRESH_INTERVAL = 12

const ESTADOS = [
  { key: 'PENDIENTE',       label: 'Pendientes',     icon: '⏳', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { key: 'APROBADO',        label: 'Aprobados',      icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { key: 'EN_VIAJE',        label: 'En viaje',       icon: '🚗', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { key: 'COMPLETAR_DATOS', label: 'Completar datos',icon: '📋', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { key: 'CERRADO',         label: 'Cerrados',       icon: '🏁', color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
]

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function fmtFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function matchBusqueda(ticket, q) {
  if (!q) return true
  const texto = q.toLowerCase()
  return (
    ticket.id?.toLowerCase().includes(texto) ||
    ticket.colaborador_nombre?.toLowerCase().includes(texto) ||
    ticket.vehiculo_placa?.toLowerCase().includes(texto)
  )
}

function fmtDatetime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function TicketCard({ ticket }) {
  const estado = ESTADOS.find(e => e.key === ticket.estado)

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${estado?.border ?? '#e5e7eb'}`,
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      {/* Nombre + placa */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
          {ticket.colaborador_nombre}
        </span>
        <span style={{
          background: '#f3f4f6', border: '1px solid #e5e7eb',
          borderRadius: 6, padding: '2px 7px',
          fontSize: 12, fontWeight: 700, color: '#374151',
          whiteSpace: 'nowrap', letterSpacing: '0.5px',
        }}>
          {ticket.vehiculo_placa ?? '—'}
        </span>
      </div>

      {/* Fecha solicitud */}
      <div style={{ fontSize: 11, color: '#6b7280' }}>
        📅 Solicitado: <strong>{fmtDatetime(ticket.ts_solicitud)}</strong>
      </div>

      {/* Salida */}
      {ticket.ts_salida && (
        <div style={{ fontSize: 11, color: '#6b7280' }}>
          🚗 Salida: <strong>{fmtDatetime(ticket.ts_salida)}</strong>
        </div>
      )}

      {/* Aprobación / jefe */}
      {ticket.estado === 'PENDIENTE' && (
        <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
          ⏳ Pendiente de aprobación
        </div>
      )}
      {ticket.jefe_nombre && ticket.estado !== 'PENDIENTE' && (
        <div style={{ fontSize: 11, color: '#16a34a' }}>
          ✅ Aprobado por: <strong>{ticket.jefe_nombre}</strong>
        </div>
      )}

      {/* Retorno para CERRADO */}
      {ticket.estado === 'CERRADO' && ticket.ts_retorno && (
        <div style={{ fontSize: 11, color: '#6b7280' }}>
          🏁 Regresó: <strong>{fmtDatetime(ticket.ts_retorno)}</strong>
        </div>
      )}

      {/* ID ticket */}
      <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 2 }}>
        {ticket.id}
      </div>
    </div>
  )
}

function Columna({ estado, tickets }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        background: estado.bg,
        border: `1.5px solid ${estado.border}`,
        borderRadius: 10,
        padding: '10px 14px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>{estado.icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: estado.color, flex: 1 }}>
          {estado.label}
        </span>
        <span style={{
          background: estado.color,
          color: '#fff',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          minWidth: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px',
        }}>
          {tickets.length}
        </span>
      </div>

      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#d1d5db', fontSize: 12, padding: '24px 0' }}>
          Sin tickets
        </div>
      ) : (
        tickets.map(t => <TicketCard key={t.id} ticket={t} />)
      )}
    </div>
  )
}

export function PorteriaPanel() {
  const navigate = useNavigate()
  const [tickets,   setTickets]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [hora,      setHora]      = useState(new Date())
  const [busqueda,  setBusqueda]  = useState('')

  const cargar = useCallback(async () => {
    try {
      const data = await getTicketsActivos()
      setTickets(data)
      setError('')
    } catch (e) {
      setError('Error al cargar tickets')
    } finally {
      setLoading(false)
      setCountdown(REFRESH_INTERVAL)
    }
  }, [])

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, REFRESH_INTERVAL * 1000)
    return () => clearInterval(interval)
  }, [cargar])

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => (c <= 1 ? REFRESH_INTERVAL : c - 1))
      setHora(new Date())
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  const filtrados = tickets.filter(t => matchBusqueda(t, busqueda))
  const byEstado  = (key) => filtrados.filter(t => t.estado === key)
  const activos   = tickets.filter(t => t.estado !== 'CERRADO').length

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#1e3a8a',
        color: '#fff',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.3px' }}>
            Panel de Portería
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
            Vista en tiempo real · {activos} ticket{activos !== 1 ? 's' : ''} activo{activos !== 1 ? 's' : ''}
          </div>
        </div>

        <button
          onClick={() => navigate('/porteria/salida')}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          📷 Escanear
        </button>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 300, letterSpacing: '1px' }}>
            {hora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>
            {loading ? 'Actualizando…' : `Actualiza en ${countdown}s`}
          </div>
        </div>

      </div>

      {/* Barra de progreso */}
      <div style={{ height: 3, background: '#dbeafe' }}>
        <div style={{
          height: '100%',
          background: '#3b82f6',
          width: `${((REFRESH_INTERVAL - countdown) / REFRESH_INTERVAL) * 100}%`,
          transition: 'width 1s linear',
        }} />
      </div>

      {/* Buscador */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#9ca3af' }}>🔍</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, apellido, placa o número de ticket…"
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              border: '1.5px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'Roboto, sans-serif',
              outline: 'none',
              background: '#fff',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}
          >
            ✕ Limpiar
          </button>
        )}
        {busqueda && (
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fca5a5', padding: '10px 24px', color: '#dc2626', fontSize: 13, marginTop: 10 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Columnas */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
        padding: 20,
        alignItems: 'start',
        overflowY: 'auto',
      }}>
        {ESTADOS.map(e => (
          <Columna key={e.key} estado={e} tickets={byEstado(e.key)} />
        ))}
      </div>
    </div>
  )
}
