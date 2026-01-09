'use client'
import { useState } from 'react'

interface Revisao {
  id: string
  titulo?: string
  disciplina?: { id: string; nome: string; icon?: string; cor?: string }
  assunto?: { id: string; nome: string }
  subassunto?: { id: string; nome: string }
  metodo_original?: string
  data_estudo: string
  proxima_revisao: string
  intervalo: number
  repeticoes: number
  prioridade: number
  status: 'pendente' | 'atrasada' | 'concluida' | 'arquivada'
}

interface CardRevisaoProps {
  revisao: Revisao
  onRevisar: (id: string, qualidade: number) => Promise<void>
  onArquivar: (id: string) => Promise<void>
  compact?: boolean
}

const QUALIDADES = [
  { valor: 0, label: 'Esqueci', cor: 'red', icon: 'sentiment_very_dissatisfied' },
  { valor: 1, label: 'Errado', cor: 'red', icon: 'sentiment_dissatisfied' },
  { valor: 2, label: 'Difícil', cor: 'orange', icon: 'sentiment_neutral' },
  { valor: 3, label: 'Ok', cor: 'yellow', icon: 'sentiment_satisfied' },
  { valor: 4, label: 'Bom', cor: 'green', icon: 'sentiment_satisfied_alt' },
  { valor: 5, label: 'Fácil', cor: 'emerald', icon: 'sentiment_very_satisfied' },
]

const METODO_ICONS: Record<string, string> = {
  questoes: 'quiz',
  leitura: 'auto_stories',
  video: 'play_circle',
  resumo: 'edit_note',
  flashcard: 'style',
  aula: 'school',
  pdf: 'picture_as_pdf',
  revisao: 'refresh',
  outro: 'more_horiz'
}

export function CardRevisao({ revisao, onRevisar, onArquivar, compact = false }: CardRevisaoProps) {
  const [showAvaliar, setShowAvaliar] = useState(false)
  const [loading, setLoading] = useState(false)

  const isAtrasada = revisao.status === 'atrasada'
  const diasAtraso = isAtrasada
    ? Math.floor((new Date().getTime() - new Date(revisao.proxima_revisao).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const handleRevisar = async (qualidade: number) => {
    setLoading(true)
    try {
      await onRevisar(revisao.id, qualidade)
    } finally {
      setLoading(false)
      setShowAvaliar(false)
    }
  }

  const handleArquivar = async () => {
    setLoading(true)
    try {
      await onArquivar(revisao.id)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
        isAtrasada
          ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d]'
      }`}>
        <div className={`size-10 rounded-lg flex items-center justify-center ${
          isAtrasada ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'
        }`}>
          <span className="material-symbols-outlined">
            {METODO_ICONS[revisao.metodo_original || 'outro']}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
            {revisao.disciplina?.nome || 'Revisão'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {revisao.assunto?.nome || revisao.titulo}
          </p>
        </div>

        {isAtrasada && (
          <span className="text-xs font-bold text-red-500 whitespace-nowrap">
            {diasAtraso}d atraso
          </span>
        )}

        <button
          onClick={() => setShowAvaliar(!showAvaliar)}
          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          Revisar
        </button>

        {/* Mini avaliação */}
        {showAvaliar && (
          <div className="absolute right-0 top-full mt-2 p-2 bg-white dark:bg-[#1c242d] rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10">
            <div className="flex gap-1">
              {QUALIDADES.map((q) => (
                <button
                  key={q.valor}
                  onClick={() => handleRevisar(q.valor)}
                  disabled={loading}
                  className={`p-2 rounded-lg hover:bg-${q.cor}-100 dark:hover:bg-${q.cor}-500/20 text-${q.cor}-500 transition-colors`}
                  title={q.label}
                >
                  <span className="material-symbols-outlined text-lg">{q.icon}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${
      isAtrasada
        ? 'border-red-200 dark:border-red-500/30 bg-gradient-to-br from-red-50 to-white dark:from-red-500/10 dark:to-[#1c242d]'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c242d]'
    }`}>
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`size-12 rounded-xl flex items-center justify-center ${
            isAtrasada ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'
          }`}>
            <span className="material-symbols-outlined text-2xl">
              {METODO_ICONS[revisao.metodo_original || 'outro']}
            </span>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">
              {revisao.disciplina?.nome || 'Revisão'}
            </h4>
            {revisao.assunto && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {revisao.assunto.nome}
                {revisao.subassunto && ` > ${revisao.subassunto.nome}`}
              </p>
            )}
            {revisao.titulo && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {revisao.titulo}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge de status */}
          {isAtrasada ? (
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
              {diasAtraso}d atrasada
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
              Hoje
            </span>
          )}

          {/* Prioridade */}
          <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${
            revisao.prioridade >= 4
              ? 'bg-red-100 dark:bg-red-500/20 text-red-500'
              : revisao.prioridade === 3
              ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600'
              : 'bg-green-100 dark:bg-green-500/20 text-green-600'
          }`}>
            {revisao.prioridade}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">event</span>
          Estudado: {new Date(revisao.data_estudo).toLocaleDateString('pt-BR')}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">replay</span>
          {revisao.repeticoes} revisões
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">schedule</span>
          Intervalo: {revisao.intervalo}d
        </span>
      </div>

      {/* Avaliação */}
      {!showAvaliar ? (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          <button
            onClick={() => setShowAvaliar(true)}
            className="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Marcar como Revisada
          </button>
          <button
            onClick={handleArquivar}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Arquivar"
          >
            <span className="material-symbols-outlined text-lg">archive</span>
          </button>
        </div>
      ) : (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Como foi lembrar deste conteúdo?
          </p>
          <div className="grid grid-cols-6 gap-2">
            {QUALIDADES.map((q) => (
              <button
                key={q.valor}
                onClick={() => handleRevisar(q.valor)}
                disabled={loading}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all hover:scale-105 ${
                  q.valor <= 1
                    ? 'border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500'
                    : q.valor === 2
                    ? 'border-orange-200 dark:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-orange-500'
                    : q.valor === 3
                    ? 'border-yellow-200 dark:border-yellow-500/30 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 text-yellow-600'
                    : 'border-green-200 dark:border-green-500/30 hover:bg-green-50 dark:hover:bg-green-500/10 text-green-500'
                } disabled:opacity-50`}
              >
                <span className="material-symbols-outlined text-xl">{q.icon}</span>
                <span className="text-[10px] font-medium">{q.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAvaliar(false)}
            className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
