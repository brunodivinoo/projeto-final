'use client'
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { useAuth } from './AuthContext'

// Tipos
export interface SessaoAtiva {
  id: string
  disciplina_id: string
  assunto_id?: string
  subassunto_id?: string
  ciclo_id?: string
  ciclo_item_id?: string
  metodo: string
  inicio: string
  status: 'em_andamento' | 'pausada'
  disciplina?: { id: string; nome: string; icon?: string; cor?: string }
  assunto?: { id: string; nome: string }
  subassunto?: { id: string; nome: string }
}

export interface IniciarSessaoParams {
  disciplina_id: string
  assunto_id?: string
  subassunto_id?: string
  ciclo_id?: string
  ciclo_item_id?: string
  metodo: string
  criar_revisao?: boolean
  prioridade_revisao?: number
}

export interface FinalizarSessaoParams {
  questoes_feitas?: number
  questoes_corretas?: number
  anotacoes?: string
  avaliacao?: number
  criar_revisao?: boolean
  prioridade_revisao?: number
}

type EstudoContextType = {
  // Estado da sessão
  sessaoAtiva: SessaoAtiva | null
  tempoDecorrido: number
  isPausado: boolean
  loading: boolean

  // Ações
  iniciarSessao: (params: IniciarSessaoParams) => Promise<SessaoAtiva | null>
  pausarSessao: () => Promise<boolean>
  retomarSessao: () => Promise<boolean>
  finalizarSessao: (params?: FinalizarSessaoParams) => Promise<boolean>
  cancelarSessao: () => Promise<boolean>

  // Utilitários
  formatarTempo: (segundos: number) => string
  formatarTempoCompleto: (segundos: number) => string
  temSessaoAtiva: boolean
}

const EstudoContext = createContext<EstudoContextType>({
  sessaoAtiva: null,
  tempoDecorrido: 0,
  isPausado: false,
  loading: false,
  iniciarSessao: async () => null,
  pausarSessao: async () => false,
  retomarSessao: async () => false,
  finalizarSessao: async () => false,
  cancelarSessao: async () => false,
  formatarTempo: () => '00:00',
  formatarTempoCompleto: () => '00:00:00',
  temSessaoAtiva: false,
})

export function EstudoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoAtiva | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [isPausado, setIsPausado] = useState(false)
  const [loading, setLoading] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inicioRef = useRef<Date | null>(null)
  const tempoPausadoRef = useRef(0)
  const ultimaPausaRef = useRef<Date | null>(null)

  // Limpar timer
  const limparTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Iniciar timer
  const iniciarTimer = useCallback(() => {
    limparTimer()

    timerRef.current = setInterval(() => {
      if (inicioRef.current && !isPausado) {
        const agora = new Date()
        const segundosTotais = Math.floor((agora.getTime() - inicioRef.current.getTime()) / 1000)
        const segundosAtivos = segundosTotais - tempoPausadoRef.current
        setTempoDecorrido(Math.max(0, segundosAtivos))
      }
    }, 1000)
  }, [isPausado, limparTimer])

  // Buscar sessão ativa ao carregar
  useEffect(() => {
    if (!user) {
      setSessaoAtiva(null)
      setTempoDecorrido(0)
      limparTimer()
      return
    }

    const buscarSessaoAtiva = async () => {
      try {
        const response = await fetch(`/api/estudos/sessoes?user_id=${user.id}&ativa=true`)
        const data = await response.json()

        if (data && data.id) {
          setSessaoAtiva(data)
          inicioRef.current = new Date(data.inicio)
          tempoPausadoRef.current = data.tempo_pausado_segundos || 0
          setIsPausado(data.status === 'pausada')

          if (data.status === 'pausada') {
            // Se estava pausada, calcular tempo até a pausa
            const agora = new Date()
            const segundosTotais = Math.floor((agora.getTime() - inicioRef.current.getTime()) / 1000)
            setTempoDecorrido(Math.max(0, segundosTotais - tempoPausadoRef.current))
          } else {
            iniciarTimer()
          }
        }
      } catch (error) {
        console.error('Erro ao buscar sessão ativa:', error)
      }
    }

    buscarSessaoAtiva()
  }, [user, iniciarTimer, limparTimer])

  // Gerenciar timer baseado no estado de pausa
  useEffect(() => {
    if (sessaoAtiva && !isPausado) {
      iniciarTimer()
    } else {
      limparTimer()
    }

    return limparTimer
  }, [sessaoAtiva, isPausado, iniciarTimer, limparTimer])

  // Iniciar nova sessão
  const iniciarSessao = useCallback(async (params: IniciarSessaoParams): Promise<SessaoAtiva | null> => {
    if (!user) return null

    setLoading(true)

    try {
      const response = await fetch('/api/estudos/sessoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          user_id: user.id,
          criar_revisao: params.criar_revisao !== false,
          prioridade_revisao: params.prioridade_revisao || 3
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Erro ao iniciar sessão:', data.error)
        return null
      }

      setSessaoAtiva(data)
      inicioRef.current = new Date()
      tempoPausadoRef.current = 0
      setTempoDecorrido(0)
      setIsPausado(false)

      return data
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Pausar sessão
  const pausarSessao = useCallback(async (): Promise<boolean> => {
    if (!sessaoAtiva) return false

    setLoading(true)

    try {
      const response = await fetch('/api/estudos/sessoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessaoAtiva.id,
          user_id: user?.id,
          acao: 'pausar',
          duracao_segundos: tempoDecorrido
        })
      })

      if (!response.ok) return false

      const data = await response.json()
      setSessaoAtiva(data)
      setIsPausado(true)
      ultimaPausaRef.current = new Date()

      return true
    } catch (error) {
      console.error('Erro ao pausar sessão:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, sessaoAtiva, tempoDecorrido])

  // Retomar sessão
  const retomarSessao = useCallback(async (): Promise<boolean> => {
    if (!sessaoAtiva) return false

    setLoading(true)

    try {
      // Calcular tempo pausado adicional
      if (ultimaPausaRef.current) {
        const tempoPausaAtual = Math.floor((new Date().getTime() - ultimaPausaRef.current.getTime()) / 1000)
        tempoPausadoRef.current += tempoPausaAtual
      }

      const response = await fetch('/api/estudos/sessoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessaoAtiva.id,
          user_id: user?.id,
          acao: 'retomar',
          tempo_pausado_segundos: tempoPausadoRef.current
        })
      })

      if (!response.ok) return false

      const data = await response.json()
      setSessaoAtiva(data)
      setIsPausado(false)
      ultimaPausaRef.current = null

      return true
    } catch (error) {
      console.error('Erro ao retomar sessão:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, sessaoAtiva])

  // Finalizar sessão
  const finalizarSessao = useCallback(async (params?: FinalizarSessaoParams): Promise<boolean> => {
    if (!sessaoAtiva) return false

    setLoading(true)

    try {
      // Se estava pausada, adicionar tempo de pausa
      let tempoPausadoFinal = tempoPausadoRef.current
      if (isPausado && ultimaPausaRef.current) {
        tempoPausadoFinal += Math.floor((new Date().getTime() - ultimaPausaRef.current.getTime()) / 1000)
      }

      const response = await fetch('/api/estudos/sessoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessaoAtiva.id,
          user_id: user?.id,
          acao: 'finalizar',
          duracao_segundos: tempoDecorrido,
          tempo_pausado_segundos: tempoPausadoFinal,
          pausas: sessaoAtiva.status === 'pausada' ? 1 : 0,
          ...params
        })
      })

      if (!response.ok) return false

      // Limpar estado
      setSessaoAtiva(null)
      setTempoDecorrido(0)
      setIsPausado(false)
      inicioRef.current = null
      tempoPausadoRef.current = 0
      ultimaPausaRef.current = null
      limparTimer()

      return true
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, sessaoAtiva, tempoDecorrido, isPausado, limparTimer])

  // Cancelar sessão
  const cancelarSessao = useCallback(async (): Promise<boolean> => {
    if (!sessaoAtiva) return false

    setLoading(true)

    try {
      const response = await fetch('/api/estudos/sessoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessaoAtiva.id,
          user_id: user?.id,
          acao: 'cancelar',
          duracao_segundos: tempoDecorrido
        })
      })

      if (!response.ok) return false

      // Limpar estado
      setSessaoAtiva(null)
      setTempoDecorrido(0)
      setIsPausado(false)
      inicioRef.current = null
      tempoPausadoRef.current = 0
      ultimaPausaRef.current = null
      limparTimer()

      return true
    } catch (error) {
      console.error('Erro ao cancelar sessão:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, sessaoAtiva, tempoDecorrido, limparTimer])

  // Formatar tempo (MM:SS ou HH:MM:SS)
  const formatarTempo = useCallback((segundos: number): string => {
    const h = Math.floor(segundos / 3600)
    const m = Math.floor((segundos % 3600) / 60)
    const s = segundos % 60

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  // Formatar tempo completo (HH:MM:SS)
  const formatarTempoCompleto = useCallback((segundos: number): string => {
    const h = Math.floor(segundos / 3600)
    const m = Math.floor((segundos % 3600) / 60)
    const s = segundos % 60

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  const value = {
    sessaoAtiva,
    tempoDecorrido,
    isPausado,
    loading,
    iniciarSessao,
    pausarSessao,
    retomarSessao,
    finalizarSessao,
    cancelarSessao,
    formatarTempo,
    formatarTempoCompleto,
    temSessaoAtiva: !!sessaoAtiva,
  }

  return (
    <EstudoContext.Provider value={value}>
      {children}
    </EstudoContext.Provider>
  )
}

export const useEstudo = () => {
  const context = useContext(EstudoContext)
  if (!context) {
    throw new Error('useEstudo deve ser usado dentro de um EstudoProvider')
  }
  return context
}
