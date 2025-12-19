'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useLimitsContext, calcularPorcentagem, getMensagemMotivacional, getCorPorcentagem } from '@/contexts/LimitsContext'

interface LimitsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LimitsModal({ isOpen, onClose }: LimitsModalProps) {
  const { plano, isPro, limites, loading, refresh } = useLimitsContext()

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Atualizar ao abrir
  useEffect(() => {
    if (isOpen) refresh()
  }, [isOpen, refresh])

  if (!isOpen) return null

  // Calcular porcentagem média
  const porcentagemMedia = limites.length > 0
    ? Math.round(limites.reduce((acc, l) => acc + calcularPorcentagem(l.usado, l.limite), 0) / limites.length)
    : 0

  const mensagem = getMensagemMotivacional(porcentagemMedia, isPro)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-[#1c252e] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPro ? 'bg-primary/20 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <span className="material-symbols-outlined">{isPro ? 'workspace_premium' : 'person'}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Seus Limites
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Plano {isPro ? 'Estuda PRO' : 'Free'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Mensagem motivacional */}
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                  <p className="text-sm text-slate-700 dark:text-slate-300 text-center">
                    {mensagem}
                  </p>
                </div>

                {/* Lista de limites */}
                <div className="space-y-4">
                  {limites.map(limite => {
                    const porcentagem = calcularPorcentagem(limite.usado, limite.limite)
                    const corBarra = getCorPorcentagem(porcentagem)

                    return (
                      <div key={limite.id} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="material-symbols-outlined text-lg"
                              style={{ color: limite.cor }}
                            >
                              {limite.icone}
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {limite.nome}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              ({limite.tipo === 'diario' ? 'hoje' : 'mês'})
                            </span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {limite.usado}/{limite.limite}
                          </span>
                        </div>

                        {/* Barra de progresso */}
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${corBarra} transition-all duration-500 ease-out`}
                            style={{ width: `${porcentagem}%` }}
                          />
                        </div>

                        {/* Porcentagem */}
                        <div className="flex justify-end mt-1">
                          <span className={`text-xs font-medium ${porcentagem >= 90 ? 'text-red-500' : 'text-slate-400'}`}>
                            {porcentagem}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Uso geral */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Uso Geral
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {porcentagemMedia}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getCorPorcentagem(porcentagemMedia)} transition-all duration-500`}
                      style={{ width: `${porcentagemMedia}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161f28]">
            {isPro ? (
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Seus limites renovam diariamente/mensalmente
                </p>
                <Link
                  href="/dashboard/perfil"
                  onClick={onClose}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Gerenciar assinatura →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                  Desbloqueie recursos ilimitados com o Estuda PRO
                </p>
                <Link
                  href="/dashboard/planos"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">rocket_launch</span>
                  Fazer Upgrade
                </Link>
                <p className="text-xs text-slate-400 text-center">
                  A partir de R$ 29,90/mês
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
