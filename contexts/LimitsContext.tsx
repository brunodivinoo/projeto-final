'use client'
import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react'
import { useLimits, LimitItem, calcularPorcentagem, getMensagemMotivacional, getCorPorcentagem } from '@/hooks/useLimits'
import { useConsumeLimit, TipoRecurso } from '@/hooks/useCheckLimit'

interface LimitsContextData {
  plano: string
  isPro: boolean
  limites: LimitItem[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  consumirRecurso: (recurso: TipoRecurso, quantidade?: number) => Promise<boolean>
}

const LimitsContext = createContext<LimitsContextData | null>(null)

export function LimitsProvider({ children }: { children: ReactNode }) {
  const limitsData = useLimits()
  const { consumeLimit } = useConsumeLimit()

  const consumirRecurso = useCallback(async (recurso: TipoRecurso, quantidade: number = 1): Promise<boolean> => {
    const result = await consumeLimit(recurso, quantidade)
    if (result) {
      await limitsData.refresh()
    }
    return result
  }, [consumeLimit, limitsData.refresh])

  const value = useMemo(() => ({
    plano: limitsData.plano,
    isPro: limitsData.isPro,
    limites: limitsData.limites,
    loading: limitsData.loading,
    error: limitsData.error,
    refresh: limitsData.refresh,
    consumirRecurso
  }), [limitsData.plano, limitsData.isPro, limitsData.limites, limitsData.loading, limitsData.error, limitsData.refresh, consumirRecurso])

  return (
    <LimitsContext.Provider value={value}>
      {children}
    </LimitsContext.Provider>
  )
}

// Valores padrão para quando não há contexto
const defaultLimitsData: LimitsContextData = {
  plano: 'FREE',
  isPro: false,
  limites: [],
  loading: false,
  error: null,
  refresh: async () => {},
  consumirRecurso: async () => false
}

export function useLimitsContext() {
  const context = useContext(LimitsContext)
  // Retornar valores padrão se não estiver dentro do provider (evita crash)
  if (!context) {
    console.warn('useLimitsContext usado fora do LimitsProvider - usando valores padrão')
    return defaultLimitsData
  }
  return context
}

// Re-exportar funções utilitárias
export { calcularPorcentagem, getMensagemMotivacional, getCorPorcentagem }
