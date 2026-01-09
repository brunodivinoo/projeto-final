'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Tipos
export interface SessaoEstudo {
  id: string
  user_id: string
  ciclo_id?: string
  ciclo_item_id?: string
  disciplina_id: string
  assunto_id?: string
  subassunto_id?: string
  metodo: 'questoes' | 'leitura' | 'video' | 'resumo' | 'flashcard' | 'aula' | 'revisao' | 'pdf' | 'outro'
  inicio: string
  fim?: string
  duracao_segundos: number
  pausas: number
  tempo_pausado_segundos: number
  questoes_feitas: number
  questoes_corretas: number
  porcentagem_acerto: number
  anotacoes?: string
  avaliacao?: number
  criar_revisao: boolean
  prioridade_revisao: number
  status: 'em_andamento' | 'pausada' | 'finalizada' | 'cancelada'
  created_at: string
  disciplina?: { id: string; nome: string; icon?: string; cor?: string }
  assunto?: { id: string; nome: string }
  subassunto?: { id: string; nome: string }
  ciclo?: { id: string; nome: string }
  ciclo_item?: { id: string; nome_display?: string }
}

export interface IniciarSessaoDTO {
  ciclo_id?: string
  ciclo_item_id?: string
  disciplina_id: string
  assunto_id?: string
  subassunto_id?: string
  metodo: string
  criar_revisao?: boolean
  prioridade_revisao?: number
}

export interface FinalizarSessaoDTO {
  duracao_segundos: number
  pausas?: number
  tempo_pausado_segundos?: number
  questoes_feitas?: number
  questoes_corretas?: number
  anotacoes?: string
  avaliacao?: number
  criar_revisao?: boolean
  prioridade_revisao?: number
}

export function useSessoesEstudo() {
  const { user } = useAuth()
  const [sessoes, setSessoes] = useState<SessaoEstudo[]>([])
  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoEstudo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Timer state
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [isPausado, setIsPausado] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inicioRef = useRef<Date | null>(null)
  const tempoPausadoRef = useRef(0)

  // Atualizar timer
  useEffect(() => {
    if (sessaoAtiva && !isPausado) {
      timerRef.current = setInterval(() => {
        if (inicioRef.current) {
          const agora = new Date()
          const segundos = Math.floor((agora.getTime() - inicioRef.current.getTime()) / 1000) - tempoPausadoRef.current
          setTempoDecorrido(segundos)
        }
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [sessaoAtiva, isPausado])

  // Buscar sessões
  const buscarSessoes = useCallback(async (filtros?: { ciclo_id?: string; status?: string; data?: string; limite?: number }) => {
    if (!user) return []

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filtros?.ciclo_id) params.set('ciclo_id', filtros.ciclo_id)
      if (filtros?.status) params.set('status', filtros.status)
      if (filtros?.data) params.set('data', filtros.data)
      if (filtros?.limite) params.set('limite', String(filtros.limite))

      const response = await fetch(`/api/estudos/sessoes?${params}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setSessoes(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar sessão ativa
  const buscarSessaoAtiva = useCallback(async () => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/sessoes?ativa=true')
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      if (data) {
        setSessaoAtiva(data)
        inicioRef.current = new Date(data.inicio)
        tempoPausadoRef.current = data.tempo_pausado_segundos || 0
        setIsPausado(data.status === 'pausada')

        // Calcular tempo decorrido
        const agora = new Date()
        const segundos = Math.floor((agora.getTime() - inicioRef.current.getTime()) / 1000) - tempoPausadoRef.current
        setTempoDecorrido(segundos)
      }

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Iniciar nova sessão
  const iniciarSessao = useCallback(async (dados: IniciarSessaoDTO) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/sessoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.sessao_id) {
          // Já existe sessão ativa
          await buscarSessaoAtiva()
        }
        throw new Error(data.error)
      }

      setSessaoAtiva(data)
      inicioRef.current = new Date()
      tempoPausadoRef.current = 0
      setTempoDecorrido(0)
      setIsPausado(false)

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user, buscarSessaoAtiva])

  // Pausar sessão
  const pausarSessao = useCallback(async () => {
    if (!sessaoAtiva) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/sessoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessaoAtiva.id,
          acao: 'pausar',
          duracao_segundos: tempoDecorrido
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setSessaoAtiva(data)
      setIsPausado(true)

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [sessaoAtiva, tempoDecorrido])

  // Retomar sessão
  const retomarSessao = useCallback(async () => {
    if (!sessaoAtiva) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/sessoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessaoAtiva.id,
          acao: 'retomar'
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setSessaoAtiva(data)
      setIsPausado(false)

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [sessaoAtiva])

  // Finalizar sessão
  const finalizarSessao = useCallback(async (dados: FinalizarSessaoDTO) => {
    if (!sessaoAtiva) return null

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/sessoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessaoAtiva.id,
          acao: 'finalizar',
          ...dados,
          duracao_segundos: dados.duracao_segundos || tempoDecorrido
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setSessaoAtiva(null)
      setTempoDecorrido(0)
      setIsPausado(false)
      inicioRef.current = null
      tempoPausadoRef.current = 0

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [sessaoAtiva, tempoDecorrido])

  // Cancelar sessão
  const cancelarSessao = useCallback(async () => {
    if (!sessaoAtiva) return false

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/estudos/sessoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessaoAtiva.id,
          acao: 'cancelar',
          duracao_segundos: tempoDecorrido
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      setSessaoAtiva(null)
      setTempoDecorrido(0)
      setIsPausado(false)
      inicioRef.current = null
      tempoPausadoRef.current = 0

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [sessaoAtiva, tempoDecorrido])

  // Formatar tempo
  const formatarTempo = useCallback((segundos: number) => {
    const h = Math.floor(segundos / 3600)
    const m = Math.floor((segundos % 3600) / 60)
    const s = segundos % 60

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  return {
    sessoes,
    sessaoAtiva,
    loading,
    error,
    tempoDecorrido,
    isPausado,
    buscarSessoes,
    buscarSessaoAtiva,
    iniciarSessao,
    pausarSessao,
    retomarSessao,
    finalizarSessao,
    cancelarSessao,
    formatarTempo
  }
}
