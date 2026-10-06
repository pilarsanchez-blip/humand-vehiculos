import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTicketsActivos } from '../../lib/tickets'

const REFRESH_INTERVAL = 12 // segundos

const ESTADOS = [
  { key: 'PENDIENTE',       label: 'Pendientes',      icon: '⏳', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { key: 'APROBADO',        label: 'Aprobados',        icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { key: 'EN_VIAJE',        label: 'En viaje',         icon: '🚗', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { key: 'COMPLETAR_DATOS', label: 'Completar datos',  icon: '📋', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
]

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function fmtFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function TicketCard({ ticket }) {
  const estado = ESTADOS.find(e => e.key === ticket.estado)
  const hora   = ticket.estado === 'PENDIENTE' ? fmt(ticket.ts_solicitud) : fmt(ticket.ts_salida)
  const etiq   = ticket.estado === 'PENDIENTE' ? 'Solicitado' : 'Salida'

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${estado?.border ?? '#e5e7eb'}`,
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '0.5px' }}>
          {ticket.vehiculo_placa ?? '—'}
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
          {fmtFecha(ticket.ts_solicitud)}
        </span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
        {ticket.colaborador_nombre}
      </span>
      {ticket.destino && (
        <span style={{ fontSize: 11, color: '#6b7280' }}>→ {ticket.destino}</span>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>
          {ticket.vehiculo_clase ?? ''}
        </span>
        <span style={{ fontSize: 11, color: '#6b7280' }}>
          {etiq} {hora}
        </span>
      </div>
      <span style={{ fontSize: 10, color: '#d1d5db' }}>{ticket.id}</span>
    </div>
  )
}

function Columna({ estado, tickets }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Header de columna */}
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

      {/* Cards */}
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
  const navigate  = useNavigate()
  const [tickets,   setTickets]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [hora,      setHora]      = useState(new Date())

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

  // Carga inicial y polling
  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, REFRESH_INTERVAL * 1000)
    return () => clearInterval(interval)
  }, [cargar])

  // Countdown visual
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => (c <= 1 ? REFRESH_INTERVAL : c - 1))
      setHora(new Date())
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  const byEstado = (key) => tickets.filter(t => t.estado === key)

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
            Vista en tiempo real · {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} activo{tickets.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 300, letterSpacing: '1px' }}>
            {hora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>
            {loading ? 'Actualizando…' : `Actualiza en ${countdown}s`}
          </div>
        </div>

        <button
          onClick={() => navigate('/porteria/salida')}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          📷 Escanear
        </button>
      </div>

      {/* Barra de progreso del refresh */}
      <div style={{ height: 3, background: '#dbeafe' }}>
        <div style={{
          height: '100%',
          background: '#3b82f6',
          width: `${((REFRESH_INTERVAL - countdown) / REFRESH_INTERVAL) * 100}%`,
          transition: 'width 1s linear',
        }} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fca5a5', padding: '10px 24px', color: '#dc2626', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Columnas */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
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
