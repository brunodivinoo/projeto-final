'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface Conversa {
  id: string
  user_id: string
  titulo: string
  contexto: string | null
  created_at: string
  updated_at: string
}

export interface Mensagem {
  id: string
  conversa_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ChatData {
  conversas: Conversa[]
  conversaAtual: Conversa | null
  mensagens: Mensagem[]
  loading: boolean
  enviando: boolean
  error: string | null
}

interface ChatActions {
  carregarConversas: () => Promise<void>
  selecionarConversa: (conversaId: string) => Promise<void>
  enviarMensagem: (mensagem: string) => Promise<Mensagem | null>
  novaConversa: () => void
  deletarConversa: (conversaId: string) => Promise<boolean>
}

export function useChatIA(): ChatData & ChatActions {
  const { user } = useAuth()
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaAtual, setConversaAtual] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar conversas
  const carregarConversas = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/ia/chat?user_id=${user.id}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)
      setConversas(data.conversas || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conversas')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Carregar ao montar
  useEffect(() => {
    carregarConversas()
  }, [carregarConversas])

  // Selecionar conversa e carregar mensagens
  const selecionarConversa = async (conversaId: string) => {
    if (!user?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/ia/chat?user_id=${user.id}&conversa_id=${conversaId}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      const conversa = conversas.find(c => c.id === conversaId)
      setConversaAtual(conversa || null)
      setMensagens(data.mensagens || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens')
    } finally {
      setLoading(false)
    }
  }

  // Enviar mensagem
  const enviarMensagem = async (mensagem: string): Promise<Mensagem | null> => {
    if (!user?.id || !mensagem.trim()) return null

    setEnviando(true)
    setError(null)

    // Adicionar mensagem do usuário otimisticamente
    const msgTemp: Mensagem = {
      id: `temp-${Date.now()}`,
      conversa_id: conversaAtual?.id || '',
      role: 'user',
      content: mensagem,
      created_at: new Date().toISOString()
    }
    setMensagens(prev => [...prev, msgTemp])

    try {
      const res = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          conversa_id: conversaAtual?.id,
          mensagem
        })
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        // Remover mensagem temporária em caso de erro
        setMensagens(prev => prev.filter(m => m.id !== msgTemp.id))
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      // Atualizar conversa atual se era nova
      if (!conversaAtual && data.conversa_id) {
        const novaConversaObj: Conversa = {
          id: data.conversa_id,
          user_id: user.id,
          titulo: mensagem.substring(0, 50),
          contexto: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setConversaAtual(novaConversaObj)
        setConversas(prev => [novaConversaObj, ...prev])
      }

      // Adicionar resposta da IA
      const msgIA: Mensagem = {
        id: data.mensagem_id,
        conversa_id: data.conversa_id,
        role: 'assistant',
        content: data.resposta,
        created_at: new Date().toISOString()
      }

      // Atualizar mensagem temp com ID real e adicionar resposta
      setMensagens(prev => {
        const updated = prev.map(m =>
          m.id === msgTemp.id ? { ...m, id: `user-${Date.now()}`, conversa_id: data.conversa_id } : m
        )
        return [...updated, msgIA]
      })

      return msgIA
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem')
      return null
    } finally {
      setEnviando(false)
    }
  }

  // Nova conversa
  const novaConversa = () => {
    setConversaAtual(null)
    setMensagens([])
    setError(null)
  }

  // Deletar conversa
  const deletarConversa = async (conversaId: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const res = await fetch(`/api/ia/chat?conversa_id=${conversaId}&user_id=${user.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Erro ao deletar')

      setConversas(prev => prev.filter(c => c.id !== conversaId))

      if (conversaAtual?.id === conversaId) {
        setConversaAtual(null)
        setMensagens([])
      }

      return true
    } catch {
      return false
    }
  }

  return {
    conversas,
    conversaAtual,
    mensagens,
    loading,
    enviando,
    error,
    carregarConversas,
    selecionarConversa,
    enviarMensagem,
    novaConversa,
    deletarConversa
  }
}
