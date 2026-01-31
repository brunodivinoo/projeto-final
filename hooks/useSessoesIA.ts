'use client'

import { useState, useCallback, useEffect } from 'react'
import { useChatModeStore, ChatMode, type EstatisticasModo, type SessaoModo } from '@/lib/stores/chatModeStore'

interface UseSessoesIAProps {
  userId: string | undefined
  conversaId: string | null
}

interface QuestaoResposta {
  sessao_id?: string
  questao_id?: string
  questao_json?: Record<string, unknown>
  resposta_usuario: string
  resposta_correta: string
  acertou: boolean
  tempo_resposta_segundos: number
  tema: string
  dificuldade: string
}

export function useSessoesIA({ userId, conversaId }: UseSessoesIAProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    sessaoAtiva,
    setSessaoAtiva,
    sessoesConversa,
    setSessoesConversa,
    estatisticas,
    setEstatisticas,
    setIsLoadingSessoes
  } = useChatModeStore()

  // Buscar estatísticas do usuário
  const fetchEstatisticas = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/medicina/ia/sessoes?user_id=${userId}&tipo=estatisticas`)
      const data = await response.json()

      if (data.success && data.estatisticas) {
        setEstatisticas(data.estatisticas)
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
      setError('Erro ao buscar estatísticas')
    } finally {
      setLoading(false)
    }
  }, [userId, setEstatisticas])

  // Buscar sessões da conversa atual
  const fetchSessoesConversa = useCallback(async () => {
    if (!userId || !conversaId) return

    setIsLoadingSessoes(true)
    try {
      const response = await fetch(`/api/medicina/ia/sessoes?user_id=${userId}&conversa_id=${conversaId}`)
      const data = await response.json()

      if (data.success && data.sessoes) {
        setSessoesConversa(data.sessoes)
      }
    } catch (err) {
      console.error('Erro ao buscar sessões:', err)
    } finally {
      setIsLoadingSessoes(false)
    }
  }, [userId, conversaId, setSessoesConversa, setIsLoadingSessoes])

  // Buscar sessão ativa da conversa
  const fetchSessaoAtiva = useCallback(async () => {
    if (!userId || !conversaId) return null

    try {
      const response = await fetch(`/api/medicina/ia/sessoes?user_id=${userId}&conversa_id=${conversaId}&tipo=ativa`)
      const data = await response.json()

      if (data.success) {
        setSessaoAtiva(data.sessao_ativa || null)
        return data.sessao_ativa
      }
      return null
    } catch (err) {
      console.error('Erro ao buscar sessão ativa:', err)
      return null
    }
  }, [userId, conversaId, setSessaoAtiva])

  // Criar nova sessão
  const criarSessao = useCallback(async (modo: ChatMode): Promise<SessaoModo | null> => {
    if (!userId || !conversaId) return null

    setLoading(true)
    try {
      const response = await fetch('/api/medicina/ia/sessoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          conversa_id: conversaId,
          modo
        })
      })

      const data = await response.json()

      if (data.success && data.sessao) {
        setSessaoAtiva(data.sessao)
        return data.sessao
      }
      return null
    } catch (err) {
      console.error('Erro ao criar sessão:', err)
      setError('Erro ao criar sessão')
      return null
    } finally {
      setLoading(false)
    }
  }, [userId, conversaId, setSessaoAtiva])

  // Finalizar sessão atual
  const finalizarSessao = useCallback(async (metricas?: Record<string, unknown>) => {
    if (!userId || !sessaoAtiva) return

    try {
      await fetch('/api/medicina/ia/sessoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessao_id: sessaoAtiva.id,
          user_id: userId,
          finalizar: true,
          metricas
        })
      })

      setSessaoAtiva(null)
      // Recarregar estatísticas
      fetchEstatisticas()
    } catch (err) {
      console.error('Erro ao finalizar sessão:', err)
    }
  }, [userId, sessaoAtiva, setSessaoAtiva, fetchEstatisticas])

  // Atualizar métricas da sessão
  const atualizarMetricas = useCallback(async (metricas: Record<string, unknown>) => {
    if (!userId || !sessaoAtiva) return

    try {
      const response = await fetch('/api/medicina/ia/sessoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessao_id: sessaoAtiva.id,
          user_id: userId,
          metricas
        })
      })

      const data = await response.json()
      if (data.success && data.sessao) {
        setSessaoAtiva(data.sessao)
      }
    } catch (err) {
      console.error('Erro ao atualizar métricas:', err)
    }
  }, [userId, sessaoAtiva, setSessaoAtiva])

  // Registrar resposta de questão
  const registrarQuestao = useCallback(async (questao: QuestaoResposta) => {
    if (!userId) return null

    try {
      const response = await fetch('/api/medicina/ia/questoes-sessao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...questao,
          user_id: userId,
          sessao_id: sessaoAtiva?.id
        })
      })

      const data = await response.json()
      return data.success ? data.questao : null
    } catch (err) {
      console.error('Erro ao registrar questão:', err)
      return null
    }
  }, [userId, sessaoAtiva])

  // Buscar questões erradas para revisão
  const buscarQuestoesErradas = useCallback(async () => {
    if (!userId) return []

    try {
      const response = await fetch(`/api/medicina/ia/questoes-sessao?user_id=${userId}&tipo=erros`)
      const data = await response.json()
      return data.success ? data.questoes : []
    } catch (err) {
      console.error('Erro ao buscar questões erradas:', err)
      return []
    }
  }, [userId])

  // Buscar estatísticas de questões por tema
  const buscarEstatisticasQuestoes = useCallback(async () => {
    if (!userId) return null

    try {
      const response = await fetch(`/api/medicina/ia/questoes-sessao?user_id=${userId}&tipo=estatisticas`)
      const data = await response.json()
      return data.success ? data.estatisticas : null
    } catch (err) {
      console.error('Erro ao buscar estatísticas de questões:', err)
      return null
    }
  }, [userId])

  // Carregar dados iniciais
  useEffect(() => {
    if (userId) {
      fetchEstatisticas()
    }
  }, [userId, fetchEstatisticas])

  // Carregar sessões quando conversa mudar
  useEffect(() => {
    if (conversaId) {
      fetchSessoesConversa()
      fetchSessaoAtiva()
    }
  }, [conversaId, fetchSessoesConversa, fetchSessaoAtiva])

  return {
    // Estado
    loading,
    error,
    sessaoAtiva,
    sessoesConversa,
    estatisticas,

    // Ações de sessão
    criarSessao,
    finalizarSessao,
    atualizarMetricas,
    fetchSessaoAtiva,

    // Ações de questões
    registrarQuestao,
    buscarQuestoesErradas,
    buscarEstatisticasQuestoes,

    // Refresh
    refreshEstatisticas: fetchEstatisticas,
    refreshSessoes: fetchSessoesConversa
  }
}
