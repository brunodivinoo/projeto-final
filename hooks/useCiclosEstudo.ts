'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Tipos
export interface CicloEstudo {
  id: string
  user_id: string
  plano_id?: string
  nome: string
  descricao?: string
  numero: number
  duracao_dias: number
  data_inicio: string
  data_fim?: string
  status: 'planejado' | 'em_progresso' | 'pausado' | 'concluido'
  horas_planejadas: number
  horas_estudadas: number
  created_at: string
  updated_at: string
  plano?: { id: string; nome: string }
  ciclo_itens?: CicloItem[]
}

export interface CicloItem {
  id: string
  ciclo_id: string
  disciplina_id: string
  assunto_id?: string
  subassunto_id?: string
  nome_display?: string
  cor: string
  icone: string
  horas_meta: number
  horas_estudadas: number
  progresso: number
  prioridade: number
  ordem: number
  disciplina?: { id: string; nome: string; icon?: string; cor?: string }
  assunto?: { id: string; nome: string }
  subassunto?: { id: string; nome: string }
}

export interface CriarCicloDTO {
  nome: string
  descricao?: string
  plano_id?: string
  duracao_dias?: number
  data_inicio?: string
  horas_planejadas?: number
  itens?: {
    disciplina_id: string
    assunto_id?: string
    subassunto_id?: string
    nome_display?: string
    cor?: string
    icone?: string
    horas_meta?: number
    prioridade?: number
  }[]
}

export function useCiclosEstudo() {
  const { user } = useAuth()
  const [ciclos, setCiclos] = useState<CicloEstudo[]>([])
  const [cicloAtual, setCicloAtual] = useState<CicloEstudo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar todos os ciclos
  const buscarCiclos = useCallback(async (status?: string) => {
    if (!user) return []

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('user_id', user.id)
      if (status) params.set('status', status)

      const response = await fetch(`/api/estudos/ciclos?${params}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setCiclos(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar ciclo específico
  const buscarCiclo = useCallback(async (id: string) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/ciclos?user_id=${user.id}&id=${id}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setCicloAtual(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar ciclo em progresso
  const buscarCicloEmProgresso = useCallback(async () => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/ciclos?user_id=${user.id}&atual=true`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setCicloAtual(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Criar novo ciclo
  const criarCiclo = useCallback(async (dados: CriarCicloDTO) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/ciclos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dados, user_id: user.id })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setCiclos(prev => [data, ...prev])
      setCicloAtual(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Atualizar ciclo
  const atualizarCiclo = useCallback(async (id: string, dados: Partial<CriarCicloDTO> & { status?: string }) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/ciclos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, user_id: user.id, ...dados })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setCiclos(prev => prev.map(c => c.id === id ? data : c))
      if (cicloAtual?.id === id) setCicloAtual(data)

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user, cicloAtual])

  // Excluir ciclo
  const excluirCiclo = useCallback(async (id: string) => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/ciclos?user_id=${user.id}&id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      setCiclos(prev => prev.filter(c => c.id !== id))
      if (cicloAtual?.id === id) setCicloAtual(null)

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, cicloAtual])

  // Pausar ciclo
  const pausarCiclo = useCallback(async (id: string) => {
    return atualizarCiclo(id, { status: 'pausado' })
  }, [atualizarCiclo])

  // Retomar ciclo
  const retomarCiclo = useCallback(async (id: string) => {
    return atualizarCiclo(id, { status: 'em_progresso' })
  }, [atualizarCiclo])

  // Concluir ciclo
  const concluirCiclo = useCallback(async (id: string) => {
    return atualizarCiclo(id, { status: 'concluido' })
  }, [atualizarCiclo])

  // Calcular progresso geral do ciclo
  const calcularProgressoCiclo = useCallback((ciclo: CicloEstudo) => {
    if (!ciclo.ciclo_itens?.length) return 0
    const totalMeta = ciclo.ciclo_itens.reduce((acc, item) => acc + item.horas_meta, 0)
    const totalEstudado = ciclo.ciclo_itens.reduce((acc, item) => acc + item.horas_estudadas, 0)
    return totalMeta > 0 ? Math.round((totalEstudado / totalMeta) * 100) : 0
  }, [])

  // Calcular dias restantes
  const calcularDiasRestantes = useCallback((ciclo: CicloEstudo) => {
    if (!ciclo.data_fim) return 0
    const hoje = new Date()
    const fim = new Date(ciclo.data_fim)
    return Math.max(0, Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)))
  }, [])

  return {
    ciclos,
    cicloAtual,
    loading,
    error,
    buscarCiclos,
    buscarCiclo,
    buscarCicloEmProgresso,
    criarCiclo,
    atualizarCiclo,
    excluirCiclo,
    pausarCiclo,
    retomarCiclo,
    concluirCiclo,
    calcularProgressoCiclo,
    calcularDiasRestantes
  }
}
