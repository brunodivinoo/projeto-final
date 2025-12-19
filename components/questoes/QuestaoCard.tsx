'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ComentariosTab } from './ComentariosTab'
import { EstatisticasTab } from './EstatisticasTab'

interface Questao {
  id: string
  id_original: string
  modalidade: string
  disciplina: string
  assunto: string | null
  subassunto: string | null
  banca: string | null
  ano: number | null
  dificuldade: string
  enunciado: string
  gabarito: string
  comentario: string | null
  alternativa_a: string | null
  alternativa_b: string | null
  alternativa_c: string | null
  alternativa_d: string | null
  alternativa_e: string | null
}

interface QuestaoCardProps {
  questao: Questao
  onResponder?: (questaoId: string, resposta: string, correta: boolean) => void
}

type TabType = 'gabarito' | 'comentarios' | 'estatisticas' | 'reportar'

export function QuestaoCard({ questao, onResponder }: QuestaoCardProps) {
  const { user } = useAuth()
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null)
  const [respondida, setRespondida] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<TabType | null>(null)

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

  const gabaritoConvertido = isCertoErrado
    ? (questao.gabarito === 'CERTO' ? 'C' : 'E')
    : questao.gabarito

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
    if (!respostaSelecionada) return
    const correta = respostaSelecionada === gabaritoConvertido
    setRespondida(true)

    if (user) {
      try {
        const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
        if (session?.access_token) {
          await fetch(`/api/questoes/${questao.id}/estatisticas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({ resposta: respostaSelecionada, correta })
          })
        }
      } catch (e) { console.error(e) }
    }

    onResponder?.(questao.id, respostaSelecionada, correta)
  }

  return (
    <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100 dark:border-[#283039]">
        <span className="text-primary font-bold text-sm">
          {questao.id_original?.slice(-6).toUpperCase() || questao.id.slice(-6).toUpperCase()}
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
        {questao.ano && (
          <>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{questao.ano}</span>
          </>
        )}
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDificuldadeColor(questao.dificuldade)}`}>
          {getDificuldadeNome(questao.dificuldade)}
        </span>
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
            const isCorrect = gabaritoConvertido === opcao.letra
            const showResult = respondida

            let bgClass = 'border-gray-200 dark:border-[#283039] hover:border-gray-300 dark:hover:border-gray-600'
            if (showResult) {
              if (isCorrect) bgClass = 'border-green-500 bg-green-50 dark:bg-green-900/20'
              else if (isSelected && !isCorrect) bgClass = 'border-red-500 bg-red-50 dark:bg-red-900/20'
            } else if (isSelected) {
              bgClass = 'border-primary bg-primary/5'
            }

            return (
              <label
                key={opcao.letra}
                onClick={() => !respondida && setRespostaSelecionada(opcao.letra)}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${bgClass}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-all ${
                  showResult && isCorrect ? 'bg-green-500 text-white'
                    : showResult && isSelected && !isCorrect ? 'bg-red-500 text-white'
                    : isSelected ? 'bg-primary text-white'
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

      {/* Botão Responder / Resultado - ACIMA das abas */}
      <div className="flex items-center justify-end px-4 lg:px-6 py-4 border-t border-gray-100 dark:border-[#283039] bg-gray-50 dark:bg-[#161f28]">
        {!respondida ? (
          <button
            onClick={responderQuestao}
            disabled={!respostaSelecionada}
            className={`px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-all ${
              respostaSelecionada ? 'bg-primary hover:bg-blue-600 text-white shadow-primary/20' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Responder
          </button>
        ) : (
          <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
            respostaSelecionada === gabaritoConvertido
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {respostaSelecionada === gabaritoConvertido ? 'Acertou!' : 'Errou!'}
          </span>
        )}
      </div>

      {/* Abas - ABAIXO do botão */}
      <div className="border-t border-gray-200 dark:border-[#283039]">
        <div className="flex overflow-x-auto">
          {[
            { id: 'gabarito', label: 'Gabarito Comentado', shortLabel: 'Gabarito', icon: 'lightbulb' },
            { id: 'comentarios', label: 'Comentários', shortLabel: 'Chat', icon: 'forum' },
            { id: 'estatisticas', label: 'Estatísticas', shortLabel: 'Stats', icon: 'bar_chart' },
            { id: 'reportar', label: 'Reportar', shortLabel: 'Report', icon: 'flag' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(abaAtiva === tab.id ? null : tab.id as TabType)}
              className={`flex-1 px-3 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                abaAtiva === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
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
                <div className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap leading-relaxed">
                  {questao.comentario}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-4xl text-blue-300 dark:text-blue-700 mb-2">info</span>
                <p className="text-blue-600 dark:text-blue-400">Não há comentário disponível</p>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'comentarios' && <ComentariosTab questaoId={questao.id} />}

        {abaAtiva === 'estatisticas' && (
          <EstatisticasTab questaoId={questao.id} modalidade={questao.modalidade} gabarito={questao.gabarito} />
        )}

        {abaAtiva === 'reportar' && (
          <div className="p-6 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">construction</span>
            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Em desenvolvimento</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Em breve você poderá reportar erros</p>
          </div>
        )}
      </div>
    </div>
  )
}
