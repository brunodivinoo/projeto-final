'use client'
import { useState } from 'react'
import { useSimuladoGeracao } from '@/contexts/SimuladoGeracaoContext'

export function GeracaoSimuladoProgress() {
  const {
    geracaoAtiva,
    isProcessando,
    isMinimizado,
    temGeracaoPendente,
    continuarGeracao,
    cancelarGeracao,
    minimizar,
    maximizar,
    progresso,
    tempoEstimado
  } = useSimuladoGeracao()

  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)

  // Modal para continuar geração pendente
  if (temGeracaoPendente && geracaoAtiva?.pausado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-in fade-in zoom-in duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Geração em Andamento
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Você tem um simulado sendo gerado:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
              <p className="font-medium text-gray-800 dark:text-white truncate">
                {geracaoAtiva.titulo}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {geracaoAtiva.geradas}/{geracaoAtiva.total} questões geradas ({progresso}%)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  cancelarGeracao()
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={() => {
                  continuarGeracao()
                }}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Não mostrar se não tem geração ativa ou está pausado
  if (!geracaoAtiva || geracaoAtiva.pausado) return null

  // Badge minimizado
  if (isMinimizado) {
    return (
      <button
        onClick={maximizar}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-105 flex items-center gap-2"
      >
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="font-medium">{geracaoAtiva.geradas}/{geracaoAtiva.total}</span>
      </button>
    )
  }

  // Toast completo
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          {isProcessando ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
          <span className="font-medium text-sm">Gerando Simulado</span>
        </div>
        <button
          onClick={minimizar}
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Título do simulado */}
        <p className="text-sm font-medium text-gray-800 dark:text-white truncate mb-2">
          {geracaoAtiva.titulo}
        </p>

        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600 dark:text-gray-400">
            {geracaoAtiva.geradas}/{geracaoAtiva.total} questões
          </span>
          <span className="text-gray-500 dark:text-gray-500">
            {tempoEstimado}
          </span>
        </div>

        {/* Item atual */}
        {geracaoAtiva.item_atual && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Gerando:</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
              {geracaoAtiva.item_atual.disciplina}
              {geracaoAtiva.item_atual.assunto && ` - ${geracaoAtiva.item_atual.assunto}`}
            </p>
          </div>
        )}

        {/* Erros */}
        {geracaoAtiva.erros > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
            {geracaoAtiva.erros} questão(ões) com erro - serão ignoradas
          </p>
        )}

        {/* Botão cancelar */}
        {confirmandoCancelar ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmandoCancelar(false)}
              className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={() => {
                cancelarGeracao()
                setConfirmandoCancelar(false)
              }}
              className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
            >
              Confirmar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmandoCancelar(true)}
            className="w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 text-sm rounded-lg transition-colors"
          >
            Cancelar Geração
          </button>
        )}
      </div>
    </div>
  )
}
