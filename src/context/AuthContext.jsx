import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async (accessToken) => {
    if (!accessToken) return null
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'x-supabase-auth': accessToken },
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } }
    if (!session) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }
    setUser({ id: session.user.id, email: session.user.email })
    const me = await fetchMe(session.access_token)
    setProfile(me || {
      current_plan: 'free',
      remaining_sessions: 3,
      email: session.user.email,
    })
    setLoading(false)
  }, [fetchMe])

  useEffect(() => {
    if (!supabase) {
      setUser(import.meta.env.VITE_SUPABASE_URL ? null : { id: 'demo', email: 'demo@local.dev' })
      setProfile({ current_plan: 'free', remaining_sessions: 3 })
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({ id: session.user.id, email: session.user.email })
        fetchMe(session.access_token).then((me) => {
          setProfile(me || { current_plan: 'free', remaining_sessions: 3, email: session.user.email })
        }).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({ id: session.user.id, email: session.user.email })
        fetchMe(session.access_token).then((me) => {
          setProfile(me || { current_plan: 'free', remaining_sessions: 3, email: session.user.email })
        })
      } else {
        setUser(null)
        setProfile(null)
      }
    })
    return () => subscription?.unsubscribe()
  }, [fetchMe])

  const value = {
    user,
    profile,
    loading,
    isLoggedIn: !!user,
    currentPlan: profile?.current_plan ?? 'free',
    remainingSessions: profile?.remaining_sessions ?? 0,
    getAccessToken: async () => (await supabase?.auth?.getSession())?.data?.session?.access_token ?? null,
    refreshProfile,
    signOut: () => supabase?.auth?.signOut?.(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const defaultAuth = {
  user: null,
  profile: null,
  loading: false,
  isLoggedIn: false,
  currentPlan: 'free',
  remainingSessions: 3,
  getAccessToken: async () => null,
  refreshProfile: async () => {},
  signOut: () => {},
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  return ctx ?? defaultAuth
}
