'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface QuestaoIA {
  id: string
  user_id: string
  disciplina: string
  assunto: string | null
  subassunto: string | null
  banca: string
  dificuldade: string
  modalidade: string
  enunciado: string
  alternativa_a: string | null
  alternativa_b: string | null
  alternativa_c: string | null
  alternativa_d: string | null
  alternativa_e: string | null
  gabarito: string
  comentario: string | null
  respondida: boolean
  resposta_usuario: string | null
  acertou: boolean | null
  tempo_resposta: number | null
  compartilhada: boolean
  likes: number
  usos: number
  created_at: string
}

export interface ConfigGeracaoQuestoes {
  disciplinas: Array<{ nome: string; peso: number }>
  assuntos: Array<{ nome: string; disciplina: string; peso: number }>
  subassuntos: Array<{ nome: string; assunto: string; disciplina: string; peso: number }>
  bancas: string[]
  dificuldades: string[]
  modalidade: 'multipla_escolha' | 'certo_errado' | 'mista'
  quantidade: number
}

export interface FiltrosQuestoes {
  disciplina?: string
  assunto?: string
  subassunto?: string
  banca?: string
  dificuldade?: string
  modalidade?: string
  respondida?: boolean | null
  acertou?: boolean | null
}

export interface QuestoesIAData {
  questoes: QuestaoIA[]
  totalQuestoes: number
  loading: boolean
  gerando: boolean
  error: string | null
  filtrosDisponiveis: {
    disciplinas: string[]
    assuntos: string[]
    subassuntos: string[]
    bancas: string[]
    dificuldades: string[]
    modalidades: string[]
  }
  gerarQuestoes: (config: ConfigGeracaoQuestoes) => Promise<QuestaoIA[] | null>
  responderQuestao: (questaoId: string, resposta: string, tempoResposta?: number) => Promise<{ acertou: boolean; gabarito: string } | null>
  deletarQuestao: (questaoId: string) => Promise<boolean>
  buscarQuestoes: (filtros?: FiltrosQuestoes) => Promise<void>
  refresh: () => Promise<void>
}

export function useQuestoesIA(): QuestoesIAData {
  const { user, loading: authLoading } = useAuth()
  const [questoes, setQuestoes] = useState<QuestaoIA[]>([])
  const [totalQuestoes, setTotalQuestoes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtrosDisponiveis, setFiltrosDisponiveis] = useState({
    disciplinas: [] as string[],
    assuntos: [] as string[],
    subassuntos: [] as string[],
    bancas: [] as string[],
    dificuldades: ['facil', 'media', 'dificil'],
    modalidades: ['multipla_escolha', 'certo_errado']
  })

  // Buscar filtros disponíveis
  const buscarFiltros = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/ia/questoes/filtros?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setFiltrosDisponiveis(data)
      }
    } catch (err) {
      console.error('Erro ao buscar filtros:', err)
    }
  }, [user])

  // Buscar questões
  const buscarQuestoes = useCallback(async (filtros?: FiltrosQuestoes) => {
    if (authLoading) return
    if (!user) {
      setQuestoes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ user_id: user.id })

      if (filtros?.disciplina) params.append('disciplina', filtros.disciplina)
      if (filtros?.assunto) params.append('assunto', filtros.assunto)
      if (filtros?.subassunto) params.append('subassunto', filtros.subassunto)
      if (filtros?.banca) params.append('banca', filtros.banca)
      if (filtros?.dificuldade) params.append('dificuldade', filtros.dificuldade)
      if (filtros?.modalidade) params.append('modalidade', filtros.modalidade)
      if (filtros?.respondida !== null && filtros?.respondida !== undefined) {
        params.append('respondida', String(filtros.respondida))
      }
      if (filtros?.acertou !== null && filtros?.acertou !== undefined) {
        params.append('acertou', String(filtros.acertou))
      }

      const response = await fetch(`/api/ia/questoes?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar questões')

      const data = await response.json()
      setQuestoes(data.questoes || [])
      setTotalQuestoes(data.total || 0)

    } catch (err) {
      console.error('Erro ao buscar questões:', err)
      setError('Erro ao carregar questões')
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  // Gerar questões
  const gerarQuestoes = useCallback(async (config: ConfigGeracaoQuestoes): Promise<QuestaoIA[] | null> => {
    if (!user) return null

    try {
      setGerando(true)
      setError(null)

      const response = await fetch('/api/ia/questoes/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, config })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao gerar questões')
        return null
      }

      // Adicionar novas questões ao estado
      setQuestoes(prev => [...data.questoes, ...prev])
      setTotalQuestoes(prev => prev + data.quantidade)

      // Atualizar filtros disponíveis
      await buscarFiltros()

      return data.questoes

    } catch (err) {
      console.error('Erro ao gerar questões:', err)
      setError('Erro ao gerar questões')
      return null
    } finally {
      setGerando(false)
    }
  }, [user, buscarFiltros])

  // Responder questão
  const responderQuestao = useCallback(async (
    questaoId: string,
    resposta: string,
    tempoResposta?: number
  ): Promise<{ acertou: boolean; gabarito: string } | null> => {
    if (!user) return null

    try {
      const response = await fetch('/api/ia/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questao_id: questaoId,
          user_id: user.id,
          resposta,
          tempo_resposta: tempoResposta
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao registrar resposta')
        return null
      }

      // Atualizar questão no estado
      setQuestoes(prev => prev.map(q =>
        q.id === questaoId
          ? { ...q, respondida: true, resposta_usuario: resposta.toUpperCase(), acertou: data.acertou }
          : q
      ))

      return { acertou: data.acertou, gabarito: data.gabarito }

    } catch (err) {
      console.error('Erro ao responder questão:', err)
      setError('Erro ao registrar resposta')
      return null
    }
  }, [user])

  // Deletar questão
  const deletarQuestao = useCallback(async (questaoId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/ia/questoes?questao_id=${questaoId}&user_id=${user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        setError('Erro ao deletar questão')
        return false
      }

      setQuestoes(prev => prev.filter(q => q.id !== questaoId))
      setTotalQuestoes(prev => prev - 1)
      return true

    } catch (err) {
      console.error('Erro ao deletar questão:', err)
      return false
    }
  }, [user])

  // Refresh
  const refresh = useCallback(async () => {
    await Promise.all([buscarQuestoes(), buscarFiltros()])
  }, [buscarQuestoes, buscarFiltros])

  // Carregar dados iniciais
  useEffect(() => {
    if (!authLoading) {
      buscarQuestoes()
      buscarFiltros()
    }
  }, [authLoading, buscarQuestoes, buscarFiltros])

  return {
    questoes,
    totalQuestoes,
    loading: loading || authLoading,
    gerando,
    error,
    filtrosDisponiveis,
    gerarQuestoes,
    responderQuestao,
    deletarQuestao,
    buscarQuestoes,
    refresh
  }
}
