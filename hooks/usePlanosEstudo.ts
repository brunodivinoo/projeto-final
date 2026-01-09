'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Tipos
export interface PlanoEstudo {
  id: string
  user_id: string
  nome: string
  descricao?: string
  objetivo?: string
  data_inicio?: string
  data_fim?: string
  horas_semanais: number
  ativo: boolean
  ai_sugestoes: boolean
  created_at: string
  updated_at: string
  plano_itens?: PlanoItem[]
  plano_disponibilidade?: PlanoDisponibilidade[]
}

export interface PlanoItem {
  id: string
  plano_id: string
  disciplina_id: string
  assunto_id?: string
  subassunto_id?: string
  prioridade: number
  dificuldade: number
  horas_meta: number
  ordem: number
  disciplina?: { id: string; nome: string }
  assunto?: { id: string; nome: string }
  subassunto?: { id: string; nome: string }
}

export interface PlanoDisponibilidade {
  id: string
  plano_id: string
  dia_semana: number
  periodo: 'manha' | 'tarde' | 'noite'
  disponivel: boolean
  horas: number
}

export interface CriarPlanoDTO {
  nome: string
  descricao?: string
  objetivo?: string
  data_inicio?: string
  data_fim?: string
  horas_semanais?: number
  ai_sugestoes?: boolean
  itens?: {
    disciplina_id: string
    assunto_id?: string
    subassunto_id?: string
    prioridade?: number
    dificuldade?: number
    horas_meta?: number
  }[]
  disponibilidade?: {
    dia_semana: number
    periodo: 'manha' | 'tarde' | 'noite'
    disponivel?: boolean
    horas?: number
  }[]
}

export function usePlanosEstudo() {
  const { user } = useAuth()
  const [planos, setPlanos] = useState<PlanoEstudo[]>([])
  const [planoAtual, setPlanoAtual] = useState<PlanoEstudo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar todos os planos
  const buscarPlanos = useCallback(async (ativo?: boolean) => {
    if (!user) return []

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('user_id', user.id)
      if (ativo !== undefined) params.set('ativo', String(ativo))

      const response = await fetch(`/api/estudos/planos?${params}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setPlanos(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar plano específico
  const buscarPlano = useCallback(async (id: string) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/planos?user_id=${user.id}&id=${id}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setPlanoAtual(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Criar novo plano
  const criarPlano = useCallback(async (dados: CriarPlanoDTO) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/planos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dados, user_id: user.id })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setPlanos(prev => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Atualizar plano
  const atualizarPlano = useCallback(async (id: string, dados: Partial<CriarPlanoDTO> & { ativo?: boolean }) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/planos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, user_id: user.id, ...dados })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setPlanos(prev => prev.map(p => p.id === id ? data : p))
      if (planoAtual?.id === id) setPlanoAtual(data)

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user, planoAtual])

  // Excluir plano
  const excluirPlano = useCallback(async (id: string) => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/planos?user_id=${user.id}&id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      setPlanos(prev => prev.filter(p => p.id !== id))
      if (planoAtual?.id === id) setPlanoAtual(null)

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, planoAtual])

  // Ativar/desativar plano
  const toggleAtivo = useCallback(async (id: string, ativo: boolean) => {
    return atualizarPlano(id, { ativo })
  }, [atualizarPlano])

  return {
    planos,
    planoAtual,
    loading,
    error,
    buscarPlanos,
    buscarPlano,
    criarPlano,
    atualizarPlano,
    excluirPlano,
    toggleAtivo
  }
}
