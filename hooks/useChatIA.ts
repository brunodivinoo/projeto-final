'use client'
import { useState, useEffect, useCallback } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { ChatMode } from '@/lib/stores/chatModeStore'
import { useArtifactsStore } from '@/stores/artifactsStore'

export interface Conversa {
  id: string
  user_id: string
  titulo: string
  modo: ChatMode
  modelo: string
  tokens_usados: number
  created_at: string
  updated_at: string
}

export interface Mensagem {
  id: string
  conversa_id: string
  role: 'user' | 'assistant'
  content: string
  tokens: number
  has_image: boolean
  has_pdf: boolean
  created_at: string
}

interface UseChatIAOptions {
  modo?: ChatMode
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
  enviarMensagem: (mensagem: string, opcoes?: {
    imagem_base64?: string
    imagem_tipo?: string
    pdf_base64?: string
  }) => Promise<void>
  novaConversa: () => void
  deletarConversa: (conversaId: string) => Promise<boolean>
  limparErro: () => void
}

// URL base da API de medicina
const API_BASE = '/api/medicina/ia/chat'

export function useChatIA(options: UseChatIAOptions = {}): ChatData & ChatActions {
  const { user } = useMedAuth()
  const { modo = 'chat' } = options

  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaAtual, setConversaAtual] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar conversas do modo atual
  const carregarConversas = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}?user_id=${user.id}&modo=${modo}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar conversas')
      }

      setConversas(data.conversas || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar conversas'
      setError(message)
      console.error('Erro ao carregar conversas:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, modo])

  // Carregar conversas quando montar ou modo mudar
  useEffect(() => {
    carregarConversas()
  }, [carregarConversas])

  // Selecionar conversa e carregar mensagens
  const selecionarConversa = useCallback(async (conversaId: string) => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}?user_id=${user.id}&conversa_id=${conversaId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar mensagens')
      }

      const conversa = conversas.find(c => c.id === conversaId) ?? data.conversa ?? null
      setConversaAtual(conversa)
      setMensagens(data.mensagens || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar mensagens'
      setError(message)
      console.error('Erro ao carregar mensagens:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, conversas])

  // Enviar mensagem com streaming
  const enviarMensagem = useCallback(async (
    mensagem: string,
    opcoes?: {
      imagem_base64?: string
      imagem_tipo?: string
      pdf_base64?: string
    }
  ) => {
    if (!user?.id || !mensagem.trim()) return

    setEnviando(true)
    setError(null)

    // Adicionar mensagem do usuario otimisticamente
    const msgUsuario: Mensagem = {
      id: `temp-user-${Date.now()}`,
      conversa_id: conversaAtual?.id ?? '',
      role: 'user',
      content: mensagem,
      tokens: 0,
      has_image: !!opcoes?.imagem_base64,
      has_pdf: !!opcoes?.pdf_base64,
      created_at: new Date().toISOString()
    }
    setMensagens(prev => [...prev, msgUsuario])

    // Adicionar placeholder da resposta
    const msgIATemp: Mensagem = {
      id: `temp-assistant-${Date.now()}`,
      conversa_id: conversaAtual?.id ?? '',
      role: 'assistant',
      content: '',
      tokens: 0,
      has_image: false,
      has_pdf: false,
      created_at: new Date().toISOString()
    }
    setMensagens(prev => [...prev, msgIATemp])

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          conversa_id: conversaAtual?.id,
          mensagem,
          modo,
          ...opcoes
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }

      // Processar streaming
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      let novaConversaId = conversaAtual?.id

      if (reader) {
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6))

                if (data.type === 'text') {
                  fullResponse += data.content
                  // Atualizar mensagem da IA em tempo real
                  setMensagens(prev => prev.map(m =>
                    m.id === msgIATemp.id
                      ? { ...m, content: fullResponse }
                      : m
                  ))
                } else if (data.type === 'tool_result') {
                  // Processar resultados de tools (ex: imagens geradas)
                  if (data.tool_name === 'gerar_imagem_medica' && data.result?.imagem_url) {
                    // Adicionar imagem aos artefatos
                    const { addImageArtifact } = useArtifactsStore.getState()
                    addImageArtifact(
                      {
                        url: data.result.imagem_url,
                        source: 'generated',
                        prompt: data.result.descricao || '',
                        structure: data.result.estrutura || '',
                        imageType: data.result.tipo || 'anatomy'
                      },
                      `Imagem: ${data.result.estrutura || 'Ilustração Médica'}`,
                      novaConversaId,
                      msgIATemp.id
                    )
                  }
                } else if (data.type === 'done') {
                  novaConversaId = data.conversa_id
                  // Atualizar tokens
                  setMensagens(prev => prev.map(m =>
                    m.id === msgIATemp.id
                      ? { ...m, tokens: (data.tokens?.input ?? 0) + (data.tokens?.output ?? 0) }
                      : m
                  ))
                } else if (data.type === 'error') {
                  throw new Error(data.error)
                }
              } catch (parseError) {
                // Ignorar erros de parsing de chunks incompletos
                if (!(parseError instanceof SyntaxError)) {
                  console.error('Erro no processamento:', parseError)
                }
              }
            }
          }
        }
      }

      // Atualizar IDs e conversa
      if (novaConversaId && !conversaAtual) {
        const novaConversa: Conversa = {
          id: novaConversaId,
          user_id: user.id,
          titulo: mensagem.substring(0, 50) + (mensagem.length > 50 ? '...' : ''),
          modo,
          modelo: 'claude',
          tokens_usados: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setConversaAtual(novaConversa)
        setConversas(prev => [novaConversa, ...prev])
      }

      // Atualizar IDs das mensagens temporarias
      setMensagens(prev => prev.map(m => {
        if (m.id === msgUsuario.id) {
          return { ...m, id: `user-${Date.now()}`, conversa_id: novaConversaId ?? '' }
        }
        if (m.id === msgIATemp.id) {
          return { ...m, id: `assistant-${Date.now()}`, conversa_id: novaConversaId ?? '' }
        }
        return m
      }))

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem'
      setError(message)

      // Remover mensagens temporarias em caso de erro
      setMensagens(prev => prev.filter(m =>
        m.id !== msgUsuario.id && m.id !== msgIATemp.id
      ))

      console.error('Erro ao enviar mensagem:', err)
    } finally {
      setEnviando(false)
    }
  }, [user?.id, conversaAtual, modo])

  // Nova conversa
  const novaConversa = useCallback(() => {
    setConversaAtual(null)
    setMensagens([])
    setError(null)
  }, [])

  // Deletar conversa
  const deletarConversa = useCallback(async (conversaId: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const res = await fetch(
        `${API_BASE}?conversa_id=${conversaId}&user_id=${user.id}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        throw new Error('Erro ao deletar conversa')
      }

      setConversas(prev => prev.filter(c => c.id !== conversaId))

      if (conversaAtual?.id === conversaId) {
        setConversaAtual(null)
        setMensagens([])
      }

      return true
    } catch (err) {
      console.error('Erro ao deletar conversa:', err)
      return false
    }
  }, [user?.id, conversaAtual])

  // Limpar erro
  const limparErro = useCallback(() => {
    setError(null)
  }, [])

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
    deletarConversa,
    limparErro
  }
}
