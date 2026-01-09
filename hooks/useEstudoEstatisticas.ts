'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Tipos
export interface EstatisticasHoje {
  total_segundos: number
  total_horas: string
  total_sessoes: number
  total_questoes: number
  total_corretas: number
  porcentagem_acerto: string | number
  total_revisoes: number
  xp_ganho: number
}

export interface EstatisticasSemanal {
  periodo: string
  totais: {
    total_segundos: number
    total_horas: string
    media_diaria_horas: string
    total_sessoes: number
    total_questoes: number
    total_corretas: number
    porcentagem_acerto: string | number
    total_revisoes: number
    xp_ganho: number
  }
  grafico: {
    data: string
    dia: string
    horas: string
    segundos: number
    questoes: number
    revisoes: number
  }[]
  dias_estudados: number
}

export interface EstatisticasCiclo {
  ciclo: {
    id: string
    nome: string
    status: string
    horas_planejadas: number
    horas_estudadas: string
    progresso_geral: string | number
    dias_restantes: number
    total_horas_meta: number
    total_horas_estudadas: string
    ciclo_itens: any[]
  } | null
}

export interface EstatisticasDisciplina {
  disciplina: { id: string; nome: string; icon?: string; cor?: string }
  total_segundos: number
  total_horas: string
  total_sessoes: number
  total_questoes: number
  total_corretas: number
  porcentagem_acerto: string | number
}

export interface EstatisticasGerais {
  periodo: string
  resumo: {
    total_horas: string
    media_diaria: string
    total_questoes: number
    porcentagem_acerto: string | number
    total_sessoes: number
    xp_ganho: number
  }
  revisoes: {
    pendentes: number
    atrasadas: number
    total: number
  }
  ciclo_atual: {
    id: string
    nome: string
    status: string
    horas_planejadas: number
    horas_estudadas: number
    progresso: string | number
  } | null
  dias_estudados: number
}

export function useEstudoEstatisticas() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar estatísticas de hoje
  const buscarHoje = useCallback(async (): Promise<{ hoje: EstatisticasHoje; revisoes_pendentes: number; sessao_ativa: any } | null> => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/estatisticas?user_id=${user.id}&tipo=hoje`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar estatísticas semanais
  const buscarSemanal = useCallback(async (dias: number = 7): Promise<EstatisticasSemanal | null> => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/estatisticas?user_id=${user.id}&tipo=semanal&periodo=${dias}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar estatísticas do ciclo atual
  const buscarCiclo = useCallback(async (): Promise<EstatisticasCiclo | null> => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/estatisticas?user_id=${user.id}&tipo=ciclo`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar estatísticas por disciplina
  const buscarPorDisciplina = useCallback(async (dias: number = 7): Promise<{ disciplinas: EstatisticasDisciplina[] } | null> => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/estatisticas?user_id=${user.id}&tipo=disciplinas&periodo=${dias}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar estatísticas gerais
  const buscarGerais = useCallback(async (dias: number = 7): Promise<EstatisticasGerais | null> => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/estatisticas?user_id=${user.id}&periodo=${dias}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Formatar horas para exibição
  const formatarHoras = useCallback((segundos: number) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)

    if (horas > 0) {
      return `${horas}h ${minutos}m`
    }
    return `${minutos}m`
  }, [])

  // Formatar porcentagem
  const formatarPorcentagem = useCallback((valor: number | string) => {
    const num = typeof valor === 'string' ? parseFloat(valor) : valor
    return `${num.toFixed(1)}%`
  }, [])

  return {
    loading,
    error,
    buscarHoje,
    buscarSemanal,
    buscarCiclo,
    buscarPorDisciplina,
    buscarGerais,
    formatarHoras,
    formatarPorcentagem
  }
}
