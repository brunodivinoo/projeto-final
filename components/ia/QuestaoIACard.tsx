'use client'

import { useState } from 'react'
import { QuestaoIA } from '@/hooks/useQuestoesIA'

interface QuestaoIACardProps {
  questao: QuestaoIA
  index: number
  onAnswer: (questaoId: string, resposta: string) => Promise<{ acertou: boolean; gabarito: string } | null>
  onDelete: (questaoId: string) => Promise<boolean>
}

type TabType = 'gabarito' | 'reportar'

export function QuestaoIACard({ questao, index, onAnswer, onDelete }: QuestaoIACardProps) {
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(
    questao.resposta_usuario || null
  )
  const [respondida, setRespondida] = useState(questao.respondida || false)
  const [acertou, setAcertou] = useState(questao.acertou || false)
  const [abaAtiva, setAbaAtiva] = useState<TabType | null>(null)
  const [respondendo, setRespondendo] = useState(false)
  const [deletando, setDeletando] = useState(false)

  const isCertoErrado = questao.modalidade === 'certo_errado'

  const opcoes = isCertoErrado
    ? [{ letra: 'C', texto: 'Certo' }, { letra: 'E', texto: 'Errado' }]
    : [
        questao.alternativa_a && { letra: 'A', texto: questao.alternativa_a },
        questao.alternativa_b && { letra: 'B', texto: questao.alternativa_b },
        questao.alternativa_c && { letra: 'C', texto: questao.alternativa_c },
        questao.alternativa_d && { letra: 'D', texto: questao.alternativa_d },
        questao.alternativa_e && { letra: 'E', texto: questao.alternativa_e }
      ].filter(Boolean) as { letra: string; texto: string }[]

  const getDificuldadeColor = (dif: string) => {
    const colors: Record<string, string> = {
      facil: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      media: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
      dificil: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    }
    return colors[dif] || 'bg-gray-100 text-gray-600'
  }

  const getDificuldadeNome = (dif: string) => {
    const nomes: Record<string, string> = { facil: 'Fácil', media: 'Médio', dificil: 'Difícil' }
    return nomes[dif] || dif
  }

  const responderQuestao = async () => {
    if (!respostaSelecionada || respondendo) return

    setRespondendo(true)
    const result = await onAnswer(questao.id, respostaSelecionada)
    setRespondendo(false)

    if (result) {
      setRespondida(true)
      setAcertou(result.acertou)
    }
  }

  const handleDeletar = async () => {
    if (!confirm('Tem certeza que deseja deletar esta questão?')) return

    setDeletando(true)
    await onDelete(questao.id)
    setDeletando(false)
  }

  return (
    <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100 dark:border-[#283039]">
        <span className="bg-[#137fec]/20 text-[#137fec] font-bold text-sm px-2 py-0.5 rounded">
          {index}
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{questao.disciplina}</span>
        {questao.assunto && (
          <>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{questao.assunto}</span>
          </>
        )}
        {questao.subassunto && (
          <>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{questao.subassunto}</span>
          </>
        )}
        <div className="flex-1"></div>
        {questao.banca && <span className="text-gray-500 dark:text-gray-400 text-sm">{questao.banca.toUpperCase()}</span>}
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#283039] text-gray-500 text-xs">
          {isCertoErrado ? 'Certo/Errado' : 'Múltipla Escolha'}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDificuldadeColor(questao.dificuldade)}`}>
          {getDificuldadeNome(questao.dificuldade)}
        </span>
        {/* Ícone de IA */}
        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">auto_awesome</span>
          IA
        </span>
        {/* Botão deletar */}
        <button
          onClick={handleDeletar}
          disabled={deletando}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          title="Deletar questão"
        >
          <span className="material-symbols-outlined text-lg">
            {deletando ? 'progress_activity' : 'delete'}
          </span>
        </button>
      </div>

      {/* Conteúdo */}
      <div className="p-4 lg:p-6">
        {isCertoErrado && (
          <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">
            JULGUE O ITEM A SEGUIR
          </p>
        )}
        <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-6 whitespace-pre-wrap">
          {questao.enunciado}
        </p>

        {/* Opções */}
        <div className="space-y-3">
          {opcoes.map((opcao) => {
            const isSelected = respostaSelecionada === opcao.letra
            const isCorrect = questao.gabarito === opcao.letra
            const showResult = respondida

            let bgClass = 'border-gray-200 dark:border-[#283039] hover:border-gray-300 dark:hover:border-gray-600'
            if (showResult) {
              if (isCorrect) bgClass = 'border-green-500 bg-green-50 dark:bg-green-900/20'
              else if (isSelected && !isCorrect) bgClass = 'border-red-500 bg-red-50 dark:bg-red-900/20'
            } else if (isSelected) {
              bgClass = 'border-[#137fec] bg-[#137fec]/5'
            }

            return (
              <label
                key={opcao.letra}
                onClick={() => !respondida && setRespostaSelecionada(opcao.letra)}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${bgClass} ${respondida ? 'cursor-default' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-all ${
                  showResult && isCorrect ? 'bg-green-500 text-white'
                    : showResult && isSelected && !isCorrect ? 'bg-red-500 text-white'
                    : isSelected ? 'bg-[#137fec] text-white'
                    : 'border-2 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {showResult && isCorrect ? <span className="material-symbols-outlined text-sm">check</span>
                    : showResult && isSelected && !isCorrect ? <span className="material-symbols-outlined text-sm">close</span>
                    : opcao.letra}
                </div>
                <span className={`text-sm pt-1 ${isSelected || (showResult && isCorrect) ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                  {opcao.texto}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Botão Responder / Resultado */}
      <div className="flex items-center justify-start gap-3 px-4 lg:px-6 py-4">
        {!respondida ? (
          <button
            onClick={responderQuestao}
            disabled={!respostaSelecionada || respondendo}
            className={`px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 ${
              respostaSelecionada && !respondendo
                ? 'bg-[#137fec] hover:bg-blue-600 text-white shadow-[#137fec]/20'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {respondendo ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Verificando...
              </>
            ) : (
              'Responder'
            )}
          </button>
        ) : (
          <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
            acertou
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {acertou ? 'Acertou!' : 'Errou!'}
          </span>
        )}
      </div>

      {/* Abas */}
      <div className="border-t border-gray-200 dark:border-[#283039]">
        <div className="flex overflow-x-auto">
          {[
            { id: 'gabarito', label: 'Gabarito Comentado', shortLabel: 'Gabarito', icon: 'lightbulb' },
            { id: 'reportar', label: 'Reportar Erro', shortLabel: 'Reportar', icon: 'flag' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(abaAtiva === tab.id ? null : tab.id as TabType)}
              className={`flex-1 px-3 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                abaAtiva === tab.id
                  ? 'text-[#137fec] border-b-2 border-[#137fec] bg-[#137fec]/5'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-base sm:text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo das abas */}
        {abaAtiva === 'gabarito' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
            {questao.comentario ? (
              <div>
                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">lightbulb</span>
                  Gabarito Comentado
                </h4>
                <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
                  <strong>Gabarito:</strong> {questao.gabarito}
                </p>
                <div className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap leading-relaxed">
                  {questao.comentario}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-4xl text-blue-300 dark:text-blue-700 mb-2">info</span>
                <p className="text-blue-600 dark:text-blue-400">Não há comentário disponível</p>
                <p className="text-sm text-blue-500 dark:text-blue-500 mt-1">Gabarito: {questao.gabarito}</p>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'reportar' && (
          <div className="p-6 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">construction</span>
            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Em desenvolvimento</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Em breve você poderá reportar erros nas questões geradas</p>
          </div>
        )}
      </div>
    </div>
  )
}
