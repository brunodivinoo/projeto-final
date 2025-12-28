'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useSimulados, ProgressoGeracao } from '@/hooks/useSimulados'

interface GeracaoAtiva {
  simulado_id: string
  titulo: string
  total: number
  geradas: number
  erros: number
  item_atual?: {
    disciplina: string
    assunto?: string
    ordem: number
  }
  iniciado_em: number
  pausado?: boolean
}

interface SimuladoGeracaoContextType {
  geracaoAtiva: GeracaoAtiva | null
  isProcessando: boolean
  isMinimizado: boolean
  temGeracaoPendente: boolean
  iniciarGeracao: (simuladoId: string, titulo: string, total: number) => void
  pausarGeracao: () => void
  continuarGeracao: () => void
  cancelarGeracao: () => Promise<void>
  minimizar: () => void
  maximizar: () => void
  progresso: number
  tempoEstimado: string
}

const SimuladoGeracaoContext = createContext<SimuladoGeracaoContextType | undefined>(undefined)

const STORAGE_KEY = 'simulado_geracao_ativa'
const DELAY_ENTRE_QUESTOES = 1500 // ms

export function SimuladoGeracaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { gerarProximaQuestao, cancelarGeracao: cancelarGeracaoAPI, buscarProgressoGeracao } = useSimulados()

  const [geracaoAtiva, setGeracaoAtiva] = useState<GeracaoAtiva | null>(null)
  const [isProcessando, setIsProcessando] = useState(false)
  const [isMinimizado, setIsMinimizado] = useState(false)
  const [temGeracaoPendente, setTemGeracaoPendente] = useState(false)

  const abortRef = useRef(false)
  const processandoRef = useRef(false)

  // Carregar estado do localStorage ao montar
  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved) as GeracaoAtiva
        // Verificar se a geração ainda está pendente
        if (data.geradas < data.total) {
          setGeracaoAtiva({ ...data, pausado: true })
          setTemGeracaoPendente(true)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Verificar gerações pendentes no servidor ao autenticar
  useEffect(() => {
    if (!user) return

    const verificarPendentes = async () => {
      const resultado = await buscarProgressoGeracao()
      if (resultado && 'simulados_pendentes' in resultado) {
        const pendentes = resultado.simulados_pendentes
        if (pendentes.length > 0) {
          const pendente = pendentes[0]
          setGeracaoAtiva({
            simulado_id: pendente.id,
            titulo: pendente.titulo,
            total: pendente.total,
            geradas: pendente.geradas,
            erros: 0,
            iniciado_em: Date.now(),
            pausado: true
          })
          setTemGeracaoPendente(true)
        }
      }
    }

    // Verificar após pequeno delay para não bloquear
    const timer = setTimeout(verificarPendentes, 2000)
    return () => clearTimeout(timer)
  }, [user, buscarProgressoGeracao])

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (geracaoAtiva && geracaoAtiva.geradas < geracaoAtiva.total) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(geracaoAtiva))
    } else if (!geracaoAtiva) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [geracaoAtiva])

  // Loop de processamento
  const processarFila = useCallback(async () => {
    if (!geracaoAtiva || processandoRef.current || abortRef.current) return

    processandoRef.current = true
    setIsProcessando(true)

    while (!abortRef.current && geracaoAtiva) {
      try {
        const resultado = await gerarProximaQuestao(geracaoAtiva.simulado_id)

        if (!resultado) {
          // Erro na requisição, tentar novamente após delay maior
          await delay(3000)
          continue
        }

        // Atualizar estado
        setGeracaoAtiva(prev => {
          if (!prev) return null
          return {
            ...prev,
            geradas: resultado.geradas,
            erros: resultado.erros,
            item_atual: resultado.item_atual
          }
        })

        if (resultado.concluido) {
          // Finalizado com sucesso
          setGeracaoAtiva(null)
          setIsProcessando(false)
          setTemGeracaoPendente(false)
          localStorage.removeItem(STORAGE_KEY)
          processandoRef.current = false
          return
        }

        // Delay entre questões (rate limiting)
        await delay(DELAY_ENTRE_QUESTOES)

      } catch (err) {
        console.error('Erro no processamento:', err)
        await delay(3000)
      }
    }

    processandoRef.current = false
    setIsProcessando(false)
  }, [geracaoAtiva, gerarProximaQuestao])

  // Iniciar geração
  const iniciarGeracao = useCallback((simuladoId: string, titulo: string, total: number) => {
    abortRef.current = false

    const novaGeracao: GeracaoAtiva = {
      simulado_id: simuladoId,
      titulo,
      total,
      geradas: 0,
      erros: 0,
      iniciado_em: Date.now()
    }

    setGeracaoAtiva(novaGeracao)
    setTemGeracaoPendente(false)
    setIsMinimizado(false)

    // Iniciar processamento após pequeno delay
    setTimeout(() => {
      processarFila()
    }, 500)
  }, [processarFila])

  // Pausar geração
  const pausarGeracao = useCallback(() => {
    abortRef.current = true
    setGeracaoAtiva(prev => prev ? { ...prev, pausado: true } : null)
    setIsProcessando(false)
  }, [])

  // Continuar geração pausada
  const continuarGeracao = useCallback(() => {
    if (!geracaoAtiva) return

    abortRef.current = false
    setGeracaoAtiva(prev => prev ? { ...prev, pausado: false } : null)
    setTemGeracaoPendente(false)

    setTimeout(() => {
      processarFila()
    }, 500)
  }, [geracaoAtiva, processarFila])

  // Cancelar geração
  const cancelar = useCallback(async () => {
    if (!geracaoAtiva) return

    abortRef.current = true
    setIsProcessando(false)

    try {
      await cancelarGeracaoAPI(geracaoAtiva.simulado_id)
    } catch (err) {
      console.error('Erro ao cancelar:', err)
    }

    setGeracaoAtiva(null)
    setTemGeracaoPendente(false)
    localStorage.removeItem(STORAGE_KEY)
  }, [geracaoAtiva, cancelarGeracaoAPI])

  // Calcular progresso
  const progresso = geracaoAtiva
    ? Math.round((geracaoAtiva.geradas / geracaoAtiva.total) * 100)
    : 0

  // Calcular tempo estimado
  const tempoEstimado = geracaoAtiva
    ? calcularTempoEstimado(geracaoAtiva.total - geracaoAtiva.geradas)
    : ''

  return (
    <SimuladoGeracaoContext.Provider
      value={{
        geracaoAtiva,
        isProcessando,
        isMinimizado,
        temGeracaoPendente,
        iniciarGeracao,
        pausarGeracao,
        continuarGeracao,
        cancelarGeracao: cancelar,
        minimizar: () => setIsMinimizado(true),
        maximizar: () => setIsMinimizado(false),
        progresso,
        tempoEstimado
      }}
    >
      {children}
    </SimuladoGeracaoContext.Provider>
  )
}

export function useSimuladoGeracao() {
  const context = useContext(SimuladoGeracaoContext)
  if (!context) {
    throw new Error('useSimuladoGeracao deve ser usado dentro de SimuladoGeracaoProvider')
  }
  return context
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calcularTempoEstimado(questoesRestantes: number): string {
  // ~2 segundos por questão (1.5s delay + 0.5s processamento)
  const segundosEstimados = questoesRestantes * 2
  const minutos = Math.ceil(segundosEstimados / 60)

  if (minutos < 1) return '< 1 min'
  if (minutos === 1) return '~1 min'
  return `~${minutos} min`
}
