'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'

export interface TrialTimerData {
  // Status do trial
  isTrialActive: boolean
  isTrialExpired: boolean
  hasUsedTrial: boolean
  canStartTrial: boolean

  // Tempo
  tempoRestanteMs: number
  tempoRestanteFormatado: string
  horasRestantes: number
  minutosRestantes: number
  segundosRestantes: number

  // Progresso
  percentualUsado: number
  percentualRestante: number

  // Ações
  iniciarTrial: () => Promise<boolean>

  // UI helpers
  corBarra: string
  mostrarUrgencia: boolean
}

// Duração total do trial em segundos (4 horas)
const DURACAO_TRIAL_SEGUNDOS = 4 * 60 * 60

export function useTrialTimer(): TrialTimerData {
  const { profile, plano, trialStatus, iniciarTrial } = useMedAuth()
  const [tick, setTick] = useState(0)

  // Atualizar a cada segundo quando trial ativo (para mostrar contagem)
  useEffect(() => {
    if (!trialStatus.ativo) return

    const interval = setInterval(() => {
      setTick(t => t + 1) // Força re-render para atualizar display
    }, 1000)

    return () => clearInterval(interval)
  }, [trialStatus.ativo])

  // Calcular tempo restante baseado no TEMPO USADO (não corrido)
  const calcularTempoRestante = useCallback(() => {
    // Se não iniciou ou já usou todo o trial
    if (!profile?.trial_started_at || profile.trial_used) {
      if (!profile?.trial_started_at) {
        // Ainda pode iniciar - mostrar 4h completas
        return { ms: DURACAO_TRIAL_SEGUNDOS * 1000, h: 4, m: 0, s: 0 }
      }
      return { ms: 0, h: 0, m: 0, s: 0 }
    }

    // Calcular baseado no tempo USADO (acumulativo)
    const tempoUsadoSegundos = profile.trial_tempo_usado_segundos || 0
    const tempoRestanteSegundos = Math.max(0, DURACAO_TRIAL_SEGUNDOS - tempoUsadoSegundos)

    const h = Math.floor(tempoRestanteSegundos / 3600)
    const m = Math.floor((tempoRestanteSegundos % 3600) / 60)
    const s = tempoRestanteSegundos % 60

    return { ms: tempoRestanteSegundos * 1000, h, m, s }
  }, [profile?.trial_started_at, profile?.trial_used, profile?.trial_tempo_usado_segundos, tick])

  const tempo = calcularTempoRestante()

  // Formatar tempo
  const formatarTempo = useCallback(() => {
    if (tempo.ms <= 0) return '0h 0min'

    if (tempo.h > 0) {
      return `${tempo.h}h ${tempo.m}min`
    }
    if (tempo.m > 0) {
      return `${tempo.m}min ${tempo.s}s`
    }
    return `${tempo.s}s`
  }, [tempo])

  // Verificações
  const isTrialActive = plano === 'gratuito' && !!profile?.trial_started_at && !profile?.trial_used && tempo.ms > 0
  const isTrialExpired = plano === 'gratuito' && !!profile?.trial_started_at && (profile?.trial_used || tempo.ms <= 0)
  const hasUsedTrial = profile?.trial_used === true
  const canStartTrial = plano === 'gratuito' && !profile?.trial_started_at && !profile?.trial_used

  // Percentuais
  const tempoUsadoSegundos = profile?.trial_tempo_usado_segundos || 0
  const percentualUsado = Math.round((tempoUsadoSegundos / DURACAO_TRIAL_SEGUNDOS) * 100)
  const percentualRestante = Math.max(0, 100 - percentualUsado)

  // Cor da barra baseada no tempo restante
  const getCorBarra = () => {
    if (tempo.h >= 2) return 'bg-emerald-500' // Verde - mais de 2h
    if (tempo.h >= 1) return 'bg-yellow-500' // Amarelo - 1-2h
    if (tempo.m >= 30) return 'bg-orange-500' // Laranja - 30min-1h
    return 'bg-red-500' // Vermelho - menos de 30min
  }

  // Mostrar urgência quando menos de 30 min
  const mostrarUrgencia = isTrialActive && tempo.h === 0 && tempo.m < 30

  return {
    isTrialActive,
    isTrialExpired,
    hasUsedTrial,
    canStartTrial,

    tempoRestanteMs: tempo.ms,
    tempoRestanteFormatado: formatarTempo(),
    horasRestantes: tempo.h,
    minutosRestantes: tempo.m,
    segundosRestantes: tempo.s,

    percentualUsado,
    percentualRestante,

    iniciarTrial,

    corBarra: getCorBarra(),
    mostrarUrgencia
  }
}
