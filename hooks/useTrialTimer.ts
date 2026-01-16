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

export function useTrialTimer(): TrialTimerData {
  const { profile, plano, trialStatus, iniciarTrial } = useMedAuth()
  const [segundos, setSegundos] = useState(0)

  // Atualizar a cada segundo quando trial ativo
  useEffect(() => {
    if (!trialStatus.ativo) return

    const interval = setInterval(() => {
      setSegundos(s => s + 1) // Força re-render
    }, 1000)

    return () => clearInterval(interval)
  }, [trialStatus.ativo])

  // Calcular tempo restante em tempo real
  const calcularTempoRestante = useCallback(() => {
    if (!profile?.trial_started_at || profile.trial_used) {
      return { ms: 0, h: 0, m: 0, s: 0 }
    }

    const inicio = new Date(profile.trial_started_at).getTime()
    const duracao = 4 * 60 * 60 * 1000 // 4 horas
    const agora = Date.now()
    const restante = Math.max(0, inicio + duracao - agora)

    const h = Math.floor(restante / (60 * 60 * 1000))
    const m = Math.floor((restante % (60 * 60 * 1000)) / (60 * 1000))
    const s = Math.floor((restante % (60 * 1000)) / 1000)

    return { ms: restante, h, m, s }
  }, [profile?.trial_started_at, profile?.trial_used, segundos])

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
  const isTrialActive = plano === 'gratuito' && trialStatus.ativo && tempo.ms > 0
  const isTrialExpired = plano === 'gratuito' && profile?.trial_started_at && tempo.ms <= 0
  const hasUsedTrial = profile?.trial_used === true
  const canStartTrial = plano === 'gratuito' && !profile?.trial_started_at && !profile?.trial_used

  // Percentuais
  const duracaoTotal = 4 * 60 * 60 * 1000
  const percentualUsado = Math.round(((duracaoTotal - tempo.ms) / duracaoTotal) * 100)
  const percentualRestante = 100 - percentualUsado

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
