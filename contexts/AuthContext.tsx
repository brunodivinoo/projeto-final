'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile, Estatisticas } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  stats: Estatisticas | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  stats: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileData) setProfile(profileData as Profile)

    const { data: statsData } = await supabase
      .from('estatisticas_usuario')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsData) setStats(statsData as Estatisticas)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setStats(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setStats(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, stats, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
