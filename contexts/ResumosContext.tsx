'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ResumoIA {
  id: string
  user_id: string
  titulo: string
  resumo: string
  disciplina: string | null
  assunto: string | null
  created_at: string
  compartilhado?: boolean
}

interface ResumosContextType {
  resumos: ResumoIA[]
  resumoSelecionado: ResumoIA | null
  painelAberto: boolean
  loading: boolean
  carregarResumos: () => Promise<void>
  abrirResumo: (resumo: ResumoIA) => void
  fecharPainel: () => void
  compartilharResumo: (resumoId: string) => Promise<string | null>
  salvarResumo: (resumoId: string, novoConteudo: string) => Promise<boolean>
  excluirResumo: (resumoId: string) => Promise<boolean>
}

const ResumosContext = createContext<ResumosContextType | undefined>(undefined)

export function ResumosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [resumos, setResumos] = useState<ResumoIA[]>([])
  const [resumoSelecionado, setResumoSelecionado] = useState<ResumoIA | null>(null)
  const [painelAberto, setPainelAberto] = useState(false)
  const [loading, setLoading] = useState(false)

  const carregarResumos = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/ia/resumos?user_id=${user.id}`)
      const data = await res.json()
      if (!data.error) {
        setResumos(data.resumos || [])
      }
    } catch (err) {
      console.error('Erro ao carregar resumos:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const abrirResumo = (resumo: ResumoIA) => {
    setResumoSelecionado(resumo)
    setPainelAberto(true)
  }

  const fecharPainel = () => {
    setPainelAberto(false)
  }

  const compartilharResumo = async (resumoId: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/ia/resumos/compartilhar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumo_id: resumoId })
      })

      if (!response.ok) throw new Error('Erro ao compartilhar')

      const data = await response.json()

      if (resumoSelecionado && resumoSelecionado.id === resumoId) {
        setResumoSelecionado({ ...resumoSelecionado, compartilhado: true })
      }

      return data.link
    } catch (error) {
      console.error('Erro ao compartilhar resumo:', error)
      return null
    }
  }

  const salvarResumo = async (resumoId: string, novoConteudo: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/ia/resumos/editar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumo_id: resumoId, resumo: novoConteudo })
      })

      if (!response.ok) throw new Error('Erro ao salvar')

      // Atualizar a lista local
      setResumos(prev => prev.map(r =>
        r.id === resumoId ? { ...r, resumo: novoConteudo } : r
      ))

      // Atualizar o resumo selecionado
      if (resumoSelecionado && resumoSelecionado.id === resumoId) {
        setResumoSelecionado({ ...resumoSelecionado, resumo: novoConteudo })
      }

      return true
    } catch (error) {
      console.error('Erro ao salvar resumo:', error)
      return false
    }
  }

  const excluirResumo = async (resumoId: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const response = await fetch(`/api/ia/resumos?resumo_id=${resumoId}&user_id=${user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao excluir')

      // Atualizar a lista local
      setResumos(prev => prev.filter(r => r.id !== resumoId))

      // Fechar painel se o resumo excluído estava aberto
      if (resumoSelecionado?.id === resumoId) {
        setPainelAberto(false)
        setResumoSelecionado(null)
      }

      return true
    } catch (error) {
      console.error('Erro ao excluir resumo:', error)
      return false
    }
  }

  return (
    <ResumosContext.Provider
      value={{
        resumos,
        resumoSelecionado,
        painelAberto,
        loading,
        carregarResumos,
        abrirResumo,
        fecharPainel,
        compartilharResumo,
        salvarResumo,
        excluirResumo
      }}
    >
      {children}
    </ResumosContext.Provider>
  )
}

export function useResumos() {
  const context = useContext(ResumosContext)
  if (context === undefined) {
    throw new Error('useResumos deve ser usado dentro de um ResumosProvider')
  }
  return context
}
