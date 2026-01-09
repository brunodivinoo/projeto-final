'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Tipos
export interface Revisao {
  id: string
  user_id: string
  sessao_origem_id?: string
  disciplina_id: string
  assunto_id?: string
  subassunto_id?: string
  titulo?: string
  descricao?: string
  metodo_original?: string
  data_estudo: string
  proxima_revisao: string
  intervalo: number
  fator_facilidade: number
  repeticoes: number
  prioridade: number
  status: 'pendente' | 'atrasada' | 'concluida' | 'arquivada'
  created_at: string
  updated_at: string
  disciplina?: { id: string; nome: string; icon?: string; cor?: string }
  assunto?: { id: string; nome: string }
  subassunto?: { id: string; nome: string }
  sessao_origem?: { id: string; metodo: string; duracao_segundos: number }
  revisao_historico?: RevisaoHistorico[]
}

export interface RevisaoHistorico {
  id: string
  revisao_id: string
  data_revisao: string
  qualidade: number
  tempo_segundos: number
  intervalo_anterior?: number
  novo_intervalo?: number
  fator_anterior?: number
  novo_fator?: number
  anotacoes?: string
  created_at: string
}

export interface CriarRevisaoDTO {
  disciplina_id: string
  assunto_id?: string
  subassunto_id?: string
  titulo?: string
  descricao?: string
  metodo_original?: string
  prioridade?: number
  proxima_revisao?: string
}

export function useRevisoes() {
  const { user } = useAuth()
  const [revisoes, setRevisoes] = useState<Revisao[]>([])
  const [revisoesHoje, setRevisoesHoje] = useState<Revisao[]>([])
  const [revisaoAtual, setRevisaoAtual] = useState<Revisao | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar todas as revisões
  const buscarRevisoes = useCallback(async (filtros?: { status?: string; disciplina_id?: string; limite?: number }) => {
    if (!user) return []

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('user_id', user.id)
      if (filtros?.status) params.set('status', filtros.status)
      if (filtros?.disciplina_id) params.set('disciplina_id', filtros.disciplina_id)
      if (filtros?.limite) params.set('limite', String(filtros.limite))

      const response = await fetch(`/api/estudos/revisoes?${params}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setRevisoes(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar revisões para hoje
  const buscarRevisoesHoje = useCallback(async () => {
    if (!user) return []

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/revisoes?user_id=${user.id}&hoje=true`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setRevisoesHoje(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar revisões pendentes
  const buscarPendentes = useCallback(async () => {
    if (!user) return []

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/revisoes?user_id=${user.id}&pendentes=true`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar revisões atrasadas
  const buscarAtrasadas = useCallback(async () => {
    if (!user) return []

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/revisoes?user_id=${user.id}&atrasadas=true`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar revisão específica
  const buscarRevisao = useCallback(async (id: string) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/revisoes?user_id=${user.id}&id=${id}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setRevisaoAtual(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Criar revisão manual
  const criarRevisao = useCallback(async (dados: CriarRevisaoDTO) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/revisoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dados, user_id: user.id })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setRevisoes(prev => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Registrar revisão feita (SM-2)
  const registrarRevisao = useCallback(async (id: string, qualidade: number, tempo_segundos?: number, anotacoes?: string) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/revisoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          user_id: user.id,
          qualidade,
          tempo_segundos,
          anotacoes
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      // Atualizar listas
      setRevisoes(prev => prev.map(r => r.id === id ? data : r))
      setRevisoesHoje(prev => prev.filter(r => r.id !== id))

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Arquivar revisão
  const arquivarRevisao = useCallback(async (id: string) => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/revisoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, user_id: user.id, arquivar: true })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      setRevisoes(prev => prev.filter(r => r.id !== id))
      setRevisoesHoje(prev => prev.filter(r => r.id !== id))

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Excluir revisão
  const excluirRevisao = useCallback(async (id: string) => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/estudos/revisoes?user_id=${user.id}&id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      setRevisoes(prev => prev.filter(r => r.id !== id))
      setRevisoesHoje(prev => prev.filter(r => r.id !== id))

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Obter texto de qualidade SM-2
  const getQualidadeTexto = useCallback((qualidade: number) => {
    const textos: Record<number, { texto: string; cor: string; descricao: string }> = {
      0: { texto: 'Esqueci', cor: 'red', descricao: 'Não lembrei de nada' },
      1: { texto: 'Errado', cor: 'red', descricao: 'Resposta incorreta, lembrei vagamente' },
      2: { texto: 'Difícil', cor: 'orange', descricao: 'Resposta incorreta, mas lembrei ao ver' },
      3: { texto: 'Ok', cor: 'yellow', descricao: 'Correto com dificuldade' },
      4: { texto: 'Bom', cor: 'green', descricao: 'Correto após hesitação' },
      5: { texto: 'Fácil', cor: 'emerald', descricao: 'Resposta perfeita e rápida' }
    }
    return textos[qualidade] || textos[3]
  }, [])

  // Calcular próxima data de revisão (estimativa)
  const calcularProximaRevisao = useCallback((repeticoes: number, fator: number = 2.5) => {
    if (repeticoes === 0) return 1
    if (repeticoes === 1) return 1
    if (repeticoes === 2) return 6

    let intervalo = 1
    for (let i = 2; i < repeticoes; i++) {
      intervalo = Math.round(intervalo * fator)
    }
    return intervalo
  }, [])

  // Estatísticas de revisões
  const getEstatisticas = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0]

    const pendentes = revisoes.filter(r => r.status === 'pendente')
    const atrasadas = revisoes.filter(r => r.status === 'atrasada')
    const paraHoje = revisoes.filter(r =>
      ['pendente', 'atrasada'].includes(r.status) &&
      r.proxima_revisao <= hoje
    )

    return {
      total: revisoes.length,
      pendentes: pendentes.length,
      atrasadas: atrasadas.length,
      paraHoje: paraHoje.length,
      concluidas: revisoes.filter(r => r.status === 'concluida').length
    }
  }, [revisoes])

  return {
    revisoes,
    revisoesHoje,
    revisaoAtual,
    loading,
    error,
    buscarRevisoes,
    buscarRevisoesHoje,
    buscarPendentes,
    buscarAtrasadas,
    buscarRevisao,
    criarRevisao,
    registrarRevisao,
    arquivarRevisao,
    excluirRevisao,
    getQualidadeTexto,
    calcularProximaRevisao,
    getEstatisticas
  }
}
