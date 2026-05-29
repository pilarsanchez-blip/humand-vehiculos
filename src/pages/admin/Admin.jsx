import { useState } from 'react'
import { PageHeader } from '../../components/UI'
import { AdminVehiculos } from './AdminVehiculos'
import { AdminPorteria }  from './AdminPorteria'
import { AdminReportes }  from './AdminReportes'
import styles from './Admin.module.css'

const TABS = [
  { key: 'vehiculos', label: '🚙 Vehículos' },
  { key: 'porteria',  label: '🔐 Portería' },
  { key: 'reportes',  label: '📊 Reportes' },
]

export function Admin() {
  const [tab, setTab] = useState('vehiculos')
  return (
    <div className={styles.page}>
      <PageHeader title="Panel Admin" />
      <div className={styles.nav}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={[styles.navBtn, tab === t.key ? styles.active : ''].join(' ')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'vehiculos' && <AdminVehiculos />}
      {tab === 'porteria'  && <AdminPorteria />}
      {tab === 'reportes'  && <AdminReportes />}
    </div>
  )
}