'use client'

import { useState, useCallback, useEffect } from 'react'
import { type ChatModeType } from '@/stores/artifactsStore'
import { ChatMode as StoreChatMode } from '@/lib/stores/chatModeStore'
import { useConversaStore } from '@/lib/stores/conversaStore'

interface Conversa {
  id: string
  titulo: string
  modelo: string
  tokens_usados: number
  created_at: string
  updated_at: string
}

interface UsoIA {
  plano: string
  uso_mes: {
    chats: number
    resumos: number
    flashcards: number
    imagens: number
    web_searches: number
    pdfs: number
    imagens_analisadas: number
    tokens_input: number
    tokens_output: number
  }
  limites: {
    chats: number
    resumos: number
    flashcards: number
    imagens: number
    web_search: boolean
    vision: boolean
    pdf_support: boolean
    extended_thinking: boolean
  }
}

interface SugestaoInteligente {
  type: 'topic' | 'action' | 'review'
  text: string
  fullPrompt: string
  icon: string
  priority: number
}

interface SugestoesState {
  topics: SugestaoInteligente[]
  actions: SugestaoInteligente[]
  reviews: SugestaoInteligente[]
}

interface UseIADataOptions {
  userId: string | undefined
  chatMode: ChatModeType
  setConversations: (mode: StoreChatMode, conversas: Conversa[]) => void
}

export function useIAData({ userId, chatMode, setConversations }: UseIADataOptions) {
  const [uso, setUso] = useState<UsoIA | null>(null)
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [sugestoesInteligentes, setSugestoesInteligentes] = useState<SugestoesState>({
    topics: [],
    actions: [],
    reviews: []
  })

  const fetchUso = useCallback(async () => {
    if (!userId) return
    try {
      const response = await fetch(`/api/medicina/ia/uso?user_id=${userId}`)
      const data = await response.json()
      setUso(data)
    } catch (error) {
      console.error('Erro ao buscar uso:', error)
    }
  }, [userId])

  const fetchSugestoes = useCallback(async () => {
    if (!userId) return
    try {
      const response = await fetch(`/api/medicina/ia/sugestoes?user_id=${userId}`)
      const data = await response.json()
      if (data.success && data.sugestoes) {
        setSugestoesInteligentes(data.sugestoes)
      }
    } catch (error) {
      console.error('Erro ao buscar sugestoes:', error)
    }
  }, [userId])

  const fetchConversas = useCallback(async () => {
    if (!userId) return
    try {
      const response = await fetch(`/api/medicina/ia/chat?user_id=${userId}&modo=${chatMode}`)
      const data = await response.json()
      setConversas(data.conversas || [])
      setConversations(chatMode as StoreChatMode, data.conversas || [])
    } catch (error) {
      console.error('Erro ao buscar conversas:', error)
    }
  }, [userId, chatMode, setConversations])

  // Fetch inicial
  useEffect(() => {
    fetchUso()
    fetchConversas()
    fetchSugestoes()
  }, [fetchUso, fetchConversas, fetchSugestoes])

  return {
    uso,
    conversas,
    setConversas,
    sugestoesInteligentes,
    fetchUso,
    fetchConversas,
    fetchSugestoes
  }
}

export type { Conversa, UsoIA, SugestaoInteligente, SugestoesState }
