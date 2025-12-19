'use client'
import { useState } from 'react'
import { useLimitsContext, calcularPorcentagem } from '@/contexts/LimitsContext'
import { LimitsModal } from './LimitsModal'

export function LimitsIndicator() {
  const [showModal, setShowModal] = useState(false)
  const { limites, loading, isPro } = useLimitsContext()

  // Calcular porcentagem média de uso
  const porcentagemMedia = limites.length > 0
    ? Math.round(limites.reduce((acc, l) => acc + calcularPorcentagem(l.usado, l.limite), 0) / limites.length)
    : 0

  // Determinar cor do indicador baseado no uso
  const getIndicatorColor = () => {
    if (porcentagemMedia < 50) return 'text-green-500'
    if (porcentagemMedia < 75) return 'text-yellow-500'
    if (porcentagemMedia < 90) return 'text-orange-500'
    return 'text-red-500'
  }

  // Determinar ícone baseado no uso
  const getIndicatorIcon = () => {
    if (porcentagemMedia < 50) return 'battery_full'
    if (porcentagemMedia < 75) return 'battery_5_bar'
    if (porcentagemMedia < 90) return 'battery_2_bar'
    return 'battery_alert'
  }

  if (loading) {
    return (
      <button
        className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        disabled
      >
        <span className="material-symbols-outlined text-xl animate-pulse">hourglass_empty</span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative group ${getIndicatorColor()}`}
        title="Ver limites de uso"
      >
        <span className="material-symbols-outlined text-xl">{getIndicatorIcon()}</span>

        {/* Badge de porcentagem */}
        {porcentagemMedia >= 75 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">!</span>
          </span>
        )}

        {/* Tooltip */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {isPro ? 'Estuda PRO' : 'Plano Free'} • {porcentagemMedia}% usado
        </div>
      </button>

      <LimitsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
