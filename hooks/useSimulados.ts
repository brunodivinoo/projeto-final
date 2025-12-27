'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Tipos
export interface Simulado {
  id: string
  user_id: string
  titulo: string
  descricao?: string
  fonte: 'banco' | 'ia'
  modalidade: 'certo_errado' | 'multipla_escolha'
  quantidade_questoes: number
  tempo_limite_minutos?: number
  dificuldades?: string[]
  banca?: string
  cargo?: string
  instituicao?: string
  ano?: number
  status: 'pendente' | 'em_andamento' | 'finalizado'
  questoes_respondidas: number
  acertos?: number
  erros?: number
  pontuacao?: number
  tempo_gasto_segundos?: number
  created_at: string
  iniciado_em?: string
  finalizado_em?: string
  simulado_disciplinas?: { disciplina_nome: string }[]
  simulado_assuntos?: { assunto_nome: string }[]
  simulado_questoes?: SimuladoQuestao[]
}

export interface SimuladoQuestao {
  id: string
  questao_id: string
  ordem: number
  resposta_usuario?: string
  esta_correta?: boolean
  tempo_resposta_segundos?: number
  respondida_em?: string
  marcada_revisao?: boolean
  questao?: Questao
}

export interface Questao {
  id: string
  enunciado: string
  alternativas?: Record<string, string>
  resposta_correta: string
  disciplina?: string
  assunto?: string
  subassunto?: string
  dificuldade?: string
  modalidade: string
  explicacao?: string
}

export interface FiltrosSimulado {
  titulo: string
  descricao?: string
  fonte?: 'banco' | 'ia'
  modalidade: 'certo_errado' | 'multipla_escolha'
  quantidade_questoes: number
  tempo_limite_minutos?: number
  dificuldades?: string[]
  banca?: string
  cargo?: string
  instituicao?: string
  ano?: number
  disciplinas?: { id: string; nome: string }[]
  assuntos?: { id: string; nome: string }[]
  subassuntos?: { id: string; nome: string }[]
}

export interface FiltrosDisponiveis {
  disciplinas: { nome: string; questoes: number }[]
  assuntos: { nome: string; questoes: number }[]
  subassuntos: { nome: string; questoes: number }[]
  bancas: { nome: string; questoes: number }[]
  anos: { ano: number; questoes: number }[]
  dificuldades: { nome: string; label: string; questoes: number }[]
  modalidades: { nome: string; label: string; questoes: number }[]
  total_questoes_disponiveis: number
}

export interface Estatisticas {
  resumo: {
    total_simulados: number
    total_questoes: number
    total_acertos: number
    total_erros: number
    media_geral: number
    tempo_total_segundos: number
    tempo_total_formatado: string
  }
  uso_mensal: {
    simulados_realizados: number
    limite: number
    restantes: number
  }
  evolucao: { data: string; pontuacao: number }[]
  desempenho_por_disciplina: {
    nome: string
    total_questoes: number
    acertos: number
    erros: number
    percentual: number
  }[]
  pontos_fortes: { nome: string; percentual: number }[]
  pontos_fracos: { nome: string; percentual: number }[]
  sugestoes: Sugestao[]
  ultimos_simulados: {
    id: string
    titulo: string
    pontuacao: number
    data: string
  }[]
}

export interface Sugestao {
  id: string
  tipo: string
  titulo: string
  descricao: string
  config_sugerida?: Record<string, unknown>
  prioridade: number
}

export interface RespostaResultado {
  esta_correta: boolean
  resposta_usuario: string
  resposta_correta: string
  explicacao?: string
}

export function useSimulados() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Listar simulados do usuário
  const listarSimulados = useCallback(async (
    status?: string,
    pagina: number = 1,
    porPagina: number = 10
  ): Promise<{ simulados: Simulado[]; total: number }> => {
    if (!user) {
      return { simulados: [], total: 0 }
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        user_id: user.id,
        pagina: pagina.toString(),
        por_pagina: porPagina.toString()
      })

      if (status) {
        params.append('status', status)
      }

      const response = await fetch(`/api/simulados?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar simulados')
      }

      setLoading(false)
      return {
        simulados: data.simulados || [],
        total: data.paginacao?.total || 0
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar simulados'
      setError(message)
      setLoading(false)
      return { simulados: [], total: 0 }
    }
  }, [user])

  // Criar novo simulado
  const criarSimulado = useCallback(async (filtros: FiltrosSimulado): Promise<Simulado | null> => {
    if (!user) {
      setError('Usuário não autenticado')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/simulados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...filtros,
          user_id: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar simulado')
      }

      setLoading(false)
      return data.simulado
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar simulado'
      setError(message)
      setLoading(false)
      return null
    }
  }, [user])

  // Obter detalhes de um simulado
  const obterSimulado = useCallback(async (id: string): Promise<Simulado | null> => {
    if (!user) {
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ user_id: user.id })
      const response = await fetch(`/api/simulados/${id}?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar simulado')
      }

      setLoading(false)
      return data.simulado
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar simulado'
      setError(message)
      setLoading(false)
      return null
    }
  }, [user])

  // Iniciar simulado
  const iniciarSimulado = useCallback(async (id: string): Promise<Simulado | null> => {
    if (!user) {
      setError('Usuário não autenticado')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/simulados/${id}/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar simulado')
      }

      setLoading(false)
      return data.simulado
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar simulado'
      setError(message)
      setLoading(false)
      return null
    }
  }, [user])

  // Responder questão
  const responderQuestao = useCallback(async (
    simuladoId: string,
    questaoId: string,
    resposta: string,
    tempoSegundos?: number
  ): Promise<RespostaResultado | null> => {
    if (!user) {
      setError('Usuário não autenticado')
      return null
    }

    try {
      const response = await fetch(`/api/simulados/${simuladoId}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          questao_id: questaoId,
          resposta,
          tempo_resposta_segundos: tempoSegundos
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao responder questão')
      }

      return data.resultado
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao responder questão'
      setError(message)
      return null
    }
  }, [user])

  // Marcar questão para revisão
  const marcarRevisao = useCallback(async (
    simuladoId: string,
    questaoId: string,
    marcada: boolean
  ): Promise<boolean> => {
    if (!user) {
      return false
    }

    try {
      const response = await fetch(`/api/simulados/${simuladoId}/responder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          questao_id: questaoId,
          marcada_revisao: marcada
        })
      })

      return response.ok
    } catch {
      return false
    }
  }, [user])

  // Finalizar simulado
  const finalizarSimulado = useCallback(async (
    id: string,
    tempoTotalSegundos?: number
  ): Promise<{ simulado: Simulado; estatisticas: Record<string, unknown> } | null> => {
    if (!user) {
      setError('Usuário não autenticado')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/simulados/${id}/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          tempo_total_segundos: tempoTotalSegundos
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao finalizar simulado')
      }

      setLoading(false)
      return {
        simulado: data.simulado,
        estatisticas: data.estatisticas
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao finalizar simulado'
      setError(message)
      setLoading(false)
      return null
    }
  }, [user])

  // Excluir simulado
  const excluirSimulado = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/simulados/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir simulado')
      }

      setLoading(false)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir simulado'
      setError(message)
      setLoading(false)
      return false
    }
  }, [user])

  // Buscar filtros disponíveis
  const buscarFiltros = useCallback(async (
    modalidade?: string,
    disciplina?: string,
    assunto?: string
  ): Promise<FiltrosDisponiveis | null> => {
    try {
      const params = new URLSearchParams()
      if (modalidade) params.append('modalidade', modalidade)
      if (disciplina) params.append('disciplina', disciplina)
      if (assunto) params.append('assunto', assunto)

      const response = await fetch(`/api/simulados/filtros?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar filtros')
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar filtros'
      setError(message)
      return null
    }
  }, [])

  // Buscar estatísticas
  const buscarEstatisticas = useCallback(async (): Promise<Estatisticas | null> => {
    if (!user) {
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ user_id: user.id })
      const response = await fetch(`/api/simulados/estatisticas?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar estatísticas')
      }

      setLoading(false)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar estatísticas'
      setError(message)
      setLoading(false)
      return null
    }
  }, [user])

  return {
    loading,
    error,
    listarSimulados,
    criarSimulado,
    obterSimulado,
    iniciarSimulado,
    responderQuestao,
    marcarRevisao,
    finalizarSimulado,
    excluirSimulado,
    buscarFiltros,
    buscarEstatisticas
  }
}
