'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useXP, TipoAcaoXP, calcularNivel, NivelInfo } from '@/hooks/useXP'
import { XPGainToast } from '@/components/xp'

interface XPToast {
  id: string
  xpGanho: number
  multiplicador: number
  nivelUp: boolean
  novoNivel?: NivelInfo
}

interface XPContextData {
  ganharXP: (tipo: TipoAcaoXP, descricao?: string) => Promise<void>
  xpTotal: number
  nivel: number
  nivelInfo: NivelInfo
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
  }, [xpData])

  return (
    <XPContext.Provider value={{
      ganharXP,
      xpTotal: xpData.xpTotal,
      nivel: xpData.nivel,
      nivelInfo: xpData.nivelInfo
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

export function useXPContext() {
  const context = useContext(XPContext)
  if (!context) {
    throw new Error('useXPContext deve ser usado dentro de um XPProvider')
  }
  return context
}
