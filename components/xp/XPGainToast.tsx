'use client'
import { useEffect, useState } from 'react'
import { NivelInfo } from '@/hooks/useXP'

interface XPGainToastProps {
  xpGanho: number
  multiplicador?: number
  nivelUp?: boolean
  novoNivel?: NivelInfo
  onClose: () => void
}

export function XPGainToast({
  xpGanho,
  multiplicador = 1,
  nivelUp = false,
  novoNivel,
  onClose
}: XPGainToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setIsVisible(true), 50)

    // Auto fechar após 3 segundos (ou 5 se subiu de nível)
    const timeout = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(onClose, 300)
    }, nivelUp ? 5000 : 3000)

    return () => clearTimeout(timeout)
  }, [onClose, nivelUp])

  if (nivelUp && novoNivel) {
    return (
      <div
        className={`fixed top-20 right-4 z-[200] transition-all duration-300 ${
          isVisible && !isLeaving
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-full'
        }`}
      >
        <div
          className="bg-white dark:bg-[#1c252e] rounded-2xl shadow-2xl p-4 border-2 max-w-sm overflow-hidden"
          style={{ borderColor: novoNivel.cor }}
        >
          {/* Confetti effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: ['#fbbf24', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`
                }}
              />
            ))}
          </div>

          <div className="relative flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center animate-pulse"
              style={{ backgroundColor: `${novoNivel.cor}30` }}
            >
              <span
                className="material-symbols-outlined text-4xl"
                style={{ color: novoNivel.cor }}
              >
                {novoNivel.icone}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-yellow-500 text-xl">celebration</span>
                <span className="text-sm font-bold text-yellow-500">LEVEL UP!</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                Nível {novoNivel.nivel}
              </p>
              <p className="text-sm" style={{ color: novoNivel.cor }}>
                {novoNivel.nome}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500">XP Ganho</span>
            <span className="text-lg font-bold text-green-500">+{xpGanho} XP</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fixed top-20 right-4 z-[200] transition-all duration-300 ${
        isVisible && !isLeaving
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="bg-white dark:bg-[#1c252e] rounded-xl shadow-xl p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-3 min-w-[200px]">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-green-500 text-xl">add_circle</span>
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-green-500">+{xpGanho} XP</p>
          {multiplicador > 1 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bônus PRO {multiplicador}x aplicado
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIsLeaving(true)
            setTimeout(onClose, 300)
          }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  )
}

// Componente de container para múltiplos toasts
interface XPToastItem {
  id: string
  xpGanho: number
  multiplicador?: number
  nivelUp?: boolean
  novoNivel?: NivelInfo
}

interface XPToastContainerProps {
  toasts: XPToastItem[]
  onRemove: (id: string) => void
}

export function XPToastContainer({ toasts, onRemove }: XPToastContainerProps) {
  return (
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
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}
