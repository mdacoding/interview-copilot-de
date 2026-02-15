import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function getAuthHeaders() {
  const token = supabase?.auth?.session?.()?.access_token ?? localStorage.getItem('supabase.auth.token')
  if (token) return { Authorization: `Bearer ${token}` }
  try {
    const raw = localStorage.getItem('sb-' + (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/https?:\/\//, '').split('.')[0] + '-auth-token')
    if (raw) {
      const { access_token } = JSON.parse(raw)
      if (access_token) return { Authorization: `Bearer ${access_token}` }
    }
  } catch (_) {}
  return {}
}
