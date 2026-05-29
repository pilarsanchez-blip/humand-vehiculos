import { getSession } from '../lib/humandAuth'

export function useUsuario() {
  const session = getSession()
  if (!session) return null
  return session
}