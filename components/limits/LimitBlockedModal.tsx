'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import type { TipoRecurso } from '@/hooks/useCheckLimit'

interface LimitBlockedModalProps {
  isOpen: boolean
  onClose: () => void
  recurso: TipoRecurso
  usado: number
  limite: number
  tipo: 'diario' | 'mensal'
  isPro?: boolean
}

// Informações de cada recurso
const RECURSO_INFO: Record<TipoRecurso, { nome: string; icone: string; cor: string; descricao: string }> = {
  questoes_ia: {
    nome: 'Questões IA',
    icone: 'quiz',
    cor: '#137fec',
    descricao: 'Gere questões personalizadas usando inteligência artificial'
  },
  questoes: {
    nome: 'Questões',
    icone: 'help_outline',
    cor: '#6366f1',
    descricao: 'Pratique com questões do banco de dados'
  },
  resumos: {
    nome: 'Resumos',
    icone: 'summarize',
    cor: '#a855f7',
    descricao: 'Crie resumos inteligentes dos seus conteúdos'
  },
  chat_mensagens: {
    nome: 'Chat IA',
    icone: 'chat_bubble',
    cor: '#10b981',
    descricao: 'Converse com a IA para tirar dúvidas'
  },
  pdf_paginas: {
    nome: 'Páginas PDF',
    icone: 'picture_as_pdf',
    cor: '#f59e0b',
    descricao: 'Analise documentos PDF com IA'
  },
  simulados: {
    nome: 'Simulados',
    icone: 'assignment',
    cor: '#ec4899',
    descricao: 'Faça simulados completos para praticar'
  },
  flashcards: {
    nome: 'Flashcards',
    icone: 'style',
    cor: '#14b8a6',
    descricao: 'Crie flashcards para revisar conteúdos'
  },
  baralhos: {
    nome: 'Baralhos',
    icone: 'folder',
    cor: '#8b5cf6',
    descricao: 'Organize seus flashcards em baralhos'
  },
  ciclos: {
    nome: 'Ciclos de Estudo',
    icone: 'refresh',
    cor: '#f97316',
    descricao: 'Crie ciclos de revisão espaçada'
  },
  planos_estudo: {
    nome: 'Planos de Estudo',
    icone: 'calendar_month',
    cor: '#0ea5e9',
    descricao: 'Organize seu cronograma de estudos'
  }
}

export function LimitBlockedModal({
  isOpen,
  onClose,
  recurso,
  usado,
  limite,
  tipo,
  isPro = false
}: LimitBlockedModalProps) {
  const info = RECURSO_INFO[recurso]
  const renovacao = tipo === 'diario' ? 'amanhã à meia-noite' : 'no primeiro dia do próximo mês'

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
      <div className="relative bg-white dark:bg-[#1c252e] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header com ícone */}
        <div
          className="p-6 text-center"
          style={{ backgroundColor: `${info.cor}15` }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
            style={{ backgroundColor: `${info.cor}25` }}
          >
            <span
              className="material-symbols-outlined text-3xl"
              style={{ color: info.cor }}
            >
              block
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Limite Atingido
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {info.nome}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Barra de progresso */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: info.cor }}
                >
                  {info.icone}
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {info.nome}
                </span>
              </div>
              <span className="text-sm font-bold text-red-500">
                {usado}/{limite}
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Renova {renovacao}
            </p>
          </div>

          {/* Mensagem */}
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
            {isPro
              ? `Você já usou todos os ${limite} ${info.nome.toLowerCase()} disponíveis ${tipo === 'diario' ? 'hoje' : 'este mês'}.`
              : `Você já usou todos os ${limite} ${info.nome.toLowerCase()} disponíveis no plano Free.`
            }
          </p>

          {/* Botões */}
          <div className="space-y-3">
            {!isPro && (
              <Link
                href="/dashboard/assinatura"
                className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
                Fazer Upgrade para PRO
              </Link>
            )}
            <button
              onClick={onClose}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              {isPro ? 'Entendi' : 'Continuar com Free'}
            </button>
          </div>

          {/* Dica PRO */}
          {!isPro && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-primary font-medium text-center">
                Com o Estuda PRO você tem até {tipo === 'diario' ? '10x' : '50x'} mais {info.nome.toLowerCase()}!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
