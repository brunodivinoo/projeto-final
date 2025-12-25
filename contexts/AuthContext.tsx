'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile, Estatisticas } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  stats: Estatisticas | null
  loading: boolean
  profileLoading: boolean
  isNewUser: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  stats: null,
  loading: true,
  profileLoading: true,
  isNewUser: false,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  // Ref para evitar chamadas duplicadas
  const fetchingRef = useRef(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)

  const fetchProfile = async (userId: string, userEmail?: string, userName?: string, forceRefresh = false) => {
    // Evitar chamadas duplicadas simultâneas
    if (fetchingRef.current) {
      return
    }

    // Se não é refresh forçado e já buscou esse usuário antes com sucesso, pular
    if (!forceRefresh && lastFetchedUserIdRef.current === userId) {
      return
    }

    fetchingRef.current = true
    setProfileLoading(true)

    try {
      // Buscar profile primeiro (mais importante)
      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Buscar stats separadamente (menos crítico)
      let statsResult: { data: Estatisticas | null; error: { code?: string } | null } = { data: null, error: null }
      try {
        statsResult = await supabase
          .from('estatisticas_usuario')
          .select('*')
          .eq('user_id', userId)
          .single()
      } catch {
        // Ignorar erros de stats - não é crítico
        console.warn('Erro ao buscar estatisticas - ignorando')
      }

      // Processar profile
      if (profileResult.error && profileResult.error.code === 'PGRST116') {
        // Perfil nao existe - criar um novo
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            nome: userName || userEmail?.split('@')[0] || 'Usuario',
            email: userEmail,
          })
          .select()
          .single()

        if (!insertError && newProfile) {
          setProfile(newProfile as Profile)
          setIsNewUser(true)
          lastFetchedUserIdRef.current = userId // Marcar como sucesso
        }
      } else if (profileResult.data) {
        setProfile(profileResult.data as Profile)
        setIsNewUser(false)
        lastFetchedUserIdRef.current = userId // Marcar como sucesso
      }

      // Processar stats (com tratamento de erro robusto)
      try {
        if (statsResult.error && statsResult.error.code === 'PGRST116') {
          // Estatisticas nao existem - criar novas
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
        } else if (statsResult.data) {
          setStats(statsResult.data as Estatisticas)
        }
      } catch {
        // Ignorar erros de stats - não bloquear a UI
        console.warn('Erro ao processar estatisticas - usando valores padrão')
        setStats(null)
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    } finally {
      fetchingRef.current = false
      setProfileLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata?.nome, true)
    }
  }

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.nome
          )
        } else {
          // Sem usuário logado - não há profile para carregar
          setProfileLoading(false)
        }
      } catch (error) {
        console.error('Erro ao buscar sessao:', error)
        setProfileLoading(false)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          // So buscar se o usuario mudou
          if (session.user.id !== lastFetchedUserIdRef.current) {
            setUser(session.user)
            await fetchProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata?.nome
            )
          }
        } else {
          setUser(null)
          setProfile(null)
          setStats(null)
          setIsNewUser(false)
          lastFetchedUserIdRef.current = null
          setProfileLoading(false)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setStats(null)
    setIsNewUser(false)
    lastFetchedUserIdRef.current = null
  }

  return (
    <AuthContext.Provider value={{ user, profile, stats, loading, profileLoading, isNewUser, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
