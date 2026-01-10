'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Tipos específicos do PREPARAMED
export interface ProfileMED {
  id: string
  nome: string | null
  email: string | null
  avatar_url: string | null
  faculdade: string | null
  ano_curso: number | null
  periodo_curso: number | null
  estado: string | null
  cidade: string | null
  plano: 'gratuito' | 'premium' | 'residencia'
  questoes_respondidas: number
  questoes_corretas: number
  tempo_estudo_segundos: number
  created_at: string
  updated_at: string
}

export interface LimitesUsoMED {
  id: string
  user_id: string
  mes_referencia: string
  questoes_dia: number
  data_questoes: string
  simulados_mes: number
  perguntas_ia_mes: number
  resumos_ia_mes: number
  flashcards_ia_mes: number
  anotacoes_total: number
}

// Limites por plano
export const LIMITES_PLANO = {
  gratuito: {
    questoes_dia: 20,
    simulados_mes: 2,
    questoes_por_simulado: 30,
    perguntas_ia_mes: 0,
    resumos_ia_mes: 0,
    flashcards_ia_mes: 0,
    anotacoes_total: 10,
    biblioteca_ano: 1,
    teoria_nivel: 'basico',
    exportar_pdf: false,
    historico_dias: 30
  },
  premium: {
    questoes_dia: -1, // ilimitado
    simulados_mes: 10,
    questoes_por_simulado: 100,
    perguntas_ia_mes: 100,
    resumos_ia_mes: 20,
    flashcards_ia_mes: 50,
    anotacoes_total: 100,
    biblioteca_ano: 6,
    teoria_nivel: 'avancado',
    exportar_pdf: true,
    historico_dias: 365
  },
  residencia: {
    questoes_dia: -1, // ilimitado
    simulados_mes: -1, // ilimitado
    questoes_por_simulado: 200,
    perguntas_ia_mes: -1, // ilimitado
    resumos_ia_mes: -1, // ilimitado
    flashcards_ia_mes: -1, // ilimitado
    anotacoes_total: -1, // ilimitado
    biblioteca_ano: 6,
    teoria_nivel: 'expert',
    exportar_pdf: true,
    historico_dias: -1 // ilimitado
  }
}

export interface AssinaturaMED {
  id: string
  user_id: string
  plano: string
  status: string
  data_inicio: string
  data_fim: string | null
  proximo_pagamento: string | null
}

type MedAuthContextType = {
  user: User | null
  profile: ProfileMED | null
  limites: LimitesUsoMED | null
  assinatura: AssinaturaMED | null
  loading: boolean
  profileLoading: boolean
  plano: 'gratuito' | 'premium' | 'residencia'
  limitesPlano: typeof LIMITES_PLANO.gratuito
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  verificarLimite: (tipo: 'questoes_dia' | 'simulados_mes' | 'perguntas_ia_mes' | 'resumos_ia_mes' | 'flashcards_ia_mes' | 'anotacoes_total') => { permitido: boolean; usado: number; limite: number }
  incrementarUso: (tipo: 'questoes_dia' | 'simulados_mes' | 'perguntas_ia_mes' | 'resumos_ia_mes' | 'flashcards_ia_mes' | 'anotacoes_total') => Promise<boolean>
}

const MedAuthContext = createContext<MedAuthContextType>({
  user: null,
  profile: null,
  limites: null,
  assinatura: null,
  loading: true,
  profileLoading: true,
  plano: 'gratuito',
  limitesPlano: LIMITES_PLANO.gratuito,
  signOut: async () => {},
  refreshProfile: async () => {},
  verificarLimite: () => ({ permitido: true, usado: 0, limite: 0 }),
  incrementarUso: async () => true,
})

export function MedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileMED | null>(null)
  const [limites, setLimites] = useState<LimitesUsoMED | null>(null)
  const [assinatura, setAssinatura] = useState<AssinaturaMED | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  const fetchingRef = useRef(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)

  const plano = profile?.plano || 'gratuito'
  const limitesPlano = LIMITES_PLANO[plano]

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userName?: string, forceRefresh = false) => {
    if (fetchingRef.current) return
    if (!forceRefresh && lastFetchedUserIdRef.current === userId) return

    fetchingRef.current = true
    setProfileLoading(true)

    try {
      // Buscar profile_MED
      const { data: profileData, error: profileError } = await supabase
        .from('profiles_med')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile não existe - criar novo
        const { data: newProfile } = await supabase
          .from('profiles_med')
          .insert({
            id: userId,
            nome: userName || userEmail?.split('@')[0] || 'Estudante',
            email: userEmail,
            plano: 'gratuito'
          })
          .select()
          .single()

        if (newProfile) {
          setProfile(newProfile as ProfileMED)
        }
      } else if (profileData) {
        setProfile(profileData as ProfileMED)
      }

      // Buscar ou criar limites de uso do mês atual
      const mesAtual = new Date().toISOString().slice(0, 7) // "2026-01"

      const { data: limitesData, error: limitesError } = await supabase
        .from('limites_uso_med')
        .select('*')
        .eq('user_id', userId)
        .eq('mes_referencia', mesAtual)
        .single()

      if (limitesError && limitesError.code === 'PGRST116') {
        // Limites não existem para este mês - criar
        const { data: newLimites } = await supabase
          .from('limites_uso_med')
          .insert({
            user_id: userId,
            mes_referencia: mesAtual,
            questoes_dia: 0,
            data_questoes: new Date().toISOString().split('T')[0],
            simulados_mes: 0,
            perguntas_ia_mes: 0,
            resumos_ia_mes: 0,
            flashcards_ia_mes: 0,
            anotacoes_total: 0
          })
          .select()
          .single()

        if (newLimites) {
          setLimites(newLimites as LimitesUsoMED)
        }
      } else if (limitesData) {
        // Verificar se é um novo dia para resetar questoes_dia
        const hoje = new Date().toISOString().split('T')[0]
        if (limitesData.data_questoes !== hoje) {
          const { data: updatedLimites } = await supabase
            .from('limites_uso_med')
            .update({ questoes_dia: 0, data_questoes: hoje })
            .eq('id', limitesData.id)
            .select()
            .single()

          setLimites((updatedLimites || limitesData) as LimitesUsoMED)
        } else {
          setLimites(limitesData as LimitesUsoMED)
        }
      }

      // Buscar assinatura ativa
      const { data: assinaturaData } = await supabase
        .from('assinaturas_med')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (assinaturaData) {
        setAssinatura(assinaturaData as AssinaturaMED)
      }

      lastFetchedUserIdRef.current = userId
    } catch (error) {
      console.error('Erro ao buscar perfil MED:', error)
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

  const verificarLimite = useCallback((tipo: 'questoes_dia' | 'simulados_mes' | 'perguntas_ia_mes' | 'resumos_ia_mes' | 'flashcards_ia_mes' | 'anotacoes_total') => {
    const limite = limitesPlano[tipo]
    const usado = limites?.[tipo] || 0

    // -1 significa ilimitado
    if (limite === -1) {
      return { permitido: true, usado, limite: -1 }
    }

    return {
      permitido: usado < limite,
      usado,
      limite
    }
  }, [limitesPlano, limites])

  const incrementarUso = useCallback(async (tipo: 'questoes_dia' | 'simulados_mes' | 'perguntas_ia_mes' | 'resumos_ia_mes' | 'flashcards_ia_mes' | 'anotacoes_total') => {
    if (!user || !limites) return false

    const { permitido } = verificarLimite(tipo)
    if (!permitido) return false

    try {
      const novoValor = (limites[tipo] || 0) + 1
      const updates: Partial<LimitesUsoMED> = { [tipo]: novoValor }

      // Se for questoes_dia, atualizar a data também
      if (tipo === 'questoes_dia') {
        updates.data_questoes = new Date().toISOString().split('T')[0]
      }

      const { data } = await supabase
        .from('limites_uso_med')
        .update(updates)
        .eq('id', limites.id)
        .select()
        .single()

      if (data) {
        setLimites(data as LimitesUsoMED)
        return true
      }
    } catch (error) {
      console.error('Erro ao incrementar uso:', error)
    }

    return false
  }, [user, limites, verificarLimite])

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
            session.user.email || undefined,
            session.user.user_metadata?.nome
          )
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
          setLimites(null)
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
    setLimites(null)
    lastFetchedUserIdRef.current = null
  }

  return (
    <MedAuthContext.Provider value={{
      user,
      profile,
      limites,
      assinatura,
      loading,
      profileLoading,
      plano,
      limitesPlano,
      signOut,
      refreshProfile,
      verificarLimite,
      incrementarUso
    }}>
      {children}
    </MedAuthContext.Provider>
  )
}

export const useMedAuth = () => useContext(MedAuthContext)
