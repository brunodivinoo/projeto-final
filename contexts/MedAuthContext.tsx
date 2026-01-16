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
  // Campos de Trial
  trial_started_at: string | null
  trial_used: boolean
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
  casos_clinicos_mes: number
  anotacoes_total: number
}

// =============================================
// LIMITES POR PLANO - PREPARAMED 2026
// =============================================
// FREE: R$0 - Trial 4h + 20 questões/dia
// PREMIUM: R$60/mês - Sonnet + limites generosos
// RESIDÊNCIA: R$150/mês - Opus + ilimitado
// =============================================

export const LIMITES_PLANO = {
  gratuito: {
    // Trial de 4 horas com acesso total
    trial_horas: 4,
    // Após trial
    questoes_dia: 20,
    gabarito_percentual: 50, // 50% blur
    simulados_mes: 0,
    questoes_por_simulado: 0,
    perguntas_ia_mes: 0,
    resumos_ia_mes: 0,
    flashcards_semana: 0,
    casos_clinicos_mes: 0,
    anotacoes_total: 10,
    biblioteca_acesso: false,
    analise_exames: false,
    voz_ia: false,
    modelo_ia: null,
    fila_ia: false,
    exportar_pdf: false,
    marca_dagua: true,
    badge_ranking: '🆓',
    historico_dias: 30,
    teoria_nivel: 'basico' as const
  },
  premium: {
    // R$60/mês
    trial_horas: 0,
    questoes_dia: 80,
    gabarito_percentual: 100,
    simulados_mes: 2,
    questoes_por_simulado: 100,
    perguntas_ia_mes: 100, // Sonnet
    resumos_ia_mes: 10,
    flashcards_semana: 30,
    casos_clinicos_mes: 3, // Texto apenas
    anotacoes_total: 100,
    biblioteca_acesso: true,
    analise_exames: false, // Teaser
    voz_ia: false, // Teaser
    modelo_ia: 'sonnet',
    fila_ia: true, // 5-30s de espera
    exportar_pdf: true,
    marca_dagua: true, // Com marca d'água
    badge_ranking: '💎',
    historico_dias: 365,
    teoria_nivel: 'avancado' as const
  },
  residencia: {
    // R$150/mês
    trial_horas: 0,
    questoes_dia: -1, // ilimitado
    gabarito_percentual: 100,
    simulados_mes: -1, // ilimitado
    questoes_por_simulado: 200,
    perguntas_ia_mes: -1, // ilimitado (Opus)
    resumos_ia_mes: -1, // ilimitado
    flashcards_semana: -1, // ilimitado
    casos_clinicos_mes: -1, // ilimitado + voz
    anotacoes_total: -1, // ilimitado
    biblioteca_acesso: true,
    analise_exames: true,
    voz_ia: true,
    modelo_ia: 'opus',
    fila_ia: false, // Instantâneo
    exportar_pdf: true,
    marca_dagua: false, // Limpo
    badge_ranking: '👑',
    historico_dias: -1, // ilimitado
    teoria_nivel: 'expert' as const
  }
}

// Preços dos planos
export const PRECOS_PLANO = {
  gratuito: 0,
  premium: 60,
  residencia: 150
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

// Status do Trial
export interface TrialStatus {
  ativo: boolean
  tempoRestante: number // em milissegundos
  tempoRestanteFormatado: string // "3h 45min"
  percentualUsado: number
  expirado: boolean
}

type MedAuthContextType = {
  user: User | null
  profile: ProfileMED | null
  limites: LimitesUsoMED | null
  assinatura: AssinaturaMED | null
  loading: boolean
  profileLoading: boolean
  plano: 'gratuito' | 'premium' | 'residencia'
  limitesPlano: typeof LIMITES_PLANO.gratuito | typeof LIMITES_PLANO.premium | typeof LIMITES_PLANO.residencia
  // Trial
  trialStatus: TrialStatus
  iniciarTrial: () => Promise<boolean>
  // Funções existentes
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  verificarLimite: (tipo: 'questoes_dia' | 'simulados_mes' | 'perguntas_ia_mes' | 'resumos_ia_mes' | 'flashcards_ia_mes' | 'casos_clinicos_mes' | 'anotacoes_total') => { permitido: boolean; usado: number; limite: number }
  incrementarUso: (tipo: 'questoes_dia' | 'simulados_mes' | 'perguntas_ia_mes' | 'resumos_ia_mes' | 'flashcards_ia_mes' | 'casos_clinicos_mes' | 'anotacoes_total') => Promise<boolean>
  // Verificações de funcionalidades
  podeUsarFuncionalidade: (funcionalidade: 'ia' | 'simulados' | 'flashcards' | 'casos_clinicos' | 'analise_exames' | 'voz' | 'biblioteca') => boolean
}

const defaultTrialStatus: TrialStatus = {
  ativo: false,
  tempoRestante: 0,
  tempoRestanteFormatado: '0h 0min',
  percentualUsado: 100,
  expirado: true
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
  trialStatus: defaultTrialStatus,
  iniciarTrial: async () => false,
  signOut: async () => {},
  refreshProfile: async () => {},
  verificarLimite: () => ({ permitido: true, usado: 0, limite: 0 }),
  incrementarUso: async () => true,
  podeUsarFuncionalidade: () => false,
})

export function MedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileMED | null>(null)
  const [limites, setLimites] = useState<LimitesUsoMED | null>(null)
  const [assinatura, setAssinatura] = useState<AssinaturaMED | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [trialStatus, setTrialStatus] = useState<TrialStatus>(defaultTrialStatus)

  const fetchingRef = useRef(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)

  const plano = profile?.plano || 'gratuito'
  const limitesPlano = LIMITES_PLANO[plano]

  // Calcular status do trial
  const calcularTrialStatus = useCallback((): TrialStatus => {
    if (!profile || plano !== 'gratuito') {
      return { ativo: false, tempoRestante: 0, tempoRestanteFormatado: '0h 0min', percentualUsado: 100, expirado: true }
    }
    if (profile.trial_used || !profile.trial_started_at) {
      return { ativo: false, tempoRestante: 0, tempoRestanteFormatado: '0h 0min', percentualUsado: 100, expirado: !profile.trial_started_at }
    }
    const inicio = new Date(profile.trial_started_at).getTime()
    const duracao = 4 * 60 * 60 * 1000 // 4 horas
    const agora = Date.now()
    const restante = Math.max(0, inicio + duracao - agora)
    if (restante <= 0) {
      return { ativo: false, tempoRestante: 0, tempoRestanteFormatado: '0h 0min', percentualUsado: 100, expirado: true }
    }
    const horas = Math.floor(restante / (60 * 60 * 1000))
    const minutos = Math.floor((restante % (60 * 60 * 1000)) / (60 * 1000))
    return {
      ativo: true,
      tempoRestante: restante,
      tempoRestanteFormatado: `${horas}h ${minutos}min`,
      percentualUsado: Math.round(((duracao - restante) / duracao) * 100),
      expirado: false
    }
  }, [profile, plano])

  // Atualizar trial status periodicamente
  useEffect(() => {
    const updateTrial = () => setTrialStatus(calcularTrialStatus())
    updateTrial()
    const interval = setInterval(updateTrial, 60000) // A cada minuto
    return () => clearInterval(interval)
  }, [calcularTrialStatus])

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
            casos_clinicos_mes: 0,
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

  // Iniciar trial de 4 horas
  const iniciarTrial = useCallback(async (): Promise<boolean> => {
    if (!user || !profile || profile.trial_used || profile.trial_started_at) return false
    try {
      const { error } = await supabase
        .from('profiles_med')
        .update({ trial_started_at: new Date().toISOString() })
        .eq('id', user.id)
      if (!error) {
        await refreshProfile()
        return true
      }
    } catch (e) { console.error('Erro ao iniciar trial:', e) }
    return false
  }, [user, profile, refreshProfile])

  // Verificar se pode usar funcionalidade
  const podeUsarFuncionalidade = useCallback((func: 'ia' | 'simulados' | 'flashcards' | 'casos_clinicos' | 'analise_exames' | 'voz' | 'biblioteca'): boolean => {
    // Se trial ativo, pode tudo
    if (trialStatus.ativo) return true
    // Verificar por plano
    const checks: Record<string, boolean> = {
      ia: limitesPlano.perguntas_ia_mes !== 0,
      simulados: limitesPlano.simulados_mes !== 0,
      flashcards: limitesPlano.flashcards_semana !== 0,
      casos_clinicos: limitesPlano.casos_clinicos_mes !== 0,
      analise_exames: limitesPlano.analise_exames,
      voz: limitesPlano.voz_ia,
      biblioteca: limitesPlano.biblioteca_acesso
    }
    return checks[func] ?? false
  }, [trialStatus.ativo, limitesPlano])

  const verificarLimite = useCallback((tipo: 'questoes_dia' | 'simulados_mes' | 'perguntas_ia_mes' | 'resumos_ia_mes' | 'flashcards_ia_mes' | 'casos_clinicos_mes' | 'anotacoes_total') => {
    // Mapear para o campo correto do limitesPlano (que usa flashcards_semana)
    const tipoPlano = tipo === 'flashcards_ia_mes' ? 'flashcards_semana' : tipo
    const limite = limitesPlano[tipoPlano as keyof typeof limitesPlano] as number
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

  const incrementarUso = useCallback(async (tipo: 'questoes_dia' | 'simulados_mes' | 'perguntas_ia_mes' | 'resumos_ia_mes' | 'flashcards_ia_mes' | 'casos_clinicos_mes' | 'anotacoes_total') => {
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
      trialStatus,
      iniciarTrial,
      signOut,
      refreshProfile,
      verificarLimite,
      incrementarUso,
      podeUsarFuncionalidade
    }}>
      {children}
    </MedAuthContext.Provider>
  )
}

export const useMedAuth = () => useContext(MedAuthContext)
