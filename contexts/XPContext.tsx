'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useXP, TipoAcaoXP, calcularNivel, NivelInfo, NIVEIS_CONFIG } from '@/hooks/useXP'
import { XPGainToast } from '@/components/xp'

interface XPToast {
  id: string
  xpGanho: number
  multiplicador: number
  nivelUp: boolean
  novoNivel?: NivelInfo
}

interface XPContextData {
  ganharXP: (tipo: TipoAcaoXP, descricao?: string) => Promise<{ xpGanho: number; nivelUp: boolean }>
  xpTotal: number
  xpHoje: number
  nivel: number
  nivelInfo: NivelInfo
  proximoNivel: NivelInfo | null
  progressoNivel: number
  xpParaProximoNivel: number
  sequenciaDias: number
  maiorSequencia: number
  multiplicador: number
  loading: boolean
  refresh: () => Promise<void>
}

const XPContext = createContext<XPContextData | null>(null)

export function XPProvider({ children }: { children: ReactNode }) {
  const xpData = useXP()
  const [toasts, setToasts] = useState<XPToast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ganharXP = useCallback(async (tipo: TipoAcaoXP, descricao?: string) => {
    const result = await xpData.addXP(tipo, descricao)

    if (result.xpGanho > 0) {
      const toastId = `${Date.now()}-${Math.random()}`
      const novoNivel = result.novoNivel ? calcularNivel(xpData.xpTotal + result.xpGanho) : undefined

      setToasts(prev => [...prev, {
        id: toastId,
        xpGanho: result.xpGanho,
        multiplicador: xpData.multiplicador,
        nivelUp: result.nivelUp,
        novoNivel
      }])
    }

    return result
  }, [xpData])

  return (
    <XPContext.Provider value={{
      ganharXP,
      xpTotal: xpData.xpTotal,
      xpHoje: xpData.xpHoje,
      nivel: xpData.nivel,
      nivelInfo: xpData.nivelInfo,
      proximoNivel: xpData.proximoNivel,
      progressoNivel: xpData.progressoNivel,
      xpParaProximoNivel: xpData.xpParaProximoNivel,
      sequenciaDias: xpData.sequenciaDias,
      maiorSequencia: xpData.maiorSequencia,
      multiplicador: xpData.multiplicador,
      loading: xpData.loading,
      refresh: xpData.refresh
    }}>
      {children}

      {/* Toasts de XP */}
      <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ transform: `translateY(${index * 10}px)` }}
          >
            <XPGainToast
              xpGanho={toast.xpGanho}
              multiplicador={toast.multiplicador}
              nivelUp={toast.nivelUp}
              novoNivel={toast.novoNivel}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </XPContext.Provider>
  )
}

// Valores padrão para quando não há contexto
const defaultXPData: XPContextData = {
  ganharXP: async () => ({ xpGanho: 0, nivelUp: false }),
  xpTotal: 0,
  xpHoje: 0,
  nivel: 1,
  nivelInfo: NIVEIS_CONFIG[0],
  proximoNivel: NIVEIS_CONFIG[1],
  progressoNivel: 0,
  xpParaProximoNivel: 100,
  sequenciaDias: 0,
  maiorSequencia: 0,
  multiplicador: 1,
  loading: false,
  refresh: async () => {}
}

export function useXPContext() {
  const context = useContext(XPContext)
  // Retornar valores padrão se não estiver dentro do provider (evita crash)
  if (!context) {
    console.warn('useXPContext usado fora do XPProvider - usando valores padrão')
    return defaultXPData
  }
  return context
}
