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
    const updateTrial = () => setTrialStatus(calcularTrialStatus())
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
            // Marcar trial como usado
            await supabase
              .from('profiles_med')
              .update({
                trial_tempo_usado_segundos: DURACAO_TRIAL_SEGUNDOS,
                trial_used: true
              })
              .eq('id', user.id)
          } else {
            // Apenas incrementar tempo
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

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userName?: string, forceRefresh = false) => {
    if (fetchingRef.current) {
      return
    }
    if (!forceRefresh && lastFetchedUserIdRef.current === userId) {
      setProfileLoading(false)
      return
    }

    fetchingRef.current = true
    setProfileLoading(true)

    const mesAtual = new Date().toISOString().slice(0, 7) // "2026-01"

    try {
      // ========== OTIMIZACAO: Buscar todos os dados em PARALELO ==========
      const [profileResult, limitesResult, assinaturaResult] = await Promise.allSettled([
        // 1. Profile
        supabase
          .from('profiles_med')
          .select('*')
          .eq('id', userId)
          .single(),
        // 2. Limites
        supabase
          .from('limites_uso_med')
          .select('*')
          .eq('user_id', userId)
          .eq('mes_referencia', mesAtual)
          .single(),
        // 3. Assinatura
        supabase
          .from('assinaturas_med')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'ativa')
          .order('created_at', { ascending: false })
          .limit(1)
      ])

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
          // Limites nao existem - criar novo (em background, nao bloquear)
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
          // Verificar se eh um novo dia - atualizar em background
          const hoje = new Date().toISOString().split('T')[0]
          if (limitesData.data_questoes !== hoje) {
            setLimites({ ...limitesData, questoes_dia: 0, data_questoes: hoje } as LimitesUsoMED)
            // Atualizar no banco em background
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
        // OTIMIZAÇÃO: Tentar obter sessão do localStorage primeiro (mais rápido)
        // O Supabase armazena a sessão em localStorage com a chave específica
        const storageKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
        const cachedSession = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null

        if (cachedSession) {
          try {
            const parsed = JSON.parse(cachedSession)
            if (parsed?.user) {
              console.log('[Auth] Usando sessão do cache local')
              setUser(parsed.user)
              // Buscar perfil em paralelo com validação da sessão
              fetchProfile(
                parsed.user.id,
                parsed.user.email || undefined,
                parsed.user.user_metadata?.nome
              ).catch(err => console.error('[Auth] Erro ao carregar perfil:', err))
            }
          } catch (e) {
            console.log('[Auth] Cache inválido, buscando sessão do servidor')
          }
        }

        // Validar sessão com o servidor (pode demorar)
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
          // Sessão inválida - limpar user se foi setado do cache
          setUser(null)
          setProfile(null)
          setProfileLoading(false)
        }
      } catch (error) {
        console.error('Erro ao buscar sessão:', error)
        setProfileLoading(false)
      } finally {
        // SEMPRE definir loading como false, mesmo se unmounted
        // Isso evita que a página fique travada em loading infinito
        setLoading(false)
      }
    }

    // Timeout de segurança REDUZIDO: se auth demorar mais de 3 segundos, liberar a página
    // O conteúdo vai carregar com dados do cache, e atualiza quando o servidor responder
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[Auth] Timeout de segurança atingido, liberando loading')
        setLoading(false)
        // NÃO definir profileLoading como false aqui - deixar o perfil continuar carregando
      }
    }, 3000)

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
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
      clearTimeout(safetyTimeout)
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
