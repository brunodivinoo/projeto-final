'use client'
import { useEffect } from 'react'
import { useXP, NIVEIS_CONFIG, XP_ACOES } from '@/hooks/useXP'
import Link from 'next/link'

interface XPModalProps {
  isOpen: boolean
  onClose: () => void
}

export function XPModal({ isOpen, onClose }: XPModalProps) {
  const {
    xpTotal,
    xpHoje,
    nivel,
    nivelInfo,
    proximoNivel,
    progressoNivel,
    xpParaProximoNivel,
    sequenciaDias,
    maiorSequencia,
    multiplicador
  } = useXP()

  // Fechar com ESC
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1c252e] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className="p-6 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${nivelInfo.cor}20, ${nivelInfo.cor}05)` }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-black/40 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">close</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Ícone grande do nível */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
              style={{ backgroundColor: `${nivelInfo.cor}30` }}
            >
              <span
                className="material-symbols-outlined text-5xl"
                style={{ color: nivelInfo.cor }}
              >
                {nivelInfo.icone}
              </span>
              <span
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: nivelInfo.cor }}
              >
                {nivel}
              </span>
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nível {nivel}</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{nivelInfo.nome}</h2>
              <p className="text-lg font-bold" style={{ color: nivelInfo.cor }}>
                {xpTotal.toLocaleString()} XP
              </p>
            </div>
          </div>

          {/* Barra de progresso */}
          {proximoNivel && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 dark:text-slate-400">Progresso para Nível {proximoNivel.nivel}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{progressoNivel}%</span>
              </div>
              <div className="h-3 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressoNivel}%`,
                    backgroundColor: nivelInfo.cor
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                Faltam <span className="font-bold" style={{ color: nivelInfo.cor }}>{xpParaProximoNivel.toLocaleString()} XP</span> para {proximoNivel.nome}
              </p>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
              <span className="material-symbols-outlined text-primary text-2xl mb-1">today</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{xpHoje}</p>
              <p className="text-xs text-slate-500">XP Hoje</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
              <span className="material-symbols-outlined text-orange-500 text-2xl mb-1">local_fire_department</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{sequenciaDias}</p>
              <p className="text-xs text-slate-500">Sequência</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
              <span className="material-symbols-outlined text-purple-500 text-2xl mb-1">emoji_events</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{maiorSequencia}</p>
              <p className="text-xs text-slate-500">Recorde</p>
            </div>
          </div>

          {/* Multiplicador PRO */}
          {multiplicador > 1 && (
            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-4 mb-6 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">bolt</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Multiplicador PRO Ativo!</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Você ganha <span className="font-bold text-primary">{multiplicador}x</span> mais XP em todas as ações
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Como ganhar XP */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
              Como ganhar XP
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { acao: 'questao_correta', nome: 'Questão correta', icone: 'check_circle', cor: '#22c55e' },
                { acao: 'simulado_completo', nome: 'Simulado completo', icone: 'assignment', cor: '#3b82f6' },
                { acao: 'resumo_criado', nome: 'Resumo criado', icone: 'summarize', cor: '#a855f7' },
                { acao: 'flashcard_revisado', nome: 'Flashcard revisado', icone: 'style', cor: '#14b8a6' },
                { acao: 'login_diario', nome: 'Login diário', icone: 'login', cor: '#f59e0b' },
                { acao: 'chat_mensagem', nome: 'Chat IA', icone: 'chat', cor: '#10b981' },
              ].map((item) => (
                <div
                  key={item.acao}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: item.cor }}
                  >
                    {item.icone}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">{item.nome}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    +{XP_ACOES[item.acao as keyof typeof XP_ACOES]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos níveis */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
              Jornada de Níveis
            </h3>
            <div className="space-y-2">
              {NIVEIS_CONFIG.slice(0, 6).map((n) => (
                <div
                  key={n.nivel}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                    n.nivel === nivel
                      ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-primary/30'
                      : n.nivel < nivel
                      ? 'opacity-50'
                      : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${n.cor}20` }}
                  >
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ color: n.cor }}
                    >
                      {n.icone}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Nível {n.nivel} - {n.nome}
                    </p>
                    <p className="text-xs text-slate-500">{n.xpMin.toLocaleString()} XP</p>
                  </div>
                  {n.nivel < nivel && (
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                  )}
                  {n.nivel === nivel && (
                    <span className="text-xs font-bold text-primary">Atual</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <Link
            href="/dashboard/progresso"
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-lg">insights</span>
            Ver Progresso Completo
          </Link>
        </div>
      </div>
    </div>
  )
}
