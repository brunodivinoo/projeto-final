'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
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
  // Campos de Trial - TEMPO ATIVO (não corrido)
  trial_started_at: string | null // Quando iniciou o trial
  trial_used: boolean // Se já usou todo o trial
  trial_tempo_usado_segundos: number // Tempo total usado em segundos (acumulativo)
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
// FREE: R$0 - Trial 1h + 10 questões/dia
// PREMIUM: R$60/mês - Sonnet + limites generosos
// RESIDÊNCIA: R$200/mês - Smart Router (OpenAI + Claude)
// =============================================

export const LIMITES_PLANO = {
  gratuito: {
    // Trial de 1 hora com acesso total
    trial_horas: 1,
    // Após trial
    questoes_dia: 10,
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
    questoes_dia: -1, // ilimitado
    gabarito_percentual: 100,
    simulados_mes: 5,
    questoes_por_simulado: 100,
    perguntas_ia_mes: 100, // Sonnet
    resumos_ia_mes: 15,
    flashcards_semana: 50,
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

// Status do Trial - TEMPO ATIVO
export interface TrialStatus {
  ativo: boolean
  tempoRestante: number // em milissegundos
  tempoRestanteFormatado: string // "3h 45min"
  percentualUsado: number
  expirado: boolean
  tempoUsadoSegundos: number // Total de segundos já usados
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
  expirado: true,
  tempoUsadoSegundos: 0
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

// =============================================
// ARQUITETURA v2 - RECONSTRUÇÃO COMPLETA
// =============================================
// REGRA #1: onAuthStateChange NUNCA faz queries ao banco
//           Apenas seta user/loading. Isso evita queries durante
//           _initialize e _recoverAndRefresh quando o JWT não está pronto.
//
// REGRA #2: useEffect separado observa mudanças em `user`
//           e dispara fetchProfile DEPOIS que o Supabase está pronto.
//
// REGRA #3: Dados existentes são preservados enquanto re-fetch ocorre.
//           profileLoading só é true no carregamento inicial.
//
// REGRA #4: AbortController cancela queries obsoletas.
// =============================================

export function MedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileMED | null>(null)
  const [limites, setLimites] = useState<LimitesUsoMED | null>(null)
  const [assinatura, setAssinatura] = useState<AssinaturaMED | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [trialStatus, setTrialStatus] = useState<TrialStatus>(defaultTrialStatus)

  // Refs para controle de fluxo
  const lastFetchedUserIdRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fetchCountRef = useRef(0) // Para detectar chamadas obsoletas

  const plano = profile?.plano || 'gratuito'
  const limitesPlano = LIMITES_PLANO[plano]

  // Calcular status do trial - BASEADO EM TEMPO ATIVO
  const calcularTrialStatus = useCallback((): TrialStatus => {
    const DURACAO_TRIAL_SEGUNDOS = 1 * 60 * 60 // 1 hora em segundos

    if (!profile || plano !== 'gratuito') {
      return { ativo: false, tempoRestante: 0, tempoRestanteFormatado: '0h 0min', percentualUsado: 100, expirado: true, tempoUsadoSegundos: 0 }
    }

    // Ainda não iniciou o trial
    if (!profile.trial_started_at) {
      return { ativo: false, tempoRestante: DURACAO_TRIAL_SEGUNDOS * 1000, tempoRestanteFormatado: '1h 0min', percentualUsado: 0, expirado: false, tempoUsadoSegundos: 0 }
    }

    // Já usou todo o trial
    if (profile.trial_used) {
      return { ativo: false, tempoRestante: 0, tempoRestanteFormatado: '0h 0min', percentualUsado: 100, expirado: true, tempoUsadoSegundos: DURACAO_TRIAL_SEGUNDOS }
    }

    // Calcular tempo restante baseado no tempo USADO (não corrido)
    const tempoUsado = profile.trial_tempo_usado_segundos || 0
    const tempoRestanteSegundos = Math.max(0, DURACAO_TRIAL_SEGUNDOS - tempoUsado)

    if (tempoRestanteSegundos <= 0) {
      return { ativo: false, tempoRestante: 0, tempoRestanteFormatado: '0h 0min', percentualUsado: 100, expirado: true, tempoUsadoSegundos: tempoUsado }
    }

    const horas = Math.floor(tempoRestanteSegundos / 3600)
    const minutos = Math.floor((tempoRestanteSegundos % 3600) / 60)

    return {
      ativo: true,
      tempoRestante: tempoRestanteSegundos * 1000, // Converter para ms
      tempoRestanteFormatado: `${horas}h ${minutos}min`,
      percentualUsado: Math.round((tempoUsado / DURACAO_TRIAL_SEGUNDOS) * 100),
      expirado: false,
      tempoUsadoSegundos: tempoUsado
    }
  }, [profile, plano])

  // Atualizar trial status e incrementar tempo usado (heartbeat)
  useEffect(() => {
    const updateTrial = () => {
      const newStatus = calcularTrialStatus()
      setTrialStatus(prevStatus => {
        if (JSON.stringify(prevStatus) === JSON.stringify(newStatus)) {
          return prevStatus
        }
        return newStatus
      })
    }
    updateTrial()

    // Se trial ativo, incrementar tempo usado a cada minuto
    const interval = setInterval(async () => {
      updateTrial()

      // Incrementar tempo usado se trial está ativo
      const status = calcularTrialStatus()
      if (status.ativo && user && profile?.trial_started_at && !profile?.trial_used) {
        try {
          const DURACAO_TRIAL_SEGUNDOS = 4 * 60 * 60
          const novoTempoUsado = (profile.trial_tempo_usado_segundos || 0) + 60 // +1 minuto

          // Verificar se acabou o trial
          if (novoTempoUsado >= DURACAO_TRIAL_SEGUNDOS) {
            await supabase
              .from('profiles_med')
              .update({
                trial_tempo_usado_segundos: DURACAO_TRIAL_SEGUNDOS,
                trial_used: true
              })
              .eq('id', user.id)
          } else {
            await supabase
              .from('profiles_med')
              .update({ trial_tempo_usado_segundos: novoTempoUsado })
              .eq('id', user.id)
          }
        } catch (e) {
          console.error('Erro ao atualizar tempo de trial:', e)
        }
      }
    }, 60000) // A cada minuto

    return () => clearInterval(interval)
  }, [calcularTrialStatus, user, profile])

  // =============================================
  // fetchProfile - Busca dados do perfil no Supabase
  // NUNCA chamada dentro de onAuthStateChange
  // =============================================
  const fetchProfile = useCallback(async (userId: string, forceRefresh = false, userEmail?: string, userName?: string) => {
    // CACHE: Se já temos os dados para este userId e não é refresh forçado, pular
    if (!forceRefresh && lastFetchedUserIdRef.current === userId) {
      console.log('[Auth] Cache hit - perfil já carregado para', userId.slice(0, 8))
      setProfileLoading(false)
      return
    }

    // Cancelar fetch anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    // ID desta chamada para detectar se ficou obsoleta
    const thisFetchId = ++fetchCountRef.current

    // Se é primeira carga (sem dados ainda), mostrar loading
    // Se já tem dados, NÃO mostrar loading (refresh silencioso)
    const isFirstLoad = !profile || profile.id !== userId
    if (isFirstLoad) {
      setProfileLoading(true)
    }

    console.log('[Auth] fetchProfile iniciando para', userId.slice(0, 8), isFirstLoad ? '(primeira carga)' : '(refresh silencioso)')

    const mesAtual = new Date().toISOString().slice(0, 7)

    try {
      // Queries paralelas com timeout de 10s
      const results = await Promise.allSettled([
        supabase
          .from('profiles_med')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase
          .from('limites_uso_med')
          .select('*')
          .eq('user_id', userId)
          .eq('mes_referencia', mesAtual)
          .single(),
        supabase
          .from('assinaturas_med')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'ativa')
          .order('created_at', { ascending: false })
          .limit(1)
      ])

      // Verificar se esta chamada foi abortada/obsoleta
      if (controller.signal.aborted || thisFetchId !== fetchCountRef.current) {
        console.log('[Auth] fetchProfile obsoleto, descartando resultado')
        return
      }

      const [profileResult, limitesResult, assinaturaResult] = results

      console.log('[Auth] Queries completadas:', {
        profile: profileResult.status,
        limites: limitesResult.status,
        assinatura: assinaturaResult.status
      })

      // Processar PROFILE
      if (profileResult.status === 'fulfilled') {
        const { data: profileData, error: profileError } = profileResult.value

        if (profileError && profileError.code === 'PGRST116') {
          // Profile nao existe - criar novo
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles_med')
            .insert({
              id: userId,
              nome: userName || userEmail?.split('@')[0] || 'Estudante',
              email: userEmail,
              plano: 'gratuito'
            })
            .select()
            .single()

          if (!insertError && newProfile) {
            setProfile(newProfile as ProfileMED)
          }
        } else if (profileData) {
          setProfile(profileData as ProfileMED)
        }
      }

      // Processar LIMITES
      if (limitesResult.status === 'fulfilled') {
        const { data: limitesData, error: limitesError } = limitesResult.value

        if (limitesError && limitesError.code === 'PGRST116') {
          // Limites nao existem - criar novo (em background)
          supabase
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
            .then(({ data }: { data: LimitesUsoMED | null }) => {
              if (data) setLimites(data as LimitesUsoMED)
            })
        } else if (limitesData) {
          const hoje = new Date().toISOString().split('T')[0]
          if (limitesData.data_questoes !== hoje) {
            setLimites({ ...limitesData, questoes_dia: 0, data_questoes: hoje } as LimitesUsoMED)
            supabase
              .from('limites_uso_med')
              .update({ questoes_dia: 0, data_questoes: hoje })
              .eq('id', limitesData.id)
          } else {
            setLimites(limitesData as LimitesUsoMED)
          }
        }
      }

      // Processar ASSINATURA
      if (assinaturaResult.status === 'fulfilled') {
        const { data: assinaturasData } = assinaturaResult.value
        if (assinaturasData && assinaturasData.length > 0) {
          setAssinatura(assinaturasData[0] as AssinaturaMED)
        }
      }

      lastFetchedUserIdRef.current = userId
      console.log('[Auth] fetchProfile completado com sucesso')
    } catch (error) {
      // Se foi abort, não é erro real
      if (controller.signal.aborted) return
      console.error('[Auth] Erro em fetchProfile:', error)
      // NÃO sobrescrever dados existentes em caso de erro
    } finally {
      if (thisFetchId === fetchCountRef.current) {
        setProfileLoading(false)
      }
    }
  }, [profile])

  // =============================================
  // EFEITO 1: Inicialização do Auth
  // onAuthStateChange APENAS seta user/loading
  // ZERO queries ao banco aqui dentro
  // =============================================
  useEffect(() => {
    let mounted = true

    // Listener de mudança de auth - APENAS seta estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return

        console.log('[Auth] onAuthStateChange:', event, session?.user?.id?.slice(0, 8))

        if (session?.user) {
          // Só atualizar user se realmente mudou (evita re-render na troca de aba)
          setUser(prev => prev?.id === session.user.id ? prev : session.user)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLimites(null)
          setAssinatura(null)
          lastFetchedUserIdRef.current = null
          setProfileLoading(false)
          setLoading(false)
        }
      }
    )

    // Inicialização: pegar sessão existente
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error && error.message !== 'Auth session missing!') {
          console.error('[Auth] Erro na sessão:', error.message)
        }

        if (session?.user) {
          setUser(session.user)
        } else {
          // Sem sessão - usuário não logado
          setUser(null)
          setProfile(null)
          setProfileLoading(false)
        }
      } catch (error) {
        console.error('[Auth] Erro ao buscar sessão:', error)
        if (mounted) {
          setProfileLoading(false)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // =============================================
  // EFEITO 2: Quando user muda, buscar perfil
  // Este efeito é o ÚNICO lugar que chama fetchProfile
  // Separar do onAuthStateChange garante que o JWT está pronto
  // =============================================
  useEffect(() => {
    if (!user) return

    // Pequeno delay para garantir que o Supabase client
    // finalizou _initialize/_recoverAndRefresh e o JWT está commitado
    const timer = setTimeout(() => {
      fetchProfile(
        user.id,
        false,
        user.email || undefined,
        user.user_metadata?.nome
      )
    }, 100)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, true, user.email || undefined, user.user_metadata?.nome)
    }
  }, [user, fetchProfile])

  // Iniciar trial
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
    if (trialStatus.ativo) return true
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
    const tipoPlano = tipo === 'flashcards_ia_mes' ? 'flashcards_semana' : tipo
    const limite = limitesPlano[tipoPlano as keyof typeof limitesPlano] as number
    const usado = limites?.[tipo] || 0

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

  // Re-validação periódica da sessão (a cada 5 minutos)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      try {
        const { data: { user: validUser }, error } = await supabase.auth.getUser()
        if (error || !validUser) {
          console.log('[Auth] Sessão expirada, limpando estado')
          setUser(null)
          setProfile(null)
          setLimites(null)
          setAssinatura(null)
          lastFetchedUserIdRef.current = null
        }
      } catch (err) {
        console.error('[Auth] Erro ao validar sessão:', err)
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLimites(null)
    setAssinatura(null)
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
