'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface PdfAnalisado {
  id: string
  user_id: string
  nome_arquivo: string
  tamanho_bytes: number
  texto_extraido: string
  disciplina_detectada: string | null
  assuntos_detectados: string[]
  resumo_gerado: boolean
  flashcards_gerados: number
  questoes_geradas: number
  status: string
  created_at: string
}

export interface OpcoesPdf {
  resumo: boolean
  flashcards: boolean
  questoes: boolean
}

export interface ResultadosPdf {
  resumo?: string
  flashcards?: Array<{ frente: string; verso: string }>
  questoes?: Array<{
    enunciado: string
    alternativa_a?: string
    alternativa_b?: string
    alternativa_c?: string
    alternativa_d?: string
    alternativa_e?: string
    gabarito: string
    comentario?: string
  }>
}

interface PdfData {
  pdfs: PdfAnalisado[]
  pdfAtual: PdfAnalisado | null
  loading: boolean
  enviando: boolean
  progresso: number
  error: string | null
}

interface PdfActions {
  carregarPdfs: () => Promise<void>
  analisarPdf: (file: File, opcoes: OpcoesPdf) => Promise<{ pdf: PdfAnalisado; resultados: ResultadosPdf } | null>
  selecionarPdf: (pdfId: string) => Promise<void>
  deletarPdf: (pdfId: string) => Promise<boolean>
}

export function usePdfIA(): PdfData & PdfActions {
  const { user } = useAuth()
  const [pdfs, setPdfs] = useState<PdfAnalisado[]>([])
  const [pdfAtual, setPdfAtual] = useState<PdfAnalisado | null>(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Carregar PDFs
  const carregarPdfs = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/ia/pdf?user_id=${user.id}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)
      setPdfs(data.pdfs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar PDFs')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Carregar ao montar
  useEffect(() => {
    carregarPdfs()
  }, [carregarPdfs])

  // Analisar PDF
  const analisarPdf = async (file: File, opcoes: OpcoesPdf): Promise<{ pdf: PdfAnalisado; resultados: ResultadosPdf } | null> => {
    if (!user?.id) return null

    setEnviando(true)
    setError(null)
    setProgresso(10)

    try {
      const formData = new FormData()
      formData.append('user_id', user.id)
      formData.append('file', file)
      formData.append('opcoes', JSON.stringify(opcoes))

      setProgresso(30)

      const res = await fetch('/api/ia/pdf', {
        method: 'POST',
        body: formData
      })

      setProgresso(80)

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao analisar PDF')
      }

      setProgresso(100)

      // Adicionar ao início da lista
      setPdfs(prev => [data.pdf, ...prev])
      setPdfAtual(data.pdf)

      return { pdf: data.pdf, resultados: data.resultados }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar PDF')
      return null
    } finally {
      setEnviando(false)
      setTimeout(() => setProgresso(0), 500)
    }
  }

  // Selecionar PDF
  const selecionarPdf = async (pdfId: string) => {
    if (!user?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/ia/pdf?user_id=${user.id}&pdf_id=${pdfId}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)
      setPdfAtual(data.pdf)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar PDF')
    } finally {
      setLoading(false)
    }
  }

  // Deletar PDF
  const deletarPdf = async (pdfId: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const res = await fetch(`/api/ia/pdf?pdf_id=${pdfId}&user_id=${user.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Erro ao deletar')

      setPdfs(prev => prev.filter(p => p.id !== pdfId))

      if (pdfAtual?.id === pdfId) {
        setPdfAtual(null)
      }

      return true
    } catch {
      return false
    }
  }

  return {
    pdfs,
    pdfAtual,
    loading,
    enviando,
    progresso,
    error,
    carregarPdfs,
    analisarPdf,
    selecionarPdf,
    deletarPdf
  }
}
