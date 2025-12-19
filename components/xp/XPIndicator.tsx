'use client'
import { useState } from 'react'
import { useXPContext } from '@/contexts/XPContext'
import { XPModal } from './XPModal'

export function XPIndicator() {
  const [showModal, setShowModal] = useState(false)
  const { xpTotal, nivel, nivelInfo, progressoNivel, loading, multiplicador } = useXPContext()

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse">
        <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
        title={`Nível ${nivel} - ${nivelInfo.nome}`}
      >
        {/* Ícone do nível */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center relative"
          style={{ backgroundColor: `${nivelInfo.cor}20` }}
        >
          <span
            className="material-symbols-outlined text-base"
            style={{ color: nivelInfo.cor }}
          >
            {nivelInfo.icone}
          </span>
          {/* Badge de nível */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
            style={{ backgroundColor: nivelInfo.cor }}
          >
            {nivel}
          </span>
        </div>

        {/* XP e barra de progresso */}
        <div className="hidden sm:flex flex-col gap-0.5 min-w-[60px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {xpTotal.toLocaleString()} XP
            </span>
            {multiplicador > 1 && (
              <span className="text-[9px] font-bold text-primary ml-1">
                {multiplicador}x
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressoNivel}%`,
                backgroundColor: nivelInfo.cor
              }}
            />
          </div>
        </div>

        {/* Seta */}
        <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          expand_more
        </span>
      </button>

      {/* Modal de XP */}
      <XPModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
