'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface ResumoIA {
  id: string
  user_id: string
  pdf_id: string | null
  titulo: string
  conteudo_original: string | null
  resumo: string
  disciplina: string | null
  assunto: string | null
  subassunto: string | null
  compartilhado: boolean
  likes: number
  usos: number
  created_at: string
}

export interface ConfigResumo {
  texto: string
  titulo?: string
  disciplina?: string
  assunto?: string
  formato?: 'topicos' | 'mapa_mental' | 'fichamento' | 'esquema'
}

interface ResumosData {
  resumos: ResumoIA[]
  resumoAtual: ResumoIA | null
  loading: boolean
  gerando: boolean
  error: string | null
}

interface ResumosActions {
  carregarResumos: () => Promise<void>
  gerarResumo: (config: ConfigResumo) => Promise<ResumoIA | null>
  selecionarResumo: (resumoId: string) => Promise<void>
  deletarResumo: (resumoId: string) => Promise<boolean>
}

export function useResumosIA(): ResumosData & ResumosActions {
  const { user } = useAuth()
  const [resumos, setResumos] = useState<ResumoIA[]>([])
  const [resumoAtual, setResumoAtual] = useState<ResumoIA | null>(null)
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar resumos
  const carregarResumos = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/ia/resumos?user_id=${user.id}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)
      setResumos(data.resumos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar resumos')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Carregar ao montar
  useEffect(() => {
    carregarResumos()
  }, [carregarResumos])

  // Gerar resumo
  const gerarResumo = async (config: ConfigResumo): Promise<ResumoIA | null> => {
    if (!user?.id) return null

    setGerando(true)
    setError(null)

    try {
      const res = await fetch('/api/ia/resumos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...config
        })
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao gerar resumo')
      }

      // Adicionar ao início da lista
      setResumos(prev => [data.resumo, ...prev])
      setResumoAtual(data.resumo)

      return data.resumo
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar resumo')
      return null
    } finally {
      setGerando(false)
    }
  }

  // Selecionar resumo
  const selecionarResumo = async (resumoId: string) => {
    if (!user?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/ia/resumos?user_id=${user.id}&resumo_id=${resumoId}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)
      setResumoAtual(data.resumo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar resumo')
    } finally {
      setLoading(false)
    }
  }

  // Deletar resumo
  const deletarResumo = async (resumoId: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const res = await fetch(`/api/ia/resumos?resumo_id=${resumoId}&user_id=${user.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Erro ao deletar')

      setResumos(prev => prev.filter(r => r.id !== resumoId))

      if (resumoAtual?.id === resumoId) {
        setResumoAtual(null)
      }

      return true
    } catch {
      return false
    }
  }

  return {
    resumos,
    resumoAtual,
    loading,
    gerando,
    error,
    carregarResumos,
    gerarResumo,
    selecionarResumo,
    deletarResumo
  }
}
