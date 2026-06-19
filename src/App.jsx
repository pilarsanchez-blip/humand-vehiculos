import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './styles/globals.css'
import { getSession, refreshSession } from './lib/humandAuth'
import Login from './pages/Login'
// Colaborador
import { MisSolicitudes }  from './pages/colaborador/MisSolicitudes'
import { SolicitudWizard } from './pages/colaborador/SolicitudWizard'
import { SolicitudEnviada } from './pages/colaborador/SolicitudEnviada'
import { Retorno }         from './pages/colaborador/Retorno'
// Jefe
import { JefeLista }   from './pages/jefe/JefeLista'
import { JefeDetalle } from './pages/jefe/JefeDetalle'
// Portería
import { PorteriaSalida }  from './pages/porteria/PorteriaSalida'
import { PorteriaRetorno } from './pages/porteria/PorteriaRetorno'
// Admin
import { Admin } from './pages/admin/Admin'

function AdminButton() {
  const session  = getSession()
  const location = useLocation()
  const navigate = useNavigate()
  if (!session || !session.esAdmin) return null
  if (location.pathname === '/login') return null
  if (location.pathname.startsWith('/admin')) return null
  return (
    <button
      onClick={() => navigate('/admin')}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 999,
        background: 'var(--bp800)', color: 'white',
        border: 'none', borderRadius: 999,
        padding: '10px 18px', fontSize: 13, fontWeight: 600,
        boxShadow: 'var(--shadow-8dp)', cursor: 'pointer',
      }}
    >
      ⚙️ Admin
    </button>
  )
}

function Guard({ children }) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RootRedirect() {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  const { rol } = session
  if (rol === 'jefe')    return <Navigate to="/jefe" replace />
  if (rol === 'porteria') return <Navigate to="/porteria/salida" replace />
  return <Navigate to="/mis-solicitudes" replace />
}

export default function App() {
  useEffect(() => {
    // Refresca jefeInternalId, seccionIds y seccion en background al entrar a la app
    refreshSession()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRedirect />} />
        {/* Colaborador */}
        <Route path="/mis-solicitudes"   element={<Guard><MisSolicitudes /></Guard>} />
        <Route path="/solicitud"         element={<Guard><SolicitudWizard /></Guard>} />
        <Route path="/solicitud/enviada" element={<Guard><SolicitudEnviada /></Guard>} />
        <Route path="/retorno/:id"       element={<Guard><Retorno /></Guard>} />
        {/* Jefe */}
        <Route path="/jefe"    element={<Guard><JefeLista /></Guard>} />
        <Route path="/jefe/:id" element={<Guard><JefeDetalle /></Guard>} />
        {/* Portería */}
        <Route path="/porteria/salida"  element={<Guard><PorteriaSalida /></Guard>} />
        <Route path="/porteria/retorno" element={<Guard><PorteriaRetorno /></Guard>} />
        {/* Admin */}
        <Route path="/admin" element={<Guard><Admin /></Guard>} />
      </Routes>
      <AdminButton />
    </BrowserRouter>
  )
}