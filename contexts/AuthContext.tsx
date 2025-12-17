'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile, Estatisticas } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  stats: Estatisticas | null
  loading: boolean
  isNewUser: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  stats: null,
  loading: true,
  isNewUser: false,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  const fetchProfile = async (userId: string, userEmail?: string, userName?: string) => {
    try {
      // Tentar buscar perfil existente
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Perfil não existe - criar um novo
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            nome: userName || userEmail?.split('@')[0] || 'Usuário',
            email: userEmail,
          })
          .select()
          .single()

        if (!insertError && newProfile) {
          setProfile(newProfile as Profile)
          setIsNewUser(true)
        }
      } else if (profileData) {
        setProfile(profileData as Profile)
        setIsNewUser(false)
      }

      // Tentar buscar estatísticas
      const { data: statsData, error: statsError } = await supabase
        .from('estatisticas_usuario')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (statsError && statsError.code === 'PGRST116') {
        // Estatísticas não existem - criar novas
        const { data: newStats } = await supabase
          .from('estatisticas_usuario')
          .insert({
            user_id: userId,
            questoes_hoje: 0,
            questoes_total: 0,
            taxa_acerto: 0,
            horas_estudadas: 0,
            sequencia_dias: 0,
          })
          .select()
          .single()

        if (newStats) {
          setStats(newStats as Estatisticas)
        }
      } else if (statsData) {
        setStats(statsData as Estatisticas)
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email, user.user_metadata?.nome)
  }

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.nome
        )
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.nome
          )
        } else {
          setUser(null)
          setProfile(null)
          setStats(null)
          setIsNewUser(false)
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
    setIsNewUser(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, stats, loading, isNewUser, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
