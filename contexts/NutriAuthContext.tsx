'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Tipos específicos do NutriVida (App de saude feminina)
export interface ProfileNUTRI {
  id: string
  nome: string | null
  email: string | null
  idade: number | null
  peso_inicial: number | null
  peso_atual: number | null
  peso_meta: number | null
  altura: number | null
  idade_bebe: number | null
  amamentando: boolean
  plano: 'normal' | 'restritivo'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface MacrosDia {
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

type NutriAuthContextType = {
  user: User | null
  profile: ProfileNUTRI | null
  loading: boolean
  profileLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<ProfileNUTRI>) => Promise<boolean>
  // Cálculos
  imc: number
  pesoAPerdido: number
  pesoRestante: number
  progressoPercentual: number
  metaCalorias: number
  metaProteinas: number
}

const NutriAuthContext = createContext<NutriAuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => false,
  imc: 0,
  pesoAPerdido: 0,
  pesoRestante: 0,
  progressoPercentual: 0,
  metaCalorias: 1900,
  metaProteinas: 80
})

export function NutriAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileNUTRI | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  const fetchingRef = useRef(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)

  // Cálculos baseados no perfil
  const imc = profile?.peso_atual && profile?.altura
    ? Number((profile.peso_atual / Math.pow(profile.altura, 2)).toFixed(1))
    : 0

  const pesoAPerdido = profile?.peso_inicial && profile?.peso_atual
    ? Number((profile.peso_inicial - profile.peso_atual).toFixed(1))
    : 0

  const pesoRestante = profile?.peso_atual && profile?.peso_meta
    ? Number((profile.peso_atual - profile.peso_meta).toFixed(1))
    : 0

  const progressoPercentual = profile?.peso_inicial && profile?.peso_atual && profile?.peso_meta
    ? Math.max(0, Math.round(((profile.peso_inicial - profile.peso_atual) / (profile.peso_inicial - profile.peso_meta)) * 100))
    : 0

  const metaCalorias = profile?.plano === 'restritivo' ? 1300 : 1900
  const metaProteinas = profile?.plano === 'restritivo' ? 90 : 80

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userName?: string, forceRefresh = false) => {
    if (fetchingRef.current) return
    if (!forceRefresh && lastFetchedUserIdRef.current === userId) {
      setProfileLoading(false)
      return
    }

    fetchingRef.current = true
    setProfileLoading(true)

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles_nutri')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile não existe - criar novo
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles_nutri')
          .insert({
            id: userId,
            nome: userName || userEmail?.split('@')[0] || 'Usuaria',
            email: userEmail,
            plano: 'normal',
            amamentando: false
          })
          .select()
          .single()

        if (insertError) {
          console.error('Erro ao criar perfil:', insertError)
        } else if (newProfile) {
          setProfile(newProfile as ProfileNUTRI)
        }
      } else if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
      } else if (profileData) {
        setProfile(profileData as ProfileNUTRI)
      }

      lastFetchedUserIdRef.current = userId
    } catch (error) {
      console.error('Erro ao buscar perfil NUTRI:', error)
    } finally {
      fetchingRef.current = false
      setProfileLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.email || undefined, user.user_metadata?.nome, true)
    }
  }, [user, fetchProfile])

  const updateProfile = useCallback(async (data: Partial<ProfileNUTRI>): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('profiles_nutri')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        console.error('Erro ao atualizar perfil:', error)
        return false
      }

      await refreshProfile()
      return true
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
      return false
    }
  }, [user, refreshProfile])

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!mounted) return

        if (sessionError) {
          console.error('Erro na sessão:', sessionError)
          setProfileLoading(false)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          try {
            await fetchProfile(
              session.user.id,
              session.user.email || undefined,
              session.user.user_metadata?.nome
            )
          } catch (profileErr) {
            console.error('Erro ao carregar perfil:', profileErr)
            setProfileLoading(false)
          }
        } else {
          setProfileLoading(false)
        }
      } catch (error) {
        console.error('Erro ao buscar sessão:', error)
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
          if (session.user.id !== lastFetchedUserIdRef.current) {
            setUser(session.user)
            await fetchProfile(
              session.user.id,
              session.user.email || undefined,
              session.user.user_metadata?.nome
            )
          }
        } else {
          setUser(null)
          setProfile(null)
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
  }, [fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    lastFetchedUserIdRef.current = null
  }

  return (
    <NutriAuthContext.Provider value={{
      user,
      profile,
      loading,
      profileLoading,
      signOut,
      refreshProfile,
      updateProfile,
      imc,
      pesoAPerdido,
      pesoRestante,
      progressoPercentual,
      metaCalorias,
      metaProteinas
    }}>
      {children}
    </NutriAuthContext.Provider>
  )
}

export const useNutriAuth = () => useContext(NutriAuthContext)
